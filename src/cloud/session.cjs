// /src/cloud/session.cjs
'use strict';
const S=require('./schema.cjs');
const {createJournal,journalKey}=require('./journal.cjs');
const {leaseKey}=require('./lease.cjs');
const {createPollingPolicy}=require('./polling.cjs');
const {createChangeFeed}=require('./changeFeed.cjs');
const {createSender,alignOrders}=require('./v4Writes.cjs');
function createCloudSession({storage,getWorkspace,getLocalId,applyRemote,onChange=()=>{}}){
 let client=null,journal=null,scope=null,timer=null,busy=false,stopped=false,original=null,lastPresenceAuthorization=0,lastCaptureError=null,activeTick=null,lastDrain=0,nextPoll=0,syncInterval=45000,visible=true,signalLive=false,stopSignal=null,v4=null;
 const polling=createPollingPolicy();
 // While the change signal is live, polling is only a safety net; queued local work still retries on the short delay.
 const SIGNAL_FALLBACK_MS=300000,SIGNAL_HIDDEN_FALLBACK_MS=600000,AUTHORIZE_MS=240000;
 const nextDelay=()=>signalLive?(journal?.status().pending>0?5000:(visible?SIGNAL_FALLBACK_MS:SIGNAL_HIDDEN_FALLBACK_MS)):polling.next({visible});
 async function authorize(force=false){if(!client||(!visible&&!force)||Date.now()-lastPresenceAuthorization<=AUTHORIZE_MS)return;lastPresenceAuthorization=Date.now();try{await request({action:'presenceAuthorize'});}catch(e){lastPresenceAuthorization=0;throw e;}}
 function startSignal(activeClient,activeJournal){
  if(typeof activeClient.heads!=='function')return;
  let first=true,access=0;
  stopSignal=activeClient.heads({...scope},head=>{
   if(stopped||journal!==activeJournal)return;
   const moved=head.sequence>activeJournal.status().cursor||(!first&&head.access!==access);first=false;access=head.access;
   if(moved){nextPoll=0;void tick({flush:false});}
  },live=>{if(stopped||journal!==activeJournal)return;const changed=live!==signalLive;signalLive=!!live;if(changed){polling.reset();nextPoll=signalLive?Date.now()+nextDelay():0;}});
 }
 // v4 workspaces: one change signal per project. A moved signal marks that project; the next pull reads only the marked projects. The first value of a node is the state we are about to sync anyway.
 function startProjectSignal(activeClient,activeJournal,ids){
  if(typeof activeClient.projectHeads!=='function')return;
  try{stopSignal?.();}catch{}
  const seen=new Map();v4.watched=ids.join('|');
  stopSignal=activeClient.projectHeads({...scope},ids,(id,head)=>{
   if(stopped||journal!==activeJournal||!v4)return;
   const value=head.at+':'+head.n,previous=seen.get(id);seen.set(id,value);
   if(previous===undefined||previous===value)return;
   v4.pending.add(id);nextPoll=0;void tick({flush:false});
  },live=>{if(stopped||journal!==activeJournal)return;const changed=live!==signalLive;signalLive=!!live;if(changed){polling.reset();nextPoll=signalLive?Date.now()+nextDelay():0;}});
 }
 // The journal asks for remote changes through this. With a live signal and nothing marked it answers at once without any request; the safety poll (or no signal) reads the directory and every project.
 async function v4Receive(cursor,accessVersion,feedState){
  // A journal written by the v3 pull (no feed state) holds sequence numbers that mean something else: start again from a full read and replace its records.
  const fresh=!feedState,due=fresh||!signalLive||Date.now()-v4.lastFull>=SIGNAL_FALLBACK_MS,taken=new Set(v4.pending);
  if(!due&&!taken.size)return {records:[],cursor,accessVersion,feed:feedState,grant:v4.grant,membershipRole:v4.role,reset:false};
  const out=await v4.reader.sync(fresh?null:feedState,{only:due?null:taken,directory:due});
  if(due)v4.lastFull=Date.now();
  if(out.reset)v4.pending.clear();else for(const id of taken)v4.pending.delete(id);
  if(out.grant){v4.grant=out.grant;v4.role=out.membershipRole;}
  const ids=out.feed.projects;if(ids.join('|')!==v4.watched)v4.restartSignal=ids;
  return {records:out.records,dropped:out.dropped,cursor:cursor+(out.records.length||out.dropped.length?1:0),accessVersion:out.accessVersion,feed:out.feed,grant:v4.grant,membershipRole:v4.role,reset:out.reset||fresh};
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
   if(v4?.restartSignal&&client&&journal===activeJournal){const ids=v4.restartSignal;v4.restartSignal=null;startProjectSignal(client,activeJournal,ids);}
   if(remote&&!stopped&&journal===activeJournal){
    const current=getWorkspace(),next=S.unpack(remote.records,current);if(remote.reset&&original)next.backups=original.backups;
    if(!S.equal(S.pack(current),S.pack(next)))await applyRemote(next,scope.localId);
    emit({...journal.status(),grant:remote.grant,membershipRole:remote.membershipRole,measured:remote.measured});
    polling.observe({changed:activeJournal.status().cursor!==beforeCursor,pending:activeJournal.status().pending>0});
    await authorize();
   }
  }catch(e){polling.observe({failed:true});emit({error:e.message});if(e.code==='permission-denied'||e.code==='unauthenticated'){await disconnect();emit({error:'Cloud access ended. Pending edits remain in the scoped recovery journal.'});}}
  finally{busy=false;nextPoll=v4?.pending.size?Date.now():Date.now()+nextDelay();}})();
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
   // A v4 workspace answers the directory call; an older one answers with its protocol only and keeps using the v3 pull.
   const directory=await request({action:'directoryV4'});let initial;
   if(directory.protocol===4){
    v4={reader:createChangeFeed({request:scopedRequest}),pending:new Set(),lastFull:0,grant:directory.grant,role:directory.membershipRole,watched:'',restartSignal:null};
    if(resume&&peek.feed)initial={records:[],cursor:peek.cursor,grant:directory.grant,membershipRole:directory.membershipRole,accessVersion:peek.accessVersion||''};
    else{const first=await v4.reader.sync(null,{dir:directory});initial={records:first.records,cursor:0,grant:first.grant,membershipRole:first.membershipRole,accessVersion:first.accessVersion,feed:first.feed};}
   }else initial=await request({action:'pull',cursor:resume?peek.cursor:0,accessVersion:resume?(peek.accessVersion||''):''});
   if(getLocalId()!==expectedLocalId)throw Error('Workspace changed during connection');
   const local=getWorkspace();if(!options.publish){original=S.clone(local);await storage.setItem(leaseKey(scope.localId),JSON.stringify({schema:1,localId:scope.localId,original}));}
   if(!existingJournal&&!options.publish&&!S.equal(S.pack(local),initial.records.filter(r=>!r.deleted).map(({key,kind,projectId,boardId,id,data,order})=>({key,kind,projectId,boardId,id,data,order})))){
    // This operation is explicitly requested; the previous local workspace is recoverable.
    const next=S.unpack(initial.records,local);next.backups=[require('../domain/model.cjs').workspaceSnapshot(local,'Before opening cloud workspace'),...local.backups].slice(0,12);await applyRemote(next,scope.localId);
   }
   journal=createJournal({storage,scope,alignOrders:v4?alignOrders:undefined,prepareChanges:v4?changes=>changes:require('./taskMutation.cjs').compactChanges,send:v4?createSender({request:scopedRequest}):scopedRequest,receive:v4?v4Receive:(cursor,accessVersion)=>scopedRequest({action:'pull',cursor,accessVersion:accessVersion||''}),newId:()=>require('expo-crypto').randomUUID(),onChange:emit});
   if(resume)await journal.open([],getWorkspace(),0,'');else await journal.open(initial.records,S.unpack(initial.records,getWorkspace()),initial.cursor,initial.accessVersion,initial.feed);
   if(existingJournal&&!options.publish)await applyRemote(S.unpack(journal.export().local,getWorkspace()),scope.localId);
   await journal.capture(getWorkspace());
   emit({connected:true,scope,grant:initial.grant,membershipRole:initial.membershipRole,...journal.status()});polling.reset();timer=setInterval(()=>{if(Date.now()>=nextPoll)void tick({flush:false});else void authorize().catch(()=>{});},5000);
   try{if(v4){if(typeof client.projectHeads==='function'){await authorize();const ids=(journal.export().feed?.projects)||[];startProjectSignal(client,journal,ids);}}else if(typeof client.heads==='function'){await authorize();startSignal(client,journal);}}catch{/* signal is optional; adaptive polling remains active */}
   await tick();return scope;
  }catch(e){await disconnect();emit({error:e.message});throw e;}finally{emit({busy:false});}
 }
 async function disconnect(){await journal?.flush();if(lastCaptureError)throw Error('Cloud edits could not be journaled. Export a local backup before changing accounts: '+lastCaptureError.message);stopped=true;clearInterval(timer);try{stopSignal?.();}catch{}stopSignal=null;signalLive=false;v4=null;for(const stop of presenceStops)await stop();presenceStops.clear();journal?.close();journal=null;if(original&&scope&&getLocalId()===scope.localId){await applyRemote(original,scope.localId);await storage.removeItem(leaseKey(scope.localId));}original=null;const old=client;client=null;scope=null;if(old)await old.close();emit({connected:false,scope:null,busy:false});}
 async function fetchLatest(){if(!v4)return request({action:'pull',cursor:0,accessVersion:''});const out=await v4.reader.sync(null,{});return {records:out.records,grant:out.grant,membershipRole:out.membershipRole};}
 async function capture(workspace){if(journal&&!stopped&&getLocalId()===scope.localId)try{await journal.capture(workspace);lastCaptureError=null;}catch(e){lastCaptureError=e;emit({error:'Cloud queue could not be saved: '+e.message});throw e;}}
 return {connect,disconnect,capture,tick,request,
  syncNow:async()=>{await journal?.flush();await tick();return state;},
  setVisibility:value=>{visible=!!value;if(visible){polling.reset();nextPoll=0;void tick({flush:false});}
   // Presence follows the screen: hidden removes my entry at once; visible refreshes the access window first, then publishes again.
   if(!visible)for(const stop of presenceStops)stop.setVisible?.(false);else void authorize(true).catch(()=>{}).then(()=>{if(visible)for(const stop of presenceStops)stop.setVisible?.(true);});},
  getSyncInterval:()=>syncInterval,
  setSyncInterval:ms=>{if(!Number.isInteger(ms)||ms<30000||ms>600000)throw Error('Sync interval must be 30–600 seconds');syncInterval=ms;emit({syncInterval});},
  async loadConflicts(){
   if(!journal||!state.connected)throw Error('Connect before resolving cloud conflicts');
   const remote=await fetchLatest(),queued=journal.export().queue.filter(q=>q.status==='conflict');
   return {remote,conflicts:queued.map(q=>({...q,remote:q.changes.map(c=>remote.records.find(r=>r.key===c.key)||null)}))};
  },
  async resolveConflict(id,choice,preview){
   if(!journal||!state.connected)throw Error('Connect before resolving cloud conflicts');
   if(!['local','remote'].includes(choice))throw Error('Choose which version to keep');
   const q=journal.export().queue.find(q=>q.id===id&&q.status==='conflict');if(!q||q.request)throw Error('Record conflict is unavailable');
   const latest=await fetchLatest();
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
  // Presence: access is refreshed only when it is older than four minutes (the shared authorize helper); the returned function stops watching and also offers setState(editing) to change my state in place.
  async watch(projectId,resource,editing,onPeers){if(!client||!state.connected)return()=>{};const activeClient=client,activeScope={...scope},toState=e=>e==='typing'?'typing':e?'editing':'viewing';await authorize(true);if(client!==activeClient||!state.connected)return()=>{};const stop=await activeClient.presence(activeScope,projectId,resource,toState(editing),onPeers);if(!visible)stop.setVisible?.(false);presenceStops.add(stop);const cleanup=async()=>{presenceStops.delete(stop);await stop();};cleanup.setState=e=>stop.setState?.(toState(e));return cleanup;},
 };
}
module.exports={createCloudSession};
