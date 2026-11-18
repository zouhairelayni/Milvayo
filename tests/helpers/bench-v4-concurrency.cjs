// /tests/helpers/bench-v4-concurrency.cjs
'use strict';
// Emulator-only concurrency investigation for v4 patches. Not part of test:cloud. Run once under firebase emulators:exec (see README-V4-VERIFICATION.md).
// It records, per request: client-to-Function delay, token verification, handler execution, authorization reads, transaction wall time and attempts,
// and runs controls that separate shared-document contention from Functions/Firestore emulator throughput. It asserts nothing about the cause.
const fs=require('node:fs'),crypto=require('node:crypto');
const H=require('./cloud-emulators.cjs'),{PROJECT_ID}=require('../../src/cloud/config.cjs'),{generate}=require('../../src/cloud/tools/fixtures.cjs');
if(!PROJECT_ID.startsWith('demo-'))throw Error('Emulator-only benchmark: refusing a non-demo project');
if(process.env.MILVAYO_BENCH!=='1')throw Error('Start the emulators with MILVAYO_BENCH=1 so the Function returns stage timings to non-administrator users');
const USERS=Number(process.env.BENCH_USERS||30),TASKS=Number(process.env.BENCH_TASKS||500),OUT=process.env.BENCH_OUT||`${process.env.HOME||'.'}/milvayo-v4-concurrency.json`;
const URL=`http://127.0.0.1:5001/${PROJECT_ID}/us-central1/cloudApi`,round=x=>Math.round(x*10)/10,log=(...a)=>console.log('[concurrency]',...a);
const pct=(xs,q)=>{if(!xs.length)return null;const s=[...xs].sort((a,b)=>a-b);return round(s[Math.min(s.length-1,Math.ceil(q*s.length)-1)]);};
const mean=xs=>xs.length?round(xs.reduce((a,b)=>a+b,0)/xs.length):null;
async function post(user,body){
 const sentAt=Date.now(),start=performance.now();
 const res=await fetch(URL,{method:'POST',headers:{'Content-Type':'application/json','x-bench':'1','x-bench-sent-at':String(sentAt),Authorization:'Bearer '+user.token},body:JSON.stringify({...body,bench:true}),signal:AbortSignal.timeout(170000)});
 const json=await res.json().catch(()=>({}));return {ok:res.ok&&json.ok!==false,status:res.status,json,latencyMs:round(performance.now()-start)};
}
function stages(results){
 const t=results.map(r=>r.json?.timings).filter(Boolean),m=results.map(r=>r.json?.txTimings||r.json?.measured?.timings).filter(Boolean),attempts=m.map(x=>x.attemptMs?.length||1);
 return {requests:results.length,succeeded:results.filter(r=>r.ok).length,failed:results.filter(r=>!r.ok).map(r=>({status:r.status,error:r.json?.error||r.json?.code||null})).slice(0,5),
  p50Ms:pct(results.map(r=>r.latencyMs),0.5),p95Ms:pct(results.map(r=>r.latencyMs),0.95),maxMs:pct(results.map(r=>r.latencyMs),1),
  meanClientToFunctionMs:mean(t.map(x=>x.clientToFunctionMs).filter(Number.isFinite)),meanVerifyTokenMs:mean(t.map(x=>x.verifyTokenMs)),meanExecuteMs:mean(t.map(x=>x.executeMs)),meanHandlerMs:mean(t.map(x=>x.handlerMs)),
  meanAccessMs:mean(m.map(x=>x.accessMs).filter(Number.isFinite)),meanTransactionMs:mean(m.map(x=>x.transactionMs).filter(Number.isFinite)),
  requestsWithRetries:attempts.filter(a=>a>1).length,maxAttempts:attempts.length?Math.max(...attempts):null,peakInFlightSeenByFunction:t.length?Math.max(...t.map(x=>x.peakInFlight||0)):null,authModes:[...new Set(results.map(r=>r.json?.measured?.authMode).filter(Boolean))],timingRowsWithTransactionData:m.length};
}
async function wave(label,jobs,out){
 const wall=performance.now(),results=await Promise.all(jobs.map(j=>j().catch(e=>({ok:false,status:0,json:{error:e.message},latencyMs:round(performance.now()-wall)}))));const elapsedMs=round(performance.now()-wall);
 const row={label,concurrency:jobs.length,elapsedMs,completedPerSecond:round(results.filter(r=>r.ok).length/(elapsedMs/1000)),...stages(results)};out.push(row);log(label,`c=${jobs.length}`,`p50 ${row.p50Ms} ms`,`p95 ${row.p95Ms} ms`,`${row.completedPerSecond}/s`,`retries ${row.requestsWithRetries}`,`ok ${row.succeeded}/${row.requests}`);return row;
}
async function main(){
 const report={startedAt:new Date().toISOString(),projectId:PROJECT_ID,users:USERS,tasks:TASKS,env:{authMode:process.env.MILVAYO_PATCH_AUTH_MODE||'transaction',javaToolOptions:process.env.JAVA_TOOL_OPTIONS||null,node:process.version},probe:null,sequential:null,sweep:[],controls:[]};
 const save=()=>fs.writeFileSync(OUT,JSON.stringify(report,null,2));
 try{
  log('Setup (excluded from results): owner workspace with',TASKS,'tasks and',USERS,'contributors');
  const owner=await H.account('conc-owner'),published=await H.publish(owner,generate({tasks:TASKS,objects:0}),'conc-shared'),scope={orgId:published.orgId,workspaceId:published.workspaceId},call=(u,b)=>post(u,{...scope,...b});
  await call(owner,{action:'subscription',capacity:USERS+2});await call(owner,{action:'workspaceControl',protocol:4});
  const tasks=(await call(owner,{action:'pull'})).json.records.filter(r=>r.kind==='tasks'&&!r.deleted);if(tasks.length<USERS+40)throw Error('Not enough tasks');
  const peers=[];for(let i=0;i<USERS;i++){const u=await H.account('conc-peer-'+i),inv=await call(owner,{action:'invite',uid:u.uid,grant:{workspaceRole:'contributor',projects:{}}});await call(u,{action:'accept',token:inv.json.token});peers.push(u);}
  const patchJob=(user,task,i,sc=scope)=>()=>post(user,{...sc,action:'patch',projectId:task.projectId,taskId:task.id,opId:crypto.randomUUID(),baseRevision:task.revision,set:{title:`bench ${i} ${crypto.randomUUID().slice(0,6)}`}});
  // 0. Floor: plain reads and read-only transactions on the same Function and emulators, no writes.
  log('0. Latency floor (read-only probe)');const probe=await call(owner,{action:'latencyProbe',iterations:10});report.probe={...probe.json,roundTripMs:probe.latencyMs};save();
  // 1. Sequential baseline: one request at a time.
  log('1. Sequential baseline');const seq=[];for(let i=0;i<20;i++)seq.push(await patchJob(owner,tasks[i],i)());report.sequential={...stages(seq)};save();
  // 2. Sweep: distinct users, distinct tasks, one shared workspace.
  let cursor=20;for(const level of [1,2,5,10,20,30].filter(l=>l<=USERS)){log('2. Shared workspace, distinct users, level',level);await wave(`shared-workspace distinct-users c=${level}`,Array.from({length:level},(_,i)=>patchJob(peers[i],tasks[cursor+i],i)),report.sweep);cursor+=level;if(cursor+USERS>tasks.length)cursor=20;save();}
  // 3. Control B: concurrent read-only probes (no writes at all).
  log('3. Control B: concurrent read-only probes');await wave(`control B: read-only probes c=${USERS}`,Array.from({length:USERS},()=>()=>call(owner,{action:'latencyProbe',iterations:1})),report.controls);save();
  // 4. Control C: every user edits their OWN organization and workspace (no shared documents at all).
  log('4. Control C: disjoint organizations (setup excluded)');const own=[];
  for(let i=0;i<USERS;i++){const u=peers[i],pub=await H.publish(u,generate({tasks:20,objects:0}),'conc-own-'+i),sc={orgId:pub.orgId,workspaceId:pub.workspaceId};await post(u,{...sc,action:'workspaceControl',protocol:4});const t=(await post(u,{...sc,action:'pull'})).json.records.find(r=>r.kind==='tasks'&&!r.deleted);own.push({u,sc,t});}
  await wave(`control C: disjoint-organizations c=${USERS}`,own.map(({u,sc,t},i)=>patchJob(u,t,i,sc)),report.controls);save();
  // 5. Control A: ONE token, distinct tasks, one shared workspace. Revisions are re-read first (the sweep already edited tasks 20 to 88).
  const fresh=(await call(owner,{action:'pull'})).json.records.filter(r=>r.kind==='tasks'&&!r.deleted).slice(100,160);
  for(const [level,from] of [[15,0],[USERS,15]].filter(([l,f])=>f+l<=fresh.length)){log('5. Control A: single token, same workspace, c='+level);await wave(`control A: single-token same-workspace c=${level}`,fresh.slice(from,from+level).map((t,i)=>patchJob(owner,t,i)),report.controls);save();}
  // 6. Control D: the same single token, but every edit goes to a DIFFERENT workspace of the same organization. The platform allows at most 20 workspaces per organization, so this control uses 15.
  const D=15;
  try{log('6. Control D: single token, 15 workspaces in one organization (setup excluded)');const multi=[];
   for(let i=0;i<D;i++){const pub=await H.publish(owner,generate({tasks:10,objects:0}),'conc-multi-'+i),sc={orgId:pub.orgId,workspaceId:pub.workspaceId};await post(owner,{...sc,action:'workspaceControl',protocol:4});const t=(await post(owner,{...sc,action:'pull'})).json.records.find(r=>r.kind==='tasks'&&!r.deleted);multi.push({sc,t});}
   await wave(`control D: single-token distinct-workspaces c=${D}`,multi.map(({sc,t},i)=>patchJob(owner,t,i,sc)),report.controls);save();
  }catch(e){report.controlDError=e.message;save();log('Control D could not run:',e.message);}
  // 7. The original wave again, twice, now that the emulator has already handled 30 concurrent requests. If these are fast, the early slowness was the emulator
  // starting its Function workers (a one-time cost), not contention in our code or in Firestore.
  for(const rep of [1,2]){const again=(await call(owner,{action:'pull'})).json.records.filter(r=>r.kind==='tasks'&&!r.deleted).slice(200+rep*50,200+rep*50+USERS);
   log('7. Repeat of the shared-workspace wave, run',rep);await wave(`repeat ${rep}: shared-workspace distinct-users c=${USERS} (warm)`,again.map((t,i)=>patchJob(peers[i],t,i)),report.controls);save();}
  report.finishedAt=new Date().toISOString();save();
  const byLabel=l=>report.sweep.find(r=>r.label.includes(`c=${l}`))||null,shared=byLabel(USERS),a=report.controls.find(c=>c.label.startsWith('control A')&&c.label.endsWith(`c=${USERS}`)),a15=report.controls.find(c=>c.label.startsWith('control A')&&c.label.endsWith('c=15')),d=report.controls.find(c=>c.label.startsWith('control D')),b=report.controls.find(c=>c.label.startsWith('control B')),c=report.controls.find(c=>c.label.startsWith('control C'));
  console.table([...report.sweep,...report.controls].map(r=>({label:r.label,ok:`${r.succeeded}/${r.requests}`,p50:r.p50Ms,p95:r.p95Ms,perSec:r.completedPerSecond,retries:r.requestsWithRetries,queueMs:r.meanClientToFunctionMs,execMs:r.meanExecuteMs,txMs:r.meanTransactionMs,inFlight:r.peakInFlightSeenByFunction,maxTries:r.maxAttempts})));
  console.log('\nHow to read this (comparisons, not conclusions):');
  console.log(' - shared c=30 vs control C (disjoint organizations): a large drop in C points at shared-document contention; no drop points at Functions/Firestore emulator throughput or the device.');
  console.log(' - A c=15 vs D c=15 (same single token): A shares the workspace, D shares only the organization; a large A-to-D drop points at workspace-level contention (records collection, workspace document); no drop points at organization-level documents or the emulator.');
  console.log(' - shared vs A: a difference points at per-user effects (token verification, per-user documents).');
  console.log(' - control B slow with no writes: the emulators serialize even read-only work; not a patch or locking problem.');
  console.log(' - requestsWithRetries > 0 and long attempts: transaction retries; meanClientToFunctionMs large: requests wait before the Function starts (queueing).');
  console.log('Full report:',OUT);const rep1=report.controls.find(c=>c.label.startsWith('repeat 1')),rep2=report.controls.find(c=>c.label.startsWith('repeat 2'));
  log('p50 ms | FIRST shared c=30:',shared?.p50Ms,'| REPEAT 1:',rep1?.p50Ms,'| REPEAT 2:',rep2?.p50Ms,'|| A single token c=15:',a15?.p50Ms,'| A c=30:',a?.p50Ms,'| B read-only:',b?.p50Ms,'| C disjoint organizations:',c?.p50Ms,'| D distinct workspaces c=15:',d?.p50Ms);
 }catch(err){report.error={message:err.message,stack:err.stack};save();console.error(err);process.exitCode=1;}
}
main();
