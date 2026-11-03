// /src/components/shell/DrawerMotion.web.js
import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
export default function DrawerMotion({ style, children }) {
  const x = useRef(new Animated.Value(-40)).current;
  const alpha = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.parallel([
    Animated.timing(x, { toValue: 0, duration: 180, useNativeDriver: false }),
    Animated.timing(alpha, { toValue: 1, duration: 180, useNativeDriver: false }),
  ]).start(); }, [x, alpha]);
  return <Animated.View style={[style, { opacity: alpha, transform: [{ translateX: x }] }]}>{children}</Animated.View>;
}
