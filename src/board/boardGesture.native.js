// /src/board/boardGesture.native.js
import { useEffect, useRef, useState } from 'react';
import { PanResponder } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { dragOffset, hasScrolledBeforeHold } from './boardDragMath.cjs';
import { hitTitle, isDoubleTap } from './boardInteractions.cjs';

const SLOP = 8;
const DOUBLE_MS = 350;
const TICK_MS = 30;
const pendingHolds = new Set();
export function cancelPendingBoardHolds() {
  pendingHolds.forEach(cancel => cancel());
}


// One gesture hook shared by lists and task cards. It turns a touch into:
//  - tap: a short press that doesn't move (onTap)
//  - title double-tap: two taps on the title element within DOUBLE_MS (onTitleDoubleTap)
//  - hold and drag: after holdMs without moving, the item lifts and follows the finger
//
// While lifted, the hook ticks every TICK_MS. Each tick re-applies the offset, so the item
// stays under the finger even when the owner auto-scrolls the containers (getScroll).
// onMove(x, y, pageX, pageY) and onDrop(x, y, pageX, pageY) get the offset in content space:
// finger movement plus any scroll since the lift.
// Native motion is drawn with Reanimated shared values; dragging doesn't re-render the screen.
export function useHoldDrag({ holdMs = 350, axis = 'xy', titleRef, getScroll, onTap, onTitleDoubleTap, onLift, onMove, onDrop, onCancel }) {
  const cb = useRef({});
  cb.current = { getScroll, onTap, onTitleDoubleTap, onLift, onMove, onDrop, onCancel };

  const [lifted, setLifted] = useState(false);
  // Reanimated owns the native view transforms; the tested MockDesign responder
  // owns the hold / cancellation / scrolling policy. No Animated.Value or JS timing.
  const xValue = useSharedValue(0);
  const yValue = useSharedValue(0);
  const offset = useRef({ x: xValue, y: yValue }).current;
  const setOffset = (position) => {
    xValue.value = position.x;
    yValue.value = position.y;
  };

  const st = useRef({
    timer: null, openTimer: null, tick: null,
    active: false, moved: false, justDropped: false, pageX: 0, pageY: 0, lastTitleTap: 0, tapSerial: 0,
    x0: 0, y0: 0,           // finger position at the lift
    px: 0, py: 0,           // latest finger position
    base: { x: 0, y: 0 },   // scroll position at the lift (a copy, not the live object)
  });

  const clearHold = () => {
    clearTimeout(st.current.timer);
    st.current.timer = null;
  };
  const clearTick = () => {
    clearInterval(st.current.tick);
    st.current.tick = null;
  };

  const scrollNow = () => (cb.current.getScroll ? cb.current.getScroll() : { x: 0, y: 0 });

  // Offset in content space: finger movement since the lift, plus scroll since the lift.
  const place = () => {
    const s = st.current;
    const sc = scrollNow();
    return dragOffset(
      { x: s.px, y: s.py },
      { x: s.x0, y: s.y0 },
      sc, s.base, axis
    );
  };

  const sync = () => {
    const s = st.current;
    const { x, y } = place();
    setOffset({ x, y });
    if (cb.current.onMove) cb.current.onMove(x, y, s.px, s.py);
  };

  // Use both axes when checking the title. Native may flatten ref-only Views,
  // so Board marks the title hit area collapsable={false} before calling measure.
  const handleTap = (point) => {
    const node = titleRef?.current;
    if (!node || typeof node.measure !== 'function' || !cb.current.onTitleDoubleTap) {
      cb.current.onTap?.();
      return;
    }
    const serial = ++st.current.tapSerial;
    node.measure((_x, _y, w, h, px, py) => {
      // An async measurement from an older tap must never reopen the task sheet.
      if (serial !== st.current.tapSerial || st.current.active) return;
      const inTitle = hitTitle({ x: px, y: py, width: w, height: h }, point);
      const now = Date.now();
      if (inTitle && isDoubleTap(now, st.current.lastTitleTap, DOUBLE_MS)) {
        clearTimeout(st.current.openTimer);
        st.current.openTimer = null;
        st.current.lastTitleTap = 0;
        cb.current.onTitleDoubleTap?.();
      } else if (inTitle) {
        // Single tap opens the sheet, but leave a brief window for title editing.
        st.current.lastTitleTap = now;
        clearTimeout(st.current.openTimer);
        st.current.openTimer = setTimeout(() => {
          st.current.openTimer = null;
          st.current.lastTitleTap = 0;
          cb.current.onTap?.();
        }, DOUBLE_MS);
      } else {
        st.current.lastTitleTap = 0;
        cb.current.onTap?.();
      }
    });
  };

  const end = (allowTap, cancelled = false) => {
    clearHold();
    const s = st.current;
    if (s.active) {
      clearTick();
      const { x, y } = place();
      s.active = false;
      s.justDropped = true;
      setLifted(false);
      setOffset({ x: 0, y: 0 });
      if (cancelled) cb.current.onCancel?.();
      else cb.current.onDrop?.(x, y, s.px, s.py);
    } else if (s.justDropped) {
      s.justDropped = false;
    } else if (allowTap && !s.moved) {
      handleTap({ x: s.px, y: s.py });
    }
    s.moved = false;
  };

  // Native: do not seize responder at finger-down. ScrollViews must be able to
  // recognise vertical / horizontal pans before the hold threshold. Touch
  // handlers observe the initial finger-down without claiming the responder;
  // PanResponder only claims MOVE events after the stationary hold succeeds.
  const beginTouch = (evt) => {
    const point = evt.nativeEvent;
    const s = st.current;
    clearHold();
    // The first title tap remains eligible for a double tap, but its delayed
    // sheet opening must not fire underneath a second touch or a swipe.
    clearTimeout(s.openTimer);
    s.openTimer = null;
    s.tapSerial += 1;
    s.pageX = point.pageX;
    s.pageY = point.pageY;
    s.px = point.pageX;
    s.py = point.pageY;
    s.startX = point.pageX;
    s.startY = point.pageY;
    s.moved = false;
    s.active = false;
    s.justDropped = false;
    // Do not cancel the pending first tap here: title double-tap uses it.
    s.timer = setTimeout(() => {
      const t = st.current;
      t.timer = null;
      if (t.moved || t.active) return;
      t.active = true;
      t.lastTitleTap = 0;
      clearTimeout(t.openTimer);
      t.openTimer = null;
      t.x0 = t.px;
      t.y0 = t.py;
      const sc = scrollNow();
      t.base = { x: sc.x, y: sc.y };
      setLifted(true);
      cb.current.onLift?.();
      clearTick();
      t.tick = setInterval(sync, TICK_MS);
      sync();
    }, holdMs);
  };
  const moveTouch = (evt) => {
    const s = st.current;
    const point = evt.nativeEvent;
    if (!Number.isFinite(point.pageX) || !Number.isFinite(point.pageY)) return;
    s.px = point.pageX;
    s.py = point.pageY;
    if (!s.active) {
      if (hasScrolledBeforeHold(s.px - s.startX, s.py - s.startY, SLOP)) {
        s.moved = true;
        s.lastTitleTap = 0;
        clearHold();
        clearTimeout(s.openTimer);
        s.openTimer = null;
      }
      return;
    }
    sync();
  };
  const pr = useRef(null);
  if (!pr.current) {
    pr.current = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: () => st.current.active,
      onMoveShouldSetPanResponderCapture: () => st.current.active,
      onPanResponderTerminationRequest: () => !st.current.active,
      onPanResponderMove: (evt) => moveTouch(evt),
      onPanResponderRelease: () => end(true),
      onPanResponderTerminate: () => end(false, true),
    });
  }

  // A ScrollView may take the responder before the child sees touch movement.
  // Beginning a native scroll cancels every pending stationary hold.
  useEffect(() => {
    const cancelPending = () => {
      if (st.current.active) return;
      st.current.moved = true;
      st.current.lastTitleTap = 0;
      clearHold();
      clearTimeout(st.current.openTimer);
      st.current.openTimer = null;
    };
    pendingHolds.add(cancelPending);
    return () => pendingHolds.delete(cancelPending);
  }, []);

  // Stop any pending timers when the item unmounts.
  useEffect(
    () => () => {
      clearTimeout(st.current.timer);
      clearTimeout(st.current.openTimer);
      clearInterval(st.current.tick);
    },
    []
  );

  return { panHandlers: {
    ...pr.current.panHandlers,
    onTouchStart: beginTouch,
    onTouchMove: moveTouch,
    onTouchEnd: () => end(true),
    onTouchCancel: () => end(false, true),
  }, lifted, offset };
}
