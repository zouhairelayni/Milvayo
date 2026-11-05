// /tests/ui/sprint-chart-views.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { screenHarness, nodes, control, text } = require('../helpers/screen-harness.cjs');
const reading = tree => nodes(tree).filter(n => n.type === 'T').map(text).join(' ');

test('Two SVG mode buttons switch between original lines and mock-style bars/ideal ticks, preserving history and selected readings', () => {
  const burn = { days: ['11-05', '11-06', '11-07'], ideal: [4, 2, 0], recorded: [4, 3, 1] }; const saved = JSON.stringify(burn);
  const h = screenHarness('src/components/charts/charts.js', {}); let tree = h.render('BurnChart', { burn });
  assert.equal(control(tree, 'Line graph').props.accessibilityState.selected, true); assert.ok(nodes(control(tree, 'Bar graph')).some(n => n.type === 'Svg'));
  const initialReading = reading(tree); control(tree, 'Bar graph').props.onPress(); tree = h.render('BurnChart', { burn });
  assert.equal(control(tree, 'Bar graph').props.accessibilityState.selected, true);
  const bars = nodes(tree).filter(n => n.type === 'Rect' && String(n.key).startsWith('bar')); assert.equal(bars.length, 3);
  assert.equal(bars.filter(n => n.props.fillOpacity === 1).length, 1); assert.equal(reading(tree), initialReading);
  const chart = nodes(tree).find(n => n.props.onTouchStart);
  chart.props.onTouchStart({ nativeEvent: { touches: [{ pageX: 10, pageY: 10 }] } }); chart.props.onTouchEnd({ nativeEvent: { changedTouches: [{ pageX: 10, pageY: 10 }], locationX: 40 } });
  tree = h.render('BurnChart', { burn }); assert.ok(reading(tree).includes('11-05')); const firstDay = reading(tree);
  control(tree, 'Line graph').props.onPress(); tree = h.render('BurnChart', { burn }); assert.equal(reading(tree), firstDay);
  assert.ok(nodes(tree).some(n => n.type === 'Path' && n.props.strokeDasharray === '6,5')); assert.equal(JSON.stringify(burn), saved);
});

test('Bar view keeps series toggles, never hides both series, and handles one-day/zero/empty history', () => {
  const burn = { days: ['11-05'], ideal: [0], recorded: [0] }; const h = screenHarness('src/components/charts/charts.js', {});
  let tree = h.render('BurnChart', { burn }); control(tree, 'Bar graph').props.onPress(); tree = h.render('BurnChart', { burn });
  const bar = nodes(tree).find(n => n.type === 'Rect' && n.key === 'bar0'); assert.ok(bar.props.height >= 0 && Number.isFinite(bar.props.x));
  const legend = nodes(tree).find(n => typeof n.type === 'function' && n.props.label === 'Recorded'); legend.props.onPress(); tree = h.render('BurnChart', { burn });
  assert.equal(nodes(tree).filter(n => n.type === 'Rect' && String(n.key).startsWith('bar')).length, 0);
  nodes(tree).find(n => typeof n.type === 'function' && n.props.label === 'Ideal').props.onPress(); tree = h.render('BurnChart', { burn });
  assert.ok(nodes(tree).some(n => n.type === 'Line' && n.key === 'ideal0'), 'at least one series remains');
  assert.ok(text(h.render('BurnChart', { burn: { days: [], ideal: [], recorded: [] } })).includes('No recorded sprint history'));
});
