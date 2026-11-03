// /src/board/boardMotion.web.js
import React, { forwardRef, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

// Restore the exact MockDesign pan/document behaviour for browsers.
export const BoardMotion = forwardRef(function BoardMotion({ offset, shift = 0, style, children, ...props }, ref) {
  const shiftX = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!shift) shiftX.setValue(0);
    else Animated.timing(shiftX, { toValue: shift, duration: 140, useNativeDriver: false }).start();
  }, [shiftX, shift]);
  return <Animated.View ref={ref} {...props}
    style={[style, { transform: [...offset.getTranslateTransform(), { translateX: shiftX }] }]}>{children}</Animated.View>;
});
