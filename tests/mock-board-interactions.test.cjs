'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const model = require('../src/model.cjs');
const bridge = require('../src/modernBridge.cjs');
const { hitTitle, isDoubleTap, committedName } = require('../src/boardInteractions.cjs');
const { dragOffset, hasScrolledBeforeHold } = require('../src/boardDragMath.cjs');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('title double-tap geometry checks BOTH page coordinates, including edges', () => {
  const rect = { x: 100, y: 200, width: 170, height: 45 };
  assert.equal(hitTitle(rect, { x: 150, y: 225 }), true);
  assert.equal(hitTitle(rect, { x: 99, y: 225 }), false);
  assert.equal(hitTitle(rect, { x: 280, y: 225 }), false);
  assert.equal(hitTitle(rect, { x: 150, y: 199 }), false);
  assert.equal(hitTitle(rect, { x: 150, y: 246 }), false);
  assert.equal(hitTitle({ x: 0, y: 0, width: 0, height: 10 }, { x: 0, y: 0 }), false);
  assert.equal(hitTitle(null, { x: 0, y: 0 }), false);
});

test('title double tap threshold does not accidentally reopen sheet', () => {
  assert.equal(isDoubleTap(1250, 1000), true);
  assert.equal(isDoubleTap(1350, 1000), true);
  assert.equal(isDoubleTap(1351, 1000), false);
  assert.equal(isDoubleTap(100, 0), false);
  assert.equal(isDoubleTap(999, 1000), false);
});

test('inline rename keeps internal spaces and commits only a valid title', () => {
  assert.equal(committedName('  Implement onboarding and QA  ', 'Old title', 240), 'Implement onboarding and QA');
  assert.equal(committedName('  ', 'Old title', 240), 'Old title');
  assert.equal(committedName('a'.repeat(241), 'Old title', 240), 'Old title');
  assert.equal(committedName('Design and review', 'Original', 80), 'Design and review');
});

test('swipes cancel pending hold; finger-offset accounts for two-axis auto-scrolling', () => {
  assert.equal(hasScrolledBeforeHold(9, 0), true);
  assert.equal(hasScrolledBeforeHold(0, -10), true);
  assert.equal(hasScrolledBeforeHold(6, 6), false);
  assert.deepEqual(dragOffset({ x: 240, y: 430 }, { x: 220, y: 420 }, { x: 80, y: 150 }, { x: 50, y: 80 }), { x: 50, y: 80 });
});

test('original mock board controls remain wired after integration', () => {
  const board = read('src/screens/Board.js');
  const app = read('ModernApp.js');
  const native = read('src/boardGesture.native.js');
  const web = read('src/boardGesture.web.js');
  const nativeMotion = read('src/boardMotion.native.js');
  for (const pattern of [
    /onTap: \(\) => openTask\(t\.id\)/,
    /onTitleDoubleTap: beginTitleEdit/,
    /onTitleDoubleTap: beginRename/,
    /onLongPress=\{onManage\}/,
    /moveListTo\(board\.id, list\.id, to\)/,
    /placeTask\(t\.id, lists\[to\]\.id, slot\.before\)/,
    /onCancel:/,
    /<NewListSheet visible=\{addingList\}/,
    /<BoardsManager visible=\{managing\}/,
    /AddCard onAdd=/,
    /deleteList\(board\.id, list\.id\)/,
    /totalCards=\{s\.tasks\.filter/,
    /collapsable=\{false\}/,
  ]) assert.match(board, pattern);
  assert.match(app, /<TaskSheet taskId=\{taskId\}/);
  assert.match(native, /clearTimeout\(s\.openTimer\)/);
  assert.match(native, /hitTitle\(/);
  assert.match(native, /onCancel/);
  assert.match(web, /\.\/gesture/);
  assert.match(nativeMotion, /useAnimatedStyle/);
  assert.doesNotMatch(nativeMotion, /PanResponder|Animated\.timing/);
});

test('rename via task sheet and board inline commit preserves canonical fields', () => {
  const p = model.makeProject({ id: 'p', name: 'Renaming', code: 'NIR', tasks: [{ id: 'one', title: 'Original', status: 'Backlog', tests: [{ id: 'check', title: 'Review', evidence: 'proof' }], labels: ['keep'] }] });
  const renamed = bridge.patchTask(p, 'one', { title: committedName('  Long title with spaces ', 'Original', 240) });
  assert.equal(renamed.tasks[0].title, 'Long title with spaces');
  assert.deepEqual(renamed.tasks[0].labels, ['keep']);
  assert.equal(renamed.tasks[0].tests[0].id, 'check');
  const board = bridge.addList(renamed, bridge.MAIN, 'New list', 'Backlog');
  const id = board.boards[0].lists[0].id;
  const updated = bridge.renameList(board, bridge.MAIN, id, committedName('Design and QA', 'New list', 80));
  const persisted = model.importProject(JSON.parse(JSON.stringify(updated)));
  assert.equal(persisted.boards[0].lists[0].name, 'Design and QA');
  assert.equal(persisted.tasks[0].id, 'one');
});
