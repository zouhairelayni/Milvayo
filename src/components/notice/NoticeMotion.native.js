// /src/components/notice/NoticeMotion.native.js
import {useCallback,useEffect,useRef} from 'react';
import {View,useWindowDimensions} from 'react-native';
import Animated,{cancelAnimation,Easing,ReduceMotion,useAnimatedStyle,useSharedValue,withTiming} from 'react-native-reanimated';
import {scheduleOnRN} from 'react-native-worklets';

export default function NoticeMotion({expanded,compact,onCompact,state='expanded',expandedHeight=190,style}){
 const {width}=useWindowDimensions(),maxW=Math.max(1,Math.min(width-32,420)),smallW=Math.min(maxW,248);
 const visible=useSharedValue(0),density=useSharedValue(1),height=useSharedValue(expandedHeight);
 const latest=useRef(null),epoch=useRef(0);latest.current={state,onCompact};
 const settled=useCallback(ticket=>{if(epoch.current===ticket&&latest.current.state==='compact')latest.current.onCompact?.();},[]);
 useEffect(()=>{
  const ticket=++epoch.current,options={duration:220,easing:Easing.bezier(.22,1,.36,1),reduceMotion:ReduceMotion.System};
  visible.set(withTiming(state==='hidden'?0:1,{...options,duration:state==='hidden'?150:190}));
  density.set(withTiming(state==='expanded'?1:0,options,finished=>{if(finished&&state==='compact')scheduleOnRN(settled,ticket);}));
  return()=>{epoch.current++;cancelAnimation(visible);cancelAnimation(density);};
 },[state,visible,density,settled]);
 // Only the childless absolute background changes size; text never scales or reflows per frame.
 const background=useAnimatedStyle(()=>{
  const p=density.get(),w=smallW+(maxW-smallW)*p;
  return {width:w,height:48+(height.get()-48)*p,borderRadius:24-4*p,opacity:visible.get(),transform:[{translateX:(maxW-w)/2},{translateY:(1-visible.get())*-8}]};
 });
 const large=useAnimatedStyle(()=>({opacity:visible.get()*density.get(),transform:[{translateY:(1-visible.get())*-8}]}));
 const small=useAnimatedStyle(()=>({opacity:visible.get()*(1-density.get()),transform:[{translateY:(1-visible.get())*-8}]}));
 return <View pointerEvents="box-none" style={{width:maxW,height:state==='expanded'?expandedHeight:48}}>
  <Animated.View pointerEvents="none" style={[{position:'absolute',top:0,left:0},style,background]}/>
  <Animated.View pointerEvents={state==='expanded'?'auto':'none'} accessibilityElementsHidden={state!=='expanded'} importantForAccessibility={state==='expanded'?'auto':'no-hide-descendants'} onLayout={e=>height.set(Math.max(48,e.nativeEvent.layout.height))} style={[{position:'absolute',top:0,left:0,width:maxW,maxHeight:expandedHeight},large]}>{expanded}</Animated.View>
  <Animated.View pointerEvents={state==='compact'?'auto':'none'} accessibilityElementsHidden={state!=='compact'} importantForAccessibility={state==='compact'?'auto':'no-hide-descendants'} style={[{position:'absolute',top:0,left:(maxW-smallW)/2,width:smallW},small]}>{compact}</Animated.View>
 </View>;
}
