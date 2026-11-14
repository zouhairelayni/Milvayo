// /src/cloud/server/index.cjs
'use strict';
const {assertServerEnvironment,PROJECT_ID}=require('../config.cjs');
const {onRequest}=require('firebase-functions/v2/https');
const {initializeApp,getApps}=require('firebase-admin/app');
const {getFirestore}=require('firebase-admin/firestore');
const {getAuth}=require('firebase-admin/auth');
const {getDatabase}=require('firebase-admin/database');
const {publicError}=require('./publicError.cjs');
let service,app;
const counters={requests:0,succeeded:0,failed:0,recordedReads:0,recordedWrites:0,samples:[]};
function metrics(){const sorted=counters.samples.slice().sort((a,b)=>a-b),at=q=>sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*q)-1)]??null;return {...counters,samples:undefined,sampleCount:sorted.length,p50Ms:at(.5),p95Ms:at(.95),p99Ms:at(.99),heapBytes:process.memoryUsage().heapUsed,scope:'Current emulator worker only; operation counts cover instrumented responses, not billing',rtdbTraffic:'See client payload counters',storageTraffic:'Not instrumented',productionCosts:'Not measured'};}

exports.cloudApi=onRequest({cors:true,maxInstances:10,memory:'512MiB',cpu:1,concurrency:40,timeoutSeconds:120},async(req,res)=>{
 const started=performance.now(),cpuStarted=process.cpuUsage(),receivedAt=Date.now();counters.requests++;counters.inFlight=(counters.inFlight||0)+1;counters.peakInFlight=Math.max(counters.peakInFlight||0,counters.inFlight);const bench=req.headers['x-bench']==='1',sentAt=Number(req.headers['x-bench-sent-at']),inFlightAtStart=counters.inFlight;
 try{
  assertServerEnvironment();
  if(req.method!=='POST'){counters.failed++;return res.status(405).json({error:'POST required'});}
  if(!service){app||=getApps().find(a=>a.name==='milvayo-emulator-server')||initializeApp({projectId:PROJECT_ID,databaseURL:`http://${process.env.FIREBASE_DATABASE_EMULATOR_HOST}?ns=${PROJECT_ID}-default-rtdb`,storageBucket:PROJECT_ID+'.appspot.com'},'milvayo-emulator-server');service=require('./service.cjs').createService(getFirestore(app),getDatabase(app),metrics);}
  const token=String(req.headers.authorization||'').match(/^Bearer (.+)$/)?.[1];if(!token){counters.failed++;return res.status(401).json({error:'Authentication required',code:'unauthenticated'});}
  const verifyStart=performance.now(),actor=await getAuth(app).verifyIdToken(token),verifyTokenMs=performance.now()-verifyStart,executeStart=performance.now(),result=await service.execute(actor.uid,req.body),executeMs=performance.now()-executeStart;counters.succeeded++;if(Number.isFinite(result.measured?.documentReads))counters.recordedReads+=result.measured.documentReads;if(Number.isFinite(result.measured?.documentWrites))counters.recordedWrites+=result.measured.documentWrites;counters.samples.push(performance.now()-started);if(counters.samples.length>200)counters.samples.shift();// Worker telemetry is only attached to responses that already carry administrator instrumentation.
 // Stage timings for the concurrency investigation: only when the caller sends `x-bench: 1` and the response already carries administrator instrumentation.
 res.json(Number.isFinite(result.measured?.documentReads)||(bench&&process.env.MILVAYO_BENCH==='1')?{...result,telemetry:{functionExecutionMs:performance.now()-started,cpuMicroseconds:process.cpuUsage(cpuStarted),heapBytes:process.memoryUsage().heapUsed},...(bench?{timings:{clientToFunctionMs:Number.isFinite(sentAt)?receivedAt-sentAt:null,verifyTokenMs,executeMs,handlerMs:performance.now()-started,inFlightAtStart,peakInFlight:counters.peakInFlight}}:{})}:result);
 }catch(e){counters.failed++;const {status,body}=publicError(e);if(status===500)console.error('Unhandled cloudApi error',e);res.status(status).json(body);}finally{counters.inFlight--;}
});
