// /src/canvas/interaction.cjs
'use strict';
const {routeConnector,styledPath,pathSamples}=require('./routing.cjs');
function worldPoint(x,y,pose){'worklet';return {x:(x-pose.x)/pose.scale,y:(y-pose.y)/pose.scale};}
function zoomAt(pose,factor,anchor,focal=anchor){'worklet';const scale=Math.max(.05,Math.min(4,pose.scale*factor)),ratio=scale/pose.scale;return {scale,x:focal.x-(anchor.x-pose.x)*ratio,y:focal.y-(anchor.y-pose.y)*ratio};}
function hitObject(objects,x,y,pose){'worklet';const point=worldPoint(x,y,pose);let hit=null,layer=-1;for(let i=0;i<objects.length;i++){const o=objects[i];if(o.zIndex>=layer&&point.x>=o.x&&point.x<=o.x+o.width&&point.y>=o.y&&point.y<=o.y+o.height){hit=o;layer=o.zIndex;}}return hit;}
function movingIds(objects,ids){'worklet';const out=[...ids];let grew=true;while(grew){grew=false;for(let i=0;i<objects.length;i++)if(out.indexOf(objects[i].groupId)>=0&&out.indexOf(objects[i].id)<0){out.push(objects[i].id);grew=true;}}return out;}
function resizeBox(o,dx,dy){
 'worklet';let width=Math.max(40,Math.min(20000,o.width+dx)),height=Math.max(32,Math.min(20000,o.height+dy));
 if(o.type==='diagram'||o.sourceLink&&(o.sourceLink.sourceType==='wbs'||o.sourceLink.sourceType==='taskDiagram')){const change=Math.abs(dx/o.width)>Math.abs(dy/o.height)?dx/o.width:dy/o.height,scale=Math.max(40/o.width,32/o.height,Math.min(20000/o.width,20000/o.height,1+change));width=o.width*scale;height=o.height*scale;}
 return {...o,width,height};
}
function previewBox(o,drag){'worklet';if(drag?.kind==='resize'&&drag.id===o.id)return resizeBox(o,drag.dx,drag.dy);if(drag?.kind!=='resize'&&drag&&drag.ids.indexOf(o.id)>=0)return {...o,x:o.x+drag.dx,y:o.y+drag.dy};return o;}
function hitResize(objects,selected,x,y,pose){'worklet';if(selected.length!==1)return null;const p=worldPoint(x,y,pose);for(let i=0;i<objects.length;i++){const o=objects[i];if(o.id===selected[0]&&!o.locked&&Math.hypot(p.x-o.x-o.width,p.y-o.y-o.height)<=22/pose.scale)return o;}return null;}
function hitConnect(objects,selected,x,y,pose){'worklet';if(selected.length!==1)return null;const p=worldPoint(x,y,pose);for(let i=0;i<objects.length;i++){const o=objects[i];if(o.id===selected[0]){const dots=[{x:o.x-20,y:o.y+o.height/2},{x:o.x+o.width+20,y:o.y+o.height/2},{x:o.x+o.width/2,y:o.y-20},{x:o.x+o.width/2,y:o.y+o.height+20}];for(let j=0;j<dots.length;j++)if(Math.hypot(p.x-dots[j].x,p.y-dots[j].y)<=22/pose.scale)return o;}}return null;}
function routedPoints(a,b,drag,objects=[]){'worklet';return routeConnector(previewBox(a,drag),previewBox(b,drag),objects.map(o=>previewBox(o,drag)));}
function endpoint(o,other,drag){'worklet';const points=routedPoints(o,other,drag,[o,other]);return points[0]||{x:o.x+o.width/2,y:o.y+o.height/2};}
function connectorPath(a,b,drag,style='curve',objects=[]){'worklet';const points=routedPoints(a,b,drag,objects);if(style==='elbow'){if(!points.length)return '';let d=`M ${points[0].x} ${points[0].y}`;for(let i=1;i<points.length;i++)d+=points[i].x===points[i-1].x?` V ${points[i].y}`:` H ${points[i].x}`;return d;}return styledPath(points,style,objects.map(o=>previewBox(o,drag)));}
// Worklet dependencies must be initialized before closures capture them.
function connectionPreview(objects,link){'worklet';if(!link)return '';let from=null,target=null;for(let i=0;i<objects.length;i++){if(objects[i].id===link.from)from=objects[i];if(objects[i].id===link.target)target=objects[i];}return from?connectorPath(from,target||{id:'',x:link.x,y:link.y,width:0,height:0},null,'curve',objects):'';}
function hitConnector(edges,objects,x,y,pose,tolerance=12,routes){
 'worklet';const point=worldPoint(x,y,pose),pad=tolerance/pose.scale;
 for(let i=edges.length-1;i>=0;i--){const edge=edges[i],cached=routes?.[i]?.id===edge.id?routes[i]:null,bounds=cached?.bounds;if(cached&&(!bounds||point.x<bounds.left-pad||point.x>bounds.right+pad||point.y<bounds.top-pad||point.y>bounds.bottom+pad))continue;let path=cached?.d;
  if(!cached){let a=null,b=null;for(let j=0;j<objects.length;j++){if(objects[j].id===edge.from)a=objects[j];if(objects[j].id===edge.to)b=objects[j];}if(!a||!b)continue;path=connectorPath(a,b,null,edge.style,objects);}const points=pathSamples(path);

  for(let j=1;j<points.length;j++){const last=points[j-1],next=points[j],dx=next.x-last.x,dy=next.y-last.y,length=dx*dx+dy*dy,r=length?Math.max(0,Math.min(1,((point.x-last.x)*dx+(point.y-last.y)*dy)/length)):0;if(Math.hypot(point.x-last.x-r*dx,point.y-last.y-r*dy)<=pad)return edge;}
 }return null;
}
function objectBounds(objects){if(!objects.length)return {x:0,y:0,width:640,height:400};const x=Math.min(...objects.map(o=>o.x))-24,y=Math.min(...objects.map(o=>o.y))-24;return {x,y,width:Math.max(...objects.map(o=>o.x+o.width))-x+24,height:Math.max(...objects.map(o=>o.y+o.height))-y+24};}
function fitPose(objects,viewport){const b=objectBounds(objects),scale=Math.max(.05,Math.min(1,(viewport.width-32)/b.width,(viewport.height-32)/b.height));return {scale,x:(viewport.width-b.width*scale)/2-b.x*scale,y:(viewport.height-b.height*scale)/2-b.y*scale};}
module.exports={worldPoint,zoomAt,hitObject,movingIds,endpoint,routedPoints,resizeBox,previewBox,hitResize,hitConnect,connectionPreview,connectorPath,hitConnector,objectBounds,fitPose};
