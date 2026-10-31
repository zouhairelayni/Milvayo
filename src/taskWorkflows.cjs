'use strict';
// Original Niyarvo Projects task hierarchy, query and bulk-command engine.
// No React, network calls, or third-party application code.
const scheduling=require('./scheduleProject.cjs');
const STATUSES=['Backlog','In progress','Validation','Done'];
const PRIORITIES=['Low','Medium','High','Critical'];
const STAGES=['Development','Testing','Production'];
const now=()=>new Date().toISOString();

function hierarchy(tasks){
 if(!Array.isArray(tasks))throw Error('Invalid tasks');
 const byId=new Map(tasks.map(t=>[t.id,t]));
 if(byId.size!==tasks.length)throw Error('Duplicate task ID');
 const visiting=new Set(),done=new Set(),depths=new Map();
 function visit(key){
  if(done.has(key))return depths.get(key);
  if(visiting.has(key))throw Error('Circular parent relationship: '+key);
  const t=byId.get(key);if(!t)throw Error('Missing task: '+key);
  visiting.add(key);
  const parent=t.parentId||'';
  if(parent===key)throw Error('Task cannot be its own parent');
  if(parent&&!byId.has(parent))throw Error('Missing parent '+parent+' for '+key);
  const d=parent?visit(parent)+1:0;
  if(d>40)throw Error('Task hierarchy exceeds 40 levels');
  visiting.delete(key);done.add(key);depths.set(key,d);return d;
 }
 for(const t of tasks)visit(t.id);
 return depths;
}
function setParent(project,taskId,parentId){
 const parent=parentId||'';
 const current=project.tasks.find(t=>t.id===taskId);
 if(!current)throw Error('Task not found');
 if(current.parentId===parent)return project;
 const tasks=project.tasks.map(t=>t.id===taskId?{...t,parentId:parent,verified:false,merged:false,updatedAt:now()}:t);
 hierarchy(tasks);
 const next=scheduling.reconcileProjectScheduling({...project,tasks});
 return scheduling.invalidateDependents(next,[taskId,...[current.parentId,parent].filter(Boolean)]);
}
function descendants(tasks,id){
 const children=new Map();for(const t of tasks){if(!t.parentId)continue;const a=children.get(t.parentId)||[];a.push(t.id);children.set(t.parentId,a)}
 const result=new Set(),stack=[id];while(stack.length){const parent=stack.pop();for(const c of children.get(parent)||[]){if(result.has(c))continue;result.add(c);stack.push(c)}}return result;
}
function query(tasks,{text='',status='All',priority='All',owner='All'}={}){
 const term=String(text).trim().toLowerCase();
 return tasks.filter(t=>(status==='All'||t.status===status)&&(priority==='All'||t.priority===priority)&&(owner==='All'||t.owner===owner)&&(!term||[t.title,t.id,t.description,t.repo,t.owner,...(t.labels||[])].join(' ').toLowerCase().includes(term)));
}
function page(tasks,size=40,count=1){
 if(!Number.isInteger(size)||size<1||size>200||!Number.isInteger(count)||count<1)throw Error('Invalid page arguments');
 return {items:tasks.slice(0,size*count),total:tasks.length,hasMore:tasks.length>size*count};
}
function hierarchyOrder(tasks){
 const depths=hierarchy(tasks),byParent=new Map();
 for(const t of tasks){const key=t.parentId||'';const a=byParent.get(key)||[];a.push(t);byParent.set(key,a)}
 const ordered=[];function visit(t){ordered.push({task:t,depth:depths.get(t.id)});for(const c of byParent.get(t.id)||[])visit(c)}
 for(const t of byParent.get('')||[])visit(t);
 return ordered;
}
function bulkUpdate(project,taskIds,field,value){
 if(!Array.isArray(taskIds)||!taskIds.length||taskIds.length>5000||taskIds.some(x=>typeof x!=='string'))throw Error('Select 1–5000 tasks');
 if(new Set(taskIds).size!==taskIds.length)throw Error('Duplicate selected task');
 const allowed={status:STATUSES,priority:PRIORITIES,stage:STAGES};
 if(field==='owner'){if(typeof value!=='string'||!value.trim()||value.length>120)throw Error('Invalid owner');value=value.trim()}
 else if(!allowed[field]||!allowed[field].includes(value))throw Error('Unsupported bulk operation');
 const ids=new Set(taskIds),all=new Set(project.tasks.map(t=>t.id));
 for(const id of ids)if(!all.has(id))throw Error('Unknown selected task: '+id);
 const changing=project.tasks.filter(t=>ids.has(t.id)&&t[field]!==value);
 if(!changing.length)return {project,changed:0};
 const futureStatus=new Map(project.tasks.map(t=>[t.id,field==='status'&&ids.has(t.id)?value:t.status]));
 if(field==='status'&&value==='Done')for(const t of changing){
  const blockers=(t.dependsOn||[]).filter(dep=>futureStatus.get(dep)!=='Done');
  if(blockers.length)throw Error(`${t.id} blocked by ${blockers.join(', ')}`);
 }
 const changedIds=new Set(changing.map(t=>t.id)),time=now();
 const tasks=project.tasks.map(t=>{
  if(!changedIds.has(t.id))return t;
  const next={...t,[field]:value,verified:false,merged:false,updatedAt:time};
  if(field==='status'){
   for(const rule of project.automations||[]){if(!rule.enabled||rule.triggerStatus!==value)continue;
    if(rule.action==='priority'&&PRIORITIES.includes(rule.value))next.priority=rule.value;
    if(rule.action==='stage'&&STAGES.includes(rule.value))next.stage=rule.value;
    if(rule.action==='owner'&&typeof rule.value==='string'&&rule.value.trim())next.owner=rule.value.trim().slice(0,120);
    if(rule.action==='dueDays'&&/^\d+$/.test(rule.value)&&Number(rule.value)<=365){const date=new Date();date.setUTCDate(date.getUTCDate()+Number(rule.value));next.due=date.toISOString().slice(0,10)}
   }
  }
  return next;
 });
 const next=scheduling.reconcileProjectScheduling({...project,tasks});
 return {project:scheduling.invalidateDependents(next,[...changedIds]),changed:changedIds.size};
}
module.exports={hierarchy,setParent,descendants,query,page,hierarchyOrder,bulkUpdate};
