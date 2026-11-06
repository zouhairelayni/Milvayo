// /tests/board/board-compact-actions.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { screenHarness, nodes, control, text } = require('../helpers/screen-harness.cjs');
const { visibleColumns } = require('../../src/board/boardColumns.cjs');

test('List Due soon shows three rows, scrolls through the rest, and preserves callbacks and dates', () => {
  const tasks = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth'].map((title, id) => ({ id: String(id), title, due: '2026-11-10' })); const saved = JSON.stringify(tasks); const calls = [];
  const h = screenHarness('src/screens/tasks/DueSoon.js', {}, { platform: 'android' }); const props = { tasks, onOpenTask: id => calls.push(id) };
  let tree = h.render('default', props); const scroll = () => nodes(tree).find(n => n.type === 'ScrollView');
  assert.ok(control(tree, 'Open task Third')); assert.equal(control(tree, 'Open task Fourth'), undefined);
  assert.equal(scroll().props.style.height, 168); assert.match(text(tree), /Scroll to navigate tasks/);
  const e = { nativeEvent: { contentOffset: { y: 20 }, layoutMeasurement: { height: 168 }, contentSize: { height: 196 } } };
  scroll().props.onScroll(e); tree = h.render('default', props); assert.equal(control(tree, 'Open task Fourth'), undefined);
  scroll().props.onScrollBeginDrag(); scroll().props.onScroll(e); tree = h.render('default', props); assert.ok(control(tree, 'Open task Sixth'));
  control(tree, 'Open task Second').props.onPress(); assert.deepEqual(calls, ['1']); assert.equal(JSON.stringify(tasks), saved);
  assert.equal(control(tree, 'See more'), undefined); assert.equal(control(tree, 'See less'), undefined);
  const one = h.render('default', { ...props, tasks: tasks.slice(0, 1) }); assert.equal(nodes(one).find(n => n.type === 'ScrollView').props.style.height, 56);
  const empty = h.render('default', { ...props, tasks: [] }); assert.match(text(empty), /Nothing due soon/); assert.equal(nodes(empty).some(n => n.type === 'ScrollView'), false);
});

test('Board creation replaces the vertical Add list action; native column window starts at zero and reaches the last columns', () => {
  const b = fs.readFileSync(path.resolve(__dirname, '../../src/screens/board/Board.js'), 'utf8');
  assert.doesNotMatch(b, /accessibilityLabel="Add list"|rotate: '-90deg'/);
  assert.match(b, /label="Create board or list"/);
  assert.doesNotMatch(b, /<UpcomingDates|<DueSoon|dueSoon\(project/);
  assert.deepEqual(visibleColumns(3, 0, 1, 280, 14), [0]); assert.deepEqual(visibleColumns(3, 550, 300, 280, 14), [1, 2]);
  assert.deepEqual(visibleColumns(0, 0, 300, 280, 14), []);
});
