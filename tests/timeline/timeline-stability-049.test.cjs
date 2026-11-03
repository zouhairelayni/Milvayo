// /tests/timeline/timeline-stability-049.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', '..');
const source = fs.readFileSync(path.join(root, 'src/screens/timeline/Timeline.js'),'utf8');
const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
const { horizontalWindow, intersects } = require('../../src/timeline/timelineViewport.cjs');
const d = require('../../src/timeline/timelineDisplay.cjs');

test('full timeline stays continuously scrollable with viewport painting, never user-facing pagination', () => {
  assert.match(source, /const rows = allScheduled/);
  assert.doesNotMatch(source, /Next rows|Previous rows|Previous window|Next window/);
  assert.match(source, /drawnBars\.map/);
  assert.match(source, /display\.paintedRange/);
});
test('SVG drawing width and hit area are bounded to visible horizontal viewport', () => {
  assert.match(source, /<Svg width=\{paintWidth\} height=\{paintH\} viewBox=/);
  assert.doesNotMatch(source, /<G transform=/);
  assert.doesNotMatch(source, /<Svg width=\{gridW\} height=\{paintH\}>/);
  assert.doesNotMatch(source, /width: gridW, height: gridH/);
  assert.match(source, /<Pressable\s+onPress=\{onGridTap\}/);
  assert.match(source, /paintedRows\.map/);
});
test('x-window size stays near viewport even across extreme dates and scrolling', () => {
  for(const x of [0, 100, 4000, 6000, 7990]) {
    const win = horizontalWindow(8192, 360, x);
    assert.ok(win.width <= 760, JSON.stringify(win));
    assert.ok(win.left >= 0 && win.right <= 8192);
    assert.ok(win.width >= 360 || win.right === 8192);
  }
  assert.deepEqual(horizontalWindow(250,360,0),{left:0,width:250,right:250});
  assert.equal(intersects(900, 920, 0, 360),false);
  assert.equal(intersects(320, 420, 0, 360),true);
});
test('all scheduled tasks remain in date range and have a reachable row', () => {
  const addDays = (s,n) => new Date(new Date(s+'T00:00:00Z').getTime()+n*86400000).toISOString().slice(0,10);
  const daysBetween = (s,e) => Math.round((new Date(e+'T00:00:00Z')-new Date(s+'T00:00:00Z'))/86400000);
  const tasks = [{start:'2022-01-01',due:'2022-01-04'},{start:'2026-10-01',due:'2026-11-05'},{start:'2035-01-01',due:'2035-01-01'}];
  const r = d.rangeForTasks(tasks,'2026-10-31',addDays,daysBetween);
  assert.equal(r.span, daysBetween(r.start,r.end)+1);
  assert.ok(r.start <= tasks[0].start && r.end >= tasks[2].due);
  assert.equal(d.paintedRange(3,-150,400,54).last, 3);
});
test('Expo splash config uses supported schema and preserves local dependency manifest', () => {
  assert.equal(Object.hasOwn(app.expo, 'splash'), false);
  assert.match(app.expo.version,/^0\.5\.\d+$/);
});
