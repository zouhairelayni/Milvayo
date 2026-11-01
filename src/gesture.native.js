import { useCallback, useEffect, useRef, useState } from 'react';
import { usePanGesture, useTapGesture, useCompetingGestures } from 'react-native-gesture-handler';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

// Android/iOS: RNGH 3 hook-based gestures and Reanimated 4 UI-thread motion.
// JS receives only discrete lift/drop/target updates; never animated frame positions.
const DOUBLE_MS = 350;
export function useHoldDrag({ holdMs = 350, axis = 'xy', titleRef, getScroll, onTap, onTitleDoubleTap, onLift, onMove, onDrop }) {
  const callbacks = useRef({});
  callbacks.current = { getScroll, onTap, onTitleDoubleTap, onLift, onMove, onDrop };
  const [lifted, setLifted] = useState(false);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const lastX = useSharedValue(0);
  const lastY = useSharedValue(0);
  const active = useRef(false);
  const initial = useRef({ x: 0, y: 0 });
  const tapped = useRef({ at: 0, timer: null });
  const titleNode = useRef(titleRef);
  titleNode.current = titleRef;

  const getOffset = useCallback((dx, dy) => {
    const sc = callbacks.current.getScroll?.() || { x: 0, y: 0 };
    return { cx: dx + (sc.x - initial.current.x), cy: axis === 'x' ? 0 : dy + (sc.y - initial.current.y) };
  }, [axis]);
  const begin = useCallback(() => {
    const sc = callbacks.current.getScroll?.() || { x: 0, y: 0 };
    initial.current = { x: sc.x, y: sc.y };
    active.current = true;
    setLifted(true);
    callbacks.current.onLift?.();
  }, []);
  const move = useCallback((dx, dy, px, py) => {
    if (!active.current) return;
    const { cx, cy } = getOffset(dx, dy);
    callbacks.current.onMove?.(cx, cy, px, py);
  }, [getOffset]);
  const finish = useCallback((dx, dy, px, py, success) => {
    if (!active.current) return;
    const { cx, cy } = getOffset(dx, dy);
    active.current = false;
    setLifted(false);
    // Cancellation has no scheduling commit but must release source scroll locks.
    if (success) callbacks.current.onDrop?.(cx, cy, px, py);
    else callbacks.current.onDrop?.(0, 0, px, py);
  }, [getOffset]);
  const tapAt = useCallback((pageY) => {
    const title = titleNode.current?.current;
    const double = callbacks.current.onTitleDoubleTap;
    if (!title || !double) { callbacks.current.onTap?.(); return; }
    title.measure((_x, _y, _w, h, _px, py) => {
      const isTitle = pageY >= py && pageY <= py + h;
      const now = Date.now();
      if (isTitle && now - tapped.current.at <= DOUBLE_MS) {
        clearTimeout(tapped.current.timer); tapped.current.at = 0; double();
      } else if (isTitle) {
        tapped.current.at = now;
        clearTimeout(tapped.current.timer);
        tapped.current.timer = setTimeout(() => callbacks.current.onTap?.(), DOUBLE_MS);
      } else { tapped.current.at = 0; callbacks.current.onTap?.(); }
    });
  }, []);
  useEffect(() => () => { clearTimeout(tapped.current.timer); active.current = false; }, []);

  const pan = usePanGesture({
    activateAfterLongPress: holdMs,
    minDistance: 0,
    maxPointers: 1,
    onActivate: () => {
      x.value = 0; y.value = 0; lastX.value = 0; lastY.value = 0;
      scheduleOnRN(begin);
    },
    onUpdate: (e) => {
      const dx = e.translationX;
      const dy = axis === 'x' ? 0 : e.translationY;
      x.value = dx; y.value = dy;
      // UI thread handles every frame. JS only needs coarsely sampled drop-target updates.
      if (Math.abs(dx - lastX.value) + Math.abs(dy - lastY.value) >= 10) {
        lastX.value = dx; lastY.value = dy;
        scheduleOnRN(move, dx, dy, e.absoluteX, e.absoluteY);
      }
    },
    onDeactivate: (e) => {
      if (!e.canceled) {
        scheduleOnRN(finish, e.translationX, e.translationY, e.absoluteX, e.absoluteY, true);
        // Persisted task/list coordinates are updated by the drop, so reset immediately.
        x.value = 0; y.value = 0;
      }
    },
    onFinalize: (e) => {
      if (e.canceled) {
        x.value = withTiming(0, { duration: 115 });
        y.value = withTiming(0, { duration: 115 });
        scheduleOnRN(finish, 0, 0, 0, 0, false);
      }
    },
  });
  const tap = useTapGesture({
    maxDistance: 8,
    onDeactivate: (e) => {
      if (!e.canceled) scheduleOnRN(tapAt, e.absoluteY);
    },
  });
  const gesture = useCompetingGestures(pan, tap);
  return { gesture, x, y, lifted };
}
