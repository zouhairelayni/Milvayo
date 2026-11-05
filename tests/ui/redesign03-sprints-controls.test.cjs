// /tests/ui/redesign03-sprints-controls.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { screenHarness, nodes, control, text } = require('../helpers/screen-harness.cjs');

test('Sprints control inventory: New/first sprint, selector, Start/Edit/Delete, Finish/confirm/Cancel, name/goal/dates/Save, assigned Open/Remove, backlog search/Add/Show more, historical scope and interactive burndown', () => {
  const calls = []; let save = false;
  const s = { tasks: [{ id: 'a', title: 'Assigned', status: 'Backlog', sprint: 'sp' }, ...Array.from({ length: 26 }, (_, i) => ({ id: 'b' + i, title: 'Backlog ' + i, owner: 'Sam', status: 'Backlog', sprint: '' }))], sprints: [{ id: 'sp', name: 'Iteration', state: 'planned', start: '2026-11-05', end: '2026-11-18', goal: 'Deliver', burn: null }] };
  const h = screenHarness('src/screens/delivery/Delivery.js', { s, startSprint: id => calls.push(['start', id]), assignSprintTask: (...a) => calls.push(a), deleteSprint: id => calls.push(['delete', id]), finishSprint: id => calls.push(['finish', id]), createSprint: () => save && 'new', updateSprint: () => save });
  const props = { openTask: id => calls.push(['open', id]) };
  let tree = h.render('Sprints', props);
  assert.ok(nodes(tree).some(n => n.type === 'Chip' && n.props.active));
  for (const label of ['Start sprint', 'Edit', 'Delete', 'Remove', 'Add', 'Show more']) assert.ok(control(tree, label), label);
  control(tree, 'Start sprint').props.onPress(); control(tree, 'Remove').props.onPress(); control(tree, 'Add').props.onPress();
  assert.deepEqual(calls, [['start', 'sp'], ['a', ''], ['b0', 'sp']]);
  control(tree, 'Delete').props.onPress(); tree = h.render('Sprints', props); assert.ok(control(tree, 'Delete sprint')); control(tree, 'Cancel').props.onPress();
  control(tree, 'Edit').props.onPress(); tree = h.render('Sprints', props);
  for (const label of ['Name', 'Goal', 'Start (YYYY-MM-DD)', 'End (YYYY-MM-DD)']) assert.ok(nodes(tree).some(n => n.props.label === label), label);
  control(tree, 'Save sprint').props.onPress(); assert.ok(control(h.render('Sprints', props), 'Save sprint'), 'failure keeps form open');
  save = true; control(tree, 'Save sprint').props.onPress(); assert.equal(control(h.render('Sprints', props), 'Save sprint'), undefined);
  s.sprints[0].state = 'active'; tree = h.render('Sprints', props); control(tree, 'Finish sprint').props.onPress();
  assert.ok(control(h.render('Sprints', props), 'Confirm finish'));
  const snapshot = { state: 'completed', velocity: 7, taskIds: ['a', 'deleted'], burn: { days: ['5'], ideal: [1], recorded: [0] } };
  Object.assign(s.sprints[0], snapshot); const before = JSON.stringify(s);
  tree = h.render('Sprints', props);
  assert.equal(control(tree, 'Start sprint'), undefined); assert.equal(control(tree, 'Finish sprint'), undefined); assert.equal(control(tree, 'Add'), undefined);
  assert.ok(text(tree).includes('read-only')); assert.ok(nodes(tree).find(n => n.type === 'BurnChart').props.burn === snapshot.burn);
  assert.ok(control(tree, 'Deleted task deleted').props.disabled); assert.equal(JSON.stringify(s), before);
});
