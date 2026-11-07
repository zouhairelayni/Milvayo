// /src/cloud/server/index.cjs
'use strict';
const {assertServerEnvironment,PROJECT_ID}=require('../config.cjs');
const {onRequest}=require('firebase-functions/v2/https');
const {initializeApp,getApps}=require('firebase-admin/app');
const {getFirestore}=require('firebase-admin/firestore');
const {getAuth}=require('firebase-admin/auth');
const {getDatabase}=require('firebase-admin/database');
let service,app;
const counters={requests:0,succeeded:0,failed:0,recordedReads:0,recordedWrites:0,samples:[]};
function metrics(){const sorted=counters.samples.slice().sort((a,b)=>a-b),at=q=>sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*q)-1)]??null;return {...counters,samples:undefined,sampleCount:sorted.length,p50Ms:at(.5),p95Ms:at(.95),p99Ms:at(.99),heapBytes:process.memoryUsage().heapUsed,scope:'Current emulator worker only; operation counts cover instrumented responses, not billing',rtdbTraffic:'See client payload counters',storageTraffic:'Not instrumented',productionCosts:'Not measured'};}

exports.cloudApi=onRequest({cors:true,maxInstances:1,memory:'256MiB',timeoutSeconds:120},async(req,res)=>{
 const started=performance.now(),cpuStarted=process.cpuUsage();counters.requests++;
 try{
  assertServerEnvironment();
  if(req.method!=='POST'){counters.failed++;return res.status(405).json({error:'POST required'});}
  if(!service){app||=getApps().find(a=>a.name==='milvayo-emulator-server')||initializeApp({projectId:PROJECT_ID,databaseURL:`http://${process.env.FIREBASE_DATABASE_EMULATOR_HOST}?ns=${PROJECT_ID}-default-rtdb`,storageBucket:PROJECT_ID+'.appspot.com'},'milvayo-emulator-server');service=require('./service.cjs').createService(getFirestore(app),getDatabase(app),metrics);}
  const token=String(req.headers.authorization||'').match(/^Bearer (.+)$/)?.[1];if(!token){counters.failed++;return res.status(401).json({error:'Authentication required',code:'unauthenticated'});}
  const actor=await getAuth(app).verifyIdToken(token);const result=await service.execute(actor.uid,req.body);counters.succeeded++;if(Number.isFinite(result.measured?.documentReads))counters.recordedReads+=result.measured.documentReads;if(Number.isFinite(result.measured?.documentWrites))counters.recordedWrites+=result.measured.documentWrites;counters.samples.push(performance.now()-started);if(counters.samples.length>200)counters.samples.shift();res.json({...result,telemetry:{functionExecutionMs:performance.now()-started,cpuMicroseconds:process.cpuUsage(cpuStarted),heapBytes:process.memoryUsage().heapUsed}});
 }catch(e){counters.failed++;const status={'permission-denied':403,unauthenticated:401,conflict:409,'already-exists':409,'invalid-argument':400,'failed-precondition':412}[e.code]||400;res.status(status).json({error:e.message,code:e.code||'invalid-argument'});}
});
