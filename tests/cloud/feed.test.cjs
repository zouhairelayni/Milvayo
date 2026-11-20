// /tests/cloud/feed.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {database,generate}=require('../helpers/cloud-fake.cjs'),S=require('../../src/cloud/schema.cjs'),m=require('../../src/domain/model.cjs');
// Gate 3a in the sandbox (in-memory Firestore/RTDB fake): the v4 change feed `pullV4` and the per-project signal. Emulator coverage: tests/cloud/feed.emulator.test.cjs.
const T0=Date.parse('2026-11-18T12:00:00.000Z');
const clock=(t,ms=T0)=>t.mock.timers.enable({apis:['Date'],now:ms});
const world=({tasks=20,projects=2,protocol=4}={})=>{const x=database(generate({tasks,objects:3,projects}),{protocol});x.projects=[...new Set([...x.rows.values()].filter(r=>r.kind==='projects').map(r=>r.projectId))].sort();return x;};
const clean=o=>JSON.parse(JSON.stringify(o));// the service rejects undefined fields, as JSON over the wire would drop them
const pull=(x,body,who='alice')=>x.service.execute(who,clean({...x.scope,action:'pullV4',...body}));
const recs=(x,p)=>[...x.rows.entries()].filter(([k,v])=>k.startsWith(x.root+'/records/')&&v.projectId===p).map(([,v])=>v);
const task=(x,p,i=0)=>recs(x,p).filter(r=>r.kind==='tasks'&&!r.deleted).sort((a,b)=>a.id<b.id?-1:1)[i];
const edit=(x,t,set,who='alice',over={})=>x.service.execute(who,{...x.scope,action:'patch',projectId:t.projectId,taskId:t.id,opId:'op-'+Math.random().toString(36).slice(2),baseRevision:t.revision,set,...over});
const head=(x,p)=>x.rtdb.nodes.get(`heads/org/main/${p}`);
// A client replica: full sync once, then incremental rounds, deduplicating by (key, revision), exactly as the real change-feed applier must.
function replica(x,projectId,{limit=7,who='alice'}={}){
 const st={map:new Map(),seen:new Map(),cursor:null,accessVersion:undefined,calls:0,resets:0};
 const apply=r=>{const seen=st.seen.get(r.key);if(seen!==undefined&&r.revision<=seen)return;st.seen.set(r.key,r.revision);if(r.deleted)st.map.delete(r.key);else st.map.set(r.key,r);};
 st.sync=async()=>{let page=null,round=null;
  for(;;){const r=await pull(x,{projectId,limit,accessVersion:st.accessVersion,cursor:st.cursor??undefined,page:page??undefined,roundStartedAt:round??undefined},who);st.calls++;
   if(r.reset){st.resets++;st.map.clear();st.seen.clear();st.cursor=null;st.accessVersion=undefined;page=null;round=null;continue;}
   for(const rec of r.records)apply(rec);st.accessVersion=r.accessVersion;
   if(!r.more){st.cursor=r.cursor;return;}page=r.page;round=r.roundStartedAt;}};
 return st;
}
const serverLive=(x,p)=>new Map(recs(x,p).filter(r=>!r.deleted).map(r=>[r.key,r.revision]));
const replicaView=st=>new Map([...st.map].map(([k,r])=>[k,r.revision]));

