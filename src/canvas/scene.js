// /src/canvas/scene.js
import { buildTree, flattenTree } from '../governance/pm';
const {pathLabel}=require('./routing.cjs');
const { sceneFor } = require('../governance/diagramScene.cjs');
const { diagramCache, diagramRevision } = require('../governance/diagramCache.cjs');
const { createSourceResolver } = require('./sources.cjs');
const { objectBounds, connectorPath } = require('./interaction.cjs');
const resolver = createSourceResolver();
const objectScenes = new WeakMap();
const rect=(x,y,w,h,fill='surface',stroke='muted',r=12)=>({t:'rect',x,y,w,h,fill,stroke,r,sw:1});
const line=(x,y,s,size=14,fill='ink',weight='400')=>({t:'text',x,y,s:String(s),size,fill,weight,anchor:'start',op:1});
function wrapped(value,max){return String(value).split('\n').flatMap(row=>{const out=[];while(row.length>max){let at=row.lastIndexOf(' ',max);if(at<max/2)at=max;out.push(row.slice(0,at));row=row.slice(at).trimStart();}return [...out,row];});}
function diagram(nodes,title,kind,dir,scope){
 const revision=diagramRevision(nodes,title),key=kind==='tree'&&dir==='down'?revision.full:revision.structure;
 const {tree}=diagramCache.get([scope,'hierarchy',revision.full],()=>{const tree=buildTree(nodes,title);return {tree,rows:flattenTree(tree)};},value=>value.rows.length*768).value;
 return diagramCache.get([scope,kind,key,kind==='tree'?dir:''],()=>sceneFor(kind,tree,dir),value=>value.items.length*1024+JSON.stringify(value).length*2).value;
}
function inkFor(color){if(!color)return 'ink';const n=parseInt(color.slice(1),16),light=((n>>16)*.299+((n>>8)&255)*.587+(n&255)*.114)>145;return light?'#172331':'#FFFFFF';}
export function objectScene(object,project,scope){
 const source=object.type==='linked'?resolver.resolve(project,object.sourceLink):null;
 const signature=source?.revision||'';const old=objectScenes.get(object);
 if(old?.scope===scope&&old.signature===signature)return old.value;
 let scene;
 if(object.type==='diagram'||source?.kind==='diagram'){
  scene=object.type==='diagram'?diagram(object.nodes,object.text||'Brainstorm',object.diagramType,object.direction,`canvas:${scope}:${object.id}`):diagram(source.nodes,source.title,object.sourceLink.view,object.sourceLink.direction,scope);
 }else if(source?.kind==='roadmap'){
  const tasks=source.tasks,dates=tasks.flatMap(t=>[t.start,t.due].filter(Boolean)).sort(),start=dates[0],end=dates.at(-1),span=start?Math.max(1,(Date.parse(end)-Date.parse(start))/86400000+1):1;
  const items=[rect(0,0,800,Math.max(160,80+tasks.length*44)),line(20,28,source.title,18,'ink','600'),line(20,52,`${start||'No scheduled tasks'}${end?' → '+end:''}`,12,'muted')];
  tasks.forEach((t,i)=>{const x=220+((Date.parse(t.start||t.due)-Date.parse(start))/86400000)/span*540,w=Math.max(8,((Date.parse(t.due||t.start)-Date.parse(t.start||t.due))/86400000+1)/span*540),y=76+i*44;items.push(line(20,y+17,t.title.length>25?t.title.slice(0,24)+'…':t.title,12),rect(x,y,w,24,t.status==='Done'?'#2F9E6B':'surface','muted',4),line(x+4,y+16,t.milestone?'◆':'',11));});
  scene={width:800,height:Math.max(160,80+tasks.length*44),items};
 }else if(object.type==='draw'){
  scene={width:object.width,height:object.height,items:object.points.length?[{t:'path',d:object.points.map((p,i)=>`${i?'L':'M'} ${p.x} ${p.y}`).join(' '),stroke:object.color||'ink',sw:object.strokeWidth||2}]:[]};
 }else{
  const width=object.width,height=object.height,fill=object.type==='frame'?'none':object.color||'surface',ink=object.type==='frame'||object.type==='text'?'ink':inkFor(object.color),max=Math.max(6,Math.floor((width-32)/7.8));
  const lines=wrapped(source?source.title:object.text,max),items=object.type==='text'?[]:[rect(0,0,width,height,fill,source&&!source.available?'danger':'muted',object.type==='shape'?4:12)];
  const limit=Math.max(1,Math.floor((height-40)/22));
  lines.slice(0,limit).forEach((s,i)=>items.push(line(16,28+i*22,s+(i===limit-1&&lines.length>limit?'…':''),object.type==='text'?16:14,ink,i===0?'500':'400')));
  if(source){const meta=object.sourceLink.mode==='snapshot'?`Snapshot · ${object.sourceLink.capturedAt.slice(0,10)}`:'Live project link';items.push(line(16,height-12,meta,10,object.color?ink:'muted'));source.lines.slice(0,Math.max(0,limit-lines.length-1)).forEach((s,i)=>items.push(line(16,28+(lines.length+i+1)*22,s.length>max?s.slice(0,max-1)+'…':s,12,ink)));}
  scene={width,height,items};
 }
 const value={scene,source,scale:Math.min(object.width/scene.width,object.height/scene.height)};objectScenes.set(object,{scope,signature,value});return value;
}
function transformItem(item,x,y,scale){
 return item.t==='rect'?{...item,x:x+item.x*scale,y:y+item.y*scale,w:item.w*scale,h:item.h*scale,r:item.r*scale,sw:item.sw*scale}:{...item,x:x+item.x*scale,y:y+item.y*scale,size:item.size*scale};
}
// Flatten only for explicit complete-board export, with path translations resolved structurally.
export function exportScene(board,project,scope){
 const bounds=objectBounds(board.objects),items=[],byId=new Map(board.objects.map(o=>[o.id,o])),shifted=board.objects.map(o=>({...o,x:o.x-bounds.x,y:o.y-bounds.y}));
 for(const edge of board.connectors){const a=byId.get(edge.from),b=byId.get(edge.to);if(a&&b){const d=connectorPath({...a,x:a.x-bounds.x,y:a.y-bounds.y},{...b,x:b.x-bounds.x,y:b.y-bounds.y},null,edge.style,shifted);items.push({t:'path',d,stroke:'muted',sw:1.6});if(edge.label&&d){const at=pathLabel(d);items.push({...line(at.x,at.y,edge.label,12,'muted'),anchor:'middle'});}}}

 for(const object of [...board.objects].sort((a,b)=>a.zIndex-b.zIndex)){
  const {scene,scale}=objectScene(object,project,scope),x=object.x-bounds.x,y=object.y-bounds.y;
  if(object.type==='diagram'||object.type==='linked'&&['wbs','taskDiagram'].includes(object.sourceLink.sourceType))items.push({...rect(x,y,object.width,object.height,'none','muted'),op:.25});
  for(const item of scene.items){
   if(item.t!=='path')items.push(transformItem(item,x,y,scale));
   else items.push({...item,d:transformPath(item.d,x,y,scale),sw:item.sw*scale});
  }
 }
 return {width:bounds.width,height:bounds.height,items};
}
// Scene paths use absolute M/L/C/H/V only; never accept raw imported SVG path strings.
export function transformPath(path,x,y,scale){
 let command='',index=0;return path.replace(/[MLCHVZ]|-?\d*\.?\d+(?:e[+-]?\d+)?/gi,token=>{
  if(/^[A-Za-z]$/.test(token)){command=token.toUpperCase();index=0;return command;}
  const axis=command==='V'?'y':command==='H'?'x':index++%2===0?'x':'y';return String(Number(token)*scale+(axis==='x'?x:y));
 });
}
