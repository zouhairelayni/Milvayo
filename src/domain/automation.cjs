// /src/domain/automation.cjs
'use strict';
const {localDay}=require('../utils/localDay.cjs');
// Original local-first automation engine. No arbitrary code, HTTP actions, or background execution.
const {effectiveBoard,normalizedBoards}=require('./boards.cjs');
const taskSchema=require('./taskSchema.cjs');
const TRIGGERS=['status','cardButton','boardButton','due','aging'];
const ACTIONS=['priority','owner','stage','addLabel','dueDays','comment','moveStatus'];
const STATUSES=['Backlog','In progress','Validation','Done'];
const PRIORITIES=['Low','Medium','High','Critical'];
const STAGES=['Development','Testing','Production'];
const validDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d+'T00:00:00Z'))&&new Date(d+'T00:00:00Z').toISOString().slice(0,10)===d;
const str=(v,n=150)=>typeof v==='string'?v.trim().slice(0,n):'';
const daysFrom=(date,delta)=>{if(!validDate(date))throw Error('Invalid date');const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+delta);return d.toISOString().slice(0,10)};
function normalizeCommands(input){if(!Array.isArray(input)||input.length>50)throw Error('Invalid automation commands');const ids=new Set();return input.map((x,i)=>{
 if(!x||typeof x!=='object')throw Error('Invalid automation');const id=str(x.id,100)||`command-${i}`;if(ids.has(id))throw Error('Duplicate automation ID');ids.add(id);
 const trigger=TRIGGERS.includes(x.trigger)?x.trigger:'status';const status=STATUSES.includes(x.status)?x.status:(trigger==='aging'?'Any':'Done');
 const boardId=str(x.boardId,120);const priorityFilter=PRIORITIES.includes(x.priorityFilter)?x.priorityFilter:'Any';
 const daysBefore=Number(x.daysBefore??0);if(!Number.isInteger(daysBefore)||daysBefore<0||daysBefore>365)throw Error('Invalid due-date offset');
 if(!Array.isArray(x.actions)||x.actions.length<1||x.actions.length>8)throw Error('Automation requires 1–8 actions');
 const actions=x.actions.map(a=>{if(!a||!ACTIONS.includes(a.type))throw Error('Unknown automation action');const value=str(a.value,500);
 if(a.type==='priority'&&!PRIORITIES.includes(value))throw Error('Invalid automation priority');
 if(a.type==='moveStatus'&&!STATUSES.includes(value))throw Error('Invalid destination status');
 if(a.type==='stage'&&!STAGES.includes(value))throw Error('Invalid automation stage');
 if(a.type==='owner'&&!value)throw Error('Automation owner required');
 if(a.type==='addLabel'&&(!value||value.length>40))throw Error('Invalid automation label');
 if(a.type==='comment'&&!value)throw Error('Automation comment required');
 if(a.type==='dueDays'&&(!/^\d+$/.test(value)||Number(value)>365))throw Error('Automation due-days must be 0–365');
 return {type:a.type,value};});
 return {id,name:str(x.name,100)||'Automation',enabled:x.enabled!==false,trigger,status,boardId,priorityFilter,daysBefore,actions};});}
function normalizeHistory(input){if(!Array.isArray(input))throw Error('Invalid automation audit');return input.slice(0,300).map(x=>({id:str(x.id,100),ruleId:str(x.ruleId,100),taskId:str(x.taskId,120),at:str(x.at,40),event:str(x.event,30),summary:str(x.summary,400),runKey:str(x.runKey,180)}));}
function validate(project){const boards=new Set(normalizedBoards(project).map(b=>b.id));for(const c of normalizeCommands(project.automationCommands||[])){if(c.boardId&&!boards.has(c.boardId))throw Error('Automation references missing Kanban board');}normalizeHistory(project.automationHistory||[]);return true;}
function matches(c,task,event,today,history){if(!c.enabled)return false;if(event.type==='boardButton'&&event.boardId&&effectiveBoard(task)!==event.boardId)return false;if(c.boardId&&effectiveBoard(task)!==c.boardId)return false;if(c.priorityFilter!=='Any'&&task.priority!==c.priorityFilter)return false;
 if(c.trigger==='status')return event.type==='status'&&event.to===c.status&&event.from!==event.to;
 if(c.trigger==='cardButton')return event.type==='cardButton'&&event.ruleId===c.id;
 if(c.trigger==='boardButton')return event.type==='boardButton'&&event.ruleId===c.id;
 if(c.trigger==='due')return event.type==='due'&&validDate(task.due)&&daysFrom(today,c.daysBefore)===task.due&&!history.some(h=>h.runKey===`${c.id}:${task.id}:${today}`);
 if(c.trigger==='aging'){
  const stamp=String(task.updatedAt||task.createdAt||'').slice(0,10);
  return event.type==='aging'&&task.status!=='Done'&&(c.status==='Any'||task.status===c.status)&&validDate(stamp)&&daysFrom(stamp,c.daysBefore)<=today&&
    !history.some(h=>h.runKey===`${c.id}:${task.id}:${today}`);
 }
 return false;}
