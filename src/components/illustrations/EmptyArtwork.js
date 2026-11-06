// /src/components/illustrations/EmptyArtwork.js
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import Reveal from '../../ui/Reveal';
import { useTheme } from '../../ui/theme/theme';

// Original geometric Milvayo compositions; no reference screenshots or third-party artwork ships.
export default function EmptyArtwork({ kind='work', size=156 }) {
  const {c}=useTheme();
  return <Reveal duration={420} distance={10} style={{width:size,height:size*.72}}><Svg width={size} height={size*.72} viewBox="0 0 180 130" {...{pointerEvents:'none'}}>
    <Circle cx={91} cy={67} r={54} fill={c.selection}/>
    {kind==='people'?<>
      <Path d="M48 77L90 54L133 77M48 77L90 103L133 77" stroke={c.accentText} strokeWidth={1.5} fill="none"/>
      {[{x:48,y:77},{x:90,y:54},{x:133,y:77}].map(({x,y},i)=><Circle key={i} cx={x} cy={y} r={20} fill={c.surface} stroke={c.line} strokeWidth={1.5}/>)}
      <Circle cx={48} cy={74} r={6} fill={c.accent}/><Path d="M38 89Q48 79 58 89" fill={c.accent}/>
      <Circle cx={90} cy={51} r={6} fill={c.info}/><Path d="M80 66Q90 56 100 66" fill={c.info}/>
      <Circle cx={133} cy={74} r={6} fill={c.success}/><Path d="M123 89Q133 79 143 89" fill={c.success}/>
    </>:kind==='schedule'?<>
      <Rect x={38} y={25} width={106} height={84} rx={13} fill={c.surface} stroke={c.line} strokeWidth={1.5}/>
      <Path d="M38 50H144M63 19V32M119 19V32" stroke={c.accentText} strokeWidth={3} strokeLinecap="round"/>
      <Rect x={52} y={64} width={55} height={11} rx={5.5} fill={c.accent}/><Rect x={77} y={84} width={51} height={11} rx={5.5} fill={c.info}/>
      <Circle cx={137} cy={103} r={17} fill={c.surface} stroke={c.success} strokeWidth={1.5}/><Path d="M129 103L135 109L146 97" fill="none" stroke={c.success} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/>
    </>:<>
      <Rect x={27} y={40} width={79} height={65} rx={12} fill={c.elevated} stroke={c.line} strokeWidth={1.5}/>
      <Rect x={58} y={22} width={90} height={79} rx={12} fill={c.surface} stroke={c.line} strokeWidth={1.5}/>
      <Rect x={72} y={38} width={31} height={7} rx={3.5} fill={c.accent}/>
      <Line x1={72} y1={60} x2={131} y2={60} stroke={c.line} strokeWidth={5} strokeLinecap="round"/>
      <Line x1={72} y1={77} x2={117} y2={77} stroke={c.line} strokeWidth={5} strokeLinecap="round"/>
      <Circle cx={142} cy={99} r={19} fill={c.success}/><Path d="M134 99L140 105L150 93" fill="none" stroke={c.bg} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/>
    </>}
  </Svg></Reveal>;
}
