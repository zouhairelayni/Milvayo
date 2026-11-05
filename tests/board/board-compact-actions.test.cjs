// /tests/board/board-compact-actions.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { screenHarness, nodes, control, text } = require('../helpers/screen-harness.cjs');
const { visibleColumns } = require('../../src/board/boardColumns.cjs');

test('List Due soon shows one task, expands/collapses on demand, and preserves task-open callbacks without changing dates', () => {
  const tasks = ['First', 'Second', 'Third'].map((title, id) => ({ id: String(id), title, due: '2026-11-10' })); const saved = JSON.stringify(tasks); const calls = [];
  const h = screenHarness('src/screens/tasks/DueSoon.js', {}); const props = { tasks, onOpenTask: id => calls.push(id) };
  let tree = h.render('default', props); assert.ok(control(tree, 'Open task First')); assert.equal(control(tree, 'Open task Second'), undefined);
  control(tree, 'See more').props.onPress(); tree = h.render('default', props); assert.ok(control(tree, 'Open task Third')); control(tree, 'Open task Second').props.onPress(); assert.deepEqual(calls, ['1']);
  control(tree, 'See less').props.onPress(); assert.equal(control(h.render('default', props), 'Open task Second'), undefined); assert.equal(JSON.stringify(tasks), saved);
  const one = h.render('default', { ...props, tasks: tasks.slice(0, 1) }); assert.equal(control(one, 'See more'), undefined);
  const empty = h.render('default', { ...props, tasks: [] }); assert.ok(text(empty).includes('Nothing due soon')); assert.equal(control(empty, 'See more'), undefined);
});

test('Add list follows all columns as a compact vertical action; native column window starts at zero and reaches the last columns', () => {
  const b = fs.readFileSync(path.resolve(__dirname, '../../src/screens/board/Board.js'), 'utf8');
  const add = b.indexOf('accessibilityLabel="Add list"'); assert.ok(add > b.indexOf('{lists.map((l, i) => ('));
  assert.match(b.slice(add, add + 1300), /width: 44, minHeight: 112/); assert.match(b.slice(add, add + 1300), /rotate: '-90deg'/);
  assert.doesNotMatch(b, /<UpcomingDates|<DueSoon|dueSoon\(project/);
  assert.deepEqual(visibleColumns(3, 0, 1, 280, 14), [0]); assert.deepEqual(visibleColumns(3, 550, 300, 280, 14), [1, 2]);
  assert.deepEqual(visibleColumns(0, 0, 300, 280, 14), []);
});
