// /tests/cloud/diagnostics.test.cjs
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
const D=require('../../src/cloud/diagnostics.cjs');
// 0.8.28 diagnostics: measuring only. These tests are Planner-tested level (fake in-memory cloud, fake clock); they say nothing about the real live signal.

test('diagnostics start empty and count what the session does',async()=>{
 const h=harness(),alice=h.person('alice');await alice.connect();await h.settle();
 const d=alice.session.getDiagnostics();
 assert.equal(d.connected,true);assert.equal(d.protocol,4);assert.equal(d.signal.live,true);assert.ok(d.signal.values>0,'signal values were heard');assert.equal(d.signal.moved,0,'the first value of a project is not a change');
 assert.ok(d.receive.requests>=1&&d.tick.count>=1);assert.equal(d.queue.length,0);assert.equal(d.queue.head,null);assert.equal(d.send.tries,0);
 assert.match(D.formatStatus(d),/Live signal: YES/);
});
test('a send is counted and timed; a changed signal is counted as a change',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 await alice.edit(ws=>{firstTask(ws).title='Counted';});await alice.session.syncNow();
 const a=alice.session.getDiagnostics();assert.ok(a.send.ok>=1&&a.send.lastOkAt>0&&a.send.failed===0);assert.equal(a.queue.length,0);
 await h.pump();const b=bob.session.getDiagnostics();assert.ok(b.signal.moved>=1,'bob heard a change');assert.ok(b.receive.lastChangedAt>0,'bob received records');assert.equal(firstTask(bob.workspace).title,'Counted');
});
test('diagnostics change nothing: the same requests go out with and without reading them',async()=>{
 const h=harness(),alice=h.person('alice');await alice.connect();await h.settle();alice.log.length=0;
 await alice.edit(ws=>{firstTask(ws).title='Same';});alice.session.getDiagnostics();await alice.session.syncNow();alice.session.getDiagnostics();
 assert.deepEqual(alice.actions().filter(a=>a.startsWith('patch')).length,1);assert.equal(h.x.task(firstTask(alice.workspace).id).data.title,'Same');converged(h,alice);
});
test('compare: equal right after connecting; different when the other person changed something this device has not pulled',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const same=await alice.session.compare();assert.equal(same.allSame,true);assert.equal(same.queued,0);assert.ok(same.rows.find(r=>r.kind==='tasks').device>0);
 await bob.edit(ws=>{firstTask(ws).title='Bob only';});await bob.session.syncNow();
 const diff=await alice.session.compare(),tasks=diff.rows.find(r=>r.kind==='tasks');
 assert.equal(diff.allSame,false);assert.equal(tasks.same,false);assert.deepEqual(tasks.different,[firstTask(bob.workspace).id]);assert.notEqual(tasks.deviceHash,tasks.cloudHash);
 const text=D.formatCompare(diff);assert.match(text,/RESULT: DIFFERENT/);assert.match(text,/same id, different content/);
 await h.pump();assert.equal((await alice.session.compare()).allSame,true,'after the pull they match again');
});
test('compare lists Canvas object IDs on both sides and reports an object only one side has',async()=>{
 const h=harness({tasks:2,projects:1}),alice=h.person('alice');await alice.connect();await h.settle();
 const res=await alice.session.compare(),objects=res.rows.find(r=>r.kind==='canvas.objects');
 assert.ok(objects&&objects.device>0&&objects.deviceIds.length===objects.device&&objects.cloudIds.length===objects.cloud);
 const device=S.pack(alice.workspace),extra=structuredClone(device.find(r=>r.kind==='canvas.objects'));extra.id='note-only-here';extra.key=S.keyOf(extra.kind,extra.projectId,extra.id,extra.boardId);
 const out=D.compareRecords([...device,extra],device.filter(r=>!r.deleted));assert.deepEqual(out.rows.find(r=>r.kind==='canvas.objects').onlyDevice,['note-only-here']);assert.equal(out.allSame,false);
});
test('a Canvas board differing only in local bookkeeping counts as the same',()=>{
 const board={key:'k',kind:'canvases',id:'b',order:0,data:{title:'T',revision:1,updatedAt:'a',viewport:{x:0}}},other={...board,data:{title:'T',revision:9,updatedAt:'b',viewport:{x:5}}};
 assert.equal(D.compareRecords([board],[other]).allSame,true);assert.equal(D.compareRecords([board],[{...other,data:{...other.data,title:'Changed'}}]).allSame,false);
});
test('status shows a conflict at the head without claiming it blocks other edits (0.8.29)',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const id=firstTask(alice.workspace).id;
 await alice.edit(ws=>{firstTask(ws).title='Alice title';});
 await bob.edit(ws=>{firstTask(ws).title='Bob title';});await bob.session.syncNow();
 await alice.session.syncNow();
 await alice.edit(ws=>{ws.projects[0].tasks[1].title='Another task';});await alice.session.syncNow();
 const d=alice.session.getDiagnostics();
 assert.equal(d.queue.head.status,'conflict');assert.equal(d.queue.length,1,'the unrelated edit was sent, only the conflict is left');assert.ok(d.queue.head.touches.some(t=>t.endsWith(':'+id)));
 const text=D.formatStatus(d);assert.match(text,/need review/);assert.match(text,/does not hold back edits to other records/);
 assert.equal(h.x.task(alice.workspace.projects[0].tasks[1].id).data.title,'Another task');
});
test('signal problems are explained: connection down vs unreadable project',()=>{
 const diag=D.createDiagnostics();diag.signalState(false,{connected:false,unreadable:[]});
 const base={at:Date.now(),connected:true,protocol:4,visible:true,checkEveryMs:60000,nextCheckInMs:1000,lastDrainAt:0,syncIntervalMs:45000,queue:null,...diag.snapshot()};
 assert.match(D.formatStatus(base),/Live signal: NO[\s\S]*connection is down[\s\S]*Mode: polling/);
 diag.signalState(false,{connected:true,unreadable:[{id:'p1',code:'PERMISSION_DENIED'}]});
 assert.match(D.formatStatus({...base,...diag.snapshot()}),/cannot read 1 project signal\(s\): p1 \[PERMISSION_DENIED\]/);
});
