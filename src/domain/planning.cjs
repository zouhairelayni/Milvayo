// /src/domain/planning.cjs
'use strict';
// Milvayo implementation: independent task progress and saved queries.
// Calculations are deterministic and side-effect free; no external service code.
const STATUS = new Set(['All','Backlog','In progress','Validation','Done']);
const PRIORITY = new Set(['All','Low','Medium','High','Critical']);
const SORT = new Set(['position','title','due','priority','progress']);
const PRIORITY_RANK={Low:0,Medium:1,High:2,Critical:3};
const isObject=x=>x&&typeof x==='object'&&!Array.isArray(x);
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
function percent(n){return typeof n==='number'&&Number.isFinite(n)?Math.round(clamp(n,0,100)):0;}
function hours(n){return typeof n==='number'&&Number.isFinite(n)?Math.round(clamp(n,0,100000)*100)/100:0;}
function normalizeView(raw){
 if(!isObject(raw))throw Error('Invalid saved view');
 const id=typeof raw.id==='string'?raw.id.trim().slice(0,100):'';
 const name=typeof raw.name==='string'?raw.name.trim().slice(0,80):'';
 if(!id||!name)throw Error('Saved view needs an ID and name');
 const f=isObject(raw.filters)?raw.filters:{};
 const status=STATUS.has(f.status)?f.status:'All';
 const priority=PRIORITY.has(f.priority)?f.priority:'All';
 const text=typeof f.text==='string'?f.text.slice(0,160):'';
 const owner=typeof f.owner==='string'?f.owner.slice(0,120):'All';
 const label=typeof f.label==='string'&&f.label?f.label.slice(0,80):'All';
 return {id,name,filters:{status,priority,text,owner,label},sort:SORT.has(raw.sort)?raw.sort:'position',descending:raw.descending===true};
}
function validateViews(views){
 if(!Array.isArray(views)||views.length>50)throw Error('Too many saved views');
 const ids=new Set();for(const raw of views){const v=normalizeView(raw);if(ids.has(v.id))throw Error('Duplicate saved view ID: '+v.id);ids.add(v.id)};
 return true;
}
function saveView(project,view){
 const normalized=normalizeView(view);
 const existing=Array.isArray(project.savedViews)?project.savedViews:[];
 const found=existing.some(v=>v.id===normalized.id);
 const savedViews=found?existing.map(v=>v.id===normalized.id?normalized:v):[...existing,normalized];
 validateViews(savedViews);
 return {...project,savedViews};
}
function removeView(project,id){return {...project,savedViews:(project.savedViews||[]).filter(v=>v.id!==id)};}
function filterSort(tasks,view,rollups=null){
 const v=normalizeView(view),f=v.filters,term=f.text.trim().toLocaleLowerCase();
 const filtered=tasks.filter(t=>(f.status==='All'||f.status===t.status)&&(f.priority==='All'||f.priority===t.priority)&&(f.owner==='All'||f.owner===t.owner)&&(!term||[t.title,t.id,t.description,t.repo,t.owner,...(t.labels||[])].join(' ').toLocaleLowerCase().includes(term)));
 const comparator=(a,b)=>{
  if(v.sort==='title')return String(a.title).localeCompare(String(b.title));
  if(v.sort==='due')return (a.due||'9999-12-31').localeCompare(b.due||'9999-12-31');
  if(v.sort==='priority')return (PRIORITY_RANK[a.priority]??0)-(PRIORITY_RANK[b.priority]??0);
  if(v.sort==='progress')return (rollups?.get(a.id)?.progress??percent(a.progress))-(rollups?.get(b.id)?.progress??percent(b.progress));
  return (Number(a.position)||0)-(Number(b.position)||0);
 };
 return filtered.slice().sort((a,b)=>{const d=comparator(a,b);return (v.descending?-d:d)||String(a.id).localeCompare(String(b.id));});
}
// Leaves contribute exactly once. Parent progress is a read-only aggregate,
// never a mutation of status, verification, or child completion.
function progressRollups(tasks){
 if(!Array.isArray(tasks))throw Error('Invalid task array');
 const byId=new Map(),children=new Map();
 for(const t of tasks){if(!t||typeof t.id!=='string'||byId.has(t.id))throw Error('Missing or duplicate task ID');byId.set(t.id,t);children.set(t.id,[])}
 for(const t of tasks){if(t.parentId){if(!byId.has(t.parentId))throw Error('Missing parent: '+t.parentId);children.get(t.parentId).push(t.id)}}
 const visiting=new Set(),cache=new Map();
 const calculate=id=>{
  if(cache.has(id))return cache.get(id);
  if(visiting.has(id))throw Error('Circular task hierarchy');
  visiting.add(id);
  const t=byId.get(id),kids=children.get(id);
  let result;
  if(!kids.length){const weight=hours(t.estimateHours)||1;const progress=t.status==='Done'?100:percent(t.progress);
   result={progress,weight,leaves:1,children:0,rollup:false};
  }else{
   let value=0,weight=0,leaves=0;
   for(const childId of kids){const child=calculate(childId);value+=child.progress*child.weight;weight+=child.weight;leaves+=child.leaves;}
   result={progress:weight?Math.round(value/weight):0,weight,leaves,children:kids.length,rollup:true};
  }
  visiting.delete(id);cache.set(id,result);return result;
 };
 for(const t of tasks)calculate(t.id);
 return cache;
}
function updateTaskPlanning(project,taskId,changes){
 if(!isObject(project)||!Array.isArray(project.tasks))throw Error('Invalid project');
 if(!isObject(changes)||!Object.keys(changes).length||Object.keys(changes).some(k=>!['progress','estimateHours'].includes(k)))throw Error('Unsupported planning change');
 const current=project.tasks.find(t=>t.id===taskId);
 if(!current)throw Error('Task not found');
 const fields={};
 if(Object.hasOwn(changes,'progress')){
  if(!Number.isInteger(changes.progress)||changes.progress<0||changes.progress>100)throw Error('Progress must be between 0 and 100');
  if(current.status==='Done')throw Error('Reopen Done task before changing manual progress');
  fields.progress=changes.progress;
 }
 if(Object.hasOwn(changes,'estimateHours')){
  const n=changes.estimateHours;
  if(typeof n!=='number'||!Number.isFinite(n)||n<0||n>100000)throw Error('Effort must be between 0 and 100000 hours');
  fields.estimateHours=hours(n);
 }
 if(Object.keys(fields).every(k=>fields[k]===current[k]))return project;
 const byId=new Map(project.tasks.map(t=>[t.id,t]));
 const affected=[taskId],seen=new Set(affected);
 let parent=current.parentId||'';
 while(parent){
  if(seen.has(parent))throw Error('Circular parent hierarchy');
  if(!byId.has(parent))throw Error('Missing parent: '+parent);
  seen.add(parent);affected.push(parent);parent=byId.get(parent).parentId||'';
 }
 const next={...project,tasks:project.tasks.map(t=>t.id===taskId?{...t,...fields,verified:false,merged:false,updatedAt:new Date().toISOString()}:t)};
 return require('./scheduleProject.cjs').invalidateDependents(next,affected);
}
function projectProgress(tasks){
 const result=progressRollups(tasks),roots=tasks.filter(t=>!t.parentId);
 let weighted=0,weight=0;
 for(const task of roots){const stat=result.get(task.id);weighted+=stat.progress*stat.weight;weight+=stat.weight;}
 return {progress:weight?Math.round(weighted/weight):0,leaves:roots.reduce((n,t)=>n+result.get(t.id).leaves,0),weight};
}
module.exports={percent,hours,normalizeView,validateViews,saveView,removeView,filterSort,progressRollups,projectProgress,updateTaskPlanning};
