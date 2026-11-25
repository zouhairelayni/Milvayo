// /tests/cloud/send-soon.test.cjs
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
const canvasDomain=require('../../src/domain/canvas.cjs');
const stamp=()=>new Date().toISOString();
const canvasEdit=(person,command)=>person.edit(ws=>{const p=ws.projects[0],b=p.canvases[0];ws.projects[0]=canvasDomain.saveBoard(p,canvasDomain.changeBoard(b,command,stamp()),b.revision);});
// Planner-tested only: the real session on an in-memory server with a fake clock, not two real devices.
test('an edit leaves the device about 1.5 s later by itself: no syncNow, no 45-second wait',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const id=firstTask(alice.workspace).id;
 await alice.edit(ws=>{firstTask(ws).title='Sent soon';});
 await h.advance(500);assert.notEqual(h.x.task(id).data.title,'Sent soon','not yet: it waits briefly so quick edits can group');
 await h.advance(1500);assert.equal(h.x.task(id).data.title,'Sent soon','it is in the cloud without any button');
 assert.equal(alice.session.getState().waiting,0);assert.ok(alice.session.getDiagnostics().send.quick>=1);
 await h.pump();assert.equal(bob.workspace.projects[0].tasks.find(t=>t.id===id).title,'Sent soon','the other person gets it through the normal signal');converged(h,alice,bob);
});
test('a burst of edits is grouped into the one send and the final value wins',async()=>{
 const h=harness(),alice=h.person('alice');await alice.connect();await h.settle();
 const id=firstTask(alice.workspace).id,before=alice.session.getDiagnostics().send.quick;
 for(let n=0;n<8;n++){await alice.edit(ws=>{firstTask(ws).title='Typing '+n;});await h.advance(100);}
 await h.advance(2000);
 assert.equal(h.x.task(id).data.title,'Typing 7');assert.equal(alice.session.getDiagnostics().send.quick-before,1,'one quick send for the whole burst');
});
test('later edits do not postpone the send: it is due 1.5 s after the FIRST unsent edit',async()=>{
 const h=harness(),alice=h.person('alice');await alice.connect();await h.settle();
 const id=firstTask(alice.workspace).id;
 await alice.edit(ws=>{firstTask(ws).title='First';});await h.advance(1000);
 await alice.edit(ws=>{firstTask(ws).title='Second';});await h.advance(700);
 assert.equal(h.x.task(id).data.title,'Second','the timer from the first edit fired and carried the second edit too');
});
test('a Canvas move and a task reorder also go out by themselves',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const ob=alice.workspace.projects[0].canvases[0].objects[0];
 await canvasEdit(alice,{type:'move',ids:[ob.id],dx:40,dy:25});
 await alice.edit(ws=>{ws.projects[0].tasks[0].priority='Critical';});
 await h.advance(2000);await h.pump();
 assert.equal(h.x.task(firstTask(alice.workspace).id).data.priority,'Critical');
 assert.equal(alice.session.getState().waiting,0);
 const objs=ws=>new Map(ws.projects[0].canvases[0].objects.map(o=>[o.id,[o.x,o.y]]));assert.deepEqual(objs(bob.workspace),objs(alice.workspace),'the other person sees the same Canvas positions');
 assert.deepEqual(objs(alice.workspace).get(ob.id),[ob.x+40,ob.y+25]);
});
test('an edit that is stuck behind a conflict does not start a quick-send loop',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 await alice.edit(ws=>{firstTask(ws).title='Alice title';});await bob.edit(ws=>{firstTask(ws).title='Bob title';});await bob.session.syncNow();await alice.session.syncNow();
 assert.equal(alice.session.getState().conflicts,1);
 const quick=alice.session.getDiagnostics().send.quick;
 await alice.edit(ws=>{firstTask(ws).priority='High';});// same task: held behind the conflict
 await h.advance(5000);
 assert.equal(alice.session.getDiagnostics().send.quick,quick,'nothing was ready, so no quick send was scheduled');
 assert.equal(alice.session.getDiagnostics().queue.held,1);
});
test('after disconnect nothing is sent by the quick timer',async()=>{
 const h=harness(),alice=h.person('alice');await alice.connect();await h.settle();
 const id=firstTask(alice.workspace).id;
 await alice.edit(ws=>{firstTask(ws).title='Late';});await alice.session.disconnect();
 await h.advance(5000);assert.notEqual(h.x.task(id).data.title,'Late','the edit stays in the journal; it was not sent after disconnect');
});
