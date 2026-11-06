// /src/ui/ScreenPresence.native.js
import {useEffect} from 'react';
import Animated,{cancelAnimation,ReduceMotion,useAnimatedStyle,useSharedValue,withTiming} from 'react-native-reanimated';
export default function ScreenPresence({active,children,style}){
 const opacity=useSharedValue(active?1:0);
 useEffect(()=>{cancelAnimation(opacity);opacity.set(active?withTiming(1,{duration:120,reduceMotion:ReduceMotion.System}):0);},[active,opacity]);
 const motion=useAnimatedStyle(()=>({opacity:opacity.get()}));
 return <Animated.View style={[style,{display:active?'flex':'none'},motion]}>{children}</Animated.View>;
}
