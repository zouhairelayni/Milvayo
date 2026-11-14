// /tests/cloud/patch-cascade.emulator.test.cjs
'use strict';
// Firebase emulator integration test for v4 deleteTask and patchDependencies. Not runnable in the sandbox: use `npm run test:cloud` in Termux.
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const H=require('../helpers/cloud-emulators.cjs'),S=require('../../src/cloud/schema.cjs');
const {scenario,mapOf,domain,RELEASES}=require('../helpers/cloud-scenarios.cjs'),m=require('../../src/domain/model.cjs');
const enabled=process.env.MILVAYO_EMULATORS==='1',skip=!enabled?'Not run: use npm run test:cloud against Firebase emulators':false;
const DELETES=[
 ['leaf task',{tasks:6}],
 ['predecessors, dependents, verified downstream and a Ready release',{edges:[[2,1],[1,0],[3,2],[5,1]],parents:{4:1},verified:[2,3,5,4],comments:[1],times:[1],reminders:[1],releaseOf:{1:'r1',3:'r2'},releases:RELEASES,typed:[[2,1,'SS',2],[1,0,'FF',4]]}],
 ['children and a verified grandchild',{parents:{1:0,2:0,3:2},verified:[1,3],edges:[[4,3]]}],
];
const DEPENDENCIES=[
 ['add a predecessor',{edges:[[2,1]]},2,i=>[i(1),i(0)],true],
 ['replace the set and reset a verified downstream chain',{edges:[[3,2],[4,3],[5,3]],verified:[3,4,5],releaseOf:{4:'r1',5:'r2'},releases:RELEASES},2,i=>[i(0)],true],
 ['remove with typed links kept',{edges:[[2,1],[2,0]],typed:[[2,1,'SS',3],[2,0,'FF',1]]},2,i=>[i(1)],true],
 ['a cycle is refused',{edges:[[1,2],[0,1],[3,0]]},2,i=>[i(3)],false],
];
test('v4 deleteTask and patchDependencies reach the domain-defined state in the emulator with bounded reads',{skip,timeout:420000},async t=>{
 const env=await H.environment();t.after(()=>env.cleanup());
 const owner=await H.account('cascade-owner');let n=0;
 const open=async(opts)=>{const {workspace,id}=scenario(opts),published=await H.publish(owner,workspace,'cascade-'+(++n)),scope={orgId:published.orgId,workspaceId:published.workspaceId};
  await H.request(owner,{...scope,action:'workspaceControl',protocol:4});
  const call=body=>H.request(owner,{...scope,...body}),records=async()=>{let rows;await env.withSecurityRulesDisabled(async c=>{const snap=await c.firestore().collection(`orgs/${scope.orgId}/workspaces/${scope.workspaceId}/records`).get();rows=snap.docs.map(d=>d.data());});return rows;};
  return {workspace,id,call,records};};
 const same=(actual,expected,label)=>{const a=mapOf(actual);for(const [k,v] of expected){assert.ok(a.has(k),`${label}: missing ${k}`);assert.deepEqual(a.get(k),v,`${label}: ${k}`);}for(const k of a.keys())assert.ok(expected.has(k),`${label}: unexpected ${k}`);assert.doesNotThrow(()=>S.validateRecords(actual.filter(r=>!r.deleted)),label+': canonical validation');};
 for(const [name,opts] of DELETES)await t.test('delete: '+name,async()=>{
  const {workspace,id,call,records}=await open(opts),target=id(1),task=(await records()).find(r=>r.kind==='tasks'&&r.id===target),expected=domain(workspace,p=>m.deleteTaskWithLinks(p,target));
  const r=await call({action:'deleteTask',projectId:task.projectId,taskId:target,opId:crypto.randomUUID(),baseRevision:task.revision});
  assert.equal(r.ok,true);assert.ok(r.measured.documentReads<=40,'bounded reads: '+r.measured.documentReads);assert.equal(r.measured.documentWrites,r.changed.length);
  same(await records(),expected,name);t.diagnostic(`delete "${name}": ${r.measured.documentReads} reads, ${r.measured.documentWrites} writes, transactionMs ${r.measured.timings?.transactionMs}, attempts ${r.measured.timings?.attemptMs?.length}`);
 });
 for(const [name,opts,idx,listOf,valid] of DEPENDENCIES)await t.test('dependencies: '+name,async()=>{
  const {workspace,id,call,records}=await open(opts),target=id(idx),list=listOf(id),task=(await records()).find(r=>r.kind==='tasks'&&r.id===target),body={action:'patchDependencies',projectId:task.projectId,taskId:target,opId:crypto.randomUUID(),baseRevision:task.revision,dependsOn:list};
  if(valid){const expected=domain(workspace,p=>m.setTaskDependencies(p,target,list)),r=await call(body);assert.equal(r.ok,true);assert.ok(r.measured.documentReads<=40);same(await records(),expected,name);t.diagnostic(`dependencies "${name}": ${r.measured.documentReads} reads, ${r.measured.documentWrites} writes, transactionMs ${r.measured.timings?.transactionMs}`);}
  else{const before=JSON.stringify((await records()).map(r=>[r.key,r.revision]).sort());await assert.rejects(call(body),e=>/cycle|Dependency/i.test(String(e.message)));assert.equal(JSON.stringify((await records()).map(r=>[r.key,r.revision]).sort()),before,'a refused edit writes nothing');}
 });
 await t.test('a stale revision is refused with a conflict and writes nothing',async()=>{
  const {id,call,records}=await open({edges:[[2,1]]}),task=(await records()).find(r=>r.kind==='tasks'&&r.id===id(1)),before=JSON.stringify((await records()).map(r=>[r.key,r.revision]).sort());
  const stale=await call({action:'deleteTask',projectId:task.projectId,taskId:id(1),opId:crypto.randomUUID(),baseRevision:task.revision+5});assert.equal(stale.ok,false);assert.equal(stale.code,'conflict');
  assert.equal(JSON.stringify((await records()).map(r=>[r.key,r.revision]).sort()),before);
 });
});
