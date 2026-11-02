// /tests/app/refactor-batch01-0521.test.cjs
// Batch 01 refactor: pure helpers moved out of Board.js / Timeline.js keep their exact behavior.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const read = (p) => fs.readFileSync(path.join(__dirname, '..', '..', p), 'utf8');

const { roundPath, distToPath } = require('../../src/timeline/timelineGeometry.cjs');
const { refreshMax } = require('../../src/gestures/scrollLimits.cjs');
const ctx = require('../../src/board/boardDragContext.cjs');

test('roundPath: straight line stays straight, a corner becomes one curve', () => {
  assert.equal(roundPath([[0, 0], [10, 0]]), 'M0,0 L10,0');
  assert.equal(roundPath([[0, 0], [10, 0], [10, 10]]), 'M0,0 L0,0 Q10,0 10,10 L10,10');
});

test('distToPath: distance to a segment, clamped at its ends', () => {
  assert.equal(distToPath([[0, 0], [10, 0]], 5, 3), 3);
  assert.equal(distToPath([[0, 0], [10, 0]], 20, 0), 10);
  assert.equal(distToPath([[4, 4], [4, 4]], 4, 7), 3); // zero-length segment
});

test('refreshMax: never negative, follows content minus visible size', () => {
  const k = { max: { x: 9, y: 9 }, size: { cw: 500, vw: 300, ch: 100, vh: 400 } };
  refreshMax(k);
  assert.deepEqual(k.max, { x: 200, y: 0 });
});

test('board drag context: fresh state and drop slot', () => {
  const k = ctx.newCtx();
  assert.deepEqual(k.scroll, { x: 0, y: 0 });
  assert.equal(k.pointer.valid, false);
  k.order = { L: ['a', 'b'] };
  k.win = { a: { y: 100, h: 40, sy: 0 }, b: { y: 150, h: 40, sy: 0 } };
  assert.deepEqual(ctx.slotFor(k, 'L', 110), { index: 0, before: 'a' });
  assert.deepEqual(ctx.slotFor(k, 'L', 130), { index: 1, before: 'b' });
  assert.deepEqual(ctx.slotFor(k, 'L', 300), { index: 2, before: null });
  assert.deepEqual(ctx.slotFor(k, 'L', 110, 'a'), { index: 0, before: 'b' });
  k.scroll.y = 50; // page scrolled 50px since the lift: everything sits 50px higher
  assert.deepEqual(ctx.slotFor(k, 'L', 60), { index: 0, before: 'a' });
});

test('screens use the extracted modules and no longer define them inline', () => {
  const board = read('src/screens/board/Board.js');
  const timeline = read('src/screens/timeline/Timeline.js');
  assert.match(board, /from '\.\/BoardManagement'/);
  assert.match(board, /require\('\.\.\/\.\.\/board\/boardDragContext\.cjs'\)/);
  assert.doesNotMatch(board, /function (newCtx|slotFor|refreshMax|AddCard|NewListSheet|BoardsManager|BoardNameEditor)\b/);
  assert.match(timeline, /require\('\.\.\/\.\.\/timeline\/timelineGeometry\.cjs'\)/);
  assert.match(timeline, /require\('\.\.\/\.\.\/gestures\/scrollLimits\.cjs'\)/);
  assert.doesNotMatch(timeline, /function (roundPath|distToPath|refreshMax)\b/);
  const mgmt = read('src/screens/board/BoardManagement.js');
  for (const n of ['AddCard', 'NewListSheet', 'BoardsManager']) assert.match(mgmt, new RegExp(`export function ${n}\\b`));
});
