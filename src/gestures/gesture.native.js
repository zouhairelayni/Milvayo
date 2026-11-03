// /src/gestures/gesture.native.js
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePanGesture, useTapGesture, useCompetingGestures } from 'react-native-gesture-handler';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
const follow = require('./dragFollow.cjs');

// Android/iOS: RNGH 3 hook-based gestures and Reanimated 4 UI-thread motion.
// JS receives only discrete lift/drop/target updates; never animated frame positions.
//
// Scrolling while dragging (0.5.15 fix): the dragged item lives inside a scrolled container. When the owner
// auto-scrolls that container, the item has to move by the same amount or it is left behind. A small
// requestAnimationFrame loop (only while lifted) copies "scroll since lift" into scrollX/scrollY shared values,
// which the UI thread adds to the finger translation. The same loop beats `onBeat` every frame so the owner can
// tell a live drag from a dead one, and it asks for a drop-target refresh while the container scrolls.
// A drag that ends in ANY way (release, cancel, view unmounted) always reaches onDrop or onCancel.
const DOUBLE_MS = 350;
const MOVE_EVERY_MS = 60;   // drop-target refresh while only the scroll is changing
const SETTLE_MS = 160;      // a finished gesture that never reported success is closed after this
export function useHoldDrag({ holdMs = 350, axis = 'xy', titleRef, getScroll, onTap, onTitleDoubleTap, onLift, onMove, onDrop, onCancel, onBeat }) {
  const callbacks = useRef({});
  callbacks.current = { getScroll, onTap, onTitleDoubleTap, onLift, onMove, onDrop, onCancel, onBeat };
  const [lifted, setLifted] = useState(false);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const lastX = useSharedValue(0);
  const lastY = useSharedValue(0);
  const curX = useSharedValue(0);      // latest finger travel, every frame (lastX/lastY are only the last one sent to JS)
  const curY = useSharedValue(0);
  const absX = useSharedValue(-1);     // latest finger position on screen; -1 until the finger has reported one
  const absY = useSharedValue(-1);
  const scrollX = useSharedValue(0);   // container scroll since the lift: added to the translation on the UI thread
  const scrollY = useSharedValue(0);
  const active = useRef(false);
  const initial = useRef({ x: 0, y: 0 });
  const seen = useRef({ x: 0, y: 0 });
  const frame = useRef(null);
  const settleTimer = useRef(null);
  const lastMoveAt = useRef(0);
  const tapped = useRef({ at: 0, timer: null });
  const titleNode = useRef(titleRef);
  titleNode.current = titleRef;

  const getOffset = useCallback((dx, dy) => {
    const sc = callbacks.current.getScroll?.() || { x: 0, y: 0 };
    return { cx: dx + (sc.x - initial.current.x), cy: axis === 'x' ? 0 : dy + (sc.y - initial.current.y) };
  }, [axis]);
  const stopLoop = useCallback(() => {
    if (frame.current != null) cancelAnimationFrame(frame.current);
    frame.current = null;
  }, []);
  const begin = useCallback(() => {
    const sc = callbacks.current.getScroll?.() || { x: 0, y: 0 };
    initial.current = { x: sc.x, y: sc.y };
    seen.current = { x: 0, y: 0 };
    scrollX.value = 0; scrollY.value = 0;
    active.current = true;
    setLifted(true);
    callbacks.current.onLift?.();
    stopLoop();
    const loop = () => {
      frame.current = null;
      if (!active.current) return;
      const cb = callbacks.current;
      if (cb.onBeat) cb.onBeat();
      const moved = follow.scrollSince(cb.getScroll ? cb.getScroll() : null, initial.current, axis);
      if (moved.x !== seen.current.x || moved.y !== seen.current.y) {
        seen.current = moved;
        scrollX.value = moved.x;
        scrollY.value = moved.y;
        const now = Date.now();
        // The finger may be perfectly still while the chart scrolls: refresh the drop target (and resize preview) anyway.
        if (cb.onMove && absX.value >= 0 && now - lastMoveAt.current >= MOVE_EVERY_MS) {
          lastMoveAt.current = now;
          const o = getOffset(curX.value, axis === 'x' ? 0 : curY.value);
          cb.onMove(o.cx, o.cy, absX.value, absY.value);
        }
      }
      frame.current = requestAnimationFrame(loop);
    };
    frame.current = requestAnimationFrame(loop);
  }, [axis, getOffset, stopLoop, scrollX, scrollY, absX, absY, curX, curY]);
  const move = useCallback((dx, dy, px, py) => {
    if (!active.current) return;
    const { cx, cy } = getOffset(dx, dy);
    lastMoveAt.current = Date.now();
    callbacks.current.onMove?.(cx, cy, px, py);
  }, [getOffset]);
  const finish = useCallback((dx, dy, px, py, success) => {
    if (!active.current) return;
    const { cx, cy } = getOffset(dx, dy);
    active.current = false;
    stopLoop();
    scrollX.value = 0; scrollY.value = 0;
    setLifted(false);
    // Cancellation has no scheduling commit but must release source scroll locks.
    if (success) callbacks.current.onDrop?.(cx, cy, px, py);
    else callbacks.current.onCancel?.();
  }, [getOffset, stopLoop, scrollX, scrollY]);
  // The gesture is over. Success is normally reported first (onDeactivate); if nothing did, close the drag as a
  // cancel so the owner never keeps a half-finished drag (and its auto-scroll) alive.
  const settle = useCallback(() => {
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      settleTimer.current = null;
      if (active.current) finish(0, 0, 0, 0, false);
    }, SETTLE_MS);
  }, [finish]);
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
  // If the bar's view disappears mid-drag, the gesture can never report its end. Close the drag here.
  useEffect(() => () => {
    clearTimeout(tapped.current.timer);
    clearTimeout(settleTimer.current);
    stopLoop();
    if (active.current) {
      active.current = false;
      callbacks.current.onCancel?.();
    }
  }, [stopLoop]);

  const pan = usePanGesture({
    activateAfterLongPress: holdMs,
    minDistance: 0,
    maxPointers: 1,
    onActivate: () => {
      x.value = 0; y.value = 0; lastX.value = 0; lastY.value = 0;
      curX.value = 0; curY.value = 0; absX.value = -1; absY.value = -1;
      scheduleOnRN(begin);
    },
    onUpdate: (e) => {
      const dx = e.translationX;
      const dy = axis === 'x' ? 0 : e.translationY;
      x.value = dx; y.value = dy;
      curX.value = dx; curY.value = dy; absX.value = e.absoluteX; absY.value = e.absoluteY;
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
        x.value = 0; y.value = 0; scrollX.value = 0; scrollY.value = 0;
      }
    },
    onFinalize: (e) => {
      if (e.canceled) {
        x.value = withTiming(0, { duration: 115 });
        y.value = withTiming(0, { duration: 115 });
        scrollX.value = withTiming(0, { duration: 115 });
        scrollY.value = withTiming(0, { duration: 115 });
        scheduleOnRN(finish, 0, 0, 0, 0, false);
      } else {
        scheduleOnRN(settle);
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
  return { gesture, x, y, scrollX, scrollY, lifted };
}
