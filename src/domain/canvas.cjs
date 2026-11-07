// /src/domain/canvas.cjs
'use strict';
const {tooBig}=require('../store/importFiles.cjs');
const {validateWbs}=require('./governanceCore.cjs');
const {validDay}=require('./calendar.cjs');
const validatedBoards=new WeakSet(),validatedObjects=new WeakSet();
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const VERSION=1, LOCAL_OWNER='local-device', MAX_BYTES=2*1024*1024;
const TYPES=['note','text','shape','card','frame','diagram','linked','draw'];
const SOURCE_TYPES=['task','wbs','risk','stakeholder','document','roadmap','sprint','project','taskDiagram'];
const plain=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
function list(x,max,label){if(!Array.isArray(x)||x.length>max)throw Error(`Invalid ${label} (maximum ${max})`);return x;}
function text(x,max,label,required=false){if(typeof x!=='string'||x.length>max||(required&&!x.trim()))throw Error(`Invalid ${label}`);return x;}
function number(x,min,max,label){if(!Number.isFinite(x)||x<min||x>max)throw Error(`Invalid ${label}`);return x;}
const key=x=>text(x,120,'Canvas ID',true);
const stamp=x=>{if(typeof x!=='string'||!/^\d{4}-\d\d-\d\dT/.test(x)||!Number.isFinite(Date.parse(x)))throw Error('Invalid Canvas timestamp');return x;};
const unique=(items,label)=>{if(new Set(items.map(x=>x.id)).size!==items.length)throw Error(`Duplicate ${label} ID`);};
const copy=x=>JSON.parse(JSON.stringify(x));
function viewport(v){if(!plain(v))throw Error('Invalid Canvas viewport');return {x:number(v.x,-1e7,1e7,'viewport x'),y:number(v.y,-1e7,1e7,'viewport y'),scale:number(v.scale,.05,4,'viewport scale')};}
function sourceLink(s,projectId){
 if(!plain(s)||!SOURCE_TYPES.includes(s.sourceType)||!['live','snapshot'].includes(s.mode)||s.projectId!==projectId)throw Error('Invalid or cross-project Canvas source');
 const out={sourceType:s.sourceType,sourceId:key(s.sourceId),projectId,mode:s.mode,view:['tree','fishbone','mind'].includes(s.view)?s.view:'tree',direction:s.direction==='right'?'right':'down',scopeType:['project','phase','sprint','milestones'].includes(s.scopeType)?s.scopeType:'project',scopeId:typeof s.scopeId==='string'?text(s.scopeId,120,'source scope'):''};
 if(s.mode==='snapshot'){
  out.originProjectId=key(s.originProjectId||s.projectId);out.capturedAt=stamp(s.capturedAt);out.snapshot=projection(s.snapshot);out.revision=text(s.revision||'',MAX_BYTES,'snapshot revision');
 }
 return out;
}
function projection(p){
 if(!plain(p)||!['card','diagram','roadmap'].includes(p.kind))throw Error('Invalid Canvas snapshot');
 const safe=copy(p);if(tooBig(JSON.stringify(safe),MAX_BYTES/2))throw Error('Canvas snapshot too large');
 // Snapshots are typed plain data. Imported SVG/HTML/scripts are never rendered.
 safe.lines=list(safe.lines??[],1000,'snapshot lines');safe.title=text(safe.title??'',300,'snapshot title');
 for(const row of safe.lines)text(row,2000,'snapshot text');
 text(safe.title||'',300,'snapshot title');
 if(safe.kind==='diagram'){safe.nodes=list(safe.nodes,501,'diagram nodes').map(n=>({id:text(n.id,200,'diagram node ID',true),parent:n.parent===null?null:text(n.parent,200,'diagram parent ID',true),name:text(n.name,300,'snapshot node name'),hours:number(n.hours??0,0,1e9,'snapshot hours')}));if(!safe.nodes.some(n=>n.id==='w0'&&n.parent===null))throw Error('Missing diagram root');validateWbs(safe.nodes);}
 if(safe.kind==='roadmap')list(safe.tasks,1000,'roadmap tasks').forEach(t=>{key(t.id);text(t.title,300,'roadmap title');for(const f of ['start','due'])if(t[f]&&!validDay(t[f]))throw Error('Invalid roadmap date');if(t.start&&t.due&&t.due<t.start)throw Error('Invalid roadmap date range');});
 return safe;
}
function object(raw,boardId,projectId){
 if(validatedObjects.has(raw)&&raw.boardId===boardId&&(!raw.sourceLink||raw.sourceLink.projectId===projectId))return raw;
 if(!plain(raw)||!TYPES.includes(raw.type)||raw.boardId!==boardId)throw Error('Invalid Canvas object');
 const result={id:key(raw.id),boardId,type:raw.type,x:number(raw.x,-1e6,1e6,'object x'),y:number(raw.y,-1e6,1e6,'object y'),width:number(raw.width,40,20000,'object width'),height:number(raw.height,32,20000,'object height'),zIndex:number(raw.zIndex,0,100000,'layer'),locked:raw.locked===true,groupId:raw.groupId?key(raw.groupId):'',text:text(raw.text||'',12000,'object text'),color:raw.color&&/^#[0-9a-fA-F]{6}$/.test(raw.color)?raw.color:'',createdAt:stamp(raw.createdAt),updatedAt:stamp(raw.updatedAt)};
 if(raw.type==='linked'){result.sourceLink=sourceLink(raw.sourceLink,projectId);}
 if(raw.type==='diagram'){
  result.diagramType=['tree','fishbone','mind'].includes(raw.diagramType)?raw.diagramType:'tree';result.direction=raw.direction==='right'?'right':'down';
  result.nodes=list(raw.nodes,500,'diagram nodes').map(n=>({id:text(n.id,200,'diagram node ID',true),parent:n.parent===null?null:text(n.parent,200,'diagram parent ID',true),name:text(n.name,300,'diagram name'),hours:0}));if(!result.nodes.some(n=>n.id==='w0'&&n.parent===null))throw Error('Missing diagram root');validateWbs(result.nodes);
 }
 if(raw.type==='draw'){result.strokeWidth=number(raw.strokeWidth??2,1,48,'brush width');result.points=list(raw.points,2000,'drawing points').map(p=>({x:number(p.x,-20000,20000,'point x'),y:number(p.y,-20000,20000,'point y')}));}
 freeze(result);validatedObjects.add(result);return result;
}
function normalizeBoard(raw,projectId){
 if(validatedBoards.has(raw)&&raw.projectId===projectId)return raw;
 if(!plain(raw)||raw.schemaVersion!==VERSION)throw Error('Unsupported Canvas schema; keep a backup and use a compatible release');
 if(raw.projectId!==projectId||raw.ownerId!==LOCAL_OWNER||(raw.grants||[]).length)throw Error('Canvas is local/private; authenticated sharing is unavailable');
 const board={id:key(raw.id),projectId,ownerId:LOCAL_OWNER,schemaVersion:VERSION,title:text(raw.title,180,'board title',true),revision:number(raw.revision,0,1e9,'board revision'),createdAt:stamp(raw.createdAt),updatedAt:stamp(raw.updatedAt),archivedAt:raw.archivedAt?stamp(raw.archivedAt):null,viewport:viewport(raw.viewport),objects:[],connectors:[],threads:[],grants:[]};
 board.objects=list(raw.objects,1000,'Canvas objects').map(o=>object(o,board.id,projectId));unique(board.objects,'object');
 const ids=new Set(board.objects.map(o=>o.id));
 board.objects.forEach(o=>{if(o.groupId&&(!ids.has(o.groupId)||o.groupId===o.id||board.objects.find(x=>x.id===o.groupId).type!=='frame'))throw Error('Missing Canvas frame');});
 for(const o of board.objects){let at=o;const seen=new Set();while(at.groupId){if(seen.has(at.id))throw Error('Circular Canvas group');seen.add(at.id);at=board.objects.find(x=>x.id===at.groupId);}}
 board.connectors=list(raw.connectors,2000,'Canvas connectors').map(e=>{if(!ids.has(e.from)||!ids.has(e.to)||e.from===e.to)throw Error('Missing Canvas connector endpoint');return {id:key(e.id),from:e.from,to:e.to,label:text(e.label||'',200,'connection label'),style:['curve','straight','elbow'].includes(e.style)?e.style:'curve',arrow:e.arrow!==false};});unique(board.connectors,'connector');
 board.threads=list(raw.threads,1000,'Canvas comments').map(t=>{
  if(t.objectId&&!ids.has(t.objectId))throw Error('Missing comment anchor');
  return {id:key(t.id),objectId:t.objectId||'',x:number(t.x??0,-1e6,1e6,'comment x'),y:number(t.y??0,-1e6,1e6,'comment y'),resolvedAt:t.resolvedAt?stamp(t.resolvedAt):null,messages:list(t.messages,100,'comment replies').map(m=>({id:key(m.id),authorId:LOCAL_OWNER,text:text(m.text,4000,'comment',true),at:stamp(m.at)}))};
 });unique(board.threads,'thread');board.threads.forEach(t=>unique(t.messages,'message'));
 if(tooBig(JSON.stringify(board),MAX_BYTES))throw Error('Canvas board exceeds 2 MB; split the board before saving');
 if(!Number.isInteger(board.revision))throw Error('Invalid Canvas revision');
 freeze(board);validatedBoards.add(board);return board;
}
function normalizeBoards(raw,projectId){const all=list(raw??[],50,'Canvas boards').map(b=>normalizeBoard(b,projectId));unique(all,'board');return all;}
function createBoard({id,projectId,title='Untitled canvas',now}){return normalizeBoard({id,projectId,title,ownerId:LOCAL_OWNER,schemaVersion:1,revision:0,createdAt:now,updatedAt:now,archivedAt:null,viewport:{x:32,y:32,scale:1},objects:[],connectors:[],threads:[]},projectId);}
function createObject({id,boardId,type='note',x=0,y=0,text:body='',now,...extra}){return {id,boardId,type,x,y,width:240,height:144,zIndex:0,locked:false,groupId:'',text:body,createdAt:now,updatedAt:now,...extra};}
function assertAccess(board,projectId,actor=LOCAL_OWNER){if(board.projectId!==projectId||board.ownerId!==actor||actor!==LOCAL_OWNER)throw Error('Canvas access unavailable');}
function changeBoard(board,command,now,actor=LOCAL_OWNER){
 assertAccess(board,board.projectId,actor);let next={...board,objects:board.objects,connectors:board.connectors,threads:board.threads};
 const chosen=new Set(command.ids||[]),find=id=>{const value=board.objects.find(o=>o.id===id);if(!value)throw Error('Canvas object missing');return value;};
 const editable=id=>{const value=find(id);if(value.locked)throw Error('Unlock the object before editing');return value;};
 switch(command.type){
  case 'add':next.objects=[...board.objects,...command.objects];break;
  case 'patch':{const old=editable(command.id),patch={...command.patch};if(old.type==='draw'&&('width' in patch||'height' in patch)&&!('points' in patch))patch.points=old.points.map(p=>({x:p.x*(patch.width??old.width)/old.width,y:p.y*(patch.height??old.height)/old.height}));next.objects=board.objects.map(o=>o.id===command.id?{...o,...patch,id:o.id,boardId:board.id,type:o.type,createdAt:o.createdAt,updatedAt:now}:o);break;}
  case 'lock':find(command.id);next.objects=board.objects.map(o=>o.id===command.id?{...o,locked:command.locked===true,updatedAt:now}:o);break;
  case 'move':{
   chosen.forEach(editable);let grew=true;while(grew){grew=false;board.objects.forEach(o=>{if(chosen.has(o.groupId)&&!chosen.has(o.id)){chosen.add(o.id);grew=true;}});}chosen.forEach(editable);
   next.objects=board.objects.map(o=>chosen.has(o.id)?{...o,x:o.x+command.dx,y:o.y+command.dy,updatedAt:now}:o);break;
  }
  case 'remove':{
   chosen.forEach(editable);next.objects=board.objects.filter(o=>!chosen.has(o.id)).map(o=>chosen.has(o.groupId)?{...o,groupId:''}:o);
   next.connectors=board.connectors.filter(e=>!chosen.has(e.from)&&!chosen.has(e.to));next.threads=board.threads.filter(t=>!chosen.has(t.objectId));break;
  }
  case 'connect':find(command.edge.from);find(command.edge.to);next.connectors=[...board.connectors,command.edge];break;
  case 'editConnector':if(!board.connectors.some(e=>e.id===command.id))throw Error('Canvas connector missing');next.connectors=board.connectors.map(e=>e.id===command.id?{...e,...command.patch,id:e.id,from:e.from,to:e.to}:e);break;
  case 'disconnect':next.connectors=board.connectors.filter(e=>e.id!==command.id);break;
  case 'thread':if(command.thread.objectId)find(command.thread.objectId);next.threads=[command.thread,...board.threads];break;
  case 'reply':case 'resolve':{
   if(!board.threads.some(t=>t.id===command.id))throw Error('Canvas thread missing');
   next.threads=board.threads.map(t=>t.id!==command.id?t:command.type==='reply'?{...t,messages:[...t.messages,command.message]}:{...t,resolvedAt:command.resolved?now:null});break;
  }
  case 'rename':next.title=command.title;break;
  case 'archive':next.archivedAt=command.archived?now:null;break;
  case 'restore':next={...next,...copy(command.content)};break;
  default:throw Error('Unknown Canvas command');
 }
 return normalizeBoard({...next,id:board.id,projectId:board.projectId,ownerId:board.ownerId,createdAt:board.createdAt,revision:board.revision+1,updatedAt:now},board.projectId);
}
function contentOf(board){return copy({title:board.title,objects:board.objects,connectors:board.connectors,threads:board.threads});}
function saveBoard(project,board,expectedRevision){
 assertAccess(board,project.id);const old=(project.canvases||[]).find(b=>b.id===board.id);
 if(old?(old.revision!==expectedRevision||board.revision!==expectedRevision+1):(expectedRevision!==null||board.revision!==0))throw Error('Canvas changed; reopen it before overwriting newer work');
 const safe=normalizeBoard(board,project.id);return {...project,canvases:normalizeBoards(old?project.canvases.map(b=>b.id===board.id?safe:b):[...(project.canvases||[]),safe],project.id)};
}
function saveViewport(project,id,pose,expectedRevision){
 const board=(project.canvases||[]).find(b=>b.id===id);if(!board||board.revision!==expectedRevision)throw Error('Canvas changed; viewport was not saved');assertAccess(board,project.id);
 const next=normalizeBoard({...board,viewport:viewport(pose)},project.id);return {...project,canvases:project.canvases.map(b=>b.id===id?next:b)};
}
function deleteBoard(project,id,expectedRevision){const board=(project.canvases||[]).find(b=>b.id===id);if(!board||board.revision!==expectedRevision)throw Error('Canvas changed');assertAccess(board,project.id);if(!board.archivedAt)throw Error('Archive the Canvas before deleting it');return {...project,canvases:project.canvases.filter(b=>b.id!==id)};}
function duplicateBoard(board,{id,projectId=board.projectId,now,nextId}){
 const safe=normalizeBoard(board,board.projectId);if(projectId!==board.projectId&&safe.objects.some(o=>o.sourceLink?.mode==='live'))throw Error('Live links belong to another project; create snapshots before cross-project import');
 const ids=new Map(safe.objects.map(o=>[o.id,nextId()]));
 return normalizeBoard({...safe,id,projectId,title:`${safe.title} copy`.slice(0,180),revision:0,ownerId:LOCAL_OWNER,createdAt:now,updatedAt:now,archivedAt:null,objects:safe.objects.map(o=>({...o,id:ids.get(o.id),boardId:id,groupId:ids.get(o.groupId)||'',...(o.sourceLink?{sourceLink:{...o.sourceLink,...(o.sourceLink.mode==='snapshot'?{originProjectId:o.sourceLink.originProjectId||o.sourceLink.projectId}:{}),projectId}}:{})})),connectors:safe.connectors.map(e=>({...e,id:nextId(),from:ids.get(e.from),to:ids.get(e.to)})),threads:safe.threads.map(t=>({...t,id:nextId(),objectId:ids.get(t.objectId)||'',messages:t.messages.map(m=>({...m,id:nextId()}))}))},projectId);
}
function selectionBoard(board,ids){
 const selected=new Set(ids);let grew=true;while(grew){grew=false;for(const o of board.objects)if(selected.has(o.groupId)&&!selected.has(o.id)){selected.add(o.id);grew=true;}}
 return normalizeBoard({...board,objects:board.objects.filter(o=>selected.has(o.id)).map(o=>({...o,groupId:selected.has(o.groupId)?o.groupId:''})),connectors:board.connectors.filter(e=>selected.has(e.from)&&selected.has(e.to)),threads:board.threads.filter(t=>selected.has(t.objectId))},board.projectId);
}
function exportBoard(board){return JSON.stringify({format:'milvayo.canvas.v1',board:normalizeBoard(board,board.projectId)});}
function importBoard(text,options){if(typeof text!=='string'||tooBig(text,MAX_BYTES+10000))throw Error('Canvas import exceeds 2 MB');const raw=JSON.parse(text.replace(/^\uFEFF/,''));if(raw.format!=='milvayo.canvas.v1')throw Error('Unsupported Canvas backup');return duplicateBoard(raw.board,options);}
module.exports={VERSION,LOCAL_OWNER,MAX_BYTES,TYPES,SOURCE_TYPES,normalizeBoard,normalizeBoards,createBoard,createObject,assertAccess,changeBoard,contentOf,saveBoard,saveViewport,deleteBoard,duplicateBoard,exportBoard,importBoard,selectionBoard,viewport,projection};
