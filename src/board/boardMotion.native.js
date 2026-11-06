// /src/board/boardMotion.native.js
import React,{forwardRef,useEffect} from 'react';
import {StyleSheet} from 'react-native';
import Animated,{Easing,LinearTransition,ReduceMotion,useAnimatedStyle,useSharedValue,withSpring,withTiming,cancelAnimation} from 'react-native-reanimated';
// One animated style owns opacity; an entering FadeIn would compete with the drag opacity.
export const BoardMotion=forwardRef(function BoardMotion({offset,shift=0,lifted=false,liftAmount=1,previewY=0,layoutKey,style,children,...props},ref){
 const baseOpacity=StyleSheet.flatten(style)?.opacity??1;
 const arrival=useSharedValue(0);
 useEffect(()=>{arrival.set(withTiming(1,{duration:170,easing:Easing.bezier(.23,1,.32,1),reduceMotion:ReduceMotion.System}));return()=>cancelAnimation(arrival);},[arrival]);
 const x=offset.x,y=offset.y,lift=useSharedValue(0),shiftX=useSharedValue(0),shiftY=useSharedValue(0);
 useEffect(()=>{lift.set(withSpring(lifted?1:0,{duration:260,dampingRatio:1,reduceMotion:ReduceMotion.System}));},[lifted,lift]);
 useEffect(()=>{shiftX.set(withSpring(shift,{duration:300,dampingRatio:1,reduceMotion:ReduceMotion.System}));},[shift,shiftX]);
 useEffect(()=>{shiftY.set(withSpring(previewY,{duration:240,dampingRatio:1,reduceMotion:ReduceMotion.System}));},[previewY,shiftY]);
 const moving=useAnimatedStyle(()=>({opacity:baseOpacity*arrival.get(),transform:[{translateX:x.get()+shiftX.get()},{translateY:y.get()+shiftY.get()-lift.get()*5*liftAmount},{scale:1+lift.get()*.025*liftAmount},{rotate:`${Math.max(-2,Math.min(2,x.get()*.008))*lift.get()*liftAmount}deg`}]}));
 return <Animated.View ref={ref} collapsable={false} {...props}
  layout={LinearTransition.duration(210).easing(Easing.bezier(.23,1,.32,1)).reduceMotion(ReduceMotion.System)} style={[style,moving]}>{children}</Animated.View>;
});
