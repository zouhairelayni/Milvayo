// /tests/cloud/two-user-scenario.test.cjs
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
const canvasDomain=require('../../src/domain/canvas.cjs'),Diag=require('../../src/cloud/diagnostics.cjs');
// FIX-11 (0.8.36): whole-scenario tests with TWO different users, a fake clock and the real session code, ending with the checks the owner's QA ends with:
// nothing waiting, nothing needing review, Compare says "same records" on both, and both devices show the same tasks and Canvas.
// Planner-tested only: this is still an in-memory server. It does not replace testing on two real devices; it makes the checks the owner makes by hand repeatable.
const stamp=()=>new Date().toISOString();
const canvasEdit=(p,command)=>p.edit(ws=>{const pr=ws.projects[0],b=pr.canvases[0];ws.projects[0]=canvasDomain.saveBoard(pr,canvasDomain.changeBoard(b,command,stamp()),b.revision);});
const view=p=>({tasks:p.workspace.projects[0].tasks.map(t=>[t.id,t.title,t.priority]),objects:p.workspace.projects[0].canvases[0].objects.map(o=>[o.id,o.x,o.y,o.text]).sort(),connectors:p.workspace.projects[0].canvases[0].connectors.map(c=>[c.id,c.from,c.to]).sort()});
async function settle(h,people,{resolve=false}={}){
 // Like a person waiting: let everything send, wait for the safety check to pull, resolve anything left with "Keep cloud version", and only stop after a calm round with nothing new.
 let calm=0;
 for(let round=0;round<16&&calm<2;round++){
  for(let i=0;i<4;i++){await h.advance(2500);await h.pump();}
  for(const p of people){await p.session.syncNow();}
  await h.advance(65000);await h.pump();
  if(resolve)for(const p of people){const r=await p.session.loadConflicts();for(const c of r.conflicts){try{await p.session.resolveConflict(c.id,'remote',r.remote);}catch(e){if(!/not available in the cloud/.test(e.message))throw e;}}}
  const clean=people.every(p=>{const s=p.session.getState();return s.waiting===0&&s.conflicts===0&&s.local===0;});
  calm=clean?calm+1:0;
 }
}
async function assertSettled(h,people,label){
 await settle(h,people,{resolve:true});
 for(const p of people){const s=p.session.getState();assert.equal(s.waiting,0,label+': waiting');assert.equal(s.conflicts,0,label+': conflicts');assert.equal(s.local,0,label+': not shared yet');
  const c=await p.session.compare();assert.equal(c.allSame,true,label+': Compare with cloud says same records\n'+Diag.formatCompare(c));}
 assert.deepEqual(view(people[0]),view(people[1]),label+': both devices show the same tasks and Canvas');
}
test('the owner QA script, two users: rename both ways, reorder, Canvas note + connector + move, delete, then settle',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const t=alice.workspace.projects[0].tasks.map(x=>x.id);
 await alice.edit(ws=>{ws.projects[0].tasks.find(x=>x.id===t[0]).title='Alice renamed';});await h.advance(3000);await h.pump();
 assert.equal(bob.workspace.projects[0].tasks.find(x=>x.id===t[0]).title,'Alice renamed');
 await bob.edit(ws=>{ws.projects[0].tasks.find(x=>x.id===t[1]).title='Bob renamed';});await h.advance(3000);await h.pump();
 assert.equal(alice.workspace.projects[0].tasks.find(x=>x.id===t[1]).title,'Bob renamed');
 await alice.edit(ws=>{const l=ws.projects[0].tasks,i=l.findIndex(x=>x.id===t[4]),[m]=l.splice(i,1);l.splice(1,0,m);});await h.advance(3000);await h.pump();
 const b=alice.workspace.projects[0].canvases[0],[o1,o2]=b.objects;
 await canvasEdit(alice,{type:'add',objects:[canvasDomain.createObject({id:'n-alice',boardId:b.id,type:'note',x:10,y:20,text:'Alice',now:stamp(),zIndex:50})]});await h.advance(3000);await h.pump();
 await canvasEdit(alice,{type:'connect',edge:{id:'e-alice',from:'n-alice',to:o1.id,label:'',style:'curve',arrow:true}});await h.advance(3000);await h.pump();
 await canvasEdit(bob,{type:'move',ids:[o2.id],dx:30,dy:5});await h.advance(3000);await h.pump();
 await alice.edit(ws=>{ws.projects[0].tasks=ws.projects[0].tasks.filter(x=>x.id!==t[6]);});await h.advance(3000);await h.pump();
 await assertSettled(h,[alice,bob],'QA script');
 assert.ok(!bob.workspace.projects[0].tasks.some(x=>x.id===t[6]),'the deleted task is gone on the other device');
});
// A small seeded random player: both users keep editing, sometimes at the same moment, sometimes with the live signal "silent" (no pump).
function player(seed){let s=seed>>>0;const r=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};return {r,int:n=>Math.floor(r()*n),pick:a=>a[Math.floor(r()*a.length)]};}
for(const seed of [1,2,3,4,5,6,7,8]){
 test('random two-user session, seed '+seed+': whatever they do, both end settled with the same records',async()=>{
  const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
  const P=player(seed),people=[alice,bob];let serial=0;
  for(let step=0;step<40;step++){
   const who=P.pick(people),ws0=who.workspace.projects[0],kind=P.int(7);
   if(kind===0||kind===1){const id=P.pick(ws0.tasks).id;await who.edit(ws=>{ws.projects[0].tasks.find(x=>x.id===id).title='T'+(++serial);});}
   else if(kind===2){const l=ws0.tasks;const id=P.pick(l).id,to=P.int(l.length);await who.edit(ws=>{const a=ws.projects[0].tasks,i=a.findIndex(x=>x.id===id);if(i<0)return;const [m]=a.splice(i,1);a.splice(Math.min(to,a.length),0,m);});}
   else if(kind===3){const o=P.pick(ws0.canvases[0].objects);try{await canvasEdit(who,{type:'move',ids:[o.id],dx:P.int(60)-30,dy:P.int(60)-30});}catch{}}
   else if(kind===4){const b=ws0.canvases[0];try{await canvasEdit(who,{type:'add',objects:[canvasDomain.createObject({id:'n-'+seed+'-'+(++serial),boardId:b.id,type:'note',x:P.int(900),y:P.int(600),text:'N'+serial,now:stamp(),zIndex:60+serial})]});}catch{}}
   else if(kind===5){const ids=ws0.canvases[0].objects.map(o=>o.id);if(ids.length>3){try{await canvasEdit(who,{type:'remove',ids:[P.pick(ids)]});}catch{}}}
   else {const id=P.pick(ws0.tasks).id;await who.edit(ws=>{ws.projects[0].tasks.find(x=>x.id===id).priority=P.pick(['Low','Medium','High','Critical']);});}
   await h.advance(200+P.int(2500));if(P.r()<.6)await h.pump();
  }
  await assertSettled(h,people,'seed '+seed);
 });
}

