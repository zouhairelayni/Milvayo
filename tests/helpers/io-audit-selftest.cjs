// /tests/helpers/io-audit-selftest.cjs
'use strict';
// Lightweight meter smoke test without Firebase modules; actual emulator test still required.
const assert=require('node:assert/strict');const meter=require('../../src/cloud/server/ioAudit.cjs');
class FakeDoc{constructor(id){this.id=id;}async get(){return {exists:true,data:()=>({id:this.id})};}async set(){return true;}async update(){return true;}async delete(){return true;}async create(){return true;}}
class FakeAggregate{async get(){return {data:()=>({count:11})};}}
class FakeCollection{doc(id){return new FakeDoc(id);}count(){return new FakeAggregate();}async get(){return {size:3,docs:[1,2,3]};}}
const db={doc:p=>{assert.equal(p.split('/').length%2,0,'Firestore probe must be a document path');return new FakeDoc(p);},collection:()=>new FakeCollection(),runTransaction:async(fn)=>{const changes=[];const tx={get:async ref=>({exists:true,data:()=>({id:ref.id})}),update:()=>changes.push('update'),set:()=>changes.push('set'),create:()=>changes.push('create'),delete:()=>changes.push('delete')};return await fn(tx);}};
class FakeReference{async transaction(fn){return {committed:fn(1)!==undefined};}async get(){return 1;}async set(){return true;}async remove(){return true;}}
const rtdb={ref:()=>new FakeReference()};
async function main(){meter.instrument(db,rtdb);const output=[];const original=process.stdout.write;process.stdout.write=(s,...args)=>{output.push(String(s));return true;};
 try{
  await meter.run('smoke',async()=>{await db.runTransaction(async tx=>{await tx.get(db.doc('x/y'));tx.update(db.doc('x/y'),{value:1});});await db.collection('x').get();await db.collection('x').count().get();await rtdb.ref('x').transaction(v=>v+1);await rtdb.ref('x').get();});
 }finally{process.stdout.write=original;}
 const data=JSON.parse(output.join('').split('[MILVAYO_IO_AUDIT] ')[1]);assert.equal(data.action,'smoke');assert.equal(data.firestore.writes,1);assert.equal(data.firestore.documentReads,5);assert.equal(data.firestore.aggregationCalls,1);assert.equal(data.rtdb.transactionCalls,1);assert.equal(data.rtdb.getCalls,1);
 console.log('IO audit meter smoke test PASS (not Firebase emulator verification)');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
