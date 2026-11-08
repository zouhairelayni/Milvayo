// /src/screens/tasks/taskDraft.cjs
'use strict';
const {clone,equal,assertJson}=require('../../cloud/schema.cjs');
const FIELDS=['title','description','expected','actual','evidence','rollback','repo','branch','commit','mainSha','tests','effort','customValues'];
const validValue=(field,value)=>field==='effort'?typeof value==='number'&&Number.isFinite(value):field==='tests'?Array.isArray(value):field==='customValues'?!!value&&typeof value==='object'&&!Array.isArray(value):typeof value==='string';
const taskValue=(task,field)=>field==='effort'?(task?.estimateHours??task?.effort??0):(task?.[field]??'');
const draftKey=(scope,projectId,taskId)=>'milvayo-task-draft-v1:'+JSON.stringify([scope,projectId,taskId]);
function createTaskDraft({storage,key,getTask,commit,persist,onChange=()=>{}}){
 let state={schema:1,base:{},patch:{}},serial=Promise.resolve(),loaded=false,committing=null;
 const exclusive=fn=>{const result=serial.then(fn);serial=result.catch(()=>{});return result;};
 const save=()=>{const value=JSON.stringify(state);return exclusive(()=>storage.setItem(key,value));};
 const snapshot=()=>clone(state);
 return {
  async open(){return exclusive(async()=>{const raw=await storage.getItem(key);if(raw){const value=JSON.parse(raw);assertJson(value);if(value.schema!==1||!value.base||typeof value.base!=='object'||Array.isArray(value.base)||!value.patch||typeof value.patch!=='object'||Array.isArray(value.patch)||Object.keys(value.patch).some(f=>!FIELDS.includes(f)||!validValue(f,value.patch[f])||!validValue(f,value.base[f])))throw Error('Task draft is corrupt; retained for recovery');state=value;}loaded=true;onChange(snapshot());return snapshot();});},
  stage(patch){if(!loaded)throw Error('Task draft is still loading');assertJson(patch);if(Object.entries(patch).some(([field,value])=>!FIELDS.includes(field)||!validValue(field,value)))throw Error('Unsupported draft field or value');for(const [field,value]of Object.entries(patch)){if(!Object.hasOwn(state.base,field))state.base[field]=clone(taskValue(getTask(),field));state.patch[field]=clone(value);if(equal(state.base[field],value)&&!committing){delete state.patch[field];delete state.base[field];}}onChange(snapshot());return save();},
  commit(){if(committing)return committing;committing=(async()=>{await serial;const current=getTask();if(!current)throw Error('Task was deleted; draft retained for recovery');for(const field of Object.keys(state.patch))if(!equal(taskValue(current,field),state.base[field])&&!equal(taskValue(current,field),state.patch[field]))throw Error('Task changed while editing '+field+'; compare your draft before saving');const patch=clone(state.patch);if(Object.keys(patch).length&&commit(patch)===false)throw Error('Task changes did not pass validation; draft retained');if(persist&&!(await persist()))throw Error('Local save failed; draft retained');for(const field of Object.keys(patch)){if(equal(state.patch[field],patch[field])){delete state.patch[field];delete state.base[field];}else state.base[field]=clone(patch[field]);}await save();onChange(snapshot());return patch;})().finally(()=>{committing=null;});return committing;},
  rebase(){const task=getTask();if(!task)throw Error('Task was deleted; draft retained for recovery');for(const field of Object.keys(state.patch))state.base[field]=clone(taskValue(task,field));onChange(snapshot());return save();},
  discard(field){delete state.patch[field];delete state.base[field];onChange(snapshot());return save();},
  flush:()=>serial,snapshot,
 };
}
module.exports={createTaskDraft,draftKey,FIELDS};
