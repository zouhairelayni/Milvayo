// /tests/cloud/io-audit-remaining.emulator.test.cjs
'use strict';
// Completes the positive-path action inventory missed by the existing cloud suite.
// This is a real Firebase emulator test, not a fake-database benchmark.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const H=require('../helpers/cloud-emulators.cjs');
const {generate}=require('../../src/cloud/tools/fixtures.cjs');
const enabled=process.env.MILVAYO_EMULATORS==='1';

test('I/O audit: group deletion, Canvas geometry and latency probe use Firebase emulators',
 {skip:enabled?false:'Firebase emulators required',timeout:180000},async()=>{
  const owner=await H.account('io-full-coverage');
  const fixture=await H.publish(owner,generate({tasks:3,objects:10}),'io-coverage');
  const scope={orgId:fixture.orgId,workspaceId:fixture.workspaceId};
  const call=body=>H.request(owner,{...scope,...body});

  // The existing suite exercises a rejected groupDelete; also measure a success.
  assert.equal((await call({action:'groupSave',kind:'teams',id:'io-team',name:'I/O Audit Team',members:[]})).saved,true);
  assert.equal((await call({action:'groupDelete',kind:'teams',id:'io-team'})).deleted,true);

  const records=(await call({action:'pull',cursor:0})).records;
  const object=records.find(r=>r.kind==='canvas.objects'&&!r.deleted);
  assert.ok(object,'the imported fixture must contain a live Canvas object');
  await call({action:'workspaceControl',protocol:4});
  const r=await call({action:'patchCanvas',projectId:object.projectId,boardId:object.boardId,
   objectId:object.id,baseRevision:object.revision,opId:crypto.randomUUID(),set:{x:object.data.x+10}});
  assert.equal(r.ok,true);
  assert.equal(r.record.data.x,object.data.x+10);
  assert.equal(r.measured.documentWrites,1);

  const probe=await call({action:'latencyProbe',iterations:1});
  assert.equal(probe.ok,true);
  assert.equal(probe.iterations,1);
  assert.ok(probe.readOnlyTransactionFiveDocs.medianMs>=0);
 });
