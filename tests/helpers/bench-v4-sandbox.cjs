// /tests/helpers/bench-v4-sandbox.cjs
'use strict';
// Sandbox before/after read-write comparison. Instrumented counts from the in-memory transactional fake, not billing.
// Run: node tests/helpers/bench-v4-sandbox.cjs   (writes docs/qa/cloud-v4/COST-BEFORE-AFTER.md)
const fs=require('node:fs');
const {database,generate}=require('./cloud-fake.cjs'),m=require('../../src/domain/model.cjs');
let n=0;const rows=[];
const legacy=(x,rec,data)=>x.service.execute('alice',{...x.scope,action:'commit',mutationId:'bench-'+(++n),changes:[{key:rec.key,baseRevision:rec.revision,before:rec,after:{...rec,data:{...rec.data,...data}}}]});
async function taskCase(label,set,sizes){
 for(const size of sizes){const w=m.normalizeWorkspace(generate({tasks:size,objects:0}));
  const L=database(w,{protocol:null}),P=database(w),t=L.tasks().find(t=>t.data.status==='Backlog'&&!t.data.dependsOn.length),tp=P.tasks().find(x=>x.id===t.id);
  const a=await legacy(L,t,set),b=await P.patch('alice',tp.id,set);rows.push({label,size:size+' tasks',before:a.measured,after:b.measured});}
}
(async()=>{
 await taskCase('Title / priority edit',{title:'Renamed',priority:'High'},[100,500,2000]);
 await taskCase('Status change',{status:'In progress'},[100,500,2000]);
 await taskCase('Start and due dates',{start:'2026-11-20',due:'2026-11-27'},[100,500,2000]);
 await taskCase('Labels, estimate, progress',{labels:['planned'],estimateHours:8,progress:25},[100,500,2000]);
 const S=require('../../src/cloud/schema.cjs');
 for(const size of [100,500,2000]){const w=m.normalizeWorkspace(generate({tasks:size,objects:0})),L=database(w,{protocol:null}),P=database(w),free=x=>x.tasks().filter(t=>!t.deleted&&!t.data.dependsOn.length&&!t.data.parentId);
  const [,lb,la,lc]=free(L),[,pb,pa,pc]=free(P);
  const dl=await L.service.execute('alice',{...L.scope,action:'commit',mutationId:'bench-d'+(++n),changes:[{key:lb.key,baseRevision:lb.revision,before:lb,after:null}]});
  const dp=await P.service.execute('alice',{...P.scope,action:'deleteTask',projectId:pb.projectId,taskId:pb.id,opId:'bench-d'+(++n),baseRevision:pb.revision});
  rows.push({label:'Delete a task (no relations)',size:size+' tasks',before:dl.measured,after:dp.measured});
  const edge=S.record('dependencies',la.projectId,lc.id+'>'+la.id,{predecessorId:lc.id,successorId:la.id,type:'FS',lagDays:0},0),task=L.task(la.id);
  const al=await L.service.execute('alice',{...L.scope,action:'commit',mutationId:'bench-e'+(++n),changes:[{key:task.key,baseRevision:task.revision,before:task,after:{...task,data:{...task.data,dependsOn:[lc.id],verified:false,merged:false}}},{key:edge.key,baseRevision:0,before:null,after:edge}]}).catch(e=>({measured:{documentReads:'n/a: '+e.message.slice(0,40),documentWrites:'-'}}));
  const ap=await P.service.execute('alice',{...P.scope,action:'patchDependencies',projectId:pa.projectId,taskId:pa.id,opId:'bench-e'+(++n),baseRevision:pa.revision,dependsOn:[pc.id]});
  rows.push({label:'Add a dependency',size:size+' tasks',before:al.measured,after:ap.measured});}
 for(const size of [100,500,2000]){const w=m.normalizeWorkspace(generate({tasks:size,objects:0})),L=database(w,{protocol:null}),P=database(w),lt=L.tasks()[0],pt=P.tasks()[0];
  const mk=(id)=>m.defaultTask({id,title:'New task'}),rec=S.record('tasks',lt.projectId,'bench-new',mk('bench-new'),size+1);
  const cl=await L.service.execute('alice',{...L.scope,action:'commit',mutationId:'bench-c'+(++n),changes:[{key:rec.key,baseRevision:0,before:null,after:rec}]}),cp=await P.service.execute('alice',{...P.scope,action:'createTask',projectId:pt.projectId,taskId:'bench-new',opId:'bench-c'+(++n),order:size+1,data:mk('bench-new')});
  rows.push({label:'Create a task',size:size+' tasks',before:cl.measured,after:cp.measured});
  const comment=S.record('comments',lt.projectId,'c-1',{id:'c-1',taskId:lt.id,author:'Ann',body:'Note',at:'2026-01-01T00:00:00.000Z'},0),ml=await L.service.execute('alice',{...L.scope,action:'commit',mutationId:'bench-m'+(++n),changes:[{key:comment.key,baseRevision:0,before:null,after:comment}]}),mp=await P.service.execute('alice',{...P.scope,action:'addComment',projectId:pt.projectId,taskId:pt.id,commentId:'c-1',opId:'bench-m'+(++n),data:{id:'c-1',taskId:pt.id,author:'Ann',body:'Note',at:'x'}});
  rows.push({label:'Add a comment',size:size+' tasks',before:ml.measured,after:mp.measured});
  const entry={id:'te-1',taskId:lt.id,owner:'Ann',date:'2026-11-01',hours:2,rateAtEntry:null,note:''},tr=S.record('timeEntries',lt.projectId,'te-1',entry,0),tl=await L.service.execute('alice',{...L.scope,action:'commit',mutationId:'bench-t'+(++n),changes:[{key:tr.key,baseRevision:0,before:null,after:tr}]}),tp=await P.service.execute('alice',{...P.scope,action:'logTime',projectId:pt.projectId,taskId:pt.id,entryId:'te-1',opId:'bench-t'+(++n),data:{...entry,taskId:pt.id}});
  rows.push({label:'Log a time entry',size:size+' tasks',before:tl.measured,after:tp.measured});}
 for(const size of [10,100,500,1000]){const w=m.normalizeWorkspace(generate({tasks:3,objects:size})),L=database(w,{protocol:null}),P=database(w);
  const lo=[...L.rows.values()].find(r=>r.kind==='canvas.objects'),po=[...P.rows.values()].find(r=>r.kind==='canvas.objects');
  const a=await legacy(L,lo,{x:lo.data.x+40,y:lo.data.y+20}),b=await P.service.execute('alice',{...P.scope,action:'patchCanvas',projectId:po.projectId,boardId:po.boardId,objectId:po.id,opId:'bench-c'+(++n),baseRevision:po.revision,set:{x:po.data.x+40,y:po.data.y+20}});
  rows.push({label:'Move a Canvas object',size:size+' objects',before:a.measured,after:b.measured});
  const lo2=[...L.rows.values()].filter(r=>r.kind==='canvas.objects'&&!r.deleted)[1],po2=[...P.rows.values()].filter(r=>r.kind==='canvas.objects'&&!r.deleted)[1];
  const dl=await L.service.execute('alice',{...L.scope,action:'commit',mutationId:'bench-cd'+(++n),changes:[{key:lo2.key,baseRevision:lo2.revision,before:lo2,after:null}]}),dp=await P.service.execute('alice',{...P.scope,action:'deleteCanvasObjects',projectId:po2.projectId,boardId:po2.boardId,objectIds:[po2.id],bases:{[po2.id]:po2.revision},opId:'bench-cd'+(++n)});
  rows.push({label:'Delete a Canvas object',size:size+' objects',before:dl.measured,after:dp.measured});}
 const cell=x=>x.documentReads+' R / '+x.documentWrites+' W';
 const md=['# Firebase v4 sandbox cost comparison: before (legacy commit) and after (field patch)','','Instrumented document reads (R) and writes (W) per edit from the in-memory transactional fake. Not billing, not the emulator, not production. Reproduce: `node tests/helpers/bench-v4-sandbox.cjs`.','','| Workflow | Size | Before | After |','| --- | --- | --- | --- |',...rows.map(r=>`| ${r.label} | ${r.size} | ${cell(r.before)} | ${cell(r.after)} |`),'','Not optimized yet (still the legacy full-validation path): sprint operations, Canvas add and text edit (they can grow a board past its 2 MB limit, which cannot be checked without reading it), project-level operations. Deletes and dependency edits with many related records (more than 100 related rows, 200 downstream tasks, 300 upstream tasks, or 100 changed records) are refused by the field patch and fall back to the full editor.',''].join('\n');
 fs.mkdirSync('docs/qa/cloud-v4',{recursive:true});fs.writeFileSync('docs/qa/cloud-v4/COST-BEFORE-AFTER.md',md);console.log(md);
})();
