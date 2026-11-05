// /src/gestures/DiagramGesture.js
import { useEffect, useRef } from 'react';
import { View } from 'react-native';
const { constrainPose, pinchPose } = require('./diagramZoom.cjs');

// Web: keep SVG children static and transform only their containing DOM node.
// Touch ownership is local to this diagram; browser zoom elsewhere is untouched.
export default function DiagramGesture({ bounds, initialScale, resetKey, onZoom, children }) {
  const surface = useRef(null), stage = useRef(null);
  const current = useRef(null), session = useRef(null), mouse = useRef(null);
  const latest = useRef(null);
  latest.current = { bounds, onZoom };
  const { width, height, contentWidth, contentHeight } = bounds;
  useEffect(() => {
    const host = surface.current, drawing = stage.current;
    if (!host || !drawing) return;
    const paint = next => {
      current.current = next;
      drawing.style.transform = `translate(${next.x}px, ${next.y}px) scale(${next.scale})`;
      // Let a one-finger vertical swipe scroll the page when the diagram fits.
      host.style.touchAction = latest.current.bounds.contentHeight * next.scale > latest.current.bounds.height ? 'none' : 'pan-y';
    };
    paint(constrainPose({ scale: initialScale, x: 0, y: 0 }, bounds));
    session.current = null; mouse.current = null;
    const point = t => {
      const rect = host.getBoundingClientRect();
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    };
    const pair = touches => {
      const a = point(touches[0]), b = point(touches[1]);
      return { focal: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, distance: Math.hypot(b.x - a.x, b.y - a.y) };
    };
    const beginPinch = touches => {
      const p = pair(touches);
      session.current = { kind: 'pinch', start: current.current, ...p, count: touches.length, ids: [touches[0].identifier, touches[1].identifier] };
    };
    const startTouch = e => {
      if (e.touches.length >= 2) { e.preventDefault(); beginPinch(e.touches); }
      else if (!session.current) session.current = { kind: 'pan', start: current.current, point: point(e.touches[0]) };
    };
    const moveTouch = e => {
      const s = session.current;
      if (!s || s.kind === 'wait') return;
      const b = latest.current.bounds;
      if (e.touches.length >= 2) {
        e.preventDefault();
        if (s.kind !== 'pinch' || s.count !== e.touches.length || s.ids.some((id, i) => id !== e.touches[i].identifier)) { beginPinch(e.touches); return; }
        const p = pair(e.touches);
        if (s.distance > 0) paint(pinchPose(s.start, p.distance / s.distance, s.focal, p.focal, b));
      } else if (s.kind === 'pan' && e.touches.length === 1) {
        const p = point(e.touches[0]), dx = p.x - s.point.x, dy = p.y - s.point.y;
        if (b.contentHeight * current.current.scale <= b.height && Math.abs(dy) > Math.abs(dx)) return;
        const next = constrainPose({ scale: s.start.scale, x: s.start.x + dx, y: s.start.y + dy }, b);
        if (next.x !== current.current.x || next.y !== current.current.y) { e.preventDefault(); paint(next); }
      }
    };
    const endTouch = e => {
      if (session.current?.kind === 'pinch') {
        latest.current.onZoom?.(current.current.scale);
        if (e.touches.length >= 2) { beginPinch(e.touches); return; }
        // A remaining finger must lift before a new pan starts.
        session.current = e.touches.length ? { kind: 'wait' } : null;
      } else if (!e.touches.length) session.current = null;
    };
    const cancelTouch = () => {
      if (session.current?.kind === 'pinch') latest.current.onZoom?.(current.current.scale);
      session.current = null;
    };
    const wheel = e => {
      const b = latest.current.bounds;
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? b.height : 1;
      if (e.ctrlKey) {
        e.preventDefault();
        const focal = point(e);
        paint(pinchPose(current.current, Math.exp(-e.deltaY * unit * 0.01), focal, focal, b));
        latest.current.onZoom?.(current.current.scale);
      } else {
        const next = constrainPose({ scale: current.current.scale, x: current.current.x - (e.shiftKey ? e.deltaY : e.deltaX) * unit, y: current.current.y - (e.shiftKey ? 0 : e.deltaY) * unit }, b);
        if (next.x !== current.current.x || next.y !== current.current.y) { e.preventDefault(); paint(next); }
      }
    };
    const downMouse = e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      mouse.current = { id: e.pointerId, start: current.current, point: point(e) };
      host.setPointerCapture(e.pointerId);
    };
    const moveMouse = e => {
      const m = mouse.current;
      if (!m || m.id !== e.pointerId) return;
      const p = point(e);
      paint(constrainPose({ scale: m.start.scale, x: m.start.x + p.x - m.point.x, y: m.start.y + p.y - m.point.y }, latest.current.bounds));
    };
    const endMouse = e => {
      if (mouse.current?.id === e.pointerId) {
        mouse.current = null;
        if (host.hasPointerCapture(e.pointerId)) host.releasePointerCapture(e.pointerId);
      }
    };
    const listeners = { touchstart: startTouch, touchmove: moveTouch, touchend: endTouch, touchcancel: cancelTouch, wheel, pointerdown: downMouse, pointermove: moveMouse, pointerup: endMouse, pointercancel: endMouse, lostpointercapture: endMouse };
    for (const [name, fn] of Object.entries(listeners)) host.addEventListener(name, fn, { passive: false });
    return () => {
      for (const [name, fn] of Object.entries(listeners)) host.removeEventListener(name, fn);
      if (mouse.current && host.hasPointerCapture(mouse.current.id)) host.releasePointerCapture(mouse.current.id);
      session.current = null; mouse.current = null;
    };
    // Completed zoom updates the toolbar value, not the current translation.
  }, [resetKey, width, height, contentWidth, contentHeight]);
  return (
    <View ref={surface} accessibilityLabel="Work breakdown diagram. Pinch to zoom, drag to pan" style={{ width, height, overflow: 'hidden' }}>
      <View ref={stage} style={{ position: 'absolute', left: 0, top: 0, width: contentWidth, height: contentHeight, transformOrigin: 'top left' }}>{children}</View>
    </View>
  );
}
