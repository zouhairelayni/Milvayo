// /src/components/charts/Column.native.js
import {memo,useEffect} from 'react';
import {Rect} from 'react-native-svg';
import Animated,{Easing,ReduceMotion,useAnimatedProps,useSharedValue,withDelay,withTiming} from 'react-native-reanimated';
const AnimatedRect=Animated.createAnimatedComponent(Rect);
export default memo(function Column({height=0,baseline,delay=0,...props}){
 const h=useSharedValue(0);
 useEffect(()=>{h.set(withDelay(delay,withTiming(Math.max(0,height),{duration:420,easing:Easing.bezier(.23,1,.32,1),reduceMotion:ReduceMotion.System})));},[height,delay,h]);
 const animatedProps=useAnimatedProps(()=>({height:h.get(),y:baseline-h.get()}));
 return <AnimatedRect {...props} height={height} y={baseline-height} animatedProps={animatedProps}/>;
});
