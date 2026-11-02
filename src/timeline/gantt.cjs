// /src/timeline/gantt.cjs
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
    rows.push({key:`group:${group}`,kind:'group',title:group,count:members.length,height:32});
    for(const task of members)rows.push({key:task.id,kind:'task',task,height:60});
  }
  return rows;
}
// Hierarchy view is read-only with respect to parent aggregate dates.
// Collapsing changes presentation, never the underlying task graph.
function hierarchyRows(tasks,collapsedIds=[]){
 const byId=new Map(tasks.map(t=>[t.id,t])),kids=new Map();
 for(const t of tasks)kids.set(t.id,[]);
 const roots=[];
 for(const t of tasks){if(t.parentId&&t.parentId!==t.id&&byId.has(t.parentId))kids.get(t.parentId).push(t);else roots.push(t)}
 const sort=(a,b)=>(Number(a.position)||0)-(Number(b.position)||0)||String(a.id).localeCompare(String(b.id));
 roots.sort(sort);for(const k of kids.values())k.sort(sort);
 const collapsed=new Set(collapsedIds),seen=new Set(),rows=[];
 const walk=(task,depth)=>{
  if(seen.has(task.id))return;seen.add(task.id);
  const children=kids.get(task.id)||[];
  rows.push({key:task.id,kind:'task',task,height:LAYOUT.rowHeight,depth,hasChildren:children.length>0,childCount:children.length,collapsed:collapsed.has(task.id)});
  if(!collapsed.has(task.id))for(const child of children)walk(child,Math.min(depth+1,20));
  else {const markHidden=id=>{if(seen.has(id))return;seen.add(id);for(const kid of kids.get(id)||[])markHidden(kid.id)};for(const child of children)markHidden(child.id)}
 };
 for(const root of roots)walk(root,0);
 // Preserve otherwise unreachable records for malformed imported hierarchies.
 for(const t of tasks)if(!seen.has(t.id))walk(t,0);
 return rows;
}
function hierarchySummaries(tasks,rollups=null){
 const byId=new Map(tasks.map(t=>[t.id,t]));
 const kids=new Map(tasks.map(t=>[t.id,[]]));
 for(const t of tasks){if(t.parentId&&kids.has(t.parentId)&&t.parentId!==t.id)kids.get(t.parentId).push(t.id)}
 const visiting=new Set(),cache=new Map();
 const calculate=id=>{
  if(cache.has(id))return cache.get(id);
  if(visiting.has(id))return null;
  visiting.add(id);
  const task=byId.get(id),desc=kids.get(id)||[],spans=[];
  for(const kid of desc){const nested=calculate(kid);if(nested)spans.push(nested);}
  const own=span(task);if(own)spans.push({start:own.start,end:own.end});
  visiting.delete(id);
  if(!spans.length)return null;
  const result={start:Math.min(...spans.map(s=>s.start)),end:Math.max(...spans.map(s=>s.end)),children:desc.length,progress:rollups?.get(id)?.progress??(task.status==='Done'?100:Number(task.progress)||0)};
  cache.set(id,result);return result;
 };
 for(const t of tasks)calculate(t.id);
 return new Map([...cache.entries()].filter(([id,s])=>s.children>0));
}
function layoutRows(rows,headerHeight=58){let top=headerHeight;return rows.map(row=>{const r={...row,top,center:top+row.height/2};top+=row.height;return r})}
function barGeometry(task,from,dayWidth){
  const s=span(task);if(!s)return null;
  const origin=s.milestone?s.end:s.start;
  const x=(origin-from)*dayWidth, xEnd=(s.end-from+1)*dayWidth;
  return {x,width:Math.max(3,xEnd-x),endX:xEnd,days:s.milestone?1:s.days,milestone:s.milestone};
}
// ---------------------------------------------------------------------------
// Chart layout shared by the renderer (GanttView) and the router below.
// Every row is 60px (groups 32px). A bar is 32px tall, centred in its row, so
// the free band between two neighbouring bars is 28px: that band is where the
// router runs its horizontal channels.
// ---------------------------------------------------------------------------
const LAYOUT={headerHeight:60,rowHeight:60,groupHeight:32,barHeight:32,milestoneWidth:52,connectorWidth:24,gripWidth:16};
const STUB_OUT=12;          // straight run leaving a source bar
const ARROW=8;              // arrow head length; the line stops where the head starts
const STUB_IN=ARROW+10;     // straight run entering a target bar, arrow included
const CORNER=6;             // corner radius of routed lines
const LANE=5;               // minimum distance between parallel routed lines
const PAD=3;                // clearance kept around bars
const BEND_COST=8,HIT_COST=1000,OVERLAP_COST=300,CROSS_COST=10;
// The box a task really occupies on the canvas, in canvas pixels. The renderer
// draws bars from the same numbers, so ports and routes always meet the bar.
function barBox(row,from,dayWidth,summaries){
 if(!row||row.kind!=='task')return null;
 const cy=row.center;
 const sum=summaries&&row.hasChildren?summaries.get(row.task.id):null;
 if(sum){const left=(sum.start-from)*dayWidth,right=left+Math.max(3,(sum.end-sum.start+1)*dayWidth);return {kind:'summary',left,right,top:cy-12,bottom:cy+13,cy,inX:left,outX:right,maxSpread:6};}
 const geo=barGeometry(row.task,from,dayWidth);if(!geo)return null;
 if(geo.milestone){
  const origin=geo.x+dayWidth/2-12,cx=origin+10;
  return {kind:'milestone',left:cx-14,right:origin+LAYOUT.milestoneWidth-2,top:cy-16,bottom:cy+16,cy,inX:cx-14,outX:origin+LAYOUT.milestoneWidth-2,origin,maxSpread:5};
 }
 if(dayWidth<14){const left=geo.x+1,right=left+Math.max(4,geo.width-2);return {kind:'mini',left,right,top:cy-7,bottom:cy+7,cy,inX:left,outX:right,maxSpread:3};}
 const left=geo.x+2,right=left+Math.max(22,geo.width-5);
 return {kind:'bar',left,right,top:cy-LAYOUT.barHeight/2,bottom:cy+LAYOUT.barHeight/2,cy,inX:left,outX:right,maxSpread:10};
}
function spread(count,maxSpread){
 if(count<=1)return [0];
 const step=Math.min(LANE+1,(maxSpread*2)/(count-1));
 return Array.from({length:count},(_,i)=>Math.round(((i-(count-1)/2)*step)*2)/2);
}
function segmentList(points){
 const out=[];
 for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1];if(a.x===b.x&&a.y===b.y)continue;out.push({a,b,vertical:a.x===b.x})}
 return out;
}
function hitsBox(a,b,box){
 return Math.max(a.x,b.x)>=box.left-PAD&&Math.min(a.x,b.x)<=box.right+PAD&&Math.max(a.y,b.y)>=box.top-PAD&&Math.min(a.y,b.y)<=box.bottom+PAD;
}
function routeCost(points,ctx){
 const segs=segmentList(points);
 let cost=Math.max(0,segs.length-1)*BEND_COST;
 for(const s of segs){
  const x0=Math.min(s.a.x,s.b.x),x1=Math.max(s.a.x,s.b.x),y0=Math.min(s.a.y,s.b.y),y1=Math.max(s.a.y,s.b.y);
  cost+=((x1-x0)+(y1-y0))*0.04;
  for(let r=ctx.rowLo;r<=ctx.rowHi;r++){const box=ctx.boxByRow[r];if(box&&box!==ctx.src&&box!==ctx.tgt&&hitsBox(s.a,s.b,box))cost+=HIT_COST;}
  if(s.vertical){
   for(const p of ctx.placed.v)if(Math.abs(p.x-x0)<LANE&&Math.min(y1,p.y1)-Math.max(y0,p.y0)>1)cost+=OVERLAP_COST;
   for(const p of ctx.placed.h)if(p.x0<x0&&x0<p.x1&&y0<p.y&&p.y<y1)cost+=CROSS_COST;
  }else{
   for(const p of ctx.placed.h)if(Math.abs(p.y-y0)<LANE&&Math.min(x1,p.x1)-Math.max(x0,p.x0)>1)cost+=OVERLAP_COST;
   for(const p of ctx.placed.v)if(y0<p.y1&&p.y0<y0&&x0<p.x&&p.x<x1)cost+=CROSS_COST;
  }
 }
 return cost;
}
function freeColumns(lo,hi,rowLo,rowHi,boxByRow,limit=6){
 const blocked=[];
 for(let r=rowLo;r<=rowHi;r++){const b=boxByRow[r];if(b)blocked.push([b.left-PAD-4,b.right+PAD+4])}
 blocked.sort((a,b)=>a[0]-b[0]);
 const free=[];let cursor=lo;
 for(const [a,b] of blocked){if(b<cursor)continue;if(a>cursor)free.push([cursor,Math.min(a,hi)]);cursor=Math.max(cursor,b);if(cursor>hi)break}
 if(cursor<=hi)free.push([cursor,hi]);
 const xs=[];
 for(const [a,b] of free){for(let x=a,n=0;x<=b&&n<limit;x+=LANE+1,n++)xs.push(x);if(xs.length>=24)break}
 return xs;
}
// Horizontal channels live in the free band between two neighbouring rows.
function channelRows(rows,upperIndex,boxByRow){
 const upper=rows[upperIndex],lower=rows[upperIndex+1];if(!upper||!lower)return [];
 const lo=upper.kind==='task'?upper.center+LAYOUT.barHeight/2+PAD+2:upper.top+4;
 const hi=lower.kind==='task'?lower.center-LAYOUT.barHeight/2-PAD-2:lower.top+lower.height-4;
 if(hi<lo)return [];
 const mid=(lo+hi)/2,ys=[];
 for(let k=0;k<=8;k++){const y=Math.round(mid+(k===0?0:(k%2?-1:1)*Math.ceil(k/2)*LANE));if(y>=lo&&y<=hi&&!ys.includes(y))ys.push(y)}
 return ys;
}
// Orthogonal routing with obstacle avoidance and automatic lanes.
//  - finish-to-start links leave the right edge of the predecessor and enter the
//    left edge of the successor;
//  - a link with room between the bars gets one vertical track in a column that
//    crosses no other bar; otherwise it runs through the free band between rows;
//  - several links at one bar are spread along its edge, and every placed line
//    keeps its distance from all earlier ones, so two routes never share a track.
function dependencyGeometry(rows,from,dayWidth,typedLinks,summaries){
 const meta=new Map((typedLinks||[]).map(e=>[`${e.predecessorId}->${e.successorId}`,e]));
 const boxByRow=rows.map(r=>barBox(r,from,dayWidth,summaries));
 const byId=new Map();rows.forEach((r,i)=>{if(r.kind==='task'&&boxByRow[i])byId.set(r.task.id,{row:r,index:i,box:boxByRow[i]})});
 const edges=[];
 for(const entry of byId.values()){
  for(const dep of entry.row.task.dependsOn||[]){const source=byId.get(dep);if(!source||dep===entry.row.task.id)continue;
   const type=meta.get(`${dep}->${entry.row.task.id}`)?.type||'FS';
   const fromStart=type==='SS'||type==='SF',toEnd=type==='FF'||type==='SF';
   edges.push({key:`${dep}->${entry.row.task.id}`,fromId:dep,toId:entry.row.task.id,type,source,target:entry,
    dirOut:fromStart?-1:1,dirIn:toEnd?-1:1,
    sx:fromStart?source.box.inX:source.box.outX,tx:toEnd?entry.box.outX:entry.box.inX,
    conflict:(span(entry.row.task)?.start??Infinity)<=(span(source.row.task)?.end??-Infinity)});}
 }
 const outgoing=new Map(),incoming=new Map();
 for(const e of edges){(outgoing.get(e.fromId)||outgoing.set(e.fromId,[]).get(e.fromId)).push(e);(incoming.get(e.toId)||incoming.set(e.toId,[]).get(e.toId)).push(e)}
 for(const list of outgoing.values()){list.sort((a,b)=>a.target.index-b.target.index||a.toId.localeCompare(b.toId));const off=spread(list.length,list[0].source.box.maxSpread);list.forEach((e,i)=>{e.y1=e.source.box.cy+off[i]})}
 for(const list of incoming.values()){list.sort((a,b)=>a.source.index-b.source.index||a.fromId.localeCompare(b.fromId));const off=spread(list.length,list[0].target.box.maxSpread);list.forEach((e,i)=>{e.y2=e.target.box.cy+off[i]})}
 // Short, local links first, so they keep the lanes closest to their bars.
 edges.sort((a,b)=>Math.abs(a.target.index-a.source.index)-Math.abs(b.target.index-b.source.index)||a.key.localeCompare(b.key));
 const placed={v:[],h:[]},paths=[];
 for(const e of edges){
  const {sx,tx,dirOut,dirIn}=e,sy=e.y1,ty=e.y2,ex=tx-dirIn*ARROW;
  const lowRow=Math.min(e.source.index,e.target.index),highRow=Math.max(e.source.index,e.target.index);
  const ctx={rowLo:lowRow+1,rowHi:highRow-1,boxByRow,src:e.source.box,tgt:e.target.box,placed};
  let best=null;
  const consider=(points,extra=0)=>{const cost=routeCost(points,ctx)+extra;if(!best||cost<best.cost-1e-9)best={cost,points}};
  // Form 1: one vertical track, in a column that crosses no other bar.
  let lo=-Infinity,hi=Infinity;
  if(dirOut>0)lo=Math.max(lo,sx+STUB_OUT);else hi=Math.min(hi,sx-STUB_OUT);
  if(dirIn>0)hi=Math.min(hi,tx-STUB_IN);else lo=Math.max(lo,tx+STUB_IN);
  if(lo===-Infinity)lo=hi-160;if(hi===Infinity)hi=lo+160;
  let formOneFits=false;
  if(lo<=hi){
   let cols=freeColumns(lo,hi,ctx.rowLo,ctx.rowHi,boxByRow);if(dirOut<0)cols=cols.reverse();
   for(const cx of cols){
    formOneFits=true;
    consider([{x:sx,y:sy},{x:cx,y:sy},{x:cx,y:ty},{x:ex,y:ty}],Math.abs(cx-sx)*0.002);
    if(best.cost<BEND_COST*2+4)break;
   }
  }
  // Form 2: leave, run through a channel between rows, come back in. The two
  // vertical tracks may use any free column, so a link can pass around a long
  // bar instead of through it.
  if(!best||best.cost>=OVERLAP_COST/2||!formOneFits){
   const up=[];for(let i=lowRow;i<highRow;i++)up.push(i);
   const picks=[...new Set([up[0],up[1],up[up.length-2],up[up.length-1]].filter(v=>v!==undefined))];
   const near=(base,dir)=>[0,1,2,3].map(k=>base+dir*k*(LANE+1));
   const span2=160,xmin=Math.min(sx,tx),xmax=Math.max(sx,tx);
   const free=(l,h,limit)=>freeColumns(l,h,ctx.rowLo,ctx.rowHi,boxByRow,limit);
   const closest=(list,x0)=>list.sort((a,b)=>Math.abs(a-x0)-Math.abs(b-x0)).slice(0,8);
   const xas=[...new Set([...near(sx+dirOut*STUB_OUT,dirOut),...closest(dirOut>0?free(sx+STUB_OUT,xmax+span2,3):free(xmin-span2,sx-STUB_OUT,3),sx)])];
   const xbs=[...new Set([...near(tx-dirIn*STUB_IN,-dirIn),...closest(dirIn>0?free(xmin-span2,tx-STUB_IN,3):free(tx+STUB_IN,xmax+span2,3),tx)])];
   for(const upper of picks){
    for(const cy of channelRows(rows,upper,boxByRow).slice(0,3)){
     for(const xa of xas)for(const xb of xbs){
      consider([{x:sx,y:sy},{x:xa,y:sy},{x:xa,y:cy},{x:xb,y:cy},{x:xb,y:ty},{x:ex,y:ty}],(Math.abs(xa-sx)+Math.abs(xb-tx))*0.003);
     }
    }
   }
  }
  if(!best)best={cost:0,points:[{x:sx,y:sy},{x:sx+dirOut*STUB_OUT,y:sy},{x:sx+dirOut*STUB_OUT,y:ty},{x:ex,y:ty}]};
  const points=simplify(best.points);
  for(const s of segmentList(points)){if(s.vertical)placed.v.push({x:s.a.x,y0:Math.min(s.a.y,s.b.y),y1:Math.max(s.a.y,s.b.y)});else placed.h.push({y:s.a.y,x0:Math.min(s.a.x,s.b.x),x1:Math.max(s.a.x,s.b.x)})}
  paths.push({key:e.key,fromId:e.fromId,toId:e.toId,type:e.type,x1:sx,y1:sy,x2:tx,y2:ty,arrowDir:dirIn,points,conflict:e.conflict,cost:best.cost});
 }
 return paths.sort((a,b)=>a.fromId.localeCompare(b.fromId)||a.toId.localeCompare(b.toId));
}
function simplify(points){
 const out=[];
 for(const p of points){
  const last=out[out.length-1];if(last&&last.x===p.x&&last.y===p.y)continue;
  out.push({x:p.x,y:p.y});
  while(out.length>=3){const a=out[out.length-3],b=out[out.length-2],c=out[out.length-1];if((a.x===b.x&&b.x===c.x)||(a.y===b.y&&b.y===c.y))out.splice(out.length-2,1);else break}
 }
 return out;
}
// Rounded orthogonal polyline as an SVG path. Corners are quadratic curves whose
// radius shrinks on short segments, so a tight route never kinks or doubles back.
function roundedPath(points,radius=CORNER){
 if(!Array.isArray(points)||points.length<2||!points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)))return '';
 const f=n=>Math.round(n*100)/100;
 let d=`M ${f(points[0].x)} ${f(points[0].y)}`;
 for(let i=1;i<points.length-1;i++){
  const a=points[i-1],b=points[i],c=points[i+1];
  const l1=Math.hypot(b.x-a.x,b.y-a.y),l2=Math.hypot(c.x-b.x,c.y-b.y);
  const r=Math.min(radius,l1/2,l2/2);
  if(r<0.5){d+=` L ${f(b.x)} ${f(b.y)}`;continue}
  d+=` L ${f(b.x+(a.x-b.x)/l1*r)} ${f(b.y+(a.y-b.y)/l1*r)} Q ${f(b.x)} ${f(b.y)} ${f(b.x+(c.x-b.x)/l2*r)} ${f(b.y+(c.y-b.y)/l2*r)}`;
 }
 const last=points[points.length-1];
 return d+` L ${f(last.x)} ${f(last.y)}`;
}
function dependencyCurve(path){return path&&path.points?roundedPath(path.points):''}
// Where a link starts on its source bar, and the live route while it is dragged.
function connectorPoint(rows,from,dayWidth,sourceId,summaries){
 const row=rows.find(r=>r.kind==='task'&&r.task.id===sourceId);
 const box=barBox(row,from,dayWidth,summaries);if(!box)return null;
 // centre of the connector handle drawn inside the bar
 return {x:box.kind==='bar'?Math.max(box.left+LAYOUT.connectorWidth/2,box.right-LAYOUT.gripWidth-LAYOUT.connectorWidth/2):box.kind==='milestone'?box.right-12:box.right-2,y:row.center};
}
function linkGesturePoint(rows,from,dayWidth,sourceId,dx,dy,summaries){
 if(!Number.isFinite(dx)||!Number.isFinite(dy))return null;
 const start=connectorPoint(rows,from,dayWidth,sourceId,summaries);
 return start?{x:start.x+dx,y:start.y+dy}:null;
}
function linkPreviewPath(rows,from,dayWidth,sourceId,px,py,summaries){
 const row=rows.find(r=>r.kind==='task'&&r.task.id===sourceId),box=barBox(row,from,dayWidth,summaries);
 if(!box||!Number.isFinite(px)||!Number.isFinite(py))return null;
 const sx=box.outX,sy=row.center,mx=Math.max(sx+STUB_OUT,Math.min((sx+px)/2,px-STUB_IN));
 const points=simplify(px>=sx+STUB_OUT+STUB_IN?[{x:sx,y:sy},{x:mx,y:sy},{x:mx,y:py},{x:px,y:py}]:[{x:sx,y:sy},{x:sx+STUB_OUT,y:sy},{x:sx+STUB_OUT,y:py},{x:px,y:py}]);
 return {d:roundedPath(points),points};
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
 for(const root of byId.keys()){
  const stack=[[root,false]];
  while(stack.length){
   const [id,exit]=stack.pop();
   if(exit){visiting.delete(id);visited.add(id);order.push(id);continue;}
   if(visited.has(id))continue;
   if(visiting.has(id))throw Error('Circular dependency prevents critical path calculation');
   visiting.add(id);stack.push([id,true]);
   const deps=byId.get(id).dependsOn||[];
   for(let i=deps.length-1;i>=0;i--)if(byId.has(deps[i]))stack.push([deps[i],false]);
  }
 }
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
// Canvas-point hit test. The handle is dragged onto a visible successor bar;
// release over whitespace has no effect. Never infer a target from the row alone.
function linkTargetAt(rows,from,dayWidth,x,y,sourceId,summaries){
 if(!Number.isFinite(x)||!Number.isFinite(y))return null;
 for(const row of rows){
  if(row.kind!=='task'||row.task.id===sourceId||y<row.top+7||y>row.top+row.height-7)continue;
  const box=barBox(row,from,dayWidth,summaries);if(!box)continue;
  if(x>=box.left-12&&x<=box.right+12)return row.task.id;
 }
 return null;
}
module.exports={LAYOUT,STUB_OUT,STUB_IN,ARROW,LANE,barBox,roundedPath,linkPreviewPath,dayNumber,dateAt,span,calendarDomain,buildRows,hierarchyRows,hierarchySummaries,layoutRows,barGeometry,dependencyGeometry,dependencyConflicts,invalidSchedules,afterPredecessors,scheduleSample,criticalPath,linkTargetAt,dependencyCurve,connectorPoint,linkGesturePoint};
