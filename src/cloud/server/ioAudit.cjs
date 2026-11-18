// /src/cloud/server/ioAudit.cjs
'use strict';
// Emulator-only, opt-in SDK-call meter. Does NOT calculate Firebase billable operations.
// Counts reads returned by Firestore SDK, successful transaction writes, and RTDB method calls.
const {AsyncLocalStorage}=require('node:async_hooks');
const {performance}=require('node:perf_hooks');
const als=new AsyncLocalStorage();
const patched=new WeakMap();
const counters=()=>({firestore:{documentReads:0,documentReadCalls:0,queryCalls:0,queryReturnedDocuments:0,aggregationCalls:0,transactionAttempts:0,transactionRetries:0,transactionsCommitted:0,transactionsFailed:0,setWrites:0,updateWrites:0,createWrites:0,deleteWrites:0,directWrites:0,unclassifiedCalls:0},rtdb:{getCalls:0,transactionCalls:0,setCalls:0,updateCalls:0,removeCalls:0},storage:{instrumented:false}});
function active(){return als.getStore();}
function inc(k,n=1){const c=active();if(c)c.firestore[k]=(c.firestore[k]||0)+n;}
function recordRead(snap,isQuery=false){
 const c=active();if(!c)return;
 c.firestore.documentReadCalls++;
 if(isQuery||typeof snap?.size==='number'||Array.isArray(snap?.docs)){
  const n=snap?.size??snap?.docs?.length??0;
  c.firestore.queryCalls++;c.firestore.queryReturnedDocuments+=n;
  // A zero-result query is a request, not necessarily zero billable document reads.
  c.firestore.documentReads+=Math.max(1,n);
 }else if(Array.isArray(snap)){c.firestore.documentReads+=snap.length;
 }else{c.firestore.documentReads++;}
}
function recordWrite(kind){inc(kind==='delete'?'deleteWrites':kind+'Writes');}
function installMethod(prototype,name,handler){
 let owner=prototype;
 while(owner&&!Object.prototype.hasOwnProperty.call(owner,name))owner=Object.getPrototypeOf(owner);
 if(!owner||typeof owner[name]!=='function')return;
 let names=patched.get(owner);if(!names){names=new Set();patched.set(owner,names);}if(names.has(name))return;
 const original=owner[name];Object.defineProperty(owner,name,{configurable:true,writable:true,value:function(...args){return handler.call(this,original,args);}});names.add(name);
}
function instrument(db,rtdb){
 if(!db||db.__milvayoAudited)return;
 Object.defineProperty(db,'__milvayoAudited',{value:true});
 const rawRun=db.runTransaction.bind(db);
 db.runTransaction=function(callback,...rest){
  const c=active();if(!c)return rawRun(callback,...rest);
  let attempts=0,lastWrites=[];
  return rawRun(async tx=>{
   attempts++;inc('transactionAttempts');const writeKinds=[];
   const wrapper=new Proxy(tx,{get(target,key){
    if(key==='get')return async function(ref,...args){const s=await target.get(ref,...args);recordRead(s,typeof s?.size==='number'||Array.isArray(s?.docs));return s;};
    if(key==='getAll')return async function(...args){const rows=await target.getAll(...args);recordRead(rows);return rows;};
    if(['set','update','create','delete'].includes(key))return function(...args){const result=target[key](...args);writeKinds.push(key);return result===target?wrapper:result;};
    const v=target[key];return typeof v==='function'?v.bind(target):v;
   }});
   const value=await callback(wrapper);lastWrites=writeKinds;return value;
  },...rest).then(value=>{inc('transactionsCommitted');inc('transactionRetries',Math.max(0,attempts-1));for(const name of lastWrites)recordWrite(name);return value;},error=>{inc('transactionsFailed');inc('transactionRetries',Math.max(0,attempts-1));throw error;});
 };
 // Probe must use a valid document path (even number of segments).
 const doc=db.doc('__milvayo_io_audit__/probe');
 const collection=db.collection('__milvayo_io_audit__');
 installMethod(Object.getPrototypeOf(doc),'get',function(raw,args){return Promise.resolve(raw.apply(this,args)).then(s=>{recordRead(s);return s;});});
 installMethod(Object.getPrototypeOf(collection),'get',function(raw,args){return Promise.resolve(raw.apply(this,args)).then(s=>{recordRead(s,true);return s;});});
 try{const agg=collection.count();installMethod(Object.getPrototypeOf(agg),'get',function(raw,args){return Promise.resolve(raw.apply(this,args)).then(s=>{inc('aggregationCalls');inc('documentReads');return s;});});}catch{}
 for(const [type,owner] of [['set',doc],['update',doc],['create',doc],['delete',doc]]){
  installMethod(Object.getPrototypeOf(owner),type,function(raw,args){return Promise.resolve(raw.apply(this,args)).then(v=>{recordWrite(type);inc('directWrites');return v;});});
 }
 if(rtdb&&typeof rtdb.ref==='function'){
  // Patch reference methods once, not Database.ref. Every ref (including ones
  // obtained before this method is called) then shares the same instrumented
  // prototype. RTDB operations are counted as attempted SDK calls, not bytes.
  const sample=rtdb.ref('__milvayo_io_audit__/probe'); // creates no database data
  const names={get:'getCalls',once:'getCalls',transaction:'transactionCalls',set:'setCalls',update:'updateCalls',remove:'removeCalls'};
  for(const [method,counter] of Object.entries(names)){
   installMethod(Object.getPrototypeOf(sample),method,function(raw,args){
    const c=active();if(c)c.rtdb[counter]++;
    return raw.apply(this,args);
   });
  }
 }
}
async function run(action,fn){
 const c=counters(),start=performance.now();const cleanAction=typeof action==='string'&&/^[a-zA-Z][a-zA-Z0-9]{0,79}$/.test(action)?action:'(invalid-action)';
 return als.run(c,async()=>{
  let outcome='success',result;
  try{result=await fn();if(result?.ok===false)outcome='application-rejected';return result;}
  catch(e){outcome='error';throw e;}
  finally{
   const f=c.firestore;
   const output={tag:'milvayo-v4-io-audit',action:cleanAction,outcome,elapsedMs:+(performance.now()-start).toFixed(2),firestore:{...f,writes:f.setWrites+f.updateWrites+f.createWrites,deletes:f.deleteWrites},rtdb:c.rtdb};
   // stdout remains in user's emulator log; never include user IDs, tokens or request payloads.
   process.stdout.write('[MILVAYO_IO_AUDIT] '+JSON.stringify(output)+'\n');
  }
 });
}
module.exports={instrument,run};
