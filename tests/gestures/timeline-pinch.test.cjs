// /tests/gestures/timeline-pinch.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { gestureHarness, load } = require('../helpers/diagram-harness.cjs');
const { pinchZoom, previewWindow } = require('../../src/timeline/timelineZoom.cjs');
const display = require('../../src/timeline/timelineDisplay.cjs');
const equal = (actual, expected) => assert.deepEqual(JSON.parse(JSON.stringify(actual)), expected);

test('timeline density preserves focal dates, clamps edges/canvas limits and bounds each gesture preview', () => {
  const p = pinchZoom(34, 2, 100, 120, 300, 56, 320);
  equal(p, { width: 68, scroll: 680 });
  assert.equal((300 + 100) / 34, (p.scroll + 120) / p.width);
  equal(pinchZoom(34, 0.25, 0, 0, 0, 56, 320), { width: 8.5, scroll: 0 });
  assert.equal(pinchZoom(34, 999, 100, 100, 0, 56, 320).width, 136);
  assert.equal(pinchZoom(10, 0.01, 100, 100, 0, 56, 320).width, 3);
  assert.equal(pinchZoom(34, NaN, 100, 100, 300, 56, 320).width, 34);
  const span = 40000, width = display.dayWidth(34, span);
  const long = pinchZoom(width, 4, 120, 120, 1200, span, 320);
  assert.ok(long.width * span <= display.MAX_CANVAS_WIDTH);
  assert.ok(long.scroll >= 0 && long.scroll <= display.MAX_CANVAS_WIDTH - 320);
  assert.equal(pinchZoom(width, 0.25, 120, 120, 1200, span, 320).width, width * 0.25, 'long schedules can still zoom out below the canvas cap');
  const rebased = pinchZoom(8.5, 0.25, 100, 100, 0, 56, 320, 34);
  assert.equal(rebased.width, 8.5, 'third-finger rebasing cannot exceed the per-gesture draw budget');
  const window = previewWindow(1904, 300, 320); assert.equal(window.left, 0); assert.equal(window.right, 1900);
});

test('native timeline pinch uses a shared transform, commits once, rebases extra fingers and releases on cancel', () => {
  const calls = [], h = gestureHarness('src/gestures/TimelinePinch.native.js', null, null, 'useTimelinePinch');
  const props = { width: 34, span: 56, viewportWidth: 320, enabled: true, getScroll: () => 300, onStart: () => calls.push('start'), onCommit: (w, x) => calls.push([w, x]), onEnd: () => calls.push('end') };
  let controller = h.render(props);
  const e = (scale, numberOfPointers = 2, focalX = 100) => ({ scale, numberOfPointers, focalX });
  h.gestures.pinch.onActivate(e(1));
  h.gestures.pinch.onUpdate(e(2));
  equal(controller.style().transform, [{ translateX: -400 }, { scaleX: 2 }]); assert.deepEqual(calls, ['start']);
  h.gestures.pinch.onUpdate(e(2, 3, 80));
  equal(controller.style().transform, [{ translateX: -400 }, { scaleX: 2 }]);
  h.gestures.pinch.onUpdate(e(2, 2));
  equal(controller.style().transform, [{ translateX: -400 }, { scaleX: 2 }]);
  h.gestures.pinch.onFinalize({}); h.flushFrames(); assert.deepEqual(calls, ['start', [68, 700], 'end']);
  controller = h.render({ ...props, width: 68 }); controller.reset();
  equal(controller.style().transform, [{ translateX: 0 }, { scaleX: 1 }]);
  h.gestures.pinch.onActivate(e(1)); h.gestures.pinch.onUpdate(e(0.5)); h.gestures.pinch.onFinalize({}); h.flushFrames();
  assert.equal(calls.at(-2)[0], 34);
  h.render({ ...props, enabled: false }); assert.equal(h.gestures.pinch.enabled, false); h.cleanup();
});

function hostNode() {
  const listeners = new Map();
  return { style: {}, listeners, getBoundingClientRect: () => ({ left: 20 }),
    addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name),
    fire(name, data) { let prevented = false; listeners.get(name)({ ...data, preventDefault() { prevented = true; } }); return prevented; },
  };
}
const touch = (x, y = 100) => ({ clientX: x + 20, clientY: y });

