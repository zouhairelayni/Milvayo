// /src/cloud/session.cjs
'use strict';
const S=require('./schema.cjs');
const {createJournal,journalKey}=require('./journal.cjs');
const {leaseKey}=require('./lease.cjs');
const {createPollingPolicy}=require('./polling.cjs');
const {createChangeFeed}=require('./changeFeed.cjs');
const {createSender,alignOrders}=require('./v4Writes.cjs');
const stale=require('./canvasStale.cjs');
function createCloudSession({storage,getWorkspace,getLocalId,applyRemote,onChange=()=>{}}){
 let client=null,journal=null,scope=null,timer=null,busy=false,stopped=false,original=null,lastPresenceAuthorization=0,lastCaptureError=null,activeTick=null,lastDrain=0,nextPoll=0,sendSoonAt=0,quickTimer=null,missed=0,sentSinceFull=false,syncInterval=45000,visible=true,signalLive=false,stopSignal=null,v4=null;
 const polling=createPollingPolicy();
 const {isGone}=require('./conflictGone.cjs');
 const D=require('./diagnostics.cjs');let diag=D.createDiagnostics();// read-only measuring for the Sync status and Compare screens; it never changes behaviour
 // While the change signal is live, polling is only a safety net; queued local work still retries on the short delay.
 const SEND_SOON_MS=1500,SIGNAL_FALLBACK_MS=60000,SIGNAL_HIDDEN_FALLBACK_MS=300000,AUTHORIZE_MS=240000;
 // 0.8.33 (audit F3): the safety check is every 60 s (was 5 min). If two safety checks in a row find changes that the live signal never announced, the signal is not trusted any more and the app polls (5 s while things change, up to 60 s when quiet) until the signal announces a change again.
 const trusted=()=>signalLive&&missed<2;
 const nextDelay=()=>trusted()?(journal?.status().waiting>0?5000:(visible?SIGNAL_FALLBACK_MS:SIGNAL_HIDDEN_FALLBACK_MS)):polling.next({visible});
 // Wraps the sender only to time and count it; the request and the answer pass through untouched.
 const measuredSend=raw=>async body=>{diag.sendTried();try{const out=await raw(body);diag.sendOk();sentSinceFull=true;return out;}catch(e){diag.sendFailed(e);throw e;}};
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
   diag.signalValue(id,previous!==undefined&&previous!==value);
   if(previous===undefined||previous===value)return;
   v4.pending.add(id);nextPoll=0;void tick({flush:false});
  },(live,detail)=>{if(stopped||journal!==activeJournal)return;diag.signalState(live,detail);const changed=live!==signalLive;signalLive=!!live;if(changed){polling.reset();nextPoll=signalLive?Date.now()+nextDelay():0;}});
 }
 // The journal asks for remote changes through this. With a live signal and nothing marked it answers at once without any request; the safety poll (or no signal) reads the directory and every project.
 async function v4Receive(cursor,accessVersion,feedState){
  // A journal written by the v3 pull (no feed state) holds sequence numbers that mean something else: start again from a full read and replace its records.
  const fresh=!feedState,due=fresh||!trusted()||Date.now()-v4.lastFull>=SIGNAL_FALLBACK_MS,taken=new Set(v4.pending);
  if(!due&&!taken.size){diag.receiveSkipped();return {records:[],cursor,accessVersion,feed:feedState,grant:v4.grant,membershipRole:v4.role,reset:false};}
  let out;try{out=await v4.reader.sync(fresh?null:feedState,{only:due?null:taken,directory:due});}catch(e){diag.receiveFailed(e);throw e;}
  if(due)v4.lastFull=Date.now();
  // A check that found changes although no signal had marked any project, and that did not follow one of my own sends, means the signal missed them.
  if(!fresh&&out.records.length>0){if(due&&!taken.size&&!sentSinceFull){missed++;diag.signalMissed(missed);}else if(taken.size)missed=0;}
  if(due)sentSinceFull=false;
  diag.receiveDone({full:due,projects:taken,records:out.records.length});
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
   const beforeCursor=activeJournal.status().cursor;diag.tickRan();
   if(flush||(visible&&Date.now()-lastDrain>=syncInterval)){await activeJournal.consolidate();await activeJournal.drain();lastDrain=Date.now();}
   if(stopped||journal!==activeJournal)return;
   const remote=await activeJournal.refresh();
   if(v4?.restartSignal&&client&&journal===activeJournal){const ids=v4.restartSignal;v4.restartSignal=null;startProjectSignal(client,activeJournal,ids);}
   if(remote&&!stopped&&journal===activeJournal){
    const current=getWorkspace(),unpacked=S.unpack(remote.records,current);if(remote.reset&&original)unpacked.backups=original.backups;
    const next=stale.markChangedBoards(current,unpacked);
    if(!S.equal(S.pack(current),S.pack(next)))await applyRemote(next,scope.localId);
    emit({...journal.status(),grant:remote.grant,membershipRole:remote.membershipRole,measured:remote.measured});
    polling.observe({changed:activeJournal.status().cursor!==beforeCursor,pending:activeJournal.status().waiting>0});
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
   scope={...target,uid,host:client.config.host,localId:expectedLocalId};diag=D.createDiagnostics();
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
   journal=createJournal({storage,scope,alignOrders:v4?alignOrders:undefined,prepareChanges:v4?changes=>changes:require('./taskMutation.cjs').compactChanges,send:measuredSend(v4?createSender({request:scopedRequest}):scopedRequest),receive:v4?v4Receive:(cursor,accessVersion)=>scopedRequest({action:'pull',cursor,accessVersion:accessVersion||''}),newId:()=>require('expo-crypto').randomUUID(),onChange:emit});
   if(resume)await journal.open([],getWorkspace(),0,'');else await journal.open(initial.records,S.unpack(initial.records,getWorkspace()),initial.cursor,initial.accessVersion,initial.feed);
   if(existingJournal&&!options.publish)await applyRemote(S.unpack(journal.export().local,getWorkspace()),scope.localId);
   await journal.capture(getWorkspace());
   missed=0;sentSinceFull=false;emit({connected:true,scope,grant:initial.grant,membershipRole:initial.membershipRole,...journal.status()});polling.reset();timer=setInterval(()=>{if(Date.now()>=nextPoll)void tick({flush:false});else void authorize().catch(()=>{});},5000);sendSoonAt=0;clearInterval(quickTimer);quickTimer=setInterval(quickCheck,500);
   try{if(v4){if(typeof client.projectHeads==='function'){await authorize();const ids=(journal.export().feed?.projects)||[];startProjectSignal(client,journal,ids);}}else if(typeof client.heads==='function'){await authorize();startSignal(client,journal);}}catch{/* signal is optional; adaptive polling remains active */}
   await tick();return scope;
  }catch(e){await disconnect();emit({error:e.message});throw e;}finally{emit({busy:false});}
 }
 async function disconnect(){await journal?.flush();if(lastCaptureError)throw Error('Cloud edits could not be journaled. Export a local backup before changing accounts: '+lastCaptureError.message);stopped=true;clearInterval(timer);clearInterval(quickTimer);sendSoonAt=0;try{stopSignal?.();}catch{}stopSignal=null;signalLive=false;v4=null;for(const stop of presenceStops)await stop();presenceStops.clear();journal?.close();journal=null;if(original&&scope&&getLocalId()===scope.localId){await applyRemote(original,scope.localId);await storage.removeItem(leaseKey(scope.localId));}original=null;const old=client;client=null;scope=null;if(old)await old.close();emit({connected:false,scope:null,busy:false});}
 async function fetchLatest(){if(!v4)return request({action:'pull',cursor:0,accessVersion:''});const out=await v4.reader.sync(null,{});return {records:out.records,grant:out.grant,membershipRole:out.membershipRole};}
 async function compare(){
  if(!journal||!state.connected)throw Error('Connect before comparing with the cloud');
  const device=S.pack(getWorkspace()),remote=await fetchLatest(),status=journal.status();
  return D.compareRecords(device,remote.records.filter(r=>!r.deleted),{at:Date.now(),uid:scope.uid,queued:status.pending,conflicts:status.conflicts});
 }
 function getDiagnostics(){
  const now=Date.now();return {at:now,connected:!!state.connected,protocol:v4?4:3,visible,checkEveryMs:nextDelay(),signalDistrusted:missed>=2,nextCheckInMs:Math.max(0,nextPoll-now),lastDrainAt:lastDrain,syncIntervalMs:syncInterval,queue:journal?journal.queueSummary():null,...diag.snapshot()};
 }
 // 0.8.32 (audit F4): every captured edit is sent about SEND_SOON_MS after the FIRST unsent edit, not at the next 45-second round.
 // The delay is not restarted by later edits, so a long drag or typing session cannot postpone the send; compatible edits made in that time are merged by consolidate().
 const scheduleSendSoon=()=>{if(!journal||stopped||sendSoonAt)return;try{if(journal.hasReady())sendSoonAt=Date.now()+SEND_SOON_MS;}catch{}};
 const quickCheck=()=>{if(!sendSoonAt||Date.now()<sendSoonAt)return;sendSoonAt=0;if(!journal||stopped||!state.connected||!journal.hasReady())return;diag.quickSend();void tick().catch(()=>{});};
 async function capture(workspace){if(journal&&!stopped&&getLocalId()===scope.localId)try{await journal.capture(workspace);lastCaptureError=null;scheduleSendSoon();}catch(e){lastCaptureError=e;emit({error:'Cloud queue could not be saved: '+e.message});throw e;}}
 return {connect,disconnect,capture,tick,request,compare,getDiagnostics,
  syncNow:async()=>{await journal?.flush();await tick();return state;},
  setVisibility:value=>{visible=!!value;if(visible){polling.reset();nextPoll=0;void tick({flush:false});}
   // Presence follows the screen: hidden removes my entry at once; visible refreshes the access window first, then publishes again.
   if(!visible)for(const stop of presenceStops)stop.setVisible?.(false);else void authorize(true).catch(()=>{}).then(()=>{if(visible)for(const stop of presenceStops)stop.setVisible?.(true);});},
  getSyncInterval:()=>syncInterval,
  setSyncInterval:ms=>{if(!Number.isInteger(ms)||ms<30000||ms>600000)throw Error('Sync interval must be 30–600 seconds');syncInterval=ms;emit({syncInterval});},
  async loadConflicts(){
   if(!journal||!state.connected)throw Error('Connect before resolving cloud conflicts');
   const remote=await fetchLatest(),exported=journal.export(),queued=exported.queue.filter(q=>q.status==='conflict');
   // `gone[i]` is true when change i is on a record someone else deleted (see conflictGone.cjs); the screen then offers only "Keep cloud version".
   return {remote,conflicts:queued.map(q=>({...q,remote:q.changes.map(c=>remote.records.find(r=>r.key===c.key)||null),gone:q.changes.map(c=>q.request?false:isGone(c,q,remote.records,exported.records))}))};
  },
  async resolveConflict(id,choice,preview){
   if(!journal||!state.connected)throw Error('Connect before resolving cloud conflicts');
   if(!['local','remote','restore'].includes(choice))throw Error('Choose which version to keep');
   const exported=journal.export(),q=exported.queue.find(q=>q.id===id&&q.status==='conflict');if(!q||q.request)throw Error('Record conflict is unavailable');
   const latest=await fetchLatest();
   // 0.8.30: a record someone else deleted. "Keep cloud version" drops my edit (a copy stays in the recovery export). "Keep my changes" would have to bring the record back, which needs a separate approved restore, so it is refused.
   const gone=q.changes.map(c=>isGone(c,q,latest.records,exported.records));
   if(choice==='local'&&q.changes.some((c,i)=>gone[i]&&c.after))throw Error('Someone deleted this record. "Keep my changed fields" cannot bring it back; choose "Bring the task back" (tasks only) or "Keep cloud version" to drop your edit (a copy stays in the recovery export).');
   // 0.8.40: bring a deleted TASK back with my edit (owner approved 2026-11-23). The cloud checks the deleted copy's revision, so a task someone else already restored or changed is never overwritten.
   if(choice==='restore'){
    if(!q.changes.length||!q.changes.every((c,i)=>gone[i]&&c.after&&c.before?.kind==='tasks'))throw Error('Only a deleted task can be brought back');
    for(const c of q.changes){
     // The deleted copy's revision comes from this device's own record of the deletion. If the device has not received that marker yet, the first try uses a placeholder and the cloud answers with the deleted copy's real revision (it only ever answers that way for a record that IS deleted); the second try uses it.
     const marker=exported.records.find(r=>r.key===c.key&&r.deleted),body=revision=>({action:'restoreTask',projectId:c.before.projectId,taskId:c.before.id,baseRevision:revision,opId:require('expo-crypto').randomUUID(),data:c.after.data});
     let out=await request(body(marker?marker.revision:1));
     if(!marker&&out&&out.ok===false&&out.code==='conflict'&&out.current?.deleted===true&&out.current.key===c.key)out=await request(body(out.current.revision));
     if(out&&out.ok===false)throw Error('Someone changed this task in the cloud after it was deleted; compare again before bringing it back');
     if(out&&out.alreadyApplied)throw Error('Someone already brought this task back. Synchronize, then choose "Keep my changed fields".');
    }
    const options={remoteRecords:latest.records,cursor:latest.cursor,accessVersion:latest.accessVersion};
    await journal.discardConflict(id,options);
    {const now=getWorkspace(),after=stale.markChangedBoards(now,S.unpack(journal.export().local,now));await applyRemote(after,scope.localId);}await tick();return state;
   }
   const changes=[];
   q.changes.forEach((c,index)=>{if(gone[index])return;const current=latest.records.find(r=>r.key===c.key),shown=preview?.records?.find(r=>r.key===c.key);if(!S.equal(current,shown))throw Error('Remote version changed; compare again before resolving');if(!current||current.deleted)throw Error('This record is not available in the cloud right now (your access may have changed); your original edit is retained');const after=choice==='remote'?current:{...current,data:{...current.data}};if(choice==='local'){if(!c.after)throw Error('Deletion conflicts require recovery review');for(const field of new Set([...Object.keys(c.before?.data||{}),...Object.keys(c.after.data)]))if(!S.equal(c.before?.data?.[field],c.after.data[field])){if(Object.hasOwn(c.after.data,field))after.data[field]=S.clone(c.after.data[field]);else delete after.data[field];}if(c.before?.order!==c.after.order)after.order=c.after.order;}changes.push({key:c.key,before:current,after,baseRevision:current.revision});});
   const options={remoteRecords:latest.records,cursor:latest.cursor,accessVersion:latest.accessVersion};
   if(changes.length)await journal.resolveConflict(id,S.clone(changes),options);else await journal.discardConflict(id,options);
   {const now=getWorkspace(),after=stale.markChangedBoards(now,S.unpack(journal.export().local,now));await applyRemote(after,scope.localId);}await tick();return state;
  },
  flush:()=>journal?.flush()||Promise.resolve(),getState:()=>state,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},exportJournal:()=>journal?.export(),
  async enqueueMessage(value){if(!journal||!state.connected)throw Error('Connect to a cloud workspace first');const id=await journal.enqueueMessage({...value,action:'message'});void tick();return id;},
  pendingMessages:(projectId,threadId)=>journal?.export().queue.filter(q=>q.request?.action==='message'&&q.request.projectId===projectId&&q.request.threadId===threadId).map(q=>({id:q.id,body:q.request.body,actor:q.actor,at:q.createdAt,pending:true,status:q.status}))||[],
  // 0.8.40: bring ONE deleted task back from a backup snapshot (owner approved 2026-11-23). The old restore path rewrites many records and is refused on a v4 workspace, so this uses the one-task action:
  // it returns the task by itself (no parent, dependencies, list, sprint, phase or release) and never overwrites a task that is alive.
  async restoreTaskFromBackup(backup,taskId){
   if(!client||!state.connected)throw Error('Connect to a cloud workspace first');
   require('./recovery.cjs').verifyBackup(backup);
   if(backup.orgId!==scope.orgId||backup.workspaceId!==scope.workspaceId)throw Error('Choose a backup of this cloud workspace');
   const saved=backup.records.find(r=>r.kind==='tasks'&&r.id===taskId&&!r.deleted);if(!saved)throw Error('This backup has no such task');
   const live=(await fetchLatest()).records.find(r=>r.key===saved.key&&!r.deleted);if(live)throw Error('This task already exists in the cloud; nothing was changed');
   const opId=()=>require('expo-crypto').randomUUID(),body=revision=>({action:'restoreTask',projectId:saved.projectId,taskId,baseRevision:revision,opId:opId(),data:S.clone(saved.data)});
   let out;try{out=await request(body(1));}catch(e){out=null;if(!/unavailable/i.test(e.message))throw e;}
   if(out&&out.ok===false&&out.code==='conflict'&&out.current?.deleted===true)out=await request(body(out.current.revision));
   if(!out){
    // The cloud has no copy of the deleted task at all (kept copies are cleaned up after a while): create it again as a new task with no links.
    const data={...S.clone(saved.data),parentId:'',dependsOn:[],verified:false,merged:false,boardId:'board-default',listId:'',sprintId:'',phaseId:'',releaseId:''};
    out=await request({action:'createTask',projectId:saved.projectId,taskId,order:saved.order,opId:opId(),data});
   }
   if(!out||out.ok===false)throw Error('The task could not be brought back; nothing was changed');
   await tick();return {restored:true,taskId};
  },
  async restoreNew(backup,workspaceId){require('./recovery.cjs').verifyBackup(backup);if(!client||!state.connected||backup.orgId!==scope.orgId||backup.workspaceId!==scope.workspaceId)throw Error('Choose a backup of this connected cloud workspace');S.segment(workspaceId);if(workspaceId===scope.workspaceId)throw Error('Choose a new cloud workspace ID');await client.publish({...scope,workspaceId},S.unpack(backup.records),{extras:backup.extras,restoredFrom:scope.workspaceId,archiveRecords:backup.records});return {workspaceId};},
  clientMetrics:()=>client?.metrics?.()||null,
  can:(permission,projectId)=>!!state.connected&&require('./iam.cjs').can({active:true},state.grant,projectId,permission),
  // Presence: access is refreshed only when it is older than four minutes (the shared authorize helper); the returned function stops watching and also offers setState(editing) to change my state in place.
  async watch(projectId,resource,editing,onPeers){if(!client||!state.connected)return()=>{};const activeClient=client,activeScope={...scope},toState=e=>e==='typing'?'typing':e?'editing':'viewing';await authorize(true);if(client!==activeClient||!state.connected)return()=>{};const stop=await activeClient.presence(activeScope,projectId,resource,toState(editing),onPeers);if(!visible)stop.setVisible?.(false);presenceStops.add(stop);const cleanup=async()=>{presenceStops.delete(stop);await stop();};cleanup.setState=e=>stop.setState?.(toState(e));return cleanup;},
 };
}
module.exports={createCloudSession};
