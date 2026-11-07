// /src/canvas/CanvasSurface.native.js
import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect, Defs, Pattern, Circle } from 'react-native-svg';
import { GestureDetector, usePanGesture, usePinchGesture, useTapGesture, useExclusiveGestures, useSimultaneousGestures } from 'react-native-gesture-handler';
import Animated, { useAnimatedProps, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { diagnosticMonitor } from '../diagnostics/monitor';
import DiagramSvg from '../governance/DiagramSvg';
import CanvasDrawing from './CanvasDrawing';
import { useTheme } from '../ui/theme/theme';
const {connectionGeometry,routingObjects}=require('./connectionGeometry.cjs');
const { hitObject, worldPoint, zoomAt, movingIds, hitConnector, hitResize, hitConnect, resizeBox, connectionPreview }=require('./interaction.cjs');
const Stroke=Animated.createAnimatedComponent(Path),Target=Animated.createAnimatedComponent(Rect);
function ConnectionPreview({link,objects,color}){
 const path=useAnimatedProps(()=>({d:connectionPreview(objects,link.get())}));
 const target=useAnimatedProps(()=>{const l=link.get();let o=null;if(l?.target)for(let i=0;i<objects.length;i++)if(objects[i].id===l.target)o=objects[i];return {x:o?o.x-4:0,y:o?o.y-4:0,width:o?o.width+8:0,height:o?o.height+8:0};});
 return <><Stroke d="" animatedProps={path} stroke={color} strokeWidth={2} fill="none"/><Target animatedProps={target} width={0} height={0} rx={12} stroke={color} strokeWidth={2} fill="none"/></>;
}
function DrawingStroke({points,color,width,eraser,pose}){
 const props=useAnimatedProps(()=>({d:points.get().map((p,i)=>`${i?'L':'M'} ${p.x} ${p.y}`).join(' '),strokeWidth:eraser?24/pose.get().scale:width}));
 return <Stroke animatedProps={props} d="" fill="none" stroke={color} strokeWidth={width} opacity={eraser?.25:1} strokeLinecap="round" strokeLinejoin="round"/>;
}
export default function CanvasSurface({board,project,scope,selected,mode,initialPose,request,viewport,onSelect,onMove,onPose,onDraw,onEditObject,onEditEdge,onResize,onConnect,onStartConnect,onInteractionStart,brushWidth=2,brushColor,onErase}){
 const {c}=useTheme(),pose=useSharedValue(initialPose),drag=useSharedValue(null),link=useSharedValue(null),stroke=useSharedValue([]),start=useSharedValue(initialPose),pinching=useSharedValue(false),wait=useSharedValue(false),anchor=useSharedValue({x:0,y:0}),factor=useSharedValue(1),pointers=useSharedValue(0),kind=useSharedValue('');
 const objects=useMemo(()=>routingObjects(board.objects),[board.objects]),connections=useMemo(()=>(board.connectors||[]).map(({id,from,to,style})=>({id,from,to,style})),[board.connectors]);
 const routes=useMemo(()=>connectionGeometry(objects,board.connectors||[]),[objects,board.connectors]);
 const frames=useSharedValue({count:0,max:0,slow:0});
 useFrameCallback(frame=>{if((!kind.value&&!pinching.value)||frame.timeSincePreviousFrame==null)return;const gap=frame.timeSincePreviousFrame,old=frames.value;frames.value={count:old.count+1,max:Math.max(old.max,gap),slow:old.slow+(gap>32?1:0)};});
 const reportFrames=useCallback(value=>diagnosticMonitor.recordAction(`canvas UI frame intervals: ${value.count} samples; max ${value.max.toFixed(1)}ms; over32ms ${value.slow}; not native FPS`),[]);
 const current=useRef({board,onSelect,onMove,onPose,onDraw,onEditObject,onEditEdge,onResize,onConnect,onStartConnect,onInteractionStart,onErase});current.current={board,onSelect,onMove,onPose,onDraw,onEditObject,onEditEdge,onResize,onConnect,onStartConnect,onInteractionStart,onErase};
 const select=useCallback(id=>current.current.onSelect(id),[]);
 const commit=useCallback((d,points,p,connection,action)=>{if(d){let ok;if(d.kind==='resize'){const o=current.current.board.objects.find(o=>o.id===d.id);if(o){const box=resizeBox(o,d.dx,d.dy);ok=current.current.onResize?.(d.id,box.width,box.height)??false;}}else ok=current.current.onMove(d.ids,d.dx,d.dy);if(ok===false)drag.set(null);}if(connection?.target&&connection.target!==connection.from)current.current.onConnect?.(connection.from,connection.target);link.set(null);if(action==='erase'&&points.length)current.current.onErase?.(points);else if(points.length>1)current.current.onDraw(points);stroke.set([]);current.current.onPose(p);},[drag,link,stroke]);
 const activity=useCallback(()=>current.current.onInteractionStart?.(),[]);
 const eraseAt=useCallback(points=>current.current.onErase?.(points),[]);
 const startConnect=useCallback(id=>current.current.onStartConnect?.(id),[]);
 const edit=useCallback((id,edge,point)=>edge?current.current.onEditEdge?.(id):current.current.onEditObject?.(id,point),[]);
 const report=useCallback(p=>current.current.onPose(p),[]);
 useLayoutEffect(()=>{pose.set(initialPose);drag.set(null);link.set(null);stroke.set([]);kind.set('');wait.set(false);pinching.set(false);pointers.set(0);},[request,viewport.width,viewport.height]);
 useLayoutEffect(()=>{drag.set(null);},[board.revision]);
 const pinch=usePinchGesture({
  onActivate:e=>{scheduleOnRN(activity);frames.value={count:0,max:0,slow:0};drag.value=null;link.value=null;stroke.value=[];kind.value='';pinching.value=true;wait.value=true;start.value=pose.value;anchor.value={x:e.focalX,y:e.focalY};factor.value=e.scale||1;pointers.value=e.numberOfPointers;},
  onUpdate:e=>{if(!pinching.value||e.numberOfPointers<2)return;if(e.numberOfPointers!==pointers.value){start.value=pose.value;anchor.value={x:e.focalX,y:e.focalY};factor.value=e.scale||1;pointers.value=e.numberOfPointers;return;}pose.value=zoomAt(start.value,e.scale/factor.value,anchor.value,{x:e.focalX,y:e.focalY});},
  onFinalize:()=>{if(pinching.value){scheduleOnRN(report,pose.value);scheduleOnRN(reportFrames,frames.value);}pinching.value=false;},
  onTouchesUp:e=>{if(e.numberOfTouches===0)wait.value=false;},onTouchesCancel:()=>{wait.value=false;},
 });
 const pan=usePanGesture({maxPointers:1,minDistance:4,
  onActivate:e=>{
   if(wait.value||pinching.value)return;scheduleOnRN(activity);frames.value={count:0,max:0,slow:0};start.value=pose.value;
   const x=e.x-e.translationX,y=e.y-e.translationY,hit=hitObject(objects,x,y,pose.value),resize=(mode==='select')?hitResize(objects,selected,x,y,pose.value):null,dot=(mode==='select'||mode==='connect')?hitConnect(objects,selected,x,y,pose.value):null;
   if(dot){kind.value='connect';const p=worldPoint(e.x,e.y,pose.value);link.value={from:dot.id,x:p.x,y:p.y,target:''};}
   else if(resize){kind.value='resize';drag.value={kind:'resize',id:resize.id,ids:[resize.id],boxes:[{x:resize.x,y:resize.y,width:resize.width,height:resize.height}],dx:0,dy:0};}
   else if(mode==='draw'||mode==='erase'){kind.value=mode;stroke.value=[worldPoint(e.x,e.y,pose.value)];}
   else if(mode==='select'&&hit&&!hit.locked){const ids=movingIds(objects,selected.indexOf(hit.id)>=0?selected:[hit.id]);let locked=false;for(let i=0;i<objects.length;i++)if(ids.indexOf(objects[i].id)>=0&&objects[i].locked)locked=true;
    if(!locked){kind.value='move';drag.value={kind:'move',ids,boxes:objects.filter(o=>ids.indexOf(o.id)>=0).map(o=>({x:o.x,y:o.y,width:o.width,height:o.height})),dx:0,dy:0};if(selected.indexOf(hit.id)<0)scheduleOnRN(select,hit.id);}else kind.value='pan';
   }else kind.value='pan';
  },
  onUpdate:e=>{if(wait.value||pinching.value||e.numberOfPointers!==1)return;
   if((kind.value==='move'||kind.value==='resize')&&drag.value)drag.value={...drag.value,dx:e.translationX/start.value.scale,dy:e.translationY/start.value.scale};
   else if(kind.value==='connect'&&link.value){const p=worldPoint(e.x,e.y,pose.value),target=hitObject(objects,e.x,e.y,pose.value);link.value={...link.value,x:p.x,y:p.y,target:target&&target.id!==link.value.from?target.id:''};}
   else if((kind.value==='draw'||kind.value==='erase')&&stroke.value.length<2000)stroke.value=[...stroke.value,worldPoint(e.x,e.y,pose.value)];
   else if(kind.value==='pan')pose.value={...start.value,x:start.value.x+e.translationX,y:start.value.y+e.translationY};
  },
  onFinalize:e=>{if(e?.state===1||e?.state===3){drag.value=null;link.value=null;stroke.value=[];}else if(kind.value){scheduleOnRN(commit,drag.value,stroke.value,pose.value,link.value,kind.value);scheduleOnRN(reportFrames,frames.value);}kind.value='';},
  onTouchesCancel:()=>{drag.value=null;link.value=null;stroke.value=[];kind.value='';},
 });
 const tap=useTapGesture({onDeactivate:e=>{if(mode==='erase'&&!wait.value&&!pinching.value){scheduleOnRN(eraseAt,[worldPoint(e.x,e.y,pose.value)]);return;}if(!wait.value&&!pinching.value&&mode!=='draw'&&mode!=='erase'){const dot=(mode==='select'||mode==='connect')?hitConnect(objects,selected,e.x,e.y,pose.value):null,hit=hitObject(objects,e.x,e.y,pose.value);if(dot)scheduleOnRN(startConnect,dot.id);else scheduleOnRN(select,hit?.id||'');}}});
 const doubleTap=useTapGesture({numberOfTaps:2,maxDelay:220,onDeactivate:e=>{if(wait.value||pinching.value||mode!=='select')return;const hit=hitObject(objects,e.x,e.y,pose.value);if(hit)scheduleOnRN(edit,hit.id,false,worldPoint(e.x,e.y,pose.value));else{const edge=hitConnector(connections,objects,e.x,e.y,pose.value,12,routes);if(edge)scheduleOnRN(edit,edge.id,true);}}});
 const taps=useExclusiveGestures(doubleTap,tap);
 const gesture=useSimultaneousGestures(pinch,pan,taps);
 return <GestureDetector gesture={gesture}><View collapsable={false} style={{width:viewport.width,height:viewport.height,backgroundColor:c.bg,overflow:'hidden'}} accessibilityLabel="Canvas. Select, drag objects, or pinch to zoom">
  <Svg pointerEvents="none" width={viewport.width} height={viewport.height} style={{position:'absolute',left:0,top:0}}><Defs><Pattern id="canvas-dots" width={24} height={24} patternUnits="userSpaceOnUse"><Circle cx={1} cy={1} r={1} fill={c.ink} opacity={0.1}/></Pattern></Defs><Rect width={viewport.width} height={viewport.height} fill="url(#canvas-dots)"/></Svg>
  <DiagramSvg scene={{width:viewport.width,height:viewport.height}} viewport={viewport} pose={pose} cameraInitial={initialPose}>
   <CanvasDrawing board={board} project={project} scope={scope} selected={selected} mode={mode} routes={routes} routeObjects={objects} pose={pose} drag={drag} viewport={viewport}/><DrawingStroke points={stroke} color={mode==='erase'?c.muted:brushColor||c.ink} width={brushWidth} eraser={mode==='erase'} pose={pose}/><ConnectionPreview link={link} objects={objects} color={c.accentText}/>
  </DiagramSvg>
 </View></GestureDetector>;
}
