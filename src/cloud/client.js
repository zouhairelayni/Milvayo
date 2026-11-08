// /src/cloud/client.js
import {initializeApp,deleteApp} from 'firebase/app';
import {initializeAuth,inMemoryPersistence,connectAuthEmulator,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut} from 'firebase/auth';
import {initializeFirestore,memoryLocalCache,connectFirestoreEmulator,terminate} from 'firebase/firestore';
import {getDatabase,connectDatabaseEmulator,ref,set,remove,onDisconnect,onValue,serverTimestamp} from 'firebase/database';
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
 async function presence(scope,projectId,resource='',state='viewing',onPeers=()=>{}){
  const uid=auth.currentUser.uid,id=Crypto.randomUUID(),base=`presence/${scope.orgId}/${scope.workspaceId}/${projectId}`,session=ref(rtdb,`${base}/${uid}/${id}`);let offset=0;
  const stopOffset=onValue(ref(rtdb,'.info/serverTimeOffset'),s=>{offset=s.val()||0;});
  let active=true;traffic.activeSessions++;const disconnect=onDisconnect(session),publish=async()=>{if(active){const payload={state,resource,expiresAt:Date.now()+offset+60000};await set(session,payload);traffic.presenceUpdates++;traffic.uploadPayloadBytes+=require('fflate').strToU8(JSON.stringify(payload)).length;}};
  const stopConnect=onValue(ref(rtdb,'.info/connected'),snap=>{if(snap.val()){traffic.connectionEvents++;disconnect.remove().then(publish).catch(()=>{});}});
  let room={};const report=()=>{const now=Date.now()+offset;onPeers(Object.entries(room).filter(([user])=>user!==uid).flatMap(([user,sessions])=>Object.values(sessions).filter(v=>v.expiresAt>now&&v.resource===resource).map(v=>({uid:user,state:v.state}))));};
  const stopPeers=onValue(ref(rtdb,base),s=>{room=s.val()||{};traffic.downloadPayloadBytes+=require('fflate').strToU8(JSON.stringify(room)).length;report();},()=>onPeers([]));
  const timer=setInterval(()=>{report();publish().catch(()=>{});},25000);
  return async()=>{if(!active)return;active=false;traffic.activeSessions--;clearInterval(timer);stopPeers();stopOffset();stopConnect();await remove(session).catch(()=>{});await disconnect.cancel().catch(()=>{});};
 }
 // Change signal: one tiny RTDB node per workspace. The listener reports {sequence, access}; callers pull only when it moves.
 function heads(scope,onHead,onLive=()=>{}){
  const node=ref(rtdb,`heads/${scope.orgId}/${scope.workspaceId}`);let connected=false,readable=true;const report=()=>onLive(connected&&readable);
  const stopConnect=onValue(ref(rtdb,'.info/connected'),s=>{connected=!!s.val();report();});
  const stopHead=onValue(node,s=>{readable=true;const v=s.val()||{};traffic.downloadPayloadBytes+=JSON.stringify(v).length;report();onHead({sequence:Number(v.sequence)||0,access:Number(v.access)||0});},()=>{readable=false;report();});
  return ()=>{stopConnect();stopHead();};
 }
 return {app,auth,db,rtdb,storage,config,request,presence,heads,metrics:()=>({...traffic,scope:'Client session payloads only; protocol and TLS overhead excluded'}),
  async login(email,password,create=false){const result=await (create?createUserWithEmailAndPassword:signInWithEmailAndPassword)(auth,email,password);return result.user.uid;},
  async publish(scope,workspace,{extras,restoredFrom='',archiveRecords}={}){const records=S.importRecords(archiveRecords||S.pack(workspace)),archive=extras?require('./archive.cjs').normalizeExtras(extras,auth.currentUser.uid):null;const sourceHash=await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,S.stable(records)),extrasHash=archive?await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,S.stable(archive)):'';const begin=await request({...scope,action:'importBegin',sourceHash,extrasHash,restoredFrom});if(begin.state!=='active'){for(const batch of require('./batches.cjs').batches(records))await request({...scope,action:'importChunk',sourceHash,records:batch});if(archive)for(const [family,rows] of Object.entries(archive))for(const batch of require('./batches.cjs').batches(rows))await request({...scope,action:'importExtras',sourceHash,family,rows:batch});await request({...scope,action:'importFinalize',sourceHash});}return records;},
  async close(){await signOut(auth);await terminate(db);await deleteApp(app);}
 };
}
