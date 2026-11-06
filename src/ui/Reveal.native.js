// /src/ui/Reveal.native.js
import {useEffect} from 'react';
import Animated,{cancelAnimation,Easing,ReduceMotion,useAnimatedStyle,useSharedValue,withDelay,withTiming} from 'react-native-reanimated';
export default function Reveal({children,style,delay=0,duration=190,distance=8,...rest}){
 const progress=useSharedValue(0);
 useEffect(()=>{progress.set(withDelay(delay,withTiming(1,{duration,easing:Easing.bezier(.2,.8,.2,1),reduceMotion:ReduceMotion.System})));return()=>cancelAnimation(progress);},[progress,delay,duration]);
 const motion=useAnimatedStyle(()=>({opacity:progress.get(),transform:[{translateY:(1-progress.get())*distance}]}));
 return <Animated.View {...rest} style={[style,motion]}>{children}</Animated.View>;
}
