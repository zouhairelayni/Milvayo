// /tests/ui/modern-design-regression.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const windowing = require('../../src/timeline/timelineWindow.cjs');
const { clipBar } = windowing;
const read = (file) => fs.readFileSync(path.join(__dirname, '..', '..', file), 'utf8');

test('Timeline limits visible task bars to a bounded native viewport', () => {
  assert.deepEqual(clipBar(-180000, 200000, 1904), { left: 0, width: 1904, startVisible: false, dueVisible: false });
  assert.deepEqual(clipBar(40, 140, 1904), { left: 40, width: 100, startVisible: true, dueVisible: true });
  assert.deepEqual(clipBar(-40, 140, 1904), { left: 0, width: 140, startVisible: false, dueVisible: true });
  assert.deepEqual(clipBar(1800, 2030, 1904), { left: 1800, width: 104, startVisible: true, dueVisible: false });
});
test('Tasks entirely outside chart viewport do not mount offscreen native bars', () => {
  assert.equal(clipBar(-20000, -20, 1904), null);
  assert.equal(clipBar(5000, 7000, 1904), null);
  assert.equal(clipBar(Infinity, 100, 1904), null);
  assert.equal(clipBar(0, 100, 0), null);
  assert.equal(clipBar(100, 50, 1904), null);
});
test('Timeline limits simultaneous native row gestures, without deleting saved tasks', () => {
  const src = read('src/screens/timeline/Timeline.js');
  const display = require('../../src/timeline/timelineDisplay.cjs');
  const sample = Array.from({ length: 200 }, (_, i) => ({ id: 'task-'+i, start: '2026-10-30', due: '2026-11-02' }));
  const range = display.paintedRange(sample.length, -540, 700, 54);
  assert.ok(range.last - range.first < sample.length);
  assert.equal(sample.length, 200);
  assert.match(src, /const rows = allScheduled/);
  assert.match(src, /paintedRows\.map/);
  assert.doesNotMatch(src, /rowPage|Previous rows|Next rows/);
  assert.match(src, /clipBar\(actualLeft, actualRight/);
});
test('Task sheet preserves discoverable inline dropdown rows and original sheet rhythm', () => {
  const sheet = read('src/screens/tasks/TaskSheet.js');
  const ui = require('../helpers/ui-source.cjs')();
  assert.match(read('src/screens/tasks/TaskFields.js'), /accessibilityState=\{\{ expanded \}\}/);
  for (const field of ['Status','Priority','Stage','Owner','Schedule','Progress','Parent task','Release','Sprint','Dependencies','Acceptance checks','Verification & delivery','Attachments']) {
    assert.ok(sheet.includes(`'${field}'`), `Missing inline field ${field}`);
  }
  assert.match(sheet, /Activity · \{t.comments.length\} comments/, 'Comment activity is no longer buried in an accordion');
  assert.match(sheet, /<T size=\{15\} weight="700">Labels<\/T>/, 'Labels are now prominent instead of buried in a dropdown');
  assert.match(sheet, /<TaskMarkdown source=\{t.description\}/, 'Description is always visible in read mode');
  assert.match(ui, /contentContainerStyle=\{\{ padding: 24, paddingTop: 12, gap: 18, paddingBottom: 48 \}\}/);
  assert.match(ui, /SafeAreaProvider/);
});
test('Modern shell uses maintained native safe-area context', () => {
  const shell = read('src/app/ModernApp.js');
  assert.match(shell, /from 'react-native-safe-area-context'/);
  assert.match(shell, /<SafeAreaProvider>/);
  assert.doesNotMatch(shell, /Pressable, SafeAreaView, ScrollView, View } from 'react-native'/);
});
