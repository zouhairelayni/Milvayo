// /src/domain/modernBridge.cjs
'use strict';
const {localDay}=require('../utils/localDay.cjs');
// Modern design ↔ original v0.4.1 domain model. Never persist mock data.
const model=require('./model.cjs');
const STATUS=model.STATUSES;
const MAIN=model.boards.DEFAULT_BOARD_ID;
const now=()=>new Date().toISOString();
const day=()=>localDay();
const token=p=>model.id(p);
const defaultLists=id=>STATUS.map((status,i)=>({id:`${id}-lane-${i}`,name:status,status}));
const listSafe=(board)=>Array.isArray(board.lists)&&board.lists.length?board.lists:defaultLists(board.id);
const boardFor=(p,id)=>p.boards.find(b=>b.id===id);
const listFor=(b,id)=>listSafe(b).find(l=>l.id===id);
const taskBoard=t=>model.boards.effectiveBoard(t);
const taskList=(p,t)=>{const b=boardFor(p,taskBoard(t))||p.boards[0];const ls=listSafe(b);return ls.some(l=>l.id===t.listId&&l.status===t.status)?t.listId:(ls.find(l=>l.status===t.status)||ls[0]).id};
const withLists=(p,id,fn)=>({...p,boards:p.boards.map(b=>b.id===id?{...b,lists:fn(listSafe(b))}:b)});
const getTask=(p,id)=>{const t=p.tasks.find(t=>t.id===id);if(!t)throw Error('Task not found');return t};
const dateValid=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
const listStatus=(p,bid,lid)=>{const b=boardFor(p,bid);if(!b)throw Error('Board missing');const l=listFor(b,lid);if(!l)throw Error('List missing');return l};
const targetIndex=(p,id,status,beforeId)=>{const sorted=p.tasks.filter(t=>t.id!==id&&t.status===status).sort((a,b)=>a.position-b.position);
 if(beforeId){const i=sorted.findIndex(t=>t.id===beforeId);if(i<0)throw Error('Drop target missing');return i;}
 return sorted.length;
};
const changeStatus=(p,id,status,lid,before)=>{
 const t=getTask(p,id);const next=model.moveTask(p,id,status,targetIndex(p,id,status,before));
 return {...next,tasks:next.tasks.map(x=>x.id===id?{...x,listId:lid||'',progress:status==='Done'?100:x.progress,updatedAt:now()}:x)};
};
function placeTask(p,id,listId,beforeId){const t=getTask(p,id);const l=listStatus(p,taskBoard(t),listId);
 if(beforeId){const other=getTask(p,beforeId);if(taskBoard(other)!==taskBoard(t)||taskList(p,other)!==listId||other.id===id)throw Error('Invalid drop target');}
 if(t.status===l.status&&taskList(p,t)===listId){
   const old=p.tasks.filter(x=>x.status===l.status&&taskBoard(x)===taskBoard(t)).sort((a,b)=>a.position-b.position).map(x=>x.id);
   const updated=old.filter(x=>x!==id);updated.splice(beforeId?updated.indexOf(beforeId):updated.length,0,id);
   if(old.join('|')===updated.join('|'))return p;
 }
 return changeStatus(p,id,l.status,listId,beforeId);
}
function addList(p,boardId,name,status){const b=boardFor(p,boardId),n=String(name||'').trim();if(!b)throw Error('Board missing');if(!n||n.length>80)throw Error('List name must contain 1–80 characters');if(!STATUS.includes(status))throw Error('Invalid list status');if(listSafe(b).length>=40)throw Error('Maximum 40 lists per board');return withLists(p,boardId,ls=>[{id:token('lane'),name:n,status},...ls]);}
function renameList(p,boardId,listId,name){const n=String(name||'').trim();if(!n||n.length>80)throw Error('List name must contain 1–80 characters');listStatus(p,boardId,listId);return withLists(p,boardId,ls=>ls.map(x=>x.id===listId?{...x,name:n}:x));}
function moveListTo(p,boardId,listId,to){const b=boardFor(p,boardId);if(!b)throw Error('Board missing');const ls=[...listSafe(b)],i=ls.findIndex(l=>l.id===listId);if(i<0||to<0||to>=ls.length||i===to)return p;const [l]=ls.splice(i,1);ls.splice(to,0,l);return withLists(p,boardId,()=>ls);}
function deleteList(p,boardId,listId){const b=boardFor(p,boardId);if(!b)throw Error('Board missing');const ls=listSafe(b),i=ls.findIndex(l=>l.id===listId);if(i<0||ls.length<=1)throw Error('A board needs at least one list');const target=ls[i>0?i-1:1];let next=p;
 for(const t of p.tasks.filter(t=>taskBoard(t)===boardId&&taskList(p,t)===listId))next=changeStatus(next,t.id,target.status,target.id);
 return withLists(next,boardId,()=>ls.filter(l=>l.id!==listId));}
