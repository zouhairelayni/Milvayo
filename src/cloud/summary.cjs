// /src/cloud/summary.cjs
'use strict';
function empty(projectId){return {projectId,taskCount:0,canvasObjects:0,statusCounts:{Backlog:0,'In progress':0,Validation:0,Done:0},sequence:0};}
function adjust(summary,record,delta){if(!record||record.deleted)return summary;const next={...summary,statusCounts:{...summary.statusCounts}};if(record.kind==='tasks'){next.taskCount+=delta;next.statusCounts[record.data.status]=(next.statusCounts[record.data.status]||0)+delta;}if(record.kind==='canvas.objects')next.canvasObjects+=delta;return next;}
function affects(change){const value=r=>!r||r.deleted?null:r.kind==='tasks'?['tasks',r.projectId,r.data.status]:r.kind==='canvas.objects'?['canvas.objects',r.projectId]:null;return JSON.stringify(value(change.old))!==JSON.stringify(value(change.next));}
function update(summary,changes,sequence){let next=summary;for(const c of changes){next=adjust(next,c.old,-1);next=adjust(next,c.next,1);}return {...next,sequence};}
function build(projectId,records,sequence){return update(empty(projectId),records.filter(r=>r.projectId===projectId).map(next=>({next})),sequence);}
module.exports={empty,affects,update,build};
