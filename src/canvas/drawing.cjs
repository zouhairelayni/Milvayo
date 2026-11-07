// /src/canvas/drawing.cjs
'use strict';
function distance2(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy,t=length?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/length)):0;return (p.x-a.x-dx*t)**2+(p.y-a.y-dy*t)**2;}
function touches(a,b,c,d,r){
 if(Math.max(a.x,b.x)+r<Math.min(c.x,d.x)||Math.min(a.x,b.x)-r>Math.max(c.x,d.x)||Math.max(a.y,b.y)+r<Math.min(c.y,d.y)||Math.min(a.y,b.y)-r>Math.max(c.y,d.y))return false;
 const cross=(p,q,v)=>(q.x-p.x)*(v.y-p.y)-(q.y-p.y)*(v.x-p.x),s1=cross(a,b,c),s2=cross(a,b,d),s3=cross(c,d,a),s4=cross(c,d,b);
 if(s1*s2<0&&s3*s4<0)return true;
 return Math.min(distance2(a,c,d),distance2(b,c,d),distance2(c,a,b),distance2(d,a,b))<=r*r;
}
function erasedStrokeIds(objects,path,radius){
 if(!path.length)return [];const left=Math.min(...path.map(p=>p.x))-radius,right=Math.max(...path.map(p=>p.x))+radius,top=Math.min(...path.map(p=>p.y))-radius,bottom=Math.max(...path.map(p=>p.y))+radius;
 return objects.filter(o=>{
  if(o.type!=='draw'||o.locked||!o.points.length)return false;
  const r=radius+(o.strokeWidth||2)/2;if(o.x+o.width+r<left||o.x-r>right||o.y+o.height+r<top||o.y-r>bottom)return false;
  for(let i=1;i<Math.max(2,path.length);i++)for(let j=1;j<Math.max(2,o.points.length);j++){
   const c=o.points[Math.min(j-1,o.points.length-1)],d=o.points[Math.min(j,o.points.length-1)];
   if(touches(path[i-1],path[Math.min(i,path.length-1)],{x:c.x+o.x,y:c.y+o.y},{x:d.x+o.x,y:d.y+o.y},r))return true;
  }return false;
 }).map(o=>o.id);
}
module.exports={erasedStrokeIds};
