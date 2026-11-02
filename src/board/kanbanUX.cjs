// /src/board/kanbanUX.cjs
'use strict';
const {localDay}=require('../utils/localDay.cjs');
// Original Niyarvo local-first Kanban enhancements. Kan is a product reference, not source code.
const PRIORITIES=['Low','Medium','High','Critical'];
const DUE=['all','overdue','today','tomorrow','week','month','none'];
const str=(v,n=120)=>typeof v==='string'?v.trim().slice(0,n):'';
function dayUTC(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return null;const d=new Date(value+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value?d:null;}
function dateBucket(task,today=localDay()){
 const due=dayUTC(task.due);if(!due)return 'none';const base=dayUTC(today);if(!base)throw Error('Invalid comparison date');
 const days=Math.round((due-base)/86400000);
 if(task.status!=='Done'&&days<0)return 'overdue';if(days===0)return 'today';if(days===1)return 'tomorrow';if(days>=2&&days<=7)return 'week';if(days>=8&&days<=30)return 'month';return 'later';
}
function matchesDue(task,bucket,today){if(bucket==='all')return true;const d=dateBucket(task,today);if(bucket==='week')return ['today','tomorrow','week'].includes(d);if(bucket==='month')return ['today','tomorrow','week','month'].includes(d);return d===bucket;}
function filterCards(tasks,filters={},today){const text=str(filters.text,200).toLowerCase(),owner=str(filters.owner),label=str(filters.label),priority=str(filters.priority),due=str(filters.due)||'all';
 if(!DUE.includes(due))throw Error('Invalid due-date filter');if(priority&&priority!=='All'&&!PRIORITIES.includes(priority))throw Error('Invalid priority filter');
 return tasks.filter(t=>(!text||[t.title,t.id,t.description,t.repo].join(' ').toLowerCase().includes(text))&&(!owner||owner==='All'||t.owner===owner)&&(!label||label==='All'||(t.labels||[]).includes(label))&&(!priority||priority==='All'||t.priority===priority)&&matchesDue(t,due,today));
}
function resolveDropIndex(allTasks,visibleTasks,status,visibleIndex,movingId){
 const full=allTasks.filter(t=>t.status===status&&t.id!==movingId).sort((a,b)=>a.position-b.position);
 const visible=visibleTasks.filter(t=>t.status===status&&t.id!==movingId).sort((a,b)=>a.position-b.position);
 if(!visible.length)return full.length;
 const i=Math.max(0,Math.min(visible.length,Math.floor(visibleIndex)));
 if(i===visible.length)return full.findIndex(t=>t.id===visible.at(-1).id)+1;
 return full.findIndex(t=>t.id===visible[i].id);
}
function normalizeViews(project){const known=new Set((project.boards||[]).map(b=>b.id));const raw=project.kanbanViews;
 if(raw!==undefined&&(raw===null||typeof raw!=='object'||Array.isArray(raw)))throw Error('Invalid Kanban board preferences');
 const out={};for(const [id,value] of Object.entries(raw||{})){if(!known.has(id))continue;if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid Kanban board preference');out[id]={showDescriptions:value.showDescriptions===true};}return out;
}
function setBoardView(project,boardId,patch){if(!(project.boards||[]).some(b=>b.id===boardId))throw Error('Board not found');const views=normalizeViews(project);return {...project,kanbanViews:{...views,[boardId]:{...views[boardId],showDescriptions:patch.showDescriptions===true}}};}
function duplicateCard(project,taskId,newId,now=new Date().toISOString()){
 const original=project.tasks.find(t=>t.id===taskId);if(!original)throw Error('Task not found');const ident=str(newId);if(!ident||project.tasks.some(t=>t.id===ident))throw Error('Duplicate or empty task ID');if(project.tasks.length>=10000)throw Error('Project task limit reached');
 const copy={...original,id:ident,title:(str(original.title,233)+' (copy)').slice(0,240),status:'Backlog',position:project.tasks.length,progress:0,verified:false,merged:false,branch:'',commit:'',mainSha:'',evidence:'',actual:'',dependsOn:[],sprintId:'',githubLinks:[],createdAt:now,updatedAt:now,tests:(original.tests||[]).map((t,i)=>({...t,id:`${ident}-check-${i+1}`,result:'pending',evidence:''})),customValues:{...(original.customValues||{})},labels:[...(original.labels||[])],attachments:(original.attachments||[]).map((a,i)=>({...a,id:`${ident}-attachment-${i+1}`}))};
 return {...project,tasks:[...project.tasks,copy]};
}
function updateLabels(project,taskId,labels){const task=project.tasks.find(t=>t.id===taskId);if(!task)throw Error('Task not found');if(!Array.isArray(labels)||labels.length>30)throw Error('Too many labels');const clean=[...new Set(labels.map(x=>str(x,40)).filter(Boolean))];if(clean.length>30)throw Error('Too many labels');return {...project,tasks:project.tasks.map(t=>t.id===taskId?{...t,labels:clean,verified:false,merged:false,updatedAt:new Date().toISOString()}:t)};}
module.exports={PRIORITIES,DUE,dateBucket,filterCards,resolveDropIndex,normalizeViews,setBoardView,duplicateCard,updateLabels};