function run(project,event,opts={}){
 const today=opts.today||localDay();if(!validDate(today))throw Error('Invalid automation clock date');
 const commands=normalizeCommands(project.automationCommands||[]),history=normalizeHistory(project.automationHistory||[]);validate(project);
 if(!event||!['status','cardButton','boardButton','due','aging'].includes(event.type))throw Error('Unknown automation event');
 const taskIds=event.taskId?[event.taskId]:(event.type==='boardButton'||event.type==='due'||event.type==='aging'?(project.tasks||[]).map(t=>t.id):[]);
 if(taskIds.length>10000)throw Error('Automation batch exceeds safety limit');
 let tasks=project.tasks.slice(),comments=(project.comments||[]).slice(),newHistory=[],applied=[];
 for(const taskId of taskIds){let task=tasks.find(t=>t.id===taskId);if(!task){if(event.taskId)throw Error('Task not found');continue;}
  for(const c of commands){if(!matches(c,task,event,today,history.concat(newHistory)))continue;
   if(['cardButton','boardButton'].includes(event.type)&&c.id!==event.ruleId)continue;
   if(applied.length>=200)throw Error('Automation execution cap reached');
   let next={...task};for(const a of c.actions){switch(a.type){
     case 'priority':next.priority=a.value;break;case 'owner':next.owner=a.value;break;case 'stage':next.stage=a.value;break;
     case 'addLabel':next.labels=[...new Set([...(next.labels||[]),a.value])].slice(0,30);break;
     case 'dueDays':next.due=daysFrom(today,Number(a.value));break;
     case 'moveStatus':{
       if(next.status===a.value)break;
       taskSchema.checkTransition({...project,tasks},next,a.value);
       if(a.value==='Done'&&next.dependsOn?.some(dep=>tasks.find(x=>x.id===dep)?.status!=='Done'))throw Error('Cannot automate completion with unfinished dependencies');
       const board=normalizedBoards(project).find(b=>b.id===effectiveBoard(next));
       const lane=(board?.lists||[]).find(l=>l.status===a.value);
       next.status=a.value;next.listId=lane?.id||'';next.progress=a.value==='Done'?100:next.progress;
       next.position=tasks.filter(t=>t.id!==next.id&&t.status===a.value).length;
       break;
     }
     case 'comment':comments.push({id:`automation-${Date.now()}-${comments.length}`,taskId,author:'Automation',body:a.value,at:today+'T00:00:00.000Z'});break;
   }}
   next.verified=false;next.merged=false;next.updatedAt=new Date().toISOString();task=next;
   const runKey=['due','aging'].includes(c.trigger)?`${c.id}:${taskId}:${today}`:'';
   newHistory.push({id:`run-${Date.now()}-${history.length+newHistory.length}`,ruleId:c.id,taskId,at:new Date().toISOString(),event:event.type,summary:`${c.name}: ${c.actions.map(a=>a.type).join(', ')}`,runKey});applied.push({ruleId:c.id,taskId});
  }
  tasks=tasks.map(t=>t.id===taskId?task:t);
 }
 return {project:{...project,tasks,comments,automationHistory:[...newHistory.reverse(),...history].slice(0,300)},applied};
}
function saveCommand(project,draft){const commands=normalizeCommands([draft]);const candidate=commands[0];const p={...project,automationCommands:[...(project.automationCommands||[]).filter(x=>x.id!==candidate.id),candidate]};validate(p);return p;}
function deleteCommand(project,id){return {...project,automationCommands:(project.automationCommands||[]).filter(c=>c.id!==id)};}
module.exports={TRIGGERS,ACTIONS,normalizeCommands,normalizeHistory,validate,matches,run,saveCommand,deleteCommand,daysFrom};
