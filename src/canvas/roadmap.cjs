// /src/canvas/roadmap.cjs
'use strict';
const {parseDay}=require('../domain/calendar.cjs');
const DAY=86400000,WIDTH=960,LEFT=236,RIGHT=928;
const label=(x,y,s,size=13,fill='ink',anchor='start')=>({t:'text',x,y,s:String(s),size,fill,anchor,weight:'400',op:1});
const path=(d,stroke='muted',sw=1)=>({t:'path',d,stroke,sw});
const rect=(x,y,w,h,fill,stroke='muted',r=4)=>({t:'rect',x,y,w,h,fill,stroke,r,sw:1});
const clip=(s,n=26)=>String(s).length>n?String(s).slice(0,n-1)+'…':String(s);
function roadmapScene(data){
 const tasks=(data.tasks||[]).map(t=>{const start=parseDay(t.start||t.due),end=parseDay(t.due||t.start);return start&&end?{...t,from:start.getTime(),to:end.getTime()}:null;}).filter(Boolean),items=[rect(0,0,WIDTH,220,'surface'),label(24,32,data.title,18)];
 if(!tasks.length){items.push(label(24,88,'No scheduled work or milestones',14,'muted'));return {width:WIDTH,height:220,items};}
 const start=Math.min(...tasks.map(t=>t.from)),end=Math.max(...tasks.map(t=>t.to)),span=Math.max(DAY,end-start+DAY),at=time=>LEFT+(time-start)/span*(RIGHT-LEFT),date=time=>new Date(time).toISOString().slice(0,10),milestones=tasks.filter(t=>t.milestone).sort((a,b)=>a.to-b.to||a.id.localeCompare(b.id)),groups=new Map(),phases=Array.isArray(data.phases)?data.phases:[],names=new Map(phases.map(p=>[p.id,p.name]));
 for(const t of tasks)if(!t.milestone){const key=t.phaseId||'';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(t);}
 const phaseOrder=new Map(phases.map((p,i)=>[p.id,i])),rows=[...groups].sort((a,b)=>(phaseOrder.get(a[0])??phases.length)-(phaseOrder.get(b[0])??phases.length)),height=Math.max(220,144+rows.length*64+(milestones.length?32+milestones.length*52:0)+24);items[0]=rect(0,0,WIDTH,height,'surface');
 items.push(label(24,58,`${date(start)} → ${date(end)}`,12,'muted'),label(24,104,'Phase / milestone',12,'muted'),path(`M ${LEFT} 104 H ${RIGHT}`));
 const ticks=new Set();for(let i=0;i<=5;i++){const time=Math.min(end,start+Math.round((end-start)/DAY*i/5)*DAY),value=date(time);if(ticks.has(value))continue;ticks.add(value);const x=at(time+DAY/2);items.push(path(`M ${x} 98 V 110`),label(x,88,value,11,'muted','middle'));}
 rows.forEach(([id,list],i)=>{const y=144+i*64,first=Math.min(...list.map(t=>t.from)),last=Math.max(...list.map(t=>t.to)),done=list.filter(t=>t.status==='Done').length,x=at(first),w=Math.max(2,at(last+DAY)-x);items.push(label(24,y+16,clip(names.get(id)||'Project work')),label(24,y+36,`${done} of ${list.length} done`,11,'muted'),rect(x,y+2,w,24,'surfaceAlt'));if(done)items.push(rect(x,y+2,w*done/list.length,24,'#83D8B4','none'));});
 if(milestones.length){const top=144+rows.length*64;items.push(label(24,top+16,'Milestones',12,'muted'));milestones.forEach((t,i)=>{const y=top+44+i*52,x=at(t.to+DAY/2),color=t.status==='Done'?'#83D8B4':'accentText',marker=path(`M ${x} ${y-8} L ${x+8} ${y} L ${x} ${y+8} L ${x-8} ${y} L ${x} ${y-8}`,color,2);marker.milestoneId=t.id;items.push(label(24,y+4,clip(t.title||'Milestone')),path(`M ${LEFT} ${y} H ${RIGHT}`,'line'),marker,label(x,y+25,date(t.to),11,'muted','middle'));});}
 return {width:WIDTH,height,items};
}
module.exports={roadmapScene};
