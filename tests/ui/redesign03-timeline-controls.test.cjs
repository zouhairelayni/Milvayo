// /tests/ui/redesign03-timeline-controls.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { screenHarness, nodes, control } = require('../helpers/screen-harness.cjs');
const display = require('../../src/timeline/timelineDisplay.cjs');
const read = f => fs.readFileSync(path.resolve(__dirname, '../..', f), 'utf8');

test('Timeline control inventory: Items, First task, Today, Critical path, Parents, To schedule, zoom, Open, move/resize/link, Remove/Keep, conflict repair, sample schedule and sheet dismissal', () => {
  const s = read('src/screens/timeline/Timeline.js');
  for (const label of ['Hide items', 'Show items', 'First task', 'Today', 'Critical path', 'Parent tasks', 'To schedule', 'Remove', 'Keep', 'Move after predecessors', 'Schedule the sample tasks']) assert.ok(s.includes(label), label);
  for (const callback of ['goFirst', 'goToday(true)', 'setShowItems(!showItems)', "setTaskPanel('parents')", "setTaskPanel('schedule')", 'setShowCritical(v=>!v)', 'onCommit={bar.onCommit}', 'onPreview={bar.onPreview}', 'onLink={bar.onLink}', 'onClose={()=>setTaskPanel(null)}', 'onAccessibilityTap={() => onOpen(t.id)}']) assert.ok(s.includes(callback), callback);
  assert.match(s, /kind:'zoom', value:zoomFactor === 1 \? zoom : 'custom', onChange:chooseZoom/);
  const preset = s.slice(s.indexOf('  function chooseZoom(value)'), s.indexOf('  const zoomHeader'));
  assert.match(preset, /timelineZoom.rebaseZoom/);
  assert.match(preset, /pendingZoom.current = \{ scroll, canvasWidth: width \* span \}/);
  assert.match(preset, /horizontalOffset.setValue\(scroll\)/);
  assert.match(preset, /setScrollXPaint\(scroll\)/);
  assert.match(preset, /setZoom\(value\); setZoomFactor\(1\)/);
  assert.match(s, /L\.onPreview\(L\.t\.id, p\.start, p\.due\)/);
  assert.match(s, /Animated\.multiply\(horizontalOffset, -1\)/);
  const top = Number(s.match(/const BAR_TOP = (\d+)/)[1]); const height = Number(s.match(/const BAR_H = (\d+)/)[1]);
  assert.equal(top + height / 2, 27, 'bar and link handle retain the dependency row centre');
});

test('Dependency colors and complete SVG line styling remain byte-for-byte identical to batch 02', () => {
  const s = read('src/screens/timeline/Timeline.js');
  for (const [start, end, expected] of [
    ['const NP533_DEP_COLORS', 'const ZOOM', 'f40af6b0594e900749a708d52cb340079e5381e88f3f67ab7e7f922dbe788e36'],
    ['{/* Dependency curves', '</Svg>', '430feafd683fd3946aaf74b9b17252f6ded0be0c4a80e82c3035dc3dc10ce40a'],
  ]) {
    const a = s.indexOf(start), b = s.indexOf(end, a);
    assert.ok(a >= 0 && b > a);
    assert.equal(createHash('sha256').update(s.slice(a, b)).digest('hex'), expected);
  }
});

test('Calendar has daily weekday/date cells at Days zoom, with sparse readable ticks for long schedules and coarser zoom', () => {
  assert.deepEqual(display.ticks(56, 'Days', 34), Array.from({ length: 56 }, (_, i) => i));
  for (const [zoom, w] of [['Days', 2], ['Weeks', 14], ['Months', 6]]) {
    const ticks = display.ticks(1000, zoom, w);
    assert.ok(ticks.every((t, i) => t >= 0 && t < 1000 && (!i || (t - ticks[i - 1]) * w >= (zoom === 'Days' ? 28 : zoom === 'Weeks' ? 70 : 78))));
  }
  const s = read('src/screens/timeline/Timeline.js');
  assert.match(s, /display\.calendarLabels\(START, dayTicks\)/);
  assert.deepEqual(display.calendarLabels('2026-11-06', [0])[0], { index: 0, day: 6, weekday: 'F', month: 'Nov', iso: '2026-11-06' });
  assert.match(s, /today \? c\.accentText : c\.muted/);
});

test('Softer view pills preserve all options, selection, press feedback and callbacks; quiet ribbon does not recolor other chips', () => {
  const h = screenHarness('src/ui/uiControls.js', {});
  const calls = [];
  const tree = h.render('Segmented', { options: ['Board', 'Timeline', 'List', 'Sprints'], value: 'Timeline', fill: true, onChange: v => calls.push(v) });
  assert.equal(tree.props.style.borderRadius, 14); assert.equal(tree.props.style.padding, 4);
  const radios = nodes(tree).filter(n => n.props.accessibilityRole === 'radio');
  assert.equal(radios.length, 4); assert.equal(radios.filter(n => n.props.accessibilityState.checked).length, 1);
  radios.forEach(n => n.props.onPress()); assert.deepEqual(calls, ['Board', 'Timeline', 'List', 'Sprints']);
  assert.equal(radios[0].props.style({ pressed: false }).borderRadius, 9);
  assert.notEqual(radios[0].props.style({ pressed: false }).backgroundColor, radios[0].props.style({ pressed: true }).backgroundColor);
  const normal = h.render('Chip', { label: 'Result', active: true, onPress() {} });
  const quiet = h.render('Chip', { label: 'Today', quiet: true, active: true, onPress() {} });
  assert.notEqual(normal.props.style({}).borderColor, 'transparent');
  assert.equal(quiet.props.style({}).borderColor, 'transparent');
  assert.ok(control(quiet, 'Today'));
});

test('Reused native disclosures animate only rotation, settle in 185ms, and honor system reduced motion', () => {
  const s = read('src/components/inline/DisclosureGlyph.native.js');
  assert.match(s, /duration:185/); assert.match(s, /Easing\.bezier\(0\.22,1,0\.36,1\)/);
  assert.match(s, /reduceMotion:ReduceMotion\.System/);
  assert.match(s, /transform:\[\{rotate:/);
  assert.doesNotMatch(s, /withRepeat|setInterval/);
});
