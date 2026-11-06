// /src/gestures/TimelinePinch.native.js
import { useCallback, useEffect, useRef } from 'react';
import { AppState, View } from 'react-native';
import { GestureDetector, usePinchGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
const { pinchZoom } = require('../timeline/timelineZoom.cjs');
const { validZoomCommit, createNativeZoomHandoff } = require('../timeline/nativeZoomHandoff.cjs');

export function useTimelinePinch(options) {
  const { width, span, viewportWidth, enabled } = options;
  const latest = useRef(options); latest.current = options;
  const mounted = useRef(true);
  const preview = useSharedValue({ width, scroll: 0, ratio: 1, translate: 0 });
  const basis = useSharedValue({ width, scroll: 0, anchor: 0, anchorValid: false, factor: 1, count: 2 });
  const originalScroll = useSharedValue(0), sequence = useSharedValue(0);
  const running = useSharedValue(false), ready = useSharedValue(false);
  const reset = useCallback(() => { preview.set({ width: latest.current.width, scroll: 0, ratio: 1, translate: 0 }); }, [preview]);
  const handoff = useRef(null);
  if (!handoff.current) handoff.current = createNativeZoomHandoff(
    fn => requestAnimationFrame(fn), id => cancelAnimationFrame(id), result => {
      if (!mounted.current) return;
      try { if (result && latest.current.enabled) latest.current.onCommit(result.width, result.scroll); else reset(); }
      finally { latest.current.onEnd(); }
    });
  const begin = useCallback(ticket => {
    if (!mounted.current || !latest.current.enabled || !running.get()) return;
    handoff.current.begin(ticket);
    const offset = latest.current.getScroll();
    const scroll = Number.isFinite(offset) ? Math.max(0, offset) : 0;
    originalScroll.set(scroll); basis.set(b => ({ ...b, scroll }));
    preview.set({ width: latest.current.width, scroll, ratio: 1, translate: 0 });
    latest.current.onStart(); ready.set(true);
  }, [originalScroll, basis, preview, ready, running]);
  const finish = useCallback((ticket, nextWidth, scroll, cancelled) => {
    const o = latest.current;
    handoff.current.finish(ticket, cancelled ? null : validZoomCommit(nextWidth, scroll, o.span, o.viewportWidth));
  }, []);
  const cancel = useCallback(() => {
    handoff.current.cancel(); running.set(false); ready.set(false); reset();
    if (mounted.current) latest.current.onEnd();
  }, [running, ready, reset]);
  useEffect(() => {
    mounted.current = true;
    const sub = AppState.addEventListener('change', state => { if (state !== 'active') cancel(); });
    return () => { mounted.current = false; sub.remove(); handoff.current.cancel(); running.set(false); ready.set(false); };
  }, [cancel, running, ready]);
  useEffect(() => { if (!enabled) cancel(); }, [enabled, cancel]);
  const gesture = usePinchGesture({
    enabled, cancelsJSResponder: true,
    onActivate: e => {
      if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(span) || span <= 0 || viewportWidth <= 0) return;
      sequence.set(n => n + 1); running.set(true); ready.set(false);
      basis.set({ width, scroll: 0, anchor: Number.isFinite(e.focalX) ? e.focalX : 0,
        anchorValid: Number.isFinite(e.focalX), factor: Number.isFinite(e.scale) && e.scale > 0 ? e.scale : 1, count: e.numberOfPointers });
      scheduleOnRN(begin, sequence.get());
    },
    onUpdate: e => {
      if (!running.get() || !ready.get() || e.numberOfPointers < 2 || !Number.isFinite(e.scale) || e.scale <= 0 || !Number.isFinite(e.focalX)) return;
      const b = basis.get();
      if (!b.anchorValid || b.count !== e.numberOfPointers) {
        const p = preview.get();
        basis.set({ width: p.width, scroll: p.scroll, anchor: e.focalX, anchorValid: true, factor: e.scale, count: e.numberOfPointers });
        return;
      }
      const result = pinchZoom(b.width, Math.max(0.25, Math.min(4, e.scale / b.factor)), b.anchor, e.focalX, b.scroll, span, viewportWidth, width);
      if (!Number.isFinite(result.width) || result.width <= 0 || !Number.isFinite(result.scroll)) return;
      preview.set({ ...result, ratio: result.width / width, translate: originalScroll.get() - result.scroll });
    },
    onFinalize: e => {
      if (!running.get()) return;
      running.set(false);
      const prepared = ready.get(), p = preview.get(); ready.set(false);
      // RNGH State: CANCELLED=3, FAILED=1. An interrupted gesture releases locks without a density commit.
      scheduleOnRN(finish, sequence.get(), p.width, p.scroll, !prepared || e?.state === 3 || e?.state === 1);
    },
  });
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: preview.get().translate }, { scaleX: preview.get().ratio }] }));
  const labelStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: 1 / preview.get().ratio }] }));
  const previewTo = useCallback((nextWidth, scroll) => {
    const o = latest.current, result = validZoomCommit(nextWidth, scroll, o.span, o.viewportWidth);
    if (!result) return;
    const offset = o.getScroll();
    preview.set({ ...result, ratio: result.width / o.width, translate: (Number.isFinite(offset) ? offset : 0) - result.scroll });
  }, [preview]);
  const handle = useRef({});
  Object.assign(handle.current, { gesture, style, labelStyle, reset, previewTo });
  return handle.current;
}

export function TimelinePinchArea({ pinch, children }) {
  return <GestureDetector gesture={pinch.gesture}><View collapsable={false} style={{ flex: 1 }}>{children}</View></GestureDetector>;
}
export function TimelinePinchCanvas({ pinch, style, children }) {
  return <Animated.View style={[style, { transformOrigin: 'top left' }, pinch.style]}>{children}</Animated.View>;
}
export function TimelinePinchLabel({ pinch, style, center = false, children }) {
  return <Animated.View style={[style, { transformOrigin: center ? 'center' : 'left center' }, pinch.labelStyle]}>{children}</Animated.View>;
}
