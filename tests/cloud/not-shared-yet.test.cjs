// /tests/cloud/not-shared-yet.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),{createRequire}=require('node:module'),crypto=require('node:crypto');
const {database,generate}=require('../helpers/cloud-fake.cjs'),S=require('../../src/cloud/schema.cjs'),model=require('../../src/domain/model.cjs');
// The real session (src/cloud/session.cjs) talking to the real v4 server code on the in-memory database, for two people. Only the Firebase client and the clock are replaced.
const OPTIONS={host:'127.0.0.1',email:'x',password:'x',orgId:'org',workspaceId:'main'};
function harness({tasks=12,projects=2}={}){
 const x=database(generate({tasks,objects:3,projects}),{protocol:4});x.grant('bob',{workspaceRole:'manager',projects:{}});
 const listeners=new Set(),headOf=id=>x.rtdb.nodes.get(`heads/org/main/${id}`)||{at:0,n:0};let offset=0;const intervals=[];
 class ClockDate extends Date{static now(){return Date.now()+offset;}constructor(...a){if(a.length)super(...a);else super(ClockDate.now());}}
 const file=path.resolve(__dirname,'../../src/cloud/session.cjs'),actual=createRequire(file),sessions=[];
 const person=uid=>{
  const log=[],storageData=new Map(),storage={getItem:async k=>storageData.get(k)||null,setItem:async(k,v)=>storageData.set(k,v),removeItem:async k=>storageData.delete(k)};
  let workspace=generate({tasks:1,objects:0,seed:1}),revoked=false;
  const client={config:{host:'127.0.0.1'},login:async()=>uid,publish:async()=>{},close:async()=>{},
   request:async body=>{if(body.action==='presenceAuthorize')return {};log.push(body);if(revoked)throw Object.assign(new Error('Revoked'),{code:'permission-denied'});return x.service.execute(uid,JSON.parse(JSON.stringify(body)));},
   projectHeads:(_scope,ids,onHead,onLive)=>{const l={ids,onHead};listeners.add(l);onLive(true);for(const id of ids)onHead(id,headOf(id));return()=>listeners.delete(l);}};
  const module={exports:{}};
  vm.runInNewContext(fs.readFileSync(file,'utf8'),{module,exports:module.exports,require:id=>id==='./client'?{createEmulatorClient:async()=>client}:id==='expo-crypto'?{randomUUID:crypto.randomUUID}:actual(id),setInterval:fn=>{intervals.push(fn);return intervals.length;},clearInterval(){},Date:ClockDate});
  const session=module.exports.createCloudSession({storage,getWorkspace:()=>workspace,getLocalId:()=>'main',applyRemote:async(next)=>{workspace=next;}});
  const me={session,log,storage,storageData,get workspace(){return workspace;},set workspace(v){workspace=v;},set revoked(v){revoked=v;},
   actions:()=>log.map(b=>b.action+(b.projectId?':'+b.projectId:'')),
   edit:async fn=>{const next=structuredClone(workspace);fn(next);workspace=next;await session.capture(next);},
   connect:()=>session.connect({...OPTIONS})};
  sessions.push(me);return me;
 };
 const settle=async()=>{for(let i=0;i<12;i++)await new Promise(r=>setImmediate(r));};
 // A moved signal wakes the listeners; the 5-second poll timer then runs the pull, exactly as on a device.
 const pump=async()=>{for(const l of [...listeners])for(const id of l.ids)l.onHead(id,headOf(id));await settle();for(const fn of intervals.slice())fn();await settle();};
 const advance=async ms=>{offset+=ms;for(const fn of intervals.slice())fn();await settle();};
 const live=()=>new Map([...x.rows.entries()].filter(([k,v])=>k.startsWith(x.root+'/records/')&&!v.deleted).map(([,v])=>[v.key,S.stable(v.data)]));
 const view=ws=>new Map(S.pack(ws).map(r=>[r.key,S.stable(r.data)]));
 return {x,person,pump,advance,settle,live,view,headOf};
}
const firstTask=ws=>ws.projects[0].tasks[0];
const converged=(h,...people)=>{const server=h.live();for(const p of people)assert.deepEqual(h.view(p.workspace),server);};
const {isGone}=require('../../src/cloud/conflictGone.cjs');
const D=require('../../src/cloud/diagnostics.cjs');
// 0.8.30 (audit F2): a conflict on a record that someone else deleted can be cleared with "Keep cloud version". Planner-tested level (fake in-memory cloud).

// --- when does a record count as deleted? ---
const rec=(kind,id,over={})=>({key:kind+'~'+id,kind,id,projectId:'p1',boardId:'',data:{title:id},order:0,revision:3,...over});
const T=rec('tasks','t1'),P=rec('projects','p1',{projectId:'p1'});
const edit=r=>({key:r.key,before:r,after:{...r,data:{...r.data,title:'mine'}},baseRevision:3});
test('deleted: the cloud has no live copy, the project is readable, and there is a marker or a "deleted" refusal',()=>{
 assert.equal(isGone(edit(T),{error:''},[P],[{...T,deleted:true}]),true,'this device holds the deleted marker');
 assert.equal(isGone(edit(T),{error:'Deleted records require an explicit authorized restore'},[P],[]),true,'the server said so');
});
test('not deleted: still in the cloud, a create, no evidence, or the project is no longer readable (access change)',()=>{
 assert.equal(isGone(edit(T),{error:'deleted'},[P,T],[]),false,'a live copy exists');
 assert.equal(isGone({key:T.key,before:null,after:T,baseRevision:0},{error:'deleted'},[P],[{...T,deleted:true}]),false,'a create is never "deleted"');
 assert.equal(isGone(edit(T),{error:'Same field changed'},[P],[]),false,'missing without any evidence of deletion');
 assert.equal(isGone(edit(T),{error:'Deleted records require an explicit authorized restore'},[],[{...T,deleted:true}]),false,'project not readable: that is access, not deletion');
 assert.equal(isGone(edit(T),{error:'Project access was revoked'},[P],[]),false);
});

