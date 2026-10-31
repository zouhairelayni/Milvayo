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
    for(const task of members)rows.push({key:task.id,kind:'task',task,height:60});
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
// Deterministic routing channels: links whose vertical spans overlap receive
// distinct elbow tracks. This prevents coincident trunks from masquerading as
// one dependency. A channel is only shared where the row ranges do not overlap.
function dependencyGeometry(rows,from,dayWidth,typedLinks){
 const metadata=new Map((typedLinks||[]).map(e=>[`${e.predecessorId}->${e.successorId}`,e]));
 const byId=new Map(rows.filter(r=>r.kind==='task').map(r=>[r.task.id,r]));
 const paths=[];
 for(const row of rows){
  if(row.kind!=='task')continue;
  const target=barGeometry(row.task,from,dayWidth);if(!target)continue;
  for(const id of row.task.dependsOn||[]){
   const sourceRow=byId.get(id);if(!sourceRow)continue;
   const source=barGeometry(sourceRow.task,from,dayWidth);if(!source)continue;
   const type=metadata.get(`${id}->${row.task.id}`)?.type||'FS';
   const fromStart=type==='SS'||type==='SF',toEnd=type==='FF'||type==='SF';
   const x1=source.milestone?source.x+dayWidth/2:fromStart?source.x:source.endX;
   const x2=target.milestone?target.x+dayWidth/2:toEnd?target.endX:target.x;
   paths.push({key:`${id}->${row.task.id}`,fromId:id,toId:row.task.id,type,
    x1,y1:sourceRow.center,x2,y2:row.center,
    conflict:x2<x1});
  }
 }
 paths.sort((a,b)=>a.fromId.localeCompare(b.fromId)||a.toId.localeCompare(b.toId));
 const used=[];
 for(const path of paths){
  const minY=Math.min(path.y1,path.y2),maxY=Math.max(path.y1,path.y2);
  let lane=0,elbow;
  // A small deterministic search is sufficient for project-scale boards.
  for(;lane<80;lane++){
   elbow=path.x1+24+lane*16;
   if(!used.some(p=>Math.abs(p.elbow-elbow)<12&&minY<=p.maxY+8&&maxY>=p.minY-8))break;
  }
  path.lane=lane;path.elbow=elbow;used.push({elbow,minY,maxY});
 }
 return paths;
}
// Two smooth turns and a distinct vertical track; SVG path does not require
// platform canvas APIs. Returns finite, stable coordinates for every edge.
function dependencyCurve(path){
 const {x1,y1,x2,y2,elbow}=path;
 if(![x1,y1,x2,y2,elbow].every(Number.isFinite))return '';
 const direction=y2>=y1?1:-1;
 const turn=Math.min(15,Math.abs(y2-y1)/3);
 const leftEnd=x2-9;
 return `M ${x1} ${y1} L ${elbow-12} ${y1} C ${elbow-3} ${y1} ${elbow} ${y1+direction*3} ${elbow} ${y1+direction*turn} L ${elbow} ${y2-direction*turn} C ${elbow} ${y2-direction*3} ${elbow-3} ${y2} ${elbow-12} ${y2} L ${leftEnd} ${y2}`;
}
// Gesture.dx/dy share the same coordinate system as their source port; do not
// combine screen pageX/pageY with asynchronous measureInWindow results.
function connectorPoint(rows,from,dayWidth,sourceId){
 const row=rows.find(r=>r.kind==='task'&&r.task.id===sourceId);
 if(!row)return null;
 const geom=barGeometry(row.task,from,dayWidth);if(!geom)return null;
 return {x:geom.milestone?geom.x+dayWidth/2+32:geom.endX-29,y:row.center};
}
function linkGesturePoint(rows,from,dayWidth,sourceId,dx,dy){
 if(!Number.isFinite(dx)||!Number.isFinite(dy))return null;
 const start=connectorPoint(rows,from,dayWidth,sourceId);
 return start?{x:start.x+dx,y:start.y+dy}:null;
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
// Critical-path method using calendar-day task durations and finish-to-start
// dependencies. Project start is an abstract day zero; this is NOT a resource-
// leveled or working-day forecast. Incomplete schedules are excluded.
function criticalPath(tasks){
 const valid=tasks.filter(t=>span(t));
 const byId=new Map(valid.map(t=>[t.id,t]));
 const excludedIds=tasks.filter(t=>!byId.has(t.id)).map(t=>t.id);
 const visiting=new Set(),visited=new Set(),order=[];
 function visit(id){
  if(visited.has(id))return;
  if(visiting.has(id))throw Error('Circular dependency prevents critical path calculation');
  visiting.add(id);
  for(const dep of byId.get(id).dependsOn||[])if(byId.has(dep))visit(dep);
  visiting.delete(id);visited.add(id);order.push(id);
 }
 for(const id of byId.keys())visit(id);
 const starts={},finishes={},durations={},successors={};
 for(const id of order)successors[id]=[];
 for(const id of order){
  const task=byId.get(id), s=span(task);
  durations[id]=s.milestone?0:s.days;
  const predecessors=(task.dependsOn||[]).filter(dep=>byId.has(dep));
  starts[id]=Math.max(0,...predecessors.map(dep=>finishes[dep]));
  finishes[id]=starts[id]+durations[id];
  for(const dep of predecessors)successors[dep].push(id);
 }
 const totalDays=Math.max(0,...Object.values(finishes));
 const latestStart={},latestFinish={},slack={};
 for(const id of order.slice().reverse()){
  latestFinish[id]=successors[id].length?Math.min(...successors[id].map(x=>latestStart[x])):totalDays;
  latestStart[id]=latestFinish[id]-durations[id];
  slack[id]=latestStart[id]-starts[id];
 }
 const criticalIds=order.filter(id=>slack[id]===0);
 const criticalSet=new Set(criticalIds);
 const criticalEdges=[];
 for(const id of order)for(const pred of byId.get(id).dependsOn||[]){
  if(criticalSet.has(pred)&&criticalSet.has(id)&&finishes[pred]===starts[id])criticalEdges.push(`${pred}->${id}`);
 }
 return {totalDays,scheduledCount:valid.length,excludedIds,criticalIds,criticalEdges,slack,earliestStart:starts,latestStart,assumption:'Calendar days · finish-to-start · no resource leveling'};
}
// Screen-point hit test. The port is dragged onto a visible successor task bar;
// release over whitespace has no effect. Never infer a target from row alone.
function linkTargetAt(rows,from,dayWidth,x,y,sourceId){
 if(!Number.isFinite(x)||!Number.isFinite(y))return null;
 for(const row of rows){
  if(row.kind!=='task'||row.task.id===sourceId||y<row.top+7||y>row.top+row.height-7)continue;
  const bar=barGeometry(row.task,from,dayWidth);if(!bar)continue;
  const left=bar.milestone?bar.x+dayWidth/2-14:bar.x;
  const right=bar.milestone?left+28:bar.x+Math.max(22,bar.width);
  if(x>=left-12&&x<=right+12)return row.task.id;
 }
 return null;
}
module.exports={dayNumber,dateAt,span,calendarDomain,buildRows,layoutRows,barGeometry,dependencyGeometry,dependencyConflicts,invalidSchedules,afterPredecessors,scheduleSample,criticalPath,linkTargetAt,dependencyCurve,connectorPoint,linkGesturePoint};