test('web timeline pinch transforms chart/calendar together, preserves ordinary scrolling and cleans up listeners', () => {
  const host = hostNode(), chart = { style: {} }, calendar = { style: {} }, calls = [];
  const options = { width: 34, span: 56, viewportWidth: 320, enabled: true, getScroll: () => 300, onStart: () => calls.push('start'), onCommit: (w, x) => calls.push([w, x]), onEnd: () => calls.push('end') };
  const pinch = { latest: { current: options }, surfaces: { current: new Set([chart, calendar]) }, reset() { chart.style.transform = calendar.style.transform = 'identity'; } };
  const h = gestureHarness('src/gestures/TimelinePinch.js', host, null, 'TimelinePinchArea'); h.render({ pinch });
  assert.equal(host.style.touchAction, 'pan-x pan-y');
  assert.equal(host.fire('touchstart', { touches: [touch(50)] }), false);
  assert.equal(host.fire('wheel', { ctrlKey: false, deltaY: 20 }), false);
  assert.equal(host.fire('touchstart', { touches: [touch(50), touch(150)] }), true);
  host.fire('touchmove', { touches: [touch(0), touch(200)] });
  assert.equal(chart.style.transform, 'translateX(-400px) scaleX(2)'); assert.equal(chart.style.transform, calendar.style.transform);
  assert.deepEqual(calls, ['start']);
  host.fire('touchend', { touches: [touch(0)] }); assert.deepEqual(calls, ['start', [68, 700]]);
  host.fire('touchmove', { touches: [touch(100)] }); assert.equal(calls.length, 2);
  host.fire('touchend', { touches: [] }); assert.equal(calls.at(-1), 'end');
  options.width = 68; pinch.reset(); host.fire('touchstart', { touches: [touch(50), touch(150)] });
  host.fire('touchmove', { touches: [touch(75), touch(125)] }); host.fire('touchcancel', {});
  assert.equal(calls.at(-2)[0], 34); assert.equal(calls.at(-1), 'end');
  options.enabled = false; const length = calls.length;
  assert.equal(host.fire('touchstart', { touches: [touch(50), touch(150)] }), false); assert.equal(calls.length, length);
  options.enabled = true; host.fire('wheel', { ctrlKey: true, deltaY: -200, clientX: 120 });
  assert.ok(calls.at(-2)[0] <= 136); assert.equal(calls.at(-1), 'end');
  h.cleanup(); assert.equal(host.listeners.size, 0); assert.equal(chart.style.transform, 'identity');
});