test('full sync returns every live record of the project once, in key order, page by page, with a cursor on the last page',async t=>{
 clock(t);const x=world({tasks:25});const p=x.projects[0],expected=recs(x,p).filter(r=>!r.deleted).map(r=>r.key).sort();
 const got=[];let page,round,pages=0,last;
 do{const r=await pull(x,{projectId:p,limit:10,page,roundStartedAt:round});pages++;got.push(...r.records.map(r=>r.key));page=r.page??undefined;round=r.roundStartedAt;last=r;assert.equal(r.full,true);assert.ok(r.records.length<=10);}while(last.more);
 assert.deepEqual(got,expected);assert.equal(new Set(got).size,got.length);assert.ok(pages>=Math.ceil(expected.length/10));
 assert.equal(last.cursor,T0,'the cursor is the start of the round');assert.equal(typeof last.accessVersion,'string');
 assert.ok(!recs(x,x.projects[1]).some(r=>got.includes(r.key)),'another project never leaks in');
});
test('records written before v4 (no updatedAt) are in a full sync; tombstones are not; internal fields are never sent',async t=>{
 clock(t);const x=world({tasks:6,projects:1});const p=x.projects[0],victim=task(x,p,0);
 const gone=await x.service.execute('alice',{...x.scope,action:'deleteTask',projectId:p,taskId:victim.id,opId:'del-1',baseRevision:victim.revision});assert.equal(gone.ok,true);
 const r=await pull(x,{projectId:p,limit:500});
 assert.ok(r.records.length>0&&!r.records.some(rec=>rec.key===victim.key),'tombstone omitted from a full sync');
 assert.ok(r.records.some(rec=>rec.updatedAt===undefined),'untouched legacy records are still returned');
 for(const rec of r.records)for(const secret of ['lastOpId','lastOpHash','sequence','schema'])assert.equal(secret in rec,false,`${secret} must not be sent`);
});
test('incremental: an edit appears, tombstones are returned with deleted:true, and records older than the cursor window are not repeated',async t=>{
 clock(t);const x=world({tasks:12,projects:1});const p=x.projects[0],a=replica(x,p);await a.sync();assert.equal(a.cursor,T0);
 t.mock.timers.tick(60000);const t0=task(x,p,0),t1=task(x,p,1);
 await edit(x,t0,{title:'Renamed'});
 const del=await x.service.execute('alice',{...x.scope,action:'deleteTask',projectId:p,taskId:t1.id,opId:'del-2',baseRevision:t1.revision});
 let r=await pull(x,{projectId:p,cursor:a.cursor,limit:100});
 assert.equal(r.full,false);assert.ok(r.records.some(q=>q.key===t0.key&&q.revision===2&&q.data.title==='Renamed'));
 const tomb=r.records.find(q=>q.key===t1.key);assert.equal(tomb.deleted,true);assert.equal(typeof tomb.deletedAt,'number');
 assert.deepEqual(new Set(r.records.map(q=>q.key)),new Set(del.changed.map(q=>q.key).concat(t0.key)),'exactly the changed records');
 await a.sync();t.mock.timers.tick(61000);await a.sync();
 r=await pull(x,{projectId:p,cursor:a.cursor,limit:100});assert.equal(r.records.length,0,'nothing is repeated once the window has passed');assert.equal(r.more,false);
});
test('S1 ties: many records with the same updatedAt page through without a skip or a repeat (strict (updatedAt,key) cursor)',async t=>{
 clock(t);const x=world({tasks:3,projects:1});const p=x.projects[0],base=task(x,p,0),stamp=T0-5000;
 for(let i=0;i<9;i++){const key=`tied~${p}~~${String(i).padStart(2,'0')}`;x.rows.set(x.root+'/records/'+key,{...base,key,id:'tied-'+i,revision:1,updatedAt:stamp});}
 const seen=[];let page,round,r;
 do{r=await pull(x,{projectId:p,cursor:T0,limit:2,page,roundStartedAt:round});seen.push(...r.records.map(q=>q.key));page=r.page??undefined;round=r.roundStartedAt;}while(r.more);
 assert.deepEqual(seen,Array.from({length:9},(_,i)=>`tied~${p}~~${String(i).padStart(2,'0')}`));
});
test('S1 late visibility: a record stamped up to 30 s before the cursor is still delivered; one stamped earlier is not',async t=>{
 clock(t);const x=world({tasks:3,projects:1});const p=x.projects[0],base=task(x,p,0);
 const put=(id,u)=>x.rows.set(x.root+'/records/late~'+id,{...base,key:'late~'+id,id,revision:1,updatedAt:u});
 put('inside',T0-29000);put('outside',T0-31000);put('future',T0+500);
 const r=await pull(x,{projectId:p,cursor:T0,limit:100});
 assert.deepEqual(r.records.map(q=>q.id).sort(),['future','inside']);
});
test('S2 atomic multi-record operations: one cascade stamps every changed record with the same time and arrives in one round',async t=>{
 clock(t);const x=world({tasks:10,projects:1});const p=x.projects[0],a=replica(x,p,{limit:3});await a.sync();
 t.mock.timers.tick(5000);const t0=task(x,p,0),t1=task(x,p,1),t2=task(x,p,2);
 await x.service.execute('alice',{...x.scope,action:'patchDependencies',projectId:p,taskId:t1.id,opId:'dep-1',baseRevision:t1.revision,dependsOn:[t0.id]});
 const d=await x.service.execute('alice',{...x.scope,action:'deleteTask',projectId:p,taskId:t0.id,opId:'del-3',baseRevision:task(x,p,0).revision});
 assert.ok(d.changed.length>=2,'a cascade touches several records');assert.equal(new Set(d.changed.map(q=>q.updatedAt)).size,1,'one commit time for the whole operation');
 await a.sync();for(const q of d.changed){const server=x.rows.get(x.root+'/records/'+q.key);assert.equal(a.seen.get(q.key),server.revision,q.key+' converged');}
 assert.deepEqual(replicaView(a),serverLive(x,p));
});
test('S4 access: denied, unknown and unreadable projects look the same; revocation and scope changes reset the cursor; the signal and feed never cross projects',async t=>{
 clock(t);const x=world({tasks:8,projects:2});const [p0,p1]=x.projects;
 x.grant('bob',{workspaceRole:'viewer',projects:{[p1]:'none'}});x.grant('carol',{workspaceRole:'none',projects:{[p0]:'viewer'}});
 const ok=await pull(x,{projectId:p0,limit:50},'bob');assert.ok(ok.records.length);
 const messages=[];for(const [who,p] of [['bob',p1],['carol',p1],['carol','no-such-project'],['dave',p0]])await pull(x,{projectId:p,limit:5},who).then(()=>assert.fail(`${who}/${p} must be refused`),e=>messages.push(e.message));
 assert.deepEqual(new Set(messages),new Set(['Workspace access is unavailable']),'one message for every kind of refusal');
 assert.deepEqual((await pull(x,{projectId:'no-such-project',limit:5},'bob')).records,[],'a workspace-wide reader just sees nothing for an unknown project');
 assert.ok((await pull(x,{projectId:p0,limit:50},'carol')).records.length);
 const first=await pull(x,{projectId:p0,limit:500},'bob');
 x.rows.set(x.root+'/grants/bob',{workspaceRole:'viewer',projects:{[p0]:'none'},version:2});
 await pull(x,{projectId:p0,limit:5},'bob').then(()=>assert.fail('revoked project must be refused'),e=>assert.match(e.message,/unavailable/));
 x.rows.set(x.root+'/grants/bob',{workspaceRole:'viewer',projects:{},version:3});
 const reset=await pull(x,{projectId:p0,limit:50,accessVersion:first.accessVersion,cursor:first.cursor},'bob');assert.equal(reset.reset,'access');assert.deepEqual(reset.records,[]);
 x.rows.set('orgs/org/members/bob',{active:false,role:'member'});
 await pull(x,{projectId:p0,limit:5},'bob').then(()=>assert.fail('inactive member'),e=>assert.match(e.message,/unavailable/));
});
test('S5/S6 cursors: older than the 90-day retention, or from the future, force a full resync; a protocol change does too',async t=>{
 clock(t);const x=world({tasks:6,projects:1});const p=x.projects[0],a=replica(x,p);await a.sync();
 const old=await pull(x,{projectId:p,cursor:T0-91*86400000});assert.equal(old.reset,'expired');
 const future=await pull(x,{projectId:p,cursor:T0+10*60000});assert.equal(future.reset,'expired');
 const keep=await pull(x,{projectId:p,cursor:T0-89*86400000,limit:500});assert.equal(keep.reset,undefined,'just inside retention is fine');
 t.mock.timers.tick(91*86400000);await a.sync();assert.equal(a.resets,1,'the replica recovered by itself');assert.deepEqual(replicaView(a),serverLive(x,p));
 x.rows.set(x.root,{...x.rows.get(x.root),protocol:3});await pull(x,{projectId:p}).then(()=>assert.fail('protocol 3'),e=>assert.match(e.message,/does not use the v4 change feed/));
});
test('requests are validated: page size, cursor, page token and round start',async t=>{
 clock(t);const x=world({tasks:4,projects:1});const p=x.projects[0];
 const bad=[{limit:0},{limit:501},{limit:1.5},{cursor:-1},{cursor:'1'},{cursor:1.5},{page:'x'},{page:{k:5}},{cursor:T0,page:{k:'a'}},{page:{k:'a'}},{page:{k:'a'},roundStartedAt:T0+10*60000},{projectId:''},{projectId:'a/b'}];
 for(const b of bad)await assert.rejects(pull(x,{projectId:p,...b}),/./,JSON.stringify(b));
 assert.equal((await pull(x,{projectId:p,limit:500})).ok,true);
});
test('workspaces that still use the legacy protocol are refused, and a write freeze does not block reading',async t=>{
 clock(t);const legacy=world({tasks:4,projects:1,protocol:null});await pull(legacy,{projectId:legacy.projects[0]}).then(()=>assert.fail('legacy'),e=>assert.equal(e.code,'failed-precondition'));
 const frozen=world({tasks:4,projects:1});frozen.rows.set(frozen.root,{...frozen.rows.get(frozen.root),writeFreeze:true});assert.equal((await pull(frozen,{projectId:frozen.projects[0]})).ok,true);
});
test('S7 cost: a poll with nothing new reads only the authorization documents plus an empty query; reads grow with changes, not with project size',async t=>{
 clock(t);for(const size of [50,500]){const x=world({tasks:size,projects:1});const p=x.projects[0],a=replica(x,p,{limit:500});await a.sync();t.mock.timers.tick(120000);
  const idle=await x.measure(()=>pull(x,{projectId:p,cursor:a.cursor,limit:100}));assert.equal(idle.result.records.length,0);assert.ok(idle.reads<=5,`${size} tasks: idle poll read ${idle.reads} documents`);assert.equal(idle.result.measured.documentReads,3);
  await edit(x,task(x,p,0),{title:'one edit'});const one=await x.measure(()=>pull(x,{projectId:p,cursor:a.cursor+120000,limit:100}));assert.ok(one.reads<=6,`${size} tasks: one edit read ${one.reads}`);}
});
test('signal: every accepted v4 write sets the project node (and only that project); conflicts and no-ops stay silent; a failing signal never fails the edit',async t=>{
 clock(t);const x=world({tasks:10,projects:2});const [p0,p1]=x.projects,t0=task(x,p0,0);
 assert.equal(head(x,p0),undefined);
 const r1=await edit(x,t0,{title:'A'});assert.equal(r1.ok,true);const h1=head(x,p0);assert.equal(h1.at,T0);assert.equal(typeof h1.n,'number');assert.equal(head(x,p1),undefined,'another project is untouched');
 assert.equal(x.rtdb.nodes.has('heads/org/main'),false,'the global workspace head is not used by v4 writers');
 const stale=await edit(x,t0,{title:'B'});assert.equal(stale.ok,false);assert.deepEqual(head(x,p0),h1,'a conflict does not signal');
 const same=await edit(x,t0,{title:'A'});assert.equal(same.alreadyApplied,true);assert.deepEqual(head(x,p0),h1,'a no-op does not signal');
 const dup=await edit(x,t0,{title:'A'},'alice',{opId:r1.record.lastOpId});assert.equal(dup.duplicate,true);// a replayed operation re-signals: if the first signal was lost, the retry repairs it
 x.rtdb.nodes.delete(`heads/org/main/${p0}`);await edit(x,t0,{title:'A'},'alice',{opId:r1.record.lastOpId});assert.ok(head(x,p0),'a retried duplicate repairs a lost signal');
 const n1=head(x,p0).n;await edit(x,task(x,p0,0),{title:'C'});assert.notEqual(head(x,p0).n,n1,'two writes in the same millisecond still change the node');
 x.rtdb.failNext(3);const survived=await edit(x,task(x,p0,0),{title:'D'});assert.equal(survived.ok,true,'a failing signal does not fail a committed edit');assert.equal(x.task(survived.record.id).data.title,'D');
});
test('signal covers every v4 writer',async t=>{
 clock(t);const x=world({tasks:10,projects:1});const p=x.projects[0],tk=task(x,p,0),other=[];let last;const moved=async(label,fn)=>{const before=JSON.stringify(head(x,p)||null);const r=await fn();assert.equal(r.ok,true,label);assert.notEqual(JSON.stringify(head(x,p)),before,label+' must signal');return r;};
 await moved('patch',()=>edit(x,tk,{title:'x'}));
 await moved('createTask',()=>x.service.execute('alice',{...x.scope,action:'createTask',projectId:p,taskId:'brand-new',opId:'c-1',order:40,data:m.defaultTask({id:'brand-new',title:'New'})}));
 await moved('addComment',()=>x.service.execute('alice',{...x.scope,action:'addComment',projectId:p,taskId:tk.id,commentId:'c1',opId:'o-c1',data:{id:'c1',taskId:tk.id,author:'Ann',body:'Hi',at:'x'}}));
 await moved('logTime',()=>x.service.execute('alice',{...x.scope,action:'logTime',projectId:p,taskId:tk.id,entryId:'e1',opId:'o-e1',data:{id:'e1',taskId:tk.id,owner:'Ann',date:'2026-11-01',hours:2,rateAtEntry:null,note:''}}));
 const t1=task(x,p,1);await moved('patchDependencies',()=>x.service.execute('alice',{...x.scope,action:'patchDependencies',projectId:p,taskId:t1.id,opId:'d-1',baseRevision:t1.revision,dependsOn:[task(x,p,2).id]}));
 const t3=task(x,p,3);await moved('deleteTask',()=>x.service.execute('alice',{...x.scope,action:'deleteTask',projectId:p,taskId:t3.id,opId:'x-1',baseRevision:t3.revision}));
 const obj=recs(x,p).find(r=>r.kind==='canvas.objects');await moved('patchCanvas',()=>x.service.execute('alice',{...x.scope,action:'patchCanvas',projectId:p,boardId:obj.boardId,objectId:obj.id,opId:'v-1',baseRevision:obj.revision,set:{x:obj.data.x+10}}));
 const obj2=recs(x,p).filter(r=>r.kind==='canvas.objects')[1];await moved('deleteCanvasObjects',()=>x.service.execute('alice',{...x.scope,action:'deleteCanvasObjects',projectId:p,boardId:obj2.boardId,objectIds:[obj2.id],bases:{[obj2.id]:obj2.revision},opId:'v-2'}));
});
test('two clients converge through random edits, deletes, creates, comments and dependency changes, with time passing between syncs',async t=>{
 clock(t);const x=world({tasks:24,projects:1});x.grant('bob',{workspaceRole:'manager',projects:{}});const p=x.projects[0];
 let seed=2026;const rnd=()=>{seed=(seed*1664525+1013904223)%4294967296;return seed/4294967296;},pick=a=>a[Math.floor(rnd()*a.length)];
 const A=replica(x,p,{limit:5}),B=replica(x,p,{limit:4,who:'bob'});await A.sync();await B.sync();
 let created=0,okCount=0;
 for(let i=0;i<120;i++){
  const who=pick(['alice','bob']),live=recs(x,p).filter(r=>r.kind==='tasks'&&!r.deleted),tk=pick(live),roll=rnd();
  try{
   if(roll<.45)await edit(x,tk,{title:'t'+i},who);
   else if(roll<.6)await x.service.execute(who,{...x.scope,action:'createTask',projectId:p,taskId:'n'+(created++),opId:'c-'+i,order:60+i,data:m.defaultTask({id:'n'+(created-1),title:'New '+i})});
   else if(roll<.72&&live.length>8)await x.service.execute(who,{...x.scope,action:'deleteTask',projectId:p,taskId:tk.id,opId:'d-'+i,baseRevision:tk.revision});
   else if(roll<.85)await x.service.execute(who,{...x.scope,action:'addComment',projectId:p,taskId:tk.id,commentId:'cm-'+i,opId:'cc-'+i,data:{id:'cm-'+i,taskId:tk.id,author:'A',body:'b',at:'x'}});
   else{const other=pick(live.filter(r=>r.id!==tk.id));await x.service.execute(who,{...x.scope,action:'patchDependencies',projectId:p,taskId:tk.id,opId:'p-'+i,baseRevision:tk.revision,dependsOn:other&&rnd()<.7?[other.id]:[]});}
   okCount++;
  }catch{/* refused edits (cycles, caps) are fine: the feed only has to mirror what was accepted */}
  t.mock.timers.tick(Math.floor(rnd()*50000));
  if(rnd()<.4)await A.sync();if(rnd()<.3)await B.sync();
 }
 assert.ok(okCount>60,'enough accepted operations to mean something');await A.sync();await B.sync();
 assert.deepEqual(replicaView(A),serverLive(x,p));assert.deepEqual(replicaView(B),serverLive(x,p));
});
test('directoryV4: lists exactly the projects a person may read, hides workspace-level records from restricted people, and answers an old workspace with its protocol only',async t=>{
 clock(t);const x=world({tasks:6,projects:3}),[p0,p1,p2]=x.projects,dir=(who='alice',w=x)=>w.service.execute(who,{...w.scope,action:'directoryV4'});
 const all=await dir();assert.equal(all.protocol,4);assert.deepEqual(all.projects.map(r=>r.projectId),x.projects);assert.ok(all.grant&&all.membershipRole&&all.accessVersion);
 for(const r of [...all.projects,...all.shared])for(const secret of ['lastOpId','lastOpHash','sequence','schema'])assert.equal(secret in r,false);
 assert.ok(all.shared.every(r=>r.projectId===''));
 x.grant('bob',{workspaceRole:'viewer',projects:{[p1]:'none'}});x.grant('carol',{workspaceRole:'none',projects:{[p0]:'viewer',[p2]:'viewer'}});
 const bob=await dir('bob'),carol=await dir('carol');
 assert.deepEqual(bob.projects.map(r=>r.projectId),[p0,p2]);assert.deepEqual(bob.shared,[],'an explicit denial hides workspace-level records, as in the v3 pull');
 assert.deepEqual(carol.projects.map(r=>r.projectId),[p0,p2]);assert.notEqual(bob.accessVersion,all.accessVersion);
 for(const [k,v] of x.rows)if(k.startsWith(x.root+'/records/')&&v.kind==='projects'&&v.projectId===p2)x.rows.set(k,{...v,deleted:true,deletedAt:T0});
 assert.deepEqual((await dir()).projects.map(r=>r.projectId),[p0,p1],'a deleted project leaves the directory');
 await dir('dave').then(()=>assert.fail('stranger'),e=>assert.match(e.message,/unavailable/));
 const old=world({tasks:3,projects:1,protocol:null});assert.deepEqual(await dir('alice',old),{ok:true,protocol:3});
 const stats=await x.measure(()=>dir());assert.ok(stats.reads<=x.projects.length+all.shared.length+4,'directory reads follow the number of projects');
});
