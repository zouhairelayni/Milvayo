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
  const xMin=Math.min(p.x1,p.x2,p.elbow||p.x1),xMax=Math.max(p.x1,p.x2,p.elbow||p.x1);
  return xMax>=left&&xMin<=right&&Math.max(p.y1,p.y2)>=top&&Math.min(p.y1,p.y2)<=bottom;
 });
}
module.exports={visibleRows,visibleDays,visibleLinks};
