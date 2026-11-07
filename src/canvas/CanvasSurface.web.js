// /src/canvas/CanvasSurface.web.js
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import Svg, { G, Path, Rect, Defs, Pattern, Circle } from 'react-native-svg';
import CanvasDrawing from './CanvasDrawing';
import { useTheme } from '../ui/theme/theme';
const {connectionGeometry}=require('./connectionGeometry.cjs');
const {reconcileGeometry,beginTransform,cancelTransform,acknowledgeTransform}=require('./transform.cjs');
const {hitComment,commentPosition,commentBubbleAnchor}=require('./comments.cjs');
const {visibilityKey}=require('./visibility.cjs');
const {selectionAnchor}=require('./presentation.cjs');
const {pathLabel,routeAffected}=require('./routing.cjs');
const {hitObject,worldPoint,zoomAt,movingIds,connectorPath,hitConnector,hitResize,hitConnect,resizeBox,previewBox,connectionPreview}=require('./interaction.cjs');
export default function CanvasSurface(props){
 const {board,project,scope,selected,viewport,request,initialPose}=props,{c}=useTheme(),host=useRef(null),stage=useRef(null),current=useRef(props),pose=useRef(initialPose),session=useRef(null),touches=useRef(new Map());
 const ledger=useRef(null),geometry=props.camera?.drag||ledger,[viewPose,setViewPose]=useState(initialPose),windowKey=useRef(visibilityKey(initialPose,viewport)),markerScale=useRef(initialPose.scale),previousTransform=useRef(null);
 const byId=useMemo(()=>new Map(board.objects.map(o=>[o.id,o])),[board.objects]);const routes=useMemo(()=>connectionGeometry(board.objects,board.connectors),[board.objects,board.connectors]);current.current={...props,byId,routes};
 const paintOverlay=()=>{const p=current.current,container=host.current?.parentElement;if(p.overlay){const at=selectionAnchor(p.overlay.boxes,pose.current,geometry.current,p.viewport,p.overlay.extent,p.overlay.bottom),node=container?.querySelector('#canvas-selection-overlay');if(node?.style){node.style.transform=`translate(${at.x}px,${at.y}px)`;node.style.width=at.width+'px';}}
  const bubble=container?.querySelector('#canvas-comment-bubble');if(p.commentOverlay&&bubble?.style){const m=p.commentOverlay,at=commentBubbleAnchor(m.anchor,m.box,pose.current,geometry.current,p.viewport,Number(bubble.getAttribute?.('data-bubble-height'))||240);bubble.style.transform=`translate(${at.x}px,${at.y}px)`;}
  const zoomed=markerScale.current!==pose.current.scale,previous=previousTransform.current,active=geometry.current;
  if(zoomed||active?.kind==='move'||active?.kind==='resize'||previous?.kind==='move'||previous?.kind==='resize')for(const m of p.markers||[]){const moved=m.box&&(active?.affected?.['$'+m.box.id]||previous?.affected?.['$'+m.box.id]);if(!zoomed&&!moved)continue;const dot=host.current?.querySelector(`#${CSS.escape('canvas-comment-'+m.anchor.id)}`);if(moved){const at=commentPosition(m.anchor,m.box,active);dot?.setAttribute('cx',at.x);dot?.setAttribute('cy',at.y);}if(zoomed){dot?.setAttribute('r',7/pose.current.scale);dot?.setAttribute('stroke-width',2/pose.current.scale);}}
  markerScale.current=pose.current.scale;previousTransform.current=active;
 };
 const paint=p=>{pose.current=p;const key=visibilityKey(p,current.current.viewport);if(key!==windowKey.current){windowKey.current=key;setViewPose(p);}if(current.current.camera)current.current.camera.pose.current=p;paintOverlay();current.current.onPreviewPose?.(p);(stage.current?.elementRef?.current||stage.current)?.setAttribute('transform',`translate(${p.x},${p.y}) scale(${p.scale})`);};
 useLayoutEffect(()=>{paint(initialPose);session.current=null;touches.current.clear();},[request]);
 useLayoutEffect(()=>{
  geometry.current=reconcileGeometry(geometry.current,board.objects,board.revision);
  for(const o of board.objects){const next=previewBox(o,geometry.current);host.current?.querySelector(`#${CSS.escape('canvas-object-'+o.id)}`)?.setAttribute('transform',`translate(${next.x},${next.y}) scale(${next.width/o.width},${next.height/o.height})`);}
  paintOverlay();
 },[board.revision]);
 useEffect(()=>{
  const node=host.current;if(!node)return;let wheelReport=0;
  const point=e=>{const rect=node.getBoundingClientRect();return {x:e.clientX-rect.left,y:e.clientY-rect.top};};
  const pinch=()=>{const [a,b]=[...touches.current.values()];return {focal:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},distance:Math.hypot(b.x-a.x,b.y-a.y)};};
  const paintEdge=(edge,path)=>{node.querySelector(`#${CSS.escape('canvas-edge-'+edge.id)}`)?.setAttribute('d',path);if(edge.label){const at=pathLabel(path),label=node.querySelector(`#${CSS.escape('canvas-edge-label-'+edge.id)}`);label?.setAttribute('x',at.x);label?.setAttribute('y',at.y);}};
  const resetDrag=()=>{geometry.current=cancelTransform(geometry.current);paintOverlay();const b=current.current.board;for(const o of b.objects){const next=previewBox(o,geometry.current);node.querySelector(`#${CSS.escape('canvas-object-'+o.id)}`)?.setAttribute('transform',`translate(${next.x},${next.y}) scale(${next.width/o.width},${next.height/o.height})`);}for(let i=0;i<b.connectors.length;i++)paintEdge(b.connectors[i],current.current.routes[i]?.d||'');node.querySelector('#canvas-drawing-stroke')?.setAttribute('d','');node.querySelector('#canvas-connection-preview')?.setAttribute('d','');node.querySelector('#canvas-connection-target')?.setAttribute('width','0');};
  const down=e=>{
   if(current.current.mode==='editing'||e.button!==0&&e.pointerType==='mouse')return;current.current.onInteractionStart?.();e.preventDefault();node.setPointerCapture?.(e.pointerId);const p=point(e);touches.current.set(e.pointerId,p);
   if(touches.current.size>=2){resetDrag();session.current={kind:'pinch',start:pose.current,...pinch()};return;}
   const {board,selected,mode}=current.current,hit=hitObject(board.objects.map(o=>previewBox(o,geometry.current)),p.x,p.y,pose.current);
   let ids=hit?movingIds(board.objects,selected.includes(hit.id)?selected:[hit.id]):[];
   const resize=mode==='select'?hitResize(board.objects.map(o=>previewBox(o,geometry.current)),selected,p.x,p.y,pose.current):null,dot=mode==='select'||mode==='connect'?hitConnect(board.objects,selected,p.x,p.y,pose.current):null;
   const kind=dot?'connect':resize?'resize':mode==='draw'?'draw':mode==='erase'?'erase':mode==='select'&&hit&&!board.objects.some(o=>ids.includes(o.id)&&o.locked)?'move':'pan';
   if(resize)ids=movingIds(board.objects,[resize.id]);const transform=kind==='move'||kind==='resize'?beginTransform(geometry.current,board.objects,board.revision,kind,ids,resize?.id):null;if(transform)geometry.current=transform;
   session.current={transform,kind,point:p,start:pose.current,ids,boxes:board.objects.filter(o=>kind==='resize'?o.id===resize.id:ids.includes(o.id)).map(o=>({x:o.x,y:o.y,width:o.width,height:o.height})),hit,resize,dot,target:'',dx:0,dy:0,points:[worldPoint(p.x,p.y,pose.current)]};
  };
  const move=e=>{
   if(!touches.current.has(e.pointerId))return;e.preventDefault();const p=point(e);touches.current.set(e.pointerId,p);const s=session.current;if(!s||s.kind==='wait')return;
   if(touches.current.size>=2){if(s.kind!=='pinch'){resetDrag();session.current={kind:'pinch',start:pose.current,...pinch()};return;}const next=pinch();if(s.distance>0)paint(zoomAt(s.start,next.distance/s.distance,s.focal,next.focal));return;}
   if(s.kind==='pinch')return;s.dx=(p.x-s.point.x)/s.start.scale;s.dy=(p.y-s.point.y)/s.start.scale;
   if(s.kind==='pan')paint({...s.start,x:s.start.x+p.x-s.point.x,y:s.start.y+p.y-s.point.y});
   if(s.kind==='move'||s.kind==='resize'){
    if(s.kind==='move'&&!s.selectionReported){s.selectionReported=true;if(!current.current.selected.includes(s.hit.id))current.current.onSelect(s.hit.id);}
    const b=current.current.board,d={...s.transform,dx:s.dx,dy:s.dy};geometry.current=d;paintOverlay();for(const o of b.objects)if(s.ids.includes(o.id)){const next=previewBox(o,d);node.querySelector(`#${CSS.escape('canvas-object-'+o.id)}`)?.setAttribute('transform',`translate(${next.x},${next.y}) scale(${next.width/o.width},${next.height/o.height})`);}
    for(let index=0;index<b.connectors.length;index++){const edge=b.connectors[index],a=current.current.byId.get(edge.from),other=current.current.byId.get(edge.to);if(a&&other&&(edge.style==='elbow'?routeAffected(edge.from,edge.to,d,current.current.routes[index]?.bounds):d.ids.includes(edge.from)||d.ids.includes(edge.to)))paintEdge(edge,connectorPath(a,other,d,edge.style,b.objects));}
   }
   if(s.kind==='connect'){const b=current.current.board,point=worldPoint(p.x,p.y,pose.current),target=hitObject(b.objects,p.x,p.y,pose.current);s.target=target&&target.id!==s.dot.id?target.id:'';node.querySelector('#canvas-connection-preview')?.setAttribute('d',connectionPreview(b.objects,{from:s.dot.id,target:s.target,...point}));const marker=node.querySelector('#canvas-connection-target');if(marker){marker.setAttribute('x',target?target.x-4:0);marker.setAttribute('y',target?target.y-4:0);marker.setAttribute('width',s.target?target.width+8:0);marker.setAttribute('height',s.target?target.height+8:0);}}
   if((s.kind==='draw'||s.kind==='erase')&&s.points.length<2000){s.points.push(worldPoint(p.x,p.y,pose.current));node.querySelector('#canvas-drawing-stroke')?.setAttribute('d',s.points.map((p,i)=>`${i?'L':'M'} ${p.x} ${p.y}`).join(' '));}
  };
  const end=e=>{
   if(!touches.current.has(e.pointerId))return;touches.current.delete(e.pointerId);const s=session.current;if(node.hasPointerCapture?.(e.pointerId))node.releasePointerCapture(e.pointerId);
   if(s&&e.type!=='pointercancel'){
    if(s.kind==='resize'&&(Math.abs(s.dx)+Math.abs(s.dy)>2)){const next=resizeBox(s.resize,s.dx,s.dy);geometry.current={...geometry.current,pending:true};const receipt=current.current.onResize?.(s.resize.id,next.width,next.height,geometry.current);geometry.current=acknowledgeTransform(geometry.current,geometry.current.operation,receipt?.revision??current.current.board.revision+1,receipt?.accepted??receipt!==false);if(receipt===false||receipt?.accepted===false)resetDrag();}
    else if(s.kind==='connect'){if(s.target)current.current.onConnect?.(s.dot.id,s.target);else if(Math.abs(s.dx)+Math.abs(s.dy)<=2)current.current.onStartConnect?.(s.dot.id);resetDrag();}
    else if(s.kind==='move'&&(Math.abs(s.dx)+Math.abs(s.dy)>2)){geometry.current={...geometry.current,pending:true};const receipt=current.current.onMove(s.ids,s.dx,s.dy,geometry.current);geometry.current=acknowledgeTransform(geometry.current,geometry.current.operation,receipt?.revision??current.current.board.revision+1,receipt?.accepted??receipt!==false);if(receipt===false||receipt?.accepted===false)resetDrag();}
    else if(s.kind==='erase'){current.current.onErase?.(s.points);resetDrag();}
    else if(s.kind==='draw'&&s.points.length>1){current.current.onDraw(s.points);resetDrag();}
    else if(s.kind!=='pinch'&&s.kind!=='wait'&&Math.abs(s.dx||0)+Math.abs(s.dy||0)<=2){const thread=hitComment(current.current.markers||[],s.point.x,s.point.y,pose.current,geometry.current);if(current.current.mode==='comment')current.current.onPlaceComment?.(worldPoint(s.point.x,s.point.y,pose.current));else if(thread)current.current.onComment?.(thread);else if(s.hit)current.current.onSelect(s.hit.id);else{const b=current.current.board,edge=hitConnector(b.connectors,b.objects.map(o=>previewBox(o,geometry.current)),s.point.x,s.point.y,pose.current);if(edge)current.current.onEditEdge?.(edge.id);else current.current.onSelect('');}}
    current.current.onPose(pose.current);
   }else resetDrag();
   session.current=touches.current.size?{kind:'wait'}:null;
  };
  const wheel=e=>{if(current.current.mode==='editing')return;e.preventDefault();const p=point(e),unit=e.deltaMode===1?16:e.deltaMode===2?viewport.height:1;paint(e.ctrlKey||!e.shiftKey&&!e.deltaX?zoomAt(pose.current,Math.exp(-e.deltaY*unit*.005),p):{...pose.current,x:pose.current.x-(e.shiftKey?e.deltaY:e.deltaX)*unit,y:pose.current.y-(e.shiftKey?0:e.deltaY)*unit});clearTimeout(wheelReport);wheelReport=setTimeout(()=>{wheelReport=0;current.current.onPose(pose.current);},120);};
  const edit=e=>{if(current.current.mode!=='select')return;const p=point(e),b=current.current.board,thread=hitComment(current.current.markers||[],p.x,p.y,pose.current,geometry.current);if(thread){current.current.onComment?.(thread);return;}const hit=hitObject(b.objects,p.x,p.y,pose.current);if(hit)current.current.onEditObject?.(hit.id,worldPoint(p.x,p.y,pose.current));else{const edge=hitConnector(b.connectors,b.objects,p.x,p.y,pose.current,12,current.current.routes);if(edge)current.current.onEditEdge?.(edge.id);}};
  const events={dblclick:edit,pointerdown:down,pointermove:move,pointerup:end,pointercancel:end,wheel};for(const [name,fn] of Object.entries(events))node.addEventListener(name,fn,{passive:false});
  return()=>{clearTimeout(wheelReport);for(const [name,fn] of Object.entries(events))node.removeEventListener(name,fn);touches.current.clear();session.current=null;};
 },[viewport.height]);
 return <View ref={host} accessibilityLabel="Canvas. Drag objects, pan empty space, or use wheel to zoom" style={{width:viewport.width,height:viewport.height,backgroundColor:c.bg,touchAction:'none',overflow:'hidden'}}>
  <Svg width={viewport.width} height={viewport.height} viewBox={`0 0 ${viewport.width} ${viewport.height}`}><Defs><Pattern id="canvas-dots" width={24} height={24} patternUnits="userSpaceOnUse"><Circle cx={1} cy={1} r={1} fill={c.ink} opacity={0.1}/></Pattern></Defs><Rect width={viewport.width} height={viewport.height} fill="url(#canvas-dots)"/><G ref={stage} transform={`translate(${initialPose.x},${initialPose.y}) scale(${initialPose.scale})`}>
   <CanvasDrawing board={board} project={project} scope={scope} selected={selected} selectedEdge={props.selectedEdge} mode={props.mode} routes={routes} viewport={viewport} viewPose={viewPose} scale={initialPose.scale}/><Path id="canvas-connection-preview" d="" stroke={c.accentText} strokeWidth={2} fill="none"/><Rect id="canvas-connection-target" width={0} height={0} rx={12} stroke={c.accentText} strokeWidth={2} fill="none"/><Path id="canvas-drawing-stroke" d="" stroke={props.mode==='erase'?c.muted:props.brushColor||c.ink} strokeWidth={props.mode==='erase'?24/initialPose.scale:props.brushWidth||2} opacity={props.mode==='erase'?.25:1} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </G></Svg>
 </View>;
}
