// /src/cloud/session.cjs
'use strict';
const S=require('./schema.cjs');
const {createJournal,journalKey}=require('./journal.cjs');
const {leaseKey}=require('./lease.cjs');
const {createPollingPolicy}=require('./polling.cjs');
function createCloudSession({storage,getWorkspace,getLocalId,applyRemote,onChange=()=>{}}){
 let client=null,journal=null,scope=null,timer=null,busy=false,stopped=false,original=null,lastPresenceAuthorization=0,lastCaptureError=null,activeTick=null,lastDrain=0,nextPoll=0,syncInterval=45000,visible=true,signalLive=false,stopSignal=null;
 const polling=createPollingPolicy();
 // While the change signal is live, polling is only a safety net; queued local work still retries on the short delay.
 const SIGNAL_FALLBACK_MS=300000,SIGNAL_HIDDEN_FALLBACK_MS=600000,AUTHORIZE_MS=240000;
 const nextDelay=()=>signalLive?(journal?.status().pending>0?5000:(visible?SIGNAL_FALLBACK_MS:SIGNAL_HIDDEN_FALLBACK_MS)):polling.next({visible});
 async function authorize(){if(!client||!visible||Date.now()-lastPresenceAuthorization<=AUTHORIZE_MS)return;lastPresenceAuthorization=Date.now();try{await request({action:'presenceAuthorize'});}catch(e){lastPresenceAuthorization=0;throw e;}}
 function startSignal(activeClient,activeJournal){
  if(typeof activeClient.heads!=='function')return;
  let first=true,access=0;
  stopSignal=activeClient.heads({...scope},head=>{
   if(stopped||journal!==activeJournal)return;
   const moved=head.sequence>activeJournal.status().cursor||(!first&&head.access!==access);first=false;access=head.access;
   if(moved){nextPoll=0;void tick({flush:false});}
  },live=>{if(stopped||journal!==activeJournal)return;const changed=live!==signalLive;signalLive=!!live;if(changed){polling.reset();nextPoll=signalLive?Date.now()+nextDelay():0;}});
 }
 let state={connected:false,busy:false,pending:0,conflicts:0,error:'',measured:null};const listeners=new Set(),presenceStops=new Set();
 const emit=patch=>{state={...state,...patch};onChange(state);listeners.forEach(fn=>fn(state));};
 const request=body=>client.request({...scope,...body});
 async function tick(options={}){
  const flush=options.flush!==false;
  if(activeTick){await activeTick;if(flush&&!stopped)return tick(options);return;}
  if(!journal||stopped||getLocalId()!==scope.localId)return;
  activeTick=(async()=>{busy=true;const activeJournal=journal;try{
   const beforeCursor=activeJournal.status().cursor;
   if(flush||(visible&&Date.now()-lastDrain>=syncInterval)){await activeJournal.consolidate();await activeJournal.drain();lastDrain=Date.now();}
   if(stopped||journal!==activeJournal)return;
   const remote=await activeJournal.refresh();
   if(remote&&!stopped&&journal===activeJournal){
    const current=getWorkspace(),next=S.unpack(remote.records,current);if(remote.reset&&original)next.backups=original.backups;
    if(!S.equal(S.pack(current),S.pack(next)))await applyRemote(next,scope.localId);
    emit({...journal.status(),grant:remote.grant,membershipRole:remote.membershipRole,measured:remote.measured});
    polling.observe({changed:activeJournal.status().cursor!==beforeCursor,pending:activeJournal.status().pending>0});
    await authorize();
   }
  }catch(e){polling.observe({failed:true});emit({error:e.message});if(e.code==='permission-denied'||e.code==='unauthenticated'){await disconnect();emit({error:'Cloud access ended. Pending edits remain in the scoped recovery journal.'});}}
  finally{busy=false;nextPoll=Date.now()+nextDelay();}})();
  try{return await activeTick;}finally{activeTick=null;}
 }

 async function connect(options){
  if(client||state.busy)throw Error('Disconnect before opening another cloud account');const expectedLocalId=getLocalId();emit({busy:true,error:''});stopped=false;
  try{
   client=await require('./client').createEmulatorClient(options.host);const uid=await client.login(options.email,options.password,options.create===true);
   const target=options.orgId?{orgId:options.orgId,workspaceId:options.workspaceId}:await client.request({action:'bootstrap',workspaceId:options.workspaceId});
   if(getLocalId()!==expectedLocalId)throw Error('Workspace changed while signing in');
   scope={...target,uid,host:client.config.host,localId:expectedLocalId};
   const connectionClient=client,connectionScope={...scope},scopedRequest=body=>connectionClient.request({...connectionScope,...body});
   const existingJournal=await storage.getItem(journalKey(scope));
   if(options.publish&&!existingJournal)await client.publish(scope,getWorkspace());
   // A returning session resumes from its stored cursor instead of re-reading the whole workspace.
   const peek=existingJournal&&!options.publish?await require('./journalStorage.cjs').createJournalStorage(storage,journalKey(scope),()=>'peek').read().catch(()=>null):null;
   const resume=!!peek&&peek.schema===1&&Array.isArray(peek.records)&&peek.records.length>0&&Number.isSafeInteger(peek.cursor);
   const initial=await request({action:'pull',cursor:resume?peek.cursor:0,accessVersion:resume?(peek.accessVersion||''):''});
   if(getLocalId()!==expectedLocalId)throw Error('Workspace changed during connection');
   const local=getWorkspace();if(!options.publish){original=S.clone(local);await storage.setItem(leaseKey(scope.localId),JSON.stringify({schema:1,localId:scope.localId,original}));}
   if(!existingJournal&&!options.publish&&!S.equal(S.pack(local),initial.records.filter(r=>!r.deleted).map(({key,kind,projectId,boardId,id,data,order})=>({key,kind,projectId,boardId,id,data,order})))){
    // This operation is explicitly requested; the previous local workspace is recoverable.
    const next=S.unpack(initial.records,local);next.backups=[require('../domain/model.cjs').workspaceSnapshot(local,'Before opening cloud workspace'),...local.backups].slice(0,12);await applyRemote(next,scope.localId);
   }
   journal=createJournal({storage,scope,prepareChanges:require('./taskMutation.cjs').compactChanges,send:scopedRequest,receive:(cursor,accessVersion)=>scopedRequest({action:'pull',cursor,accessVersion:accessVersion||''}),newId:()=>require('expo-crypto').randomUUID(),onChange:emit});
   if(resume)await journal.open([],getWorkspace(),0,'');else await journal.open(initial.records,S.unpack(initial.records,getWorkspace()),initial.cursor,initial.accessVersion);
   if(existingJournal&&!options.publish)await applyRemote(S.unpack(journal.export().local,getWorkspace()),scope.localId);
   await journal.capture(getWorkspace());
   emit({connected:true,scope,grant:initial.grant,membershipRole:initial.membershipRole,...journal.status()});polling.reset();timer=setInterval(()=>{if(Date.now()>=nextPoll)void tick({flush:false});else void authorize().catch(()=>{});},5000);
   try{if(typeof client.heads==='function'){await authorize();startSignal(client,journal);}}catch{/* signal is optional; adaptive polling remains active */}
   await tick();return scope;
  }catch(e){await disconnect();emit({error:e.message});throw e;}finally{emit({busy:false});}
 }
 async function disconnect(){await journal?.flush();if(lastCaptureError)throw Error('Cloud edits could not be journaled. Export a local backup before changing accounts: '+lastCaptureError.message);stopped=true;clearInterval(timer);try{stopSignal?.();}catch{}stopSignal=null;signalLive=false;for(const stop of presenceStops)await stop();presenceStops.clear();journal?.close();journal=null;if(original&&scope&&getLocalId()===scope.localId){await applyRemote(original,scope.localId);await storage.removeItem(leaseKey(scope.localId));}original=null;const old=client;client=null;scope=null;if(old)await old.close();emit({connected:false,scope:null,busy:false});}
 async function capture(workspace){if(journal&&!stopped&&getLocalId()===scope.localId)try{await journal.capture(workspace);lastCaptureError=null;}catch(e){lastCaptureError=e;emit({error:'Cloud queue could not be saved: '+e.message});throw e;}}
 return {connect,disconnect,capture,tick,request,
  syncNow:async()=>{await journal?.flush();await tick();return state;},
  setVisibility:value=>{visible=!!value;if(visible){polling.reset();nextPoll=0;void tick({flush:false});}},
  getSyncInterval:()=>syncInterval,
  setSyncInterval:ms=>{if(!Number.isInteger(ms)||ms<30000||ms>600000)throw Error('Sync interval must be 30–600 seconds');syncInterval=ms;emit({syncInterval});},
  async loadConflicts(){
   if(!journal||!state.connected)throw Error('Connect before resolving cloud conflicts');
   const remote=await request({action:'pull',cursor:0,accessVersion:''}),queued=journal.export().queue.filter(q=>q.status==='conflict');
   return {remote,conflicts:queued.map(q=>({...q,remote:q.changes.map(c=>remote.records.find(r=>r.key===c.key)||null)}))};
  },
  async resolveConflict(id,choice,preview){
   if(!journal||!state.connected)throw Error('Connect before resolving cloud conflicts');
   if(!['local','remote'].includes(choice))throw Error('Choose which version to keep');
   const q=journal.export().queue.find(q=>q.id===id&&q.status==='conflict');if(!q||q.request)throw Error('Record conflict is unavailable');
   const latest=await request({action:'pull',cursor:0,accessVersion:''});
   const changes=q.changes.map(c=>{const current=latest.records.find(r=>r.key===c.key),shown=preview?.records?.find(r=>r.key===c.key);if(!S.equal(current,shown))throw Error('Remote version changed; compare again before resolving');if(!current||current.deleted)throw Error('Deleted records require the authorized recovery workflow; your original edit is retained');const after=choice==='remote'?current:{...current,data:{...current.data}};if(choice==='local'){if(!c.after)throw Error('Deletion conflicts require recovery review');for(const field of new Set([...Object.keys(c.before?.data||{}),...Object.keys(c.after.data)]))if(!S.equal(c.before?.data?.[field],c.after.data[field])){if(Object.hasOwn(c.after.data,field))after.data[field]=S.clone(c.after.data[field]);else delete after.data[field];}if(c.before?.order!==c.after.order)after.order=c.after.order;}return {key:c.key,before:current,after,baseRevision:current.revision};});
   await journal.resolveConflict(id,S.clone(changes),{remoteRecords:latest.records,cursor:latest.cursor,accessVersion:latest.accessVersion});
   await applyRemote(S.unpack(journal.export().local,getWorkspace()),scope.localId);await tick();return state;
  },
  flush:()=>journal?.flush()||Promise.resolve(),getState:()=>state,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},exportJournal:()=>journal?.export(),
  async enqueueMessage(value){if(!journal||!state.connected)throw Error('Connect to a cloud workspace first');const id=await journal.enqueueMessage({...value,action:'message'});void tick();return id;},
  pendingMessages:(projectId,threadId)=>journal?.export().queue.filter(q=>q.request?.action==='message'&&q.request.projectId===projectId&&q.request.threadId===threadId).map(q=>({id:q.id,body:q.request.body,actor:q.actor,at:q.createdAt,pending:true,status:q.status}))||[],
  async restoreNew(backup,workspaceId){require('./recovery.cjs').verifyBackup(backup);if(!client||!state.connected||backup.orgId!==scope.orgId||backup.workspaceId!==scope.workspaceId)throw Error('Choose a backup of this connected cloud workspace');S.segment(workspaceId);if(workspaceId===scope.workspaceId)throw Error('Choose a new cloud workspace ID');await client.publish({...scope,workspaceId},S.unpack(backup.records),{extras:backup.extras,restoredFrom:scope.workspaceId,archiveRecords:backup.records});return {workspaceId};},
  clientMetrics:()=>client?.metrics?.()||null,
  can:(permission,projectId)=>!!state.connected&&require('./iam.cjs').can({active:true},state.grant,projectId,permission),
  async watch(projectId,resource,editing,onPeers){if(!client||!state.connected)return()=>{};const activeClient=client,activeScope={...scope};await activeClient.request({...activeScope,action:'presenceAuthorize'});if(client!==activeClient||!state.connected)return()=>{};const stop=await activeClient.presence(activeScope,projectId,resource,editing==='typing'?'typing':editing?'editing':'viewing',onPeers);presenceStops.add(stop);return async()=>{presenceStops.delete(stop);await stop();};},
 };
}
module.exports={createCloudSession};
