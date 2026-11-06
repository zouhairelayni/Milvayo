// /src/gestures/TimelinePinch.native.js
import { useCallback, useEffect, useRef } from 'react';
import { View } from 'react-native';
import { GestureDetector, usePinchGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
const { pinchZoom } = require('../timeline/timelineZoom.cjs');

export function useTimelinePinch(options) {
  const { width, span, viewportWidth, enabled } = options;
  const latest = useRef(options); latest.current = options;
  const preview = useSharedValue({ width, scroll: 0, ratio: 1, translate: 0 });
  const basis = useSharedValue({ width, scroll: 0, anchor: 0, factor: 1, count: 2 });
  const originalScroll = useSharedValue(0);
  const running = useSharedValue(false), ready = useSharedValue(false);
  const reset = useCallback(() => { preview.set({ width: latest.current.width, scroll: 0, ratio: 1, translate: 0 }); }, [preview]);
  const begin = useCallback(() => {
    if (!running.get()) return;
    latest.current.onStart();
    const scroll = latest.current.getScroll();
    originalScroll.set(scroll);
    basis.set(b => ({ ...b, scroll }));
    preview.set({ width: latest.current.width, scroll, ratio: 1, translate: 0 });
    ready.set(true);
  }, [originalScroll, basis, preview, ready, running]);
  const finish = useCallback((nextWidth, scroll) => latest.current.onCommit(nextWidth, scroll), []);
  const release = useCallback(() => latest.current.onEnd(), []);
  useEffect(() => () => { latest.current.onEnd(); }, []);
  const gesture = usePinchGesture({
    enabled,
    cancelsJSResponder: true,
    onActivate: e => {
      running.set(true); ready.set(false);
      basis.set({ width, scroll: 0, anchor: e.focalX, factor: e.scale > 0 ? e.scale : 1, count: e.numberOfPointers });
      scheduleOnRN(begin);
    },
    onUpdate: e => {
      if (!running.get() || !ready.get() || e.numberOfPointers < 2) return;
      const b = basis.get();
      if (b.count !== e.numberOfPointers) {
        const p = preview.get();
        basis.set({ width: p.width, scroll: p.scroll, anchor: e.focalX, factor: e.scale > 0 ? e.scale : 1, count: e.numberOfPointers });
        return;
      }
      const result = pinchZoom(b.width, Math.max(0.25, Math.min(4, e.scale / b.factor)), b.anchor, e.focalX, b.scroll, span, viewportWidth, width);
      preview.set({ ...result, ratio: result.width / width, translate: originalScroll.get() - result.scroll });
    },
    onFinalize: () => {
      if (!running.get()) return;
      const prepared = ready.get();
      running.set(false); ready.set(false);
      if (prepared) {
        const p = preview.get();
        scheduleOnRN(finish, p.width, p.scroll);
      } else scheduleOnRN(reset);
      // Always release scroll locks, including OS cancellation/remaining fingers.
      // Timeline suppresses residual task taps/drops briefly after this handoff.
      scheduleOnRN(release);
    },
  });
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: preview.get().translate }, { scaleX: preview.get().ratio }] }));
  const labelStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: 1 / preview.get().ratio }] }));
  const previewTo = useCallback((nextWidth, scroll) => {
    const o = latest.current;
    preview.set({ width: nextWidth, scroll, ratio: nextWidth / o.width, translate: o.getScroll() - scroll });
  }, [preview]);
  const handle = useRef({});
  Object.assign(handle.current, { gesture, style, labelStyle, reset, previewTo });
  return handle.current;
}

// The existing TimelineGestureHost supplies the stable intercepting ancestor.
export function TimelinePinchArea({ pinch, children }) {
  return <GestureDetector gesture={pinch.gesture}><View collapsable={false} style={{ flex: 1 }}>{children}</View></GestureDetector>;
}
export function TimelinePinchCanvas({ pinch, style, children }) {
  return <Animated.View style={[style, { transformOrigin: 'top left' }, pinch.style]}>{children}</Animated.View>;
}

// Counter-scale only glyph containers: their position follows geometry while text keeps its natural width.
export function TimelinePinchLabel({ pinch, style, center = false, children }) {
  return <Animated.View style={[style, { transformOrigin: center ? 'center' : 'left center' }, pinch.labelStyle]}>{children}</Animated.View>;
}
