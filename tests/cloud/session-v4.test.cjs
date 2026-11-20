// /tests/cloud/session-v4.test.cjs
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

test('connecting to a v4 workspace reads the directory and each project feed, never the v3 pull',async()=>{
 const h=harness(),alice=h.person('alice');await alice.connect();
 const actions=alice.actions();assert.equal(actions[0],'directoryV4');assert.ok(actions.filter(a=>a.startsWith('pullV4')).length>=2);
 assert.ok(!actions.includes('pull')&&!actions.includes('commit'));assert.equal(alice.session.getState().connected,true);converged(h,alice);
});
test('an edit goes out as a patch, not a commit, and the cloud holds it',async()=>{
 const h=harness(),alice=h.person('alice');await alice.connect();alice.log.length=0;
 const target=firstTask(alice.workspace);await alice.edit(ws=>{firstTask(ws).title='Edited in v4';});await alice.session.syncNow();
 assert.ok(alice.actions().some(a=>a.startsWith('patch:')));assert.ok(!alice.actions().some(a=>a.startsWith('commit')));
 assert.equal(h.x.task(target.id).data.title,'Edited in v4');assert.equal(h.x.task(target.id).revision,2);assert.equal(alice.session.getState().pending,0);
 assert.ok(h.headOf(target.projectId||alice.workspace.projects[0].id).n>0,'the project signal moved');converged(h,alice);
});
test('a second person sees it after the project signal: one pull of that project, no directory call, nothing for other projects',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const project=alice.workspace.projects[0];bob.log.length=0;
 await alice.edit(ws=>{firstTask(ws).title='Seen by Bob';});await alice.session.syncNow();await h.pump();
 assert.equal(firstTask(bob.workspace).title,'Seen by Bob');assert.deepEqual(bob.actions(),['pullV4:'+project.id]);converged(h,alice,bob);
});
test('idle costs nothing: no requests while the signal is live, and one safety poll after five minutes',async()=>{
 const h=harness(),alice=h.person('alice');await alice.connect();await h.settle();alice.log.length=0;
 await h.advance(120000);await h.advance(120000);assert.deepEqual(alice.actions(),[],'four idle minutes, zero requests');
 await h.advance(120000);const a=alice.actions();assert.equal(a.filter(x=>x==='directoryV4').length,1);assert.ok(a.filter(x=>x.startsWith('pullV4')).length>=2,'the safety poll reads each project');
});
test('deleting a task deletes its cascade for everyone',async()=>{
 const h=harness({tasks:16}),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const project=alice.workspace.projects[0],victim=project.tasks.find(t=>project.tasks.some(o=>o.dependsOn.includes(t.id)))||project.tasks[0];
 await alice.edit(ws=>{const next=model.deleteTaskWithLinks(ws.projects[0],victim.id);ws.projects[0]=next;});await alice.session.syncNow();
 assert.equal(h.x.task(victim.id).deleted,true);assert.equal(alice.session.getState().pending,0);await h.pump();
 assert.ok(!bob.workspace.projects[0].tasks.some(t=>t.id===victim.id));converged(h,alice,bob);
});
test('edits to different fields of the same task from two people both survive; the same field becomes a conflict that keeps the loser\'s edit',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const id=firstTask(alice.workspace).id;
 await alice.edit(ws=>{ws.projects[0].tasks.find(t=>t.id===id).title='Alice title';});await bob.edit(ws=>{ws.projects[0].tasks.find(t=>t.id===id).priority='Critical';});
 await alice.session.syncNow();await bob.session.syncNow();await h.pump();
 assert.equal(h.x.task(id).data.title,'Alice title');assert.equal(h.x.task(id).data.priority,'Critical','both edits are in the cloud');assert.equal(bob.session.getState().pending,0);converged(h,alice,bob);
 await alice.edit(ws=>{ws.projects[0].tasks.find(t=>t.id===id).title='Alice again';});await bob.edit(ws=>{ws.projects[0].tasks.find(t=>t.id===id).title='Bob again';});
 await alice.session.syncNow();await bob.session.syncNow();
 const state=bob.session.getState();assert.equal(h.x.task(id).data.title,'Alice again','the server keeps the first writer');
 assert.equal(state.pending,1,'Bob\'s edit is kept, not discarded');assert.match(state.error||'',/same field|compare/i);
});
test('a change the v4 path cannot send yet is kept in the queue with a clear message and nothing is sent',async()=>{
 const h=harness(),alice=h.person('alice');await alice.connect();await h.settle();const before=h.live();alice.log.length=0;
 await alice.edit(ws=>{ws.projects[0].tasks.reverse();});await alice.session.syncNow();
 const state=alice.session.getState();assert.equal(state.pending,1);assert.match(state.error||'',/not available in v4 workspaces yet/);
 assert.ok(!alice.actions().some(a=>/^(patch|commit|patchDependencies|deleteTask|createTask)/.test(a)),'no half-sent change');assert.deepEqual(h.live(),before);
});
test('a dependency edit goes out as patchDependencies; the other person gets the same links, and removing it also converges',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();alice.log.length=0;
 const [a,b]=alice.workspace.projects[0].tasks;
 await alice.edit(ws=>{const p=ws.projects[0];ws.projects[0]=model.setTaskDependencies(p,b.id,[a.id]);});await alice.session.syncNow();
 assert.equal(alice.session.getState().pending,0);assert.ok(alice.actions().some(x=>x.startsWith('patchDependencies:')));assert.ok(!alice.actions().some(x=>x.startsWith('commit')));
 assert.deepEqual(h.x.task(b.id).data.dependsOn,[a.id]);await h.pump();converged(h,alice,bob);
 await alice.edit(ws=>{const p=ws.projects[0];ws.projects[0]=model.setTaskDependencies(p,b.id,[]);});await alice.session.syncNow();await h.pump();
 assert.deepEqual(h.x.task(b.id).data.dependsOn||[],[]);converged(h,alice,bob);
});
test('two people changing the same task\'s dependencies: the second becomes a conflict, nothing is overwritten',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const [a,b,c]=alice.workspace.projects[0].tasks;
 await alice.edit(ws=>{const p=ws.projects[0];ws.projects[0]=model.setTaskDependencies(p,b.id,[a.id]);});
 await bob.edit(ws=>{const p=ws.projects[0];ws.projects[0]=model.setTaskDependencies(p,b.id,[c.id]);});
 await alice.session.syncNow();await bob.session.syncNow();
 assert.deepEqual(h.x.task(b.id).data.dependsOn,[a.id],'the first writer wins');assert.equal(bob.session.getState().pending,1,'the second edit stays for review');
});
test('a dependency edit and an unrelated field edit in one queued change both arrive',async()=>{
 const h=harness(),alice=h.person('alice');await alice.connect();await h.settle();
 const [a,b]=alice.workspace.projects[0].tasks;
 await alice.edit(ws=>{const p=ws.projects[0];ws.projects[0]=model.setTaskDependencies(p,b.id,[a.id]);ws.projects[0].tasks.find(t=>t.id===b.id).title='Linked and renamed';});await alice.session.syncNow();
 assert.equal(alice.session.getState().pending,0);assert.equal(h.x.task(b.id).data.title,'Linked and renamed');assert.deepEqual(h.x.task(b.id).data.dependsOn,[a.id]);converged(h,alice);
});
test('Canvas: moving and deleting objects go out as patchCanvas and deleteCanvasObjects and the other person converges',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();alice.log.length=0;
 const board=()=>alice.workspace.projects[0].canvases[0],[first,second]=board().objects;
 await alice.edit(ws=>{ws.projects[0].canvases[0].objects.find(o=>o.id===first.id).x+=37;});await alice.session.syncNow();
 assert.equal(alice.session.getState().pending,0);assert.ok(alice.actions().some(a=>a.startsWith('patchCanvas:')));assert.ok(!alice.actions().some(a=>a.startsWith('commit')));
 await alice.edit(ws=>{const b=ws.projects[0].canvases[0];b.objects=b.objects.filter(o=>o.id!==second.id);b.connectors=(b.connectors||[]).filter(c=>c.from!==second.id&&c.to!==second.id);b.threads=(b.threads||[]).filter(t=>t.objectId!==second.id);});await alice.session.syncNow();
 assert.equal(alice.session.getState().pending,0);assert.ok(alice.actions().some(a=>a.startsWith('deleteCanvasObjects:')));
 await h.pump();assert.equal(bob.workspace.projects[0].canvases[0].objects.some(o=>o.id===second.id),false);converged(h,alice,bob);
});
test('moving a task in its list goes out as moveTask with a position between its neighbours; the other person sees the same order; twenty moves into the same gap stay valid',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();alice.log.length=0;
 const ids=()=>alice.workspace.projects[0].tasks.map(t=>t.id),moved=ids()[6];
 const move=to=>alice.edit(ws=>{const l=ws.projects[0].tasks,i=l.findIndex(t=>t.id===moved),[t]=l.splice(i,1);l.splice(to,0,t);});
 await move(1);await alice.session.syncNow();
 assert.equal(alice.session.getState().pending,0);assert.ok(alice.actions().some(a=>a.startsWith('moveTask:')));assert.ok(!alice.actions().some(a=>a.startsWith('commit')));
 const order=h.x.task(moved).order;assert.ok(order>0&&order<2&&!Number.isInteger(order),'between its new neighbours: '+order);
 await h.pump();assert.deepEqual(bob.workspace.projects[0].tasks.map(t=>t.id),ids());converged(h,alice,bob);
 for(let i=0;i<20;i++){await move(i%2?1:2);await alice.session.syncNow();}
 assert.equal(alice.session.getState().pending,0);await h.pump();assert.deepEqual(bob.workspace.projects[0].tasks.map(t=>t.id),ids());converged(h,alice,bob);
});
test('moving two tasks at once is kept in the queue with a clear message',async()=>{
 const h=harness(),alice=h.person('alice');await alice.connect();await h.settle();const before=h.live();alice.log.length=0;
 await alice.edit(ws=>{const l=ws.projects[0].tasks,a=l.splice(5,1)[0],b=l.splice(8,1)[0];l.unshift(a);l.splice(3,0,b);});await alice.session.syncNow();
 assert.equal(alice.session.getState().pending,1);assert.match(alice.session.getState().error||'',/not available in v4 workspaces yet/);assert.deepEqual(h.live(),before);
});
test('reconnecting resumes from the stored feed state: only newer changes are read, and edits made while away arrive',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();await alice.session.disconnect();
 const id=firstTask(bob.workspace).id;await bob.edit(ws=>{ws.projects[0].tasks.find(t=>t.id===id).title='While Alice was away';});await bob.session.syncNow();
 alice.log.length=0;await alice.connect();await h.settle();
 const pulls=alice.log.filter(b=>b.action==='pullV4');assert.ok(pulls.length>=2&&pulls.every(b=>Number.isSafeInteger(b.cursor)),'an incremental read from the stored cursors, not a full sync');
 assert.equal(h.x.task(id).data.title,'While Alice was away');assert.equal(alice.workspace.projects[0].tasks.find(t=>t.id===id).title,'While Alice was away');converged(h,alice,bob);
});
test('a journal left by the old v3 pull (no feed state, unrelated sequence numbers) is replaced by a full read instead of being trusted',async()=>{
 const h=harness(),alice=h.person('alice');await alice.connect();await h.settle();await alice.session.disconnect();
 const key=[...alice.storageData.keys()].find(k=>!k.includes(':part:')),stored=S.pack(alice.workspace).map(r=>({...r,revision:1,sequence:9999,deleted:false}));
 const stale=stored.map(r=>r.kind==='tasks'&&r.id===firstTask(alice.workspace).id?{...r,data:{...r.data,title:'Stale v3 title'}}:r);
 alice.storageData.set(key,JSON.stringify({schema:1,records:stale,local:stale.map(({key,kind,projectId,boardId,id,data,order})=>({key,kind,projectId,boardId,id,data,order})),queue:[],cursor:57,accessVersion:'old'}));
 await alice.connect();await h.settle();
 assert.notEqual(firstTask(alice.workspace).title,'Stale v3 title');converged(h,alice);
});
test('removing a person\'s access ends their session on the next read',async()=>{
 const h=harness(),bob=h.person('bob');await bob.connect();await h.settle();bob.revoked=true;await bob.session.tick();
 assert.equal(bob.session.getState().connected,true,'with a live signal and nothing marked, no request is made, so nothing notices yet');
 await h.advance(310000);assert.equal(bob.session.getState().connected,false,'the safety poll ends the session');
});
test('two people, random edits, creates, deletes and comments, with syncs in random order, end with identical workspaces equal to the cloud',async()=>{
 const h=harness({tasks:14,projects:2}),alice=h.person('alice'),bob=h.person('bob'),all=[alice,bob];await alice.connect();await bob.connect();await h.settle();
 // Seeded tasks are only edited; each person creates and deletes only their own tasks, so no edit races a delete (that case is a deliberate conflict, covered above).
 const seeded=alice.workspace.projects.map(p=>p.tasks.map(t=>t.id));
 let seed=83;const rnd=()=>{seed=(seed*1664525+1013904223)%4294967296;return seed/4294967296;},pick=a=>a[Math.floor(rnd()*a.length)];let created=0,done=0;
 for(let i=0;i<70;i++){
  const who=pick(all),mine=who===alice?'a':'b',pi=Math.floor(rnd()*2),roll=rnd(),own=ws=>ws.projects[pi].tasks.filter(t=>t.id.startsWith(mine+'-new-'));
  try{
   if(roll<.45)await who.edit(ws=>{const p=ws.projects[pi];p.tasks.find(t=>t.id===pick(seeded[pi])).title='T'+i;});
   else if(roll<.6)await who.edit(ws=>{ws.projects[pi].tasks.push(model.defaultTask({id:mine+'-new-'+(created++),title:'New '+i}));});
   else if(roll<.75&&own(who.workspace).length)await who.edit(ws=>{ws.projects[pi]=model.deleteTaskWithLinks(ws.projects[pi],pick(own(ws)).id);});
   else await who.edit(ws=>{ws.projects[pi].tasks.find(t=>t.id===pick(seeded[pi])).priority=pick(['Low','Medium','High','Critical']);});
   done++;
  }catch{/* a refused local edit is fine: only what was accepted has to converge */}
  if(rnd()<.5)await pick(all).session.syncNow();
  if(rnd()<.4)await h.pump();
 }
 for(let round=0;round<3;round++){for(const p of all)await p.session.syncNow();await h.pump();}
 assert.ok(done>40);
 for(const p of all)assert.equal(p.session.getState().pending,0,p.session.getState().error||'queue empty');
 converged(h,alice,bob);
});
// These tests use the app's own Canvas functions (changeBoard + saveBoard), which also rewrite the board record (revision counter, update time).
const canvasDomain=require('../../src/domain/canvas.cjs');
const stamp=()=>new Date().toISOString();
const canvasEdit=(person,command)=>person.edit(ws=>{const p=ws.projects[0],b=p.canvases[0];ws.projects[0]=canvasDomain.saveBoard(p,canvasDomain.changeBoard(b,command,stamp()),b.revision);});
const objectsOf=ws=>new Map(ws.projects[0].canvases[0].objects.map(o=>[o.id,o]));
const firstProject=h=>[...h.x.rows.values()].find(r=>r.kind==='projects'&&!r.deleted).projectId;
const serverObjects=h=>new Map([...h.x.rows.values()].filter(r=>r.kind==='canvas.objects'&&!r.deleted&&r.projectId===firstProject(h)).map(r=>[r.id,r.data]));
const serverConnectors=h=>[...h.x.rows.values()].filter(r=>r.kind==='canvas.connectors'&&!r.deleted&&r.projectId===firstProject(h));
test('real Canvas saves: move, layer and viewport work in a v4 workspace although the board record changes too; the board counter stays local',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();alice.log.length=0;
 const b0=alice.workspace.projects[0].canvases[0],o=b0.objects[0];
 await canvasEdit(alice,{type:'patch',id:o.id,patch:{x:o.x+11},bases:[{id:o.id,x:o.x,y:o.y,width:o.width,height:o.height}]});await alice.session.syncNow();
 assert.equal(alice.session.getState().pending,0,alice.session.getState().error);assert.ok(alice.actions().some(a=>a.startsWith('patchCanvas:')));assert.ok(!alice.actions().some(a=>a.startsWith('commit')));
 assert.equal(serverObjects(h).get(o.id).x,o.x+11);assert.equal(alice.workspace.projects[0].canvases[0].revision,b0.revision+1,'the app keeps its own counter');
 alice.log.length=0;await alice.edit(ws=>{const p=ws.projects[0];ws.projects[0]=canvasDomain.saveViewport(p,p.canvases[0].id,{x:5,y:6,scale:1.25},p.canvases[0].revision);});await alice.session.syncNow();
 assert.equal(alice.session.getState().pending,0);assert.deepEqual(alice.actions().filter(a=>!a.startsWith('pullV4')&&a!=='directoryV4'),[],'a viewport change sends nothing');
 await canvasEdit(alice,{type:'move',ids:[o.id],dx:3,dy:4,bases:[{id:o.id,x:o.x+11,y:o.y,width:o.width,height:o.height}]});await alice.session.syncNow();assert.equal(alice.session.getState().pending,0);
 await h.pump();assert.equal(objectsOf(bob.workspace).get(o.id).x,o.x+14);assert.equal(serverObjects(h).get(o.id).y,o.y+4);
});
test('real Canvas saves: a new note, a connector between two notes, and removing a note with its connector',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();alice.log.length=0;
 const board=alice.workspace.projects[0].canvases[0],first=board.objects[0].id;
 const note=canvasDomain.createObject({id:'new-note-1',boardId:board.id,type:'note',x:40,y:50,text:'Hello',now:stamp(),zIndex:50});
 await canvasEdit(alice,{type:'add',objects:[note]});await alice.session.syncNow();
 assert.equal(alice.session.getState().pending,0,alice.session.getState().error);assert.ok(alice.actions().some(a=>a.startsWith('createCanvasObject:')));assert.equal(serverObjects(h).get('new-note-1').text,'Hello');
 await canvasEdit(alice,{type:'connect',edge:{id:'edge-1',from:first,to:'new-note-1',label:'',style:'curve',arrow:true}});await alice.session.syncNow();
 assert.equal(alice.session.getState().pending,0,alice.session.getState().error);assert.ok(alice.actions().some(a=>a.startsWith('createCanvasConnector:')));assert.equal(serverConnectors(h).filter(r=>r.id==='edge-1').length,1);
 await h.pump();assert.ok(objectsOf(bob.workspace).has('new-note-1'));assert.ok(bob.workspace.projects[0].canvases[0].connectors.some(e=>e.id==='edge-1'));
 alice.log.length=0;await canvasEdit(alice,{type:'remove',ids:['new-note-1']});await alice.session.syncNow();
 assert.equal(alice.session.getState().pending,0,alice.session.getState().error);assert.ok(alice.actions().some(a=>a.startsWith('deleteCanvasObjects:')));
 assert.equal(serverObjects(h).has('new-note-1'),false);assert.equal(serverConnectors(h).filter(r=>r.id==='edge-1').length,0,'the connector went with its note (server cascade)');
 await h.pump();assert.ok(!objectsOf(bob.workspace).has('new-note-1'));assert.ok(!bob.workspace.projects[0].canvases[0].connectors.some(e=>e.id==='edge-1'));
});
test('real Canvas saves: a note and a connector created in one change are sent in the right order',async()=>{
 const h=harness(),alice=h.person('alice');await alice.connect();await h.settle();alice.log.length=0;
 const board=alice.workspace.projects[0].canvases[0];
 await alice.edit(ws=>{const p=ws.projects[0],b=p.canvases[0],n1=canvasDomain.createObject({id:'pair-a',boardId:b.id,x:0,y:0,now:stamp(),zIndex:60}),n2=canvasDomain.createObject({id:'pair-b',boardId:b.id,x:300,y:0,now:stamp(),zIndex:61});
  const next=canvasDomain.changeBoard(canvasDomain.changeBoard(b,{type:'add',objects:[n1,n2]},stamp()),{type:'connect',edge:{id:'pair-edge',from:'pair-a',to:'pair-b',label:'',style:'curve',arrow:true}},stamp());
  ws.projects[0]=canvasDomain.saveBoard(p,{...next,revision:b.revision+1},b.revision);});
 await alice.session.syncNow();assert.equal(alice.session.getState().pending,0,alice.session.getState().error);
 const sent=alice.actions().filter(a=>/^createCanvas/.test(a)).map(a=>a.split(':')[0]);assert.deepEqual(sent,['createCanvasObject','createCanvasObject','createCanvasConnector']);
 assert.equal(serverConnectors(h).filter(r=>r.id==='pair-edge').length,1);assert.ok(board);
});
test('real Canvas saves: editing text and colour, locking, editing a connector and removing it all reach the server and the other person',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();alice.log.length=0;
 const board=()=>alice.workspace.projects[0].canvases[0],o=board().objects[0],o2=board().objects[1],base=x=>[{id:x.id,x:x.x,y:x.y,width:x.width,height:x.height}];
 await canvasEdit(alice,{type:'patch',id:o.id,patch:{text:'Words on the note',color:'#336699'},bases:base(o)});await alice.session.syncNow();
 assert.equal(alice.session.getState().pending,0,alice.session.getState().error);assert.equal(serverObjects(h).get(o.id).text,'Words on the note');assert.equal(serverObjects(h).get(o.id).color,'#336699');
 await canvasEdit(alice,{type:'lock',id:o.id,locked:true});await alice.session.syncNow();assert.equal(alice.session.getState().pending,0,alice.session.getState().error);assert.equal(serverObjects(h).get(o.id).locked,true);
 await canvasEdit(alice,{type:'lock',id:o.id,locked:false});await alice.session.syncNow();assert.equal(serverObjects(h).get(o.id).locked,false);
 await canvasEdit(alice,{type:'connect',edge:{id:'edge-x',from:o.id,to:o2.id,label:'',style:'curve',arrow:true}});await alice.session.syncNow();
 await canvasEdit(alice,{type:'editConnector',id:'edge-x',patch:{label:'blocks',style:'elbow',color:'#445566'}});await alice.session.syncNow();
 assert.equal(alice.session.getState().pending,0,alice.session.getState().error);assert.ok(alice.actions().some(a=>a.startsWith('patchCanvasConnector:')));
 const edge=()=>serverConnectors(h).find(r=>r.id==='edge-x');assert.equal(edge().data.label,'blocks');assert.equal(edge().data.color,'#445566');
 await canvasEdit(alice,{type:'editConnector',id:'edge-x',patch:{color:''}});await alice.session.syncNow();assert.equal(alice.session.getState().pending,0,alice.session.getState().error);assert.equal('color' in edge().data,false);
 await h.pump();const theirs=bob.workspace.projects[0].canvases[0];assert.equal(theirs.objects.find(x=>x.id===o.id).text,'Words on the note');assert.equal(theirs.connectors.find(e=>e.id==='edge-x').label,'blocks');
 alice.log.length=0;await canvasEdit(alice,{type:'disconnect',id:'edge-x'});await alice.session.syncNow();
 assert.equal(alice.session.getState().pending,0,alice.session.getState().error);assert.ok(alice.actions().some(a=>a.startsWith('deleteCanvasConnector:')));assert.equal(edge(),undefined);
 await h.pump();assert.ok(!bob.workspace.projects[0].canvases[0].connectors.some(e=>e.id==='edge-x'));
});
test('real Canvas saves: a board rename stays in the recovery queue',async()=>{
 const h=harness(),alice=h.person('alice');await alice.connect();await h.settle();const before=serverObjects(h).size;alice.log.length=0;
 await canvasEdit(alice,{type:'rename',title:'Renamed board'});await alice.session.syncNow();
 assert.equal(alice.session.getState().pending,1);assert.match(alice.session.getState().error||'',/not available in v4 workspaces yet/);assert.equal(serverObjects(h).size,before);
});

