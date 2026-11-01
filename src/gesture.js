import { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Platform } from 'react-native';

const SLOP = 8;
const DOUBLE_MS = 350;
const TICK_MS = 30;
const IS_WEB = Platform.OS === 'web' && typeof document !== 'undefined';

// One gesture hook shared by lists and task cards. It turns a touch into:
//  - tap: a short press that doesn't move (onTap)
//  - title double-tap: two taps on the title element within DOUBLE_MS (onTitleDoubleTap)
//  - hold and drag: after holdMs without moving, the item lifts and follows the finger
//
// While lifted, the hook ticks every TICK_MS. Each tick re-applies the offset, so the item
// stays under the finger even when the owner auto-scrolls the containers (getScroll).
// onMove(x, y, pageX, pageY) and onDrop(x, y, pageX, pageY) get the offset in content space:
// finger movement plus any scroll since the lift.
// Movement goes through an Animated value, so dragging doesn't re-render the screen.
//
// On web, once lifted the hook follows the finger with its own document listeners. The browser's
// responder system drops the PanResponder whenever a parent ScrollView scrolls (including our
// own auto-scroll), which used to end the drag early.
export function useHoldDrag({ holdMs = 350, axis = 'xy', titleRef, getScroll, onTap, onTitleDoubleTap, onLift, onMove, onDrop }) {
  const cb = useRef({});
  cb.current = { getScroll, onTap, onTitleDoubleTap, onLift, onMove, onDrop };

  const [lifted, setLifted] = useState(false);
  const offsetRef = useRef(null);
  if (!offsetRef.current) offsetRef.current = new Animated.ValueXY({ x: 0, y: 0 });
  const offset = offsetRef.current;

  const st = useRef({
    timer: null, openTimer: null, tick: null, detach: null,
    active: false, moved: false, justDropped: false, pageY: 0, lastTitleTap: 0,
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
  const detachDoc = () => {
    if (st.current.detach) st.current.detach();
  };

  const scrollNow = () => (cb.current.getScroll ? cb.current.getScroll() : { x: 0, y: 0 });

  // Offset in content space: finger movement since the lift, plus scroll since the lift.
  const place = () => {
    const s = st.current;
    const sc = scrollNow();
    const x = (s.px - s.x0) + (sc.x - s.base.x);
    const y = axis === 'x' ? 0 : (s.py - s.y0) + (sc.y - s.base.y);
    return { x, y };
  };

  const sync = () => {
    const s = st.current;
    const { x, y } = place();
    offset.setValue({ x, y });
    if (cb.current.onMove) cb.current.onMove(x, y, s.px, s.py);
  };

  const handleTap = (pageY) => {
    const node = titleRef && titleRef.current;
    if (!node || !cb.current.onTitleDoubleTap) {
      if (cb.current.onTap) cb.current.onTap();
      return;
    }
    node.measure((x, y, w, h, px, py) => {
      const inTitle = pageY >= py && pageY <= py + h;
      const now = Date.now();
      if (inTitle && now - st.current.lastTitleTap < DOUBLE_MS) {
        clearTimeout(st.current.openTimer);
        st.current.lastTitleTap = 0;
        cb.current.onTitleDoubleTap();
        return;
      }
      clearTimeout(st.current.openTimer);
      if (inTitle) {
        // A single tap on the title waits briefly, in case a second tap follows.
        st.current.lastTitleTap = now;
        st.current.openTimer = setTimeout(() => {
          if (cb.current.onTap) cb.current.onTap();
        }, DOUBLE_MS);
      } else {
        st.current.lastTitleTap = 0;
        if (cb.current.onTap) cb.current.onTap();
      }
    });
  };

  const end = (allowTap) => {
    clearHold();
    const s = st.current;
    if (s.active) {
      clearTick();
      detachDoc();
      const { x, y } = place();
      s.active = false;
      s.justDropped = true; // the PanResponder's own release may still follow: it must not count as a tap
      setLifted(false);
      offset.setValue({ x: 0, y: 0 });
      if (cb.current.onDrop) cb.current.onDrop(x, y, s.px, s.py);
    } else if (s.justDropped) {
      s.justDropped = false;
    } else if (allowTap && !s.moved) {
      handleTap(s.pageY);
    }
    s.moved = false;
  };

  // Web only: follow the finger (or mouse) at document level while lifted.
  const attachDoc = () => {
    if (!IS_WEB || st.current.detach) return;
    const move = (e) => {
      if (e.cancelable) e.preventDefault(); // keeps the browser from scrolling the page under the drag
      const p = e.touches && e.touches[0] ? e.touches[0] : e;
      st.current.px = p.pageX;
      st.current.py = p.pageY;
      sync();
    };
    const up = () => end(false);
    const noMenu = (e) => e.preventDefault(); // a long press would otherwise open the browser menu
    document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('mousemove', move);
    document.addEventListener('touchend', up);
    document.addEventListener('touchcancel', up);
    document.addEventListener('mouseup', up);
    document.addEventListener('contextmenu', noMenu);
    st.current.detach = () => {
      document.removeEventListener('touchmove', move);
      document.removeEventListener('mousemove', move);
      document.removeEventListener('touchend', up);
      document.removeEventListener('touchcancel', up);
      document.removeEventListener('mouseup', up);
      document.removeEventListener('contextmenu', noMenu);
      st.current.detach = null;
    };
  };

  const pr = useRef(null);
  if (!pr.current) {
    pr.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => !st.current.active,
      onPanResponderGrant: (evt) => {
        const s = st.current;
        s.pageY = evt.nativeEvent.pageY;
        s.px = evt.nativeEvent.pageX;
        s.py = evt.nativeEvent.pageY;
        s.moved = false;
        s.active = false;
        s.justDropped = false;
        clearHold();
        s.timer = setTimeout(() => {
          const t = st.current;
          t.timer = null;
          t.active = true;
          // The lift is the new origin: nothing jumps when the item lifts.
          t.x0 = t.px;
          t.y0 = t.py;
          const sc = scrollNow();
          t.base = { x: sc.x, y: sc.y }; // copy: the owner mutates its scroll object in place
          attachDoc();
          setLifted(true);
          if (cb.current.onLift) cb.current.onLift();
          clearTick();
          t.tick = setInterval(sync, TICK_MS);
          sync();
        }, holdMs);
      },
      onPanResponderMove: (evt, g) => {
        const s = st.current;
        if (s.active && IS_WEB) return; // the document listeners own the drag on web
        s.px = evt.nativeEvent.pageX;
        s.py = evt.nativeEvent.pageY;
        if (!s.active) {
          if (Math.abs(g.dx) > SLOP || Math.abs(g.dy) > SLOP) {
            s.moved = true;
            clearHold();
          }
          return;
        }
        sync();
      },
      onPanResponderRelease: () => end(true),
      onPanResponderTerminate: () => {
        // On web a parent scroll terminates the responder; the drag carries on through the document listeners.
        if (st.current.active && IS_WEB) return;
        end(false);
      },
    });
  }

  // Stop any pending timers and listeners when the item unmounts.
  useEffect(
    () => () => {
      clearTimeout(st.current.timer);
      clearTimeout(st.current.openTimer);
      clearInterval(st.current.tick);
      if (st.current.detach) st.current.detach();
    },
    []
  );

  return { panHandlers: pr.current.panHandlers, lifted, offset };
}
