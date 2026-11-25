// /tests/cloud/queue-order.test.cjs
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
const canvasDomain=require('../../src/domain/canvas.cjs');
const stamp=()=>new Date().toISOString();
const canvasEdit=(person,command)=>person.edit(ws=>{const p=ws.projects[0],b=p.canvases[0];ws.projects[0]=canvasDomain.saveBoard(p,canvasDomain.changeBoard(b,command,stamp()),b.revision);});
const objectsOf=ws=>new Map(ws.projects[0].canvases[0].objects.map(o=>[o.id,o]));
const firstProject=h=>[...h.x.rows.values()].find(r=>r.kind==='projects'&&!r.deleted).projectId;
const serverObjects=h=>new Map([...h.x.rows.values()].filter(r=>r.kind==='canvas.objects'&&!r.deleted&&r.projectId===firstProject(h)).map(r=>[r.id,r.data]));
const serverConnectors=h=>[...h.x.rows.values()].filter(r=>r.kind==='canvas.connectors'&&!r.deleted&&r.projectId===firstProject(h));
const order=require('../../src/cloud/queueOrder.cjs');
const D=require('../../src/cloud/diagnostics.cjs');
// 0.8.29 (audit F1): one stuck edit must not freeze the edits behind it. These tests are Planner-tested level (fake in-memory cloud, fake clock).

// --- the ordering rule on its own ---
const rec=(kind,id,data={},extra={})=>({key:kind+'~'+id,kind,id,projectId:'p1',boardId:'',data,order:0,...extra});
const edit=(r,data)=>({key:r.key,before:r,after:{...r,data:{...r.data,...data}},baseRevision:1});
const create=r=>({key:r.key,before:null,after:r,baseRevision:0});
const remove=r=>({key:r.key,before:r,after:null,baseRevision:1});
let n=0;const item=(changes,over={})=>Object.freeze({id:'q'+(++n),status:'pending',attempts:0,nextAttempt:0,createdAt:n,changes,...over});
const conflict=changes=>item(changes,{status:'conflict',error:'Same field changed'});
const waiting=(changes)=>item(changes,{attempts:2,nextAttempt:5000});
const T1=rec('tasks','t1',{title:'one'}),T2=rec('tasks','t2',{title:'two'}),NOTE=rec('canvas.objects','n1',{x:1},{boardId:'b1'}),NOTE2=rec('canvas.objects','n2',{x:5},{boardId:'b1'});

test('an edit of another record passes a conflict; the conflict stays where it is',()=>{
 const q=[conflict([edit(T1,{title:'x'})]),item([edit(T2,{title:'y'})]),item([edit(NOTE,{x:9})])];
 assert.deepEqual(order.classify(q,0),['conflict','ready','ready']);assert.equal(order.nextRunnable(q,0),q[1]);
});
test('a later edit of the SAME record stays behind the conflict (order of one record never changes)',()=>{
 const q=[conflict([edit(T1,{title:'x'})]),item([edit(T1,{priority:'High'})]),item([edit(T2,{title:'y'})])];
 assert.deepEqual(order.classify(q,0),['conflict','held','ready']);assert.equal(order.nextRunnable(q,0),q[2]);
});
test('a retry delay holds back only edits of the same record, not everything',()=>{
 const q=[waiting([edit(T1,{title:'x'})]),item([edit(T1,{priority:'High'})]),item([edit(T2,{title:'y'})])];
 assert.deepEqual(order.classify(q,0),['waiting','held','ready']);
 assert.deepEqual(order.classify(q,6000),['ready','ready','ready'],'when the delay is over the first edit is ready again and goes first');assert.equal(order.nextRunnable(q,6000),q[0]);
});
test('a connector waits for the note that is still stuck; a comment waits for its stuck task; edits elsewhere do not',()=>{
 const connector=rec('canvas.connectors','e1',{from:'n1',to:'n2'},{boardId:'b1'}),comment=rec('comments','c1',{taskId:'t9',body:'hi'}),T9=rec('tasks','t9',{title:'nine'});
 const q=[conflict([create(NOTE)]),item([create(connector)]),conflict([create(T9)]),item([create(comment)]),item([edit(T2,{title:'y'})])];
 assert.deepEqual(order.classify(q,0),['conflict','held','conflict','held','ready']);
});
test('a delete that is stuck holds back edits that point at the deleted record',()=>{
 const T3=rec('tasks','t3',{title:'three',dependencies:['t1']});
 const q=[conflict([remove(T1)]),item([edit(T3,{title:'3b'})]),item([edit(T2,{title:'y'})])];
 // T3 refers to t1, and the delete of t1 is stuck, so T3's edit waits. Task t2 has nothing to do with it and goes ahead.
 assert.deepEqual(order.classify(q,0),['conflict','held','ready']);
});
test('a later delete or create does not run ahead of an earlier stuck edit that points at that record',()=>{
 const connector=rec('canvas.connectors','e1',{from:'n1',to:'n2'},{boardId:'b1'});
 const q=[conflict([edit(connector,{label:'x'})]),item([remove(NOTE)]),item([remove(NOTE2)]),item([edit(T2,{title:'y'})])];
 assert.deepEqual(order.classify(q,0),['conflict','held','held','ready']);
});
test('a plain edit of a stuck record does not hold back an edit that merely mentions it',()=>{
 const T3=rec('tasks','t3',{title:'three',dependencies:['t1']});
 const q=[conflict([edit(T1,{title:'x'})]),item([edit(T3,{title:'3b'})])];
 assert.deepEqual(order.classify(q,0),['conflict','ready'],'only creating or deleting t1 creates a dependency');
});
test('a stuck project create or delete holds back every edit inside that project',()=>{
 const P=rec('projects','p1',{name:'P'},{projectId:'p1'}),other=rec('tasks','t5',{title:'five'},{projectId:'p2'});
 const q=[conflict([create(P)]),item([edit(T2,{title:'y'})]),item([edit(other,{title:'z'})])];
 assert.deepEqual(order.classify(q,0),['conflict','held','ready']);
});
test('queued chat messages keep their order; they do not wait for record edits and edits do not wait for them',()=>{
 const m1=item([],{request:{action:'message',body:'a'},status:'conflict'}),m2=item([],{request:{action:'message',body:'b'}}),e=item([edit(T2,{title:'y'})]);
 assert.deepEqual(order.classify([m1,m2,e],0),['conflict','held','ready']);
});
test('with nothing ready the answer is nothing; the first edit is never held; an empty queue is fine',()=>{
 assert.equal(order.nextRunnable([],0),null);assert.equal(order.nextRunnable([conflict([edit(T1,{title:'x'})]),item([edit(T1,{priority:'High'})])],0),null);
 assert.deepEqual(order.classify([item([edit(T1,{title:'x'})])],0),['ready']);
});