test('pinch guards prevent task moves/resizes/link creation and taps while ordinary edit semantics remain', () => {
  const handlers = [], changes = [], k = { scroll: { x: 0, y: 0 }, measure() {}, pointer: {}, pinching: true };
  const exports = load('src/screens/timeline/Timeline.js', {
    '../canvas/AddToCanvas':{__esModule:true,default:'AddToCanvas'},
    '../../diagnostics/useRenderMetric': { useRenderMetric() {} },
    react: { memo: fn => fn, useRef: value => ({ current: value }) },
    'react-native': { View: 'View', Platform: { OS: 'web' }, Pressable: 'Pressable' },
    'react-native-svg': { __esModule: true, default: 'Svg', Circle: 'Circle', Line: 'Line', Path: 'Path' },
    '../../ui/ui': { T: 'T' }, '../../store/store': {}, '../../components/shell/HeaderActions': {},
    '../../ui/theme/theme': { useTheme: () => ({ c: {} }), STATUS_COLOR: { Backlog: '#888' }, PRIORITY_COLOR: {} },
    '../../store/data': { addDays: (day, n) => new Date(Date.parse(day + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10), daysBetween: (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000) },
    '../../gestures/gesture': { useHoldDrag: config => { handlers.push(config); return { lifted: false }; } },
    '../../gestures/gestureSurface': { GestureArea: 'GestureArea' }, './TimelineZoomControls': 'TimelineZoomControls', '../../gestures/TimelineGestureHost': 'Host', '../../gestures/TimelineScrollView': 'ScrollView', '../../gestures/TimelinePinch': {}, '../../diagnostics/monitor': {},
  }, ['TaskBar']);
  const task = { id: 't1', title: 'Build', status: 'Backlog', progress: 0, start: '2026-11-05', due: '2026-11-06' }, saved = JSON.stringify(task);
  exports.__test.TaskBar({ t: task, start: task.start, due: task.due, origin: task.start, w: 34, span: 56, paintLeft: 0, paintWidth: 1904, rowTop: 0, k,
    onPreview: (...args) => changes.push(['preview', ...args]), onCommit: (...args) => changes.push(['commit', ...args]), onOpen: id => changes.push(['open', id]), onLink: (...args) => changes.push(['link', ...args]) });
  assert.equal(handlers.length, 4);
  for (const handler of handlers) { handler.onLift(); handler.onMove(34, 54, 100, 200); handler.onDrop(34, 54); handler.onTap?.(); }
  assert.deepEqual(changes, []);
  k.pinching = false; k.suppressUntil = Date.now() + 10000;
  for (const handler of handlers) { handler.onLift(); handler.onDrop(34, 54); handler.onTap?.(); }
  assert.deepEqual(changes, []); assert.equal(JSON.stringify(task), saved);
  k.suppressUntil = 0;
  handlers[0].onLift(); handlers[0].onMove(34, 0, 100, 200); handlers[0].onDrop(34); handlers[0].onTap();
  assert.ok(changes.some(c => c[0] === 'commit' && c[1] === 't1' && c[2] === '2026-11-06' && c[3] === '2026-11-07' && c[4] === 'move'));
  assert.ok(changes.some(c => c[0] === 'open' && c[1] === 't1'));
  handlers[2].onLift(); handlers[2].onDrop(34);
  assert.ok(changes.some(c => c[0] === 'commit' && c[2] === '2026-11-05' && c[3] === '2026-11-07' && c[4] === 'due'));
  handlers[3].onLift(); handlers[3].onMove(34, 54, 100, 200); handlers[3].onDrop(34, 54);
  assert.ok(changes.some(c => c[0] === 'link' && c[1] === 'drop' && c[2] === 't1'));
  const source = fs.readFileSync('src/screens/timeline/Timeline.js', 'utf8');
  assert.equal((source.match(/if \(pinchBlocked\(\)\) return;/g) || []).length, 6);
  assert.match(source, /if \(!pinchBlocked\(\)\) live.current.onOpen/);
  assert.equal((source.match(/<TimelinePinchCanvas pinch=\{pinch\}/g) || []).length, 2);
  assert.match(source, /onContentSizeChange=\{\(width\) => settleZoom\(true, width\)\}/);
  assert.match(source, /horizontalOffset.setValue\(offset\)/);
  assert.match(source, /setZoomFactor\(width \/ ZOOM\[zoom\]\)/);
});

test('repeated zoom in/out keeps finite density and scroll inside the native canvas budget', () => {
  let width = 34, scroll = 0;
  const span = 176, viewport = 350;
  for (let i = 0; i < 1000; i++) {
    const next = pinchZoom(width, i % 7 < 4 ? 1.25 : 0.8, 175, 175, scroll, span, viewport);
    assert.ok(Number.isFinite(next.width) && next.width > 0);
    assert.ok(next.width * span <= display.MAX_CANVAS_WIDTH + 0.001);
    assert.ok(next.scroll >= 0 && next.scroll <= Math.max(0, next.width * span - viewport));
    width = next.width; scroll = next.scroll;
  }
});

test('presets rebase far-right scroll, preserve the focal date and handle a canvas smaller than the viewport', () => {
  const { rebaseZoom } = require('../../src/timeline/timelineZoom.cjs');
  assert.equal(rebaseZoom(34, 6, 3000, 176, 350), (3000 + 175) * 6 / 34 - 175);
  assert.equal(rebaseZoom(34, 6, 0, 56, 350), 0);
  assert.equal(rebaseZoom(6, 34, 0, 56, 350), (175 * 34 / 6) - 175);
  assert.equal(rebaseZoom(34, 6, 99999, 176, 350), 706);
});
