// /src/gestures/TimelinePinch.js
import { useCallback, useEffect, useRef } from 'react';
import { View } from 'react-native';
const { pinchZoom } = require('../timeline/timelineZoom.cjs');

export function useTimelinePinch(options) {
  const latest = useRef(options); latest.current = options;
  const surfaces = useRef(new Set());
  const reset = useCallback(() => {
    for (const node of surfaces.current) node.style.transform = 'translateX(0px) scaleX(1)';
  }, []);
  return { latest, surfaces, reset };
}

export function TimelinePinchCanvas({ pinch, style, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current; pinch.surfaces.current.add(node);
    return () => { pinch.surfaces.current.delete(node); };
  }, [pinch.surfaces]);
  return <View ref={ref} style={[style, { transformOrigin: 'top left' }]}>{children}</View>;
}

export function TimelinePinchArea({ pinch, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    let session = null, waiting = false;
    // Pinch belongs to the chart; ordinary horizontal/vertical scrolling remains native.
    host.style.touchAction = 'pan-x pan-y';
    const point = e => e.clientX - host.getBoundingClientRect().left;
    const pair = touches => ({ anchor: (point(touches[0]) + point(touches[1])) / 2, distance: Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY) });
    const paint = result => {
      const ratio = result.width / session.originalWidth, translate = session.originalScroll - result.scroll;
      for (const node of pinch.surfaces.current) node.style.transform = `translateX(${translate}px) scaleX(${ratio})`;
      session.result = result;
    };
    const start = e => {
      const o = pinch.latest.current;
      if (!o.enabled || e.touches.length < 2) return;
      e.preventDefault();
      if (!session) {
        o.onStart();
        const scroll = o.getScroll();
        session = { originalWidth: o.width, originalScroll: scroll, result: { width: o.width, scroll } };
      }
      Object.assign(session, pair(e.touches), { basis: session.result, count: e.touches.length });
    };
    const move = e => {
      if (!session || e.touches.length < 2) return;
      e.preventDefault();
      if (session.count !== e.touches.length) { start(e); return; }
      const p = pair(e.touches), o = pinch.latest.current;
      if (session.distance > 0) paint(pinchZoom(session.basis.width, Math.max(0.25, Math.min(4, p.distance / session.distance)), session.anchor, p.anchor, session.basis.scroll, o.span, o.viewportWidth, session.originalWidth));
    };
    const end = e => {
      if (session && e.touches.length < 2) {
        pinch.latest.current.onCommit(session.result.width, session.result.scroll);
        session = null; waiting = true;
      } else if (session) start(e);
      if (!e.touches.length && waiting) { waiting = false; pinch.latest.current.onEnd(); }
    };
    const cancel = () => {
      if (session) pinch.latest.current.onCommit(session.result.width, session.result.scroll);
      session = null; waiting = false; pinch.latest.current.onEnd();
    };
    const wheel = e => {
      const o = pinch.latest.current;
      if (!e.ctrlKey || !o.enabled || session) return;
      e.preventDefault(); o.onStart();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? o.viewportWidth : 1;
      const focal = point(e);
      const result = pinchZoom(o.width, Math.max(0.25, Math.min(4, Math.exp(-e.deltaY * unit * 0.01))), focal, focal, o.getScroll(), o.span, o.viewportWidth);
      o.onCommit(result.width, result.scroll); o.onEnd();
    };
    const listeners = { touchstart: start, touchmove: move, touchend: end, touchcancel: cancel, wheel };
    for (const [name, fn] of Object.entries(listeners)) host.addEventListener(name, fn, { passive: false, capture: true });
    return () => {
      for (const [name, fn] of Object.entries(listeners)) host.removeEventListener(name, fn, true);
      pinch.reset(); pinch.latest.current.onEnd();
    };
  }, [pinch.latest, pinch.surfaces, pinch.reset]);
  return <View ref={ref} style={{ flex: 1 }}>{children}</View>;
}