// --- the real session, two people, a real conflict ---
async function conflictOnFirstTask(h,alice,bob){
 const id=firstTask(alice.workspace).id;
 await alice.edit(ws=>{firstTask(ws).title='Alice title';});await bob.edit(ws=>{firstTask(ws).title='Bob title';});await bob.session.syncNow();await alice.session.syncNow();
 const d=alice.session.getDiagnostics();assert.equal(d.queue.head.status,'conflict','setup: a real conflict');return id;
}
test('after a conflict on task X, a rename of task Y and a Canvas move still reach the cloud and the other person; X stays flagged',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const X=await conflictOnFirstTask(h,alice,bob),note=alice.workspace.projects[0].canvases[0].objects[0],Y=alice.workspace.projects[0].tasks[1].id;
 await alice.edit(ws=>{ws.projects[0].tasks[1].title='Y renamed';});await canvasEdit(alice,{type:'patch',id:note.id,patch:{x:note.x+21},bases:[{id:note.id,x:note.x,y:note.y,width:note.width,height:note.height}]});
 await alice.session.syncNow();
 assert.equal(h.x.task(Y).data.title,'Y renamed','the rename was sent');assert.equal(serverObjects(h).get(note.id).x,note.x+21,'the Canvas move was sent');
 const st=alice.session.getState(),d=alice.session.getDiagnostics();assert.equal(st.conflicts,1);assert.equal(d.queue.length,1,'only the conflict is left');assert.equal(d.queue.held,0);
 assert.equal(h.x.task(X).data.title,'Bob title','X was not overwritten');
 await h.pump();assert.equal(bob.workspace.projects[0].tasks[1].title,'Y renamed');assert.equal(objectsOf(bob.workspace).get(note.id).x,note.x+21);
 assert.match(D.formatStatus(d),/does not hold back edits to other records/);assert.doesNotMatch(D.formatStatus(d),/HELD:/);
});
test('a second edit of the same task X waits behind its conflict and is not sent; the status says it is held',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const X=await conflictOnFirstTask(h,alice,bob);alice.log.length=0;
 await alice.edit(ws=>{firstTask(ws).priority='Critical';});await alice.session.syncNow();
 assert.equal(h.x.task(X).data.priority!=='Critical',true,'not sent ahead of the conflict');assert.ok(!alice.actions().some(a=>a.startsWith('patch')),'no patch went out');
 const d=alice.session.getDiagnostics();assert.equal(d.queue.length,2);assert.equal(d.queue.held,1);assert.match(D.formatStatus(d),/HELD: 1 later edit/);
});
test('many independent edits behind one conflict all arrive, in order, and the other person converges on them',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 await conflictOnFirstTask(h,alice,bob);
 for(let i=2;i<6;i++)await alice.edit(ws=>{ws.projects[0].tasks[i].title='edited '+i;});
 await alice.session.syncNow();await h.pump();
 for(let i=2;i<6;i++)assert.equal(bob.workspace.projects[0].tasks[i].title,'edited '+i);
 assert.equal(alice.session.getDiagnostics().queue.length,1);
});

test('property: over 2,000 random queues the order of edits to one record never changes, and every sendable edit is eventually sent',()=>{
 let seed=12345;const rnd=m=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed%m;};
 const recs=['a','b','c','d','e'].map(id=>rec('tasks',id,{title:id}));
 for(let round=0;round<2000;round++){
  const q=[];for(let i=0,len=1+rnd(8);i<len;i++){const r=recs[rnd(recs.length)],kind=rnd(6);q.push(kind===0?conflict([edit(r,{title:'v'+i})]):kind===1?waiting([edit(r,{title:'v'+i})]):item([edit(r,{title:'v'+i})]));}
  const live=[...q],sent=[];
  for(let guard=0;guard<50;guard++){const next=order.nextRunnable(live,0);if(!next)break;const at=live.indexOf(next);
   for(const earlier of live.slice(0,at))assert.ok(!earlier.changes.some(c=>c.key===next.changes[0].key),'an earlier edit of the same record is still waiting');
   sent.push(next);live.splice(at,1);}
  const stuck=live.filter(x=>x.status==='conflict');for(const x of live)assert.ok(x.status==='conflict'||x.nextAttempt>0||live.some(e=>e!==x&&live.indexOf(e)<live.indexOf(x)&&e.changes[0].key===x.changes[0].key),'a ready edit was left behind for no reason');void stuck;
 }
});
