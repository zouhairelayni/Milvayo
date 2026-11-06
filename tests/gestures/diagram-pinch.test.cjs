// /tests/gestures/diagram-pinch.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { clampScale, fitScale, constrainPose, pinchPose } = require('../../src/gestures/diagramZoom.cjs');
const { gestureHarness } = require('../helpers/diagram-harness.cjs');
const bounds = { width: 320, height: 300, contentWidth: 1000, contentHeight: 600 };
const equal = (a, b) => assert.deepEqual(JSON.parse(JSON.stringify(a)), b);

test('diagram zoom clamps limits, preserves focal content, bounds panning and does not mutate its inputs', () => {
  assert.equal(clampScale(0), 0.25); assert.equal(clampScale(10), 4); assert.equal(clampScale(NaN), 1);
  assert.equal(fitScale(bounds), 316 / 1000);
  assert.equal(fitScale({ ...bounds, contentWidth: 100, contentHeight: 1200 }), 0.25);
  const start = { scale: 1, x: -100, y: -50 }, anchor = { x: 120, y: 100 }, focal = { x: 140, y: 120 };
  const before = JSON.stringify({ start, bounds, anchor, focal });
  const zoomed = pinchPose(start, 2, anchor, focal, bounds);
  assert.deepEqual(zoomed, { scale: 2, x: -300, y: -180 });
  assert.equal((focal.x - zoomed.x) / zoomed.scale, (anchor.x - start.x) / start.scale);
  assert.equal((focal.y - zoomed.y) / zoomed.scale, (anchor.y - start.y) / start.scale);
  assert.deepEqual(constrainPose({ scale: 1, x: -99999, y: 99999 }, bounds), { scale: 1, x: -680, y: 0 });
  assert.deepEqual(constrainPose({ scale: 0.25, x: -400, y: -400 }, bounds), { scale: 0.25, x: 0, y: 0 });
  assert.equal(pinchPose(start, 100, anchor, focal, bounds).scale, 4);
  assert.equal(pinchPose(start, 0.001, anchor, focal, bounds).scale, 0.25);
  assert.equal(JSON.stringify({ start, bounds, anchor, focal }), before);
});

test('native pinch/pan: repeated gestures, third finger, remaining finger, cancel, preset reset and page-scroll handoff', () => {
  const reports = [], h = gestureHarness('src/gestures/DiagramGesture.native.js');
  const props = { bounds, initialScale: 1, resetKey: 'tree:0', onZoom: v => reports.push(v), children: 'SVG' };
  let tree = h.render(props);
  const pose = () => {
    const t = tree.props.children.props.children.props.style[1]().transform;
    return { scale: t[2].scale, x: t[0].translateX, y: t[1].translateY };
  };
  const event = (scale, numberOfPointers = 2, focalX = 100, focalY = 100) => ({ scale, numberOfPointers, focalX, focalY });
  h.gestures.pinch.onActivate(event(1)); h.gestures.pinch.onUpdate(event(2));
  equal(pose(), { scale: 2, x: -100, y: -100 });
  h.gestures.pinch.onUpdate(event(3, 3, 50, 80)); equal(pose(), { scale: 2, x: -100, y: -100 });
  h.gestures.pinch.onUpdate(event(3, 2)); equal(pose(), { scale: 2, x: -100, y: -100 });
  h.gestures.pinch.onFinalize({ canceled: true }); assert.deepEqual(reports, [2]);
  h.gestures.pan.onActivate(); h.gestures.pan.onUpdate({ numberOfPointers: 1, translationX: -100, translationY: -100 });
  equal(pose(), { scale: 2, x: -100, y: -100 });
  h.gestures.pan.onTouchesUp({ numberOfTouches: 0 }); h.gestures.pan.onActivate();
  h.gestures.pan.onUpdate({ numberOfPointers: 1, translationX: -50, translationY: -20 });
  equal(pose(), { scale: 2, x: -150, y: -120 });
  // Parent updates the selected zoom without resetting translation.
  tree = h.render({ ...props, initialScale: 2 }); equal(pose(), { scale: 2, x: -150, y: -120 });
  h.gestures.pinch.onActivate(event(1)); h.gestures.pinch.onUpdate(event(0.5)); h.gestures.pinch.onFinalize({});
  assert.equal(pose().scale, 1); assert.deepEqual(reports, [2, 1]);
  tree = h.render({ ...props, initialScale: 1.5, resetKey: 'tree:1' }); equal(pose(), { scale: 1.5, x: 0, y: 0 });
  tree = h.render({ ...props, initialScale: 0.25, resetKey: 'tree:2' });
  tree = h.render({ ...props, initialScale: 0.25, resetKey: 'tree:2' });
  assert.equal(h.gestures.pan.enabled, false);
  assert.ok(Array.isArray(h.gestures.pan.failOffsetY), 'RNGH offsets use plain numbers to avoid render reads');
  equal(Array.from(h.gestures.pan.failOffsetY), [-8, 8]);
  equal(Array.from(h.gestures.pan.activeOffsetY), [-1000000, 1000000]);
  tree = h.render({ ...props, bounds: { ...bounds, width: 400 }, initialScale: 1, resetKey: 'fishbone:2' });
  equal(pose(), { scale: 1, x: 0, y: 0 }); h.cleanup();
});

