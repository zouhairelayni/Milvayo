// /src/board/boardMotion.native.js
import React, { forwardRef, useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

// A single native animated view replaces the original MockDesign Animated.View.
// This introduces NO layout wrapper: ref, measurement and touch-responder handlers
// stay attached to the same root as the original card/list.
export const BoardMotion = forwardRef(function BoardMotion({ offset, shift = 0, style, children, ...props }, ref) {
  const x = offset.x;
  const y = offset.y;
  const shiftX = useSharedValue(0);
  useEffect(() => {
    // MockDesign's neighbour-list slide, now animated on the native UI thread.
    shiftX.value = withTiming(shift, { duration: 140 });
  }, [shift, shiftX]);
  const moving = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value + shiftX.value }, { translateY: y.value }],
  }));
  return <Animated.View ref={ref} collapsable={false} {...props} style={[style, moving]}>{children}</Animated.View>;
});
