// /tests/cloud/restore-task.test.cjs
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
// 0.8.40: bring a deleted task back (owner approved 2026-11-23). Planner-tested: the real server code on the in-memory database, two different people.
async function deletedWhileEditing(h,alice,bob){
 const id=bob.workspace.projects[0].tasks[2].id;
 await alice.edit(ws=>{ws.projects[0].tasks.find(t=>t.id===id).title='Alice edit of a deleted task';});
 await bob.edit(ws=>{ws.projects[0]=model.deleteTaskWithLinks(ws.projects[0],id);});await bob.session.syncNow();
 assert.equal(h.x.task(id).deleted,true,'setup: the cloud has it deleted');
 await alice.session.syncNow();return id;
}
test('"Bring the task back" restores the deleted task WITH my edit, clears the conflict, and the other person sees it',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const id=await deletedWhileEditing(h,alice,bob),review=await alice.session.loadConflicts();
 assert.deepEqual(review.conflicts[0].gone,[true]);
 await alice.session.resolveConflict(review.conflicts[0].id,'restore',review.remote);
 const t=h.x.task(id);assert.ok(!t.deleted,'back in the cloud');assert.equal(t.data.title,'Alice edit of a deleted task','with my edit');
 assert.equal(t.data.parentId,'');assert.deepEqual(t.data.dependsOn,[],'old links are not brought back');
 const st=alice.session.getState();assert.equal(st.conflicts,0);assert.equal(st.pending,0);
 await h.advance(3000);await h.pump();await h.advance(65000);await h.pump();
 assert.ok(alice.workspace.projects[0].tasks.some(x=>x.id===id),'Alice sees it');assert.equal(bob.workspace.projects[0].tasks.find(x=>x.id===id)?.title,'Alice edit of a deleted task','Bob sees it');
 converged(h,alice,bob);
 assert.equal(alice.session.exportJournal().resolvedConflicts.length,1,'the original edit is kept in the recovery export');
});
test('a person who can edit but not restore (contributor) is refused and nothing changes',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');h.x.grant('carol',{workspaceRole:'contributor',projects:{}});
 await alice.connect();await bob.connect();await h.settle();
 const id=await deletedWhileEditing(h,alice,bob);const carol=h.person('carol');await carol.connect();
 await assert.rejects(()=>carol.session.request({action:'restoreTask',projectId:bob.workspace.projects[0].id,taskId:id,baseRevision:h.x.task(id).revision,opId:'carol-op-1'}),/outside the scoped grant|permission|unavailable/i);
 assert.equal(h.x.task(id).deleted,true);
});
test('restoring with a stale revision is refused (never overwrites); restoring twice with the same operation is safe',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const id=await deletedWhileEditing(h,alice,bob),pid=bob.workspace.projects[0].id,rev=h.x.task(id).revision;
 const stale=await bob.session.request({action:'restoreTask',projectId:pid,taskId:id,baseRevision:rev-1>0?rev-1:rev+5,opId:'op-stale'});
 assert.equal(stale.ok,false);assert.equal(stale.code,'conflict');assert.equal(h.x.task(id).deleted,true);
 const first=await bob.session.request({action:'restoreTask',projectId:pid,taskId:id,baseRevision:rev,opId:'op-1'});assert.equal(first.ok,true);
 const title=h.x.task(id).data.title;
 const again=await bob.session.request({action:'restoreTask',projectId:pid,taskId:id,baseRevision:rev,opId:'op-1'});assert.equal(again.ok,true);assert.equal(again.duplicate,true);
 assert.equal(h.x.task(id).revision,first.revision,'no second write');assert.equal(h.x.task(id).data.title,title);
});
test('without a snapshot the cloud\'s kept copy comes back; if someone already restored it, my restore does not drop my edit silently',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const id=await deletedWhileEditing(h,alice,bob),pid=bob.workspace.projects[0].id;
 const r=await bob.session.request({action:'restoreTask',projectId:pid,taskId:id,baseRevision:h.x.task(id).revision,opId:'op-bob'});assert.equal(r.ok,true);
 assert.ok(!h.x.task(id).deleted,'the kept copy is back');
 const review=await alice.session.loadConflicts();
 if(review.conflicts.length){await assert.rejects(()=>alice.session.resolveConflict(review.conflicts[0].id,'restore',review.remote),/already brought this task back|Only a deleted task|not seen the deletion/);assert.equal(alice.session.getState().conflicts,1,'her edit is still waiting, not dropped');}
});
test('only a deleted task can be brought back: other conflicts refuse the choice',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const id=bob.workspace.projects[0].tasks[0].id;
 await alice.edit(ws=>{ws.projects[0].tasks.find(t=>t.id===id).title='A';});await bob.edit(ws=>{ws.projects[0].tasks.find(t=>t.id===id).title='B';});await bob.session.syncNow();await alice.session.syncNow();
 const review=await alice.session.loadConflicts();
 await assert.rejects(()=>alice.session.resolveConflict(review.conflicts[0].id,'restore',review.remote),/Only a deleted task/);assert.equal(alice.session.getState().conflicts,1);
});
test('restore ONE task from a backup snapshot: back as a standalone task; a live task is never overwritten; a wrong-workspace backup is refused',async()=>{
 const {sha256}=require('js-sha256');
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const pid=bob.workspace.projects[0].id,id=bob.workspace.projects[0].tasks[2].id,scope=alice.session.getState().scope;
 const records=S.pack(alice.workspace),mk=(over={})=>({format:'milvayo.cloud.backup.v1',schema:S.SCHEMA||1,orgId:scope.orgId,workspaceId:scope.workspaceId,records,checksum:sha256(S.stable(records)),...over});
 await assert.rejects(()=>alice.session.restoreTaskFromBackup(mk(),id),/already exists/);
 await bob.edit(ws=>{ws.projects[0]=model.deleteTaskWithLinks(ws.projects[0],id);});await bob.session.syncNow();await h.pump();
 await assert.rejects(()=>alice.session.restoreTaskFromBackup(mk({workspaceId:'someone-elses'}),id),/backup of this cloud workspace/);
 const title=records.find(r=>r.kind==='tasks'&&r.id===id).data.title;
 await alice.session.restoreTaskFromBackup(mk(),id);
 const t=h.x.task(id);assert.ok(!t.deleted);assert.equal(t.data.title,title);assert.equal(t.data.parentId,'');assert.deepEqual(t.data.dependsOn,[]);
 await h.advance(3000);await h.pump();await h.advance(65000);await h.pump();
 assert.ok(bob.workspace.projects[0].tasks.some(x=>x.id===id),'Bob sees it again');converged(h,alice,bob);
});
