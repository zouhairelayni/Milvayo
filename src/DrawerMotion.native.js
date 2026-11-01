import React, { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
// Left drawer transitions live on the UI runtime, not JS animation timers.
export default function DrawerMotion({ style, children }) {
  const x = useSharedValue(-40);
  const alpha = useSharedValue(0);
  useEffect(() => {
    x.value = withTiming(0, { duration: 180 });
    alpha.value = withTiming(1, { duration: 180 });
  }, [x, alpha]);
  const motion = useAnimatedStyle(() => ({ opacity: alpha.value, transform: [{ translateX: x.value }] }));
  return <Animated.View style={[style, motion]}>{children}</Animated.View>;
}
