// /src/screens/canvas/CanvasPillMotion.native.js
import {useEffect} from 'react';
import Animated,{cancelAnimation,Easing,ReduceMotion,useAnimatedStyle,useSharedValue,withTiming} from 'react-native-reanimated';
export default function CanvasPillMotion({open,active,width,colors}){
 const extent=useSharedValue(open?width:56),opacity=useSharedValue(active?.94:.18);
 useEffect(()=>{const config={duration:open?220:160,easing:Easing.bezier(.22,1,.36,1),reduceMotion:ReduceMotion.System};extent.set(withTiming(open?width:56,config));opacity.set(withTiming(active?.94:.18,config));return()=>{cancelAnimation(extent);cancelAnimation(opacity);};},[open,active,width,extent,opacity]);
 const style=useAnimatedStyle(()=>({width:extent.get(),opacity:opacity.get()}));
 return <Animated.View pointerEvents="none" style={[{position:'absolute',left:0,top:0,height:56,borderRadius:28,backgroundColor:colors.elevated,borderWidth:1,borderColor:colors.line},style]}/>;
}
