// /src/gestures/DiagramGesture.native.js
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { GestureDetector, usePanGesture, usePinchGesture, useSimultaneousGestures } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
const { constrainPose, pinchPose } = require('./diagramZoom.cjs');

export default function DiagramGesture({ bounds, initialScale, resetKey, onZoom, children }) {
  const { width, height, contentWidth, contentHeight } = bounds;
  const initial = constrainPose({ scale: initialScale, x: 0, y: 0 }, bounds);
  const [committedScale, setCommittedScale] = useState(initial.scale);
  const pose = useSharedValue(initial);
  const start = useSharedValue(initial);
  const anchor = useSharedValue({ x: 0, y: 0 });
  const factor = useSharedValue(1);
  const pointers = useSharedValue(0);
  const pinching = useSharedValue(false);
  const needsLift = useSharedValue(false);
  const panStarted = useSharedValue(false);
  const panStart = useSharedValue(initial);
  const callback = useRef(onZoom);
  callback.current = onZoom;
  const reportZoom = useCallback(value => { if (!Number.isFinite(value)) return; setCommittedScale(value); callback.current?.(value); }, []);

  // A completed pinch reports its scale without resetting its focal translation.
  // Only an explicit preset, orientation/scene change or viewport resize resets it.
  useEffect(() => {
    const next = constrainPose({ scale: initialScale, x: 0, y: 0 }, { width, height, contentWidth, contentHeight });
    pose.value = next; setCommittedScale(next.scale);
    pinching.value = false; needsLift.value = false; panStarted.value = false;
  }, [resetKey, width, height, contentWidth, contentHeight]);

  const pinch = usePinchGesture({
    onActivate: e => {
      start.value = pose.value;
      anchor.value = { x: e.focalX, y: e.focalY };
      factor.value = e.scale > 0 ? e.scale : 1;
      pointers.value = e.numberOfPointers;
      pinching.value = true; needsLift.value = true; panStarted.value = false;
    },
    onUpdate: e => {
      if (!pinching.value || e.numberOfPointers < 2) return;
      // Adding/removing a third finger must not relocate the diagram.
      if (pointers.value !== e.numberOfPointers) {
        start.value = pose.value; anchor.value = { x: e.focalX, y: e.focalY };
        factor.value = e.scale > 0 ? e.scale : 1; pointers.value = e.numberOfPointers;
        return;
      }
      pose.value = pinchPose(start.value, e.scale / factor.value, anchor.value, { x: e.focalX, y: e.focalY }, { width, height, contentWidth, contentHeight });
    },
    onFinalize: () => {
      if (pinching.value) scheduleOnRN(reportZoom, pose.value.scale);
      pinching.value = false;
    },
    onTouchesUp: e => { if (e.numberOfTouches === 0) needsLift.value = false; },
    onTouchesCancel: () => { needsLift.value = false; },
  });
  // RNGH 3.3 validates tuple endpoints synchronously in render. Pass numbers, never shared values.
  // React synchronizes only at pinch completion; live visual tracking stays entirely on the UI runtime.
  const tall = contentHeight * committedScale > height;
  const canPan = contentWidth * committedScale > width || tall;
  const pan = usePanGesture({
    enabled: canPan, maxPointers: 1, activeOffsetX: [-6, 6],
    activeOffsetY: tall ? [-6, 6] : [-1000000, 1000000], failOffsetY: tall ? [-1000000, 1000000] : [-8, 8],
    onActivate: () => {
      panStarted.value = !needsLift.value && !pinching.value;
      panStart.value = pose.value;
    },
    onUpdate: e => {
      if (!panStarted.value || needsLift.value || pinching.value || e.numberOfPointers !== 1) return;
      pose.value = constrainPose({ scale: pose.value.scale, x: panStart.value.x + e.translationX, y: panStart.value.y + e.translationY }, { width, height, contentWidth, contentHeight });
    },
    onFinalize: () => { panStarted.value = false; },
    onTouchesUp: e => { if (e.numberOfTouches === 0) needsLift.value = false; },
    onTouchesCancel: () => { needsLift.value = false; },
  });
  const gesture = useSimultaneousGestures(pinch, pan);
  const transform = useAnimatedStyle(() => ({ transform: [{ translateX: pose.value.x }, { translateY: pose.value.y }, { scale: pose.value.scale }] }));
  return (
    <GestureDetector gesture={gesture}>
      <View collapsable={false} accessibilityLabel="Work breakdown diagram. Pinch to zoom, drag to pan" style={{ width, height, overflow: 'hidden' }}>
        <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: contentWidth, height: contentHeight, transformOrigin: 'top left' }, transform]}>
          {children}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}
