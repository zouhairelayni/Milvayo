// /src/components/loading/SkeletonMotionSurface.native.js
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

export default function SkeletonMotionSurface({ active = true, children, style }) {
  const [reduced, setReduced] = useState(true);
  const opacity = useSharedValue(1);
  useEffect(() => {
    let current = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (current) setReduced(value); }).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { current = false; sub.remove(); };
  }, []);
  useEffect(() => {
    cancelAnimation(opacity);
    opacity.set(active && !reduced ? withRepeat(withTiming(0.58, { duration: 1000, easing: Easing.inOut(Easing.quad) }), -1, true) : 1);
    return () => cancelAnimation(opacity);
  }, [active, reduced, opacity]);
  const motion = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  return <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[style, motion]}>{children}</Animated.View>;
}
