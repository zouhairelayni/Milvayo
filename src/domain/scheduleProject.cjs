// /src/domain/scheduleProject.cjs
'use strict';
// Project-level persistence adapter for NP-SCHED1. No UI, network, or global state.
const engine = require('./scheduling.cjs');
const KINDS = ['FS','SS','FF','SF'];
const DEFAULT_CALENDAR = Object.freeze({mode:'calendar',weekdays:[1,2,3,4,5],closed:[],opened:[]});
function assertObject(value,label){if(!value||typeof value!=='object'||Array.isArray(value))throw Error(`Invalid ${label}`);}
function normalizeCalendar(raw){
 const c=raw===undefined?DEFAULT_CALENDAR:raw;
 assertObject(c,'project calendar');
 // Underlying scheduling engine validates ISO dates, conflicting exceptions and weekdays.
 const result=engine.makeCalendar(c);
 return {mode:result.mode,weekdays:result.weekdays,closed:result.closed,opened:result.opened};
}
function edgesOf(project){
 assertObject(project,'project');if(!Array.isArray(project.tasks))throw Error('Invalid project tasks');
 const ids=new Set(project.tasks.map(t=>t.id));
 for(const task of project.tasks)for(const dep of task.dependsOn||[]){if(dep===task.id)throw Error(`Task cannot depend on itself: ${task.id}`);if(!ids.has(dep))throw Error(`Missing dependency ${dep} for ${task.id}`);}
 // Deliberately reuse engine's cycle/duplicate/dependency checks.
 return engine.normalizeLinks(project).edges;
}
function fromSource(project,raw,dropRemoved=false){
 const edges=edgesOf(project);
 if(raw!==undefined&&raw!==null)assertObject(raw,'scheduling settings');
 const calendar=normalizeCalendar(raw?.calendar);
 const rawLinks=raw?.links??[];
 if(!Array.isArray(rawLinks)||rawLinks.length>100000)throw Error('Invalid stored dependency settings');
 const allowed=new Set(edges.map(e=>`${e.predecessorId}\u0000${e.successorId}`));
 const overrides=[],seen=new Set();
 for(const e of rawLinks){
  assertObject(e,'dependency settings');
  const key=`${e.predecessorId}\u0000${e.successorId}`;
  if(seen.has(key))throw Error('Duplicate dependency settings');seen.add(key);
  if(!allowed.has(key)){if(dropRemoved)continue;throw Error('Stored dependency has no matching task link');}
  if(!KINDS.includes(e.type)||!Number.isInteger(e.lagDays)||Math.abs(e.lagDays)>365)throw Error('Invalid dependency type or lag');
  overrides.push({predecessorId:e.predecessorId,successorId:e.successorId,type:e.type,lagDays:e.lagDays});
 }
 const byKey=new Map(overrides.map(e=>[`${e.predecessorId}\u0000${e.successorId}`,e]));
 const links=edges.map(e=>byKey.get(`${e.predecessorId}\u0000${e.successorId}`)||e);
 // edgesOf already validated the graph; overlays above cannot change its topology.
 return {calendar,links};
}
function normalizeProjectScheduling(project){return {...project,scheduling:fromSource(project,project.scheduling)};}
function reconcileProjectScheduling(project){return {...project,scheduling:fromSource(project,project.scheduling,true)};}
function updateCalendar(project,calendar){return {...project,scheduling:{...fromSource(project,project.scheduling),calendar:normalizeCalendar(calendar)}};}
function invalidateDependents(project,startIds,extraReleaseIds=[]){
 const graph=engine.normalizeLinks(project,fromSource(project,project.scheduling).links);
 const affected=new Set(startIds),queue=[...affected];
 for(let i=0;i<queue.length;i++)for(const link of graph.outgoing.get(queue[i])||[]){
  if(!affected.has(link.successorId)){affected.add(link.successorId);queue.push(link.successorId);}
 }
 const tasks=project.tasks.map(t=>affected.has(t.id)&& (t.verified||t.merged)?{...t,verified:false,merged:false,updatedAt:new Date().toISOString()}:t);
 const releaseIds=new Set([...extraReleaseIds,...tasks.filter(t=>affected.has(t.id)&&t.releaseId).map(t=>t.releaseId)]);
 const releases=(project.releases||[]).map(r=>releaseIds.has(r.id)&&['Ready','Released'].includes(r.status)?{...r,status:'Testing'}:r);
 return {...project,tasks,releases};
}
function updateTypedLink(project,predecessorId,successorId,type,lagDays){
 if(!KINDS.includes(type)||!Number.isInteger(lagDays)||Math.abs(lagDays)>365)throw Error('Invalid dependency type or lag');
 const settings=fromSource(project,project.scheduling);
 const current=settings.links.find(e=>e.predecessorId===predecessorId&&e.successorId===successorId);
 if(current&&current.type===type&&current.lagDays===lagDays)return project;
 let found=false;
 const links=settings.links.map(e=>{
  if(e.predecessorId===predecessorId&&e.successorId===successorId){found=true;return {...e,type,lagDays};}
  return e;
 });
 if(!found)throw Error('Link tasks before setting their relationship');
 engine.normalizeLinks(project,links);
 return invalidateDependents({...project,scheduling:{...settings,links}},[successorId]);
}
function audit(project){const s=fromSource(project,project.scheduling);return engine.auditSchedule(project,{calendar:s.calendar,typedLinks:s.links});}
function preview(project,anchorIds){const s=fromSource(project,project.scheduling);return engine.previewCascade(project,{changedTaskIds:anchorIds,calendar:s.calendar,typedLinks:s.links});}
function apply(project,proposal){return engine.applyCascade(project,proposal);}
module.exports={KINDS,DEFAULT_CALENDAR,invalidateDependents,normalizeCalendar,normalizeProjectScheduling,reconcileProjectScheduling,updateCalendar,updateTypedLink,audit,preview,apply};
