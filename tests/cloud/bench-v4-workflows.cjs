// /tests/cloud/bench-v4-workflows.cjs
// Emulator-only workflow cost matrix. It deliberately separates implemented v4 task patches
// from still-legacy v3 workflows; it is NOT a claim that every app action supports v4.
'use strict';
const crypto=require('node:crypto'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const assert=require('node:assert/strict');
const H=require('../helpers/cloud-emulators.cjs');
const S=require('../../src/cloud/schema.cjs');
const M=require('../../src/domain/model.cjs');
const {generate}=require('../../src/cloud/tools/fixtures.cjs');
const {PROJECT_ID}=require('../../src/cloud/config.cjs');
const OUTPUT=path.join(os.homedir(),'milvayo-v4-workflow-costs.json');
const result={created:new Date().toISOString(),project:PROJECT_ID,scope:'Firebase emulators only; no production access',
 caution:'Server-instrumented logical document reads/writes/deletes for mutation requests. Not full billable totals; excludes setup, client SDK, rules reads, retries, storage, RTDB, and verification. Legacy v3 numbers do not represent implemented v4 savings.',
 v4:[],legacyV3:[],unsupportedV4:[],limitations:[],failures:[]};
const log=(...args)=>console.log('[workflow-matrix]',...args);
const save=()=>{const tmp=OUTPUT+'.tmp';fs.writeFileSync(tmp,JSON.stringify(result,null,2)+'\n');fs.renameSync(tmp,OUTPUT);};
const stamp=()=>performance.now();
const round=v=>Math.round(v*10)/10;
function ensureEmulators(){
 if(PROJECT_ID!=='demo-milvayo-083')throw Error('Demo project only');
 for(const [k,v] of Object.entries({FIRESTORE_EMULATOR_HOST:'127.0.0.1:8080',FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:9099',FIREBASE_DATABASE_EMULATOR_HOST:'127.0.0.1:9000'}))if(process.env[k]!==v)throw Error(`${k} must be ${v}`);
}
async function setup({tasks=100,objects=2,v4=false,customize}={}){
 let workspace=generate({tasks,objects});
 if(customize)workspace=M.normalizeWorkspace(customize(structuredClone(workspace)));
 const owner=await H.account('workflow-bench');
 const id='benchmark-'+crypto.randomUUID().slice(0,8);
 const published=await H.publish(owner,workspace,id);
 const scope={orgId:published.orgId,workspaceId:published.workspaceId};
 const call=body=>H.request(owner,{...scope,...body});
 const initial=await call({action:'pull'});
 const records=new Map(initial.records.map(r=>[r.key,r]));
 if(v4)await call({action:'workspaceControl',protocol:4});
 return {owner,scope,call,workspace,records};
}
const metrics=(name,protocol,response,ms,detail={})=>({name,protocol,ok:true,reads:response.measured?.documentReads??null,
 writes:response.measured?.documentWrites??null,deletes:response.measured?.documentDeletes??null,
 transactionAttempts:response.measured?.transactionAttempts??null,validationClass:response.measured?.validationClass??null,
 readBreakdown:response.measured?.readBreakdown??null,writeBreakdown:response.measured?.writeBreakdown??null,latencyMs:round(ms),...detail});
async function v4Sample(name,set,pick,opts={}){
 const fx=await setup({tasks:opts.tasks||100,objects:0,customize:opts.customize,v4:true});
 const t=pick([...fx.records.values()].filter(x=>x.kind==='tasks'&&!x.deleted));
 assert(t,`No task for ${name}`);
 const begin=stamp();
 const res=await fx.call({action:'patch',projectId:t.projectId,taskId:t.id,opId:crypto.randomUUID(),baseRevision:t.revision,set});
 assert.equal(res.ok,true,`${name}: server returned failure`);
 assert.equal(res.measured?.documentWrites,1,`${name}: expected exactly one write`);
 assert.equal(res.measured?.documentDeletes,0);
 assert.equal(res.record.revision,t.revision+1);
 for(const [k,v] of Object.entries(set))assert(S.equal(res.record.data[k],v),`${name}: ${k} not committed`);
 const m=metrics(name,'v4',res,stamp()-begin,{tasks:opts.tasks||100,changes:Object.keys(set)});
 result.v4.push(m);save();log(`v4 ${name}: ${m.reads}R ${m.writes}W ${m.deletes}D ${m.latencyMs}ms`);
 return {fx,t,res};
}
function first(tasks){return tasks[0];}
function withStatus(value){return tasks=>tasks.find(t=>t.data.status===value);}
async function v4DoneWithDependency(){
 // One dependent with exactly one prerequisite. This deliberately exercises bounded Done reads.
 const fx=await setup({tasks:10,objects:0,v4:true,customize:w=>{
  const p=w.projects[0];p.tasks.forEach(t=>{t.status='Backlog';t.verified=false;t.merged=false;});
  p.tasks[0].dependsOn=[p.tasks[1].id];p.tasks[1].status='Done';return w;
 }});
 const t=[...fx.records.values()].find(r=>r.kind==='tasks'&&r.id==='task-0');
 const begin=stamp(),res=await fx.call({action:'patch',projectId:t.projectId,taskId:t.id,opId:crypto.randomUUID(),baseRevision:t.revision,set:{status:'Done'}});
 assert.equal(res.ok,true);assert.equal(res.measured.documentWrites,1);
 assert.equal(res.measured.readBreakdown.dependencies,1);
 const m=metrics('mark Done with one completed dependency','v4',res,stamp()-begin,{tasks:10,dependencyReads:1});
 result.v4.push(m);save();log(`v4 dependent Done: ${m.reads}R ${m.writes}W ${m.deletes}D`);
}
async function blockedDone(){
 const fx=await setup({tasks:10,objects:0,v4:true,customize:w=>{
  const p=w.projects[0];p.tasks.forEach(t=>{t.status='Backlog';t.verified=false;t.merged=false;});
  p.tasks[0].dependsOn=[p.tasks[1].id];return w;
 }});
 const t=[...fx.records.values()].find(r=>r.kind==='tasks'&&r.id==='task-0');
 let denied=false;
 try{await fx.call({action:'patch',projectId:t.projectId,taskId:t.id,opId:crypto.randomUUID(),baseRevision:t.revision,set:{status:'Done'}});}catch(e){denied=/dependency|complete|done/i.test(e.message);}
 assert(denied,'Mark Done with unfinished dependency was not refused');
 result.unsupportedV4.push({name:'mark Done with unfinished dependency',status:'expected denial verified',reason:'Correct integrity guard; not a successful edit; any failed-request read costs are not exposed on error responses'});save();
}
async function unsupportedV4(){
 const fx=await setup({tasks:10,objects:2,v4:true});
 const t=[...fx.records.values()].find(r=>r.kind==='tasks');
 for(const [name,set] of [['task dependency', {dependsOn:['task-1']}],['due date',{due:'2026-11-30'}],['start date',{start:'2026-11-20'}],['sprint assignment',{sprintId:'new-sprint'}],['Canvas coordinates',{x:42}]]){
  let denied=false;try{await fx.call({action:'patch',projectId:t.projectId,taskId:t.id,opId:crypto.randomUUID(),baseRevision:t.revision,set});}catch(e){denied=/not patchable/i.test(e.message);}
  assert(denied,`${name} was unexpectedly accepted as a v4 task field patch`);
  result.unsupportedV4.push({name,status:'not implemented in v4 patch',reason:'Currently requires a different protocol handler; intentionally refused by Gate 2'});
 }
 result.unsupportedV4.push({name:'create/delete tasks, Canvas, dependencies and other record families',status:'not implemented under protocol 4',reason:'v4 workspace rejects legacy commit; see separate v3-only cost baselines'});
 save();
}
async function v3Sample(name,{tasks=100,objects=2,customize,transform}){
 const fx=await setup({tasks,objects,v4:false,customize});
 const w=structuredClone(fx.workspace);
 const changed=transform(w);
 const normalized=M.normalizeWorkspace(changed||w);
 const oldPack=S.pack(fx.workspace),newPack=S.pack(normalized);
 S.validateRecords(newPack);
 const differences=S.diff(oldPack,newPack);
 assert(differences.length,`${name}: no changed records`);
 const changes=differences.map(d=>({key:d.key,before:fx.records.get(d.key)||null,after:d.after||null,baseRevision:fx.records.get(d.key)?.revision||0}));
 const begin=stamp();
 const res=await fx.call({action:'commit',mutationId:crypto.randomUUID(),changes});
 assert.equal(res.records?.length,changes.length,`${name}: unexpected number of records in response`);
 const m=metrics(name,'legacy v3',res,stamp()-begin,{tasks,objects,recordChanges:changes.length,
 note:'Measured only on a protocol-3 workspace. Does not imply this workflow is implemented on protocol-4.'});
 result.legacyV3.push(m);save();
 log(`legacy v3 ${name}: ${m.reads}R ${m.writes}W ${m.deletes}D; ${changes.length} changed records; ${m.latencyMs}ms`);
}
async function main(){
 ensureEmulators();save();
 const tests=[
  ['title',{title:'Updated title'},first],
  ['description',{description:'Updated task description'},first],
  ['priority',{priority:'Critical'},first],
  ['owner',{owner:'Bench teammate'},first],
  ['stage',{stage:'Testing'},first],
  ['position',{position:13},first],
  ['status: Backlog to In progress',{status:'In progress'},withStatus('Backlog')],
  ['status: In progress to Validation',{status:'Validation'},withStatus('In progress')],
  ['mark Done (no dependencies)',{status:'Done'},withStatus('Validation')],
 ];
 for(const [name,set,pick] of tests){
  await v4Sample(name,set,pick);
 }
 await v4DoneWithDependency();await blockedDone();await unsupportedV4();
 const suites=[
  ['change due date',{tasks:100,objects:0,transform:w=>{w.projects[0].tasks[0].due='2026-11-30';}}],
  ['change due date at 500 tasks',{tasks:500,objects:0,transform:w=>{w.projects[0].tasks[0].due='2026-11-30';}}],
  ['add task dependency',{tasks:100,objects:0,transform:w=>{w.projects[0].tasks[3].dependsOn=['task-2'];}}],
  ['remove task dependency',{tasks:100,objects:0,customize:w=>{w.projects[0].tasks[3].dependsOn=['task-2'];return w;},transform:w=>{w.projects[0]=M.setTaskDependencies(w.projects[0],'task-3',[]);}}],
  ['create task',{tasks:100,objects:0,transform:w=>{w.projects[0].tasks.push(M.defaultTask({id:'bench-created-task',title:'New task'}));}}],
  ['soft-delete last task',{tasks:100,objects:0,transform:w=>{w.projects[0].tasks.pop();}}],
  ['Canvas move one object',{tasks:20,objects:25,transform:w=>{w.projects[0].canvases[0].objects[0].x+=35;}}],
  ['Canvas move, 500 objects',{tasks:20,objects:500,transform:w=>{w.projects[0].canvases[0].objects[0].x+=35;}}],
  ['Canvas add object',{tasks:20,objects:25,transform:w=>{const c=w.projects[0].canvases[0];c.objects.push(require('../../src/domain/canvas.cjs').createObject({id:'bench-new-object',boardId:c.id,x:18,y:21,text:'Created on Canvas',now:'2026-11-07T00:00:00.000Z'}));}}],
  ['Canvas link two objects',{tasks:20,objects:25,transform:w=>{w.projects[0].canvases[0].connectors.push({id:'bench-new-edge',from:'object-0',to:'object-1',label:'',style:'curve',arrow:true});}}],
  ['Canvas rename board',{tasks:20,objects:25,transform:w=>{w.projects[0].canvases[0].title='Renamed Canvas';}}],
  ['Canvas remove one object',{tasks:20,objects:25,transform:w=>{w.projects[0].canvases[0].objects.pop();}}],
  ['Canvas anchored discussion',{tasks:20,objects:25,transform:w=>{w.projects[0].canvases[0].threads.push({id:'bench-thread',objectId:'object-0',x:0,y:0,resolvedAt:null,messages:[]});}}],
  ['create sprint',{tasks:20,objects:0,transform:w=>{w.projects[0]=M.agile.createSprint(w.projects[0],{id:'bench-sprint',name:'Bench sprint',start:'2026-11-10',end:'2026-11-24'});}}],
  ['assign task to sprint',{tasks:20,objects:0,customize:w=>{w.projects[0]=M.agile.createSprint(w.projects[0],{id:'bench-sprint',name:'Bench sprint',start:'2026-11-10',end:'2026-11-24'});return w;},transform:w=>{w.projects[0]=M.agile.assign(w.projects[0],'task-1','bench-sprint');}}],
  ['log time',{tasks:20,objects:0,transform:w=>{w.projects[0]=M.operations.logTime(w.projects[0],{taskId:'task-0',date:'2026-11-06',hours:2});}}],
  ['task comment',{tasks:20,objects:0,transform:w=>{w.projects[0]=M.operations.postComment(w.projects[0],{taskId:'task-0',author:'Bench user',body:'New task comment'});}}],
  ['delete a task with downstream dependency',{tasks:20,objects:0,customize:w=>{w.projects[0].tasks[3].dependsOn=['task-2'];return w;},transform:w=>{w.projects[0]=M.deleteTaskWithLinks(w.projects[0],'task-2');}}],
 ];
 for(const [name,options] of suites){
  await v3Sample(name,options);
 }
 result.limitations.push('v4 patch only handles task fields. Canvas, dependency edits, create/delete, dates, scheduling, sprint records and chat are not v4 workflows in Gate 2.');
result.limitations.push('Messages, invitations, imports, backup/restore, mobile UI, offline reconciliation, all automation/release cases and real Firebase billing are not measured by this mutation matrix. Existing correctness tests do not substitute for their cost measurements.');
 save();
 console.log('\n=== V4 TASK PATCH COSTS (IMPLEMENTED) ===');
 console.table(result.v4.map(({name,reads,writes,deletes,latencyMs})=>({name,reads,writes,deletes,latencyMs})));
 console.log('\n=== STILL-LEGACY WORKFLOW COSTS (NOT YET V4) ===');
 console.table(result.legacyV3.map(({name,reads,writes,deletes,recordChanges,latencyMs})=>({name,reads,writes,deletes,recordChanges,latencyMs})));
 console.log('Missing v4 workflows:',result.unsupportedV4.filter(x=>x.status==='not implemented in v4 patch').map(x=>x.name).join(', '));
 console.log('Full JSON report:',OUTPUT);
}
main().catch(e=>{result.failures.push({message:e.message,stack:e.stack});save();console.error('[workflow-matrix] FAILED',e);process.exitCode=1;});
