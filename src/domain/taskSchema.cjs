// /src/domain/taskSchema.cjs
'use strict';
// Niyarvo Projects: independently authored, local-first task metadata and workflow rules.
const STATUSES=['Backlog','In progress','Validation','Done'];
const TYPES=['text','number','date','boolean','select'];
const BASE_TYPES=[{id:'task',name:'Task',description:'General work item'}];
const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const read=(v,max)=>typeof v==='string'?v.trim().slice(0,max):'';
const key=v=>typeof v==='string'&&/^[a-zA-Z][\w-]{0,59}$/.test(v);
function unique(items,label){const ids=new Set();for(const v of items){if(ids.has(v.id))throw Error(`Duplicate ${label} ID: ${v.id}`);ids.add(v.id)}}
function normalizeType(raw){
 if(!isObject(raw)||!key(raw.id)||!read(raw.name,80))throw Error('Task type needs a valid ID and name');
 return {id:raw.id,name:read(raw.name,80),description:read(raw.description,300)};
}
function normalizeField(raw){
 if(!isObject(raw)||!key(raw.id)||!read(raw.name,80)||!TYPES.includes(raw.type))throw Error('Custom field needs ID, name and supported type');
 const options=raw.type==='select'?(Array.isArray(raw.options)?raw.options.map(x=>read(x,80)):[]):[];
 if(options.length>30||options.some(v=>!v)||new Set(options).size!==options.length)throw Error('Invalid select options');
 if(raw.type==='select'&&!options.length)throw Error('Select field needs at least one option');
 return {id:raw.id,name:read(raw.name,80),type:raw.type,required:raw.required===true,options};
}
function normalizeWorkflow(raw){
 if(raw===undefined||raw===null)return {enabled:false,transitions:[]};
 if(!isObject(raw))throw Error('Invalid workflow settings');
 const list=raw.transitions===undefined?[]:raw.transitions;
 if(!Array.isArray(list)||list.length>100)throw Error('Too many workflow transitions');
 const transitions=list.map(t=>{
  if(!isObject(t)||!STATUSES.includes(t.from)||!STATUSES.includes(t.to)||t.from===t.to)throw Error('Invalid status transition');
  return {from:t.from,to:t.to,typeId:read(t.typeId,60)};
 });
 const seen=new Set();for(const t of transitions){const k=[t.from,t.to,t.typeId].join('|');if(seen.has(k))throw Error('Duplicate workflow transition');seen.add(k)}
 return {enabled:raw.enabled===true,transitions};
}
function normalizeSchema(input={}){
 if(!isObject(input))throw Error('Invalid project task configuration');
 const types=input.taskTypes===undefined?BASE_TYPES:input.taskTypes;
 const fields=input.customFields===undefined?[]:input.customFields;
 if(!Array.isArray(types)||types.length<1||types.length>30||!Array.isArray(fields)||fields.length>60)throw Error('Invalid task schema size');
 const taskTypes=types.map(normalizeType),customFields=fields.map(normalizeField);
 unique(taskTypes,'task type');unique(customFields,'custom field');
 if(!taskTypes.some(t=>t.id==='task'))throw Error('Built-in Task type is required');
 const workflow=normalizeWorkflow(input.workflow);
 for(const tr of workflow.transitions)if(tr.typeId&&!taskTypes.some(t=>t.id===tr.typeId))throw Error('Workflow references unknown type');
 return {taskTypes,customFields,workflow};
}
function validateValue(field,value){
 if(value===undefined||value===null||value===''){
  if(field.required)throw Error(`${field.name} is required`);return null;
 }
 if(field.type==='text'){if(typeof value!=='string'||value.length>500)throw Error(`${field.name} must be text (max 500)`);return value;}
 if(field.type==='number'){if(typeof value!=='number'||!Number.isFinite(value)||Math.abs(value)>1000000000)throw Error(`${field.name} must be a finite number`);return value;}
 if(field.type==='boolean'){if(typeof value!=='boolean')throw Error(`${field.name} must be true or false`);return value;}
 if(field.type==='date'){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||Number.isNaN(Date.parse(value+'T00:00:00Z'))||new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value)throw Error(`${field.name} needs a real YYYY-MM-DD date`);return value;}
 if(field.type==='select'){if(!field.options.includes(value))throw Error(`${field.name} needs an allowed option`);return value;}
 throw Error('Unsupported field type');
}
function validateTask(project,task,normalized){
 const {taskTypes,customFields}=normalized||normalizeSchema(project);
 if(!taskTypes.some(t=>t.id===task.taskTypeId))throw Error(`Unknown task type ${task.taskTypeId}`);
 const values=task.customValues;
 if(!isObject(values))throw Error('Invalid task custom values');
 const known=new Set(customFields.map(f=>f.id));
 for(const id of Object.keys(values))if(!known.has(id))throw Error(`Unknown custom field ${id}`);
 for(const f of customFields)validateValue(f,values[f.id]);
 return true;
}
function validateProject(project){const schema=normalizeSchema(project);for(const task of project.tasks)validateTask(project,task,schema);return true}
function checkTransition(project,task,to){
 if(!STATUSES.includes(to))throw Error('Unknown task status');
 const config=normalizeWorkflow(project.workflow);
 if(!config.enabled||task.status===to)return true;
 if(!config.transitions.some(t=>t.from===task.status&&t.to===to&&(!t.typeId||t.typeId===task.taskTypeId)))throw Error(`Workflow blocks ${task.status} → ${to} for ${task.taskTypeId}`);
 return true;
}
function updateSchema(project,configuration){
 const schema=normalizeSchema({...project,...configuration});
 const next={...project,...schema};validateProject(next);return next;
}
function updateTaskType(project,taskId,typeId){
 if(!project.taskTypes.some(t=>t.id===typeId))throw Error('Unknown task type');
 const task=project.tasks.find(t=>t.id===taskId);if(!task)throw Error('Task not found');
 if(task.taskTypeId===typeId)return project;
 const updated={...project,tasks:project.tasks.map(t=>t.id===taskId?{...t,taskTypeId:typeId,verified:false,merged:false,updatedAt:new Date().toISOString()}:t)};
 return require('./scheduleProject.cjs').invalidateDependents(updated,[taskId]);
}
function updateValue(project,taskId,fieldId,value){
 const field=project.customFields.find(f=>f.id===fieldId);if(!field)throw Error('Unknown custom field');
 const task=project.tasks.find(t=>t.id===taskId);if(!task)throw Error('Task not found');
 const converted=validateValue(field,value),existing=task.customValues||{};
 if(existing[fieldId]===converted)return project;
 const nextValues={...existing};if(converted===null)delete nextValues[fieldId];else nextValues[fieldId]=converted;
 const updated={...project,tasks:project.tasks.map(t=>t.id===taskId?{...t,customValues:nextValues,verified:false,merged:false,updatedAt:new Date().toISOString()}:t)};
 return require('./scheduleProject.cjs').invalidateDependents(updated,[taskId]);
}
function removeField(project,fieldId){
 if(!project.customFields.some(f=>f.id===fieldId))throw Error('Field not found');
 const changed=project.tasks.filter(t=>Object.hasOwn(t.customValues||{},fieldId)).map(t=>t.id);
 const updated={...project,customFields:project.customFields.filter(f=>f.id!==fieldId),tasks:project.tasks.map(t=>{
  if(!Object.hasOwn(t.customValues||{},fieldId))return t;
  const customValues={...t.customValues};delete customValues[fieldId];return {...t,customValues,verified:false,merged:false,updatedAt:new Date().toISOString()};
 })};
 return changed.length?require('./scheduleProject.cjs').invalidateDependents(updated,changed):updated;
}
function removeType(project,typeId){
 if(typeId==='task'||project.tasks.some(t=>t.taskTypeId===typeId))throw Error('Cannot delete built-in or in-use task type');
 return {...project,taskTypes:project.taskTypes.filter(t=>t.id!==typeId),workflow:{...project.workflow,transitions:project.workflow.transitions.filter(t=>t.typeId!==typeId)}};
}
module.exports={STATUSES,TYPES,BASE_TYPES,normalizeSchema,normalizeType,normalizeField,normalizeWorkflow,validateTask,validateProject,checkTransition,updateSchema,updateTaskType,updateValue,removeField,removeType};