// --- the real session: Bob deletes a task while Alice has an unsent edit on it ---
const B=require('../../src/cloud/syncBanner.cjs');
// Planner-tested only. A project rename is a change the v4 cloud cannot take yet (v4Writes.cjs: "this kind of record"); the example was a Canvas board rename until 0.8.41 made that one shareable.
const rename=(ws,title)=>{ws.projects[0].name=title;};
const cloudTitle=(h,id)=>h.x.task(id).data.title;
test('D1: a change the cloud cannot take yet stays on this device, is labelled "not shared yet", is not a conflict and sends nothing',async()=>{
 const h=harness(),alice=h.person('alice');await alice.connect();await h.settle();alice.log.length=0;
 await alice.edit(ws=>rename(ws,'Renamed board'));await alice.session.syncNow();
 const st=alice.session.getState();assert.equal(st.local,1);assert.equal(st.conflicts,0);assert.equal(st.waiting,0);assert.equal(st.pending,1);
 assert.equal(alice.workspace.projects[0].name,'Renamed board','still shown on this device');
 assert.equal(B.describe(st).line,'0 waiting · 0 need review · 1 not shared yet');assert.equal(B.describe(st).banner,null,'nothing to decide, no review banner');assert.match(B.describe(st).notice,/1 change stays on this device only/);
 assert.deepEqual((await alice.session.loadConflicts()).conflicts,[],'it is not in the conflict list');
 assert.ok(!alice.actions().some(a=>a.startsWith('commit')||a.startsWith('patch')),'no request was made for it');
});
test('D1: it never blocks: a task rename made in the same edit still reaches the cloud, and later edits go out by themselves',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const id=firstTask(alice.workspace).id;
 await alice.edit(ws=>{rename(ws,'Renamed board');firstTask(ws).title='Task renamed too';});await h.advance(2000);
 assert.equal(cloudTitle(h,id),'Task renamed too','the supported part of the edit was split off and sent');
 assert.equal(alice.session.getState().local,1);assert.equal(alice.session.getState().waiting,0);
 await alice.edit(ws=>{firstTask(ws).title='Later edit';});await h.advance(2000);await h.pump();
 assert.equal(cloudTitle(h,id),'Later edit');assert.equal(bob.workspace.projects[0].tasks.find(t=>t.id===id).title,'Later edit');
 assert.notEqual(bob.workspace.projects[0].name,'Renamed board','the other device does not get the unshared rename');
});
test('D1: a second edit of the same record waits behind it and is also "not shared yet", so the counter does not wait forever',async()=>{
 const h=harness(),alice=h.person('alice');await alice.connect();await h.settle();
 await alice.edit(ws=>rename(ws,'First'));await alice.session.syncNow();await alice.edit(ws=>rename(ws,'Second'));await alice.session.syncNow();await h.advance(5000);
 const st=alice.session.getState();assert.equal(st.waiting,0,'no edit is stuck as "waiting"');assert.equal(st.conflicts,0);assert.equal(st.local,2);
 assert.equal(alice.workspace.projects[0].name,'Second');
});
test('D1: it survives a restart and gets one new try on the next connection; when it can be sent then, it goes out',async()=>{
 const h=harness(),alice=h.person('alice');await alice.connect();await h.settle();
 await alice.edit(ws=>rename(ws,'Kept'));await alice.session.syncNow();assert.equal(alice.session.getState().local,1);
 const exported=alice.session.getDiagnostics().queue;assert.equal(exported.local,1);
 await alice.session.disconnect();await alice.connect();await h.settle();
 assert.equal(alice.session.getState().local,1,'tried again, still not possible, kept again');assert.equal(alice.workspace.projects[0].name,'Kept','nothing lost');
});
test('Sync status shows the not-shared-yet count',async()=>{
 const h=harness(),alice=h.person('alice');await alice.connect();await h.settle();
 await alice.edit(ws=>rename(ws,'Kept'));await alice.session.syncNow();
 assert.match(require('../../src/cloud/diagnostics.cjs').formatStatus(alice.session.getDiagnostics()),/1 kept on this device \(not shared yet\)/);
});
test('a real conflict is still a conflict and is not mistaken for a kept change',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 await alice.edit(ws=>{firstTask(ws).title='Alice title';});await bob.edit(ws=>{firstTask(ws).title='Bob title';});await bob.session.syncNow();await alice.session.syncNow();
 const st=alice.session.getState();assert.equal(st.conflicts,1);assert.equal(st.local,0);assert.equal(B.describe(st).line,'0 waiting · 1 need review');
});
