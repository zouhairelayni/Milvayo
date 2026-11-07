// /src/screens/canvas/CanvasPanButtons.js
import {View} from 'react-native';
import Svg,{Path} from 'react-native-svg';
import PressSurface from '../../ui/PressSurface';
import {useTheme} from '../../ui/theme/theme';
export default function CanvasPanButtons({onPan}){
 const {c}=useTheme();
 return <View style={{flexDirection:'row',gap:4}}>
  {[
   ['Left',120,0,'M 19 12 H 5 M 12 5 L 5 12 L 12 19'],
   ['Right',-120,0,'M 5 12 H 19 M 12 5 L 19 12 L 12 19'],
   ['Up',0,120,'M 12 19 V 5 M 5 12 L 12 5 L 19 12'],
   ['Down',0,-120,'M 12 5 V 19 M 5 12 L 12 19 L 19 12'],
  ].map(([label,x,y,d])=><PressSurface key={label} accessibilityRole="button" accessibilityLabel={`Pan ${label.toLowerCase()}`} onPress={()=>onPan(x,y)} style={{width:48,minHeight:48,borderRadius:8,alignItems:'center',justifyContent:'center'}}><Svg width={18} height={18} viewBox="0 0 24 24" pointerEvents="none"><Path d={d} fill="none" stroke={c.ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></Svg></PressSurface>)}
 </View>;
}
