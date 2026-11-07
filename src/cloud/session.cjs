// /src/cloud/session.cjs
'use strict';
const S=require('./schema.cjs');
const {createJournal,journalKey}=require('./journal.cjs');
const {leaseKey}=require('./lease.cjs');
function createCloudSession({storage,getWorkspace,getLocalId,applyRemote,onChange=()=>{}}){
 let client=null,journal=null,scope=null,timer=null,busy=false,stopped=false,original=null,lastPresenceAuthorization=0,lastCaptureError=null;
 let state={connected:false,busy:false,pending:0,conflicts:0,error:'',measured:null};const listeners=new Set(),presenceStops=new Set();
 const emit=patch=>{state={...state,...patch};onChange(state);listeners.forEach(fn=>fn(state));};
 const request=body=>client.request({...scope,...body});
 async function tick(){if(busy||!journal||stopped||getLocalId()!==scope.localId)return;busy=true;const activeJournal=journal;try{await activeJournal.drain();if(stopped||journal!==activeJournal)return;const remote=await activeJournal.refresh();if(remote&&!stopped&&journal===activeJournal){const current=getWorkspace(),next=S.unpack(remote.records,current);if(remote.reset&&original)next.backups=original.backups;if(!S.equal(S.pack(current),S.pack(next)))await applyRemote(next,scope.localId);emit({...journal.status(),grant:remote.grant,membershipRole:remote.membershipRole,measured:remote.measured});if(Date.now()-lastPresenceAuthorization>40000){await request({action:'presenceAuthorize'});lastPresenceAuthorization=Date.now();}}}catch(e){emit({error:e.message});if(e.code==='permission-denied'||e.code==='unauthenticated'){await disconnect();emit({error:'Cloud access ended. Pending edits remain in the scoped recovery journal.'});}}finally{busy=false;}}
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
   const initial=await request({action:'pull',cursor:0});
   if(getLocalId()!==expectedLocalId)throw Error('Workspace changed during connection');
   const local=getWorkspace();if(!options.publish){original=S.clone(local);await storage.setItem(leaseKey(scope.localId),JSON.stringify({schema:1,localId:scope.localId,original}));}
   if(!existingJournal&&!options.publish&&!S.equal(S.pack(local),initial.records.filter(r=>!r.deleted).map(({key,kind,projectId,boardId,id,data,order})=>({key,kind,projectId,boardId,id,data,order})))){
    // This operation is explicitly requested; the previous local workspace is recoverable.
    const next=S.unpack(initial.records,local);next.backups=[require('../domain/model.cjs').workspaceSnapshot(local,'Before opening cloud workspace'),...local.backups].slice(0,12);await applyRemote(next,scope.localId);
   }
   journal=createJournal({storage,scope,send:scopedRequest,receive:(cursor,accessVersion)=>scopedRequest({action:'pull',cursor,accessVersion:accessVersion||''}),newId:()=>require('expo-crypto').randomUUID(),onChange:emit});
   await journal.open(initial.records,S.unpack(initial.records,getWorkspace()),initial.cursor,initial.accessVersion);
   if(existingJournal&&!options.publish)await applyRemote(S.unpack(journal.export().local,getWorkspace()),scope.localId);
   await journal.capture(getWorkspace());
   emit({connected:true,scope,grant:initial.grant,membershipRole:initial.membershipRole,...journal.status()});timer=setInterval(()=>{void tick();},5000);await tick();return scope;
  }catch(e){await disconnect();emit({error:e.message});throw e;}finally{emit({busy:false});}
 }
 async function disconnect(){await journal?.flush();if(lastCaptureError)throw Error('Cloud edits could not be journaled. Export a local backup before changing accounts: '+lastCaptureError.message);stopped=true;clearInterval(timer);for(const stop of presenceStops)await stop();presenceStops.clear();journal?.close();journal=null;if(original&&scope&&getLocalId()===scope.localId){await applyRemote(original,scope.localId);await storage.removeItem(leaseKey(scope.localId));}original=null;const old=client;client=null;scope=null;if(old)await old.close();emit({connected:false,scope:null,busy:false});}
 async function capture(workspace){if(journal&&!stopped&&getLocalId()===scope.localId)try{await journal.capture(workspace);lastCaptureError=null;}catch(e){lastCaptureError=e;emit({error:'Cloud queue could not be saved: '+e.message});throw e;}}
 return {connect,disconnect,capture,tick,request,flush:()=>journal?.flush()||Promise.resolve(),getState:()=>state,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},exportJournal:()=>journal?.export(),
  async enqueueMessage(value){if(!journal||!state.connected)throw Error('Connect to a cloud workspace first');const id=await journal.enqueueMessage({...value,action:'message'});void tick();return id;},
  pendingMessages:(projectId,threadId)=>journal?.export().queue.filter(q=>q.request?.action==='message'&&q.request.projectId===projectId&&q.request.threadId===threadId).map(q=>({id:q.id,body:q.request.body,actor:q.actor,at:q.createdAt,pending:true,status:q.status}))||[],
  async restoreNew(backup,workspaceId){require('./recovery.cjs').verifyBackup(backup);if(!client||!state.connected||backup.orgId!==scope.orgId||backup.workspaceId!==scope.workspaceId)throw Error('Choose a backup of this connected cloud workspace');S.segment(workspaceId);if(workspaceId===scope.workspaceId)throw Error('Choose a new cloud workspace ID');await client.publish({...scope,workspaceId},S.unpack(backup.records),{extras:backup.extras,restoredFrom:scope.workspaceId,archiveRecords:backup.records});return {workspaceId};},
  clientMetrics:()=>client?.metrics?.()||null,
  can:(permission,projectId)=>!!state.connected&&require('./iam.cjs').can({active:true},state.grant,projectId,permission),
  async watch(projectId,resource,editing,onPeers){if(!client||!state.connected)return()=>{};const activeClient=client,activeScope={...scope};await activeClient.request({...activeScope,action:'presenceAuthorize'});if(client!==activeClient||!state.connected)return()=>{};const stop=await activeClient.presence(activeScope,projectId,resource,editing==='typing'?'typing':editing?'editing':'viewing',onPeers);presenceStops.add(stop);return async()=>{presenceStops.delete(stop);await stop();};},
 };
}
module.exports={createCloudSession};
