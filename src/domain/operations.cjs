// /src/domain/operations.cjs
'use strict';
const {localDay}=require('../utils/localDay.cjs');
// Niyarvo Projects original, local-first domain services; no vendor source copied.
const date=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\d$/.test(s)&&!Number.isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const txt=(s,n=240)=>typeof s==='string'?s.trim().slice(0,n):'';
const list=(a,n=5000)=>Array.isArray(a)?a.slice(0,n):[];
const whole=(x,max=1000000)=>Number.isFinite(x)&&x>=0&&x<=max?Math.round(x*100)/100:0;
const uniq=a=>new Set(a).size===a.length;
const stamp=()=>new Date().toISOString();
const token=p=>`${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
const existingIds=p=>new Set((p.tasks||[]).map(t=>t.id));
function normalizeProjectExtras(p={}){
 const owners=list(p.resources,80).map(x=>({id:txt(x.id,120)||token('resource'),name:txt(x.name,120)||'Contributor',weeklyHours:whole(x.weeklyHours,168),hourlyRate:whole(x.hourlyRate,100000)}));
 const tasks=existingIds(p);
 const entries=list(p.timeEntries,10000).filter(x=>tasks.has(x.taskId)&&date(x.date)).map(x=>({id:txt(x.id,120)||token('time'),taskId:txt(x.taskId,120),owner:txt(x.owner,120),date:x.date,hours:whole(x.hours,24),rateAtEntry:Number.isFinite(x.rateAtEntry)&&x.rateAtEntry>=0&&x.rateAtEntry<=100000?x.rateAtEntry:null,note:txt(x.note,1000)}));
 const comments=list(p.comments,20000).filter(x=>tasks.has(x.taskId)).map(x=>({id:txt(x.id,120)||token('comment'),taskId:txt(x.taskId,120),author:txt(x.author,120)||'Local operator',body:txt(x.body,4000),at:txt(x.at,40)||stamp()}));
 const reminders=list(p.reminders,1000).filter(x=>tasks.has(x.taskId)&&date(x.date)).map(x=>({id:txt(x.id,120)||token('reminder'),taskId:txt(x.taskId,120),date:x.date,note:txt(x.note,500),done:x.done===true}));
 const b=p.budget||{};
 return {resources:owners,timeEntries:entries,comments,reminders,budget:{amount:whole(b.amount,10000000000),currency:txt(b.currency,3).toUpperCase()||'USD'},projectStatus:['On track','At risk','Off track','On hold'].includes(p.projectStatus)?p.projectStatus:'On track',goal:txt(p.goal,1000)};
}
function validateExtras(p){
 const e=normalizeProjectExtras(p);
 for(const [name,arr] of [['resource',e.resources],['time entry',e.timeEntries],['comment',e.comments],['reminder',e.reminders]])if(!uniq(arr.map(x=>x.id)))throw Error(`Duplicate ${name} ID`);
 if(e.timeEntries.some(x=>x.hours<=0))throw Error('Logged time must be greater than zero');
 if(e.resources.some(x=>!x.name||x.weeklyHours>168))throw Error('Invalid resource capacity');
 if(e.comments.some(x=>!x.body))throw Error('Comments cannot be empty');
 return true;
}
function updateExtras(p,patch){const result={...p,...patch};validateExtras(result);return result;}
function addResource(p,raw){const r={id:token('resource'),name:txt(raw.name,120),weeklyHours:Number(raw.weeklyHours),hourlyRate:Number(raw.hourlyRate)};if(!r.name||!Number.isFinite(r.weeklyHours)||r.weeklyHours<0||r.weeklyHours>168||!Number.isFinite(r.hourlyRate)||r.hourlyRate<0)throw Error('Enter a valid contributor, capacity (0–168 hours), and rate');if((p.resources||[]).some(x=>x.name.trim().toLowerCase()===r.name.toLowerCase()))throw Error('Contributor already exists');return updateExtras(p,{resources:[...(p.resources||[]),r]});}
function deleteResource(p,id){return updateExtras(p,{resources:p.resources.filter(x=>x.id!==id)});}
function logTime(p,raw){if(!existingIds(p).has(raw.taskId))throw Error('Task not found');if(!date(raw.date))throw Error('Enter a real YYYY-MM-DD date');const hours=Number(raw.hours);if(!Number.isFinite(hours)||hours<=0||hours>24)throw Error('Hours must be greater than 0 and at most 24');const owner=txt(raw.owner,120)||'Local operator';const rateAtEntry=(p.resources||[]).find(r=>r.name===owner)?.hourlyRate||0;const entry={id:token('time'),taskId:raw.taskId,owner,date:raw.date,hours:Math.round(hours*100)/100,rateAtEntry,note:txt(raw.note,1000)};return updateExtras(p,{timeEntries:[...p.timeEntries,entry]});}
function removeTime(p,id){return updateExtras(p,{timeEntries:p.timeEntries.filter(x=>x.id!==id)});}
function postComment(p,raw){if(!existingIds(p).has(raw.taskId))throw Error('Task not found');const body=txt(raw.body,4000);if(!body)throw Error('Write a comment');return updateExtras(p,{comments:[...p.comments,{id:token('comment'),taskId:raw.taskId,author:txt(raw.author,120)||'Local operator',body,at:stamp()}]});}
function deleteComment(p,id){return updateExtras(p,{comments:p.comments.filter(x=>x.id!==id)});}
function addReminder(p,raw){if(!existingIds(p).has(raw.taskId)||!date(raw.date))throw Error('Choose a task and valid date');return updateExtras(p,{reminders:[...p.reminders,{id:token('reminder'),taskId:raw.taskId,date:raw.date,note:txt(raw.note,500),done:false}]});}
function finishReminder(p,id){return updateExtras(p,{reminders:p.reminders.map(x=>x.id===id?{...x,done:true}:x)});}
function deleteReminder(p,id){return updateExtras(p,{reminders:p.reminders.filter(x=>x.id!==id)});}
function setBudget(p,amount,currency){const n=Number(amount);if(!Number.isFinite(n)||n<0||n>1e10)throw Error('Invalid budget amount');if(!/^[A-Z]{3}$/.test(currency))throw Error('Currency must be a three-letter code');return updateExtras(p,{budget:{amount:Math.round(n*100)/100,currency}});}
function resourceRates(p){const rates=new Map();for(const r of p.resources||[])if(!rates.has(r.name))rates.set(r.name,r.hourlyRate);return rates;}
function timeSummary(p){const rows=p.timeEntries||[],byOwner=new Map(),rates=resourceRates(p);let logged=0,cost=0;for(const r of rows){const value=r.hours*(r.rateAtEntry??rates.get(r.owner)??0);logged+=r.hours;cost+=value;const curr=byOwner.get(r.owner)||{owner:r.owner,hours:0,cost:0};curr.hours+=r.hours;curr.cost+=value;byOwner.set(r.owner,curr);}return {logged:Math.round(logged*100)/100,cost:Math.round(cost*100)/100,people:[...byOwner.values()].sort((a,b)=>b.hours-a.hours)};}
function capacitySummary(p){const people=(p.resources||[]);return people.map(r=>{const tasks=p.tasks.filter(t=>t.owner===r.name&&t.status!=='Done');const planned=tasks.reduce((s,t)=>s+(t.estimateHours||0),0);const logged=(p.timeEntries||[]).filter(e=>e.owner===r.name).reduce((s,e)=>s+e.hours,0);return {name:r.name,weeklyHours:r.weeklyHours,assignedTasks:tasks.length,remainingEstimate:planned,logged,overCapacity:planned>r.weeklyHours};});}
function costSummary(p){const s=timeSummary(p),parents=new Set((p.tasks||[]).map(t=>t.parentId).filter(Boolean)),rates=resourceRates(p);const allocated=(p.tasks||[]).filter(t=>!parents.has(t.id)).reduce((n,t)=>n+(t.estimateHours||0)*(rates.get(t.owner)||0),0);return {...s,plannedCost:Math.round(allocated*100)/100,budget:p.budget?.amount||0,currency:p.budget?.currency||'USD',remaining:Math.round(((p.budget?.amount||0)-s.cost)*100)/100};}
function health(p,today=localDay()){
 const tasks=p.tasks||[],parents=new Set(tasks.map(t=>t.parentId).filter(Boolean)),byId=new Map(tasks.map(t=>[t.id,t])),leaves=tasks.filter(t=>!parents.has(t.id)),total=leaves.length||1;
 const done=leaves.filter(x=>x.status==='Done').length,overdue=leaves.filter(t=>t.status!=='Done'&&date(t.due)&&t.due<today).length;
 const blocked=leaves.filter(t=>t.status!=='Done'&&(t.dependsOn||[]).some(dep=>(byId.has(dep)&&byId.get(dep).status!=='Done'))).length;
 const actual=p.projectStatus||'On track',derived=overdue>Math.max(2,total*.2)?'At risk':'On track';
 return {projectId:p.id,name:p.name,progress:Math.round(done/total*100),done,total:leaves.length,overdue,blocked,status:actual,attention:actual==='On hold'||actual==='Off track'||derived==='At risk',activeSprints:(p.sprints||[]).filter(s=>s.state==='active').length};
}
function normalizePortfolios(items=[],projects=[]){if(!Array.isArray(items)||items.length>50)throw Error('Invalid portfolio list');const ids=new Set(projects.map(p=>p.id)),seen=new Set();return items.map(x=>{if(!x||typeof x!=='object')throw Error('Invalid portfolio');const id=txt(x.id,120)||token('portfolio');if(seen.has(id))throw Error('Duplicate portfolio ID');seen.add(id);return {id,name:txt(x.name,140)||'Untitled portfolio',description:txt(x.description,1500),projectIds:[...new Set(list(x.projectIds,30).filter(y=>ids.has(y)))],objective:txt(x.objective,1500),manager:txt(x.manager,120),status:['Planned','Active','Completed'].includes(x.status)?x.status:'Active'};});}
function savePortfolio(ws,raw){const name=txt(raw.name,140);if(!name)throw Error('Portfolio name required');const candidate={id:txt(raw.id,120)||token('portfolio'),name,description:txt(raw.description,1500),projectIds:list(raw.projectIds,30),objective:txt(raw.objective,1500),manager:txt(raw.manager,120),status:raw.status||'Active'};return {...ws,portfolios:normalizePortfolios([...(ws.portfolios||[]).filter(x=>x.id!==candidate.id),candidate],ws.projects)};}
function deletePortfolio(ws,id){return {...ws,portfolios:(ws.portfolios||[]).filter(x=>x.id!==id)};}
function sprintVelocity(p){return (p.sprints||[]).filter(s=>s.state==='completed').map(s=>{const initial=s.history[0]?.total??s.taskIds.length;const remaining=s.history.at(-1)?.remaining??initial;return {id:s.id,name:s.name,committed:initial,completed:Math.max(0,initial-remaining),rate:initial?Math.round(100*(initial-remaining)/initial):0}});}
function csvCell(v){const raw=String(v??'').replace(/\r\n?/g,'\n');const secure=/^[\s\u0000-\u001f]*[=+@\-\t\r]/.test(raw)?"'"+raw:raw;return '"'+secure.replace(/"/g,'""')+'"';}
function tasksCsv(p){const headers=['ID','Title','Status','Priority','Owner','Start','Due','Parent','Progress','Estimate Hours','Sprint'];const rows=p.tasks.map(t=>[t.id,t.title,t.status,t.priority,t.owner,t.start,t.due,t.parentId,t.progress,t.estimateHours,t.sprintId]);return [headers,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';}
function timeCsv(p){const headers=['Entry ID','Task ID','Date','Owner','Hours','Note'];return [headers,...(p.timeEntries||[]).map(x=>[x.id,x.taskId,x.date,x.owner,x.hours,x.note])].map(x=>x.map(csvCell).join(',')).join('\r\n')+'\r\n';}
function templateProject(project,{name,code,id}){if(!name||!code||!id)throw Error('Template needs name, code and ID');const mapping=new Map(project.tasks.map((t,i)=>[t.id,`${id}-task-${i+1}`]));const tasks=project.tasks.map((t,i)=>({...t,id:mapping.get(t.id),parentId:mapping.get(t.parentId)||'',dependsOn:t.dependsOn.map(x=>mapping.get(x)).filter(Boolean),status:'Backlog',progress:0,verified:false,merged:false,tests:t.tests.map(q=>({...q,result:'pending',evidence:''})),evidence:'',actual:'',mainSha:'',branch:'',commit:'',releaseId:'',sprintId:'',createdAt:stamp(),updatedAt:stamp()}));return {...project,id,name:txt(name,180),code:txt(code,30),tasks,archived:false,sprints:[],releases:[],scheduling:{calendar:project.scheduling?.calendar,links:(project.scheduling?.links||[]).map(l=>({...l,predecessorId:mapping.get(l.predecessorId),successorId:mapping.get(l.successorId)})).filter(l=>l.predecessorId&&l.successorId)},timeEntries:[],comments:[],reminders:[],budget:{amount:0,currency:project.budget?.currency||'USD'},importedAt:stamp(),version:'0.1.0',changelog:[],savedViews:[],projectStatus:'On track'};}
module.exports={date,normalizeProjectExtras,validateExtras,addResource,deleteResource,logTime,removeTime,postComment,deleteComment,addReminder,finishReminder,deleteReminder,setBudget,timeSummary,capacitySummary,costSummary,health,normalizePortfolios,savePortfolio,deletePortfolio,sprintVelocity,csvCell,tasksCsv,timeCsv,templateProject};
