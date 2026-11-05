// /tests/ui/release-0553-timeline-sprints-header.test.cjs
'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('Sprints binds Fold from the existing inline components module', () => {
  const delivery = read('src/screens/delivery/Delivery.js');
  const compact = read('src/components/inline/CompactTools.js');
  assert.match(delivery, /import \{[^}]*\bFold\b[^}]*\} from '\.\.\/\.\.\/components\/inline\/CompactTools'/);
  assert.match(compact, /export function Fold\(/);
  assert.match(delivery, /<Fold title=\{`Assigned tasks/);
  assert.match(delivery, /<Fold title=\{`Available backlog/);
  assert.match(delivery, /<Fold title=\{`Final sprint scope/);
});

test('Calendar stays pinned and is translated directly from chart native scroll, without separate scroll state', () => {
  const t = read('src/screens/timeline/Timeline.js');
  assert.match(t, /const horizontalOffset = useRef\(new Animated\.Value\(0\)\)\.current/);
  assert.match(t, /Animated\.multiply\(horizontalOffset, -1\)/);
  assert.match(t, /<Animated\.View pointerEvents="none"/);
  assert.match(t, /transform: \[\{ translateX: calendarShift \}\]/);
  assert.match(t, /<Animated\.ScrollView\s+ref=\{chartRef\}/);
  assert.match(t, /onScroll=\{horizontalScroll\}/);
  assert.match(t, /useNativeDriver: Platform\.OS !== 'web'/);
  assert.doesNotMatch(t, /calendarRef|<ScrollView ref=\{calendarRef\}/);
  const header=t.indexOf('<Chip label={showItems');
  const date=t.indexOf('<Animated.View pointerEvents="none"');
  const page=t.indexOf('<Page\n');
  const chart=t.indexOf('<Animated.ScrollView\n');
  assert.ok(header>=0 && header<date && date<page && page<chart);
  assert.match(t, /topPadding=\{0\}/);
  assert.match(t, /borderTopWidth: 0,/);
  assert.match(t, /Remove link?/);
  assert.match(t, /onCommit=\{bar\.onCommit\}/);
});

test('Global create action is compact but remains accessible', () => {
  const mobile = read('src/app/ModernApp.js');
  const desktop = read('src/components/shell/Bars.js');
  const controls = read('src/ui/uiControls.js');
  assert.match(mobile, /onCreate=\{newTask\}/);
  assert.match(desktop, /accessibilityLabel="Create"/);
  assert.match(desktop, /label="New task" icon="plus" small/);
  assert.match(controls, /minHeight: 40/);
  assert.match(controls, /hitSlop=\{4\}/);
  assert.match(controls, /size=\{12\}/);
});
