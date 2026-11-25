// /src/cloud/server/patch.cjs
'use strict';
// Firebase v4.0 lean record patch. A routine edit of one task or one Canvas object writes exactly one document:
// no version, receipt, audit, workspace-sequence or summary write. Available only on workspaces whose protocol is 4.
const crypto=require('node:crypto');
const S=require('../schema.cjs'),IAM=require('../iam.cjs'),V=require('../taskMutation.cjs'),canvas=require('../../domain/canvas.cjs'),model=require('../../domain/model.cjs'),{LIMITS,createCascade,invalidate,newEdge,readEdges,shell}=require('./cascade.cjs');
// Mirrors of the canonical normalizers in operations.cjs (text trimming, valid calendar dates, whole-number limits); the equivalence tests compare them with canonical validation.
const txt=(v,n=240)=>typeof v==='string'?v.trim().slice(0,n):'';
const isDate=v=>typeof v==='string'&&/^\d{4}-\d\d-\d\d$/.test(v)&&!Number.isNaN(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
const whole=(v,max)=>Number.isFinite(v)&&v>=0&&v<=max?Math.round(v*100)/100:0;
// Appended records are refused above these counts (their canonical array limits are 10,000 tasks, 20,000 comments, 10,000 time entries) so a cloud project can never become unloadable.
const CAPS=Object.freeze({tasks:9000,comments:19000,timeEntries:9500,'canvas.objects':1000,'canvas.connectors':2000,canvases:1000,'canvas.threads':1000});
// An operation ID is bound to the actor and the exact edit, so a reused ID can never acknowledge different content.
const fingerprint=(uid,b)=>crypto.createHash('sha256').update(S.stable({...(b.recordKind?{recordKind:b.recordKind,recordId:b.recordId}:{}),uid,action:b.action,projectId:b.projectId,boardId:b.boardId||'',id:b.taskId||b.objectId,set:b.set,dependsOn:b.dependsOn,objectIds:b.objectIds,bases:b.bases,data:b.data,order:b.order,commentId:b.commentId,entryId:b.entryId})).digest('hex').slice(0,32);
const ALLOWED=new Set([...V.PATCHABLE].filter(k=>k!=='updatedAt'));
// Canvas objects: geometry and layer only. Text, grouping, links and drawings keep the full legacy validation (board size and group rules span records).
const CANVAS_ALLOWED=new Set(['x','y','width','height','zIndex','text','color','locked','groupId','sourceLink']);
const CONNECTOR_ALLOWED=new Set(['label','style','arrow','color']);
// EXPERIMENT (default off): MILVAYO_PATCH_AUTH_MODE=snapshot reads membership, grant, workspace and seat documents outside the transaction so that
// shared documents are not locked by every edit. Authorization may then be a few milliseconds stale relative to a concurrent revoke; the default keeps every read transactional.
const authMode=()=>process.env.MILVAYO_PATCH_AUTH_MODE==='snapshot'?'snapshot':'transaction';
function patchHandlers({db,access,fail,stamp=Date.now}){
 // Stage timing for the concurrency investigation: wall time of the whole transaction, the duration of each attempt (more than one means a retry) and the authorization phase.
 const ms=t=>+(performance.now()-t).toFixed(1);
 const timedTx=(timings,fn)=>{const t0=performance.now();timings.attemptMs=[];return db.runTransaction(async tx=>{const s=performance.now();try{return await fn(tx);}finally{timings.attemptMs.push(ms(s));}}).then(r=>{timings.transactionMs=ms(t0);if(r&&r.measured)r.measured.timings=timings;if(r&&timings.bench&&process.env.MILVAYO_BENCH==='1')r.txTimings=timings;return r;});};
 const reject=(code,current)=>({ok:false,code,current});
 async function run(uid,b,spec){
  S.segment(b.projectId);S.segment(b.opId);
  if(!Number.isSafeInteger(b.baseRevision)||b.baseRevision<1)fail('Invalid base revision','invalid-argument');
  if(spec.move){if(!Number.isFinite(b.order)||b.order<0||b.order>100000)fail('Invalid position','invalid-argument');b={...b,set:{}};}
  else{
  if(!b.set||typeof b.set!=='object'||Array.isArray(b.set)||!Object.keys(b.set).length||Object.keys(b.set).length>20)fail('A patch needs 1–20 fields','invalid-argument');
  for(const k of Object.keys(b.set))if(!spec.allowed.has(k))fail(k==='updatedAt'?'updatedAt is set by the server':`Field is not patchable: ${k}`,'invalid-argument');}
  const key=spec.key(b),timings={bench:b.bench===true};let attempts=0;
  return timedTx(timings,async tx=>{
   attempts++;const reads={authorization:3,subscription:0,record:0,configuration:0,dependencies:0},reader=authMode()==='snapshot'?{get:r=>r.get()}:tx,accessStart=performance.now();
   const a=await access(reader,uid,b.orgId,b.workspaceId);timings.accessMs=ms(accessStart);
   if(a.member?.active!==true||a.meta?.state!=='active')fail('Workspace access is unavailable');
   if(!IAM.can(a.member,a.grant,b.projectId,spec.permission||'edit'))fail('Action is outside the scoped grant');
   if(a.meta.protocol!==4)fail('This workspace does not accept field patches','failed-precondition');
   if(a.meta.writeFreeze===true)fail('Writes are temporarily paused for this workspace','failed-precondition');
   const ref=a.ws.collection('records').doc(key),[sub,snap]=await Promise.all([reader.get(a.org.collection('subscription').doc('current')),tx.get(ref)]);reads.subscription=1;reads.record=1;
   if(!sub.data()?.seats?.includes(uid))fail('A licensed seat is required for project editing');
   if(!snap.exists)fail('Record is unavailable','failed-precondition');
   const old=snap.data();if(!spec.owns(old,b))fail('Record is unavailable','failed-precondition');
   const measured=()=>IAM.administer(a.member)?{documentReads:Object.values(reads).reduce((x,y)=>x+y,0),documentWrites:0,documentDeletes:0,readBreakdown:reads,validationClass:'patch',transactionAttempts:attempts}:undefined;
   if(old.deleted)return {...reject('deleted',old),measured:measured()};
   // Retry safety without receipts: the last accepted operation is remembered on the record itself.
   const hash=fingerprint(uid,b);
   if(old.lastOpId===b.opId){if(old.lastOpHash!==hash)fail('Operation ID was reused with different content','already-exists');return {ok:true,duplicate:true,revision:old.revision,record:old,measured:measured()};}
   const applied=spec.move?old.order===b.order:Object.entries(b.set).every(([k,v])=>S.equal(old.data[k],v));
   if(old.revision!==b.baseRevision)return applied?{ok:true,alreadyApplied:true,revision:old.revision,record:old,measured:measured()}:{...reject('conflict',old),measured:measured()};
   const now=stamp(),moved=spec.move?{order:b.order}:{},data={...old.data,...b.set,...(spec.stampData?{updatedAt:new Date(now).toISOString()}:{})},next={...old,data};
   await spec.validate({tx,a,b,old,next,reads});
   const record={...old,data,...moved,revision:old.revision+1,updatedAt:now,updatedBy:uid,lastOpId:b.opId,lastOpHash:hash};
   tx.update(ref,{data,...moved,revision:record.revision,updatedAt:now,updatedBy:uid,lastOpId:b.opId,lastOpHash:hash});
   const m=measured();if(m)m.documentWrites=1;
   return {ok:true,revision:record.revision,record,measured:m?{...m,authMode:authMode()}:undefined};
  });
 }
 const taskSpec={allowed:ALLOWED,stampData:true,key:b=>S.keyOf('tasks',b.projectId,S.segment(b.taskId)),owns:(old,b)=>old.kind==='tasks'&&old.projectId===b.projectId&&old.id===b.taskId,
  async validate({tx,a,b,old,next,reads}){
   const data=next.data;let project;
   if(V.needsConfiguration(old,next)){const p=await tx.get(a.ws.collection('records').doc(S.keyOf('projects',b.projectId,b.projectId)));reads.configuration=1;project=p.data();}
   V.validatePatch(old,next,project);
   if(old.data.status!==data.status&&data.status==='Done'&&data.dependsOn.length){
    const deps=await Promise.all(data.dependsOn.map(id=>tx.get(a.ws.collection('records').doc(S.keyOf('tasks',b.projectId,id)))));reads.dependencies=deps.length;
    const status=new Map(deps.filter(d=>d.exists&&!d.data().deleted).map(d=>[d.data().id,d.data().data.status]));V.validateDone(old,next,id=>status.get(id));
   }
  }};
 // The frame an object joins: live, same board, really a frame, itself ungrouped.
 const frameOf=async(tx,a,obj,frameId,reads,fail)=>{
  if(frameId===obj.id)fail('An object cannot be its own frame','invalid-argument');
  const snap=await tx.get(a.ws.collection('records').doc(S.keyOf('canvas.objects',obj.projectId,S.segment(frameId),obj.boardId)));reads.record++;const f=snap.exists?snap.data():null;
  if(!f||f.deleted||f.kind!=='canvas.objects'||f.data.type!=='frame')fail('The group frame is unavailable','failed-precondition');
  if(f.data.groupId)fail('Nested groups need the full editor','failed-precondition');
  if(f.data.locked)fail('Unlock the object before editing','failed-precondition');
  return f;
 };
 const canvasSpec={allowed:CANVAS_ALLOWED,stampData:false,key:b=>S.keyOf('canvas.objects',b.projectId,S.segment(b.objectId),S.segment(b.boardId)),owns:(old,b)=>old.kind==='canvas.objects'&&old.projectId===b.projectId&&old.id===b.objectId&&old.boardId===b.boardId,
  // Same rule as the canonical board: a locked object can only be unlocked (or locked again) until the lock is lifted.
  async validate({tx,a,old,next,reads}){const changed=[...new Set([...Object.keys(old.data),...Object.keys(next.data)])].filter(k=>!S.equal(old.data[k],next.data[k]));if(old.data.locked===true&&changed.some(k=>k!=='locked'))fail('Unlock the object before editing','failed-precondition');
   let clean;try{clean=canvas.normalizeObject(next.data,old.boardId,old.projectId);}catch{throw Error('Canvas change violates the canonical object schema');}
   if(!S.equal(clean,next.data))throw Error('Canvas change violates the canonical object schema');
   // 0.8.43: joining a group. The frame must be a live frame of the same board that is not itself inside a group (nesting is unavailable, as in the app), the object must be free and not a frame, and a locked frame cannot take members.
   if(changed.includes('groupId')&&next.data.groupId){
    if(old.data.groupId)fail('Ungroup first; moving between groups needs the full editor','failed-precondition');
    if(next.data.type==='frame')fail('Grouping a frame needs the full editor','failed-precondition');
    await frameOf(tx,a,old,next.data.groupId,reads,fail);
   }}};
 // A connector edit (label, line style, arrow, colour). Validated through a two-object board so the canonical connector rules apply.
 const connectorKey=b=>S.keyOf('canvas.connectors',b.projectId,S.segment(b.connectorId),S.segment(b.boardId));
 const connectorSpec={allowed:CONNECTOR_ALLOWED,stampData:false,key:connectorKey,owns:(old,b)=>old.kind==='canvas.connectors'&&old.projectId===b.projectId&&old.id===b.connectorId&&old.boardId===b.boardId,
  async validate({old,next}){const end=id=>canvas.normalizeObject(canvas.createObject({id,boardId:old.boardId,x:0,y:0,now:'2026-01-01T00:00:00.000Z',zIndex:0}),old.boardId,old.projectId);
   let clean;try{clean=canvas.normalizeBoard({...canvas.createBoard({id:old.boardId,projectId:old.projectId,title:'x',now:'2026-01-01T00:00:00.000Z'}),objects:[end(next.data.from),end(next.data.to)],connectors:[next.data],threads:[]},old.projectId).connectors[0];}catch{throw Error('Canvas change violates the canonical connector schema');}
   // The canonical connector has no `color` key when the colour is empty: clearing it removes the key.
   if(next.data.color==='')delete next.data.color,delete clean.color;
   if(!S.equal(clean,next.data))throw Error('Canvas change violates the canonical connector schema');}};
 // 0.8.41: rename or archive a Canvas board (owner approved 2026-11-23). Only the title and the archive time; the board's counter, update time and viewport stay local bookkeeping and the objects are untouched.
 const BOARD_ALLOWED=new Set(['title','archivedAt']);
 const boardSpec={allowed:BOARD_ALLOWED,stampData:false,key:b=>S.keyOf('canvases',b.projectId,S.segment(b.boardId)),owns:(old,b)=>old.kind==='canvases'&&old.projectId===b.projectId&&old.id===b.boardId,
  async validate({old,next}){let clean;try{clean=canvas.normalizeBoard({...next.data,objects:[],connectors:[],threads:[]},old.projectId);}catch{throw Error('Canvas change violates the canonical board schema');}
   if(typeof next.data.title!=='string'||!next.data.title.trim()||clean.title!==next.data.title||!S.equal(clean.archivedAt??null,next.data.archivedAt??null))throw Error('Canvas change violates the canonical board schema');}};
 const moveSpec={...taskSpec,move:true,stampData:false,validate:async()=>{}};
 const patch=(uid,b)=>run(uid,b,taskSpec),moveTask=(uid,b)=>run(uid,b,moveSpec),patchCanvas=(uid,b)=>run(uid,b,canvasSpec),patchCanvasBoard=(uid,b)=>run(uid,b,boardSpec),patchCanvasConnector=(uid,b)=>run(uid,b,connectorSpec);
 // Shared guards for cascading edits: authorization, protocol, freeze, seat, idempotency and the revision check.
 async function preflight(tx,uid,b,permission,key,timings={bench:b.bench===true}){
  const reads={authorization:3,subscription:0,record:0,configuration:0,dependencies:0,queries:0,releases:0,links:0},reader=authMode()==='snapshot'?{get:r=>r.get()}:tx;
  const accessStart=performance.now(),a=await access(reader,uid,b.orgId,b.workspaceId);timings.accessMs=ms(accessStart);
  if(a.member?.active!==true||a.meta?.state!=='active')fail('Workspace access is unavailable');
  if(!IAM.can(a.member,a.grant,b.projectId,permission))fail('Action is outside the scoped grant');
  if(a.meta.protocol!==4)fail('This workspace does not accept field patches','failed-precondition');
  if(a.meta.writeFreeze===true)fail('Writes are temporarily paused for this workspace','failed-precondition');
  const ref=a.ws.collection('records').doc(key),[sub,snap]=await Promise.all([reader.get(a.org.collection('subscription').doc('current')),tx.get(ref)]);reads.subscription=1;reads.record=1;
  if(!sub.data()?.seats?.includes(uid))fail('A licensed seat is required for project editing');
  const total=()=>Object.values(reads).reduce((x,y)=>x+y,0),admin=IAM.administer(a.member);
  return {a,reads,ref,snap,admin,total,reader};
 }
 const cascadeBase=b=>{S.segment(b.projectId);S.segment(b.taskId);S.segment(b.opId);if(!Number.isSafeInteger(b.baseRevision)||b.baseRevision<1)fail('Invalid base revision','invalid-argument');};
 const iso=now=>new Date(now).toISOString();
 const taskOwns=(old,b)=>old.kind==='tasks'&&old.projectId===b.projectId&&old.id===b.taskId;
 // Applies every record update in one transaction. Reads are finished before the first write; each record gains one revision.
 function commitAll(tx,ctx,uid,now,main,others){
  const all=[main,...others];if(all.length>LIMITS.changedRecords)fail('This change touches too many records for a field patch; use the full editor','failed-precondition');
  const col=ctx.a.ws.collection('records'),records=[];
  for(const {record,update} of all){const next={...record,...update,revision:record.revision+1,updatedAt:now,updatedBy:uid};if(record.revision===0)tx.set(col.doc(record.key),next);else tx.update(col.doc(record.key),{...update,revision:next.revision,updatedAt:now,updatedBy:uid});records.push(next);}
  return records;
 }
 // Edge records: tombstone a live edge, or create (or revive) a default edge. Both are exactly one write.
 const tombstoneEdge=(e,now)=>e.record&&!e.record.deleted?{record:e.record,update:{deleted:true,deletedAt:now}}:null;
 const addEdge=(e,projectId)=>e.record&&!e.record.deleted?null:{record:e.record||newEdge(projectId,e.pred,e.succ),update:{deleted:false,deletedAt:null,data:{predecessorId:e.pred,successorId:e.succ,type:'FS',lagDays:0}}};
 async function deleteTask(uid,b){
  cascadeBase(b);const key=S.keyOf('tasks',b.projectId,b.taskId),timings={bench:b.bench===true};let attempts=0;
  return timedTx(timings,async tx=>{
   attempts++;const ctx=await preflight(tx,uid,b,'delete',key,timings),{a,reads,snap}=ctx;
   const measured=(writes=0)=>ctx.admin?{documentReads:ctx.total(),documentWrites:writes,documentDeletes:0,readBreakdown:{...reads},validationClass:'delete',transactionAttempts:attempts}:undefined;
   if(!snap.exists)fail('Record is unavailable','failed-precondition');const old=snap.data();if(!taskOwns(old,b))fail('Record is unavailable','failed-precondition');
   if(old.deleted)return {ok:true,alreadyApplied:true,revision:old.revision,deleted:true,changed:[],measured:measured()};
   const hash=fingerprint(uid,b);
   if(old.lastOpId===b.opId){if(old.lastOpHash!==hash)fail('Operation ID was reused with different content','already-exists');return {ok:true,duplicate:true,revision:old.revision,deleted:true,changed:[],measured:measured()};}
   if(old.revision!==b.baseRevision)return {ok:false,code:'conflict',current:old,measured:measured()};
   const now=stamp(),id=b.taskId,c=createCascade({tx,a,projectId:b.projectId,fail,reads}),col=a.ws.collection('records');
   const [dependents,children,linked]=await Promise.all([c.dependents(id),c.children(id),c.linked(id)]);
   const originals=new Map([...dependents,...children].map(r=>[r.id,r])),edited=new Map();
   for(const r of originals.values())if(r.id!==id)edited.set(r.id,{...r,data:{...r.data,parentId:r.data.parentId===id?'':r.data.parentId,dependsOn:r.data.dependsOn.filter(d=>d!==id),verified:false,merged:false,updatedAt:iso(now)}});
   const {changed,releases}=await invalidate(c,edited,old.data.releaseId?[old.data.releaseId]:[],now,new Set([id]));
   const edges=await readEdges(c,tx,col,reads,b.projectId,[...old.data.dependsOn.map(p=>[p,id]),...dependents.map(d=>[id,d.id])]);
   const others=[];
   for(const r of edited.values())others.push({record:originals.get(r.id),update:{data:r.data}});
   for(const r of changed.values())others.push({record:r,update:{data:r.data}});
   for(const r of releases)others.push({record:r,update:{data:r.data}});
   for(const r of linked)others.push({record:r,update:{deleted:true,deletedAt:now}});
   for(const e of edges){const t=tombstoneEdge(e,now);if(t)others.push(t);}
   const records=commitAll(tx,ctx,uid,now,{record:old,update:{deleted:true,deletedAt:now,lastOpId:b.opId,lastOpHash:hash}},others);
   return {ok:true,revision:records[0].revision,deleted:true,changed:records,measured:measured(records.length)};
  });
 }
 // 0.8.40: bring a DELETED task back (owner approved 2026-11-23). Needs the same permission level as restoring (manager). The task returns on its own: its own fields come back
 // (from the snapshot the device sends, otherwise from the cloud's kept copy), but nothing that points at OTHER records is brought back: no parent, no dependencies, and no board list,
 // sprint, phase or release. Other tasks that were changed when it was deleted stay as they are. The deleted copy's revision is checked, so a task restored by someone else is not overwritten.
 async function restoreTask(uid,b){
  cascadeBase(b);const key=S.keyOf('tasks',b.projectId,b.taskId),timings={bench:b.bench===true};let attempts=0;
  if(b.data!==undefined&&(!b.data||typeof b.data!=='object'||Array.isArray(b.data)||b.data.id!==b.taskId))fail('The snapshot must be the task with this ID','invalid-argument');
  return timedTx(timings,async tx=>{
   attempts++;const ctx=await preflight(tx,uid,b,'restore',key,timings),{a,reads,snap}=ctx;
   const measured=(writes=0)=>ctx.admin?{documentReads:ctx.total(),documentWrites:writes,documentDeletes:0,readBreakdown:{...reads},validationClass:'restore',transactionAttempts:attempts}:undefined;
   if(!snap.exists)fail('Record is unavailable','failed-precondition');const old=snap.data();if(!taskOwns(old,b))fail('Record is unavailable','failed-precondition');
   const hash=fingerprint(uid,b);
   if(old.lastOpId===b.opId){if(old.lastOpHash!==hash)fail('Operation ID was reused with different content','already-exists');return {ok:true,duplicate:true,revision:old.revision,record:old,changed:[],measured:measured()};}
   if(!old.deleted)return {ok:true,alreadyApplied:true,revision:old.revision,record:old,changed:[],measured:measured()};
   if(old.revision!==b.baseRevision)return {ok:false,code:'conflict',current:old,measured:measured()};
   const now=stamp(),col=a.ws.collection('records'),source=b.data||old.data;
   const data={...S.clone(source),parentId:'',dependsOn:[],verified:false,merged:false,boardId:'board-default',listId:'',sprintId:'',phaseId:'',releaseId:'',updatedAt:iso(now)};
   if(!S.equal(model.defaultTask(data),data))fail('Cloud change violates the canonical task schema','invalid-argument');
   const project=(await tx.get(col.doc(S.keyOf('projects',b.projectId,b.projectId)))).data();reads.configuration=1;if(!project||project.deleted)fail('Task configuration is unavailable','failed-precondition');
   model.taskSchema.validateTask(project.data,data);
   const records=commitAll(tx,ctx,uid,now,{record:old,update:{deleted:false,deletedAt:null,data,lastOpId:b.opId,lastOpHash:hash}},[]);
   return {ok:true,revision:records[0].revision,record:records[0],changed:records,restored:true,measured:measured(records.length)};
  });
 }
 async function patchDependencies(uid,b){
  cascadeBase(b);if(!Array.isArray(b.dependsOn)||b.dependsOn.length>200)fail('dependsOn must be a list of at most 200 task IDs','invalid-argument');
  const list=[...new Set(b.dependsOn.map(id=>S.segment(id)))],key=S.keyOf('tasks',b.projectId,b.taskId),timings={bench:b.bench===true};let attempts=0;
  return timedTx(timings,async tx=>{
   attempts++;const ctx=await preflight(tx,uid,b,'edit',key,timings),{a,reads,snap}=ctx;
   const measured=(writes=0)=>ctx.admin?{documentReads:ctx.total(),documentWrites:writes,documentDeletes:0,readBreakdown:{...reads},validationClass:'dependencies',transactionAttempts:attempts}:undefined;
   if(!snap.exists)fail('Record is unavailable','failed-precondition');const old=snap.data();if(!taskOwns(old,b))fail('Record is unavailable','failed-precondition');
   if(old.deleted)return {ok:false,code:'deleted',current:old,measured:measured()};
   const hash=fingerprint(uid,b);
   if(old.lastOpId===b.opId){if(old.lastOpHash!==hash)fail('Operation ID was reused with different content','already-exists');return {ok:true,duplicate:true,revision:old.revision,record:old,changed:[],measured:measured()};}
   const same=old.data.dependsOn.length===list.length&&old.data.dependsOn.every(d=>list.includes(d));
   if(old.revision!==b.baseRevision)return same?{ok:true,alreadyApplied:true,revision:old.revision,record:old,changed:[],measured:measured()}:{ok:false,code:'conflict',current:old,measured:measured()};
   if(same)return {ok:true,alreadyApplied:true,revision:old.revision,record:old,changed:[],measured:measured()};
   const now=stamp(),id=b.taskId,added=list.filter(d=>!old.data.dependsOn.includes(d)),removed=old.data.dependsOn.filter(d=>!list.includes(d)),c=createCascade({tx,a,projectId:b.projectId,fail,reads}),col=a.ws.collection('records');
   if(list.includes(id))fail('Task cannot depend on itself','invalid-argument');
   for(const pred of added)if(!(await c.get('tasks',pred)))fail('Missing dependency '+pred,'invalid-argument');
   await c.assertNoCycle(id,added);
   const data={...old.data,dependsOn:list,verified:false,merged:false,updatedAt:iso(now)};if(!S.equal(model.defaultTask(data),data))fail('Cloud change violates the canonical task schema','invalid-argument');
   const {changed,releases}=await invalidate(c,new Map([[id,{...old,data}]]),[],now);
   const edges=await readEdges(c,tx,col,reads,b.projectId,[...removed.map(p=>[p,id]),...added.map(p=>[p,id])]),others=[];
   for(const r of changed.values())others.push({record:r,update:{data:r.data}});for(const r of releases)others.push({record:r,update:{data:r.data}});
   for(const e of edges){const op=removed.includes(e.pred)?tombstoneEdge(e,now):addEdge(e,b.projectId);if(op)others.push(op);}
   const records=commitAll(tx,ctx,uid,now,{record:old,update:{data,lastOpId:b.opId,lastOpHash:hash}},others);
   return {ok:true,revision:records[0].revision,record:records[0],changed:records,measured:measured(records.length)};
  });
 }
 // Create handlers: exactly one new document (plus one per dependency link for a task). The record count is checked with an aggregation query (1 read per 1,000 rows).
 const createBase=b=>{S.segment(b.projectId);S.segment(b.opId);};
 // Governance kinds count deleted markers too, so their ceiling is four times the real limit (the real limit is checked on live rows inside the create).
 const capOf=kind=>CAPS[kind]||(PROJECT_KINDS[kind]&&PROJECT_KINDS[kind].cap*4);
 async function createRecord(uid,b,spec){
  createBase(b);const {id,boardId='',order=0}=spec.identify(b),key=S.keyOf(spec.kind,b.projectId,id,boardId),timings={bench:b.bench===true};let attempts=0;
  return timedTx(timings,async tx=>{
   attempts++;const ctx=await preflight(tx,uid,b,spec.permission,key,timings),{a,reads,snap}=ctx,col=a.ws.collection('records');reads.aggregation=0;
   const measured=(writes=0)=>ctx.admin?{documentReads:ctx.total(),documentWrites:writes,documentDeletes:0,readBreakdown:{...reads},validationClass:'create-'+spec.kind,transactionAttempts:attempts}:undefined;
   const hash=fingerprint(uid,{...b,id});
   if(snap.exists){const old=snap.data();if(old.lastOpId===b.opId&&old.lastOpHash===hash)return {ok:true,duplicate:true,revision:old.revision,record:old,changed:[],measured:measured()};fail('Record already exists','already-exists');}
   const now=stamp(),c=createCascade({tx,a,projectId:b.projectId,fail,reads});
   let kindQuery=col.where('projectId','==',b.projectId).where('kind','==',spec.kind);if(spec.boardScoped)kindQuery=kindQuery.where('boardId','==',b.boardId);let rows;
   try{rows=(await kindQuery.count().get()).data().count;reads.aggregation=Math.max(1,Math.ceil(rows/1000));}
   catch{// Aggregation queries are missing from some emulator builds: fall back to a bounded key-only query (billed per row, but only reached where aggregation is unavailable).
    const snap=await kindQuery.select().limit(capOf(spec.kind)+1).get();rows=snap.size;reads.aggregation=Math.max(1,snap.size);reads.aggregationFallback=1;}
   if(rows>=capOf(spec.kind))fail(spec.boardScoped?'This Canvas is too large for a field patch; use the full editor':'This project is too large for a field patch; use the full editor','failed-precondition');
   const out=await spec.prepare({tx,a,b,c,col,reads,now,uid,id,fail,rows});
   const records=commitAll(tx,ctx,uid,now,{record:shell(spec.kind,b.projectId,id,order,boardId),update:{deleted:false,data:out.data,lastOpId:b.opId,lastOpHash:hash}},out.others||[]);
   return {ok:true,revision:1,record:records[0],changed:records,measured:measured(records.length)};
  });
 }
 const fallbackIfSet=(data,fields,fail)=>{for(const f of fields)if(data[f]!==''&&data[f]!==undefined&&!(f==='boardId'&&data[f]==='board-default')&&!(Array.isArray(data[f])&&!data[f].length))fail(`A new task with ${f} set needs the full editor`,'failed-precondition');};
 const taskCreate={kind:'tasks',permission:'create',identify:b=>({id:S.segment(b.taskId),order:Number.isSafeInteger(b.order)&&b.order>=0&&b.order<=100000?b.order:100000}),
  async prepare({tx,a,b,c,col,reads,now,fail,id}){
   if(!b.data||typeof b.data!=='object'||Array.isArray(b.data)||b.data.id!==id)fail('The task must carry its own ID','invalid-argument');
   const data={...b.data,updatedAt:iso(now)};
   if(!S.equal(model.defaultTask(data),data))fail('Cloud change violates the canonical task schema','invalid-argument');
   if(data.verified||data.merged)fail('A new task cannot be verified or merged','invalid-argument');
   fallbackIfSet(data,['boardId','listId','sprintId','phaseId','releaseId'],fail);
   const project=(await tx.get(col.doc(S.keyOf('projects',b.projectId,b.projectId)))).data();reads.configuration=1;if(!project||project.deleted)fail('Task configuration is unavailable','failed-precondition');
   model.taskSchema.validateTask(project.data,data);
   if(data.parentId){let key=data.parentId,depth=0;while(key){if(++depth>40)fail('Task hierarchy exceeds 40 levels','invalid-argument');const p=await c.get('tasks',key);if(!p)fail('Missing parent: '+key,'invalid-argument');key=p.data.parentId;}}
   const preds=[...new Set(data.dependsOn)],statuses=new Map();
   if(preds.length!==data.dependsOn.length)fail('Duplicate dependency','invalid-argument');
   for(const pred of preds){const t=await c.get('tasks',pred);if(!t)fail('Missing dependency '+pred,'invalid-argument');statuses.set(pred,t.data.status);}
   V.validateDone({data:{status:'Backlog'}},{data},id=>statuses.get(id));
   const edges=await readEdges(c,tx,col,reads,b.projectId,preds.map(p=>[p,id])),others=[];
   for(const e of edges){const op=addEdge(e,b.projectId);if(op)others.push(op);}
   return {data,others};
  }};
 const commentCreate={kind:'comments',permission:'comment',identify:b=>({id:S.segment(b.commentId)}),
  async prepare({a,b,c,now,fail,id}){
   const d=b.data;if(!d||typeof d!=='object'||Array.isArray(d)||d.id!==id||d.taskId!==b.taskId)fail('The comment must carry its own ID and task','invalid-argument');
   const data={...d,at:iso(now)},clean={id:txt(data.id,120),taskId:txt(data.taskId,120),author:txt(data.author,120)||'Local operator',body:txt(data.body,4000),at:data.at};
   if(!S.equal(clean,data)||!clean.id||!clean.taskId||!clean.body)fail('Cloud change violates the canonical comment schema','invalid-argument');
   if(!(await c.get('tasks',b.taskId)))fail('Comment task is unavailable','failed-precondition');
   return {data};
  }};
 const timeCreate={kind:'timeEntries',permission:'create',identify:b=>({id:S.segment(b.entryId)}),
  async prepare({b,c,fail,id}){
   const d=b.data;if(!d||typeof d!=='object'||Array.isArray(d)||d.id!==id||d.taskId!==b.taskId)fail('The time entry must carry its own ID and task','invalid-argument');
   const clean={id:txt(d.id,120),taskId:txt(d.taskId,120),owner:txt(d.owner,120),date:d.date,hours:whole(d.hours,24),rateAtEntry:Number.isFinite(d.rateAtEntry)&&d.rateAtEntry>=0&&d.rateAtEntry<=100000?d.rateAtEntry:null,note:txt(d.note,1000)};
   if(!isDate(d.date)||clean.hours<=0||!S.equal(clean,d))fail('Cloud change violates the canonical time entry schema','invalid-argument');
   if(!(await c.get('tasks',b.taskId)))fail('Time entry task is unavailable','failed-precondition');
   return {data:d};
  }};
 const createTask=(uid,b)=>createRecord(uid,b,taskCreate),addComment=(uid,b)=>createRecord(uid,b,commentCreate),logTime=(uid,b)=>createRecord(uid,b,timeCreate);
 // Canvas creates: one new object or connector (one write). The board must exist and be live; the object count per board is capped like the canonical board (1,000 objects, 2,000 connectors).
 // Objects that need the full editor (linked sources, group membership) are refused; a connector's two ends must be live objects of the same board.
 const boardOf=async(tx,col,b,reads,fail)=>{const snap=await tx.get(col.doc(S.keyOf('canvases',b.projectId,S.segment(b.boardId))));reads.board=1;const rec=snap.exists?snap.data():null;if(!rec||rec.deleted||rec.kind!=='canvases'||rec.projectId!==b.projectId)fail('Canvas is unavailable','failed-precondition');return rec;};
 const canvasObjectCreate={kind:'canvas.objects',permission:'edit',boardScoped:true,identify:b=>({id:S.segment(b.objectId),boardId:S.segment(b.boardId),order:Number.isSafeInteger(b.order)&&b.order>=0&&b.order<=100000?b.order:100000}),
  async prepare({tx,a,b,col,reads,fail,id}){
   const d=b.data;if(!d||typeof d!=='object'||Array.isArray(d)||d.id!==id||d.boardId!==b.boardId)fail('The Canvas object must carry its own ID and board','invalid-argument');
   await boardOf(tx,col,b,reads,fail);
   // 0.8.43: a linked object (live link or snapshot of a source in this project) and an object created inside a frame are allowed; both pass the canonical object schema below.
   if(d.groupId){if(d.type==='frame')fail('A nested frame needs the full editor','failed-precondition');await frameOf(tx,{ws:a.ws},{id:d.id,projectId:b.projectId,boardId:b.boardId},d.groupId,reads,fail);}
   let clean;try{clean=canvas.normalizeObject(d,b.boardId,b.projectId);}catch{fail('Canvas change violates the canonical object schema','invalid-argument');}
   if(!S.equal(clean,d))fail('Canvas change violates the canonical object schema','invalid-argument');
   return {data:d};
  }};
 const canvasConnectorCreate={kind:'canvas.connectors',permission:'edit',boardScoped:true,identify:b=>({id:S.segment(b.connectorId),boardId:S.segment(b.boardId),order:Number.isSafeInteger(b.order)&&b.order>=0&&b.order<=100000?b.order:100000}),
  async prepare({tx,b,col,reads,fail,id}){
   const d=b.data;if(!d||typeof d!=='object'||Array.isArray(d)||d.id!==id)fail('The connector must carry its own ID','invalid-argument');
   const board=await boardOf(tx,col,b,reads,fail),ends=[];
   for(const end of [d.from,d.to]){const snap=await tx.get(col.doc(S.keyOf('canvas.objects',b.projectId,S.segment(end),b.boardId)));reads.endpoints=(reads.endpoints||0)+1;const r=snap.exists?snap.data():null;if(!r||r.deleted)fail('A connector end is unavailable','failed-precondition');ends.push({...r.data,groupId:''});}
   let clean;try{clean=canvas.normalizeBoard({...board.data,objects:ends.filter((o,i)=>i===0||o.id!==ends[0].id),connectors:[d],threads:[]},b.projectId).connectors[0];}catch{fail('Canvas change violates the canonical connector schema','invalid-argument');}
   if(!S.equal(clean,d))fail('Canvas change violates the canonical connector schema','invalid-argument');
   return {data:d};
  }};
 const createCanvasObject=(uid,b)=>createRecord(uid,b,canvasObjectCreate),createCanvasConnector=(uid,b)=>createRecord(uid,b,canvasConnectorCreate);

 // 0.8.42: create a Canvas board (owner approved 2026-11-23). One new board record, empty. The live boards of a project are capped at 50 like the canonical project (deleted boards stay as markers and do not count).
 const BOARD_CHILDREN=['objects','connectors','threads'];
 const canvasBoardCreate={kind:'canvases',permission:'edit',identify:b=>({id:S.segment(b.boardId),boardId:'',order:Number.isSafeInteger(b.order)&&b.order>=0&&b.order<=100000?b.order:100000}),
  async prepare({tx,b,col,reads,fail,id}){
   const d=b.data;if(!d||typeof d!=='object'||Array.isArray(d)||d.id!==id)fail('The Canvas board must carry its own ID','invalid-argument');
   let clean;try{clean=canvas.normalizeBoard({...d,objects:[],connectors:[],threads:[]},b.projectId);}catch{fail('Canvas change violates the canonical board schema','invalid-argument');}
   const meta={...clean};for(const f of BOARD_CHILDREN)delete meta[f];
   if(!S.equal(meta,d))fail('Canvas change violates the canonical board schema','invalid-argument');
   const project=await tx.get(col.doc(S.keyOf('projects',b.projectId,b.projectId)));reads.configuration=1;if(!project.exists||project.data().deleted)fail('Project is unavailable','failed-precondition');
   const boards=await tx.get(col.where('projectId','==',b.projectId).where('kind','==','canvases').limit(1001));reads.queries+=Math.max(1,boards.docs.length);
   if(boards.docs.filter(x=>!x.data().deleted).length>=50)fail('A project can hold at most 50 Canvas boards','failed-precondition');
   return {data:d};
  }};
 const createCanvasBoard=(uid,b)=>createRecord(uid,b,canvasBoardCreate);
 // 0.8.44: Canvas comment threads (owner approved 2026-11-23). A thread is anchored to a live object of the same board (or free-floating). Anyone who may comment can start a thread and reply or resolve it;
 // replies can only be ADDED (never edited or removed), and the author shown is the app's canonical one.
 const THREAD_ALLOWED=new Set(['messages','resolvedAt']);
 const threadShape=(thread,b,anchor)=>{
  const now=new Date(0).toISOString(),stub=thread.objectId?[anchor||canvas.createObject({id:thread.objectId,boardId:b.boardId,type:'note',text:'x',now})]:[];
  const board=canvas.createBoard({id:b.boardId,projectId:b.projectId,title:'x',now});
  return canvas.normalizeBoard({...board,objects:stub,threads:[thread]},b.projectId).threads[0];
 };
 const threadSpec={allowed:THREAD_ALLOWED,permission:'comment',stampData:false,key:b=>S.keyOf('canvas.threads',b.projectId,S.segment(b.threadId),S.segment(b.boardId)),owns:(old,b)=>old.kind==='canvas.threads'&&old.projectId===b.projectId&&old.id===b.threadId&&old.boardId===b.boardId,
  async validate({old,next}){
   const was=old.data.messages||[],now=next.data.messages;
   if(!Array.isArray(now)||now.length<was.length||now.length>was.length+10||was.some((m,i)=>!S.equal(m,now[i])))fail('A comment thread only accepts new replies','failed-precondition');
   let clean;try{clean=threadShape(next.data,{projectId:old.projectId,boardId:old.boardId});}catch{throw Error('Canvas change violates the canonical comment schema');}
   if(!S.equal(clean,next.data))throw Error('Canvas change violates the canonical comment schema');
  }};
 const canvasThreadCreate={kind:'canvas.threads',permission:'comment',boardScoped:true,identify:b=>({id:S.segment(b.threadId),boardId:S.segment(b.boardId),order:Number.isSafeInteger(b.order)&&b.order>=0&&b.order<=100000?b.order:100000}),
  async prepare({tx,b,col,reads,fail,id}){
   const d=b.data;if(!d||typeof d!=='object'||Array.isArray(d)||d.id!==id)fail('The comment thread must carry its own ID','invalid-argument');
   await boardOf(tx,col,b,reads,fail);
   let anchor;
   if(d.objectId){const snap=await tx.get(col.doc(S.keyOf('canvas.objects',b.projectId,S.segment(d.objectId),b.boardId)));reads.endpoints=(reads.endpoints||0)+1;const r=snap.exists?snap.data():null;if(!r||r.deleted)fail('The commented object is unavailable','failed-precondition');anchor={...r.data,groupId:''};}
   if(!Array.isArray(d.messages)||d.messages.length<1)fail('A comment thread needs a first comment','invalid-argument');
   let clean;try{clean=threadShape(d,b,anchor);}catch{fail('Canvas change violates the canonical comment schema','invalid-argument');}
   if(!S.equal(clean,d))fail('Canvas change violates the canonical comment schema','invalid-argument');
   return {data:d};
  }};
 const createCanvasThread=(uid,b)=>createRecord(uid,b,canvasThreadCreate),patchCanvasThread=(uid,b)=>run(uid,b,threadSpec);

 // 0.8.45: governance records (risks, work breakdown, budget lines, documents), one generic table-driven set of actions: createProjectRecord, patchProjectRecord, deleteProjectRecord.
 // Each kind is checked with the app's own cleaner (governanceCore) so the cloud can never hold something the app would reshape. Later project lists (phases, releases...) are added to this table.
 const gov=require('../../domain/governanceCore.cjs');
 const WBS_ROOT='w0',DOC_KEY=/^[a-zA-Z]{1,40}$/;
 const wbsNorm=d=>{const probe=d.id===WBS_ROOT?d:{...d,parent:d.parent===null?null:WBS_ROOT},n=gov.normalizeGovernance({wbs:[probe]}).wbs.find(x=>x.id===d.id);return n?{...n,parent:d.parent===null?null:(typeof d.parent==='string'?d.parent:n.parent)}:null;};
 const PROJECT_KINDS=Object.freeze({
  'governance.risks':{cap:500,fields:['title','category','type','prob','impact','strategy','response','owner','status'],norm:d=>gov.normalizeGovernance({risks:[d]}).risks[0],hasId:true},
  'governance.budget.lines':{cap:500,fields:['category','planned','committed','actual'],norm:d=>gov.normalizeGovernance({budget:{lines:[d]}}).budget.lines[0],hasId:true},
  'governance.wbs':{cap:500,fields:['parent','name','owner','hours','note'],norm:wbsNorm,hasId:true,structure:true},
  'governance.docs':{cap:30,fields:['status','values'],norm:(d,id)=>gov.normalizeGovernance({docs:{[id]:d}}).docs[id],hasId:false,approval:true}
 });
 const kindOf=b=>{const k=PROJECT_KINDS[b.recordKind];if(!k||!Object.hasOwn(PROJECT_KINDS,b.recordKind))fail('Unknown record kind','invalid-argument');return k;};
 const recordIdOf=(b,k)=>{const id=S.segment(b.recordId);if(!k.hasId&&!DOC_KEY.test(id))fail('Invalid document key','invalid-argument');return id;};
 const canonical=(k,d,id)=>{let clean;try{clean=k.norm(d,id);}catch{clean=null;}if(!clean||!S.equal(clean,d)||(k.hasId&&d.id!==id))return false;return true;};
 // A document may only be approved (or changed once approved) by someone with approve rights, as in the plan agreed with the owner (2026-11-25).
 const approvalGate=(a,projectId,oldData,nextData,fail)=>{if((oldData&&oldData.status==='Approved'||nextData.status==='Approved')&&!IAM.can(a.member,a.grant,projectId,'approve'))fail('Approving a document, or changing an approved one, needs manager level','failed-precondition');};
 // The parent of a work element must exist and may not be the element itself or one of its descendants; the chain is limited to 30 levels so a subtree can never push the outline past 40.
 const wbsParentCheck=async({tx,a,projectId,id,parent,reads})=>{
  if(parent===null)return;if(id===WBS_ROOT)fail('The project root cannot have a parent','failed-precondition');
  const col=a.ws.collection('records');let cur=parent,steps=0;
  while(cur!==null){
   if(cur===id)fail('A work element cannot sit under itself or its own sub-elements','failed-precondition');
   if(++steps>30)fail('The work breakdown is too deep for a field patch; use the full editor','failed-precondition');
   const snap=await tx.get(col.doc(S.keyOf('governance.wbs',projectId,S.segment(cur))));reads.record++;const r=snap.exists?snap.data():null;
   if(!r||r.deleted)fail('The parent work element is unavailable','failed-precondition');
   if(cur===WBS_ROOT)return;cur=r.data.parent;
  }
 };
 const projectRecordCreate=b=>{const k=kindOf(b);return {kind:b.recordKind,permission:'create',identify:b=>({id:recordIdOf(b,k),order:Number.isSafeInteger(b.order)&&b.order>=0&&b.order<=100000?b.order:100000}),
  async prepare({tx,a,b,col,reads,fail,id,rows}){
   const d=b.data;if(!d||typeof d!=='object'||Array.isArray(d))fail('The record must carry its data','invalid-argument');
   if(!canonical(k,d,id))fail('Change violates the canonical governance schema','invalid-argument');
   if(id===WBS_ROOT)fail('The project root already exists','already-exists');
   if(rows>=k.cap){const live=await tx.get(col.where('projectId','==',b.projectId).where('kind','==',b.recordKind).limit(k.cap*4));reads.queries+=Math.max(1,live.docs.length);if(live.docs.filter(x=>!x.data().deleted).length>=k.cap)fail('This project holds the most of this kind that a field patch allows; use the full editor','failed-precondition');}
   if(k.approval)approvalGate(a,b.projectId,null,d,fail);
   if(k.structure)await wbsParentCheck({tx,a,projectId:b.projectId,id,parent:d.parent,reads});
   return {data:d};
  }};};
 const projectRecordSpec=b=>{const k=kindOf(b),allowed=new Set(k.fields);return {allowed,permission:'edit',stampData:false,key:b=>S.keyOf(b.recordKind,b.projectId,recordIdOf(b,k)),owns:(old,b)=>old.kind===b.recordKind&&old.projectId===b.projectId&&old.id===b.recordId,
  async validate({tx,a,b,old,next,reads}){
   if(k.structure&&old.id===WBS_ROOT&&next.data.parent!==null)fail('The project root cannot have a parent','failed-precondition');
   if(!canonical(k,next.data,old.id))fail('Change violates the canonical governance schema','invalid-argument');
   if(k.approval)approvalGate(a,b.projectId,old.data,next.data,fail);
   if(k.structure&&!S.equal(old.data.parent,next.data.parent))await wbsParentCheck({tx,a,projectId:b.projectId,id:old.id,parent:next.data.parent,reads});
  }};};
 const createProjectRecord=(uid,b)=>createRecord(uid,b,projectRecordCreate(b)),patchProjectRecord=(uid,b)=>run(uid,b,projectRecordSpec(b));
 async function deleteProjectRecord(uid,b){
  const k=kindOf(b);S.segment(b.projectId);S.segment(b.opId);const id=recordIdOf(b,k);
  if(!Number.isSafeInteger(b.baseRevision)||b.baseRevision<1)fail('Invalid base revision','invalid-argument');
  const key=S.keyOf(b.recordKind,b.projectId,id),timings={bench:b.bench===true};let attempts=0;
  return timedTx(timings,async tx=>{
   attempts++;const ctx=await preflight(tx,uid,b,'delete',key,timings),{a,reads}=ctx,col=a.ws.collection('records');
   const measured=(writes=0)=>ctx.admin?{documentReads:ctx.total(),documentWrites:writes,documentDeletes:0,readBreakdown:{...reads},validationClass:'project-record-delete',transactionAttempts:attempts}:undefined;
   if(!ctx.snap.exists)fail('Record is unavailable','failed-precondition');
   const old=ctx.snap.data();if(old.kind!==b.recordKind||old.projectId!==b.projectId||old.id!==id)fail('Record is unavailable','failed-precondition');
   if(old.deleted)return {ok:true,alreadyApplied:true,changed:[],measured:measured()};
   const hash=fingerprint(uid,b);
   if(old.lastOpId===b.opId){if(old.lastOpHash!==hash)fail('Operation ID was reused with different content','already-exists');return {ok:true,duplicate:true,changed:[],measured:measured()};}
   if(old.revision!==b.baseRevision)return {ok:false,code:'conflict',current:old,measured:measured()};
   if(k.structure){
    if(id===WBS_ROOT)fail('The project root cannot be deleted','failed-precondition');
    const kids=await tx.get(col.where('projectId','==',b.projectId).where('kind','==','governance.wbs').where('data.parent','==',id).limit(50));reads.queries+=Math.max(1,kids.docs.length);
    if(kids.docs.some(x=>!x.data().deleted))fail('Remove the nested work elements first','failed-precondition');
   }
   const now=stamp(),records=commitAll(tx,ctx,uid,now,{record:old,update:{deleted:true,deletedAt:now,lastOpId:b.opId,lastOpHash:hash}},[]);
   return {ok:true,deleted:[id],changed:records,measured:measured(records.length)};
  });
 }
 // Removes up to 50 Canvas objects with the same cascade as canvas.changeBoard({type:'remove'}): attached connectors and anchored comment threads
 // are removed, children of a removed frame lose their group. Related rows are found with indexed `in` queries (30 IDs each), never by scanning the board.
 async function deleteCanvasObjects(uid,b){
  S.segment(b.projectId);S.segment(b.boardId);S.segment(b.opId);
  if(!Array.isArray(b.objectIds)||!b.objectIds.length||b.objectIds.length>50)fail('Choose between 1 and 50 Canvas objects','invalid-argument');
  const ids=[...new Set(b.objectIds.map(id=>S.segment(id)))];
  if(!b.bases||typeof b.bases!=='object'||ids.some(id=>!Number.isSafeInteger(b.bases[id])||b.bases[id]<1))fail('Every Canvas object needs its base revision','invalid-argument');
  const objectKey=id=>S.keyOf('canvas.objects',b.projectId,id,b.boardId),timings={bench:b.bench===true};let attempts=0;
  return timedTx(timings,async tx=>{
   attempts++;const ctx=await preflight(tx,uid,b,'delete',objectKey(ids[0]),timings),{a,reads}=ctx,col=a.ws.collection('records');
   const measured=(writes=0)=>ctx.admin?{documentReads:ctx.total(),documentWrites:writes,documentDeletes:0,readBreakdown:{...reads},validationClass:'canvas-delete',transactionAttempts:attempts}:undefined;
   const found=await Promise.all(ids.map(async(id,i)=>i===0?ctx.snap:(reads.record++,tx.get(col.doc(objectKey(id)))))),objects=found.map(f=>f.exists?f.data():null);
   if(objects.some(o=>!o||o.kind!=='canvas.objects'||o.projectId!==b.projectId||o.boardId!==b.boardId))fail('Canvas object is unavailable','failed-precondition');
   if(objects.every(o=>o.deleted))return {ok:true,alreadyApplied:true,changed:[],measured:measured()};
   const hash=fingerprint(uid,b);
   if(objects[0].lastOpId===b.opId){if(objects[0].lastOpHash!==hash)fail('Operation ID was reused with different content','already-exists');return {ok:true,duplicate:true,changed:[],measured:measured()};}
   if(objects.some((o,i)=>o.deleted||o.revision!==b.bases[ids[i]]))return {ok:false,code:'conflict',current:objects,measured:measured()};
   if(objects.some(o=>o.data.locked))fail('Unlock the object before editing','failed-precondition');
   const now=stamp(),chosen=new Set(ids),related=new Map(),chunks=[];for(let i=0;i<ids.length;i+=30)chunks.push(ids.slice(i,i+30));
   const query=async(field,chunk)=>{const snap=await tx.get(col.where('projectId','==',b.projectId).where(field,'in',chunk).limit(LIMITS.queryRows+1));reads.queries+=Math.max(1,snap.docs.length);if(snap.docs.length>LIMITS.queryRows)fail('The Canvas selection is connected to too many items for a field patch; use the full editor','failed-precondition');return snap.docs.map(d=>d.data());};
   for(const chunk of chunks)for(const field of ['data.groupId','data.from','data.to','data.objectId'])for(const r of await query(field,chunk))if(!r.deleted&&r.boardId===b.boardId&&['canvas.objects','canvas.connectors','canvas.threads'].includes(r.kind)&&!chosen.has(r.id))related.set(r.key,r);
   const others=[];
   for(const r of related.values()){
    if(r.kind==='canvas.objects'&&chosen.has(r.data.groupId))others.push({record:r,update:{data:{...r.data,groupId:''}}});
    else if(r.kind==='canvas.connectors'&&(chosen.has(r.data.from)||chosen.has(r.data.to)))others.push({record:r,update:{deleted:true,deletedAt:now}});
    else if(r.kind==='canvas.threads'&&chosen.has(r.data.objectId))others.push({record:r,update:{deleted:true,deletedAt:now}});
   }
   for(const o of objects.slice(1))others.push({record:o,update:{deleted:true,deletedAt:now}});
   const records=commitAll(tx,ctx,uid,now,{record:objects[0],update:{deleted:true,deletedAt:now,lastOpId:b.opId,lastOpHash:hash}},others);
   return {ok:true,deleted:ids,changed:records,measured:measured(records.length)};
  });
 }
 // Removes one Canvas connector (a tombstone, one write). Nothing hangs off a connector, so there is no cascade.
 async function deleteCanvasConnector(uid,b){
  S.segment(b.projectId);S.segment(b.boardId);S.segment(b.connectorId);S.segment(b.opId);
  if(!Number.isSafeInteger(b.baseRevision)||b.baseRevision<1)fail('Invalid base revision','invalid-argument');
  const timings={bench:b.bench===true};let attempts=0;
  return timedTx(timings,async tx=>{
   attempts++;const ctx=await preflight(tx,uid,b,'delete',connectorKey(b),timings),{a,reads}=ctx;
   const measured=(writes=0)=>ctx.admin?{documentReads:ctx.total(),documentWrites:writes,documentDeletes:0,readBreakdown:{...reads},validationClass:'canvas-connector-delete',transactionAttempts:attempts}:undefined;
   if(!ctx.snap.exists)fail('Canvas connector is unavailable','failed-precondition');
   const old=ctx.snap.data();if(old.kind!=='canvas.connectors'||old.projectId!==b.projectId||old.boardId!==b.boardId||old.id!==b.connectorId)fail('Canvas connector is unavailable','failed-precondition');
   if(old.deleted)return {ok:true,alreadyApplied:true,changed:[],measured:measured()};
   const hash=fingerprint(uid,b);
   if(old.lastOpId===b.opId){if(old.lastOpHash!==hash)fail('Operation ID was reused with different content','already-exists');return {ok:true,duplicate:true,changed:[],measured:measured()};}
   if(old.revision!==b.baseRevision)return {ok:false,code:'conflict',current:old,measured:measured()};
   const now=stamp(),records=commitAll(tx,ctx,uid,now,{record:old,update:{deleted:true,deletedAt:now,lastOpId:b.opId,lastOpHash:hash}},[]);
   return {ok:true,deleted:[b.connectorId],changed:records,measured:measured(records.length)};
  });
 }
 // 0.8.42: delete a Canvas board that was archived first (as the app requires). The board and every live object, connector and comment thread of it become deleted markers in one transaction.
 // A board with more than 99 live items is refused (the 100-record limit of a field patch): delete items first and the rest follows. Nothing is half-deleted.
 async function deleteCanvasBoard(uid,b){
  S.segment(b.projectId);S.segment(b.boardId);S.segment(b.opId);
  if(!Number.isSafeInteger(b.baseRevision)||b.baseRevision<1)fail('Invalid base revision','invalid-argument');
  const key=S.keyOf('canvases',b.projectId,b.boardId),timings={bench:b.bench===true};let attempts=0;
  return timedTx(timings,async tx=>{
   attempts++;const ctx=await preflight(tx,uid,b,'delete',key,timings),{a,reads}=ctx,col=a.ws.collection('records');
   const measured=(writes=0)=>ctx.admin?{documentReads:ctx.total(),documentWrites:writes,documentDeletes:0,readBreakdown:{...reads},validationClass:'canvas-board-delete',transactionAttempts:attempts}:undefined;
   if(!ctx.snap.exists)fail('Canvas is unavailable','failed-precondition');
   const old=ctx.snap.data();if(old.kind!=='canvases'||old.projectId!==b.projectId||old.id!==b.boardId)fail('Canvas is unavailable','failed-precondition');
   if(old.deleted)return {ok:true,alreadyApplied:true,changed:[],measured:measured()};
   const hash=fingerprint(uid,b);
   if(old.lastOpId===b.opId){if(old.lastOpHash!==hash)fail('Operation ID was reused with different content','already-exists');return {ok:true,duplicate:true,changed:[],measured:measured()};}
   if(old.revision!==b.baseRevision)return {ok:false,code:'conflict',current:old,measured:measured()};
   if(!old.data.archivedAt)fail('Archive the Canvas before deleting it','failed-precondition');
   const rows=await tx.get(col.where('projectId','==',b.projectId).where('boardId','==',b.boardId).limit(501));reads.queries+=Math.max(1,rows.docs.length);
   if(rows.docs.length>500)fail('This Canvas has too much history for a field patch; delete its items first or use the full editor','failed-precondition');
   const live=rows.docs.map(d=>d.data()).filter(r=>!r.deleted&&['canvas.objects','canvas.connectors','canvas.threads'].includes(r.kind));
   if(live.length>LIMITS.changedRecords-1)fail('This Canvas has more than 99 items; delete some of them first, then delete the Canvas','failed-precondition');
   const now=stamp(),others=live.map(record=>({record,update:{deleted:true,deletedAt:now}}));
   const records=commitAll(tx,ctx,uid,now,{record:old,update:{deleted:true,deletedAt:now,lastOpId:b.opId,lastOpHash:hash}},others);
   return {ok:true,deleted:[b.boardId],changed:records,measured:measured(records.length)};
  });
 }
 // Read-only latency probe for the concurrency investigation (administrators only, no writes): separates plain reads and read-only
 // transactions, the floor for any patch, from the cost of our own logic.
 async function latencyProbe(uid,b){
  let ref;await db.runTransaction(async tx=>{const a=await access(tx,uid,b.orgId,b.workspaceId);if(!IAM.administer(a.member)||!a.meta)fail('Organization administrator required');ref=a.ws;});
  const iterations=Math.min(Math.max(Number(b.iterations)||5,1),20);
  const sample=async fn=>{const out=[];for(let i=0;i<iterations;i++){const t=performance.now();await fn();out.push(performance.now()-t);}out.sort((x,y)=>x-y);return {medianMs:+out[Math.floor(out.length/2)].toFixed(1),maxMs:+out.at(-1).toFixed(1)};};
  const five=()=>[ref,ref.collection('grants').doc(uid),ref.collection('grants').doc('probe-1'),ref.collection('records').doc('probe-2'),ref.collection('records').doc('probe-3')];
  return {ok:true,iterations,plainRead:await sample(()=>ref.get()),readOnlyTransactionOneDoc:await sample(()=>db.runTransaction(tx=>tx.get(ref))),readOnlyTransactionFiveDocs:await sample(()=>db.runTransaction(tx=>Promise.all(five().map(r=>tx.get(r)))))};
 }
 // Administrator controls: the workspace protocol marker and the destructive-write freeze.
 async function workspaceControl(uid,b){
  return db.runTransaction(async tx=>{
   const a=await access(tx,uid,b.orgId,b.workspaceId);if(!IAM.administer(a.member)||!a.meta)fail('Organization administrator required');
   const change={};if(b.protocol!==undefined){if(![3,4].includes(b.protocol))fail('Protocol must be 3 or 4','invalid-argument');change.protocol=b.protocol;}
   if(b.writeFreeze!==undefined){if(typeof b.writeFreeze!=='boolean')fail('writeFreeze must be true or false','invalid-argument');change.writeFreeze=b.writeFreeze;}
   if(!Object.keys(change).length)fail('Nothing to change','invalid-argument');
   tx.update(a.ws,change);tx.create(a.org.collection('adminAudit').doc(),{actor:uid,action:'Changed workspace controls',workspaceId:b.workspaceId,...change,at:Date.now()});
   return {ok:true,...change};
  });
 }
 return {patch,moveTask,patchCanvas,patchCanvasBoard,deleteCanvasObjects,deleteTask,restoreTask,patchDependencies,createTask,addComment,logTime,createCanvasObject,createCanvasConnector,createCanvasBoard,deleteCanvasBoard,createCanvasThread,patchCanvasThread,createProjectRecord,patchProjectRecord,deleteProjectRecord,patchCanvasConnector,deleteCanvasConnector,workspaceControl,latencyProbe};
}
module.exports={patchHandlers,ALLOWED,CANVAS_ALLOWED,CONNECTOR_ALLOWED};
