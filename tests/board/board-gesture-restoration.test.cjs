// /tests/board/board-gesture-restoration.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = p => fs.readFileSync(path.join(__dirname, '..', '..', p), 'utf8');
const { dragOffset, hasScrolledBeforeHold } = require('../../src/board/boardDragMath.cjs');

test('native board finger offset follows the finger plus horizontal and vertical auto-scroll', () => {
  const lifted = { x: 120, y: 270 }, at = { x: 45, y: 150 };
  assert.deepEqual(dragOffset({x: 120, y: 270}, lifted, at, at), {x:0,y:0});
  assert.deepEqual(dragOffset({x: 150, y: 308}, lifted, {x:100,y:204}, at), {x:85,y:92});
  assert.deepEqual(dragOffset({x: 150, y: 308}, lifted, {x:100,y:204}, at, 'x'), {x:85,y:0});
  // Pointer can stay still while the scroll offset advances; the item MUST move.
  assert.deepEqual(dragOffset(lifted, lifted, {x:80,y:190}, at), {x:35,y:40});
});

test('scroll motion cancels pending lift; stationary long press is still eligible', () => {
  assert.equal(hasScrolledBeforeHold(0,0), false);
  assert.equal(hasScrolledBeforeHold(8,-8), false);
  assert.equal(hasScrolledBeforeHold(9,0), true);
  assert.equal(hasScrolledBeforeHold(0,-30), true);
  assert.equal(hasScrolledBeforeHold(-70,0), true);
});

test('Kanban restores original MockDesign responder, auto-scroll and full list structure', () => {
  const board = read('src/screens/board/Board.js');
  const gesture = read('src/board/boardGesture.native.js');
  const motion = read('src/board/boardMotion.native.js');
  const web = read('src/board/boardGesture.web.js');
  assert.match(gesture, /PanResponder\.create/);
  assert.match(gesture, /hasScrolledBeforeHold\(s\.px - s\.startX, s\.py - s\.startY, SLOP\)/);
  assert.match(gesture, /clearHold\(\)/);
  assert.match(gesture, /setInterval\(sync, TICK_MS\)/);
  assert.match(gesture, /onPanResponderTerminationRequest: \(\) => !st\.current\.active/);
  assert.match(gesture, /onStartShouldSetPanResponder: \(\) => false/);
  assert.match(gesture, /onMoveShouldSetPanResponder: \(\) => st\.current\.active/);
  assert.doesNotMatch(board, /disableScrollViewPanResponder/);
  assert.match(board, /onScrollBeginDrag=\{cancelPendingBoardHolds\}/);
  assert.match(board, /onScroll=\{\(e\) => \{ k\.scroll\.y = e\.nativeEvent\.contentOffset\.y; \}\}/);
  assert.match(board, /k\.scroll\.x = e\.nativeEvent\.contentOffset\.x/);
  assert.match(board, /scrollEnabled=\{!locked\}/);
  assert.match(board, /onMove: \(cx, cy, px, py\)/);
  assert.match(board, /placeTask\(t\.id, lists\[to\]\.id, slot\.before\)/);
  assert.match(board, /moveListTo\(board\.id, list\.id, to\)/);
  assert.match(board, /cards\.map\(\(t\) => \(/); // no cap hides offscreen cards during placement
  assert.doesNotMatch(board, /visibleLimit|VirtualGestureDetector|GestureArea|DragMotion/);
  assert.match(motion, /useAnimatedStyle/);
  assert.match(motion, /withTiming\(shift, \{ duration: 140 \}\)/);
  assert.doesNotMatch(motion, /PanResponder|VirtualGestureDetector|Animated\.timing/);
  assert.match(web, /from '\.\.\/gestures\/gesture'/);
  assert.match(read('src/gestures/gesture.web.js'), /onPointerDown/);
});

test('Native Kanban and Timeline gesture paths are isolated', () => {
  assert.match(read('src/screens/board/Board.js'), /from '\.\.\/\.\.\/board\/boardGesture'/);
  assert.match(read('src/screens/timeline/Timeline.js'), /from '\.\.\/\.\.\/gestures\/gesture'/);
  assert.match(read('src/screens/timeline/Timeline.js'), /from '\.\.\/\.\.\/gestures\/gestureSurface'/);
});
