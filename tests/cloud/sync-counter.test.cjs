// /tests/cloud/sync-counter.test.cjs
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
// Planner-tested only: these run the real session and journal on an in-memory server, not two real devices.
test('plain words: waiting and need-review are shown separately, the banner only appears when something needs review',()=>{
 assert.equal(B.describe({connected:true,pending:0,waiting:0,conflicts:0}).line,'0 waiting · 0 need review');
 assert.equal(B.describe({connected:true,pending:0,waiting:0,conflicts:0}).banner,null);
 const d=B.describe({connected:true,pending:3,waiting:2,conflicts:1,reviewError:'Same field changed: compare'});
 assert.equal(d.line,'2 waiting · 1 need review');assert.match(d.banner.text,/^1 change needs your review: someone else changed the same thing\.$/);
 assert.match(B.describe({connected:true,pending:2,waiting:0,conflicts:2}).banner.text,/^2 changes need your review/);
 assert.equal(B.describe({connected:false,pending:1,waiting:0,conflicts:1}).banner,null,'no banner while disconnected');
 assert.equal(B.describe({connected:true,pending:5,conflicts:2}).waiting,3,'older state without "waiting" is derived');
});
test('reasons are plain; unknown server text is kept short; empty text still gives a reason',()=>{
 assert.equal(B.reasonOf('Record was deleted by someone'),'someone deleted this record');
 assert.equal(B.reasonOf('permission-denied'),'your access to it changed');
 assert.equal(B.reasonOf(''),'the cloud refused it');
 assert.ok(B.reasonOf('x'.repeat(500)).length<=100);
});
test('journal status: waiting excludes conflicts, pending is unchanged, and the first conflict reason is reported',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 await alice.edit(ws=>{firstTask(ws).title='Alice title';});await bob.edit(ws=>{firstTask(ws).title='Bob title';});await bob.session.syncNow();await alice.session.syncNow();
 let st=alice.session.getState();assert.equal(st.conflicts,1);assert.equal(st.pending,1);assert.equal(st.waiting,0);assert.ok(st.reviewError.length>0);
 assert.match(B.describe(st).banner.text,/1 change needs your review/);
 await alice.edit(ws=>{ws.projects[0].tasks[1].title='Other task';});
 st=alice.session.getState();assert.equal(st.waiting,1,'the unrelated edit is waiting to go out');assert.equal(st.conflicts,1);
 await alice.session.syncNow();await h.settle();
 st=alice.session.getState();assert.equal(st.waiting,0,'the unrelated edit was sent: waiting reaches 0 even though a conflict remains');assert.equal(st.conflicts,1);assert.equal(B.describe(st).line,'0 waiting · 1 need review');
});
test('after resolving the conflict, the line reads 0 waiting · 0 need review and the banner is gone',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 await alice.edit(ws=>{firstTask(ws).title='Alice title';});await bob.edit(ws=>{firstTask(ws).title='Bob title';});await bob.session.syncNow();await alice.session.syncNow();
 const review=await alice.session.loadConflicts();await alice.session.resolveConflict(review.conflicts[0].id,'remote',review.remote);await h.pump();
 const st=alice.session.getState(),d=B.describe(st);assert.equal(d.line,'0 waiting · 0 need review');assert.equal(d.banner,null);assert.equal(d.idle,true);
});
test('a conflict alone no longer keeps the fast 5-second retry loop running',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 await alice.edit(ws=>{firstTask(ws).title='Alice title';});await bob.edit(ws=>{firstTask(ws).title='Bob title';});await bob.session.syncNow();await alice.session.syncNow();
 assert.equal(alice.session.getState().conflicts,1);assert.ok(alice.session.getDiagnostics().checkEveryMs>5000,'with only a conflict left the next check is the normal one, not the 5-second loop');
});

// 0.8.38 (FIX-08): the sign-out-on-reload notice is plain words, says nothing is lost and tells the person what to do.
test('the sign in again notice says what happens and that nothing is lost',()=>{
 const {SIGN_IN_AGAIN}=require('../../src/cloud/syncBanner.cjs');
 assert.match(SIGN_IN_AGAIN,/Reloading the page or restarting the app signs you out/);
 assert.match(SIGN_IN_AGAIN,/Nothing is lost/);
 assert.match(SIGN_IN_AGAIN,/sign in again/);
});
