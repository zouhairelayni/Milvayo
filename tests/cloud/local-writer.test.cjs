// /tests/cloud/local-writer.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{acquireLocalWriter}=require('../../src/cloud/localWriterCore.cjs');
function locks(){const held=new Set();return {request:async(key,options,callback)=>{assert.equal(options.ifAvailable,true);if(held.has(key))return callback(null);held.add(key);try{return await callback({name:key});}finally{held.delete(key);}}};}
test('same-origin writer lock blocks a second writer until explicit release',async()=>{const api=locks(),release=await acquireLocalWriter(api,'main');await assert.rejects(acquireLocalWriter(api,'main'),{code:'workspace-in-use'});const other=await acquireLocalWriter(api,'other');await release();await release();const takeover=await acquireLocalWriter(api,'main');await takeover();await other();});
test('unsupported coordination fails closed rather than using a racy localStorage lease',async()=>{await assert.rejects(acquireLocalWriter(null,'main'),{code:'workspace-coordination-unavailable'});});
