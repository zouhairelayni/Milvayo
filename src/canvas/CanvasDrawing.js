// /src/canvas/CanvasDrawing.js
import { memo, useMemo } from 'react';
import { G, Rect, Circle } from 'react-native-svg';
import { Scene } from '../governance/wbsviews';
import { useTheme } from '../ui/theme/theme';
import CanvasComments from './CanvasComments';
import CanvasObjectGroup, { CanvasEdge } from './CanvasObjectGroup';
import { objectScene } from './scene';
const {visibleBox,visibleRoute}=require('./visibility.cjs'),{movingIds}=require('./interaction.cjs');
const EdgePart=memo(CanvasEdge);
const Part=memo(function Part({object,value,selected,pose,drag,viewport,color,handles}){
 return <CanvasObjectGroup object={object} objectScale={value.scale} pose={pose} drag={drag} viewport={viewport}>
  {localPose=><>{object.type==='diagram'||value.source?.kind==='diagram'?<Rect x={0} y={0} width={object.width} height={object.height} rx={12} fill="none" stroke={color} strokeWidth={1} opacity={.25}/>:null}<G transform={`scale(${value.scale})`}><Scene bare scene={value.scene} pose={localPose} viewport={viewport}/></G>
  {selected?<Rect x={-3} y={-3} width={object.width+6} height={object.height+6} rx={12} fill="none" stroke={color} strokeWidth={2}/>:null}
  {selected&&handles?<>{[[-20,object.height/2],[object.width+20,object.height/2],[object.width/2,-20],[object.width/2,object.height+20]].map(([cx,cy],i)=><Circle key={i} cx={cx} cy={cy} r={6} fill={color} stroke="none"/>)}<Rect x={object.width-8} y={object.height-8} width={16} height={16} rx={3} fill={color} stroke="none"/></>:null}
 </>}</CanvasObjectGroup>;
});
export default function CanvasDrawing({board,project,scope,selected,pose,drag,viewport,mode,routes,routeObjects,viewPose,selectedEdge,scale=1}){
 const {c}=useTheme(),index=useMemo(()=>({byId:new Map((routeObjects||board.objects).map(o=>[o.id,o])),ordered:[...board.objects].sort((a,b)=>a.zIndex-b.zIndex)}),[board.objects,routeObjects]);
 const blocked=useMemo(()=>{const ids=new Set();for(const o of board.objects)if(o.locked){let at=o;while(at){ids.add(at.id);at=index.byId.get(at.groupId);}}return ids;},[board.objects,index]);
 const pinned=useMemo(()=>new Set(movingIds(board.objects,selected)),[board.objects,selected]);
 return <>
  {board.connectors.map((edge,i)=>{const a=index.byId.get(edge.from),b=index.byId.get(edge.to);return a&&b&&(!viewPose||pinned.has(a.id)||pinned.has(b.id)||visibleRoute(routes?.[i]?.bounds,viewPose,viewport))?<G key={edge.id}><EdgePart a={a} b={b} id={edge.id} drag={drag} style={edge.style} objects={edge.style==='elbow'?routeObjects||board.objects:undefined} label={edge.label} initialGeometry={routes?.[i]} active={edge.id===selectedEdge} color={edge.color||c.muted}/></G>:null;})}
  {index.ordered.filter(o=>!viewPose||pinned.has(o.id)||visibleBox(o,viewPose,viewport)).map(object=><Part key={object.id} object={object} value={objectScene(object,project,scope)} selected={selected.includes(object.id)} pose={pose} drag={drag} viewport={viewport} color={c.accentText} handles={(mode==='select'||mode==='connect')&&!blocked.has(object.id)}/>)}
  <CanvasComments threads={board.threads} objects={routeObjects||board.objects} pose={pose} drag={drag} viewport={viewport} scale={scale} viewPose={viewPose} pinned={pinned}/>
 </>;
}
