// /src/cloud/journal.cjs
'use strict';
const S=require('./schema.cjs');
const {PROJECT_ID}=require('./config.cjs');
const {createJournalStorage}=require('./journalStorage.cjs');
const journalKey=scope=>`milvayo-cloud-v1:${[PROJECT_ID,scope.host,scope.uid,scope.orgId,scope.workspaceId,scope.localId].map(encodeURIComponent).join(':')}`;
function createJournal({storage,scope,send,receive,onChange=()=>{},now=Date.now,random=Math.random,newId}){
 const key=journalKey(scope),disk=createJournalStorage(storage,key,newId);let state,serial=Promise.resolve(),running=false,closed=false;
 const exclusive=fn=>{const p=serial.then(fn);serial=p.catch(()=>{});return p;};
 const save=async next=>{await disk.write(next);state=next;onChange(status());};
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
    const changes=q.request?[]:q.sent||q.changes.map(c=>{const current=state.records.find(r=>r.key===c.key);const merged=S.mergeChange(current,c);return {key:c.key,before:current&&!current.deleted?current:null,after:c.after?merged:null,baseRevision:current?.revision||0};});
    if(!q.request&&!q.sent)await exclusive(async()=>save({...state,queue:state.queue.map(x=>x.id===q.id?{...x,sent:changes}:x)}));
    const ack=await send(q.request?{...q.request,mutationId:q.id}:{action:'commit',mutationId:q.id,changes});
    await exclusive(async()=>{if(closed)return;const map=new Map(state.records.map(r=>[r.key,r]));for(const r of ack.records||[])map.set(r.key,r);await save({...state,records:[...map.values()],queue:state.queue.filter(x=>x.id!==q.id),error:''});});
   }catch(e){await exclusive(async()=>{if(closed)return;const permanent=['conflict','permission-denied','unauthenticated','invalid-argument','failed-precondition'].includes(e.code);const delay=Math.min(60000,1000*2**Math.min(q.attempts,6))*(.75+random()*.5);await save({...state,error:e.message,queue:state.queue.map(x=>x.id===q.id?{...x,attempts:x.attempts+1,status:permanent?'conflict':'pending',nextAttempt:now()+delay,error:e.message}:x)});});break;}
  }}finally{running=false;}
 }
 return {open,capture,enqueueMessage,drain,refresh,status,flush:()=>serial,export:()=>S.clone(state),close:()=>{closed=true;},key};
}
module.exports={journalKey,createJournal};
