// /tests/helpers/bench-v4-client-rtdb.cjs
'use strict';
/*
 * Emulator-only cost instrumentation for the EXACT Milvayo src/cloud/client.js
 * heads() and presence() methods. No app source changes. No production access.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const Module=require('node:module');
const {performance}=require('node:perf_hooks');
const ROOT=path.resolve(__dirname,'../..');
const CLIENT=path.join(ROOT,'src/cloud/client.js');
const PROJECT='demo-milvayo-083';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function assertLocal(){
 const hosts=['FIREBASE_AUTH_EMULATOR_HOST','FIRESTORE_EMULATOR_HOST','FIREBASE_DATABASE_EMULATOR_HOST','FIREBASE_STORAGE_EMULATOR_HOST'];
 for(const k of hosts)assert.match(process.env[k]||'',/^(127\.0\.0\.1|localhost):\d+$/,`${k}: require running local Firebase emulators`);
 assert.equal(process.env.GCLOUD_PROJECT||PROJECT,PROJECT,'Local demo project only');
}
function buildSource(source){
 let imports=0;
 const converted=source.replace(/^import\s*\{([^}]+)\}\s*from\s*'([^']+)'\s*;\s*$/gm,(line,names,spec)=>{
  imports++;return `const {${names}}=require(${JSON.stringify(spec)});`;
 }).replace(/^import\s*\*\s*as\s+Crypto\s+from\s+'expo-crypto'\s*;\s*$/gm,()=>{imports++;return `const Crypto=require('expo-crypto');`;})
 .replace('export async function createEmulatorClient','async function createEmulatorClient');
 assert.equal(imports,7,'client.js imports changed; audit loader must be reviewed');
 assert.ok(converted.includes('async function createEmulatorClient('),'client factory not found');
 assert.ok(converted.includes('function heads(')&&converted.includes('async function presence('),'RTDB client methods not found');
 return converted+'\nmodule.exports={createEmulatorClient};\n';
}
const CATS=['heads','presence','connected','serverTimeOffset','other'];
function category(url){const s=String(url||'');if(/\/heads\//.test(s))return 'heads';if(/\/presence\//.test(s))return 'presence';if(s.includes('.info/connected'))return 'connected';if(s.includes('.info/serverTimeOffset'))return 'serverTimeOffset';return 'other';}
const bytes=x=>Buffer.byteLength(JSON.stringify(x===undefined?null:x));
function newMeter(){
 const data={authSignIns:0,authSignOuts:0,authTokenCalls:0,databaseSets:0,databaseRemoves:0,onDisconnectRegisters:0,onDisconnectCancels:0,storageInitializations:0,firestoreInitializations:0,cloudClientRequests:0};
 for(const cat of CATS)for(const key of ['listenersOpened','listenersClosed','events','downloadPayloadBytes','uploadPayloadBytes'])data[`${cat}_${key}`]=0;
 const errors=[];
 return {data,errors,snapshot:()=>({...data}),errorSummary:()=>errors.map(x=>({category:x.category,message:x.message}))};
}
function wrapImports(baseRequire,meter){
 const m=meter.data;
 return id=>{
  if(id==='expo-crypto')return {randomUUID:crypto.randomUUID,CryptoDigestAlgorithm:{SHA256:'SHA-256'},digestStringAsync:async(_algo,s)=>crypto.createHash('sha256').update(s).digest('hex')};
  const sdk=baseRequire(id);
  // Child listeners (per-person presence events) are metered exactly like onValue: every delivered event and its serialized payload.
  const childWrap=name=>(node,onData,onError,...rest)=>{const cat=category(node.toString());m[`${cat}_listenersOpened`]++;const stop=sdk[name](node,s=>{m[`${cat}_events`]++;m[`${cat}_downloadPayloadBytes`]+=bytes(s.val());onData(s);},e=>{meter.errors.push({category:cat,message:e.message});onError?.(e);},...rest);return ()=>{m[`${cat}_listenersClosed`]++;stop();};};
  if(id==='firebase/database')return {...sdk,
   onChildAdded:childWrap('onChildAdded'),onChildChanged:childWrap('onChildChanged'),onChildRemoved:childWrap('onChildRemoved'),
   onValue:(node,onData,onError,...rest)=>{
    const cat=category(node.toString());m[`${cat}_listenersOpened`]++;
    const stop=sdk.onValue(node,s=>{m[`${cat}_events`]++;m[`${cat}_downloadPayloadBytes`]+=bytes(s.val());onData(s);},e=>{meter.errors.push({category:cat,message:e.message});onError?.(e);},...rest);
    return ()=>{m[`${cat}_listenersClosed`]++;stop();};
   },
   set:async(node,value)=>{const cat=category(node.toString());m.databaseSets++;m[`${cat}_uploadPayloadBytes`]+=bytes(value);return sdk.set(node,value);},
   remove:async node=>{m.databaseRemoves++;return sdk.remove(node);},
   onDisconnect:node=>{const op=sdk.onDisconnect(node);return {
    remove:async()=>{m.onDisconnectRegisters++;return op.remove();},
    cancel:async()=>{m.onDisconnectCancels++;return op.cancel();},
    set:async value=>op.set(value),update:async value=>op.update(value),
   };},
  };
  if(id==='firebase/auth')return {...sdk,
   signInWithEmailAndPassword:async(...a)=>{m.authSignIns++;return sdk.signInWithEmailAndPassword(...a);},
   signOut:async(...a)=>{m.authSignOuts++;return sdk.signOut(...a);},
  };
  if(id==='firebase/storage')return {...sdk,getStorage:(...a)=>{m.storageInitializations++;return sdk.getStorage(...a);}};
  if(id==='firebase/firestore')return {...sdk,initializeFirestore:(...a)=>{m.firestoreInitializations++;return sdk.initializeFirestore(...a);}};
  return sdk;
 };
}
function loadActualClient(meter){
 const code=buildSource(fs.readFileSync(CLIENT,'utf8'));
 const mod=new Module(CLIENT,module);mod.filename=CLIENT;mod.paths=Module._nodeModulePaths(path.dirname(CLIENT));
 const actualRequire=mod.require.bind(mod);mod.require=wrapImports(actualRequire,meter);
 mod._compile(code,CLIENT);
 return mod.exports.createEmulatorClient;
}
function delta(before,after){return Object.fromEntries(Object.keys(after).map(k=>[k,after[k]-(before[k]||0)]));}
async function until(predicate,label,timeout=15000){
 const start=performance.now();while(performance.now()-start<timeout){if(predicate())return;await sleep(200);}
 throw Error(`No ${label} within ${timeout}ms`);
}
function compactMetrics(xs){return xs.map((x,i)=>({client:i+1,...x.metrics()}));}
const escape=s=>String(s).replace(/\|/g,'\\|');
function markdown(report){
 const d=report.phases;
 let out=`# Milvayo v4 — Client RTDB emulator traffic\n\nDate: ${report.createdAt}\n\n**Scope:** Actual \`src/cloud/client.js\` methods under Firebase emulators; 5 authenticated client SDK sessions; **not production billing**.\n\n`;
 out+='| Phase | RTDB onValue events | Listener opens | Client RTDB sets | Payload bytes downloaded | Payload bytes uploaded |\n|---|---:|---:|---:|---:|---:|\n';
 for(const p of d){const x=p.delta;out+=`| ${escape(p.name)} | ${CATS.reduce((a,k)=>a+x[`${k}_events`],0)} | ${CATS.reduce((a,k)=>a+x[`${k}_listenersOpened`],0)} | ${x.databaseSets} | ${CATS.reduce((a,k)=>a+x[`${k}_downloadPayloadBytes`],0)} | ${CATS.reduce((a,k)=>a+x[`${k}_uploadPayloadBytes`],0)} |\n`;}
 out+=`\n## Verification\n\n- Users authenticated: ${report.verification.authenticated}\n- Observed peers (maximum): ${report.verification.maxPeers}\n- Initial presence writes: ${report.verification.initialPresenceWrites}\n- Heartbeat writes: ${report.verification.heartbeatWrites}\n- Change signal received by all clients: ${report.verification.changeReceivedByAll}\n- RTDB errors: ${report.errors.length}\n\n## Limits\n\n- These are SDK events and serialized snapshot payload lengths, **not actual network bytes** or billable Firebase operations.\n- Client and presence subscriptions have different billing characteristics than backend Cloud Firestore reads.\n- Setup used Cloud API calls for fixture creation and ACL authorization; their backend I/O is excluded here.\n- Auth/Storage are only represented by sign-in/sign-out and SDK initialization, not usage/billing.\n- This tests RTDB transport, not the full journal, offline queue, UI screen lifecycle, Storage uploads, or browser reconnect behavior.\n`;
 return out;
}
async function main(){
 const out=path.resolve(process.env.BENCH_OUT||path.join(process.env.HOME||ROOT,'milvayo-v4-client-rtdb.json'));
 if(process.argv.includes('--selftest')){
  const src=fs.readFileSync(CLIENT,'utf8');const converted=buildSource(src);new Function('require','module','exports',converted);
  assert.equal(category('https://127.0.0.1:9000/heads/org/ws'),'heads');
  assert.equal(category('https://127.0.0.1:9000/presence/org/ws/p'),'presence');
  console.log('Client transport harness source/loader smoke test PASS (emulator not run)');return;
 }
 assertLocal();
 const H=require('./cloud-emulators.cjs');const meter=newMeter();
 const createEmulatorClient=loadActualClient(meter);
 const report={schema:'milvayo.client.rtdb.emulator.v1',createdAt:new Date().toISOString(),source:'Real client.js via CommonJS test loader; Auth and RTDB SDK requests against localhost Firebase emulators',project:PROJECT,phases:[],verification:{},errors:[],limitations:['Not Firebase billing or wire bytes','Does not test all client workflows or all sizes','Back-end fixture/ACL I/O excluded']};
 const clients=[],stops=[];let last=meter.snapshot();let owner,scope,fixture,projectId;
 const phase=async(name,fn)=>{const start=performance.now();await fn();const now=meter.snapshot();report.phases.push({name,durationMs:Math.round(performance.now()-start),delta:delta(last,now)});last=now;console.log('[RTDB]',name,JSON.stringify(report.phases.at(-1).delta));};
 try{
  console.log('[RTDB] Starting authenticated emulator fixture');
  owner=await H.account('rtdb-owner');fixture=await H.publish(owner);
  scope={orgId:fixture.orgId,workspaceId:fixture.workspaceId};
  projectId=fixture.records.find(r=>r.kind==='projects'&&!r.deleted)?.id;
  assert.ok(projectId,'Demo project unavailable');
  const users=[owner];
  for(let i=0;i<4;i++){
   const u=await H.account('rtdb-viewer');
   const invitation=await H.request(owner,{...scope,action:'invite',uid:u.uid,grant:{workspaceRole:'viewer',projects:{}}});
   await H.request(u,{...scope,action:'accept',token:invitation.token});
   users.push(u);
  }
  for(const u of users)await H.request(u,{...scope,action:'presenceAuthorize'});
  for(const u of users){const c=await createEmulatorClient('127.0.0.1');assert.equal(await c.login(u.email,u.password),u.uid);clients.push(c);}
  report.verification.authenticated=clients.length;
  let peerMax=0;const counts=Array.from({length:5},()=>({heads:0,access:0,sequence:0}));
  await phase('one client: head listener startup',async()=>{
   stops.push(clients[0].heads(scope,v=>{counts[0].heads++;counts[0].sequence=v.sequence;counts[0].access=v.access;}));
   await until(()=>counts[0].heads>=1,'owner head signal');await sleep(500);
  });
  await phase('four additional clients: head listeners',async()=>{
   for(let i=1;i<5;i++)stops.push(clients[i].heads(scope,v=>{counts[i].heads++;counts[i].sequence=v.sequence;counts[i].access=v.access;}));
   await until(()=>counts.every(c=>c.heads>=1),'all five initial head snapshots');await sleep(500);
  });
  let initialPresenceWrites=0,heartbeatWrites=0;
  await phase('five clients: presence attach',async()=>{
   for(let i=0;i<5;i++){
    const stop=await clients[i].presence(scope,projectId,'audit-resource',i===0?'editing':'viewing',peers=>{if(i===0)peerMax=Math.max(peerMax,peers.length);});
    stops.push(stop);
   }
   await until(()=>meter.data.databaseSets>=5,'first five presence writes',20000);
   await until(()=>peerMax>=4,'owner sees all four peers',20000);
   initialPresenceWrites=meter.data.databaseSets;
  });
  const idleMs=Math.min(120000,Math.max(27000,Number(process.env.MILVAYO_IDLE_MS)||28000));
  await phase(`five clients: ${idleMs}ms idle with presence heartbeat`,async()=>{
   await sleep(idleMs);
   heartbeatWrites=meter.data.databaseSets-initialPresenceWrites;
   const PC=require('../../src/cloud/presenceCore.cjs'),minBeats=5*Math.floor((idleMs-PC.SWEEP_MS)/PC.HEARTBEAT_MS),maxBeats=5*(Math.floor(idleMs/PC.HEARTBEAT_MS)+1);
   assert.ok(heartbeatWrites>=minBeats&&heartbeatWrites<=maxBeats,`Expected between ${minBeats} and ${maxBeats} heartbeat writes (${PC.HEARTBEAT_MS/1000} s heartbeat, ${idleMs} ms window), observed ${heartbeatWrites}`);
  });
  await phase('one task edit: RTDB change signal delivery',async()=>{
   const before=counts.map(x=>x.heads);
   const pull=await H.request(owner,{...scope,action:'pull',cursor:0});
   const task=pull.records.find(r=>r.kind==='tasks'&&!r.deleted);assert.ok(task,'No task for change-signal test');
   await H.request(owner,{...scope,action:'commit',mutationId:crypto.randomUUID(),changes:[{key:task.key,before:task,after:{...task,data:{...task.data,title:'RTDB signal audit '+Date.now()}},baseRevision:task.revision}]});
   await until(()=>counts.every((x,i)=>x.heads>before[i]),'all five heads updated after task edit',20000);
  });
  await phase('all clients: unsubscribe and clean presence',async()=>{for(let i=stops.length-1;i>=0;i--)await stops[i]();stops.length=0;});
  report.verification.maxPeers=peerMax;report.verification.initialPresenceWrites=initialPresenceWrites;
  report.verification.heartbeatWrites=heartbeatWrites;report.verification.changeReceivedByAll=true;
  report.verification.clientMetrics=compactMetrics(clients);report.verification.listenerErrors=meter.errors.length;
  assert.equal(meter.errors.length,0,'RTDB permission or listener error');
  report.status='PASS';
 }catch(e){report.status='FAIL';report.failure={message:e.message,stack:String(e.stack||'').split('\n').slice(0,6).join('\n')};process.exitCode=1;console.error('[RTDB] FAIL',e);}
 finally{
  for(let i=stops.length-1;i>=0;i--)try{await stops[i]();}catch(e){report.errors.push({category:'cleanup',message:e.message});}
  for(const c of clients)try{await c.close();}catch(e){report.errors.push({category:'clientClose',message:e.message});}
  report.errors.push(...meter.errorSummary());
  report.totals=meter.snapshot();
  fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
  const md=out.replace(/\.json$/i,'.md');fs.writeFileSync(md,markdown(report));
  console.log('[RTDB] Report:',out,'Status:',report.status);console.log('[RTDB] Markdown:',md);
  console.log('[RTDB] Summary:',JSON.stringify({auth:meter.data.authSignIns,listeners:CATS.reduce((sum,k)=>sum+meter.data[`${k}_listenersOpened`],0),events:CATS.reduce((sum,k)=>sum+meter.data[`${k}_events`],0),sets:meter.data.databaseSets,removes:meter.data.databaseRemoves,errors:report.errors.length}));
 }
}
main().catch(err=>{console.error(err);process.exitCode=1;});
