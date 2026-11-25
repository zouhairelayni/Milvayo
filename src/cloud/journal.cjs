// /src/cloud/journal.cjs
'use strict';
const S=require('./schema.cjs');
const {PROJECT_ID}=require('./config.cjs');
const {createJournalStorage}=require('./journalStorage.cjs');
const order=require('./queueOrder.cjs');
const journalKey=scope=>`milvayo-cloud-v1:${[PROJECT_ID,scope.host,scope.uid,scope.orgId,scope.workspaceId,scope.localId].map(encodeURIComponent).join(':')}`;
function createJournal({storage,scope,send,receive,onChange=()=>{},now=Date.now,random=Math.random,newId,prepareChanges=changes=>changes,alignOrders=next=>next}){
 const key=journalKey(scope),disk=createJournalStorage(storage,key,newId);let state,serial=Promise.resolve(),running=false,closed=false;
 const exclusive=fn=>{const p=serial.then(fn);serial=p.catch(()=>{});return p;};
 const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
 const save=async next=>{next.queue.forEach(freeze);await disk.write(next);state=next;onChange(status());};
 // pending = everything in the queue (kept for older callers); waiting = edits that can still be sent; conflicts = edits that need a decision (0.8.31).
 const status=()=>{if(!state)return {pending:0,waiting:0,local:0,conflicts:0,reviewError:'',error:'',cursor:0};const hold=state.queue.filter(q=>q.status==='conflict'),kept=order.classify(state.queue,now()).filter(x=>x==='local'||x==='localheld').length,first=hold[0];return {pending:state.queue.length,waiting:state.queue.length-hold.length-kept,local:kept,conflicts:hold.length,reviewError:first?String(first.error||''):'',error:state.error||'',cursor:state.cursor};};
 function validate(value){if(value?.schema!==1||!Array.isArray(value.records)||!Array.isArray(value.local)||!Array.isArray(value.queue)||!Number.isSafeInteger(value.cursor))throw Error('Cloud journal is corrupt or incompatible; original local data was kept');return value;}
 async function open(records,localWorkspace,cursor,accessVersion='',feed=null){return exclusive(async()=>{const value=await disk.read();state=value?validate(value):{schema:1,records,local:S.pack(localWorkspace),queue:[],cursor,accessVersion,...(feed?{feed}:{}),error:''};
  // 0.8.35: changes kept on this device as "not shared yet" get one new try per connection (a newer app version may be able to send them). Planning fails at once, so a retry costs no request.
  if(value&&state.queue.some(q=>q.status==='local'))state={...state,queue:state.queue.map(q=>q.status==='local'?{...q,status:'pending',attempts:0,nextAttempt:0,error:''}:q)};
  if(!value)await save(state);return status();});}
 function addCapture(workspace){
  const next=alignOrders(S.pack(workspace),state.local),changes=S.diff(state.local,next);if(!changes.length)return state;
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
// 0.8.36: show queued changes over the shared records. A queued edit that no longer fits (someone else changed the same field) is skipped for display only: it stays in the queue with all its data, waiting for the owner to resolve it, and must not stop other people's changes from arriving.
 function overlay(records,queue,{skipRevoked}){
  const visible=new Map((records instanceof Map?[...records.values()]:records).map(r=>[r.key,r]));
  for(const q of queue){if(skipRevoked&&q.error==='Project access was revoked')continue;
   const staged=new Map();let fits=true;
   for(const c of q.changes){let merged;try{merged=S.mergeChange(staged.has(c.key)?staged.get(c.key):visible.get(c.key),c);}catch(e){if(e&&e.code==='conflict'){fits=false;break;}throw e;}if(merged)staged.set(c.key,merged);}
   if(fits)for(const [k,v] of staged)visible.set(k,v);}
  return visible;}
 async function resolveConflict(id,changes,options={}){return exclusive(async()=>{
  const index=state.queue.findIndex(q=>q.id===id),original=state.queue[index];if(!original||original.status!=='conflict'||original.request)throw Error('Choose an unresolved record conflict');
  if(!Array.isArray(changes)||!changes.length||changes.length>100)throw Error('Conflict resolution must contain 1–100 changes');S.assertJson(changes);for(const c of changes){const r=c.after||c.before;if(!r||c.key!==r.key||!Number.isSafeInteger(c.baseRevision)||c.baseRevision<0)throw Error('Invalid conflict resolution');}
  const operation={id:newId(),actor:scope.uid,orgId:scope.orgId,workspaceId:scope.workspaceId,createdAt:now(),attempts:0,nextAttempt:0,status:'pending',changes:S.clone(changes),resolves:id};
  const queue=state.queue.map((q,i)=>i===index?operation:q),records=options.remoteRecords||state.records;const visible=overlay(records,queue,{skipRevoked:false});
  const local=[...visible.values()].filter(r=>!r.deleted);S.validateRecords(local);const next={...state,records,local,queue,error:'',resolvedConflicts:[...(state.resolvedConflicts||[]),{...original,resolutionId:operation.id,resolvedAt:now()}]};
  if(Number.isSafeInteger(options.cursor))next.cursor=options.cursor;if(typeof options.accessVersion==='string')next.accessVersion=options.accessVersion;await save(next);return operation.id;
 });}
 // 0.8.30: drop a conflicted edit on the owner's explicit choice (used when the record was deleted by someone else). The original edit is kept in resolvedConflicts for recovery.
 async function discardConflict(id,options={}){return exclusive(async()=>{
  const index=state.queue.findIndex(q=>q.id===id),original=state.queue[index];if(!original||original.status!=='conflict'||original.request)throw Error('Choose an unresolved record conflict');
  const queue=state.queue.filter((q,i)=>i!==index),records=options.remoteRecords||state.records;const visible=overlay(records,queue,{skipRevoked:false});
  const local=[...visible.values()].filter(r=>!r.deleted);S.validateRecords(local);const next={...state,records,local,queue,error:'',resolvedConflicts:[...(state.resolvedConflicts||[]),{...original,resolutionId:'discarded',resolvedAt:now(),discarded:true}]};
  if(Number.isSafeInteger(options.cursor))next.cursor=options.cursor;if(typeof options.accessVersion==='string')next.accessVersion=options.accessVersion;await save(next);return id;
 });}
 async function enqueueMessage(request){return exclusive(async()=>{if(closed)throw Error('Cloud session is closed');if(request.action!=='message'||typeof request.body!=='string'||!request.body.trim()||request.body.length>4000)throw Error('Invalid queued message');S.assertJson(request);const id=newId();await save({...state,queue:[...state.queue,{id,actor:scope.uid,orgId:scope.orgId,workspaceId:scope.workspaceId,createdAt:now(),attempts:0,nextAttempt:0,status:'pending',request:S.clone(request),changes:[]}],error:''});return id;});}
 async function refresh(){
  const remote=await receive(state.cursor,state.accessVersion,state.feed);return exclusive(async()=>{
   if(closed)return;
   const map=new Map((remote.reset?[]:state.records).map(r=>[r.key,r]));
   // v4: a project that left the directory takes its records with it.
   for(const id of remote.dropped||[])for(const [k,r] of map)if(r.projectId===id)map.delete(k);
   for(const r of remote.records){const old=map.get(r.key);if(!old||r.sequence>=old.sequence)map.set(r.key,r);}
   if(![...map.values()].some(r=>r.kind==='projects'&&!r.deleted))throw Object.assign(Error('No authorized projects remain'),{code:'permission-denied'});
   const queue=state.queue.map(q=>remote.reset&&(q.request?!require('./iam.cjs').can({active:true},remote.grant,q.request.projectId,'read'):q.changes.some(c=>!require('./iam.cjs').can({active:true},remote.grant,(c.after||c.before).projectId,'read')))?{...q,status:'conflict',error:'Project access was revoked'}:q);
   // Do not replace local in-flight changes. Conflicts block the queue with all payloads intact.
   const visible=overlay(map,queue,{skipRevoked:true});
   const records=[...map.values()],local=[...visible.values()].filter(r=>!r.deleted);
   S.validateRecords(local);if(remote.reset||remote.records.length||remote.dropped?.length||remote.cursor!==state.cursor)await save({...state,records,local,queue,accessVersion:remote.accessVersion||'',cursor:remote.cursor,...(remote.feed?{feed:remote.feed}:{}),error:queue.some(q=>q.error==='Project access was revoked')?'Project access was revoked; pending changes are retained for recovery':''});// v4 with nothing new: a later cursor is kept in memory only (a stale stored cursor is always safe, it just re-reads a few records).
   else if(remote.feed)state={...state,feed:remote.feed};
   return {records:local,grant:remote.grant,membershipRole:remote.membershipRole,measured:remote.measured,reset:remote.reset};
  });
 }
 async function drain(){
  if(running||closed)return;running=true;
  try{while(!closed){
   // 0.8.29: send the first edit that is ready. A stuck edit only holds back later edits that depend on it (queueOrder.cjs).
   const q=await exclusive(async()=>order.nextRunnable(state?.queue||[],now()));if(!q)break;
   try{
    const changes=q.request?[]:q.sent||prepareChanges(q.changes.map(c=>{const current=state.records.find(r=>r.key===c.key);const merged=S.mergeChange(current,c);return {key:c.key,before:current&&!current.deleted?current:null,after:c.after?merged:null,baseRevision:current?.revision||0};}));
    if(!q.request&&!q.sent)await exclusive(async()=>save({...state,queue:state.queue.map(x=>x.id===q.id?{...x,sent:changes}:x)}));
    const ack=await send(q.request?{...q.request,mutationId:q.id}:{action:'commit',mutationId:q.id,changes});
    await exclusive(async()=>{if(closed)return;const map=new Map(state.records.map(r=>[r.key,r]));for(const r of ack.records||[]){const old=map.get(r.key);if(!old||r.sequence>=old.sequence)map.set(r.key,r);}
     // Only a complete committed next sequence proves no unseen changes lie before this acknowledgment.
     const contiguous=!q.request&&ack.committedSequence===ack.sequence&&Number.isSafeInteger(ack.sequence)&&ack.sequence===state.cursor+1&&Array.isArray(ack.records)&&ack.records.some(r=>r.sequence===ack.sequence);
     await save({...state,records:[...map.values()],cursor:contiguous?ack.sequence:state.cursor,queue:state.queue.filter(x=>x.id!==q.id),error:''});});
   }catch(e){const split=await exclusive(async()=>{if(closed)return false;
    // 0.8.35 (D1): a change the cloud cannot take yet is never a conflict and never blocks. Planning failed before any request, so nothing was applied: an edit made of several changes is split so the supported ones still go out.
    if(e.local&&!q.request&&q.changes.length>1){const parts=q.changes.map(c=>{const {sent,...rest}=q;return {...rest,id:newId(),changes:[c],attempts:0,nextAttempt:0,status:'pending',error:'',splitFrom:q.id};});await save({...state,queue:state.queue.flatMap(x=>x.id===q.id?parts:[x])});return true;}
    const permanent=['conflict','permission-denied','unauthenticated','invalid-argument','failed-precondition'].includes(e.code);const delay=Math.min(60000,1000*2**Math.min(q.attempts,6))*(.75+random()*.5);await save({...state,error:e.local?'':e.message,queue:state.queue.map(x=>x.id===q.id?{...x,attempts:x.attempts+1,status:e.local?'local':permanent?'conflict':'pending',nextAttempt:e.local?0:now()+delay,error:e.message}:x)});return false;});if(split)continue;break;}
  }}finally{running=false;}
 }
 // Read-only summary for the Sync status panel. Cheap: it does not copy the journal.
 const touches=q=>q.request?[]:q.changes.slice(0,3).map(c=>{const r=c.after||c.before;return r.kind+':'+r.id;}).concat(q.changes.length>3?['+'+(q.changes.length-3)+' more']:[]);
 const queueSummary=()=>{const queue=state?state.queue:[],t=now(),row=q=>({id:q.id,status:q.status,error:q.error||'',attempts:q.attempts,nextAttemptIn:Math.max(0,(q.nextAttempt||0)-t),createdAt:q.createdAt,touches:touches(q)}),first=queue.findIndex(q=>q.status==='conflict');
  return {length:queue.length,local:order.classify(queue,t).filter(x=>x==='local'||x==='localheld').length,conflicts:queue.filter(q=>q.status==='conflict').length,held:order.classify(queue,t).filter(x=>x==='held').length,head:queue[0]?row(queue[0]):null,firstConflict:first>=0?{index:first,...row(queue[first])}:null};};
 // True when at least one queued edit may be sent right now (0.8.32): not in a conflict, not in a retry delay, not held back by an edit it depends on.
 const hasReady=()=>!!state&&order.nextRunnable(state.queue,now())!==null;
 return {open,capture,consolidate,resolveConflict,discardConflict,enqueueMessage,drain,refresh,status,queueSummary,hasReady,flush:()=>serial,export:()=>S.clone(state),close:()=>{closed=true;},key};
}
module.exports={journalKey,createJournal};
