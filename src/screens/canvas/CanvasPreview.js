// /src/screens/canvas/CanvasPreview.js
import Svg,{Path,Rect} from 'react-native-svg';
import {T} from '../../ui/ui';
import {useTheme} from '../../ui/theme/theme';
const {objectBounds,connectorPath}=require('../../canvas/interaction.cjs');
export default function CanvasPreview({board}){
 const {c}=useTheme(),bounds=objectBounds(board.objects),objects=new Map(board.objects.map(o=>[o.id,o]));
 return <><Svg width="100%" height={240} viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`} accessibilityLabel={`Layout preview of ${board.title}`}>
  {board.connectors.slice(0,100).map(edge=>{const a=objects.get(edge.from),b=objects.get(edge.to);return a&&b?<Path key={edge.id} d={connectorPath(a,b,null,edge.style,board.objects)} stroke={c.muted} strokeWidth={2} fill="none"/>:null;})}
  {board.objects.map(o=><Rect key={o.id} x={o.x} y={o.y} width={o.width} height={o.height} rx={8} fill={o.type==='frame'?'none':o.color||c.surface} stroke={c.muted} strokeWidth={1}/>)}
 </Svg><T muted size={12}>Layout preview · Open the canvas for its complete content</T></>;
}