// --- the three fixes found by the scenarios above (0.8.36) ---
test('a change waiting for review does not stop the other person\'s changes from arriving, and stays safe in the queue',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const ids=alice.workspace.projects[0].tasks.map(t=>t.id),title=(p,id)=>p.workspace.projects[0].tasks.find(t=>t.id===id).title;
 await alice.edit(ws=>{ws.projects[0].tasks.find(t=>t.id===ids[0]).title='Alice';});await bob.edit(ws=>{ws.projects[0].tasks.find(t=>t.id===ids[0]).title='Bob';});
 await bob.session.syncNow();await alice.session.syncNow();
 assert.equal(alice.session.getState().conflicts,1,'Alice has one conflict to review');
 await bob.edit(ws=>{ws.projects[0].tasks.find(t=>t.id===ids[3]).title='Bob other';});await bob.session.syncNow();
 await h.advance(70000);await h.pump();await alice.session.syncNow();await h.advance(70000);await h.pump();
 assert.equal(title(alice,ids[3]),'Bob other','the other task still arrives');
 assert.equal(alice.session.getState().conflicts,1,'the conflict is still there, waiting for her');
 const r=await alice.session.loadConflicts();assert.equal(r.conflicts[0].changes[0].after.data.title,'Alice','her original edit is intact in the queue');
});
test('two people editing the same Canvas: the board counter is bookkeeping, not a conflict',()=>{
 const board=(rev,extra={})=>({key:'canvases~p~~b',kind:'canvases',projectId:'p',boardId:'',id:'b',order:0,data:{id:'b',title:'T',revision:rev,updatedAt:'a',viewport:{x:0},...extra}});
 const merged=S.mergeChange(board(7),{before:board(5),after:board(6)});
 assert.equal(merged.data.revision,6);
 assert.throws(()=>S.mergeChange(board(7,{title:'Theirs'}),{before:board(5),after:board(6,{title:'Mine'})}),/Concurrent change to title/,'a real field (the title) still conflicts');
});
test('Compare looks at the ORDER of items, not at the position numbers (gaps and fractions are normal in the cloud)',()=>{
 const r=(id,order)=>({key:'tasks~p~~'+id,kind:'tasks',projectId:'p',boardId:'',id,data:{id},order});
 assert.equal(D.compareRecords([r('a',0),r('b',1),r('c',2)],[r('a',1),r('b',1.5),r('c',9)]).allSame,true,'same order, different numbers');
 assert.equal(D.compareRecords([r('a',0),r('b',1),r('c',2)],[r('b',1),r('a',1.5),r('c',9)]).allSame,false,'a real order difference is still reported');
});

