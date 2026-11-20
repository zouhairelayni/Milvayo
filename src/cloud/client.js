// /src/cloud/client.js
import {initializeApp,deleteApp} from 'firebase/app';
import {initializeAuth,inMemoryPersistence,connectAuthEmulator,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut} from 'firebase/auth';
import {initializeFirestore,memoryLocalCache,connectFirestoreEmulator,terminate} from 'firebase/firestore';
import {getDatabase,connectDatabaseEmulator,ref,set,remove,onDisconnect,onValue,onChildAdded,onChildChanged,onChildRemoved,serverTimestamp} from 'firebase/database';
import {getStorage,connectStorageEmulator} from 'firebase/storage';
import {getFunctions,connectFunctionsEmulator} from 'firebase/functions';
import * as Crypto from 'expo-crypto';
const {emulatorConfig}=require('./config.cjs');
const S=require('./schema.cjs');
export async function createEmulatorClient(host){
 const config=emulatorConfig(host),app=initializeApp(config,'milvayo-local-'+Crypto.randomUUID());
 const auth=initializeAuth(app,{persistence:inMemoryPersistence});connectAuthEmulator(auth,`http://${config.host}:${config.ports.auth}`,{disableWarnings:true});
 const db=initializeFirestore(app,{localCache:memoryLocalCache(),experimentalForceLongPolling:true});connectFirestoreEmulator(db,config.host,config.ports.firestore);
 const rtdb=getDatabase(app);connectDatabaseEmulator(rtdb,config.host,config.ports.database);
 const storage=getStorage(app);connectStorageEmulator(storage,config.host,config.ports.storage);
 const functions=getFunctions(app);connectFunctionsEmulator(functions,config.host,config.ports.functions);
 const traffic={connectionEvents:0,presenceUpdates:0,uploadPayloadBytes:0,downloadPayloadBytes:0,activeSessions:0};
 async function request(body){
  if(!auth.currentUser)throw Object.assign(Error('Sign in to the emulator first'),{code:'unauthenticated'});
  const token=await auth.currentUser.getIdToken();const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),90000);
  try{const response=await fetch(`http://${config.host}:${config.ports.functions}/${config.projectId}/us-central1/cloudApi`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body),signal:controller.signal});const data=await response.json();if(!response.ok)throw Object.assign(Error(data.error||'Cloud operation failed'),{code:data.code});return data;}finally{clearTimeout(timer);}
 }
 // One shared server-clock listener per client (not one per presence session); it is released with the last session.
 let clockOffset=0,clockUsers=0,stopClock=null;
 const acquireClock=()=>{if(clockUsers++===0)stopClock=onValue(ref(rtdb,'.info/serverTimeOffset'),s=>{clockOffset=s.val()||0;});};
 const releaseClock=()=>{if(clockUsers>0&&--clockUsers===0){try{stopClock?.();}catch{}stopClock=null;}};
 const sizeOf=value=>require('fflate').strToU8(JSON.stringify(value)).length;
 // Presence: one room per resource (task, canvas, conversation). The listener receives only the person who changed (child events), never the whole room, and the heartbeat is slow because leaving a screen removes the entry at once.
 async function presence(scope,projectId,resource='',state='viewing',onPeers=()=>{}){
  const P=require('./presenceCore.cjs');
  const uid=auth.currentUser.uid,id=Crypto.randomUUID(),base=`presence/${scope.orgId}/${scope.workspaceId}/${projectId}/${P.resourceKey(resource)}`,node=ref(rtdb,base),session=ref(rtdb,`${base}/${uid}/${id}`),room=P.createRoom({uid,resource});
  let active=true,visible=true,connected=false,current=state,lastWrite=0,writing=false,reportQueued=false,lastShown=null;
  acquireClock();traffic.activeSessions++;
  const disconnect=onDisconnect(session);
  // Only tell the screen when the set of people actually changed.
  const report=()=>{if(!active)return;const peers=room.peers(Date.now()+clockOffset),key=peers.map(p=>p.uid+':'+p.state).sort().join('|');if(key===lastShown)return;lastShown=key;onPeers(peers);};
  // Events from one server snapshot arrive together; report once for the whole batch.
  const schedule=()=>{if(reportQueued)return;reportQueued=true;Promise.resolve().then(()=>{reportQueued=false;report();});};
  const publish=async()=>{
   if(!active||!visible||!connected||writing)return;
   writing=true;
   try{const now=Date.now(),payload=P.payload(current,resource,now,clockOffset);await set(session,payload);lastWrite=now;traffic.presenceUpdates++;traffic.uploadPayloadBytes+=sizeOf(payload);if(!active||!visible)await remove(session).catch(()=>{});}
   finally{writing=false;}
  };
  const stopConnect=onValue(ref(rtdb,'.info/connected'),snap=>{connected=!!snap.val();if(connected){traffic.connectionEvents++;disconnect.remove().then(publish).catch(()=>{});}});
  const onChild=type=>snap=>{traffic.downloadPayloadBytes+=sizeOf(snap.val());room.apply(type,snap.key,type==='removed'?null:snap.val());schedule();};
  const denied=()=>{lastShown='';onPeers([]);};
  const stopAdded=onChildAdded(node,onChild('added'),denied),stopChanged=onChildChanged(node,onChild('changed'),denied),stopRemoved=onChildRemoved(node,onChild('removed'),denied);
  // Local housekeeping only: drop people whose entry expired (no network) and refresh my own entry when it is half way to expiring.
  const timer=setInterval(()=>{if(!active)return;report();if(visible&&connected&&P.heartbeatDue(lastWrite,Date.now()))publish().catch(()=>{});},P.SWEEP_MS);
  const stop=async()=>{if(!active)return;active=false;traffic.activeSessions--;clearInterval(timer);stopAdded();stopChanged();stopRemoved();stopConnect();releaseClock();await remove(session).catch(()=>{});await disconnect.cancel().catch(()=>{});};
  // Same session, no new listeners: a changed state is published in place; a hidden screen removes my entry and a visible one publishes it again.
  stop.setState=next=>{if(!active||next===current)return;current=next;if(visible&&connected)publish().catch(()=>{});};
  stop.setVisible=next=>{if(!active||!!next===visible)return;visible=!!next;if(!visible){remove(session).catch(()=>{});lastWrite=0;}else if(connected)publish().catch(()=>{});};
  return stop;
 }
 // Change signal: one tiny RTDB node per workspace. The listener reports {sequence, access}; callers pull only when it moves.
 function heads(scope,onHead,onLive=()=>{}){
  const node=ref(rtdb,`heads/${scope.orgId}/${scope.workspaceId}`);let connected=false,readable=true;const report=()=>onLive(connected&&readable);
  const stopConnect=onValue(ref(rtdb,'.info/connected'),s=>{connected=!!s.val();report();});
  const stopHead=onValue(node,s=>{readable=true;const v=s.val()||{};traffic.downloadPayloadBytes+=JSON.stringify(v).length;report();onHead({sequence:Number(v.sequence)||0,access:Number(v.access)||0});},()=>{readable=false;report();});
  return ()=>{stopConnect();stopHead();};
 }
 // v4 change signal: one tiny RTDB node per project ({at, n}); the callback gets the project ID, and `onLive(false)` is reported if any of the nodes cannot be read.
 function projectHeads(scope,projectIds,onHead,onLive=()=>{}){
  let connected=false;const readable=new Map(projectIds.map(id=>[id,true])),report=()=>onLive(connected&&[...readable.values()].every(Boolean));
  const stopConnect=onValue(ref(rtdb,'.info/connected'),s=>{connected=!!s.val();report();});
  const stops=projectIds.map(id=>onValue(ref(rtdb,`heads/${scope.orgId}/${scope.workspaceId}/${id}`),s=>{readable.set(id,true);const v=s.val()||{};traffic.downloadPayloadBytes+=JSON.stringify(v).length;report();onHead(id,{at:Number(v.at)||0,n:Number(v.n)||0});},()=>{readable.set(id,false);report();}));
  return ()=>{stopConnect();stops.forEach(stop=>stop());};
 }
 return {app,auth,db,rtdb,storage,config,request,presence,heads,projectHeads,metrics:()=>({...traffic,scope:'Client session payloads only; protocol and TLS overhead excluded'}),
  async login(email,password,create=false){const result=await (create?createUserWithEmailAndPassword:signInWithEmailAndPassword)(auth,email,password);return result.user.uid;},
  async publish(scope,workspace,{extras,restoredFrom='',archiveRecords}={}){const records=S.importRecords(archiveRecords||S.pack(workspace)),archive=extras?require('./archive.cjs').normalizeExtras(extras,auth.currentUser.uid):null;const sourceHash=await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,S.stable(records)),extrasHash=archive?await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,S.stable(archive)):'';const begin=await request({...scope,action:'importBegin',sourceHash,extrasHash,restoredFrom});if(begin.state!=='active'){for(const batch of require('./batches.cjs').batches(records))await request({...scope,action:'importChunk',sourceHash,records:batch});if(archive)for(const [family,rows] of Object.entries(archive))for(const batch of require('./batches.cjs').batches(rows))await request({...scope,action:'importExtras',sourceHash,family,rows:batch});await request({...scope,action:'importFinalize',sourceHash});}return records;},
  async close(){await signOut(auth);await terminate(db);await deleteApp(app);}
 };
}
