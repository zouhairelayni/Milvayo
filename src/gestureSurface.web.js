import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

// Web keeps the unchanged mock PanResponder/document drag path.
export function GestureArea({ drag, disabled, animate = false, style, children, ...rest }) {
  return <View {...(!disabled ? drag.panHandlers : {})} {...rest} style={animate ? [style, { transform: drag.offset.getTranslateTransform() }] : style}>{children}</View>;
}
export function DragMotion({ drag, touch = false, disabled = false, shift = 0, style, children, ...rest }) {
  const shiftX = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(shiftX, { toValue: shift, duration: 140, useNativeDriver: false }).start();
  }, [shiftX, shift]);
  return <Animated.View {...(touch && !disabled ? drag.panHandlers : {})} {...rest}
    style={[style, { transform: [...drag.offset.getTranslateTransform(), { translateX: shiftX }] }]}>{children}</Animated.View>;
}
