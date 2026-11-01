'use strict';
// Bounded view selection: deterministic, React Native independent.
// Rendering only the visible strip avoids full-schedule native SVG allocation.
function clamp(n,a,b){return Math.min(b,Math.max(a,n))}
function visibleRows(rows,scrollY,height,overscan=180){
 if(!Array.isArray(rows)||!rows.length)return [];
 const low=Math.max(0,scrollY-overscan),high=scrollY+Math.max(0,height)+overscan;
 return rows.filter(r=>r.top+r.height>=low&&r.top<=high);
}
function visibleDays(count,dayWidth,scrollX,width,overscan=100){
 const n=Math.max(0,Math.floor(count));
 if(!n||!Number.isFinite(dayWidth)||dayWidth<=0)return {start:0,end:0};
 const start=clamp(Math.floor((Math.max(0,scrollX)-overscan)/dayWidth),0,n);
 const end=clamp(Math.ceil((Math.max(0,scrollX)+Math.max(0,width)+overscan)/dayWidth),start,n);
 return {start,end};
}
function visibleLinks(paths,scrollX,scrollY,width,height,overscan=75){
 const left=scrollX-overscan,right=scrollX+width+overscan,top=scrollY-overscan,bottom=scrollY+height+overscan;
 return paths.filter(p=>{
  const pts=p.points&&p.points.length?p.points:[{x:p.x1,y:p.y1},{x:p.x2,y:p.y2}];
  let xMin=Infinity,xMax=-Infinity,yMin=Infinity,yMax=-Infinity;
  for(const q of pts){if(q.x<xMin)xMin=q.x;if(q.x>xMax)xMax=q.x;if(q.y<yMin)yMin=q.y;if(q.y>yMax)yMax=q.y}
  return xMax>=left&&xMin<=right&&yMax>=top&&yMin<=bottom;
 });
}
module.exports={visibleRows,visibleDays,visibleLinks};
