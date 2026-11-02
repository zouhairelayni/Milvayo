// /src/domain/scheduling.cjs
'use strict';
/**
 * Niyarvo Projects scheduling core (NP-SCHED1).
 * Pure CommonJS: no React Native, Expo, Node-specific crypto, network or storage.
 * All date arithmetic uses UTC date-only values; no local timezone conversions.
 * Does not modify the v1 project schema. Typed links are explicit overlays on
 * existing `task.dependsOn` edges until a future, tested schema migration.
 */
const DAY_MS=86400000;
const TYPES=new Set(['FS','SS','FF','SF']);
const MAX_TASKS=10000, MAX_LINKS=100000, MAX_SCAN_DAYS=100000;
function fail(message){throw new Error(message);}
function dayNumber(date){
 if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))return null;
 const n=Date.parse(`${date}T00:00:00.000Z`);
 return Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===date?n/DAY_MS:null;
}
function dateAt(n){if(!Number.isInteger(n))fail('Invalid day number');return new Date(n*DAY_MS).toISOString().slice(0,10);}
function isoWeekday(n){return ((new Date(n*DAY_MS).getUTCDay()+6)%7)+1;}
function makeCalendar(config={}){
 if(!config||typeof config!=='object'||Array.isArray(config))fail('Invalid calendar');
 const mode=config.mode??'calendar';
 if(!['calendar','workdays'].includes(mode))fail('Invalid calendar mode');
 const weekdays=config.weekdays??[1,2,3,4,5];
 if(!Array.isArray(weekdays)||!weekdays.length||!weekdays.every(n=>Number.isInteger(n)&&n>=1&&n<=7)||new Set(weekdays).size!==weekdays.length)fail('Invalid working weekdays');
 const closed=config.closed??[];const opened=config.opened??[];
 if(!Array.isArray(closed)||!Array.isArray(opened)||closed.length>4000||opened.length>4000)fail('Invalid calendar exceptions');
 if([...closed,...opened].some(s=>dayNumber(s)===null))fail('Invalid calendar exception date');
 if(new Set(closed).size!==closed.length||new Set(opened).size!==opened.length||closed.some(s=>opened.includes(s)))fail('Duplicate or contradictory calendar exception');
 const cset=new Set(closed.map(dayNumber)),oset=new Set(opened.map(dayNumber)),wset=new Set(weekdays);
 const isEligible=(n)=>mode==='calendar'||(oset.has(n)||(!cset.has(n)&&wset.has(isoWeekday(n))));
 const isWorkday=(date)=>{const n=dayNumber(date);return n===null?false:isEligible(n);};
 function next(n,direction){if(!Number.isInteger(n)||![1,-1].includes(direction))fail('Invalid date navigation');
  for(let k=0;k<MAX_SCAN_DAYS;k++){n+=direction;if(isEligible(n))return n;}
  fail('Calendar contains no reachable working days');
 }
 function shift(n,units){if(!Number.isInteger(n)||!Number.isInteger(units)||Math.abs(units)>10000)fail('Invalid schedule offset');
  const dir=units<0?-1:1;
  for(let i=0;i<Math.abs(units);i++)n=next(n,dir);
  return n;
 }
 function onOrAfter(n){if(isEligible(n))return n;return next(n-1,1);}
 function onOrBefore(n){if(isEligible(n))return n;return next(n+1,-1);}
 function countInclusive(a,b){if(b<a)fail('Task ends before it starts');
  if(mode==='calendar')return b-a+1;
  let result=0;for(let d=a;d<=b;d++)if(isEligible(d))result++;
  return result;
 }
 return {mode,weekdays:[...weekdays],closed:[...closed],opened:[...opened],isWorkday,isEligible,next,shift,onOrAfter,onOrBefore,countInclusive};
}
function taskSpan(task,cal){
 const a=dayNumber(task.start),b=dayNumber(task.due);
 if(a===null&&b===null)return null;
 const milestone=task.milestone===true;
 if(!milestone&&(a===null||b===null))return null;
 const start=milestone?(b??a):a,end=milestone?(b??a):b;
 if(end<start)fail(`Task ${task.id}: due date precedes start`);
 if(end-start>MAX_SCAN_DAYS)fail(`Task ${task.id}: schedule span exceeds supported limit`);
 if(!cal.isEligible(start)||!cal.isEligible(end))fail(`Task ${task.id}: dates must fall on scheduled days`);
 const duration=milestone?0:cal.countInclusive(start,end);
 if(!milestone&&duration<1)fail(`Task ${task.id}: no scheduled days inside span`);
 return {start,end,duration,milestone,hasStart:typeof task.start==='string'&&task.start!==''};
}
function indexProject(project){
 if(!project||!Array.isArray(project.tasks)||project.tasks.length>MAX_TASKS)fail('Invalid project tasks');
 const byId=new Map();
 for(const task of project.tasks){if(!task||typeof task.id!=='string'||!task.id||byId.has(task.id))fail('Invalid or duplicate task ID');byId.set(task.id,task);}
 return byId;
}
function normalizeLinks(project,typedLinks){
 const byId=indexProject(project), edges=[];const pairs=new Map();
 for(const task of project.tasks){
  if(!Array.isArray(task.dependsOn))fail(`Task ${task.id}: invalid dependencies`);
  for(const dep of task.dependsOn){
   if(!byId.has(dep)||dep===task.id)fail(`Invalid predecessor for ${task.id}: ${dep}`);
   const key=`${dep}\u0000${task.id}`;
   if(pairs.has(key))fail(`Duplicate dependency: ${dep} -> ${task.id}`);
   const edge={predecessorId:dep,successorId:task.id,type:'FS',lagDays:0};pairs.set(key,edge);edges.push(edge);
   if(edges.length>MAX_LINKS)fail('Too many dependencies');
  }
 }
 if(typedLinks!==undefined){
  if(!Array.isArray(typedLinks)||typedLinks.length>MAX_LINKS)fail('Invalid typed dependency overlay');
  const seen=new Set();
  for(const link of typedLinks){
   if(!link||typeof link!=='object')fail('Invalid dependency metadata');
   const key=`${link.predecessorId}\u0000${link.successorId}`;
   if(seen.has(key))fail('Duplicate typed dependency overlay');seen.add(key);
   const existing=pairs.get(key);if(!existing)fail('Typed link must match a task.dependsOn relationship');
   if(!TYPES.has(link.type))fail(`Invalid dependency type: ${link.type}`);
   if(!Number.isInteger(link.lagDays)||Math.abs(link.lagDays)>365)fail('Lag must be an integer between -365 and 365');
   existing.type=link.type;existing.lagDays=link.lagDays;
  }
 }
 const incoming=new Map([...byId.keys()].map(id=>[id,[]]));
 const outgoing=new Map([...byId.keys()].map(id=>[id,[]]));
 const indegree=new Map([...byId.keys()].map(id=>[id,0]));
 for(const edge of edges){incoming.get(edge.successorId).push(edge);outgoing.get(edge.predecessorId).push(edge);indegree.set(edge.successorId,indegree.get(edge.successorId)+1);}
 const queue=[...byId.keys()].filter(id=>indegree.get(id)===0);const order=[];
 for(let p=0;p<queue.length;p++){
  const id=queue[p];order.push(id);
  for(const edge of outgoing.get(id)){
   const next=edge.successorId;const d=indegree.get(next)-1;indegree.set(next,d);if(!d)queue.push(next);
  }
 }
 if(order.length!==byId.size)fail('Circular dependency prevents scheduling');
 return {byId,edges,incoming,outgoing,order};
}
function startFloor(edge,pred,succ,cal){
 // Discrete inclusive dates: FS with zero lag starts the next eligible day.
 // SS/FF/SF use the corresponding predecessor anchor on the same eligible day.
 const anchor=edge.type==='FS'||edge.type==='FF'?pred.end:pred.start;
 let constraint;
 if(edge.type==='FS')constraint=cal.next(anchor,1);
 else constraint=anchor;
 constraint=cal.shift(constraint,edge.lagDays);
 if(edge.type==='FF'||edge.type==='SF'){
  if(succ.milestone)return constraint;
  return cal.shift(constraint,-(succ.duration-1));
 }
 return constraint;
}
function endForStart(start,span,cal){return span.milestone?start:cal.shift(start,span.duration-1);}
function stateStamp(project){
 return JSON.stringify([project.id,project.tasks.map(t=>[t.id,t.start,t.due,!!t.milestone,t.dependsOn,t.updatedAt,!!t.verified,!!t.merged,t.status,t.releaseId])]);
}
function auditSchedule(project,options={}){
 const cal=makeCalendar(options.calendar),graph=normalizeLinks(project,options.typedLinks);
 const issues=[],spans=new Map();
 for(const id of graph.order){
  const t=graph.byId.get(id);
  try{const s=taskSpan(t,cal);spans.set(id,s);
   if(!s&&(t.start||t.due))issues.push({code:'partial_dates',taskId:id});
  }catch(e){issues.push({code:'invalid_schedule',taskId:id,detail:e.message});spans.set(id,null);}
 }
 for(const edge of graph.edges){
  const pred=spans.get(edge.predecessorId),succ=spans.get(edge.successorId);
  if(!pred||!succ){issues.push({code:'unscheduled_dependency',taskId:edge.successorId,predecessorId:edge.predecessorId});continue;}
  const min=startFloor(edge,pred,succ,cal);
  if(succ.start<min)issues.push({code:'dependency_conflict',taskId:edge.successorId,predecessorId:edge.predecessorId,type:edge.type,lagDays:edge.lagDays,earliestStart:dateAt(min)});
 }
 return {issues,links:graph.edges.map(e=>({...e})),scheduledCount:[...spans.values()].filter(Boolean).length,assumptions:cal.mode==='workdays'?'Eligible weekdays and explicit exceptions; inclusive dates':'Calendar days; inclusive dates'};
}
function previewCascade(project,options={}){
 const cal=makeCalendar(options.calendar),graph=normalizeLinks(project,options.typedLinks);
 const anchors=options.changedTaskIds;
 if(!Array.isArray(anchors)||!anchors.length||anchors.length>MAX_TASKS||new Set(anchors).size!==anchors.length)fail('Specify unique changedTaskIds');
 for(const id of anchors)if(!graph.byId.has(id))fail(`Unknown changed task: ${id}`);
 const anchorSet=new Set(anchors),affected=new Set();const queue=[...anchors];
 for(let p=0;p<queue.length;p++)for(const edge of graph.outgoing.get(queue[p])){
  const id=edge.successorId;if(!affected.has(id)&&!anchorSet.has(id)){affected.add(id);queue.push(id);}
 }
 const spans=new Map(),issues=[],changes=[];
 for(const id of graph.order){
  const task=graph.byId.get(id);
  let span;
  try{span=taskSpan(task,cal);}catch(e){span=null;if(anchorSet.has(id)||affected.has(id))issues.push({code:'invalid_schedule',taskId:id,detail:e.message});}
  spans.set(id,span);
  if(anchorSet.has(id)||!affected.has(id))continue;
  if(!span){issues.push({code:'unscheduled_successor',taskId:id});continue;}
  let earliest=span.start;let blocked=false;
  for(const edge of graph.incoming.get(id)){
   const parent=spans.get(edge.predecessorId);
   if(!parent){issues.push({code:'unscheduled_predecessor',taskId:id,predecessorId:edge.predecessorId});blocked=true;continue;}
   const floor=startFloor(edge,parent,span,cal);
   if(floor>earliest)earliest=floor;
  }
  if(blocked)continue;
  if(earliest>span.start){
   const end=endForStart(earliest,span,cal);
   const next={...span,start:earliest,end};spans.set(id,next);
   changes.push({taskId:id,oldStart:task.start||'',oldDue:task.due||'',newStart:span.milestone&&!span.hasStart?'':dateAt(earliest),newDue:dateAt(end),reason:'Dependency constraints',invalidatesVerification:true});
  }
 }
 // Do not silently move an explicit anchor; users must resolve constraints it violates.
 for(const id of anchors){
  const current=spans.get(id);
  if(!current){issues.push({code:'unscheduled_anchor',taskId:id});continue;}
  for(const edge of graph.incoming.get(id)){
   const pred=spans.get(edge.predecessorId);if(!pred){issues.push({code:'unscheduled_predecessor',taskId:id,predecessorId:edge.predecessorId});continue;}
   const floor=startFloor(edge,pred,current,cal);
   if(current.start<floor)issues.push({code:'anchor_dependency_conflict',taskId:id,predecessorId:edge.predecessorId,earliestStart:dateAt(floor)});
  }
 }
 return {kind:'NiyarvoSchedulingPreview/v1',baseStamp:stateStamp(project),anchors:[...anchors],changes,issues,
  canApply:issues.length===0,mode:'push-only',assumptions:cal.mode==='workdays'?'Working-day dates and lags; no resource leveling':'Calendar-day dates and lags; no resource leveling'};
}
function applyCascade(project,preview,now){
 if(!preview||preview.kind!=='NiyarvoSchedulingPreview/v1')fail('Invalid schedule preview');
 if(!preview.canApply||preview.issues?.length)fail('Cannot apply an unresolved schedule preview');
 if(preview.baseStamp!==stateStamp(project))fail('Stale schedule preview: project changed');
 const updatedAt=now??new Date().toISOString();if(!Number.isFinite(Date.parse(updatedAt)))fail('Invalid update timestamp');
 const edits=new Map(preview.changes.map(change=>[change.taskId,change]));
 if(edits.size!==preview.changes.length)fail('Duplicate schedule changes');
 const tasks=project.tasks.map(task=>{
  const c=edits.get(task.id);if(!c)return task;
  if(task.start!==c.oldStart&&!(task.start==null&&c.oldStart===''))fail('Stale task start');
  if(task.due!==c.oldDue&&!(task.due==null&&c.oldDue===''))fail('Stale task due');
  return {...task,start:c.newStart,due:c.newDue,verified:false,merged:false,updatedAt};
 });
 if(tasks.length!==project.tasks.length||[...edits.keys()].some(id=>!project.tasks.some(t=>t.id===id)))fail('Preview refers to unknown task');
 return {...project,tasks};
}
module.exports={dayNumber,dateAt,makeCalendar,taskSpan,normalizeLinks,auditSchedule,previewCascade,applyCascade};
