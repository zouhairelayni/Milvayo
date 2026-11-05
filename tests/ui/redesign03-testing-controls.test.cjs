// /tests/ui/redesign03-testing-controls.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { screenHarness, nodes, control, text } = require('../helpers/screen-harness.cjs');

test('Testing control inventory: four status counts, check row, Show more, result pending/passed/failed/blocked, Done and sheet dismissal', () => {
  const calls = [];
  const s = { tasks: [], checks: Array.from({ length: 26 }, (_, i) => ({ id: 'c' + i, title: 'Check ' + i, status: 'pending', taskId: 'missing', evidence: true })) };
  const h = screenHarness('src/screens/delivery/Delivery.js', { s, setCheck: (...a) => calls.push(a) });
  let tree = h.render('Testing');
  for (const label of ['Pending', 'Passed', 'Failed', 'Blocked']) assert.ok(text(tree).includes(label));
  assert.ok(text(tree).includes('No task')); assert.equal(control(tree, 'Edit acceptance check Check 25'), undefined);
  control(tree, 'Show more (1 left)').props.onPress(); tree = h.render('Testing'); assert.ok(control(tree, 'Edit acceptance check Check 25'));
  control(tree, 'Edit acceptance check Check 0').props.onPress(); tree = h.render('Testing');
  for (const status of ['pending', 'passed', 'failed', 'blocked']) control(tree, status).props.onPress();
  assert.deepEqual(calls, ['pending', 'passed', 'failed', 'blocked'].map(x => ['c0', x]));
  control(tree, 'Done').props.onPress(); assert.equal(control(h.render('Testing'), 'Done'), undefined);
  control(tree, 'Done').props.onPress(); s.checks = [];
  assert.ok(text(h.render('Testing')).includes('No acceptance checks yet.'));
  assert.equal(nodes(h.render('Testing')).some(n => n.type === 'Sheet'), false);
});