// --- 0.8.41: rename and archive a Canvas board (owner approved 2026-11-23). Planner-tested only. ---
const boardRecord=h=>[...h.x.rows.values()].find(r=>r.kind==='canvases'&&!r.deleted);
test('a board rename and an archive reach the cloud and the other person; un-archiving works too; objects are untouched',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const objects=()=>[...h.x.rows.values()].filter(r=>r.kind==='canvas.objects'&&!r.deleted).length,n=objects();
 await canvasEdit(alice,{type:'rename',title:'Roadmap board'});await h.advance(3000);await h.pump();
 assert.equal(boardRecord(h).data.title,'Roadmap board');assert.equal(alice.session.getState().pending,0);
 await canvasEdit(alice,{type:'archive',archived:true});await h.advance(3000);await h.pump();
 assert.ok(boardRecord(h).data.archivedAt,'archived in the cloud');
 await h.advance(65000);await h.pump();await bob.session.syncNow();await h.advance(65000);await h.pump();
 assert.equal(bob.workspace.projects[0].canvases[0].title,'Roadmap board','Bob sees the new name');assert.ok(bob.workspace.projects[0].canvases[0].archivedAt,'Bob sees it archived');
 await canvasEdit(alice,{type:'archive',archived:false});await h.advance(3000);await h.pump();assert.equal(boardRecord(h).data.archivedAt??null,null);
 assert.equal(objects(),n,'no object was changed');
});
test('two people renaming the same board is an ordinary conflict, and Keep cloud version settles it for both',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 await canvasEdit(alice,{type:'rename',title:'Alice name'});await canvasEdit(bob,{type:'rename',title:'Bob name'});
 await bob.session.syncNow();await alice.session.syncNow();await h.advance(3000);await h.pump();
 await settle(h,[alice,bob],{resolve:true});await assertSettled(h,[alice,bob],'board rename conflict');
 assert.equal(alice.workspace.projects[0].canvases[0].title,bob.workspace.projects[0].canvases[0].title);
});

