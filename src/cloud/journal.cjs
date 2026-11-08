// /src/cloud/journal.cjs
'use strict';
const S=require('./schema.cjs');
const {PROJECT_ID}=require('./config.cjs');
const {createJournalStorage}=require('./journalStorage.cjs');
const journalKey=scope=>`milvayo-cloud-v1:${[PROJECT_ID,scope.host,scope.uid,scope.orgId,scope.workspaceId,scope.localId].map(encodeURIComponent).join(':')}`;
function createJournal({storage,scope,send,receive,onChange=()=>{},now=Date.now,random=Math.random,newId,prepareChanges=changes=>changes}){
 const key=journalKey(scope),disk=createJournalStorage(storage,key,newId);let state,serial=Promise.resolve(),running=false,closed=false;
 const exclusive=fn=>{const p=serial.then(fn);serial=p.catch(()=>{});return p;};
 const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
 const save=async next=>{next.queue.forEach(freeze);await disk.write(next);state=next;onChange(status());};
 const status=()=>state?{pending:state.queue.length,conflicts:state.queue.filter(q=>q.status==='conflict').length,error:state.error||'',cursor:state.cursor}: {pending:0,conflicts:0,error:'',cursor:0};
 function validate(value){if(value?.schema!==1||!Array.isArray(value.records)||!Array.isArray(value.local)||!Array.isArray(value.queue)||!Number.isSafeInteger(value.cursor))throw Error('Cloud journal is corrupt or incompatible; original local data was kept');return value;}
 async function open(records,localWorkspace,cursor,accessVersion=''){return exclusive(async()=>{const value=await disk.read();state=value?validate(value):{schema:1,records,local:S.pack(localWorkspace),queue:[],cursor,accessVersion,error:''};if(!value)await save(state);return status();});}
 function addCapture(workspace){
  const next=S.pack(workspace),changes=S.diff(state.local,next);if(!changes.length)return state;
  // One domain transaction remains one atomic mutation. Oversized imports stay local.
  if(changes.length>100||require('../store/importFiles.cjs').tooBig(S.stable(changes),700000))throw Error('Change is too large for one atomic cloud mutation; export and reconnect as a new cloud workspace');
  const operation={id:newId(),actor:scope.uid,orgId:scope.orgId,workspaceId:scope.workspaceId,createdAt:now(),attempts:0,nextAttempt:0,status:'pending',changes};
  return {...state,local:next,queue:[...state.queue,operation],error:''};
 }
 async function capture(workspace){return exclusive(async()=>{if(closed)return;const next=addCapture(workspace);if(next!==state)await save(next);});}
 async function consolidate(){return exclusive(async()=>{
  // Absolute dates may batch, but the combined scheduling change still uses full server validation.
  const compatible=c=>!!(c.before&&c.after)&&require('./taskMutation.cjs').eligible({...c,after:{...c.after,data:{...c.after.data,start:c.before.data.start,due:c.before.data.due}}});
  const independent=q=>!q.sent&&!q.request&&q.status==='pending'&&q.attempts===0&&q.changes.length===1&&q.changes.every(compatible);
  const queue=[];let changed=false;
  for(const q of state.queue){const previous=queue.at(-1);if(independent(q)&&previous&&independent(previous)&&previous.changes[0].key===q.changes[0].key&&S.equal(previous.changes[0].after,q.changes[0].before)){
    const changes=S.diff([previous.changes[0].before],[q.changes[0].after]);queue.pop();if(changes.length)queue.push({...previous,changes,consolidatedFrom:[...(previous.consolidatedFrom||[{id:previous.id,createdAt:previous.createdAt}]),{id:q.id,createdAt:q.createdAt}]});changed=true;
   }else queue.push(q);}
  if(changed)await save({...state,queue});return status();
 });}
 async function resolveConflict(id,changes,options={}){return exclusive(async()=>{
  const index=state.queue.findIndex(q=>q.id===id),original=state.queue[index];if(!original||original.status!=='conflict'||original.request)throw Error('Choose an unresolved record conflict');
  if(!Array.isArray(changes)||!changes.length||changes.length>100)throw Error('Conflict resolution must contain 1–100 changes');S.assertJson(changes);for(const c of changes){const r=c.after||c.before;if(!r||c.key!==r.key||!Number.isSafeInteger(c.baseRevision)||c.baseRevision<0)throw Error('Invalid conflict resolution');}
  const operation={id:newId(),actor:scope.uid,orgId:scope.orgId,workspaceId:scope.workspaceId,createdAt:now(),attempts:0,nextAttempt:0,status:'pending',changes:S.clone(changes),resolves:id};
  const queue=state.queue.map((q,i)=>i===index?operation:q),records=options.remoteRecords||state.records;let visible=new Map(records.map(r=>[r.key,r]));for(const q of queue)for(const c of q.changes){const merged=S.mergeChange(visible.get(c.key),c);if(merged)visible.set(c.key,merged);}
  const local=[...visible.values()].filter(r=>!r.deleted);S.validateRecords(local);const next={...state,records,local,queue,error:'',resolvedConflicts:[...(state.resolvedConflicts||[]),{...original,resolutionId:operation.id,resolvedAt:now()}]};
  if(Number.isSafeInteger(options.cursor))next.cursor=options.cursor;if(typeof options.accessVersion==='string')next.accessVersion=options.accessVersion;await save(next);return operation.id;
 });}
 async function enqueueMessage(request){return exclusive(async()=>{if(closed)throw Error('Cloud session is closed');if(request.action!=='message'||typeof request.body!=='string'||!request.body.trim()||request.body.length>4000)throw Error('Invalid queued message');S.assertJson(request);const id=newId();await save({...state,queue:[...state.queue,{id,actor:scope.uid,orgId:scope.orgId,workspaceId:scope.workspaceId,createdAt:now(),attempts:0,nextAttempt:0,status:'pending',request:S.clone(request),changes:[]}],error:''});return id;});}
 async function refresh(){
  const remote=await receive(state.cursor,state.accessVersion);return exclusive(async()=>{
   if(closed)return;
   const map=new Map((remote.reset?[]:state.records).map(r=>[r.key,r]));for(const r of remote.records){const old=map.get(r.key);if(!old||r.sequence>=old.sequence)map.set(r.key,r);}
   if(![...map.values()].some(r=>r.kind==='projects'&&!r.deleted))throw Object.assign(Error('No authorized projects remain'),{code:'permission-denied'});
   const queue=state.queue.map(q=>remote.reset&&(q.request?!require('./iam.cjs').can({active:true},remote.grant,q.request.projectId,'read'):q.changes.some(c=>!require('./iam.cjs').can({active:true},remote.grant,(c.after||c.before).projectId,'read')))?{...q,status:'conflict',error:'Project access was revoked'}:q);
   // Do not replace local in-flight changes. Conflicts block the queue with all payloads intact.
   let visible=new Map(map);for(const q of queue){if(q.error==='Project access was revoked')continue;for(const c of q.changes){const merged=S.mergeChange(visible.get(c.key),c);if(merged)visible.set(c.key,merged);}}
   const records=[...map.values()],local=[...visible.values()].filter(r=>!r.deleted);
   S.validateRecords(local);if(remote.reset||remote.records.length||remote.cursor!==state.cursor)await save({...state,records,local,queue,accessVersion:remote.accessVersion||'',cursor:remote.cursor,error:queue.some(q=>q.error==='Project access was revoked')?'Project access was revoked; pending changes are retained for recovery':''});return {records:local,grant:remote.grant,membershipRole:remote.membershipRole,measured:remote.measured,reset:remote.reset};
  });
 }
 async function drain(){
  if(running||closed)return;running=true;
  try{while(!closed){
   const q=await exclusive(async()=>state?.queue[0]);if(!q||q.status==='conflict'||q.nextAttempt>now())break;
   try{
    const changes=q.request?[]:q.sent||prepareChanges(q.changes.map(c=>{const current=state.records.find(r=>r.key===c.key);const merged=S.mergeChange(current,c);return {key:c.key,before:current&&!current.deleted?current:null,after:c.after?merged:null,baseRevision:current?.revision||0};}));
    if(!q.request&&!q.sent)await exclusive(async()=>save({...state,queue:state.queue.map(x=>x.id===q.id?{...x,sent:changes}:x)}));
    const ack=await send(q.request?{...q.request,mutationId:q.id}:{action:'commit',mutationId:q.id,changes});
    await exclusive(async()=>{if(closed)return;const map=new Map(state.records.map(r=>[r.key,r]));for(const r of ack.records||[]){const old=map.get(r.key);if(!old||r.sequence>=old.sequence)map.set(r.key,r);}
     // Only a complete committed next sequence proves no unseen changes lie before this acknowledgment.
     const contiguous=!q.request&&ack.committedSequence===ack.sequence&&Number.isSafeInteger(ack.sequence)&&ack.sequence===state.cursor+1&&Array.isArray(ack.records)&&ack.records.some(r=>r.sequence===ack.sequence);
     await save({...state,records:[...map.values()],cursor:contiguous?ack.sequence:state.cursor,queue:state.queue.filter(x=>x.id!==q.id),error:''});});
   }catch(e){await exclusive(async()=>{if(closed)return;const permanent=['conflict','permission-denied','unauthenticated','invalid-argument','failed-precondition'].includes(e.code);const delay=Math.min(60000,1000*2**Math.min(q.attempts,6))*(.75+random()*.5);await save({...state,error:e.message,queue:state.queue.map(x=>x.id===q.id?{...x,attempts:x.attempts+1,status:permanent?'conflict':'pending',nextAttempt:now()+delay,error:e.message}:x)});});break;}
  }}finally{running=false;}
 }
 return {open,capture,consolidate,resolveConflict,enqueueMessage,drain,refresh,status,flush:()=>serial,export:()=>S.clone(state),close:()=>{closed=true;},key};
}
module.exports={journalKey,createJournal};
