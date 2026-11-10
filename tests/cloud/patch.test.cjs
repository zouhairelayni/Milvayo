// /tests/cloud/patch.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const S=require('../../src/cloud/schema.cjs'),V=require('../../src/cloud/taskMutation.cjs'),m=require('../../src/domain/model.cjs'),{generate}=require('../../src/cloud/tools/fixtures.cjs'),{createService}=require('../../src/cloud/server/service.cjs');
function database(workspace,{protocol=4,extra={}}={}){
 const root='orgs/org/workspaces/main',rows=new Map(),writes=[];
 for(const r of S.pack(workspace))rows.set(root+'/records/'+r.key,{...r,revision:1,sequence:1,deleted:false});
 rows.set('orgs/org/members/alice',{active:true,role:'owner'});rows.set(root+'/grants/alice',{workspaceRole:'manager',projects:{},version:1});
 rows.set(root,{state:'active',sequence:1,...(protocol?{protocol}:{}),...extra});rows.set('orgs/org/subscription/current',{seats:['alice','bob','carol'],allocations:{}});
 const snap=ref=>({ref,id:ref.path.split('/').at(-1),exists:rows.has(ref.path),data:()=>rows.has(ref.path)?structuredClone(rows.get(ref.path)):undefined});
 const collection=(path,filters=[])=>({path,filters,query:true,doc:(id=require('node:crypto').randomUUID())=>doc(path+'/'+id),where:(...f)=>collection(path,[...filters,f])});
 const doc=path=>({path,collection:name=>collection(path+'/'+name)});
 const db={doc,runTransaction:async fn=>{const pending=[];const tx={get:async ref=>snap(ref),set:(r,d)=>pending.push([r,d]),update:(r,d)=>pending.push([r,{...rows.get(r.path),...d}]),create:(r,d)=>{assert.ok(!rows.has(r.path));pending.push([r,d]);}};const result=await fn(tx);for(const [r,d] of pending){rows.set(r.path,structuredClone(d));writes.push(r.path);}return result;}};
 const service=createService(db,{}),scope={orgId:'org',workspaceId:'main'};let n=0;
 const task=id=>[...rows.entries()].find(([k,v])=>k.startsWith(root+'/records/')&&v.kind==='tasks'&&v.id===id)?.[1];
 return {rows,writes,root,task,tasks:()=>[...rows.values()].filter(v=>v.kind==='tasks'),grant:(uid,grant,member={active:true,role:'member'})=>{rows.set('orgs/org/members/'+uid,member);rows.set(root+'/grants/'+uid,{...grant,version:1});},
  patch:(uid,id,set,over={})=>{const t=task(id);return service.execute(uid,{...scope,action:'patch',projectId:t.projectId,taskId:id,opId:'op-'+(++n),baseRevision:t.revision,set,...over});},
  commit:(uid,id,data)=>{const t=task(id);return service.execute(uid,{...scope,action:'commit',mutationId:'mutation-'+(++n),changes:[{key:t.key,baseRevision:t.revision,before:t,after:{...t,data:{...t.data,...data}}}]});},
  control:(uid,body)=>service.execute(uid,{...scope,action:'workspaceControl',...body})};
}
function workspace({workflow,dependency,from}={}){
 const w=generate({tasks:6,objects:0}),p=w.projects[0];p.tasks.forEach(t=>{t.status='Backlog';t.verified=false;t.merged=false;});
 p.tasks[0].dependsOn=[p.tasks[1].id];p.tasks[1].status=dependency||'Backlog';if(from)p.tasks[0].status=from;
 if(workflow)p.workflow={enabled:true,transitions:[{from:'Backlog',to:'In progress'},{from:'In progress',to:'Validation'},{from:'Validation',to:'Done'}]};
 return m.normalizeWorkspace(w);
}
const accepts=async p=>{try{const r=await p;return r.ok!==false;}catch{return false;}};
test('a routine title or priority edit writes exactly one document and nothing else',async()=>{
 for(const tasks of [10,500]){
  const x=database(generate({tasks,objects:0})),t=x.tasks()[0],r=await x.patch('alice',t.id,{title:'Renamed',priority:'High'});
  assert.equal(r.ok,true);assert.equal(r.revision,t.revision+1);assert.equal(r.record.data.title,'Renamed');assert.equal(r.record.lastOpId.startsWith('op-'),true);
  assert.deepEqual(x.writes,[t.key.startsWith('tasks')?x.root+'/records/'+t.key:x.root+'/records/'+t.key],'exactly one write: the task document');
  assert.equal(r.measured.documentWrites,1);assert.equal(r.measured.documentReads,5,'member, grant, workspace, subscription, task');assert.deepEqual(r.measured.readBreakdown,{authorization:3,subscription:1,task:1,configuration:0,dependencies:0});
  assert.equal(x.rows.get(x.root).sequence,1,'the workspace sequence is not written');assert.ok(![...x.rows.keys()].some(k=>/\/(versions|receipts|audit|summaries)\//.test(k)));
  assert.notEqual(x.rows.get(t.key&&x.root+'/records/'+t.key).data.updatedAt,t.data.updatedAt,'the server stamps updatedAt');
 }
});
test('a status edit adds only the project configuration read; Done adds only its own dependencies',async()=>{
 const x=database(generate({tasks:500,objects:0})),t=x.tasks().find(t=>t.data.status==='Backlog'&&!t.data.dependsOn.length),r=await x.patch('alice',t.id,{status:'In progress'});
 assert.equal(r.measured.documentWrites,1);assert.equal(r.measured.documentReads,6);assert.equal(r.measured.readBreakdown.configuration,1);
 const blocked=database(workspace({dependency:'Backlog'}));await assert.rejects(blocked.patch('alice','task-0',{status:'Done'}),/dependency/);assert.deepEqual(blocked.writes,[]);
 const ok=database(workspace({dependency:'Done'})),done=await ok.patch('alice','task-0',{status:'Done'});assert.equal(done.measured.readBreakdown.dependencies,1);assert.equal(done.measured.documentWrites,1);
});
test('stale revisions are rejected without a write; duplicates and already-applied retries succeed',async()=>{
 const x=database(workspace()),t=x.task('task-2'),first=await x.patch('alice','task-2',{title:'One'},{opId:'op-fixed'});assert.equal(first.revision,t.revision+1);const writes=x.writes.length;
 const dup=await x.patch('alice','task-2',{title:'One'},{opId:'op-fixed',baseRevision:t.revision});assert.equal(dup.duplicate,true);assert.equal(x.writes.length,writes);
 const other=await x.patch('alice','task-2',{priority:'High'});assert.equal(other.ok,true);const after=x.writes.length;
 const applied=await x.patch('alice','task-2',{title:'One'},{opId:'op-retry',baseRevision:t.revision});assert.equal(applied.alreadyApplied,true,'same values already on the server: nothing to retry');assert.equal(x.writes.length,after);
 const stale=await x.patch('alice','task-2',{title:'Different'},{opId:'op-stale',baseRevision:t.revision});assert.equal(stale.ok,false);assert.equal(stale.code,'conflict');assert.equal(stale.current.data.title,'One');assert.equal(x.writes.length,after);
});
test('deleted tasks are never revived by a patch',async()=>{
 const x=database(workspace()),t=x.task('task-3');x.rows.set(x.root+'/records/'+t.key,{...t,deleted:true,revision:t.revision+1});
 const r=await x.patch('alice','task-3',{title:'Zombie'},{baseRevision:t.revision});assert.equal(r.ok,false);assert.equal(r.code,'deleted');assert.equal(x.rows.get(x.root+'/records/'+t.key).deleted,true);
});
test('authorization, seats, protocol marker and write freeze are enforced before any write',async()=>{
 const x=database(workspace()),project=x.task('task-0').projectId;
 x.grant('viewer',{workspaceRole:'viewer',projects:{}});x.grant('scoped',{workspaceRole:'none',projects:{other:'manager'}});x.grant('noseat',{workspaceRole:'manager',projects:{}});x.rows.set('orgs/org/subscription/current',{seats:['alice','viewer','scoped'],allocations:{}});
 x.grant('revoked',{workspaceRole:'manager',projects:{}},{active:false,role:'member'});x.rows.set('orgs/org/subscription/current',{seats:['alice','viewer','scoped','revoked'],allocations:{}});
 await assert.rejects(x.patch('viewer','task-0',{title:'x'}),/scoped grant/);await assert.rejects(x.patch('scoped','task-0',{title:'x'}),/scoped grant/);
 await assert.rejects(x.patch('noseat','task-0',{title:'x'}),/licensed seat/);await assert.rejects(x.patch('revoked','task-0',{title:'x'}),/unavailable/);await assert.rejects(x.patch('stranger','task-0',{title:'x'}),/unavailable/);
 await assert.rejects(x.patch('alice','task-0',{title:'x'},{orgId:'other-org'}),/unavailable/);await assert.rejects(x.patch('alice','task-0',{title:'x'},{workspaceId:'other-workspace'}),/unavailable/);await assert.rejects(x.patch('alice','task-0',{title:'x'},{projectId:'another-project'}),/unavailable|scoped/);
 assert.deepEqual(x.writes,[]);
 const v3=database(workspace(),{protocol:null});await assert.rejects(v3.patch('alice','task-0',{title:'x'}),/does not accept field patches/);assert.deepEqual(v3.writes,[]);
 const frozen=database(workspace(),{extra:{writeFreeze:true}});await assert.rejects(frozen.patch('alice','task-0',{title:'x'}),/paused/);const frozen3=database(workspace(),{protocol:null,extra:{writeFreeze:true}});await assert.rejects(frozen3.commit('alice','task-0',{title:'x'}),/paused/);assert.deepEqual(frozen.writes.concat(frozen3.writes),[]);
 await assert.rejects(x.commit('alice','task-0',{title:'legacy'}),/Update the app/,'a protocol-4 workspace refuses legacy commits');assert.deepEqual(x.writes,[]);
 assert.ok(project);
});
test('only validated routine fields can be patched',async()=>{
 const x=database(workspace({workflow:true}));
 for(const [set,message] of [[{boardId:'other'},/not patchable/],[{dependsOn:[]},/not patchable/],[{sprintId:'x'},/not patchable/],[{updatedAt:'2020'},/set by the server/],[{nope:1},/not patchable/],[{},/1–20 fields/],[{verified:true},/canonical validation/],[{listId:'unknown'},/canonical validation/],[{status:'Bogus'},/schema/],[{status:'Done'},/Workflow blocks/]])
  await assert.rejects(x.patch('alice','task-3',set),message,JSON.stringify(set));
 await assert.rejects(x.patch('alice','task-3',{title:'x'},{baseRevision:0}),/base revision/);await assert.rejects(x.patch('alice','task-3',{title:'x'},{opId:'bad id/'}),/./);
 assert.deepEqual(x.writes,[]);const ok=await x.patch('alice','task-3',{status:'In progress',owner:'Maya',stage:'Testing',position:2});assert.equal(ok.ok,true);assert.equal(x.writes.length,1);
});
test('patch accepts and rejects exactly like the legacy commit validators across 320 workflow edits',async()=>{
 let compared=0;
 for(const workflow of [false,true])for(const dependency of ['Backlog','Done'])for(const from of ['Backlog','In progress','Validation','Done']){
  const cases=[{status:'Backlog'},{status:'In progress'},{status:'Validation'},{status:'Done'},{status:'Bogus'},{status:null},{owner:'Someone'},{owner:''},{stage:'Testing'},{stage:'Nope'},{position:3},{position:-1},{status:'Done',owner:'Someone'},{listId:''},{listId:'unknown-list'},{verified:true},{merged:true},{boardId:'other'},{dependsOn:[]},{sprintId:'x'}];
  for(const set of cases){
   const w=workspace({workflow,dependency,from}),legacy=database(w,{protocol:null}),lean=database(w),old=legacy.task('task-0'),next={...old,data:{...old.data,...set}};
   const a=await accepts(lean.patch('alice','task-0',set)),b=await accepts(legacy.commit('alice','task-0',set));
   if(a)assert.equal(b,true,`patch accepted what the legacy path rejected: ${workflow}/${dependency}/${from}/${JSON.stringify(set)}`);
   if(b&&Object.keys(set).every(k=>require('../../src/cloud/server/patch.cjs').ALLOWED.has(k))&&V.eligibleB({before:old,after:next}))assert.equal(a,true,`patch rejected a valid edit: ${workflow}/${dependency}/${from}/${JSON.stringify(set)}`);
   if(a&&b){const {updatedAt:_a,...pa}=lean.task('task-0').data,{updatedAt:_b,...pb}=legacy.task('task-0').data;assert.deepEqual(pa,pb);}
   compared++;
  }
 }
 assert.equal(compared,320);
});
test('workspace controls are administrator-only and audited',async()=>{
 const x=database(workspace(),{protocol:null});x.grant('bob',{workspaceRole:'manager',projects:{}});
 await assert.rejects(x.control('bob',{protocol:4}),/administrator/);await assert.rejects(x.control('alice',{protocol:5}),/Protocol must be/);await assert.rejects(x.control('alice',{}),/Nothing to change/);
 assert.deepEqual(await x.control('alice',{protocol:4,writeFreeze:false}),{ok:true,protocol:4,writeFreeze:false});assert.equal(x.rows.get(x.root).protocol,4);
 assert.equal((await x.patch('alice','task-1',{title:'Now allowed'})).ok,true);
 await x.control('alice',{writeFreeze:true});await assert.rejects(x.patch('alice','task-1',{title:'Frozen'}),/paused/);
 assert.ok([...x.rows.keys()].some(k=>k.startsWith('orgs/org/adminAudit/')));
});