// --- 0.8.42: create and delete a Canvas board (owner approved 2026-11-23). Planner-tested only. ---
const canvasEditAt=(p,id,command)=>p.edit(ws=>{const pr=ws.projects[0],b=pr.canvases.find(x=>x.id===id);ws.projects[0]=canvasDomain.saveBoard(pr,canvasDomain.changeBoard(b,command,stamp()),b.revision);});
const newBoard=(p,id,title)=>p.edit(ws=>{const pr=ws.projects[0];ws.projects[0]={...pr,canvases:[...pr.canvases,canvasDomain.createBoard({id,projectId:pr.id,title,now:stamp()})]};});
const liveBoards=h=>[...h.x.rows.values()].filter(r=>r.kind==='canvases'&&!r.deleted),liveKids=(h,id)=>[...h.x.rows.values()].filter(r=>r.boardId===id&&r.kind.startsWith('canvas.')&&!r.deleted);
const addNotes=(p,id,n,prefix)=>canvasEditAt(p,id,{type:'add',objects:Array.from({length:n},(_,k)=>canvasDomain.createObject({id:prefix+k,boardId:id,type:'note',x:10*k,y:5*k,text:'N'+k,now:stamp(),zIndex:70+k}))});
test('a new board, then notes and a connector on it, reach the cloud and the other person',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const before=alice.workspace.projects[0].canvases.length;
 await newBoard(alice,'board-new','Second board');await addNotes(alice,'board-new',2,'nb-');await canvasEditAt(alice,'board-new',{type:'connect',edge:{id:'nb-edge',from:'nb-0',to:'nb-1',label:'',style:'curve',arrow:true}});
 await h.advance(3000);await h.pump();
 assert.ok(liveBoards(h).some(r=>r.id==='board-new'),'the board is in the cloud');assert.equal(liveKids(h,'board-new').length,3,'2 notes and 1 connector');
 assert.equal(alice.session.getState().pending,0,alice.session.getState().error);assert.equal(alice.session.getState().local,0,'nothing is "not shared yet"');
 await settle(h,[alice,bob]);assert.equal(bob.workspace.projects[0].canvases.length,before+1,'Bob sees the new board');
 const nb=bob.workspace.projects[0].canvases.find(b=>b.id==='board-new');assert.equal(nb.objects.length,2);assert.equal(nb.connectors.length,1);assert.equal(nb.title,'Second board');
 await assertSettled(h,[alice,bob],'board create');
});
test('an archived board is deleted for both people with its notes, connectors and comments; the first board is untouched',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const first=liveKids(h,alice.workspace.projects[0].canvases[0].id).length,before=alice.workspace.projects[0].canvases.length;
 await newBoard(alice,'board-gone','Short lived');await addNotes(alice,'board-gone',3,'g-');await canvasEditAt(alice,'board-gone',{type:'connect',edge:{id:'g-edge',from:'g-0',to:'g-1',label:'',style:'curve',arrow:true}});
 await settle(h,[alice,bob]);assert.equal(bob.workspace.projects[0].canvases.length,before+1);
 await canvasEditAt(alice,'board-gone',{type:'archive',archived:true});await h.advance(3000);await h.pump();
 await alice.edit(ws=>{const pr=ws.projects[0],b=pr.canvases.find(x=>x.id==='board-gone');ws.projects[0]=canvasDomain.deleteBoard(pr,b.id,b.revision);});
 await h.advance(3000);await h.pump();
 assert.equal(alice.session.getState().pending,0,alice.session.getState().error);
 assert.equal(liveKids(h,'board-gone').length,0,'its notes and connector are gone in the cloud');assert.ok(!liveBoards(h).some(r=>r.id==='board-gone'));
 await settle(h,[alice,bob]);assert.equal(bob.workspace.projects[0].canvases.length,before,'Bob no longer has the board');
 assert.equal(liveKids(h,alice.workspace.projects[0].canvases[0].id).length,first,'the first board is untouched');
 await assertSettled(h,[alice,bob],'board delete');
});
test('the server refuses to delete a board that was not archived first, and a stale revision is a conflict, not a delete',async()=>{
 const h=harness(),alice=h.person('alice');await alice.connect();await h.settle();
 await newBoard(alice,'board-keep','Keep me');await h.advance(3000);await h.pump();
 const rec=liveBoards(h).find(r=>r.id==='board-keep'),req={action:'deleteCanvasBoard',projectId:rec.projectId,boardId:'board-keep',baseRevision:rec.revision,opId:'t-1'};
 await assert.rejects(()=>alice.session.request(req),/Archive the Canvas/);
 const stale=await alice.session.request({...req,baseRevision:rec.revision+7,opId:'t-2'});assert.equal(stale.ok,false);assert.equal(stale.code,'conflict');
 assert.ok(liveBoards(h).some(r=>r.id==='board-keep'),'still there');
});
test('a board with more than 99 items is refused whole (nothing half-deleted); deleting items first lets it through',async()=>{
 const h=harness(),alice=h.person('alice');await alice.connect();await h.settle();
 await newBoard(alice,'board-big','Big');await canvasEditAt(alice,'board-big',{type:'archive',archived:true});await h.advance(3000);await h.pump();
 const pid=alice.workspace.projects[0].id,proto=[...h.x.rows.values()].find(r=>r.kind==='canvas.objects'&&r.projectId===pid);
 for(let i=0;i<100;i++){const id='big-'+i,key=S.keyOf('canvas.objects',proto.projectId,id,'board-big'),path='orgs/org/workspaces/main/records/'+key;h.x.rows.set(path,{...proto,key,id,boardId:'board-big',data:{...proto.data,id,boardId:'board-big',text:'x'+i},revision:1,deleted:false});}
 const rec=liveBoards(h).find(r=>r.id==='board-big'),req={action:'deleteCanvasBoard',projectId:rec.projectId,boardId:'board-big',baseRevision:rec.revision,opId:'t-3'};
 await assert.rejects(()=>alice.session.request(req),/more than 99/);
 assert.equal(liveKids(h,'board-big').length,100,'nothing was deleted');assert.ok(liveBoards(h).some(r=>r.id==='board-big'));
 for(let i=0;i<10;i++)h.x.rows.get('orgs/org/workspaces/main/records/'+S.keyOf('canvas.objects',proto.projectId,'big-'+i,'board-big')).deleted=true;
 const ok=await alice.session.request({...req,opId:'t-4'});assert.equal(ok.ok,true);assert.equal(liveKids(h,'board-big').length,0);assert.ok(!liveBoards(h).some(r=>r.id==='board-big'));
 const again=await alice.session.request({...req,opId:'t-5'});assert.equal(again.alreadyApplied,true,'a repeat is harmless');
});
test('permissions: a viewer cannot create a board, a contributor can but cannot delete one, and bad data is refused',async()=>{
 const h=harness(),alice=h.person('alice');h.x.grant('vera',{workspaceRole:'viewer',projects:{}});h.x.grant('carol',{workspaceRole:'contributor',projects:{}});
 await alice.connect();await h.settle();
 await newBoard(alice,'board-perm','Perm');await canvasEditAt(alice,'board-perm',{type:'archive',archived:true});await h.advance(3000);await h.pump();
 const rec=liveBoards(h).find(r=>r.id==='board-perm'),vera=h.person('vera'),carol=h.person('carol');await vera.connect();await carol.connect();
 const mk=over=>({action:'createCanvasBoard',projectId:rec.projectId,boardId:'board-x',order:5,data:{...rec.data,id:'board-x'},opId:'p-1',...over});
 await assert.rejects(()=>vera.session.request(mk({})),/permission|outside the scoped grant|unavailable/i);
 await assert.rejects(()=>alice.session.request(mk({data:{...rec.data,id:'board-x',title:''}})),/canonical board schema/);
 await assert.rejects(()=>alice.session.request(mk({data:{...rec.data,id:'other'},opId:'p-2'})),/own ID/);
 const made=await carol.session.request(mk({boardId:'board-c',data:{...rec.data,id:'board-c',archivedAt:null},opId:'p-3'}));assert.equal(made.ok,true,'a contributor may create');
 await assert.rejects(()=>carol.session.request({action:'deleteCanvasBoard',projectId:rec.projectId,boardId:'board-perm',baseRevision:rec.revision,opId:'p-4'}),/permission|outside the scoped grant|unavailable/i);
 assert.ok(liveBoards(h).some(r=>r.id==='board-perm'),'still there');
 const dup=await carol.session.request(mk({boardId:'board-c',data:{...rec.data,id:'board-c',archivedAt:null},opId:'p-3'}));assert.equal(dup.duplicate,true,'the same request twice is harmless');
});

