// /src/cloud/tools/costSimulator.cjs
'use strict';
// Run: firebase emulators:exec --only auth,firestore,database,functions,storage,hosting
//      --project demo-milvayo-083 'node src/cloud/tools/costSimulator.cjs pilot'
// Run without emulators: node src/cloud/tools/costSimulator.cjs project
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const os=require('node:os');
const {calibratedProjection}=require('./costSimCore.cjs');
const pilotPath=path.join(os.homedir(),'milvayo-cost-pilot.json');
const projectionPath=path.join(os.homedir(),'milvayo-cost-projection.json');
const projectionCsvPath=path.join(os.homedir(),'milvayo-cost-projection.csv');
function write(file,data){const tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(data,null,2)+'\n');fs.renameSync(tmp,file);}
function fmt(n){return Math.round(n*100)/100;}
function row(user,kind,tasks,role,body,result,ms,err,firstRevision=false){
 return {kind,tasks,role,uidSample:role,ok:!err,firstRevision,latencyMs:fmt(ms),
  reads:Number.isFinite(result?.measured?.documentReads)?result.measured.documentReads:null,
  writes:Number.isFinite(result?.measured?.documentWrites)?result.measured.documentWrites:null,
  deletes:Number.isFinite(result?.measured?.documentDeletes)?result.measured.documentDeletes:null,
  attempts:result?.measured?.transactionAttempts??null,retries:result?.measured?.transactionRetries??null,
  allAttemptsReads:result?.measured?.allAttemptsDocumentReads??null,
  validationClass:result?.measured?.validationClass??null,
  requestBytes:Buffer.byteLength(JSON.stringify(body)),
  responsePayloadBytes:result?Buffer.byteLength(JSON.stringify(result)):null,
  functionMs:Number.isFinite(result?.telemetry?.functionExecutionMs)?fmt(result.telemetry.functionExecutionMs):null,
  cpuMicros:result?.telemetry?.cpuMicroseconds??null,
  error:err?String(err.message||err):null};
}
async function pilot(){
 const required=['FIRESTORE_EMULATOR_HOST','FIREBASE_AUTH_EMULATOR_HOST','FIREBASE_DATABASE_EMULATOR_HOST'];
 for(const key of required)if(!process.env[key])throw Error('Refusing to run without local emulator: '+key+' missing');
 if(process.env.GCLOUD_PROJECT&&!process.env.GCLOUD_PROJECT.startsWith('demo-'))throw Error('Use a demo- Firebase project only');
 const H=require('../../../tests/helpers/cloud-emulators.cjs');
 const {generate}=require('./fixtures.cjs');
 const result={schema:'milvayo-cost-pilot-v1',generatedAt:new Date().toISOString(),
  project:'demo-milvayo-083',environment:{platform:process.platform,arch:process.arch,node:process.version},
  scope:'Synthetic isolated workspaces on local Firebase emulators; not real customers, not an actual invoice',
  strategy:'2 owners + 2 invited collaborators across 100 and 500 task workspaces; all requests sequential to avoid saturation',
  samples:[],errors:[],finished:false};
 const store=()=>write(pilotPath,result);
 const track=async(user,scope,tasks,role,kind,body,firstRevision=false)=>{
  const started=performance.now();let response=null,error=null;
  try{response=await H.request(user,{...scope,...body});}catch(e){error=e;}
  const sample=row(user,kind,tasks,role,body,response,performance.now()-started,error,firstRevision);
  result.samples.push(sample);store();
  if(error)throw Object.assign(Error(`${kind}/${tasks}/${role}: ${error.message}`),{cause:error});
  return response;
 };
 const change=(before,patch)=>({key:before.key,before,after:{...before,data:{...before.data,...patch}},baseRevision:before.revision});
 const commit=async(user,scope,tasks,role,kind,changes,{restore=false,firstRevision=false}={})=>track(user,scope,tasks,role,kind,{action:'commit',mutationId:crypto.randomUUID(),changes,...(restore?{restore:true}:{})},firstRevision);
 try{
  for(const taskCount of [100,500]){
   console.log('Creating synthetic workspace:',taskCount,'tasks');
   const owner=await H.account('cost-own-'+taskCount);
   const collaborator=await H.account('cost-peer-'+taskCount);
   const published=await H.publish(owner,generate({tasks:taskCount,objects:0}),`cost-sim-${taskCount}`);
   const scope={orgId:published.orgId,workspaceId:published.workspaceId};
   const invite=await H.request(owner,{...scope,action:'invite',uid:collaborator.uid,grant:{workspaceRole:'contributor',projects:{}}});
   await H.request(collaborator,{...scope,action:'accept',token:invite.token});
   const cold=await track(owner,scope,taskCount,'owner','coldPull',{action:'pull'});
   await track(owner,scope,taskCount,'owner','resumePull',{action:'pull',cursor:cold.cursor,accessVersion:cold.accessVersion});
   await track(collaborator,scope,taskCount,'contributor','collaboratorPull',{action:'pull'});
   const original=cold.records.filter(x=>x.kind==='tasks'&&!x.deleted);
   // Each action targets a distinct revision-1 task; restore is the one exception.
   const taskAt=i=>{const task=original[i];if(!task)throw Error('Insufficient tasks');return task;};
   const statusTask=original.find((x,i)=>i>7&&x.data.status==='Backlog');
   if(!statusTask)throw Error('Fixture missing a Backlog task');
   const titleBefore=taskAt(0);
   const first=await commit(owner,scope,taskCount,'owner','title',[change(titleBefore,{title:'Cost pilot title '+taskCount})],{firstRevision:true});
   const titleAfter=first.records[0];
   await commit(owner,scope,taskCount,'owner','titleRepeat',[change(titleAfter,{title:'Cost pilot title repeat '+taskCount})]);
   await commit(owner,scope,taskCount,'owner','owner',[change(taskAt(1),{owner:'Cost pilot editor'})],{firstRevision:true});
   await commit(owner,scope,taskCount,'owner','status',[change(statusTask,{status:'In progress'})],{firstRevision:true});
   await commit(owner,scope,taskCount,'owner','due',[change(taskAt(2),{due:'2026-12-01'})],{firstRevision:true});
   const deletedBefore=taskAt(3);
   const deletion=await commit(owner,scope,taskCount,'owner','softDelete',[{key:deletedBefore.key,before:deletedBefore,after:null,baseRevision:deletedBefore.revision}],{firstRevision:true});
   const tombstone=deletion.records.find(x=>x.key===deletedBefore.key);
   if(!tombstone?.deleted)throw Error('Soft deletion did not produce a tombstone');
   await commit(owner,scope,taskCount,'owner','restore',[{key:tombstone.key,before:null,after:{...tombstone,deleted:false},baseRevision:tombstone.revision}],{restore:true});
   // Actual second authenticated user editing a shared workspace; its read counter is
   // intentionally hidden by the backend for non-admin users.
   const peerTask=taskAt(20),peerStatus=original.find((x,i)=>i>25&&x.data.status==='Backlog');
   await commit(collaborator,scope,taskCount,'contributor','peerTitle',[change(peerTask,{title:'Peer updated title '+taskCount})],{firstRevision:true});
   await commit(collaborator,scope,taskCount,'contributor','peerOwner',[change(taskAt(21),{owner:'Peer contributor'})],{firstRevision:true});
   await commit(collaborator,scope,taskCount,'contributor','peerStatus',[change(peerStatus,{status:'In progress'})],{firstRevision:true});
   const projectId=titleBefore.projectId;
   await track(owner,scope,taskCount,'owner','message',{action:'message',projectId,threadId:'project',mutationId:crypto.randomUUID(),body:'Synthetic cost pilot conversation',mentions:[]});
   await track(collaborator,scope,taskCount,'contributor','messages',{action:'messages',projectId,threadId:'project',latest:true});
   const verify=await track(owner,scope,taskCount,'owner','verifyPull',{action:'pull'});
   const modified=verify.records.find(x=>x.key===titleBefore.key);
   if(modified?.data?.title!==`Cost pilot title repeat ${taskCount}`)throw Error('Remote title edit missing from final pull');
   const restored=verify.records.find(x=>x.key===deletedBefore.key);
   if(!restored||restored.deleted)throw Error('Restored task missing from final pull');
   console.log('Completed',taskCount,'task workspace; samples:',result.samples.length);
  }
  result.finished=true;
  store();
  console.log('\n=== CALIBRATION PILOT ===');
  console.table(result.samples.map(({kind,tasks,role,reads,writes,deletes,retries,latencyMs,ok})=>({kind,tasks,role,reads,writes,deletes,retries,latencyMs,ok})));
  console.log('Saved:',pilotPath);
 }catch(e){result.errors.push({message:e.message,at:new Date().toISOString()});store();throw e;}
}
function project(){
 if(!fs.existsSync(pilotPath))throw Error('Missing '+pilotPath+'; run the emulator pilot first');
 const pilot=JSON.parse(fs.readFileSync(pilotPath,'utf8'));
 if(!pilot.finished)throw Error('Pilot is incomplete. Review errors in '+pilotPath);
 const args=process.argv.slice(3);
 let kb=null;
 if(args.length){if(args.length!==2||args[0]!=='--rtdb-kb-per-active-day')throw Error('Usage: project [--rtdb-kb-per-active-day 250]');kb=Number(args[1]);}
 const report=calibratedProjection(pilot,{rtdbKBPerActiveDay:kb});write(projectionPath,report);
 const headers=['monthlyActiveUsers','activeUserDays','mutations','firestoreReads','firestoreWrites','firestoreDeletesInMeasuredScope','functionRequests','functionCpuSeconds','functionGiBSeconds','rtdbDownloadGB_assumed','incompleteSubtotalUSD'];
 const lines=[headers.join(',')];
 for(const r of report.results)lines.push([r.users,r.activeUserDays,r.mutations,r.usage.firestoreReads,r.usage.firestoreWrites,r.usage.firestoreDeletes,r.usage.functionRequests,r.usage.functionCpuSeconds,r.usage.functionGiBSeconds,r.usage.rtdbDownloadGB??'',r.knownSubtotalUSD].join(','));
 fs.writeFileSync(projectionCsvPath,lines.join('\n')+'\n');
 console.log('\n=== MONTHLY USER SCENARIOS — INCOMPLETE INFRASTRUCTURE SUBTOTALS ===');
 console.table(report.results.map(r=>({MAU:r.users,activeUserDays:fmt(r.activeUserDays),edits:fmt(r.mutations),reads:Math.round(r.usage.firestoreReads),writes:Math.round(r.usage.firestoreWrites),deletesInScope:r.usage.firestoreDeletes,functionRequests:Math.round(r.usage.functionRequests),estimatedUSD:fmt(r.knownSubtotalUSD)})));
 console.log('\nNOT INCLUDED: actual RTDB traffic (unless supplied), physical cleanup deletes, network, storage growth, backups, retries from failed requests or complete billed execution.');
 console.log('Full calibration, price components and assumptions:',projectionPath);
 console.log('Scenario CSV:',projectionCsvPath);
}
(async()=>{const mode=process.argv[2];if(mode==='pilot')await pilot();else if(mode==='project')project();else throw Error('Usage: node src/cloud/tools/costSimulator.cjs pilot|project');})().catch(e=>{console.error('COST SIMULATOR ERROR:',e.message);process.exitCode=1;});
