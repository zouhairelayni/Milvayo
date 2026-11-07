// /src/domain/agile.cjs
'use strict';
const {localDay}=require('../utils/localDay.cjs');
// Independently authored sprint planning and lifecycle rules. Local-first, no server permissions.
const STATES=['planned','active','completed'];
const MAX_SPRINTS=200,MAX_HISTORY=500;
const day=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+'T00:00:00Z'))&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x;
const text=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
const obj=v=>v&&typeof v==='object'&&!Array.isArray(v);
const atIso=()=>new Date().toISOString();
function countDays(a,b){return (Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/86400000;}
function normalizeSprint(raw){
 if(!obj(raw))throw Error('Invalid sprint record');
 const id=text(raw.id,100),name=text(raw.name,100),start=text(raw.start,10),end=text(raw.end,10);
 if(!id||!name)throw Error('Sprint needs ID and name');
 if(!day(start)||!day(end)||countDays(start,end)<0||countDays(start,end)>89)throw Error('Sprint dates must span 1–90 calendar days');
 const state=raw.state||'planned';if(!STATES.includes(state))throw Error('Unknown sprint state');
 const history=raw.history===undefined?[]:raw.history;
 if(!Array.isArray(history)||history.length>MAX_HISTORY)throw Error('Invalid sprint history');
 const events=history.map(e=>{
  if(!obj(e)||!Number.isFinite(Date.parse(e.at))||!Number.isInteger(e.remaining)||e.remaining<0||!Number.isInteger(e.total)||e.total<0||e.remaining>e.total||!/^\d{4}-\d{2}-\d{2}T/.test(e.at||''))throw Error('Invalid sprint progress event');
  return {at:text(e.at,40),remaining:e.remaining,total:e.total};
 });
 const taskIds=raw.taskIds===undefined?[]:raw.taskIds;
 if(!Array.isArray(taskIds)||taskIds.length>10000||taskIds.some(x=>typeof x!=='string')||new Set(taskIds).size!==taskIds.length)throw Error('Invalid sprint completed task IDs');
 if(state==='completed'&&(!Number.isFinite(Date.parse(raw.completedAt))||!Number.isFinite(Date.parse(raw.startedAt))))throw Error('Completed sprint needs lifecycle timestamps');
 if(state==='active'&&!Number.isFinite(Date.parse(raw.startedAt)))throw Error('Active sprint needs start timestamp');
 return {id,name,goal:text(raw.goal,1200),start,end,state,startedAt:text(raw.startedAt,40),completedAt:text(raw.completedAt,40),taskIds:taskIds.map(x=>text(x,120)),history:events};
}
function normalizeAgile(raw){const sprints=raw?.sprints===undefined?[]:raw.sprints;if(!Array.isArray(sprints)||sprints.length>MAX_SPRINTS)throw Error('Too many sprints');return {sprints:sprints.map(normalizeSprint)};}
function validateAgile(project){
 const {sprints}=normalizeAgile(project), ids=new Set();let active=0;
 for(const s of sprints){if(ids.has(s.id))throw Error('Duplicate sprint ID');ids.add(s.id);if(s.state==='active')active++;
  // Completed scope keeps historical IDs even when a task is later deleted.
 }
 if(active>1)throw Error('Only one active sprint per project');
 for(const t of project.tasks||[]){const sid=text(t.sprintId,100);if(sid){const sprint=sprints.find(s=>s.id===sid);if(!sprint||sprint.state==='completed')throw Error(`Task ${t.id} references missing or closed sprint`);}}
 return true;
}
function find(project,id){const sprint=(project.sprints||[]).find(s=>s.id===id);if(!sprint)throw Error('Sprint not found');return sprint;}
function summary(project,sprintId){const s=find(project,sprintId);const taskIds=s.state==='completed'?s.taskIds:(project.tasks||[]).filter(t=>t.sprintId===s.id).map(t=>t.id);const tasks=(project.tasks||[]).filter(t=>taskIds.includes(t.id));const done=tasks.filter(t=>t.status==='Done').length;
 return {total:taskIds.length,done:s.state==='completed'?Math.max(0,taskIds.length-(s.history.at(-1)?.remaining??taskIds.length)):done,remaining:s.state==='completed'?(s.history.at(-1)?.remaining??0):tasks.length-done,scope:taskIds};
}
function snapshot(project,id,at=atIso()) {const s=find(project,id);if(s.state!=='active')return project;const {total,remaining}=summary(project,id);const last=s.history.at(-1);if(last&&last.remaining===remaining&&last.total===total)return project;
 return {...project,sprints:project.sprints.map(x=>x.id===id?{...x,history:[...x.history,{at,remaining,total}].slice(-MAX_HISTORY)}:x)};
}
function createSprint(project,data){
 if((project.sprints||[]).length>=MAX_SPRINTS)throw Error('Sprint limit reached');
 const s=normalizeSprint({...data,state:'planned',history:[],taskIds:[],startedAt:'',completedAt:''});
 if((project.sprints||[]).some(x=>x.id===s.id))throw Error('Sprint ID already exists');
 const result={...project,sprints:[...(project.sprints||[]),s]};validateAgile(result);return result;
}
function updatePlannedSprint(project,id,changes={}){
 const old=find(project,id);
 if(old.state!=='planned')throw Error('Only planned sprint details can be edited');
 const candidate=normalizeSprint({...old,name:changes.name??old.name,goal:changes.goal??old.goal,start:changes.start??old.start,end:changes.end??old.end});
 const next={...project,sprints:project.sprints.map(s=>s.id===id?candidate:s)};
 validateAgile(next);return next;
}
function assign(project,taskId,sprintId,at=atIso()){
 const task=project.tasks.find(t=>t.id===taskId);if(!task)throw Error('Task not found');
 if(sprintId&&find(project,sprintId).state==='completed')throw Error('Cannot add tasks to completed sprint');
 if(task.sprintId===sprintId)return project;
 const previous=task.sprintId;
 let next={...project,tasks:project.tasks.map(t=>t.id===taskId?{...t,sprintId,updatedAt:at}:t)};
 validateAgile(next);
 if(previous)next=snapshot(next,previous,at);
 if(sprintId)next=snapshot(next,sprintId,at);
 return next;
}
function startSprint(project,id,at=atIso()){
 const s=find(project,id);
 if(s.state!=='planned')throw Error('Only planned sprints can start');
 if(project.sprints.some(x=>x.state==='active'))throw Error('Finish the active sprint first');
 const next={...project,sprints:project.sprints.map(x=>x.id===id?{...x,state:'active',startedAt:at}:x)};
 const initial=summary(next,id);
 return {...next,sprints:next.sprints.map(x=>x.id===id?{...x,history:[{at,remaining:initial.remaining,total:initial.total}]}:x)};
}
function finishSprint(project,id,at=atIso()){
 const s=find(project,id);if(s.state!=='active')throw Error('Only an active sprint can be completed');
 const result=snapshot(project,id,at);const sum=summary(result,id);
 const next={...result,sprints:result.sprints.map(x=>x.id===id?{...x,state:'completed',completedAt:at,taskIds:[...sum.scope]}:x),tasks:result.tasks.map(t=>t.sprintId===id?{...t,sprintId:'',updatedAt:at}:t)};
 validateAgile(next);return next;
}
function deleteSprint(project,id){const s=find(project,id);if(s.state!=='planned')throw Error('Only planned sprints may be deleted');
 return {...project,sprints:project.sprints.filter(x=>x.id!==id),tasks:project.tasks.map(t=>t.sprintId===id?{...t,sprintId:''}:t)};
}
function reconcileProgress(before,after,at=atIso()){
 if(!before||!after||!Array.isArray(after.sprints))return after;
 const active=after.sprints.find(s=>s.state==='active');if(!active)return after;
 const a=before.tasks.filter(t=>t.sprintId===active.id).map(t=>`${t.id}:${t.status}`).sort().join('|');
 const b=after.tasks.filter(t=>t.sprintId===active.id).map(t=>`${t.id}:${t.status}`).sort().join('|');
 return a!==b?snapshot(after,active.id,at):after;
}
// Validate replacements with the same lifecycle rules as interactive commands.
function validateLifecycleChange(before,after){
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 for(const previous of before.sprints||[]){
  const next=(after.sprints||[]).find(s=>s.id===previous.id);
  if(previous.state==='completed'&&(!next||!same(previous,next)))throw Error('Completed sprint history is frozen');
  if(!next){if(previous.state!=='planned')throw Error('Only planned sprints may be deleted');continue;}
  if(previous.state==='active'&&next.state==='planned'||previous.state==='planned'&&next.state==='completed')throw Error('Invalid sprint lifecycle transition');
  if(previous.state!=='planned'&&['name','goal','start','end','startedAt'].some(k=>next[k]!==previous[k]))throw Error('Started sprint details are fixed');
  if(previous.state==='planned'&&next.state==='planned'&&(!same(next.history,[])||next.startedAt||next.completedAt||next.taskIds.length))throw Error('Planned sprint has no historical progress');
  if(previous.state==='planned'&&next.state==='active'){
   const expected=startSprint(before,previous.id,next.startedAt).sprints.find(s=>s.id===previous.id);
   if(!same(expected.history,next.history)||next.completedAt||next.taskIds.length)throw Error('Invalid initial sprint progress');
  }
  if(previous.state==='active'){
   const history=next.history,offset=history.length===MAX_HISTORY&&previous.history.length===MAX_HISTORY&&same(previous.history.slice(1),history.slice(0,-1))?1:0;
   if(!same(previous.history.slice(offset),history.slice(0,previous.history.length-offset)))throw Error('Sprint progress history cannot be rewritten');
   if(history.length>previous.history.length+1)throw Error('Append only the current sprint progress');
   if(next.state==='completed'){
    const expected=finishSprint(before,previous.id,next.completedAt).sprints.find(s=>s.id===previous.id);
    if(!same(expected.taskIds,next.taskIds)||!same(expected.history,next.history))throw Error('Invalid frozen sprint scope or history');
   }else if(history.length>previous.history.length||offset){const expected=summary(after,next.id),last=history.at(-1);if(last.remaining!==expected.remaining||last.total!==expected.total)throw Error('Sprint progress does not match current scope');}
  }
 }
 for(const next of after.sprints||[])if(!(before.sprints||[]).some(s=>s.id===next.id)&&next.state!=='planned')throw Error('New sprints begin in planning');
 return true;
}
function burndown(project,id,today=localDay()){
 const s=find(project,id);if(s.state==='planned')return [];
 const events=s.history.slice().sort((a,b)=>a.at.localeCompare(b.at));if(!events.length)return [];
 const cutoff=s.state==='completed'?s.completedAt.slice(0,10):today;
 const end=cutoff<s.end?cutoff:s.end;
 if(end<s.start)return [{date:s.start,remaining:events[0].remaining,ideal:events[0].total}];
 const total=events[0].total;const span=Math.max(1,countDays(s.start,s.end));let previous=total;
 const out=[];
 for(let n=0;n<=Math.min(89,countDays(s.start,end));n++){
  const date=new Date(Date.parse(s.start+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
  for(const e of events)if(e.at.slice(0,10)<=date)previous=e.remaining;
  out.push({date,remaining:previous,ideal:Math.max(0,Math.round(total*(1-n/span)*100)/100)});
 }
 return out;
}
module.exports={STATES,normalizeSprint,normalizeAgile,validateAgile,validateLifecycleChange,createSprint,updatePlannedSprint,assign,startSprint,finishSprint,deleteSprint,reconcileProgress,summary,burndown,snapshot};
