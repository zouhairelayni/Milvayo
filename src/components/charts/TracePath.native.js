// /src/components/charts/TracePath.native.js
import {useEffect} from 'react';
import {Path} from 'react-native-svg';
import Animated,{Easing,ReduceMotion,useAnimatedProps,useSharedValue,withTiming} from 'react-native-reanimated';
const AnimatedPath=Animated.createAnimatedComponent(Path);
export default function TracePath({d,length=1000,...props}){
 const progress=useSharedValue(0);
 useEffect(()=>{progress.set(0);progress.set(withTiming(1,{duration:440,easing:Easing.bezier(.16,1,.3,1),reduceMotion:ReduceMotion.System}));},[d,progress]);
 const animatedProps=useAnimatedProps(()=>({strokeDashoffset:length*(1-progress.get())}));
 return <AnimatedPath {...props} d={d} strokeDasharray={`${length} ${length}`} animatedProps={animatedProps}/>;
}
