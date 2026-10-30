'use strict';
// Independent scheduling geometry. All dates use UTC calendar days to avoid DST drift.
const MS = 86400000;
function dayNumber(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const ms=Date.parse(value+'T00:00:00Z');
  return Number.isFinite(ms)&&new Date(ms).toISOString().slice(0,10)===value ? ms/MS : null;
}
function dateAt(n){return new Date(n*MS).toISOString().slice(0,10)}
function span(task){
  const a=dayNumber(task.start),b=dayNumber(task.due);
  if(a===null&&b===null)return null;
  const start=a===null?b:a; if(a!==null&&b!==null&&b<a)return null; const end=b===null?start:b;
  return {start,end,days:end-start+1,milestone:task.milestone===true};
}
function calendarDomain(tasks,today,limit=540){
  const now=dayNumber(today);
  if(now===null)throw Error('Invalid calendar anchor');
  const all=tasks.map(span).filter(Boolean);
  const min=all.length?Math.min(...all.map(s=>s.start)):now;
  const max=all.length?Math.max(...all.map(s=>s.end)):now;
  // Start at the first scheduled task rather than today's date; otherwise
  // far-future projects appear as an empty grid when first opened.
  const from=min-3;
  const to=Math.max(min+89,max+14);
  // Even a long-running project has a bounded canvas; navigation can shift its window.
  const count=Math.min(limit,Math.max(90,to-from+1));
  return {from,count,to:from+count-1,clipped:to-from+1>limit};
}
function buildRows(tasks,groupBy='status'){
  const order=groupBy==='stage'?['Development','Testing','Production']:['Backlog','In progress','Validation','Done'];
  const field=groupBy==='stage'?'stage':'status';
  const rows=[];
  for(const group of order){const members=tasks.filter(t=>t[field]===group).slice().sort((a,b)=>(a.position||0)-(b.position||0)||a.id.localeCompare(b.id));
    if(!members.length)continue;
    rows.push({key:`group:${group}`,kind:'group',title:group,height:32});
    for(const task of members)rows.push({key:task.id,kind:'task',task,height:58});
  }
  return rows;
}
function layoutRows(rows,headerHeight=58){let top=headerHeight;return rows.map(row=>{const r={...row,top,center:top+row.height/2};top+=row.height;return r})}
function barGeometry(task,from,dayWidth){
  const s=span(task);if(!s)return null;
  const origin=s.milestone?s.end:s.start;
  const x=(origin-from)*dayWidth, xEnd=(s.end-from+1)*dayWidth;
  return {x,width:Math.max(3,xEnd-x),endX:xEnd,days:s.milestone?1:s.days,milestone:s.milestone};
}
function dependencyGeometry(rows,from,dayWidth){
 const byId=new Map(rows.filter(r=>r.kind==='task').map(r=>[r.task.id,r]));
 const paths=[];
 for(const row of rows){if(row.kind!=='task')continue;const target=barGeometry(row.task,from,dayWidth);if(!target)continue;
  for(const id of row.task.dependsOn||[]){const sourceRow=byId.get(id);if(!sourceRow)continue;const source=barGeometry(sourceRow.task,from,dayWidth);if(!source)continue;
   const x1=source.milestone?source.x+dayWidth/2:source.endX;
   const x2=target.x;
   const elbow=x2-x1>34?x1+Math.min(26,(x2-x1)/2):x1+18;
   paths.push({key:`${id}->${row.task.id}`,fromId:id,toId:row.task.id,x1,y1:sourceRow.center,x2,y2:row.center,elbow,conflict:x2<x1});
  }
 }
 return paths;
}
function invalidSchedules(tasks){return tasks.filter(t=>(t.start&&!Number.isInteger(dayNumber(t.start)))||(t.due&&!Number.isInteger(dayNumber(t.due)))||(dayNumber(t.start)!==null&&dayNumber(t.due)!==null&&dayNumber(t.due)<dayNumber(t.start))).map(t=>t.id)}
function dependencyConflicts(tasks){const byId=new Map(tasks.map(t=>[t.id,t])),conflicts=[];
 for(const task of tasks){const target=span(task);if(!target)continue;
  for(const depId of task.dependsOn||[]){const source=span(byId.get(depId)||{});if(source&&target.start<=source.end)conflicts.push({taskId:task.id,predecessorId:depId});}
 }
 return conflicts;
}
function scheduleSample(project,today){
 if(project.id!=='sample-workspace')throw Error('Sample scheduling is only available for the sample project');
 const initial=dayNumber(today);if(initial===null)throw Error('Invalid date');
 if(project.tasks.some(t=>span(t)))throw Error('Sample project already has scheduled tasks');
 return {...project,tasks:project.tasks.map((t,i)=>{const start=initial+Math.floor(i/2)*3;return {...t,start:dateAt(start),due:dateAt(start+(t.milestone?0:2)),verified:false,merged:false,updatedAt:new Date().toISOString()}})};
}
function afterPredecessors(project,taskId){
 const t=project.tasks.find(t=>t.id===taskId);if(!t)throw Error('Task not found');
 const preds=(t.dependsOn||[]).map(id=>project.tasks.find(x=>x.id===id));
 if(!preds.length)throw Error('This task has no predecessors');
 if(preds.some(p=>!p||!span(p)))throw Error('Schedule all predecessor tasks first');
 const earliest=Math.max(...preds.map(p=>span(p).end))+1;
 const current=span(t),start=Math.max(current?.start??earliest,earliest);
 const due=start+(t.milestone?1:(current?.days??1))-1;
 return {...project,tasks:project.tasks.map(x=>x.id===taskId?{...x,start:dateAt(start),due:dateAt(due),verified:false,merged:false,updatedAt:new Date().toISOString()}:x)};
}
module.exports={dayNumber,dateAt,span,calendarDomain,buildRows,layoutRows,barGeometry,dependencyGeometry,dependencyConflicts,invalidSchedules,afterPredecessors,scheduleSample};
