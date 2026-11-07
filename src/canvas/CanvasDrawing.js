// /src/canvas/CanvasDrawing.js
import { memo, useMemo } from 'react';
import { G, Rect, Circle } from 'react-native-svg';
import { Scene } from '../governance/wbsviews';
import { useTheme } from '../ui/theme/theme';
import CanvasObjectGroup, { CanvasEdge } from './CanvasObjectGroup';
import { objectScene } from './scene';
const Part=memo(function Part({object,value,selected,pose,drag,viewport,color,handles}){
 return <CanvasObjectGroup object={object} objectScale={value.scale} pose={pose} drag={drag} viewport={viewport}>
  {localPose=><>{object.type==='diagram'||value.source?.kind==='diagram'?<Rect x={0} y={0} width={object.width} height={object.height} rx={12} fill="none" stroke={color} strokeWidth={1} opacity={.25}/>:null}<G transform={`scale(${value.scale})`}><Scene bare scene={value.scene} pose={localPose} viewport={viewport}/></G>
  {selected?<Rect x={-3} y={-3} width={object.width+6} height={object.height+6} rx={12} fill="none" stroke={color} strokeWidth={2}/>:null}
  {selected&&handles?<>{[[-20,object.height/2],[object.width+20,object.height/2],[object.width/2,-20],[object.width/2,object.height+20]].map(([cx,cy],i)=><Circle key={i} cx={cx} cy={cy} r={6} fill={color} stroke="none"/>)}<Rect x={object.width-8} y={object.height-8} width={16} height={16} rx={3} fill={color} stroke="none"/></>:null}
 </>}</CanvasObjectGroup>;
});
export default function CanvasDrawing({board,project,scope,selected,pose,drag,viewport,mode,routes,routeObjects}){
 const {c}=useTheme(),index=useMemo(()=>({byId:new Map((routeObjects||board.objects).map(o=>[o.id,o])),ordered:[...board.objects].sort((a,b)=>a.zIndex-b.zIndex)}),[board.objects,routeObjects]);
 return <>
  {board.connectors.map((edge,i)=>{const a=index.byId.get(edge.from),b=index.byId.get(edge.to);return a&&b?<G key={edge.id}><CanvasEdge a={a} b={b} id={edge.id} drag={drag} style={edge.style} objects={routeObjects||board.objects} label={edge.label} initialGeometry={routes?.[i]} color={c.muted}/></G>:null;})}
  {index.ordered.map(object=><Part key={object.id} object={object} value={objectScene(object,project,scope)} selected={selected.includes(object.id)} pose={pose} drag={drag} viewport={viewport} color={c.accentText} handles={mode==='select'||mode==='connect'}/>)}
 </>;
}