// --- 0.8.43: group / ungroup and linked objects (owner approved 2026-11-23). Planner-tested only. ---
const frameFor=(id,boardId)=>canvasDomain.createObject({id,boardId,type:'frame',x:0,y:0,width:600,height:400,zIndex:1,text:'Group',now:stamp()});
const cloudObj=(h,id)=>[...h.x.rows.values()].find(r=>r.kind==='canvas.objects'&&r.id===id&&!r.deleted);
test('group two notes, then ungroup: the frame, the group links and the ungroup reach the cloud and the other person',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 await newBoard(alice,'board-grp','Groups');await addNotes(alice,'board-grp',3,'q-');await settle(h,[alice,bob]);
 await canvasEditAt(alice,'board-grp',{type:'group',ids:['q-0','q-1'],frame:frameFor('frame-1','board-grp')});
 await settle(h,[alice,bob]);
 assert.equal(alice.session.getState().local,0,'nothing is "not shared yet"');
 assert.equal(cloudObj(h,'frame-1').data.type,'frame');assert.equal(cloudObj(h,'q-0').data.groupId,'frame-1');assert.equal(cloudObj(h,'q-1').data.groupId,'frame-1');assert.equal(cloudObj(h,'q-2').data.groupId,'');
 const seen=bob.workspace.projects[0].canvases.find(b=>b.id==='board-grp').objects;assert.equal(seen.find(o=>o.id==='q-0').groupId,'frame-1');assert.ok(seen.find(o=>o.id==='frame-1'));
 await assertSettled(h,[alice,bob],'group');
 await canvasEditAt(bob,'board-grp',{type:'ungroup',id:'frame-1'});await settle(h,[alice,bob]);
 assert.equal(cloudObj(h,'q-0').data.groupId,'');assert.equal(cloudObj(h,'q-1').data.groupId,'');assert.ok(cloudObj(h,'frame-1'),'the frame stays');
 assert.equal(alice.workspace.projects[0].canvases.find(b=>b.id==='board-grp').objects.find(o=>o.id==='q-0').groupId,'','Alice sees it ungrouped');
 await assertSettled(h,[alice,bob],'ungroup');
});
test('a linked object (live link and snapshot) is created, its view changed, and shared; a frame deleted at the same moment is refused cleanly',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 const pid=alice.workspace.projects[0].id;await newBoard(alice,'board-lnk','Links');await settle(h,[alice,bob]);
 const live=canvasDomain.createObject({id:'lk-live',boardId:'board-lnk',type:'linked',x:5,y:5,text:'Task',now:stamp(),zIndex:3,sourceLink:{sourceType:'task',sourceId:alice.workspace.projects[0].tasks?.[0]?.id||'t1',projectId:pid,mode:'live',view:'tree',direction:'down',scopeType:'project',scopeId:''}});
 const snap=canvasDomain.createObject({id:'lk-snap',boardId:'board-lnk',type:'linked',x:300,y:5,text:'Card',now:stamp(),zIndex:4,sourceLink:{sourceType:'project',sourceId:pid,projectId:pid,mode:'snapshot',originProjectId:pid,capturedAt:stamp(),revision:'r1',snapshot:{kind:'card',title:'Plan',lines:['a','b']}}});
 await canvasEditAt(alice,'board-lnk',{type:'add',objects:[live,snap]});await settle(h,[alice,bob]);
 assert.equal(alice.session.getState().local,0);assert.equal(cloudObj(h,'lk-live').data.sourceLink.mode,'live');assert.equal(cloudObj(h,'lk-snap').data.sourceLink.snapshot.title,'Plan');
 assert.equal(bob.workspace.projects[0].canvases.find(b=>b.id==='board-lnk').objects.length,2,'Bob sees both linked objects');
 await canvasEditAt(alice,'board-lnk',{type:'patch',id:'lk-live',patch:{sourceLink:{...live.sourceLink,view:'mind',direction:'right'}}});await settle(h,[alice,bob]);
 assert.equal(cloudObj(h,'lk-live').data.sourceLink.view,'mind');assert.equal(bob.workspace.projects[0].canvases.find(b=>b.id==='board-lnk').objects.find(o=>o.id==='lk-live').sourceLink.view,'mind');
 await assertSettled(h,[alice,bob],'linked');
});
test('joining a group is refused by the server when the frame is gone, locked, nested, or the object is already grouped',async()=>{
 const h=harness(),alice=h.person('alice');await alice.connect();await h.settle();
 await newBoard(alice,'board-gr2','G2');await addNotes(alice,'board-gr2',4,'w-');
 await canvasEditAt(alice,'board-gr2',{type:'group',ids:['w-0','w-1'],frame:frameFor('fr-a','board-gr2')});await h.advance(3000);await h.pump();
 const rec=id=>cloudObj(h,id),join=(id,frame,op)=>alice.session.request({action:'patchCanvas',projectId:rec(id).projectId,boardId:'board-gr2',objectId:id,baseRevision:rec(id).revision,set:{groupId:frame},opId:op});
  await assert.rejects(()=>join('w-3','no-such-frame','j1'),/group frame is unavailable/);
 await assert.rejects(()=>join('w-3','w-2','j2'),/group frame is unavailable/);
 const same=await join('w-0','fr-a','j3');assert.equal(same.ok,true,'joining the group it is already in changes nothing');
 await canvasEditAt(alice,'board-gr2',{type:'group',ids:['w-2','w-3'],frame:frameFor('fr-b','board-gr2')});await h.advance(3000);await h.pump();
 await assert.rejects(()=>join('w-0','fr-b','j3b'),/Ungroup first/);
 await addNotes(alice,'board-gr2',1,'x-');await h.advance(3000);await h.pump();
 await assert.rejects(()=>join('fr-a','fr-a','j4'),/Grouping a frame|own frame/);
 await canvasEditAt(alice,'board-gr2',{type:'lock',id:'fr-a',locked:true});await h.advance(3000);await h.pump();
 await assert.rejects(()=>join('x-0','fr-a','j5'),/Unlock the object/);
 const ok=await alice.session.request({action:'patchCanvas',projectId:rec('x-0').projectId,boardId:'board-gr2',objectId:'fr-a',baseRevision:rec('fr-a').revision,set:{locked:false},opId:'j6'});assert.equal(ok.ok,true);
 const joined=await join('x-0','fr-a','j7');assert.equal(joined.ok,true);assert.equal(rec('x-0').data.groupId,'fr-a');
});

