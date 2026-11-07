// /src/canvas/routing.cjs
'use strict';
// Canvas has free placement, unlike Timeline's fixed rows. Use its port/stub,
// clearance and bend-cost principles with a bounded search around actual boxes.
function ports(o){'worklet';return [{x:o.x,y:o.y+o.height/2,dx:-1,dy:0},{x:o.x+o.width/2,y:o.y,dx:0,dy:-1},{x:o.x+o.width,y:o.y+o.height/2,dx:1,dy:0},{x:o.x+o.width/2,y:o.y+o.height,dx:0,dy:1}];}
function facingPorts(a,b){'worklet';const dx=b.x+b.width/2-a.x-a.width/2,dy=b.y+b.height/2-a.y-a.height/2,horizontal=Math.abs(dx)>=Math.abs(dy),forward=horizontal?dx>=0:dy>=0;return horizontal?{p:{x:a.x+(forward?a.width:0),y:a.y+a.height/2},q:{x:b.x+(forward?0:b.width),y:b.y+b.height/2},horizontal,sign:forward?1:-1}:{p:{x:a.x+a.width/2,y:a.y+(forward?a.height:0)},q:{x:b.x+b.width/2,y:b.y+(forward?0:b.height)},horizontal,sign:forward?1:-1};}
function curvePath(a,b){'worklet';const {p,q,horizontal,sign}=facingPorts(a,b),reach=Math.max(24,Math.abs(horizontal?q.x-p.x:q.y-p.y)/2);return horizontal?`M ${p.x} ${p.y} C ${p.x+sign*reach} ${p.y}, ${q.x-sign*reach} ${q.y}, ${q.x} ${q.y}`:`M ${p.x} ${p.y} C ${p.x} ${p.y+sign*reach}, ${q.x} ${q.y-sign*reach}, ${q.x} ${q.y}`;}
function simplify(points){'worklet';const out=[];for(let i=0;i<points.length;i++){const p=points[i],last=out[out.length-1];if(last&&last.x===p.x&&last.y===p.y)continue;out.push({x:p.x,y:p.y});while(out.length>=3){const a=out[out.length-3],b=out[out.length-2],c=out[out.length-1];if(a.x===b.x&&b.x===c.x&&(b.y-a.y)*(c.y-b.y)>=0||a.y===b.y&&b.y===c.y&&(b.x-a.x)*(c.x-b.x)>=0)out.splice(out.length-2,1);else break;}}return out;}
function pathCost(points){'worklet';let cost=Math.max(0,points.length-2)*8;for(let i=1;i<points.length;i++)cost+=Math.abs(points[i].x-points[i-1].x)+Math.abs(points[i].y-points[i-1].y);return cost;}
function blocker(a,b,boxes){'worklet';for(let i=0;i<boxes.length;i++){const r=boxes[i];if(a.x===b.x?a.x>r.left&&a.x<r.right&&Math.max(a.y,b.y)>r.top&&Math.min(a.y,b.y)<r.bottom:a.y>r.top&&a.y<r.bottom&&Math.max(a.x,b.x)>r.left&&Math.min(a.x,b.x)<r.right)return r;}return null;}
function routeConnector(a,b,objects=[]){
 'worklet';const boxes=[];for(let i=0;i<objects.length;i++){const o=objects[i],end=o.id===a.id||o.id===b.id;if(!end&&(o.type==='frame'||o.type==='draw'))continue;const pad=end?0:8;boxes.push({left:o.x-pad,right:o.x+o.width+pad,top:o.y-pad,bottom:o.y+o.height+pad});}
 // Include endpoints even when callers supply only intervening obstacles.
 for(const o of [a,b])if(o.width&&o.height&&!objects.some(item=>item.id===o.id))boxes.push({left:o.x,right:o.x+o.width,top:o.y,bottom:o.y+o.height});
 const from=ports(a),to=ports(b),queue=[],seen=[];
 for(let i=0;i<4;i++)for(let j=0;j<4;j++){const p=from[i],q=to[j],s={x:p.x+p.dx*16,y:p.y+p.dy*16},t={x:q.x+q.dx*16,y:q.y+q.dy*16};let mid;
  if(p.dx&&q.dx){const x=(s.x+t.x)/2;mid=[{x,y:s.y},{x,y:t.y}];}else if(p.dy&&q.dy){const y=(s.y+t.y)/2;mid=[{x:s.x,y},{x:t.x,y}];}else mid=p.dx?[{x:t.x,y:s.y}]:[{x:s.x,y:t.y}];
  // Keep stubs during search so detours cannot change an endpoint's chosen face.
  const points=[{x:p.x,y:p.y},s,...mid,t,{x:q.x,y:q.y}];queue.push({points,cost:pathCost(simplify(points))});
 }
 // A bounded search keeps dense/imported boards from monopolizing the UI thread.
 for(let step=0;step<160&&queue.length;step++){
  let best=0;for(let i=1;i<queue.length;i++)if(queue[i].cost<queue[best].cost)best=i;const state=queue.splice(best,1)[0],points=state.points;let hit=null,index=0;
  for(let i=1;i<points.length;i++){if(points[i].x===points[i-1].x&&points[i].y===points[i-1].y)continue;hit=blocker(points[i-1],points[i],boxes);if(hit){index=i;break;}}
  if(!hit)return simplify(points);if(index===1||index===points.length-1||points.length>28)continue;
  const p=points[index-1],q=points[index],horizontal=p.y===q.y,channels=horizontal?[hit.top,hit.bottom]:[hit.left,hit.right];
  for(let j=0;j<2;j++){const value=channels[j],detour=horizontal?[{x:p.x,y:value},{x:q.x,y:value}]:[{x:value,y:p.y},{x:value,y:q.y}],next=[...points.slice(0,index),...detour,...points.slice(index)],key=next.map(n=>n.x+','+n.y).join(';');if(seen.indexOf(key)>=0)continue;seen.push(key);queue.push({points:next,cost:pathCost(simplify(next))});}
 }return [];
}
function routePath(points,style='curve'){
 'worklet';if(points.length<2)return '';let d=`M ${points[0].x} ${points[0].y}`;
 for(let i=1;i<points.length;i++){const b=points[i];if(style!=='curve'||i===points.length-1){d+=` L ${b.x} ${b.y}`;continue;}const a=points[i-1],c=points[i+1],l1=Math.hypot(b.x-a.x,b.y-a.y),l2=Math.hypot(c.x-b.x,c.y-b.y),r=Math.min(6,l1/2,l2/2);if(!r){d+=` L ${b.x} ${b.y}`;continue;}const enter={x:b.x+(a.x-b.x)*r/l1,y:b.y+(a.y-b.y)*r/l1},exit={x:b.x+(c.x-b.x)*r/l2,y:b.y+(c.y-b.y)*r/l2};d+=` L ${enter.x} ${enter.y} C ${b.x} ${b.y}, ${b.x} ${b.y}, ${exit.x} ${exit.y}`;
 }return d;
}
function curveClear(p,c1,c2,q,objects){
 'worklet';const pending=[{p,c1,c2,q,depth:0}];
 while(pending.length){const part=pending.pop(),a0=part.p,a1=part.c1,a2=part.c2,a3=part.q,left=Math.min(a0.x,a1.x,a2.x,a3.x),right=Math.max(a0.x,a1.x,a2.x,a3.x),top=Math.min(a0.y,a1.y,a2.y,a3.y),bottom=Math.max(a0.y,a1.y,a2.y,a3.y);let hit=false;
  for(let i=0;i<objects.length;i++){const o=objects[i];if(o.type==='frame'||o.type==='draw')continue;if(right>o.x&&left<o.x+o.width&&bottom>o.y&&top<o.y+o.height){hit=true;break;}}if(!hit)continue;if(part.depth===7)return false;
  const a={x:(a0.x+a1.x)/2,y:(a0.y+a1.y)/2},b={x:(a1.x+a2.x)/2,y:(a1.y+a2.y)/2},c={x:(a2.x+a3.x)/2,y:(a2.y+a3.y)/2},d={x:(a.x+b.x)/2,y:(a.y+b.y)/2},e={x:(b.x+c.x)/2,y:(b.y+c.y)/2},mid={x:(d.x+e.x)/2,y:(d.y+e.y)/2};pending.push({p:mid,c1:e,c2:c,q:a3,depth:part.depth+1},{p:a0,c1:a,c2:d,q:mid,depth:part.depth+1});
 }return true;
}
function styledPath(points,style,objects){
 'worklet';if(points.length<2)return '';const p=points[0],q=points[points.length-1],first=points[1],last=points[points.length-2];
 if(style==='straight'&&(first.x-p.x)*(q.x-p.x)+(first.y-p.y)*(q.y-p.y)>=0&&(q.x-last.x)*(q.x-p.x)+(q.y-last.y)*(q.y-p.y)>=0&&curveClear(p,{x:p.x+(q.x-p.x)/3,y:p.y+(q.y-p.y)/3},{x:p.x+(q.x-p.x)*2/3,y:p.y+(q.y-p.y)*2/3},q,objects))return `M ${p.x} ${p.y} L ${q.x} ${q.y}`;
 if(style==='curve'&&points.length===4){const horizontal=first.y===p.y&&last.y===q.y&&(first.x-p.x)*(q.x-last.x)>0,vertical=first.x===p.x&&last.x===q.x&&(first.y-p.y)*(q.y-last.y)>0;if(horizontal||vertical){const c1=horizontal?{x:first.x,y:p.y}:{x:p.x,y:first.y},c2=horizontal?{x:last.x,y:q.y}:{x:q.x,y:last.y};if(curveClear(p,c1,c2,q,objects))return `M ${p.x} ${p.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${q.x} ${q.y}`;}}
 return routePath(points,style);
}
function pathSamples(path){
 'worklet';const tokens=path.match(/[MLCHV]|-?\d*\.?\d+(?:e[+-]?\d+)?/g)||[],out=[];let x=0,y=0,index=0;
 while(index<tokens.length){const kind=tokens[index++];if(kind==='M'||kind==='L'){x=Number(tokens[index++]);y=Number(tokens[index++]);out.push({x,y});}else if(kind==='H'){x=Number(tokens[index++]);out.push({x,y});}else if(kind==='V'){y=Number(tokens[index++]);out.push({x,y});}else if(kind==='C'){const x1=Number(tokens[index++]),y1=Number(tokens[index++]),x2=Number(tokens[index++]),y2=Number(tokens[index++]),ex=Number(tokens[index++]),ey=Number(tokens[index++]),sx=x,sy=y;for(let i=1;i<=96;i++){const t=i/96,u=1-t;out.push({x:u*u*u*sx+3*u*u*t*x1+3*u*t*t*x2+t*t*t*ex,y:u*u*u*sy+3*u*u*t*y1+3*u*t*t*y2+t*t*t*ey});}x=ex;y=ey;}else break;
 }return out;
}
function pathLabel(path){
 'worklet';const points=pathSamples(path);if(!points.length)return {x:0,y:0};let length=0;for(let i=1;i<points.length;i++)length+=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);let remaining=length/2;
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],distance=Math.hypot(b.x-a.x,b.y-a.y);if(distance>=remaining){const t=distance?remaining/distance:0;return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t-6};}remaining-=distance;}return points[0];
}
function pathBounds(path){'worklet';const points=pathSamples(path);if(!points.length)return null;let left=points[0].x,right=left,top=points[0].y,bottom=top;for(let i=1;i<points.length;i++){left=Math.min(left,points[i].x);right=Math.max(right,points[i].x);top=Math.min(top,points[i].y);bottom=Math.max(bottom,points[i].y);}return {left,right,top,bottom};}
function routeAffected(from,to,drag,bounds){
 'worklet';if(!drag)return false;if(drag.ids.indexOf(from)>=0||drag.ids.indexOf(to)>=0||!bounds||!drag.boxes)return true;
 for(let i=0;i<drag.boxes.length;i++){const o=drag.boxes[i],left=drag.kind==='resize'?o.x:Math.min(o.x,o.x+drag.dx),top=drag.kind==='resize'?o.y:Math.min(o.y,o.y+drag.dy),right=Math.max(o.x+o.width,o.x+o.width+drag.dx),bottom=Math.max(o.y+o.height,o.y+o.height+drag.dy);if(right+24>=bounds.left&&left-24<=bounds.right&&bottom+24>=bounds.top&&top-24<=bounds.bottom)return true;}return false;
}
module.exports={ports,facingPorts,curvePath,routeConnector,routePath,styledPath,pathSamples,pathLabel,pathBounds,routeAffected};
