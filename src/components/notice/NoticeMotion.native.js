// /src/components/notice/NoticeMotion.native.js
import {useEffect} from 'react';
import {useWindowDimensions} from 'react-native';
import Animated,{Easing,ReduceMotion,useAnimatedStyle,useSharedValue,withTiming} from 'react-native-reanimated';
export default function NoticeMotion({expanded,state='expanded',expandedHeight=104,style}){
 const{width}=useWindowDimensions();const p=useSharedValue(0);
 useEffect(()=>{p.set(withTiming(state==='hidden'?0:1,{duration:state==='hidden'?150:190,easing:Easing.bezier(.2,.8,.2,1),reduceMotion:ReduceMotion.System}));},[state,p]);
 const motion=useAnimatedStyle(()=>({opacity:p.get(),transform:[{translateY:(1-p.get())*8}]}));
 return <Animated.View pointerEvents={state==='hidden'?'none':'auto'} style={[{width:Math.min(width-32,420),minHeight:72,maxHeight:expandedHeight,overflow:'hidden'},style,motion]}>{expanded}</Animated.View>;
}
