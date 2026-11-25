// /tests/cloud/canvas-stale-editor.test.cjs
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
// What CanvasEditor does: it keeps its own copy of the board and the revision it opened with, and saves that copy plus each edit (CanvasEditor.js: current, expected, saveCanvas).
const openEditor=person=>{const b=person.workspace.projects[0].canvases[0];return {board:b,expected:b.revision};};
const editorMove=(person,ed,id,dx)=>person.edit(ws=>{const p=ws.projects[0],base={...ed.board,revision:ed.expected},next=canvasDomain.changeBoard(base,{type:'move',ids:[id],dx,dy:0},stamp());ws.projects[0]=canvasDomain.saveBoard(p,next,ed.expected);ed.board=next;ed.expected=next.revision;});
test('F12: a Canvas screen that was open before the other person added a note must not erase that note',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const ed=openEditor(bob),mine=ed.board.objects[0].id,b=alice.workspace.projects[0].canvases[0];
 const note=canvasDomain.createObject({id:'alice-note',boardId:b.id,type:'note',x:40,y:50,text:'From Alice',now:stamp(),zIndex:70});
 await alice.edit(ws=>{const p=ws.projects[0],c=p.canvases[0],next=canvasDomain.changeBoard(c,{type:'add',objects:[note]},stamp());ws.projects[0]=canvasDomain.saveBoard(p,next,c.revision);});
 await h.advance(2000);await h.pump();
 assert.ok(bob.workspace.projects[0].canvases[0].objects.some(o=>o.id==='alice-note'),'Bob received the note while his screen is open');
 let threw='';try{await editorMove(bob,ed,mine,25);}catch(e){threw=e.message;}
 await h.advance(2000);await h.pump();await h.advance(2000);await h.pump();
  assert.match(threw,/revision|changed/i,'the out-of-date screen is refused, not silently accepted');
 const server=[...h.x.rows.values()].filter(r=>r.kind==='canvas.objects'&&!r.deleted).map(r=>r.id);
 assert.ok(server.includes('alice-note'),'the note is still in the cloud (stale editor save: '+(threw||'accepted')+')');
 assert.ok(alice.workspace.projects[0].canvases[0].objects.some(o=>o.id==='alice-note'),'and still on Alice\'s device');
 assert.ok(bob.workspace.projects[0].canvases[0].objects.some(o=>o.id==='alice-note'),'and still on Bob\'s device');
});
const canvasEdit=(person,command)=>person.edit(ws=>{const p=ws.projects[0],b=p.canvases[0];ws.projects[0]=canvasDomain.saveBoard(p,canvasDomain.changeBoard(b,command,stamp()),b.revision);});
const {markChangedBoards}=require('../../src/cloud/canvasStale.cjs');
const objectXs=ws=>Object.fromEntries(ws.projects[0].canvases[0].objects.map(o=>[o.id,o.x]));
test('F12: an out-of-date screen cannot put back the old position of something the other person moved',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const ed=openEditor(bob),[a,b]=ed.board.objects.map(o=>o.id);
 await canvasEdit(alice,{type:'move',ids:[a],dx:90,dy:0});await h.advance(2000);await h.pump();
 let threw='';try{await editorMove(bob,ed,b,10);}catch(e){threw=e.message;}
 await h.advance(2000);await h.pump();await h.advance(2000);await h.pump();
 assert.match(threw,/Canvas changed/);
 const cloud=Object.fromEntries([...h.x.rows.values()].filter(r=>r.kind==='canvas.objects'&&!r.deleted&&r.boardId===ed.board.id).map(r=>[r.id,r.data.x]));
 assert.equal(cloud[a],objectXs(alice.workspace)[a],'Alice\'s move is still in the cloud');assert.equal(objectXs(bob.workspace)[a],objectXs(alice.workspace)[a]);
});
test('F12: after the screen takes the newer board (what the open Canvas now does by itself), Bob\'s edit goes through and nothing is lost',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const ed=openEditor(bob),[a,b]=ed.board.objects.map(o=>o.id);
 await canvasEdit(alice,{type:'move',ids:[a],dx:90,dy:0});await h.advance(2000);await h.pump();
 const fresh=bob.workspace.projects[0].canvases[0];ed.board=fresh;ed.expected=fresh.revision;
 await editorMove(bob,ed,b,10);await h.advance(2000);await h.pump();await h.advance(2000);await h.pump();
 const xs=ws=>objectXs(ws);assert.deepEqual(xs(alice.workspace),xs(bob.workspace),'same positions on both devices');
 assert.equal(xs(bob.workspace)[a],ed.board.objects.find(o=>o.id===a).x,'Alice\'s move kept');assert.equal(alice.session.getState().conflicts,0);assert.equal(bob.session.getState().conflicts,0);
});
test('markChangedBoards: unchanged content keeps the very same object, server time stamps are not a change, a real change raises the revision once',()=>{
 const base={projects:[{id:'p',canvases:[{id:'b',revision:3,objects:[{id:'o',x:1,updatedAt:'t1'}],connectors:[],threads:[]}]}]};
 const same={projects:[{id:'p',canvases:[{id:'b',revision:0,objects:[{id:'o',x:1,updatedAt:'t2'}],connectors:[],threads:[]}]}]};
 const out=markChangedBoards(base,same);assert.equal(out.projects[0].canvases[0].revision,3,'keeps my own counter, no bump for a time stamp');
 const moved={projects:[{id:'p',canvases:[{id:'b',revision:0,objects:[{id:'o',x:2,updatedAt:'t2'}],connectors:[],threads:[]}]}]};
 assert.equal(markChangedBoards(base,moved).projects[0].canvases[0].revision,4);
 const added={projects:[{id:'p',canvases:[{id:'b',revision:3,objects:[{id:'o',x:1},{id:'n'}],connectors:[],threads:[]},{id:'new',revision:0,objects:[],connectors:[],threads:[]}]}]};
 const r=markChangedBoards(base,added);assert.equal(r.projects[0].canvases[0].revision,4);assert.equal(r.projects[0].canvases[1].revision,0,'a board I did not have is left alone');
 const untouched={projects:[{id:'p',canvases:[{id:'b',revision:3,objects:[{id:'o',x:1}],connectors:[],threads:[]}]}]};assert.equal(markChangedBoards(base,untouched),untouched,'nothing to change: the same object comes back');
 assert.equal(base.projects[0].canvases[0].revision,3,'inputs are never changed');
});
