// /tests/ui/timeline-pinch-controls.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { screenHarness, nodes } = require('../helpers/screen-harness.cjs');
const model = require('../../src/domain/model.cjs');

test('Timeline pinch commits display density and focal scroll only; presets, pinned calendar and task/import data remain', () => {
  const project = model.makeProject({ id: 'p', name: 'Studio', tasks: [
    { id: 'a', title: 'Design', start: '2026-11-05', due: '2026-11-06' },
    { id: 'b', title: 'Build', start: '2026-11-07', due: '2026-11-10', dependsOn: ['a'] },
  ] });
  const saved = JSON.stringify(project), edits = [], scrolls = [], animated = [];
  let options, resets = 0;
  const addDays = (d, n) => new Date(Date.parse(d + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10);
  const mocks = {
    'react-native': { Animated: { Value: class { constructor(v) { this.value = v; } setValue(v) { this.value = v; animated.push(v); } }, multiply: () => 'calendarShift', event: (_args, opts) => opts.listener, View: 'AnimatedView', ScrollView: 'AnimatedScrollView' }, View: 'View', ScrollView: 'ScrollView', Pressable: 'Pressable', Dimensions: { get: () => ({ width: 390, height: 800 }) }, Platform: { OS: 'android' } },
    '../../store/store': { useStore: () => ({ s: { tasks: project.tasks, project }, updateTask: (...args) => edits.push(args) }), useScreenActive: () => false },
    '../../store/data': { TODAY: '2026-11-05', addDays, fmt: String, daysBetween: (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000) },
    '../../gestures/TimelineScrollView': { __esModule: true, default: 'AnimatedScrollView' },
    '../../gestures/TimelineGestureHost': { __esModule: true, default: 'TimelineHost' },
    '../../gestures/gesture': {}, '../../gestures/gestureSurface': { GestureArea: 'GestureArea' },
    '../../gestures/TimelinePinch': { useTimelinePinch(o) { options = o; return { reset: () => resets++ }; }, TimelinePinchArea: 'PinchArea', TimelinePinchCanvas: 'PinchCanvas' },
  };
  const timeline = {
    timelineWindow: require('../../src/timeline/timelineWindow.cjs'), timelineDisplay: require('../../src/timeline/timelineDisplay.cjs'),
    timelineViewport: require('../../src/timeline/timelineViewport.cjs'), timelineZoom: require('../../src/timeline/timelineZoom.cjs'),
    timelineEdit: require('../../src/timeline/timelineEdit.cjs'), timelineGeometry: require('../../src/timeline/timelineGeometry.cjs'), gantt: require('../../src/timeline/gantt.cjs'),
  };
  for (const [file, value] of Object.entries(timeline)) mocks['../../timeline/' + file + '.cjs'] = value;
  mocks['../../gestures/dragFollow.cjs'] = require('../../src/gestures/dragFollow.cjs');
  mocks['../../gestures/scrollLimits.cjs'] = require('../../src/gestures/scrollLimits.cjs');
  const h = screenHarness('src/screens/timeline/Timeline.js', {}, { mocks });
  const render = () => h.render('default', { openTask() {} });
  let tree = render();
  const chart = () => nodes(tree).find(n => n.type === 'AnimatedScrollView');
  chart().props.ref.current = { scrollTo: v => scrolls.push(v) };
  chart().props.onLayout({ nativeEvent: { layout: { width: 320 } } }); tree = render();
  const presets = () => nodes(nodes(tree).find(n => n.type === 'ActionMenu' && n.props.label === 'Timeline options').props.header).find(n=>n.type==='Segmented').props;
  assert.equal(h.headers.timeline, null); assert.equal(presets().value, 'Days'); assert.equal(options.width, 34);
  options.onStart(); tree = render(); assert.equal(chart().props.scrollEnabled, true, 'native scroll recognizer stays enabled during pinch');
  options.onCommit(68, 400); options.onEnd(); tree = render(); tree = render();
  assert.equal(options.width, 68); assert.equal(presets().value, '');
  assert.equal(chart().props.scrollEnabled, true); assert.equal(scrolls.at(-1).x, 400); assert.equal(animated.at(-1), 400); assert.ok(resets);
  const surfaces = nodes(tree).filter(n => n.type === 'PinchCanvas'); assert.equal(surfaces.length, 2); assert.equal(surfaces[0].props.pinch, surfaces[1].props.pinch);
  chart().props.onContentSizeChange(3808, 108);
  presets().onChange('Months'); tree = render(); assert.equal(options.width, 6); assert.equal(presets().value, 'Months');
  presets().onChange('Days'); tree = render(); assert.equal(options.width, 34); assert.equal(presets().value, 'Days');
  for (let i = 0; i < 30; i++) {
    const label = i % 2 ? 'Zoom out' : 'Zoom in';
    const controls = nodes(tree).find(n => n.type === 'TimelineZoomControls');
    controls.props[label === 'Zoom in' ? 'onZoomIn' : 'onZoomOut'](); h.flushFrames();
    tree = render(); tree = render();
    assert.ok(Number.isFinite(options.width) && options.width > 0);
    chart().props.onContentSizeChange();
  }
  presets().onChange('Days'); tree = render(); tree = render();
  chart().props.onScroll({ nativeEvent: { contentOffset: { x: 1500 } } }); tree = render();
  presets().onChange('Months'); tree = render(); tree = render();
  assert.equal(options.width, 6);
  assert.equal(scrolls.at(-1).x, 0, 'Months focuses Today within the smaller canvas');
  assert.equal(animated.at(-1), 0, 'calendar immediately matches the chart');
  chart().props.onContentSizeChange();
  presets().onChange('Days'); tree = render(); tree = render();
  assert.equal(scrolls.at(-1).x,333,'returning to Days centers Today, independent of the previous scroll');
  assert.equal(animated.at(-1),333);
  assert.deepEqual(edits, []); assert.equal(JSON.stringify(project), saved);
  const imported = model.importProject(JSON.parse(saved));
  assert.deepEqual(imported.tasks, project.tasks);
});
