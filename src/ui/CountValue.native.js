// /src/ui/CountValue.native.js
import {View} from 'react-native';
import Animated,{FadeInDown,FadeOutUp,ReduceMotion} from 'react-native-reanimated';
import {font,useTheme} from './theme/theme';
export default function CountValue({value,size=28,color,weight='500'}){
 const{c}=useTheme();return <View accessible accessibilityLabel={String(value)} style={{minHeight:Math.round(size*1.3),overflow:'hidden',justifyContent:'center'}}>
  <Animated.Text key={String(value)} accessible={false} entering={FadeInDown.duration(180).reduceMotion(ReduceMotion.System)} exiting={FadeOutUp.duration(120).reduceMotion(ReduceMotion.System)}
   style={{fontFamily:font,fontSize:size,lineHeight:Math.round(size*1.2),fontWeight:weight,color:color||c.ink,fontVariant:['tabular-nums']}}>{value}</Animated.Text>
 </View>;
}
