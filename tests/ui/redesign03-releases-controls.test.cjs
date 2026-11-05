// /tests/ui/redesign03-releases-controls.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { screenHarness, nodes, control } = require('../helpers/screen-harness.cjs');

test('Releases control inventory: header New release, name/version/repo/notes, Cancel, Create/Save, gates, four stages, Edit metadata and confirmed Delete', () => {
  let accepted = false; const calls = [];
  const s = { releases: [{ id: 'r1', name: '1.0', version: '1.0', repo: 'local', notes: '', tasks: [], stage: 'Ready', gates: [{ label: 'Evidence', ok: false }] }] };
  const h = screenHarness('src/screens/delivery/Delivery.js', { s, createRelease: d => { calls.push(d); return accepted; }, setStage: (...a) => calls.push(a), editRelease: (...a) => { calls.push(a); return true; }, deleteRelease: id => calls.push(id) });
  let tree = h.render('Releases');
  assert.ok(nodes(tree).some(n => n.props.title === 'Verification gates'));
  const stage = nodes(tree).find(n => n.type === 'Segmented');
  assert.deepEqual(Array.from(stage.props.options), ['Planned', 'Testing', 'Ready', 'Released']);
  stage.props.onChange('Testing'); assert.deepEqual(calls.pop(), ['r1', 'Testing']);
  h.headers.releases.actions[0].onPress(); tree = h.render('Releases');
  for (const title of ['Release name', 'Version', 'Repository reference', 'Notes']) assert.ok(nodes(tree).some(n => n.type === 'Labeled' && n.props.title === title), title);
  control(tree, 'Create release').props.onPress(); assert.ok(control(h.render('Releases'), 'Create release'), 'failure keeps draft open');
  accepted = true; control(tree, 'Create release').props.onPress(); assert.equal(control(h.render('Releases'), 'Create release'), undefined);
  tree = h.render('Releases'); control(tree, 'Edit metadata').props.onPress(); tree = h.render('Releases');
  assert.ok(control(tree, 'Cancel')); control(tree, 'Save changes').props.onPress();
  tree = h.render('Releases'); control(tree, 'Delete release').props.onConfirm(); assert.equal(calls.at(-1), 'r1');
  assert.equal(s.releases[0].stage, 'Ready', 'render never changes a release stage');
});
