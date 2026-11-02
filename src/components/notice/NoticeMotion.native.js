// /src/components/notice/NoticeMotion.native.js
import {useEffect} from 'react';
import {useWindowDimensions} from 'react-native';
import Animated, {Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming} from 'react-native-reanimated';

// In-app Dynamic Island-style motion. This is not an iOS system Live Activity.
// Geometry and fades are UI-thread worklets; the JS thread only changes states.
export default function NoticeMotion({compact, expanded, state='expanded', expandedHeight=96, style}) {
  const {width} = useWindowDimensions();
  const fullWidth = Math.max(200, Math.min(width - 40, 388));
  const phase = useSharedValue(0);
  const target = state === 'expanded' ? 1 : state === 'compact' ? 0.52 : 0;
  useEffect(() => {
    phase.value = target === 1
      ? withSpring(1, {mass:0.72, stiffness:215, damping:24, overshootClamping:false})
      : withTiming(target, {duration:210});
  }, [target, phase]);

  const shell = useAnimatedStyle(() => ({
    width: interpolate(phase.value, [0, .52, 1], [44, 164, fullWidth], Extrapolation.CLAMP),
    height: interpolate(phase.value, [0, .52, 1], [30, 40, expandedHeight], Extrapolation.CLAMP),
    opacity: interpolate(phase.value, [0, .2, 1], [0, 1, 1], Extrapolation.CLAMP),
    // Subtle scale settle based on Bounceview-style tactile motion, not a dependency.
    // Spring overshoot is intentionally limited: no exaggerated cartoon bounce.
    transform:[
      {translateY:interpolate(phase.value,[0,.52,1],[-12,0,0],Extrapolation.CLAMP)},
      {scale:interpolate(phase.value,[0,.52,1,1.08],[.96,1,1,1.012],Extrapolation.CLAMP)},
    ],
  }));
  const compactStyle = useAnimatedStyle(() => ({
    opacity:interpolate(phase.value,[0,.32,.52,.8,1],[0,.55,1,.12,0],Extrapolation.CLAMP),
  }));
  const expandedStyle = useAnimatedStyle(() => ({
    opacity:interpolate(phase.value,[0,.52,.75,1],[0,0,.18,1],Extrapolation.CLAMP),
    transform:[{translateY:interpolate(phase.value,[.52,1],[5,0],Extrapolation.CLAMP)}],
  }));
  return <Animated.View pointerEvents="box-none" style={[style, {alignItems:'center',overflow:'hidden'},shell]}>
    <Animated.View pointerEvents={state === 'compact' ? 'auto' : 'none'} style={[{position:'absolute',top:0,bottom:0,left:0,right:0,justifyContent:'center',alignItems:'center'},compactStyle]}>{compact}</Animated.View>
    <Animated.View pointerEvents={state === 'expanded' ? 'auto' : 'none'} style={[{position:'absolute',top:0,bottom:0,left:0,right:0},expandedStyle]}>{expanded}</Animated.View>
  </Animated.View>;
}
