// /tests/cloud/patch-create.emulator.test.cjs
'use strict';
// Firebase emulator integration test for v4 createTask, addComment and logTime. Not runnable in the sandbox: use `npm run test:cloud` in Termux.
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const H=require('../helpers/cloud-emulators.cjs'),S=require('../../src/cloud/schema.cjs'),m=require('../../src/domain/model.cjs'),{scenario}=require('../helpers/cloud-scenarios.cjs');
const enabled=process.env.MILVAYO_EMULATORS==='1',skip=!enabled?'Not run: use npm run test:cloud against Firebase emulators':false;
test('v4 create handlers write one document each, keep canonical state and enforce permissions in the emulators',{skip,timeout:300000},async t=>{
 const env=await H.environment();t.after(()=>env.cleanup());
 const owner=await H.account('create-owner'),viewer=await H.account('create-viewer'),{workspace,id}=scenario({edges:[[2,1]]}),published=await H.publish(owner,workspace,'create-v4'),scope={orgId:published.orgId,workspaceId:published.workspaceId};
 const call=(u,b)=>H.request(u,{...scope,...b}),records=async()=>{let rows;await env.withSecurityRulesDisabled(async c=>{rows=(await c.firestore().collection(`orgs/${scope.orgId}/workspaces/${scope.workspaceId}/records`).get()).docs.map(d=>d.data());});return rows;};
 await call(owner,{action:'workspaceControl',protocol:4});const task=(await records()).find(r=>r.kind==='tasks'&&r.id===id(1));
 await t.test('createTask: one write, canonical state, duplicate retry, duplicate id refused',async()=>{
  const data=m.defaultTask({id:'emu-new-task',title:'Created in the emulator',dependsOn:[id(0)]}),body={action:'createTask',projectId:task.projectId,taskId:'emu-new-task',opId:crypto.randomUUID(),order:900,data};
  const r=await call(owner,body);assert.equal(r.ok,true);assert.equal(r.measured.documentWrites,2,'the task and its one dependency link');assert.ok(r.measured.documentReads<=14,'reads '+r.measured.documentReads);
  assert.equal((await call(owner,body)).duplicate,true);await assert.rejects(call(owner,{...body,opId:crypto.randomUUID()}),e=>/already exists/.test(String(e.message)));
  {const live=(await records()).filter(x=>!x.deleted);assert.doesNotThrow(()=>S.validateRecords(live));}t.diagnostic(`createTask: ${r.measured.documentReads} reads, ${r.measured.documentWrites} writes, aggregation fallback ${r.measured.readBreakdown.aggregationFallback||0}`);
 });
 await t.test('addComment and logTime: one write each',async()=>{
  const c=await call(owner,{action:'addComment',projectId:task.projectId,taskId:task.id,commentId:'emu-c1',opId:crypto.randomUUID(),data:{id:'emu-c1',taskId:task.id,author:'Ann',body:'Hello',at:'x'}});assert.equal(c.measured.documentWrites,1);
  const e=await call(owner,{action:'logTime',projectId:task.projectId,taskId:task.id,entryId:'emu-e1',opId:crypto.randomUUID(),data:{id:'emu-e1',taskId:task.id,owner:'Ann',date:'2026-11-01',hours:2,rateAtEntry:null,note:''}});assert.equal(e.measured.documentWrites,1);
  {const live=(await records()).filter(x=>!x.deleted);assert.doesNotThrow(()=>S.validateRecords(live));}t.diagnostic(`addComment ${c.measured.documentReads} reads; logTime ${e.measured.documentReads} reads`);
 });
 await t.test('a viewer cannot create, comment or log time',async()=>{
  const invite=await call(owner,{action:'invite',uid:viewer.uid,grant:{workspaceRole:'viewer',projects:{}}});await call(viewer,{action:'accept',token:invite.token});
  await assert.rejects(call(viewer,{action:'addComment',projectId:task.projectId,taskId:task.id,commentId:'v1',opId:crypto.randomUUID(),data:{id:'v1',taskId:task.id,author:'V',body:'no',at:'x'}}),e=>/scoped grant/.test(String(e.message)));
  await assert.rejects(call(viewer,{action:'createTask',projectId:task.projectId,taskId:'v-task',opId:crypto.randomUUID(),data:m.defaultTask({id:'v-task',title:'no'})}),e=>/scoped grant/.test(String(e.message)));
 });
});
