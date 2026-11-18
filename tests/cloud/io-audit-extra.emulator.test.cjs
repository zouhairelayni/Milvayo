// /tests/cloud/io-audit-extra.emulator.test.cjs
'use strict';
// Positive-path coverage for API actions absent from v0.8.10 cloud tests.
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const H=require('../helpers/cloud-emulators.cjs');
const skip=process.env.MILVAYO_EMULATORS!=='1'?'Run with Firebase emulators':false;
test('I/O audit: organization creation and billing history use actual emulators',{skip,timeout:90000},async()=>{
 const user=await H.account('io-audit');
 const org=await H.request(user,{action:'organizationCreate',name:'I/O audit organization',mutationId:crypto.randomUUID()});
 assert.ok(org.orgId);
 const events=await H.request(user,{action:'billingHistory',orgId:org.orgId});
 assert.ok(Array.isArray(events.events));
});