test('edits that also change the update time (as the app does) keep working one after another, for a task and for a Canvas object',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const id=alice.workspace.projects[0].tasks[0].id;
 for(const [i,t] of ['2031-01-01T00:00:01.000Z','2031-01-01T00:00:09.000Z','2031-01-01T00:00:20.000Z'].entries()){await alice.edit(ws=>{const k=ws.projects[0].tasks.find(x=>x.id===id);k.title='Title '+i;k.updatedAt=t;});await alice.session.syncNow();assert.equal(alice.session.getState().pending,0,alice.session.getState().error);}
 assert.equal(h.x.task(id).data.title,'Title 2');
 const o=alice.workspace.projects[0].canvases[0].objects[0],base=x=>[{id:x.id,x:x.x,y:x.y,width:x.width,height:x.height}];
 for(const [i,t] of ['2031-02-01T00:00:01.000Z','2031-02-01T00:00:30.000Z'].entries()){await canvasEdit(alice,{type:'patch',id:o.id,patch:{text:'Words '+i},bases:base(alice.workspace.projects[0].canvases[0].objects[0])});await alice.session.syncNow();assert.equal(alice.session.getState().pending,0,alice.session.getState().error);}
 assert.equal(serverObjects(h).get(o.id).text,'Words 1');await h.pump();assert.equal(bob.workspace.projects[0].canvases[0].objects.find(x=>x.id===o.id).text,'Words 1');
});
