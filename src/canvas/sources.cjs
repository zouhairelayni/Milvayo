// /src/canvas/sources.cjs
'use strict';
const {SOURCE_TYPES,projection}=require('../domain/canvas.cjs');
const unavailable=()=>({available:false,kind:'card',title:'Source unavailable',lines:['The source was removed or is outside this project'],revision:'unavailable'});
const stringify=value=>typeof value==='string'?value:JSON.stringify(value);
const stakeholderRows=project=>{const rows=project.governance.docs.stakeholders?.values?.register;return Array.isArray(rows)?rows.filter(r=>r&&typeof r.id==='string'&&typeof r.name==='string'):[];};
const taskFields=t=>({id:t.id,title:t.title,status:t.status,priority:t.priority,owner:t.owner,start:t.start||'',due:t.due||'',phaseId:t.phaseId||'',sprintId:t.sprintId||'',milestone:!!t.milestone});
function readSource(project,link){
 if(!project||project.archived||!link||link.projectId!==project.id||!SOURCE_TYPES.includes(link.sourceType))return unavailable();
 if(link.mode==='snapshot')return {...projection(link.snapshot),available:true,revision:link.revision,capturedAt:link.capturedAt,snapshot:true};
 let data;
 switch(link.sourceType){
  case 'taskDiagram':{if(link.sourceId!==project.id)return unavailable();if(project.tasks.length>499)return {...unavailable(),title:'Project diagram too large',lines:['Project diagrams support up to 499 tasks. Use a WBS diagram or roadmap for this project.']};data={kind:'diagram',title:project.name,nodes:[{id:'w0',parent:null,name:project.name,hours:0},...project.tasks.map(t=>({id:'task:'+t.id,parent:t.parentId?'task:'+t.parentId:'w0',name:t.title,hours:t.estimateHours||0}))],view:link.view,direction:link.direction,lines:[]};break;}
  case 'task':{const t=project.tasks.find(t=>t.id===link.sourceId);if(!t)return unavailable();data={kind:'card',title:t.title,lines:[`${t.status} · ${t.priority}`,t.owner||'Unassigned',`${t.start||'No start'} → ${t.due||'No due date'}`]};break;}
  case 'wbs':{
   const nodes=project.governance.wbs;const source=nodes.find(n=>n.id===link.sourceId);if(!source)return unavailable();
   if(link.sourceId==='w0')data={kind:'diagram',title:project.name,nodes:nodes.map(n=>({id:n.id,parent:n.parent,name:n.name,hours:n.hours})),view:link.view,direction:link.direction,lines:[]};
   else data={kind:'card',title:source.name,lines:[source.owner||'Unassigned',`${source.hours}h`,source.note||'No description']};break;
  }
  case 'risk':{if(link.sourceId==='register'){data={kind:'card',title:'Risk register',lines:project.governance.risks.length?project.governance.risks.map(r=>`${r.title} · Score ${r.prob*r.impact} · ${r.status}`):['No risks recorded']};break;}const r=project.governance.risks.find(r=>r.id===link.sourceId);if(!r)return unavailable();data={kind:'card',title:r.title,lines:[`${r.type} · ${r.status}`,`Probability ${r.prob} · Impact ${r.impact} · Score ${r.prob*r.impact}`,r.response||'No response recorded']};break;}
  case 'stakeholder':{const r=stakeholderRows(project).find(r=>r.id===link.sourceId);if(!r)return unavailable();data={kind:'card',title:r.name||'Unnamed stakeholder',lines:[r.role||'',`Influence ${r.influence||'Unspecified'} · Interest ${r.interest||'Unspecified'}`]};break;}
  case 'document':{const d=project.governance.docs[link.sourceId];if(!d)return unavailable();data={kind:'card',title:link.sourceId==='charter'?'Project charter':link.sourceId,lines:[d.status,...Object.entries(d.values).map(([key,value])=>`${key}: ${stringify(value)}`.slice(0,2000))]};break;}
  case 'sprint':{const s=project.sprints.find(s=>s.id===link.sourceId);if(!s)return unavailable();data={kind:'card',title:s.name,lines:[s.goal||'No goal',`${s.start} → ${s.end}`,s.state]};break;}
  case 'project':if(link.sourceId!==project.id)return unavailable();data={kind:'card',title:project.name,lines:[project.description,project.governance.info.phase]};break;
  case 'roadmap':{
   let tasks=project.tasks;
   if(link.scopeType==='phase')tasks=tasks.filter(t=>t.phaseId===link.scopeId);
   if(link.scopeType==='sprint')tasks=tasks.filter(t=>t.sprintId===link.scopeId);
   if(link.scopeType==='milestones')tasks=tasks.filter(t=>t.milestone);
   data={kind:'roadmap',title:`${project.name} roadmap`,tasks:tasks.filter(t=>t.start||t.due).map(taskFields),phases:project.phases.map(p=>({id:p.id,name:p.name})),lines:[]};break;
  }
 }
 return {...data,available:true,revision:JSON.stringify(data)};
}
function createSourceResolver(){
 const cache=new Map();let bytes=0;
 return {resolve(project,link){const value=readSource(project,link);if(!value.available)return value;const key=JSON.stringify([project.id,link.sourceType,link.sourceId,link.mode,link.view,link.direction,link.scopeType,link.scopeId,link.capturedAt]);const old=cache.get(key);
  if(old?.value.revision===value.revision){cache.delete(key);cache.set(key,old);return old.value;}
  if(old){bytes-=old.cost;cache.delete(key);}const cost=JSON.stringify(value).length*2;
  if(cost<=2*1024*1024){while(cache.size&&(cache.size>=128||bytes+cost>2*1024*1024)){const first=cache.keys().next().value;bytes-=cache.get(first).cost;cache.delete(first);}cache.set(key,{value,cost});bytes+=cost;}return value;
 },clear(){cache.clear();bytes=0;},stats:()=>({entries:cache.size,estimatedBytes:bytes})};
}
function captureSource(project,link,now){const data=readSource(project,{...link,mode:'live'});if(!data.available)throw Error('Source unavailable; cannot capture a snapshot');const {revision,available,...snapshot}=data;return {...link,mode:'snapshot',capturedAt:now,revision,snapshot};}
function sourceOptions(project){
 const link=(sourceType,sourceId,title)=>({title,sourceType,sourceId,projectId:project.id,mode:'live'});
 return [link('project',project.id,'Project details · '+project.name),link('wbs','w0','WBS diagram'),link('risk','register','Risk register'),link('roadmap',project.id,'Project roadmap'),link('roadmap',project.id,'Milestones roadmap')].map((o,i)=>i===4?{...o,scopeType:'milestones'}:o).concat(
  project.tasks.map(t=>link('task',t.id,t.title)),project.governance.risks.map(r=>link('risk',r.id,r.title)),
  stakeholderRows(project).map(s=>link('stakeholder',s.id,s.name||'Unnamed stakeholder')),
  Object.keys(project.governance.docs).map(id=>link('document',id,id)),project.sprints.map(s=>link('sprint',s.id,s.name)),
  project.phases.map(p=>({...link('roadmap',project.id,`${p.name} roadmap`),scopeType:'phase',scopeId:p.id})),
  project.sprints.map(s=>({...link('roadmap',project.id,`${s.name} roadmap`),scopeType:'sprint',scopeId:s.id})));
}
module.exports={readSource,createSourceResolver,captureSource,sourceOptions};
