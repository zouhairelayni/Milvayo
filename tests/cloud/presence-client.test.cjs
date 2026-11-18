// /tests/cloud/presence-client.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),crypto=require('node:crypto');
const P=require('../../src/cloud/presenceCore.cjs');
// Runs the REAL presence() from src/cloud/client.js against a small in-memory Realtime Database that behaves like the SDK for the calls presence uses
// (child events, .info/connected, onDisconnect). It checks logic and traffic shape; the database RULES are checked in presence-rules.emulator.test.cjs.
const CLIENT=path.resolve(__dirname,'../../src/cloud/client.js');
function fakeDatabase(){
 const tree={},listeners=[],disconnects=new Map(),log={sets:[],removes:[],opened:{},closed:{},childEvents:[]};let connected=true,clock=0;
 const split=p=>p.split('/').filter(Boolean),get=p=>split(p).reduce((n,k)=>n==null?undefined:n[k],tree);
 const put=(p,v)=>{const ks=split(p),last=ks.pop(),parent=ks.reduce((n,k)=>(n[k]??={}),tree);if(v==null){delete parent[last];let n=tree,chain=[];for(const k of ks){chain.push([n,k]);n=n[k];}for(let i=chain.length-1;i>=0;i--){const [o,k]=chain[i];if(o[k]&&!Object.keys(o[k]).length)delete o[k];else break;}}else parent[last]=JSON.parse(JSON.stringify(v));};
 const snap=(key,val)=>({key,val:()=>val===undefined?null:JSON.parse(JSON.stringify(val))});
 function write(p,v){
  const copy=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v)),before=listeners.filter(l=>l.type!=='value').map(l=>[l,copy(get(l.path+'/'+(split(p).slice(split(l.path).length)[0]??'')))]);
  put(p,v);
  for(const [l,old] of before){
   if(!(p===l.path||p.startsWith(l.path+'/')))continue;const key=split(p).slice(split(l.path).length)[0];if(key===undefined)continue;const now=get(l.path+'/'+key);
   const type=old==null&&now!=null?'added':old!=null&&now==null?'removed':old!=null&&now!=null&&JSON.stringify(old)!==JSON.stringify(now)?'changed':null;
   if(type&&l.type===type){log.childEvents.push({type,key,path:l.path,listener:l.id});l.cb(snap(key,type==='removed'?old:now));}
  }
 }
 let ids=0;const on=(type,p,cb,cancel)=>{const l={type,path:p,cb,cancel,id:++ids};log.opened[type+':'+p]=(log.opened[type+':'+p]||0)+1;listeners.push(l);return {l};};
 const off=h=>{const i=listeners.indexOf(h.l);if(i>=0){listeners.splice(i,1);log.closed[h.l.type+':'+h.l.path]=(log.closed[h.l.type+':'+h.l.path]||0)+1;}};
 const api={
  getDatabase:()=>({}),connectDatabaseEmulator(){},serverTimestamp:()=>({'.sv':'timestamp'}),ref:(_db,p)=>({path:p,toString:()=>p}),
  set:async(r,v)=>{log.sets.push({path:r.path,value:v});write(r.path,v);},remove:async r=>{log.removes.push(r.path);write(r.path,null);},
  onDisconnect:r=>({remove:async()=>{disconnects.set(r.path,true);},cancel:async()=>{disconnects.delete(r.path);}}),
  onValue:(r,cb,cancel)=>{const h=on('value',r.path,cb,cancel);if(r.path==='.info/connected')cb(snap('connected',connected));else if(r.path==='.info/serverTimeOffset')cb(snap('serverTimeOffset',clock));return ()=>off(h);},
  onChildAdded:(r,cb,cancel)=>{const h=on('added',r.path,cb,cancel);const cur=get(r.path)||{};for(const [k,v] of Object.entries(cur))cb(snap(k,v));return ()=>off(h);},
  onChildChanged:(r,cb,cancel)=>{const h=on('changed',r.path,cb,cancel);return ()=>off(h);},
  onChildRemoved:(r,cb,cancel)=>{const h=on('removed',r.path,cb,cancel);return ()=>off(h);},
 };
 return {api,log,tree,get,write,listeners,
  setConnected(v){connected=v;for(const l of listeners.filter(l=>l.path==='.info/connected'))l.cb(snap('connected',v));},
  crash(){for(const p of disconnects.keys())write(p,null);disconnects.clear();},
  deny(){for(const l of [...listeners])if(l.path.startsWith('presence/'))l.cancel?.(Error('permission_denied'));},
  registered:()=>[...disconnects.keys()]};
}
function loadClient(fake,state){
 let code=fs.readFileSync(CLIENT,'utf8'),imports=0;
 code=code.replace(/^import\s*\{([^}]+)\}\s*from\s*'([^']+)'\s*;\s*$/gm,(l,names,spec)=>{imports++;return `const {${names}}=require(${JSON.stringify(spec)});`;}).replace(/^import\s*\*\s*as\s+Crypto\s+from\s+'expo-crypto'\s*;\s*$/gm,()=>{imports++;return `const Crypto=require('expo-crypto');`;}).replace('export async function createEmulatorClient','async function createEmulatorClient');
 assert.equal(imports,7,'client.js imports changed');
 const mod=new Module(CLIENT,module);mod.filename=CLIENT;mod.paths=Module._nodeModulePaths(path.dirname(CLIENT));const actual=mod.require.bind(mod);
 mod.require=id=>{
  if(id==='expo-crypto')return {randomUUID:crypto.randomUUID};
  if(id==='fflate')return {strToU8:s=>Buffer.from(s)};
  if(id==='firebase/app')return {initializeApp:()=>({}),deleteApp:async()=>{}};
  if(id==='firebase/auth')return {initializeAuth:()=>({currentUser:{uid:state.nextUid}}),inMemoryPersistence:{},connectAuthEmulator(){},signInWithEmailAndPassword:async()=>({user:{uid:state.nextUid}}),createUserWithEmailAndPassword:async()=>({user:{uid:state.nextUid}}),signOut:async()=>{}};
  if(id==='firebase/firestore')return {initializeFirestore:()=>({}),memoryLocalCache:()=>({}),connectFirestoreEmulator(){},terminate:async()=>{}};
  if(id==='firebase/storage')return {getStorage:()=>({}),connectStorageEmulator(){}};
  if(id==='firebase/functions')return {getFunctions:()=>({}),connectFunctionsEmulator(){}};
  if(id==='firebase/database')return fake.api;
  return actual(id);
 };
 mod._compile(code+'\nmodule.exports={createEmulatorClient};\n',CLIENT);return mod.exports.createEmulatorClient;
}
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
async function world(t,users){
 t.mock.timers.enable({apis:['setInterval','Date'],now:1700000000000});
 const fake=fakeDatabase(),state={nextUid:''},create=loadClient(fake,state),scope={orgId:'org1',workspaceId:'main'},people={};
 for(const u of users){state.nextUid=u;people[u]={client:await create('127.0.0.1'),seen:[],reports:0};}
 const join=async(u,{project='p1',resource='task:A',mode='viewing'}={})=>{const me=people[u];me.stop=await me.client.presence(scope,project,resource,mode,peers=>{me.reports++;me.seen=peers;});await flush();return me.stop;};
 const names=u=>people[u].seen.map(p=>p.uid+':'+p.state).sort();
 return {fake,people,join,names,scope,tick:async ms=>{for(let left=ms;left>0;left-=P.SWEEP_MS){t.mock.timers.tick(Math.min(P.SWEEP_MS,left));await flush();}}};
}
test('people on one resource see each other through per-person child events, at the per-resource path',async t=>{
 const w=await world(t,['me','ann','bob','eve']);
 await w.join('me');await w.join('ann',{mode:'editing'});await w.join('bob');await w.join('eve',{resource:'task:B'});
 assert.deepEqual(w.names('me'),['ann:editing','bob:viewing'],'only people on the same resource appear');
 assert.deepEqual(w.names('eve'),[],'a different resource is a different room');
 const written=w.fake.log.sets.map(s=>s.path);assert.equal(written.length,4);
 for(const p of written)assert.match(p,/^presence\/org1\/main\/p1\/[A-Za-z0-9_-]{22}\/(me|ann|bob|eve)\/[0-9a-f-]{36}$/);
 assert.equal(w.fake.listeners.filter(l=>l.path.startsWith('presence/')&&l.type==='value').length,0,'no whole-room listener is opened any more');
 assert.equal(w.fake.listeners.filter(l=>l.path.startsWith('presence/')).length,12,'three child listeners per open screen');
 for(const s of w.fake.log.sets){assert.deepEqual(Object.keys(s.value).sort(),['expiresAt','resource','state']);assert.ok(s.value.expiresAt<=Date.now()+P.MAX_TTL_MS,'stays under the database rule limit');}
});
test('one change reaches listeners as one small event for that person only (no whole-room snapshot)',async t=>{
 const w=await world(t,['me','ann','bob','cat']);for(const u of ['me','ann','bob','cat'])await w.join(u);
 const before=w.fake.log.childEvents.length;w.people.ann.stop.setState('typing');await flush();
 const events=w.fake.log.childEvents.slice(before);
 assert.equal(events.length,4,'one event per listening screen (including Ann\'s own)');assert.ok(events.every(e=>e.type==='changed'&&e.key==='ann'));
 assert.deepEqual(w.names('me'),['ann:typing','bob:viewing','cat:viewing']);
 const bytes=w.people.me.client.metrics().downloadPayloadBytes;w.people.bob.stop.setState('editing');await flush();
 const grew=w.people.me.client.metrics().downloadPayloadBytes-bytes;assert.ok(grew>0&&grew<200,`about one person's entry (${grew} bytes), not the whole room`);
});
test('a state change is published in place: same session entry, no new listeners, no teardown',async t=>{
 const w=await world(t,['me','ann']);await w.join('me');await w.join('ann');
 const opened=JSON.stringify(w.fake.log.opened),sessions=w.fake.log.sets.map(s=>s.path),before=w.fake.log.sets.length;
 w.people.ann.stop.setState('editing');await flush();w.people.ann.stop.setState('editing');await flush();
 assert.equal(w.fake.log.sets.length,before+1,'one write for the change, none for repeating the same state');
 assert.equal(w.fake.log.sets.at(-1).path,sessions[1],'same session path');assert.equal(JSON.stringify(w.fake.log.opened),opened,'no listener was opened or closed');
 assert.deepEqual(w.names('me'),['ann:editing']);
});
test('heartbeat: slow, only when due, always inside the rule limit; nothing is written while idle in between',async t=>{
 const w=await world(t,['me','ann']);await w.join('me');await w.join('ann');
 const start=w.fake.log.sets.length;
 await w.tick(P.HEARTBEAT_MS-P.SWEEP_MS);assert.equal(w.fake.log.sets.length,start,'nothing for the first 90 seconds');
 await w.tick(P.SWEEP_MS);assert.equal(w.fake.log.sets.length,start+2,'both people refresh once at 120 seconds');
 await w.tick(10*60000);const beats=w.fake.log.sets.length-start;assert.ok(beats<=2*6&&beats>=2*5,`about one write per person per two minutes (${beats} in 12 minutes for 2 people)`);
 for(const s of w.fake.log.sets)assert.ok(s.value.expiresAt<=Date.now()+P.MAX_TTL_MS);
 assert.deepEqual(w.names('me'),['ann:viewing'],'entries never lapse while people keep beating');
});
test('expired entries disappear by local time only, and the screen is told only when something changed',async t=>{
 const w=await world(t,['me']);await w.join('me');
 w.fake.write(`presence/org1/main/p1/${P.resourceKey('task:A')}/ghost/s1`,{state:'editing',resource:'task:A',expiresAt:Date.now()+45000});await flush();
 assert.deepEqual(w.names('me'),['ghost:editing']);const reports=w.people.me.reports,sets=w.fake.log.sets.length,events=w.fake.log.childEvents.length;
 await w.tick(30000);assert.equal(w.people.me.reports,reports,'unchanged room: no callback');
 await w.tick(30000);assert.deepEqual(w.names('me'),[],'the ghost expired');assert.equal(w.people.me.reports,reports+1);
 assert.equal(w.fake.log.childEvents.length,events,'no database event was needed');
});
test('a hidden screen removes my entry and stays silent; a visible screen publishes again',async t=>{
 const w=await world(t,['me','ann']);await w.join('me');await w.join('ann');assert.deepEqual(w.names('me'),['ann:viewing']);
 w.people.ann.stop.setVisible(false);await flush();assert.deepEqual(w.names('me'),[],'Ann left the room');
 const sets=w.fake.log.sets.length;await w.tick(10*60000);
 assert.ok(w.fake.log.sets.length>sets,'my own heartbeats continue');assert.ok(w.fake.log.sets.slice(sets).every(s=>s.path.includes('/me/')),'Ann wrote nothing while hidden');assert.deepEqual(w.names('me'),[],'and her entry stays removed');
 w.people.ann.stop.setVisible(true);await flush();assert.deepEqual(w.names('me'),['ann:viewing']);
 w.people.ann.stop.setVisible(true);await flush();assert.equal(w.fake.log.sets.filter(s=>s.path.includes('/ann/')).length,2,'repeating the same visibility writes nothing');
});
test('leaving cleans up everything: entry, disconnect hook, three listeners, and the shared clock listener only after the last session',async t=>{
 const w=await world(t,['me']);const a=await w.join('me',{resource:'task:A'}),b=await w.join('me',{resource:'task:B'});
 assert.equal(w.fake.log.opened['value:.info/serverTimeOffset'],1,'one server-clock listener for both screens of this client');
 assert.equal(w.fake.registered().length,2);
 await a();assert.equal(w.fake.listeners.some(l=>l.path==='.info/serverTimeOffset'),true,'still needed by the second screen');
 await b();await flush();assert.equal(w.fake.listeners.length,0,'nothing left open');assert.equal(w.fake.registered().length,0);assert.deepEqual(w.fake.tree.presence??{},{});assert.equal(w.people.me.client.metrics().activeSessions,0);
 await a();await b();assert.equal(w.fake.log.removes.length,2,'stopping twice is harmless');
});
test('a crash or lost connection removes the entry through the database disconnect hook; reconnecting registers it again and republishes',async t=>{
 const w=await world(t,['me','ann']);await w.join('me');await w.join('ann');
 w.fake.crash();await flush();assert.deepEqual(w.names('me'),[],'the database removed both entries');
 const sets=w.fake.log.sets.length;w.fake.setConnected(true);await flush();assert.equal(w.fake.log.sets.length,sets+2,'both screens publish again on reconnect');assert.deepEqual(w.names('me'),['ann:viewing']);assert.equal(w.fake.registered().length,2);
});
test('a denied listener is reported as an empty room instead of an error',async t=>{
 const w=await world(t,['me','ann']);await w.join('me');await w.join('ann');assert.deepEqual(w.names('me'),['ann:viewing']);
 w.fake.deny();await flush();assert.deepEqual(w.names('me'),[]);
});
test('a disconnected or hidden screen never writes',async t=>{
 const w=await world(t,['me']);w.fake.setConnected(false);await w.join('me');assert.equal(w.fake.log.sets.length,0,'not connected: nothing is written');
 w.fake.setConnected(true);await flush();assert.equal(w.fake.log.sets.length,1);
 w.people.me.stop.setVisible(false);await flush();assert.deepEqual(w.fake.tree.presence??{},{});await w.tick(5*60000);assert.equal(w.fake.log.sets.length,1);
});
