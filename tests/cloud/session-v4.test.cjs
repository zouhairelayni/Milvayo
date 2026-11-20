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
 await alice.edit(ws=>{const p=ws.projects[0],[a,b]=p.tasks;ws.projects[0]=model.setTaskDependencies(p,b.id,[a.id]);});await alice.session.syncNow();
 const state=alice.session.getState();assert.equal(state.pending,1);assert.match(state.error||'',/not available in v4 workspaces yet/);
 assert.ok(!alice.actions().some(a=>/^(patch|commit|patchDependencies|deleteTask|createTask)/.test(a)),'no half-sent change');assert.deepEqual(h.live(),before);
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