// --- 0.8.44: Canvas comments (owner approved 2026-11-23). Planner-tested only. ---
const threadOf=(h,id)=>[...h.x.rows.values()].find(r=>r.kind==='canvas.threads'&&r.id===id&&!r.deleted);
const newThread=(id,objectId,text)=>({id,objectId,x:0,y:0,resolvedAt:null,messages:[{id:id+'-m1',authorId:'local-device',text,at:stamp()}]});
const reply=(tid,n,text)=>({type:'reply',id:tid,message:{id:tid+'-m'+n,authorId:'local-device',text,at:stamp()}});
test('a comment thread: started by one person, replied to and resolved by the other, both see everything',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 await newBoard(alice,'board-cm','Comments');await addNotes(alice,'board-cm',2,'c-');await settle(h,[alice,bob]);
 await canvasEditAt(alice,'board-cm',{type:'thread',thread:newThread('th-1','c-0','First comment')});await settle(h,[alice,bob]);
 assert.equal(alice.session.getState().local,0,'nothing is "not shared yet"');assert.equal(threadOf(h,'th-1').data.messages.length,1);
 const seen=()=>bob.workspace.projects[0].canvases.find(b=>b.id==='board-cm').threads.find(t=>t.id==='th-1');assert.equal(seen().messages[0].text,'First comment');
 await canvasEditAt(bob,'board-cm',reply('th-1',2,'Second'));await settle(h,[alice,bob]);
 assert.equal(threadOf(h,'th-1').data.messages.length,2);assert.equal(alice.workspace.projects[0].canvases.find(b=>b.id==='board-cm').threads.find(t=>t.id==='th-1').messages[1].text,'Second');
 await canvasEditAt(alice,'board-cm',{type:'resolve',id:'th-1',resolved:true});await settle(h,[alice,bob]);
 assert.ok(threadOf(h,'th-1').data.resolvedAt);assert.ok(seen().resolvedAt,'Bob sees it resolved');
 await assertSettled(h,[alice,bob],'comments');
});
test('two people reply to the same thread at the same moment: both replies are kept, nobody is asked to choose',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 await newBoard(alice,'board-cm2','Comments 2');await addNotes(alice,'board-cm2',1,'d-');await canvasEditAt(alice,'board-cm2',{type:'thread',thread:newThread('th-2','d-0','Start')});await settle(h,[alice,bob]);
 await canvasEditAt(alice,'board-cm2',reply('th-2',2,'From Alice'));await canvasEditAt(bob,'board-cm2',reply('th-2',3,'From Bob'));
 await settle(h,[alice,bob]);
 const texts=threadOf(h,'th-2').data.messages.map(m=>m.text).sort();assert.deepEqual(texts,['From Alice','From Bob','Start']);
 assert.equal(alice.session.getState().conflicts?.length||0,0);assert.equal(bob.session.getState().conflicts?.length||0,0);
 await assertSettled(h,[alice,bob],'simultaneous replies');
});
test('comment permissions and refusals on the server: a commenter may comment but not edit; old replies cannot be rewritten; bad threads are refused',async()=>{
 const h=harness(),alice=h.person('alice');h.x.grant('cora',{workspaceRole:'commenter',projects:{}});h.x.grant('vera',{workspaceRole:'viewer',projects:{}});
 await alice.connect();await h.settle();
 await newBoard(alice,'board-cm3','Comments 3');await addNotes(alice,'board-cm3',1,'e-');await canvasEditAt(alice,'board-cm3',{type:'thread',thread:newThread('th-3','e-0','Start')});await h.advance(3000);await h.pump();
 h.x.rows.get('orgs/org/subscription/current').seats.push('cora');const cora=h.person('cora'),vera=h.person('vera');await cora.connect();await vera.connect();
 const th=threadOf(h,'th-3'),o=[...h.x.rows.values()].find(r=>r.id==='e-0'),pid=th.projectId;
 const create=(id,over={})=>({action:'createCanvasThread',projectId:pid,boardId:'board-cm3',threadId:id,order:3,data:newThread(id,'e-0','hello'),opId:'k-'+id,...over});
 const made=await cora.session.request(create('th-c'));assert.equal(made.ok,true,'a commenter may start a thread');
 await assert.rejects(()=>vera.session.request(create('th-v')),/scoped grant/);
 const patch=(who,set,op,rev=threadOf(h,'th-3').revision)=>who.session.request({action:'patchCanvasThread',projectId:pid,boardId:'board-cm3',threadId:'th-3',baseRevision:rev,set,opId:op});
 const msgs=threadOf(h,'th-3').data.messages;
 const ok=await patch(cora,{messages:[...msgs,{id:'th-3-m9',authorId:'local-device',text:'reply',at:stamp()}]},'k1');assert.equal(ok.ok,true,'a commenter may reply');
 await assert.rejects(()=>patch(cora,{messages:[{...msgs[0],text:'rewritten'}]},'k2'),/only accepts new replies/);
 await assert.rejects(()=>patch(cora,{messages:[]},'k3'),/only accepts new replies/);
 await assert.rejects(()=>patch(cora,{x:5},'k4'),/not patchable/);
 await assert.rejects(()=>cora.session.request({action:'patchCanvas',projectId:pid,boardId:'board-cm3',objectId:'e-0',baseRevision:o.revision,set:{x:99},opId:'k5'}),/scoped grant/);
 await assert.rejects(()=>cora.session.request(create('th-g',{data:newThread('th-g','no-such-object','x')})),/unavailable/);
 await assert.rejects(()=>cora.session.request(create('th-e',{data:{...newThread('th-e','e-0','x'),messages:[]}})),/first comment/);
 await assert.rejects(()=>cora.session.request(create('th-b',{data:{...newThread('th-b','e-0','x'),extra:1}})),/canonical/);
});

