// /src/gestures/gesture.web.js
import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

// Browser-only long-press dragging. Unlike the legacy PanResponder implementation,
// pointer-down does NOT claim the React Native responder. ScrollViews can therefore
// handle ordinary swipes and wheel/trackpad scrolling without responder rejections.
// Native apps continue to use gesture.native.js.
const SLOP = 8;
const DOUBLE_MS = 350;
const TICK_MS = 30;

export function useHoldDrag({ holdMs = 350, axis = 'xy', titleRef, getScroll, onTap, onTitleDoubleTap, onLift, onMove, onDrop, onCancel, onBeat }) {
  const callbacks = useRef({});
  callbacks.current = { getScroll, onTap, onTitleDoubleTap, onLift, onMove, onDrop, onCancel, onBeat };
  const [lifted, setLifted] = useState(false);
  const offsetRef = useRef(null);
  if (!offsetRef.current) offsetRef.current = new Animated.ValueXY({ x: 0, y: 0 });
  const offset = offsetRef.current;
  const state = useRef({
    tracking: false, active: false, moved: false, pointerId: null,
    startX: 0, startY: 0, x: 0, y: 0, baseX: 0, baseY: 0,
    timer: null, tick: null, detach: null, tapTimer: null, lastTitleTap: 0,
    tapSerial: 0,
  });

  const scrollNow = () => callbacks.current.getScroll?.() || { x: 0, y: 0 };
  const position = () => {
    const s = state.current;
    const scroll = scrollNow();
    return {
      x: s.x - s.startX + scroll.x - s.baseX,
      y: axis === 'x' ? 0 : s.y - s.startY + scroll.y - s.baseY,
    };
  };
  const sync = () => {
    const { x, y } = position();
    offset.setValue({ x, y });
    callbacks.current.onMove?.(x, y, state.current.x, state.current.y);
  };
  const clearHold = () => {
    clearTimeout(state.current.timer);
    state.current.timer = null;
  };
  const clearTick = () => {
    clearInterval(state.current.tick);
    state.current.tick = null;
  };
  const detach = () => {
    const d = state.current.detach;
    state.current.detach = null;
    d?.();
  };
  const handleTap = (point) => {
    const node = titleRef?.current;
    if (!node?.measure || !callbacks.current.onTitleDoubleTap) {
      callbacks.current.onTap?.();
      return;
    }
    const serial = ++state.current.tapSerial;
    node.measure((_, __, width, height, left, top) => {
      if (serial !== state.current.tapSerial) return;
      const inside = point.x >= left && point.x <= left + width && point.y >= top && point.y <= top + height;
      const now = Date.now();
      if (inside && state.current.lastTitleTap && now - state.current.lastTitleTap < DOUBLE_MS) {
        clearTimeout(state.current.tapTimer);
        state.current.lastTitleTap = 0;
        callbacks.current.onTitleDoubleTap?.();
      } else if (inside) {
        state.current.lastTitleTap = now;
        clearTimeout(state.current.tapTimer);
        state.current.tapTimer = setTimeout(() => callbacks.current.onTap?.(), DOUBLE_MS);
      } else {
        state.current.lastTitleTap = 0;
        callbacks.current.onTap?.();
      }
    });
  };
  const finish = (allowTap) => {
    const s = state.current;
    if (!s.tracking) return;
    clearHold();
    clearTick();
    s.tracking = false;
    const wasActive = s.active;
    s.active = false;
    detach();
    if (wasActive) {
      const { x, y } = position();
      setLifted(false);
      offset.setValue({ x: 0, y: 0 });
      if (allowTap) callbacks.current.onDrop?.(x, y, s.x, s.y);
      else callbacks.current.onCancel?.();
    } else if (allowTap && !s.moved) {
      handleTap({ x: s.x, y: s.y });
    }
    s.moved = false;
    s.pointerId = null;
  };
  const cancel = () => finish(false);

  const onPointerDown = (event) => {
    const e = event.nativeEvent || event;
    if (state.current.tracking || (typeof e.button === 'number' && e.button !== 0)) return;
    if (typeof document === 'undefined') return;
    // Prevent nested cards from also starting a drag on their list header.
    // Stop propagation without preventing the browser's scrolling default.
    event.stopPropagation?.();
    const s = state.current;
    s.pointerId = e.pointerId;
    s.startX = s.x = e.pageX;
    s.startY = s.y = e.pageY;
    s.moved = false;
    s.active = false;
    s.tracking = true;
    clearHold();

    const move = (ev) => {
      if (!s.tracking || (s.pointerId != null && ev.pointerId !== s.pointerId)) return;
      s.x = ev.pageX;
      s.y = ev.pageY;
      if (!s.active) {
        if (Math.abs(s.x - s.startX) > SLOP || Math.abs(s.y - s.startY) > SLOP) {
          s.moved = true;
          clearHold();
          // Release document listeners after scroll wins; no extra React renders.
          finish(false);
        }
        return;
      }
      if (ev.cancelable) ev.preventDefault();
      sync();
    };
    const up = (ev) => {
      if (s.pointerId != null && ev.pointerId !== s.pointerId) return;
      s.x = ev.pageX;
      s.y = ev.pageY;
      finish(true);
    };
    const stopped = (ev) => {
      if (s.pointerId != null && ev.pointerId !== s.pointerId) return;
      cancel();
    };
    document.addEventListener('pointermove', move, { passive: false });
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', stopped);
    s.detach = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointercancel', stopped);
    };
    s.timer = setTimeout(() => {
      if (!s.tracking || s.moved) return;
      s.timer = null;
      s.active = true;
      const sc = scrollNow();
      s.baseX = sc.x;
      s.baseY = sc.y;
      setLifted(true);
      callbacks.current.onLift?.();
      // Touch browsers turn a moving finger into a page pan and send pointercancel a few moves later, which
      // used to end every drag on a phone (verified in Chromium with touch emulation: cancel after 3 moves).
      // A non-passive touchmove handler registered once the item is lifted stops the pan, so the pointer keeps
      // reporting until the finger is released. Text selection and the long-press menu are blocked the same way.
      const block = (ev) => { if (ev.cancelable) ev.preventDefault(); };
      document.addEventListener('touchmove', block, { passive: false });
      document.addEventListener('selectstart', block);
      document.addEventListener('contextmenu', block);
      const earlier = s.detach;
      s.detach = () => {
        document.removeEventListener('touchmove', block);
        document.removeEventListener('selectstart', block);
        document.removeEventListener('contextmenu', block);
        s.detach = null;
        earlier?.();
      };
      // The beat tells the owner a drag is alive; if it stops, the owner drops whatever the drag started.
      s.tick = setInterval(() => { callbacks.current.onBeat?.(); sync(); }, TICK_MS);
      sync();
    }, holdMs);
    // Never preventDefault or capture the pointer at contact. Stop only React
    // bubbling to parent draggable cards/lists; browser scrolling stays native.
  };

  useEffect(() => () => {
    clearHold();
    clearTick();
    clearTimeout(state.current.tapTimer);
    // The view went away mid-drag: no pointerup will be handled, so end the drag here instead of leaving it stuck.
    const wasActive = state.current.active;
    state.current.active = false;
    state.current.tracking = false;
    detach();
    if (wasActive) callbacks.current.onCancel?.();
  }, []);
  return { panHandlers: { onPointerDown, onContextMenu: (event) => { if (state.current.active) event.preventDefault?.(); } }, lifted, offset };
}
