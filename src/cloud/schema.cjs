// /src/cloud/schema.cjs
'use strict';
const model=require('../domain/model.cjs');
const SCHEMA=1;
const FIELDS=['tasks','boards','resources','timeEntries','comments','reminders','phases','releases','sprints','savedViews','automationCommands','automationHistory','automations','schemas','apiContracts','playbooks','changelog'];
const clone=x=>JSON.parse(JSON.stringify(x));
function stable(x){if(Array.isArray(x))return '['+x.map(stable).join(',')+']';if(x&&typeof x==='object')return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';return JSON.stringify(x);}
const equal=(a,b)=>stable(a)===stable(b);
function segment(x){if(typeof x!=='string'||!x||x.length>160||x==='.'||x==='..'||/[\x00-\x1f/]/.test(x))throw Error('Invalid resource ID');return x;}
const keyOf=(kind,projectId,id,boardId='')=>[kind,projectId,boardId,id].map(x=>encodeURIComponent(x).replace(/~/g,'%7E')).join('~');
function documentKey(value){if(typeof value!=='string'||!value||value.length>1300||value==='.'||value==='..'||/[\x00-\x1f/]/.test(value))throw Error('Invalid cloud document key');return value;}
function importRecords(records){return records.map(r=>{if(!Number.isFinite(r.order)||r.order<0||r.order>100000)throw Error('Invalid import record order');const safe=record(r.kind,r.projectId,r.id,r.data,r.order,r.boardId);if(safe.key!==r.key||r.deleted!==undefined&&typeof r.deleted!=='boolean')throw Error('Invalid import record envelope');return {...safe,...(r.deleted?{deleted:true}:{})};}).sort((a,b)=>a.key<b.key?-1:a.key>b.key?1:0);}
function assertJson(value,depth=0){
 if(depth>24)throw Error('Payload nesting exceeds limit');
 if(value===null||typeof value==='boolean')return;
 if(typeof value==='number'&&Number.isFinite(value))return;
 if(typeof value==='string'&&value.length<=100000)return;
 if(Array.isArray(value)&&value.length<=20000){value.forEach(x=>assertJson(x,depth+1));return;}
 if(value&&Object.getPrototypeOf(value)===Object.prototype&&Object.keys(value).length<=300){for(const [k,v] of Object.entries(value)){if(['__proto__','prototype','constructor'].includes(k))throw Error('Unsafe field');assertJson(v,depth+1);}return;}
 throw Error('Invalid or oversized JSON payload');
}
function record(kind,projectId,id,data,order=0,boardId=''){
 if(typeof kind!=='string'||!/^[-a-zA-Z.]{1,80}$/.test(kind))throw Error('Invalid record family');
 if(typeof id!=='string'||!id||id.length>400||/[\x00-\x1f/]/.test(id))throw Error('Invalid record ID');if(projectId)segment(projectId);if(boardId)segment(boardId);assertJson(data);
 if(require('../store/importFiles.cjs').tooBig(stable(data),400000))throw Error('Cloud record exceeds 400 KB; split content before syncing');
 return {key:documentKey(keyOf(kind,projectId,id,boardId)),kind,projectId,boardId,id,data:clone(data),order};
}
function pack(input){
 const w=model.normalizeWorkspace(input),out=[];
 for(const family of ['portfolios','programs'])w[family].forEach((v,i)=>out.push(record(family,'',v.id,v,i)));
 w.projects.forEach((p,pi)=>{
  const meta={...p};delete meta.canvases;
  for(const field of FIELDS){const values=p[field]||[];delete meta[field];values.forEach((v,i)=>out.push(record(field,p.id,v.id,v,i)));}
  const g={...p.governance},budget={...g.budget};for(const f of ['risks','wbs']){g[f].forEach((v,i)=>out.push(record('governance.'+f,p.id,v.id,v,i)));delete g[f];}
  budget.lines.forEach((v,i)=>out.push(record('governance.budget.lines',p.id,v.id,v,i)));delete budget.lines;g.budget=budget;
  for(const [id,v] of Object.entries(g.docs))out.push(record('governance.docs',p.id,id,v));delete g.docs;meta.governance=g;
  const scheduling={...meta.scheduling};(scheduling.links||[]).forEach((v,i)=>out.push(record('dependencies',p.id,v.predecessorId+'>'+v.successorId,v,i)));delete scheduling.links;meta.scheduling=scheduling;
  out.push(record('projects',p.id,p.id,meta,pi));
  p.canvases.forEach((b,bi)=>{const meta={...b};for(const f of ['objects','connectors','threads']){delete meta[f];b[f].forEach((v,i)=>out.push(record('canvas.'+f,p.id,v.id,v,i,b.id)));}out.push(record('canvases',p.id,b.id,meta,bi));});
 });
 if(new Set(out.map(r=>r.key)).size!==out.length)throw Error('Duplicate cloud record ID');
 return out;
}
function unpack(records,local={}){
 const live=records.filter(r=>!r.deleted).sort((a,b)=>a.order-b.order||(a.key<b.key?-1:a.key>b.key?1:0));
 const pick=(kind,p='',b='')=>live.filter(r=>r.kind===kind&&r.projectId===p&&r.boardId===b).map(r=>clone(r.data));
 const projects=live.filter(r=>r.kind==='projects').map(r=>{const p=clone(r.data);for(const f of FIELDS)p[f]=pick(f,p.id);
  p.governance={...p.governance,risks:pick('governance.risks',p.id),wbs:pick('governance.wbs',p.id),budget:{...p.governance.budget,lines:pick('governance.budget.lines',p.id)},docs:Object.fromEntries(live.filter(v=>v.kind==='governance.docs'&&v.projectId===p.id).map(v=>[v.id,clone(v.data)]))};
  p.scheduling={...p.scheduling,links:pick('dependencies',p.id)};
  p.canvases=pick('canvases',p.id).map(b=>({...b,objects:pick('canvas.objects',p.id,b.id),connectors:pick('canvas.connectors',p.id,b.id),threads:pick('canvas.threads',p.id,b.id)}));return p;
 });
 return model.normalizeWorkspace({schemaVersion:1,projects,portfolios:pick('portfolios'),programs:pick('programs'),selectedId:local.selectedId||projects[0]?.id,backups:local.backups||[],activity:local.activity||[],revision:local.revision||0});
}
function validateRecords(records){const safe=pack(unpack(records));const a=new Map(records.filter(r=>!r.deleted).map(r=>[r.key,r]));if(safe.length!==a.size||safe.some(r=>!a.has(r.key)||!equal(r.data,a.get(r.key).data)))throw Error('Cloud change violates the canonical workspace schema or references');return safe;}
function diff(before,after){const a=new Map(before.map(r=>[r.key,r])),b=new Map(after.map(r=>[r.key,r])),changes=[];for(const key of new Set([...a.keys(),...b.keys()])){const old=a.get(key),next=b.get(key);if(!old||!next||!equal(old.data,next.data)||old.order!==next.order)changes.push({key,before:old||null,after:next||null});}return changes;}
// Objects merge at their top-level fields. Arrays/text and structural fields are indivisible conflicts.
function mergeChange(current,change){
 const base=change.before,next=change.after;
 if(!base){if(current&&!current.deleted){if(equal(current.data,next.data)&&current.order===next.order)return current;throw Object.assign(Error('Concurrent creation'),{code:'conflict'});}return next;}
 if(!current||current.deleted)throw Object.assign(Error('Record was deleted'),{code:'conflict'});
 if(!next){if(!equal(base.data,current.data)||base.order!==current.order)throw Object.assign(Error('Delete conflicts with an edit'),{code:'conflict'});return {...current,deleted:true};}
 const data={...current.data};for(const field of new Set([...Object.keys(base.data),...Object.keys(next.data)])){
  if(equal(base.data[field],next.data[field]))continue;
  if(!equal(base.data[field],current.data[field])&&!equal(next.data[field],current.data[field]))throw Object.assign(Error('Concurrent change to '+field),{code:'conflict',field});
  if(Object.hasOwn(next.data,field))data[field]=clone(next.data[field]);else delete data[field];
 }
 if(base.order!==next.order&&base.order!==current.order&&next.order!==current.order)throw Object.assign(Error('Concurrent reorder'),{code:'conflict'});
 return {...next,data,order:base.order===next.order?current.order:next.order};
}
module.exports={SCHEMA,FIELDS,clone,stable,equal,segment,keyOf,documentKey,assertJson,record,pack,unpack,importRecords,validateRecords,diff,mergeChange};
