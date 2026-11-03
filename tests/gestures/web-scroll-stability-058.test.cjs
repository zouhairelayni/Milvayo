// /tests/gestures/web-scroll-stability-058.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = (p) => fs.readFileSync(path.join(__dirname, '..', '..', p), 'utf8');

test('web gesture uses browser pointer listeners without taking the ScrollView responder on touch-start', () => {
  const web = read('src/gestures/gesture.web.js');
  assert.match(web, /onPointerDown/);
  assert.match(web, /document\.addEventListener\('pointermove'/);
  assert.match(web, /document\.addEventListener\('pointerup'/);
  assert.match(web, /document\.addEventListener\('pointercancel'/);
  assert.match(web, /setTimeout\(\(\) => \{/);
  assert.match(web, /if \(Math\.abs\(s\.x - s\.startX\) > SLOP/);
  assert.match(web, /scroll\.x - s\.baseX/);
  assert.match(web, /if \(allowTap\) callbacks\.current\.onDrop/);
  assert.doesNotMatch(web, /PanResponder\.create|onStartShouldSetResponder:|onStartShouldSetPanResponder:/);
});

test('web ScrollViews preserve normal arbitration instead of disabling the pan responder', () => {
  const board = read('src/screens/board/Board.js');
  const timeline = read('src/screens/timeline/Timeline.js');
  assert.doesNotMatch(board, /disableScrollViewPanResponder/);
  assert.doesNotMatch(timeline, /disableScrollViewPanResponder/);
  assert.match(read('src/board/boardGesture.web.js'), /from '\.\.\/gestures\/gesture'/);
});

test('hidden heavyweight web screens are no longer retained and diagnostics distinguish log calls from exceptions', () => {
  const app = read('src/app/ModernApp.js');
  assert.match(app, /const retainHiddenTab = \(\) => retainsHiddenTabs\(Platform\.OS\)/);
  assert.equal(require('../../src/app/navigation/pageRetention.cjs').retainsHiddenTabs('web'), false);
  assert.doesNotMatch(app, /Platform\.OS === 'web' \|\| \(id !== 'board'/);
  const diagnostics = read('src/diagnostics/core.cjs');
  assert.match(diagnostics, /Console errors and JS exceptions:/);
  assert.match(diagnostics, /recorded JS exceptions:/);
});
