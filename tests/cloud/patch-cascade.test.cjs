// /tests/cloud/patch-cascade.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {database,generate}=require('../helpers/cloud-fake.cjs'),m=require('../../src/domain/model.cjs'),S=require('../../src/cloud/schema.cjs');
const {scenario,mapOf,domain,RELEASES}=require('../helpers/cloud-scenarios.cjs');
const live=x=>[...x.rows.values()].filter(r=>r.key&&r.kind);
const record=(x,kind,id)=>live(x).find(r=>r.kind===kind&&r.id===id);
async function run(x,body){return x.service.execute('alice',{...x.scope,opId:'cascade-op-'+Math.random().toString(36).slice(2),...body});}
function assertSameState(x,expected,label){
 const actual=mapOf(live(x));
 for(const [k,v] of expected)assert.ok(actual.has(k),`${label}: missing ${k}`),assert.deepEqual(actual.get(k),v,`${label}: ${k} differs`);
 for(const k of actual.keys())assert.ok(expected.has(k),`${label}: unexpected live record ${k}`);
 assert.doesNotThrow(()=>S.validateRecords(live(x).filter(r=>!r.deleted)),`${label}: final state fails canonical validation`);
}
const del=async(x,tid)=>{const t=record(x,'tasks',tid);return run(x,{action:'deleteTask',projectId:t.projectId,taskId:tid,baseRevision:t.revision});};
const dep=async(x,tid,list)=>{const t=record(x,'tasks',tid);return run(x,{action:'patchDependencies',projectId:t.projectId,taskId:tid,baseRevision:t.revision,dependsOn:list});};
const DELETES={
 'leaf task':{tasks:6},
 'task with two predecessors and typed links':{edges:[[3,0],[3,1],[4,3]],typed:[[3,0,'SS',3],[4,3,'FF',1]]},
 'task with dependents and a verified downstream chain':{edges:[[2,1],[3,2],[4,3],[5,3]],verified:[3,4,5],releaseOf:{3:'r1',4:'r2'},releases:RELEASES},
 'task with children (one verified) and a verified grandchild':{parents:{1:0,2:0,3:2},verified:[1,3],edges:[[4,3]]},
 'task with comments, time entries and reminders':{comments:[1,1,2],times:[1],reminders:[1,3]},
 'task in a Ready release with verified dependents elsewhere':{edges:[[2,1],[3,2]],verified:[2,3],releaseOf:{1:'r1',2:'r2',3:'r3'},releases:RELEASES},
 'diamond downstream':{edges:[[2,1],[3,1],[4,2],[4,3],[5,4]],verified:[2,3,4,5]},
 'everything at once':{edges:[[2,1],[1,0],[3,2],[5,1]],parents:{4:1},verified:[2,3,5,4],comments:[1],times:[1],reminders:[1],releaseOf:{1:'r1',3:'r2'},releases:RELEASES,typed:[[2,1,'SS',2],[1,0,'FF',4]]},
};
test('deleteTask reaches exactly the state of the domain deleteTaskWithLinks cascade',async()=>{
 for(const [name,opts] of Object.entries(DELETES)){
  const {workspace,id}=scenario(opts),x=database(workspace),target=id(1);
  const expected=domain(workspace,p=>m.deleteTaskWithLinks(p,target)),r=await del(x,target);
  assert.equal(r.ok,true,name);assert.equal(record(x,'tasks',target).deleted,true,name);assertSameState(x,expected,name);
 }
});
test('deleting a task costs reads proportional to its relations, not to project size',async()=>{
 for(const size of [20,500,2000]){
  const w=m.normalizeWorkspace(generate({tasks:size,objects:0})),x=database(w),legacy=database(w,{protocol:null}),t=x.tasks().find(t=>!t.data.dependsOn.length&&!t.data.parentId);
  const r=await del(x,t.id);assert.equal(r.ok,true);assert.ok(r.measured.documentReads<=12,`${size} tasks: ${r.measured.documentReads} reads`);assert.ok(r.measured.documentWrites<=2);
  const lt=legacy.task(t.id),l=await legacy.service.execute('alice',{...legacy.scope,action:'commit',mutationId:'del-'+size,changes:[{key:lt.key,baseRevision:lt.revision,before:lt,after:null}]});assert.ok(l.measured.documentReads>=size,`legacy scans: ${l.measured.documentReads}`);
 }
});
const DEPS=[
 ['add a predecessor',{edges:[[2,1]]},2,i=>[i(1),i(0)],true],
 ['remove a predecessor and keep typed links',{edges:[[2,1],[2,0]],typed:[[2,1,'SS',3],[2,0,'FF',1]]},2,i=>[i(1)],true],
 ['replace the whole set',{edges:[[3,0],[3,1]]},3,i=>[i(2),i(4)],true],
 ['clear all predecessors',{edges:[[3,0],[3,1]],typed:[[3,0,'SS',2]]},3,()=>[],true],
 ['invalidate a verified downstream chain and releases',{edges:[[3,2],[4,3],[5,3]],verified:[3,4,5],releaseOf:{4:'r1',5:'r2'},releases:RELEASES},2,i=>[i(0)],true],
 ['duplicate IDs in the list are collapsed',{},2,i=>[i(0),i(0),i(1)],true],
 ['unchanged list is a no-op',{edges:[[2,1]]},2,i=>[i(1)],true],
 ['self dependency is refused',{},2,i=>[i(2)],false],
 ['missing predecessor is refused',{},2,()=>['ghost-task'],false],
 ['direct cycle is refused',{edges:[[1,2]]},2,i=>[i(1)],false],
 ['long cycle is refused',{edges:[[1,2],[0,1],[3,0]]},2,i=>[i(3)],false],
 ['a diamond that is not a cycle is accepted',{edges:[[1,0],[2,0]]},3,i=>[i(1),i(2)],true],
];
test('patchDependencies matches the domain setTaskDependencies, including cycles and invalid references',async()=>{
 for(const [name,opts,idx,listOf,valid] of DEPS){
  const {workspace,id}=scenario(opts),x=database(workspace),target=id(idx),list=listOf(id);
  let expected=null,domainThrew=false;try{expected=domain(workspace,p=>m.setTaskDependencies(p,target,list));}catch{domainThrew=true;}
  assert.equal(domainThrew,!valid,'the scenario is classified correctly by the domain: '+name);
  if(valid){const r=await dep(x,target,list);assert.equal(r.ok,true,name);assertSameState(x,expected,name);}
  else{const before=JSON.stringify([...x.rows]);await assert.rejects(dep(x,target,list),Error,name);assert.equal(JSON.stringify([...x.rows]),before,name+': nothing written');}
 }
});
test('dependency edits read only the neighbourhood and write the changed records',async()=>{
 for(const size of [20,500,2000]){
  const w=m.normalizeWorkspace(generate({tasks:size,objects:0})),x=database(w),[a,b]=x.tasks().filter(t=>!t.data.dependsOn.length),r=await dep(x,a.id,[b.id]);
  assert.equal(r.ok,true);assert.ok(r.measured.documentReads<=11,`${size} tasks: ${r.measured.documentReads} reads`);assert.equal(r.measured.documentWrites,2,'the task and the project link list');
 }
});
test('guards: permission, stale revision, idempotency, fallbacks and limits',async()=>{
 const {workspace,id}=scenario({edges:[[2,1]],verified:[2]}),x=database(workspace);x.grant('viewer',{workspaceRole:'viewer',projects:{}});x.grant('editor',{workspaceRole:'contributor',projects:{}});x.rows.set('orgs/org/subscription/current',{capacity:5,seats:['alice','editor','viewer'],allocations:{}});
 const t=record(x,'tasks',id(1)),call=(uid,action,extra)=>x.service.execute(uid,{...x.scope,action,projectId:t.projectId,taskId:id(1),opId:'g-'+action+Math.random(),baseRevision:t.revision,...extra});
 await assert.rejects(call('viewer','deleteTask'),/scoped grant/);await assert.rejects(call('editor','deleteTask'),/scoped grant/,'contributors may edit but not delete');
 assert.equal((await call('editor','patchDependencies',{dependsOn:[id(0)]})).ok,true,'contributors may edit dependencies');
 const stale=await call('alice','deleteTask');assert.equal(stale.ok,false);assert.equal(stale.code,'conflict');
 const fresh=record(x,'tasks',id(1)),del1=await call('alice','deleteTask',{baseRevision:fresh.revision,opId:'del-fixed'});assert.equal(del1.ok,true);
 const retry=await call('alice','deleteTask',{baseRevision:fresh.revision,opId:'del-fixed'});assert.equal(retry.ok,true,'a retried delete succeeds');assert.ok(retry.duplicate||retry.alreadyApplied);
 assert.equal((await call('alice','deleteTask',{baseRevision:1,opId:'other'})).alreadyApplied,true,'deleting a deleted task is idempotent');
 // A task with more than the allowed number of related records falls back to the full editor.
 const big=scenario({tasks:130,edges:Array.from({length:120},(_,i)=>[i+1,0])}),y=database(big.workspace),root=record(y,'tasks',big.id(0));
 await assert.rejects(y.service.execute('alice',{...y.scope,action:'deleteTask',projectId:root.projectId,taskId:root.id,opId:'big',baseRevision:root.revision}),/use the full editor/);
 assert.equal(y.writes.length,0);
});