function addBoard(p,name){const q=model.boards.createBoard(p,name);const last=q.boards.at(-1);return {...q,boards:q.boards.map(b=>b.id===last.id?{...b,lists:defaultLists(last.id),archived:false}:b)};}
function archiveBoard(p,id,archived){if(id===MAIN)throw Error('Main board cannot be archived');if(!boardFor(p,id))throw Error('Board missing');return {...p,boards:p.boards.map(b=>b.id===id?{...b,archived:!!archived}:b)};}
function deleteBoard(p,id){return model.boards.deleteBoard(p,id);}
function addTask(p,title,status='Backlog',bid=MAIN,extra={}){
 const b=boardFor(p,bid);if(!b)throw Error('Board missing');const n=String(title||'').trim();if(!n||n.length>240)throw Error('Task needs a title (1–240 characters)');const l=(extra.list&&listFor(b,extra.list))||listSafe(b).find(l=>l.status===status)||listSafe(b)[0];
 const task=model.defaultTask({id:token(p.code||'task'),title:n,description:extra.description||'',status:l.status,boardId:bid,listId:l.id,owner:extra.owner||'Solo operator',priority:extra.priority||'Medium',stage:extra.stage||'Development',estimateHours:extra.effort||0,taskTypeId:extra.type==='Milestone'?'milestone':'task',labels:extra.labels||[],start:extra.start||'',due:extra.due||'',position:Math.max(-1,...p.tasks.filter(t=>taskBoard(t)===bid&&taskList(p,t)===l.id).map(t=>Number.isFinite(t.position)?t.position:-1))+1});
 const toTop = p.kanbanViews?.[bid]?.newTaskAtTop===true;
 const other = toTop ? p.tasks.map(t=>taskBoard(t)===bid && taskList(p,t)===l.id ? {...t,position:t.position+1} : t) : p.tasks;
 return {project:{...p,tasks:[...other,toTop?{...task,position:0}:task]},id:task.id};
}
function patchTask(p,id,patch={}){
 const t=getTask(p,id);let next=p;const input={...patch};
 if(Object.prototype.hasOwnProperty.call(input,'board')){if(!boardFor(next,input.board))throw Error('Board missing');next=model.boards.assignBoard(next,id,input.board);input.list=undefined;}
 if(Object.prototype.hasOwnProperty.call(input,'list')&&input.list){next=placeTask(next,id,input.list,null);}
 if(Object.prototype.hasOwnProperty.call(input,'status')){if(!STATUS.includes(input.status))throw Error('Invalid status');const x=getTask(next,id);const b=boardFor(next,taskBoard(x));const l=listSafe(b).find(l=>l.status===input.status)||listSafe(b)[0];next=changeStatus(next,id,input.status,l.id);}
 if(Object.prototype.hasOwnProperty.call(input,'dependsOn'))next=model.setTaskDependencies(next,id,input.dependsOn);
 const fields={title:'title',description:'description',priority:'priority',stage:'stage',owner:'owner',start:'start',due:'due',effort:'estimateHours',progress:'progress',labels:'labels',milestone:'milestone',taskTypeId:'taskTypeId',parentId:'parentId',releaseId:'releaseId',phaseId:'phaseId',repo:'repo',branch:'branch',commit:'commit',mainSha:'mainSha',expected:'expected',actual:'actual',evidence:'evidence',rollback:'rollback',customValues:'customValues',attachments:'attachments',tests:'tests'};
 const props={};for(const [k,v] of Object.entries(fields))if(Object.prototype.hasOwnProperty.call(input,k))props[v]=input[k];
 if('title' in props&&(!String(props.title).trim()||String(props.title).length>240))throw Error('Task title is required (maximum 240 characters)');
 for(const key of ['start','due'])if(key in props&&props[key]!==''&&!dateValid(props[key]))throw Error('Enter real YYYY-MM-DD dates');
 if('estimateHours' in props&&(!Number.isFinite(props.estimateHours)||props.estimateHours<0||props.estimateHours>100000))throw Error('Invalid estimated hours');
 if('progress' in props&&(!Number.isFinite(props.progress)||props.progress<0||props.progress>100))throw Error('Progress must be between 0 and 100');
 if('attachments' in props&&(!Array.isArray(props.attachments)||props.attachments.some(a=>!/^https?:\/\//i.test(String(a.url||'')))))throw Error('Attachments must have safe http or https links');
 if('tests' in props&&(!Array.isArray(props.tests)||props.tests.length>250))throw Error('Invalid acceptance checks');
 if('priority' in props&&!model.PRIORITIES.includes(props.priority))throw Error('Invalid priority');if('stage' in props&&!model.STAGES.includes(props.stage))throw Error('Invalid stage');
 const current=getTask(next,id),updated={...current,...props};if(updated.start&&updated.due&&updated.start>updated.due)throw Error('Due date cannot precede start date');
 if(Object.keys(props).length){const schedulingChanged=['start','due','milestone'].some(k=>k in props);const invalidates=['title','description','start','due','milestone','owner','stage','priority','estimateHours','parentId','releaseId','phaseId','repo','branch','commit','expected','actual','evidence','rollback','taskTypeId','customValues','attachments','tests'].some(k=>k in props);next={...next,tasks:next.tasks.map(x=>x.id===id?{...updated,verified:invalidates?false:updated.verified,merged:invalidates?false:updated.merged,updatedAt:now()}:x)};
 if(schedulingChanged)next=model.projectScheduling.reconcileProjectScheduling(next);}
 return next;
}
const viewCache=new WeakMap();
// shortcut: assumes a task object is replaced, never edited in place, when it changes. Reuse its built view if hours, comments, list and type are the same.
function builtTask(p,t,types,hours,commentSrc){
 const list=taskList(p,t),type=t.milestone?'Milestone':types.get(t.taskTypeId)||'Task',logged=hours.get(t.id)||0,src=commentSrc.get(t.id)||[];
 const hit=viewCache.get(t);
 if(hit&&hit.list===list&&hit.type===type&&hit.logged===logged&&hit.src.length===src.length&&hit.src.every((c,i)=>c===src[i]))return hit.view;
 const view={...t,board:taskBoard(t),list,type,effort:t.estimateHours||0,logged,sprint:t.sprintId||null,start:t.start||'',due:t.due||'',
  comments:src.map(c=>({id:c.id,by:c.author,text:c.body,at:c.at}))};
 viewCache.set(t,{list,type,logged,src,view});return view;
}
// Each section of the view is rebuilt only when the data it reads changed (state is replaced, never edited in place).
// Screens keep `s.tasks`, `s.boards` ... as memo dependencies, so an unrelated edit no longer rebuilds every screen's work.
const same=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
const section=()=>{let deps=null,out;return (d,compute)=>{if(!deps||!same(deps,d)){out=compute();deps=d;}return out;};};
const boardView=new WeakMap();
const viewParts={boards:section(),tasks:section(),checks:section(),sprints:section(),releases:section(),portfolios:section(),project:section(),labour:section(),contributors:section(),automations:section(),activity:section(),taskTypes:section()};
function projectView(ws){const p=ws.projects.find(p=>p.id===ws.selectedId)||ws.projects[0];
 const boards=viewParts.boards([p.boards],()=>p.boards.map(b=>{let v=boardView.get(b);if(!v||v.lists!==b.lists){v={...b,lists:listSafe(b)};boardView.set(b,v);}return v;}));
 const tasks=viewParts.tasks([p.tasks,p.boards,p.taskTypes,p.timeEntries,p.comments],()=>{const hours=new Map(),commentSrc=new Map(),types=new Map((p.taskTypes||[]).map(t=>[t.id,t.name]));
  for(const e of p.timeEntries||[])hours.set(e.taskId,(hours.get(e.taskId)||0)+e.hours);
  for(const c of p.comments||[]){if(!commentSrc.has(c.taskId))commentSrc.set(c.taskId,[]);commentSrc.get(c.taskId).push(c);}
  return p.tasks.slice().sort((a,b)=>a.position-b.position).map(t=>builtTask(p,t,types,hours,commentSrc));});
 const checks=viewParts.checks([p.tasks],()=>p.tasks.flatMap(t=>t.tests.map(x=>({id:`${t.id}::${x.id}`,title:x.title,taskId:t.id,status:x.result,evidence:!!x.evidence}))));
 const sprints=viewParts.sprints([p.sprints,day()],()=>(p.sprints||[]).map(x=>{const burn=model.agile.burndown(p,x.id);return {...x,velocity:x.state==='completed'?(model.operations.sprintVelocity(p).find(v=>v.id===x.id)?.completed||0):null,burn:burn.length?{days:burn.map(v=>v.date.slice(5)),ideal:burn.map(v=>v.ideal),recorded:burn.map(v=>v.remaining)}:null};}));
 const releases=viewParts.releases([p.releases,p.tasks],()=>p.releases.map(r=>({...r,stage:r.status,version:r.version||r.name,tasks:p.tasks.filter(t=>t.releaseId===r.id).map(t=>t.id),ready:model.canRelease(r,p)})));
 const portfolios=viewParts.portfolios([ws.portfolios,ws.projects],()=>(ws.portfolios||[]).map(x=>{const ps=ws.projects.filter(p=>x.projectIds.includes(p.id));return {id:x.id,name:x.name,projects:ps.map(z=>z.name),health:ps.some(z=>model.operations.health(z).attention)?'At risk':'On track',progress:ps.length?ps.reduce((n,z)=>n+model.operations.health(z).progress,0)/(ps.length*100):0};}));
 const project=viewParts.project([p.name,p.version,p.tasks,p.budget],()=>({name:p.name,release:p.version,due:p.tasks.filter(t=>t.due).sort((a,b)=>a.due.localeCompare(b.due)).at(-1)?.due||day(),budget:p.budget?.amount||0}));
 const actualLabour=viewParts.labour([p.timeEntries,p.resources],()=>model.operations.timeSummary(p).cost);
 const contributors=viewParts.contributors([p.resources],()=>(p.resources||[]).map(r=>({...r,weekly:r.weeklyHours,rate:r.hourlyRate,role:'Contributor'})));
 const automations=viewParts.automations([p.automations],()=>(p.automations||[]).map(x=>({...x,on:x.enabled,trigger:`Status becomes ${x.triggerStatus}`,action:`Set ${x.action} to ${x.value}`})));
 const activity=viewParts.activity([ws.activity],()=>(ws.activity||[]).map(a=>({...a,text:a.action})));
 const taskTypes=viewParts.taskTypes([p.taskTypes],()=>(p.taskTypes||[]).map(t=>t.name));
 return {project,boards,tasks,sprints,releases,checks,contributors,actualLabour,automations,portfolios,activity,snapshots:ws.backups||[],taskTypes,taskTypeOptions:p.taskTypes||[],customFields:p.customFields||[]};}
function reconcile(before,next){return model.agile.reconcileProgress(before,model.projectScheduling.reconcileProjectScheduling(next));}
module.exports={MAIN,STATUS,defaultLists,listSafe,taskList,addBoard,archiveBoard,deleteBoard,addList,renameList,moveListTo,deleteList,addTask,patchTask,placeTask,changeStatus,projectView,reconcile};
