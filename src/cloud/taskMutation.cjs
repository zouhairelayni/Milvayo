// /src/cloud/taskMutation.cjs
'use strict';
const S=require('./schema.cjs'),model=require('../domain/model.cjs');
// Only fields whose normalization and invariants are independent of the task graph.
const INDEPENDENT=new Set(['title','description','priority','customValues','updatedAt','verified','merged']);
const fields=(a,b)=>[...new Set([...Object.keys(a),...Object.keys(b)])].filter(k=>!S.equal(a[k],b[k]));
function sameEnvelope(a,b){return ['key','kind','projectId','boardId','id','order'].every(k=>a[k]===b[k]);}
function eligible(change){const a=change.before,b=change.after;return !!(a&&b&&!a.deleted&&!b.deleted&&a.kind==='tasks'&&sameEnvelope(a,b)&&fields(a.data,b.data).every(k=>INDEPENDENT.has(k)&&(!['verified','merged'].includes(k)||b.data[k]===false)));}
// Class B: workflow-sensitive single-task edits. Bounded reads: the task, the project configuration and, for Done, the task's own dependencies.
const WORKFLOW=new Set([...INDEPENDENT,'status','stage','owner','position','listId']);
const sameKey=(a,b)=>['key','kind','projectId','boardId','id'].every(k=>a[k]===b[k]);
function eligibleB(change){const a=change.before,b=change.after;if(!(a&&b&&!a.deleted&&!b.deleted&&a.kind==='tasks'&&sameKey(a,b)))return false;
 return fields(a.data,b.data).every(k=>WORKFLOW.has(k)&&(!['verified','merged'].includes(k)||b.data[k]===false)&&(k!=='listId'||b.data.listId===''));}
const classOf=c=>c.patch||eligible(c)?'A':eligibleB(c)?'B':null;
function needsConfiguration(old,next){return !S.equal(old?.data.customValues,next.data.customValues)||old?.data.status!==next.data.status;}
function validateWorkflow(old,next,project){
 if(!eligibleB({before:old,after:next}))throw Error('Task change requires canonical validation');
 if(!S.equal(model.defaultTask(next.data),next.data))throw Error('Cloud change violates the canonical task schema');
 if(needsConfiguration(old,next)){
  if(!project||project.deleted)throw Error('Task configuration is unavailable');
  if(!S.equal(old.data.customValues,next.data.customValues))model.taskSchema.validateTask(project.data,next.data);
  if(old.data.status!==next.data.status)model.taskSchema.checkTransition(project.data,old.data,next.data.status);
 }
 return true;
}
// Done requires every dependency to be Done in the committed state; statusOf receives a dependency task ID.
function validateDone(old,next,statusOf){
 if(old.data.status===next.data.status||next.data.status!=='Done')return true;
 if(next.data.dependsOn.some(id=>statusOf(id)!=='Done'))throw Error('Complete dependency tasks before Done');return true;
}
function validateIndependent(old,next,project){
 if(!eligible({before:old,after:next}))throw Error('Task change requires canonical validation');
 if(!S.equal(model.defaultTask(next.data),next.data))throw Error('Cloud change violates the canonical task schema');
 if(!S.equal(old.data.customValues,next.data.customValues)){
  if(!project||project.deleted)throw Error('Task configuration is unavailable');
  model.taskSchema.validateTask(project.data,next.data);
 }
 return true;
}
function compactChanges(changes){return changes.map(c=>{
 if(!eligible(c)||!fields(c.before.data,c.after.data).length)return c;
 const before={},after={};for(const k of fields(c.before.data,c.after.data)){if(Object.hasOwn(c.before.data,k))before[k]=c.before.data[k];if(Object.hasOwn(c.after.data,k))after[k]=c.after.data[k];}
 return {key:c.key,baseRevision:c.baseRevision,patch:{before,after}};
});}
function patchEnvelope(c){
 const parts=S.documentKey(c.key).split('~').map(decodeURIComponent);
 if(parts.length!==4||parts[0]!=='tasks'||!parts[1]||parts[2]||S.keyOf('tasks',parts[1],parts[3])!==c.key)throw Error('Invalid task patch path');
 return {key:c.key,kind:'tasks',projectId:S.segment(parts[1]),boardId:'',id:parts[3]};
}
function expandPatch(c,base){
 const envelope=patchEnvelope(c),p=c.patch;
 if(!base||base.deleted||!['kind','projectId','boardId','id','key'].every(k=>base[k]===envelope[k])||!p||!p.before||!p.after||Array.isArray(p.before)||Array.isArray(p.after))throw Error('Invalid task patch base');
 const keys=[...new Set([...Object.keys(p.before),...Object.keys(p.after)])];
 if(!keys.length||keys.some(k=>!INDEPENDENT.has(k)||!S.equal(p.before[k],base.data[k])||!Object.hasOwn(p.before,k)&&Object.hasOwn(base.data,k)))throw Error('Forged or unsupported task patch');
 const data={...base.data};for(const k of keys){if(Object.hasOwn(p.after,k))data[k]=p.after[k];else delete data[k];}
 const result={key:c.key,baseRevision:c.baseRevision,before:base,after:{...base,data}};
 if(!eligible(result))throw Error('Task patch requires canonical validation');return result;
}
module.exports={INDEPENDENT,WORKFLOW,fields,eligible,eligibleB,classOf,needsConfiguration,validateWorkflow,validateDone,validateIndependent,compactChanges,patchEnvelope,expandPatch};
