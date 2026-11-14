// /tests/helpers/baseline-v4-workflows.cjs
'use strict';
// Baseline reads/writes of every Firebase-backed workflow in the sandbox fake database (independent instrumentation, not billing, not the emulator).
// Run: node tests/helpers/baseline-v4-workflows.cjs [--write]   (--write refreshes docs/qa/cloud-v4/WORKFLOW-BASELINES.md)
const fs=require('node:fs');
const {database,generate}=require('./cloud-fake.cjs'),m=require('../../src/domain/model.cjs'),S=require('../../src/cloud/schema.cjs');
const SIZES=[10,100,500,2000],rows=[];let n=0;
const legacy=(x,key,before,after)=>x.service.execute('alice',{...x.scope,action:'commit',mutationId:'base-'+(++n),changes:[{key,baseRevision:before?before.revision:0,before:before||null,after}]});
const fresh=(size,objects=0,protocol=null)=>{const w=m.normalizeWorkspace(generate({tasks:size,objects}));return database(w,{protocol});};
async function measure(label,size,build,run){
 try{const ctx=await build(),r=await ctx.x.measure(()=>run(ctx));rows.push({label,size,reads:r.reads,writes:r.writes,deletes:r.deletes});}
 catch(e){rows.push({label,size,error:String(e.message).slice(0,70)});}
}
(async()=>{
 for(const size of SIZES){
  const base=()=>({x:fresh(size)}),withTask=()=>{const x=fresh(size);return {x,t:x.tasks()[0]};};
  await measure('pull, cold start (cursor 0)',size,base,({x})=>x.run('alice',{action:'pull',cursor:0}));
  await measure('pull, nothing changed (resume)',size,async()=>{const x=fresh(size),first=await x.run('alice',{action:'pull',cursor:0});return {x,first};},({x,first})=>x.run('alice',{action:'pull',cursor:first.cursor,accessVersion:first.accessVersion}));
  await measure('presence authorization refresh',size,base,({x})=>x.run('alice',{action:'presenceAuthorize'}));
  await measure('project summaries read',size,withTask,({x,t})=>x.run('alice',{action:'summaries',projectId:t.projectId}));
  await measure('organization member directory',size,withTask,({x,t})=>x.run('alice',{action:'directory',projectId:t.projectId}));
  await measure('post a chat message',size,withTask,({x,t})=>x.run('alice',{action:'message',projectId:t.projectId,mutationId:'m-'+(++n),body:'Hello'}));
  await measure('read chat messages',size,withTask,({x,t})=>x.run('alice',{action:'messages',projectId:t.projectId}));
  await measure('read notifications',size,base,({x})=>x.run('alice',{action:'notifications'}));
  await measure('watch a task thread',size,withTask,({x,t})=>x.run('alice',{action:'watch',projectId:t.projectId,threadId:'task-'+t.id,taskId:t.id,enabled:true}));
  await measure('full workspace backup (export)',size,base,({x})=>x.run('alice',{action:'backup'}));
  await measure('record history (versions)',size,withTask,async({x,t})=>{await legacy(x,t.key,t,{...t,data:{...t.data,title:'v2'}});return x.run('alice',{action:'history',key:t.key});});
  await measure('create a task (legacy commit)',size,withTask,({x,t})=>{const rec=S.record('tasks',t.projectId,'new-task-'+size,m.defaultTask({id:'new-task-'+size,title:'New task'}),size+1);return legacy(x,rec.key,null,rec);});
  await measure('add a comment (legacy commit)',size,withTask,({x,t})=>{const rec=S.record('comments',t.projectId,'c-1',{id:'c-1',taskId:t.id,author:'Ann',body:'Note',at:'2026-01-01T00:00:00.000Z'},0);return legacy(x,rec.key,null,rec);});
  await measure('log a time entry (legacy commit)',size,withTask,({x,t})=>{const rec=S.record('timeEntries',t.projectId,'te-1',{id:'te-1',taskId:t.id,owner:'Ann',date:'2026-11-01',hours:2,rateAtEntry:null,note:''},0);return legacy(x,rec.key,null,rec);});
  await measure('soft delete a task (legacy commit)',size,withTask,({x,t})=>legacy(x,t.key,t,null));
 }
 for(const objects of [10,100,500,999]){
  const canvas=()=>{const x=fresh(3,objects),o=[...x.rows.values()].find(r=>r.kind==='canvas.objects');return {x,o};};
  await measure('Canvas: add an object (legacy commit)',objects+' objects',canvas,({x,o})=>{const rec=S.record('canvas.objects',o.projectId,'obj-new',{...o.data,id:'obj-new',x:o.data.x+500},o.order+1,o.boardId);return legacy(x,rec.key,null,rec);});
  await measure('Canvas: edit text (legacy commit)',objects+' objects',canvas,({x,o})=>legacy(x,o.key,o,{...o,data:{...o.data,text:'Edited text'}}));
  await measure('Canvas: delete an object (legacy commit)',objects+' objects',canvas,({x,o})=>legacy(x,o.key,o,null));
 }
 const md=['# Baseline reads and writes per Firebase-backed workflow (sandbox fake database)','','Independent counts from the in-memory transactional fake (every document read, query row and write), cross-checked against the service-reported counts for the patch handlers. Not the emulator, not billing, not production. Cells marked n/a failed in the sandbox fixture and are listed so they are not mistaken for zero cost. Reproduce: `node tests/helpers/baseline-v4-workflows.cjs --write`.','','| Workflow | Size | Reads | Writes | Deletes |','| --- | --- | --- | --- | --- |',...rows.map(r=>r.error?`| ${r.label} | ${r.size} | n/a (${r.error}) | | |`:`| ${r.label} | ${r.size} | ${r.reads} | ${r.writes} | ${r.deletes} |`),''].join('\n');
 console.log(md);if(process.argv.includes('--write')){fs.mkdirSync('docs/qa/cloud-v4',{recursive:true});fs.writeFileSync('docs/qa/cloud-v4/WORKFLOW-BASELINES.md',md);}
})();
