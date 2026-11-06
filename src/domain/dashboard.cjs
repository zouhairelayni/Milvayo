// /src/domain/dashboard.cjs
'use strict';
const DAY=86400000;
const finite=v=>Number.isFinite(Number(v))?Math.min(1e12,Math.max(0,Number(v))):0;
function dayNumber(iso){if(!/^\d{4}-\d{2}-\d{2}$/.test(iso||''))return null;const ms=Date.parse(iso+'T12:00:00Z');return Number.isFinite(ms)&&new Date(ms).toISOString().slice(0,10)===iso?ms:null;}
// A schedule distribution, not a reconstructed completion history. Done counts describe tasks due on that date.
const WEEKDAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
function scheduleSeries(tasks,today,count=7){
 const base=dayNumber(today);if(base===null)return[];
 const rows=Array.from({length:Math.max(1,Math.min(31,count))},(_,i)=>{const day=new Date(base+i*DAY);return {date:day.toISOString().slice(0,10),label:WEEKDAYS[day.getUTCDay()],value:0,done:0,ids:[]};});
 const byDate=new Map(rows.map(row=>[row.date,row]));
 for(const task of tasks){const row=byDate.get(task.due);if(row){row.value++;if(task.status==='Done')row.done++;row.ids.push(task.id);}}
 return rows;
}
function statusSeries(tasks){return ['Backlog','In progress','Validation','Done'].map(label=>({label,value:tasks.filter(t=>t.status===label).length}));}
function pointsFor(values,width=300,height=160,pad=12){const clean=values.map(finite),max=Math.max(1,...clean),w=Math.max(pad*2+1,finite(width)),h=Math.max(pad*2+1,finite(height));return clean.map((v,i)=>({x:pad+(clean.length===1?.5:i/Math.max(1,clean.length-1))*(w-pad*2),y:h-pad-v/max*(h-pad*2),value:v}));}
function linePath(points){return points.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');}
function radialSegments(values,r=64,gap=5){const total=values.reduce((n,v)=>n+finite(v),0),length=2*Math.PI*r;let offset=0;return values.map(v=>{const share=total?finite(v)/total:0,full=share*length,seg={length:Math.max(0,full-Math.min(gap,full*.2)),offset,share};offset+=full;return seg;});}
module.exports={scheduleSeries,statusSeries,pointsFor,linePath,radialSegments,dayNumber};
