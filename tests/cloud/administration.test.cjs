// /tests/cloud/administration.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {administration}=require('../../src/cloud/server/administration.cjs');
test('platform role changes protect the final initialized owner and audit a permitted transfer',async()=>{
 let owners=1,writes=[];const ref=path=>({path}),tx={get:async r=>r.path==='owners'?{size:owners}:{exists:true,data:()=>r.path==='users/owner'?{}:{role:'owner'}},set:(r,value)=>writes.push({path:r.path,value}),delete:r=>writes.push({path:r.path,deleted:true}),create:(r,value)=>writes.push({path:r.path,value})};
 const db={doc:ref,collection:path=>({where:()=>ref('owners'),doc:()=>ref(path+'/audit')}),runTransaction:fn=>fn(tx)},api=administration({db,fail:(message,code)=>{throw Object.assign(Error(message),{code});}});
 await assert.rejects(api.platformRole('owner',{uid:'owner',role:'support'}),e=>e.code==='failed-precondition'&&/one platform owner/.test(e.message));assert.deepEqual(writes,[]);
 owners=2;assert.equal((await api.platformRole('owner',{uid:'owner',role:'support'})).role,'support');assert.ok(writes.some(w=>w.path==='platformAudit/audit'&&w.value.action==='Changed platform application role'));
});
