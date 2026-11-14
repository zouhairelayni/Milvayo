// /tests/cloud/patch-mode.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {database,workspace}=require('../helpers/cloud-fake.cjs');
test('the snapshot-authorization experiment is off by default and, when enabled, gives identical results with the same read and write counts',async()=>{
 assert.equal(process.env.MILVAYO_PATCH_AUTH_MODE,undefined,'default mode is transactional');
 const run=async mode=>{if(mode)process.env.MILVAYO_PATCH_AUTH_MODE=mode;else delete process.env.MILVAYO_PATCH_AUTH_MODE;try{const x=database(workspace()),r=await x.patch('alice','task-2',{title:'Same',due:'2026-12-01'});return {r,x};}finally{delete process.env.MILVAYO_PATCH_AUTH_MODE;}};
 const a=await run(null),b=await run('snapshot');assert.equal(a.r.measured.authMode,'transaction');assert.equal(b.r.measured.authMode,'snapshot');
 assert.equal(a.r.measured.documentReads,b.r.measured.documentReads);assert.equal(a.r.measured.documentWrites,b.r.measured.documentWrites);assert.deepEqual(a.r.record.data.title,b.r.record.data.title);
 process.env.MILVAYO_PATCH_AUTH_MODE='snapshot';try{const x=database(workspace());x.grant('viewer',{workspaceRole:'viewer',projects:{}});await assert.rejects(x.patch('viewer','task-2',{title:'no'}),/scoped grant/);await assert.rejects(x.patch('alice','task-2',{title:'x'},{orgId:'other-org'}),/unavailable/);}finally{delete process.env.MILVAYO_PATCH_AUTH_MODE;}
});
test('stage timings and the read-only latency probe are administrator instrumentation only',async()=>{
 const x=database(workspace()),r=await x.patch('alice','task-2',{title:'Timed'});
 assert.ok(r.measured.timings.transactionMs>=0);assert.equal(r.measured.timings.attemptMs.length,1,'one attempt, no retry');assert.ok(r.measured.timings.accessMs>=0);
 const p=await x.run('alice',{action:'latencyProbe',iterations:3});assert.equal(p.iterations,3);for(const k of ['plainRead','readOnlyTransactionOneDoc','readOnlyTransactionFiveDocs'])assert.ok(p[k].medianMs>=0&&p[k].maxMs>=p[k].medianMs,k);assert.deepEqual(x.writes,[x.root+'/records/'+x.task('task-2').key],'the probe wrote nothing');
 x.grant('bob',{workspaceRole:'manager',projects:{}});const b=await x.patch('bob','task-3',{title:'No instrumentation for non-admin'});assert.equal(b.measured,undefined);await assert.rejects(x.run('bob',{action:'latencyProbe'}),/administrator/);
});
test('non-administrators receive stage timings only when the emulator is started with MILVAYO_BENCH=1 and the request asks for them',async()=>{
 const x=database(workspace());x.grant('bob',{workspaceRole:'manager',projects:{}});
 const ask=bench=>x.patch('bob','task-3',{title:'t'+Math.random()},{bench});
 assert.equal((await ask(true)).txTimings,undefined,'off by default');
 process.env.MILVAYO_BENCH='1';try{const on=await ask(true),off=await ask(false);assert.ok(on.txTimings.transactionMs>=0);assert.equal(on.txTimings.attemptMs.length,1);assert.equal(off.txTimings,undefined,'the request must ask');}finally{delete process.env.MILVAYO_BENCH;}
});
test('the service-reported counts agree with the independent fake-database instrumentation',async()=>{
 const x=database(workspace()),m=await x.measure(()=>x.patch('alice','task-2',{title:'Counted'}));
 assert.equal(m.reads,m.result.measured.documentReads);assert.equal(m.writes,m.result.measured.documentWrites);
 const y=database(workspace());y.rows.set(y.root+'/records/'+y.task('task-3').key,y.task('task-3'));const d=await y.measure(()=>y.service.execute('alice',{...y.scope,action:'deleteTask',projectId:y.task('task-3').projectId,taskId:'task-3',opId:'count-del',baseRevision:y.task('task-3').revision}));
 assert.equal(d.reads,d.result.measured.documentReads);assert.equal(d.writes,d.result.measured.documentWrites);
});
