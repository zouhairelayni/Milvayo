// /src/ui/FillMotion.native.js
import {useEffect} from 'react';
import Animated,{Easing,ReduceMotion,useAnimatedStyle,useSharedValue,withTiming} from 'react-native-reanimated';
export default function FillMotion({style,value}){
 const progress=useSharedValue(0);
 useEffect(()=>{progress.set(withTiming(1,{duration:380,easing:Easing.bezier(.23,1,.32,1),reduceMotion:ReduceMotion.System}));},[progress,value]);
 const motion=useAnimatedStyle(()=>({transform:[{scaleX:progress.get()}]}));
 return <Animated.View style={[style,{transformOrigin:'left center'},motion]}/>;
}
