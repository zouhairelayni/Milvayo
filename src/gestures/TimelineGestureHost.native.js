// /src/gestures/TimelineGestureHost.native.js
import React from 'react';
import { InterceptingGestureDetector, useTapGesture } from 'react-native-gesture-handler';

// Timeline bars use RNGH 3 virtual detectors, which must sit under an InterceptingGestureDetector.
//
// Root cause of the v0.5.12 "first Timeline open returns to Overview" bug (verified in RNGH 3.3.0 source,
// InterceptingGestureDetector.tsx): the detector's mode starts as DEFAULT unless the `gesture` prop
// says otherwise, and the first virtual child with worklet callbacks calls setMode(REANIMATED). The mode
// picks the wrapper component (HostGestureDetector vs ReanimatedNativeDetector), so switching it changes
// the element type and React remounts everything below. Placed at the app root that was the whole app.
//
// Fix: seed the detector with a Reanimated-backed gesture so it is born in REANIMATED mode and never
// switches. The seed is disabled and does nothing; it exists only so the mode is correct from first render.
// The detector is also scoped to the screen that needs it, instead of wrapping the entire app.
export default function TimelineGestureHost({ children }) {
  const seed = useTapGesture({
    enabled: false,
    onActivate: () => { 'worklet'; },
  });
  return <InterceptingGestureDetector gesture={seed}>{children}</InterceptingGestureDetector>;
}