function domNode() {
  const handlers = new Map(), captures = new Set();
  return {
    style: {}, handlers, getBoundingClientRect: () => ({ left: 20, top: 30 }),
    addEventListener(name, fn) { handlers.set(name, fn); }, removeEventListener(name) { handlers.delete(name); },
    setPointerCapture: id => captures.add(id), hasPointerCapture: id => captures.has(id), releasePointerCapture: id => captures.delete(id),
    fire(name, payload) { let prevented = false; handlers.get(name)({ ...payload, preventDefault() { prevented = true; } }); return prevented; },
  };
}
const touch = (id, x, y = 100) => ({ identifier: id, clientX: x + 20, clientY: y + 30 });

test('web touch zoom/pan: focal scaling, zero-distance, limits, cancellation, leftover finger and listener cleanup', () => {
  const host = domNode(), stage = domNode(), reports = [];
  const h = gestureHarness('src/gestures/DiagramGesture.js', host, stage);
  const props = { bounds, initialScale: 1, resetKey: 'mind:0', onZoom: v => reports.push(v), children: 'SVG' };
  h.render(props);
  assert.equal(host.fire('touchstart', { touches: [touch(1, 50), touch(2, 150)] }), true);
  host.fire('touchmove', { touches: [touch(1, 0), touch(2, 200)] });
  assert.equal(stage.style.transform, 'translate(-100px, -100px) scale(2)');
  host.fire('touchend', { touches: [touch(1, 0)] });
  host.fire('touchmove', { touches: [touch(1, -100)] }); assert.equal(stage.style.transform, 'translate(-100px, -100px) scale(2)');
  h.render({ ...props, initialScale: 2 }); assert.equal(stage.style.transform, 'translate(-100px, -100px) scale(2)');
  host.fire('touchend', { touches: [] });
  host.fire('touchstart', { touches: [touch(1, 50), touch(2, 150)] });
  host.fire('touchmove', { touches: [touch(1, -400), touch(2, 600)] });
  host.fire('touchcancel', {}); assert.equal(reports.at(-1), 4);
  h.render({ ...props, resetKey: 'mind:1' });
  host.fire('touchstart', { touches: [touch(1, 100), touch(2, 100)] });
  host.fire('touchmove', { touches: [touch(1, 50), touch(2, 150)] });
  assert.equal(stage.style.transform, 'translate(0px, 0px) scale(1)');
  host.fire('touchcancel', {});
  host.fire('touchstart', { touches: [touch(1, 50)] }); host.fire('touchmove', { touches: [touch(1, 0, 80)] });
  assert.equal(stage.style.transform, 'translate(-50px, -20px) scale(1)');
  h.cleanup(); assert.equal(host.handlers.size, 0);
});

test('web keeps page scrolling when content fits, supports trackpad/presets and mouse pan without rerendering SVG', () => {
  const host = domNode(), stage = domNode(), h = gestureHarness('src/gestures/DiagramGesture.js', host, stage), reports = [];
  const props = { bounds, initialScale: 0.25, resetKey: 'tree:0', onZoom: s => reports.push(s) };
  h.render(props); assert.equal(host.style.touchAction, 'pan-y');
  assert.equal(host.fire('touchstart', { touches: [touch(1, 100)] }), false);
  assert.equal(host.fire('touchmove', { touches: [touch(1, 100, 120)] }), false);
  assert.equal(host.fire('wheel', { deltaY: 100, deltaX: 0 }), false);
  host.fire('wheel', { ctrlKey: true, deltaY: -1000, clientX: 120, clientY: 130 });
  assert.equal(reports.at(-1), 4); assert.equal(host.style.touchAction, 'none');
  h.render({ ...props, initialScale: 1.5, resetKey: 'tree:1' });
  assert.equal(stage.style.transform, 'translate(0px, 0px) scale(1.5)');
  host.fire('pointerdown', { pointerType: 'mouse', pointerId: 3, button: 0, clientX: 120, clientY: 130 });
  host.fire('pointermove', { pointerId: 3, clientX: 20, clientY: 30 });
  assert.equal(stage.style.transform, 'translate(-100px, -100px) scale(1.5)');
  host.fire('pointercancel', { pointerId: 3 }); assert.equal(host.hasPointerCapture(3), false);
  h.cleanup();
});
