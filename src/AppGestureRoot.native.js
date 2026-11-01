import React from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView, InterceptingGestureDetector } from 'react-native-gesture-handler';
// RNGH 3 virtual detectors inside the modern board/timeline must be descendants
// of this intercepting detector, especially when cards reorder mid-gesture.
export default function AppGestureRoot({ children }) {
  return <GestureHandlerRootView style={{ flex: 1 }}>
    <InterceptingGestureDetector><View style={{ flex: 1 }}>{children}</View></InterceptingGestureDetector>
  </GestureHandlerRootView>;
}
