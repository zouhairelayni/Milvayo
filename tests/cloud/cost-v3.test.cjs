// /tests/cloud/cost-v3.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{projectUsage,estimate}=require('../../src/cloud/costModel.cjs'),table=require('../../docs/cloud/prices-us-central1.json');
test('v3 variants isolate narrow workflow mutations and the change signal without altering earlier variants',()=>{
 const before=projectUsage(1000,'v085-combined'),mutations=projectUsage(1000,'v3-mutations'),signal=projectUsage(1000,'v3-signal'),combined=projectUsage(1000,'v3-combined'),baseline=projectUsage(1000,'v084-baseline');
 assert.deepEqual(projectUsage(1000,'v085-combined'),before);
 assert.ok(mutations.firestoreReads<baseline.firestoreReads&&mutations.functionRequests===baseline.functionRequests);
 assert.ok(signal.firestoreReads>combined.firestoreReads&&combined.firestoreReads<before.firestoreReads);
 assert.ok(estimate(combined,table).knownSubtotal<estimate(before,table).knownSubtotal);
 assert.equal(projectUsage(1000,'v3-mutations',{workflowMutationShare:0}).firestoreReads,projectUsage(1000,'v085-mutations').firestoreReads);
});
test('the change signal saves requests only as sessions grow; a 20-minute session is roughly neutral',()=>{
 const req=(v,m)=>projectUsage(1000,v,{sessionMinutesPerUserDay:m}).functionRequests;
 assert.ok(req('v3-combined',480)<req('v085-combined',480)*.5);
 assert.ok(Math.abs(req('v3-combined',20)-req('v085-combined',20))/req('v085-combined',20)<.15);
});
test('workflow mutation share cannot exceed the remaining non-simple share',()=>{
 assert.throws(()=>projectUsage(1000,'v3-combined',{simpleMutationShare:.8,workflowMutationShare:.3}),/workflow mutation share/);
 assert.throws(()=>projectUsage(1000,'v3-combined',{workflowMutationShare:-1}),/workflow mutation share/);
});