// --- 0.8.45: governance records: risks, work breakdown, budget lines, documents (owner approved 2026-11-23). Planner-tested only. ---
const gedit=(p,fn)=>p.edit(ws=>{const pr=ws.projects[0],g=pr.governance;fn(g);});
const gcloud=(h,kind,id)=>[...h.x.rows.values()].find(r=>r.kind===kind&&r.id===id&&!r.deleted),gall=(h,kind)=>[...h.x.rows.values()].filter(r=>r.kind===kind&&!r.deleted);
const risk=(id,title,over={})=>({id,title,category:'Tech',type:'Threat',prob:2,impact:3,strategy:'Mitigate',response:'',owner:'Ana',status:'Open',...over});
const line=(id,category,planned)=>({id,category,planned,committed:0,actual:0});
const wnode=(id,parent,name)=>({id,parent,name,owner:'',hours:0,note:''});
const gview=(p)=>p.workspace.projects[0].governance;
test('risks: added by one person, edited by the other, deleted; both always see the same list',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 await gedit(alice,g=>{g.risks=[...g.risks,risk('r1','Vendor delay'),risk('r2','Key person leaves')];});await settle(h,[alice,bob]);
 assert.equal(alice.session.getState().local,0,'nothing is "not shared yet"');assert.equal(gall(h,'governance.risks').length,2);assert.equal(gview(bob).risks.length,2);
 await gedit(bob,g=>{g.risks=g.risks.map(r=>r.id==='r1'?{...r,prob:5,status:'Mitigating'}:r);});await settle(h,[alice,bob]);
 assert.equal(gcloud(h,'governance.risks','r1').data.prob,5);assert.equal(gview(alice).risks.find(r=>r.id==='r1').status,'Mitigating');
 await gedit(alice,g=>{g.risks=g.risks.filter(r=>r.id!=='r1');});await settle(h,[alice,bob]);
 assert.equal(gall(h,'governance.risks').length,1);assert.equal(gview(bob).risks.length,1,'Bob sees it gone and the other one kept');
 await assertSettled(h,[alice,bob],'risks');
});
test('budget lines: add three, delete the first (everything after shifts position), edit one: all shared, nothing "not shared yet"',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 await gedit(alice,g=>{g.budget={...g.budget,lines:[line('b1','Design',100),line('b2','Build',500),line('b3','Test',200)]};});await settle(h,[alice,bob]);
 await gedit(alice,g=>{g.budget={...g.budget,lines:g.budget.lines.filter(l=>l.id!=='b1')};});await settle(h,[alice,bob]);
 assert.equal(alice.session.getState().local,0);assert.deepEqual(gall(h,'governance.budget.lines').map(r=>r.id).sort(),['b2','b3']);
 await gedit(bob,g=>{g.budget={...g.budget,lines:g.budget.lines.map(l=>l.id==='b2'?{...l,planned:750,actual:300}:l)};});await settle(h,[alice,bob]);
 assert.equal(gcloud(h,'governance.budget.lines','b2').data.planned,750);assert.equal(gview(alice).budget.lines.find(l=>l.id==='b2').actual,300);
 await assertSettled(h,[alice,bob],'budget');
});
test('work breakdown: a branch is added (parent first), then deleted with its sub-elements (deepest first); bad moves are refused by the server',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 await gedit(alice,g=>{g.wbs=[...g.wbs,wnode('w-c','w0','Child'),wnode('w-a','w0','Phase A'),wnode('w-b','w-a','Sub B'),wnode('w-d','w-b','Sub-sub D')];});await settle(h,[alice,bob]);
 assert.equal(alice.session.getState().local,0,alice.session.getState().error);assert.equal(gall(h,'governance.wbs').filter(r=>r.projectId===alice.workspace.projects[0].id).length,5);assert.equal(gview(bob).wbs.length,5);
 const pid=alice.workspace.projects[0].id,rec=id=>gcloud(h,'governance.wbs',id);
 const patch=(id,set,op)=>alice.session.request({action:'patchProjectRecord',projectId:pid,recordKind:'governance.wbs',recordId:id,baseRevision:rec(id).revision,set,opId:op});
 await assert.rejects(()=>patch('w-a',{parent:'w-d'},'x1'),/under itself or its own sub-elements/);
 await assert.rejects(()=>patch('w-a',{parent:'w-a'},'x2'),/under itself/);
 await assert.rejects(()=>patch('w-a',{parent:'nope'},'x3'),/parent work element is unavailable/);
 await assert.rejects(()=>patch('w0',{parent:'w-a'},'x4'),/root cannot have a parent/);
 await assert.rejects(()=>alice.session.request({action:'deleteProjectRecord',projectId:pid,recordKind:'governance.wbs',recordId:'w-a',baseRevision:rec('w-a').revision,opId:'x5'}),/nested work elements first/);
 await assert.rejects(()=>alice.session.request({action:'deleteProjectRecord',projectId:pid,recordKind:'governance.wbs',recordId:'w0',baseRevision:rec('w0').revision,opId:'x6'}),/root cannot be deleted/);
 const moved=await patch('w-d',{parent:'w-c'},'x7');assert.equal(moved.ok,true,'a legal move is accepted');
 await settle(h,[alice,bob]);
 await gedit(alice,g=>{const gone=new Set(['w-a','w-b']);g.wbs=g.wbs.filter(n=>!gone.has(n.id));});await settle(h,[alice,bob]);
 assert.deepEqual(gall(h,'governance.wbs').filter(r=>r.projectId===pid).map(r=>r.id).sort(),['w-c','w-d','w0']);assert.equal(gview(bob).wbs.length,3);
 await assertSettled(h,[alice,bob],'wbs');
});
test('documents: two people fill in different boxes at once and both are kept; only a manager approves',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');h.x.grant('carol',{workspaceRole:'contributor',projects:{}});
 await alice.connect();await bob.connect();await h.settle();
 await gedit(alice,g=>{g.docs={...g.docs,charter:{status:'Draft',values:{purpose:'Ship it',scope:'v1'}}};});await settle(h,[alice,bob]);
 assert.equal(gcloud(h,'governance.docs','charter').data.values.purpose,'Ship it');assert.equal(gview(bob).docs.charter.status,'Draft');
 await gedit(alice,g=>{g.docs={...g.docs,charter:{...g.docs.charter,values:{...g.docs.charter.values,purpose:'Ship it well'}}};});
 await gedit(bob,g=>{g.docs={...g.docs,charter:{...g.docs.charter,values:{...g.docs.charter.values,scope:'v1 and v2'}}};});
 await settle(h,[alice,bob]);
 const v=gcloud(h,'governance.docs','charter').data.values;assert.deepEqual([v.purpose,v.scope],['Ship it well','v1 and v2']);
 assert.equal(alice.session.getState().conflicts||0,0);
 h.x.rows.get('orgs/org/subscription/current').seats.push('carol');const carol=h.person('carol');await carol.connect();
 const pid=alice.workspace.projects[0].id,doc=gcloud(h,'governance.docs','charter');
 await assert.rejects(()=>carol.session.request({action:'patchProjectRecord',projectId:pid,recordKind:'governance.docs',recordId:'charter',baseRevision:doc.revision,set:{status:'Approved'},opId:'d1'}),/manager level/);
 await assert.rejects(()=>carol.session.request({action:'createProjectRecord',projectId:pid,recordKind:'governance.docs',recordId:'plan',order:1,data:{status:'Approved',values:{}},opId:'d2'}),/manager level/);
 const ok=await bob.session.request({action:'patchProjectRecord',projectId:pid,recordKind:'governance.docs',recordId:'charter',baseRevision:doc.revision,set:{status:'Approved'},opId:'d3'});assert.equal(ok.ok,true,'a manager approves');
 await assert.rejects(()=>carol.session.request({action:'patchProjectRecord',projectId:pid,recordKind:'governance.docs',recordId:'charter',baseRevision:gcloud(h,'governance.docs','charter').revision,set:{status:'Draft'},opId:'d4'}),/manager level/);
 await assert.rejects(()=>carol.session.request({action:'createProjectRecord',projectId:pid,recordKind:'governance.docs',recordId:'bad key!',order:1,data:{status:'Draft',values:{}},opId:'d5'}),/Invalid/);
 await assert.rejects(()=>carol.session.request({action:'createProjectRecord',projectId:pid,recordKind:'projects',recordId:'x',order:1,data:{},opId:'d6'}),/Unknown record kind/);
});
test('a real reorder of risks stays on the device ("not shared yet"); an insert (which joins at the end of the shared list) does not',async()=>{
 const h=harness(),alice=h.person('alice'),bob=h.person('bob');await alice.connect();await bob.connect();await h.settle();
 await gedit(alice,g=>{g.risks=[risk('s1','One'),risk('s2','Two'),risk('s3','Three')];});await settle(h,[alice,bob]);
 await gedit(alice,g=>{g.risks=[risk('s0','Zero'),...g.risks];});await settle(h,[alice,bob]);
 assert.equal(alice.session.getState().local,0,'an insert is shared');assert.equal(gall(h,'governance.risks').length,4);assert.deepEqual(gview(bob).risks.map(r=>r.id),['s1','s2','s3','s0'],'a new risk joins the end of the shared list for everyone');
 await gedit(alice,g=>{const [a,b,...rest]=g.risks;g.risks=[b,a,...rest];});await h.advance(3000);await h.pump();
 assert.ok(alice.session.getState().local>0,'a swap cannot be shared yet and is shown as not shared');
});
