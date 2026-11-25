// /tests/cloud/deleted-conflict.test.cjs
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
async function deletedWhileEditing(h,alice,bob){
 const project=bob.workspace.projects[0],victim=project.tasks[2],id=victim.id;
 await alice.edit(ws=>{ws.projects[0].tasks.find(t=>t.id===id).title='Alice edit of a deleted task';});
 await bob.edit(ws=>{ws.projects[0]=model.deleteTaskWithLinks(ws.projects[0],id);});await bob.session.syncNow();
 assert.equal(h.x.task(id).deleted,true,'setup: the cloud has it deleted');
 await alice.session.syncNow();return id;
}
test('Alice edited a task that Bob deleted: it is a conflict, the screen data says the record is gone, and the counter shows it',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 await deletedWhileEditing(h,alice,bob);
 const d=alice.session.getDiagnostics(),review=await alice.session.loadConflicts();
 assert.equal(d.queue.head.status,'conflict');assert.equal(review.conflicts.length,1);assert.deepEqual(review.conflicts[0].gone,[true]);
});
test('"Keep my changes" on a deleted task is refused with a plain message and nothing changes',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const id=await deletedWhileEditing(h,alice,bob),review=await alice.session.loadConflicts(),q=review.conflicts[0];
 await assert.rejects(()=>alice.session.resolveConflict(q.id,'local',review.remote),/Someone deleted this record/);
 assert.equal(alice.session.getState().conflicts,1,'the conflict is still there');assert.equal(h.x.task(id).deleted,true,'the task stays deleted in the cloud');
});
test('"Keep cloud version" on a deleted task drops my edit, clears the conflict and the counter, keeps a copy for recovery, and the task stays deleted',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const id=await deletedWhileEditing(h,alice,bob),review=await alice.session.loadConflicts(),q=review.conflicts[0];
 await alice.session.resolveConflict(q.id,'remote',review.remote);
 const st=alice.session.getState(),d=alice.session.getDiagnostics();
 assert.equal(st.pending,0,'the counter drops');assert.equal(st.conflicts,0);assert.equal(d.queue.length,0);
 assert.ok(!alice.workspace.projects[0].tasks.some(t=>t.id===id),'the task is gone on Alice\'s screen too');
 assert.equal(h.x.task(id).deleted,true,'nothing was restored or overwritten in the cloud');
 const kept=alice.session.exportJournal().resolvedConflicts;assert.equal(kept.length,1);assert.equal(kept[0].discarded,true);assert.ok(kept[0].changes.some(c=>c.after&&c.after.data.title==='Alice edit of a deleted task'),'my edit is kept in the recovery export');
 assert.equal((await alice.session.loadConflicts()).conflicts.length,0);converged(h,alice,bob);
});
test('after dropping the deleted-task edit, other edits keep flowing and the two people end up equal',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 await deletedWhileEditing(h,alice,bob);
 await alice.edit(ws=>{ws.projects[0].tasks[0].title='Unrelated edit';});await alice.session.syncNow();
 assert.equal(alice.session.getDiagnostics().queue.length,1,'only the conflict is left, the unrelated edit went out');
 const review=await alice.session.loadConflicts();await alice.session.resolveConflict(review.conflicts[0].id,'remote',review.remote);
 await h.pump();assert.equal(alice.session.getState().pending,0);assert.equal(bob.workspace.projects[0].tasks[0].title,'Unrelated edit');converged(h,alice,bob);
});
test('an ordinary same-field conflict (not a deletion) still works as before: Keep cloud version, then the cloud value wins',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const id=firstTask(alice.workspace).id;
 await alice.edit(ws=>{firstTask(ws).title='Alice title';});await bob.edit(ws=>{firstTask(ws).title='Bob title';});await bob.session.syncNow();await alice.session.syncNow();
 const review=await alice.session.loadConflicts();assert.deepEqual(review.conflicts[0].gone,[false]);
 await alice.session.resolveConflict(review.conflicts[0].id,'remote',review.remote);
 assert.equal(alice.session.getState().conflicts,0);assert.equal(firstTask(alice.workspace).title,'Bob title');assert.equal(h.x.task(id).data.title,'Bob title');
});
test('status text still reports a conflict while the deleted-task conflict is open',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 await deletedWhileEditing(h,alice,bob);
 assert.match(D.formatStatus(alice.session.getDiagnostics()),/1 need review/);
});
