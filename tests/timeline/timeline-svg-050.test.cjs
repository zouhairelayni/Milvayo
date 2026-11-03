// /tests/timeline/timeline-svg-050.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '../../src/screens/timeline/Timeline.js'), 'utf8');
const { horizontalWindow, intersectsRows, svgViewBox } = require('../../src/timeline/timelineViewport.cjs');

test('dependency paths remain visible when either endpoint is outside vertical paint range', () => {
  assert.equal(intersectsRows(0, 25, 8, 18), true, 'long dependency crosses viewport');
  assert.equal(intersectsRows(3, 9, 8, 18), true, 'predecessor is above painted rows');
  assert.equal(intersectsRows(15, 40, 8, 18), true, 'successor is below painted rows');
  assert.equal(intersectsRows(12, 14, 8, 18), true, 'both inside viewport');
  assert.equal(intersectsRows(0, 7, 8, 18), false);
  assert.equal(intersectsRows(18, 40, 8, 18), false);
  assert.equal(intersectsRows(10, 10, 8, 18), true);
  assert.equal(intersectsRows(0, 100, 0, 0), false);
});

test('viewBox renders global chart coordinates in bounded native SVG without scaled dimensions', () => {
  const win = horizontalWindow(2958, 350, 1100);
  assert.deepEqual(win, { left: 900, right: 1650, width: 750 });
  assert.equal(svgViewBox(win.left, 540, win.width, 972), '900 540 750 972');
  assert.equal(svgViewBox(0, 0, 350, 540), '0 0 350 540');
  assert.equal(svgViewBox(NaN, 4, 300, 300), '0 0 1 1');
  assert.match(src, /viewBox=\{viewport\.svgViewBox\(paintLeft, paintTop, paintWidth, paintH\)\}/);
  assert.match(src, /preserveAspectRatio="none"/);
  assert.doesNotMatch(src, /<G transform=/);
});

test('timeline keeps all scheduled tasks and drawing remains windowed without row paging', () => {
  assert.match(src, /const rows = allScheduled/);
  assert.match(src, /viewport\.intersectsRows\(pr, tr, firstPaint, lastPaint\)/);
  assert.match(src, /drawnBars\.map/);
  assert.match(src, /<Svg width=\{paintWidth\} height=\{paintH\}/);
  assert.doesNotMatch(src, /Next rows|Previous rows|Next window|Previous window/);
  assert.doesNotMatch(src, /<Svg width=\{gridW\}/);
});
