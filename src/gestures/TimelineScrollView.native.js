// /src/gestures/TimelineScrollView.native.js
import { Animated } from 'react-native';
import { GestureDetector, useNativeGesture } from 'react-native-gesture-handler';
const seed = () => { 'worklet'; };
export default function TimelineScrollView({ simultaneousWith, ...props }) {
  const gesture = useNativeGesture({ simultaneousWith, disallowInterruption: false, onActivate: seed });
  // Core Animated traverses nested props during render. Keep Reanimated gesture/shared objects outside it.
  return <GestureDetector gesture={gesture}><Animated.ScrollView {...props} /></GestureDetector>;
}
