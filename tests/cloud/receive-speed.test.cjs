// /tests/cloud/receive-speed.test.cjs
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
// Planner-tested only: the real session on an in-memory server with a fake clock. "Silent signal" = the test never calls pump(), so no change signal reaches the listener.
const titleOn=(p,id)=>p.workspace.projects[0].tasks.find(t=>t.id===id).title;
const change=async(p,h,text,id)=>{await p.edit(ws=>{ws.projects[0].tasks.find(t=>t.id===id).title=text;});await h.advance(2000);};
test('healthy signal: the other person gets the change at once, and no change is called "missed"',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const id=firstTask(alice.workspace).id;await change(alice,h,'Live',id);await h.pump();
 assert.equal(titleOn(bob,id),'Live');assert.equal(bob.session.getDiagnostics().signal.missedCount,0);assert.equal(bob.session.getDiagnostics().signalDistrusted,false);
});
test('silent signal: the safety check now finds the change within about a minute (before: up to 5 minutes)',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const id=firstTask(alice.workspace).id;await change(alice,h,'Quiet',id);
 await h.advance(20000);assert.notEqual(titleOn(bob,id),'Quiet','not yet: the check is every 60 s');
 await h.advance(45000);assert.equal(titleOn(bob,id),'Quiet','found by the 60-second safety check');
 assert.equal(bob.session.getDiagnostics().signal.missedCount,1,'and it is counted as a change the signal missed');
});
test('two misses in a row: the signal is not trusted any more, Sync status says polling, and changes arrive within about 5 seconds',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const id=firstTask(alice.workspace).id;
 await change(alice,h,'One',id);await h.advance(65000);await change(alice,h,'Two',id);await h.advance(65000);
 const d=bob.session.getDiagnostics();assert.equal(d.signal.missedCount,2);assert.equal(d.signalDistrusted,true);assert.ok(d.checkEveryMs<=60000);
 assert.match(require('../../src/cloud/diagnostics.cjs').formatStatus(d),/polling \(the live signal missed changes 2 time/);
 await change(alice,h,'Three',id);await h.advance(6000);assert.equal(titleOn(bob,id),'Three','polling mode: a few seconds, not a minute');
});
test('when the signal announces a change again, trust comes back',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const id=firstTask(alice.workspace).id;
 await change(alice,h,'One',id);await h.advance(65000);await change(alice,h,'Two',id);await h.advance(65000);assert.equal(bob.session.getDiagnostics().signalDistrusted,true);
 await change(alice,h,'Announced',id);await h.pump();
 assert.equal(titleOn(bob,id),'Announced');assert.equal(bob.session.getDiagnostics().signalDistrusted,false);
});
test('my own sends never count as missed changes',async()=>{
 const h=harness(),alice=h.person('alice');await alice.connect();await h.settle();
 const id=firstTask(alice.workspace).id;await change(alice,h,'Mine',id);await h.advance(65000);await change(alice,h,'Mine again',id);await h.advance(65000);
 assert.equal(alice.session.getDiagnostics().signal.missedCount,0);assert.equal(alice.session.getDiagnostics().signalDistrusted,false);
});
