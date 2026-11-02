// /src/gestures/gestureSurface.native.js
import React, { useEffect } from 'react';
import { VirtualGestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

// Worklet closures MUST only capture Reanimated shareable values, not the complete
// drag controller. The controller includes RNGH 3 WorkletEventHandler objects,
// which cannot be copied by Reanimated and broke the Kanban + Timeline screens.
// Virtual detectors preserve the mock's exact native view/layout hierarchy.
export function GestureArea({ drag, disabled, animate = false, style, children, ...rest }) {
  const translateX = drag.x;
  const translateY = drag.y;
  const gesture = drag.gesture;
  // How far the scrolled container moved since the lift: a bar inside it must travel that much too,
  // or it stays behind while the chart auto-scrolls under the finger.
  const none = useSharedValue(0);
  const scrollX = drag.scrollX || none;
  const scrollY = drag.scrollY || none;
  const motion = useAnimatedStyle(() => ({
    transform: [{ translateX: animate ? translateX.value + scrollX.value : 0 }, { translateY: animate ? translateY.value + scrollY.value : 0 }],
  }));
  const element = <Animated.View collapsable={false} {...rest} style={animate ? [style, motion] : style}>{children}</Animated.View>;
  return disabled ? element : <VirtualGestureDetector gesture={gesture}>{element}</VirtualGestureDetector>;
}

export function DragMotion({ drag, touch = false, disabled = false, shift = 0, style, children, ...rest }) {
  const translateX = drag.x;
  const translateY = drag.y;
  const gesture = drag.gesture;
  const shiftX = useSharedValue(0);
  useEffect(() => {
    shiftX.value = withTiming(shift, { duration: 140 });
  }, [shift, shiftX]);
  const motion = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value + shiftX.value }, { translateY: translateY.value }],
  }));
  const element = <Animated.View collapsable={false} {...rest} style={[style, motion]}>{children}</Animated.View>;
  return touch && !disabled ? <VirtualGestureDetector gesture={gesture}>{element}</VirtualGestureDetector> : element;
}
