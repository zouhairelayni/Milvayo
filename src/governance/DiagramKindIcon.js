// /src/governance/DiagramKindIcon.js
import Svg, { Path, Rect, Circle } from 'react-native-svg';
export default function DiagramKindIcon({kind,color}){
 return <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} accessible={false}>
  {kind==='tree'?<><Rect x={9} y={2} width={6} height={5} rx={1}/><Path d="M12 7v5M5 17v-5h14v5"/><Rect x={2} y={17} width={6} height={5} rx={1}/><Rect x={16} y={17} width={6} height={5} rx={1}/></>:kind==='fishbone'?<Path d="M2 12h19l-4-4m4 4-4 4M7 12 3 5m11 7-4-7M7 12l-4 7m11-7-4 7"/>:<><Path d="m12 12-7-7m7 7 7-7m-7 7-7 7m7-7 7 7"/><Circle cx={12} cy={12} r={3}/><Circle cx={4} cy={4} r={2}/><Circle cx={20} cy={4} r={2}/><Circle cx={4} cy={20} r={2}/><Circle cx={20} cy={20} r={2}/></>}
 </Svg>;
}
