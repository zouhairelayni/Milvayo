// /tests/domain/specifications-0525.test.cjs
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('../../src/domain/model.cjs');
const spec = model.specifications;
const base = () => model.makeProject({ name: 'S', code: 'S', tasks: [{ id: 't1', title: 'x', phaseId: 'ph1' }], phases: [{ id: 'ph1', name: 'Foundation', stage: 'Development' }] });

test('add, edit and delete an entry in every specification list, and the project still validates', () => {
  for (const kind of Object.keys(spec.KINDS)) {
    let p = model.validateProject(spec.save(base(), kind, { name: '  Entry one ', description: 'text' }));
    const mine = p[kind].find((x) => x.name === 'Entry one');
    assert.ok(mine && mine.id, `${kind} added with trimmed name and an id`);
    p = model.validateProject(spec.save(p, kind, { id: mine.id, name: 'Entry renamed' }));
    const again = p[kind].find((x) => x.id === mine.id);
    assert.equal(again.name, 'Entry renamed');
    assert.equal(again.description, 'text', 'a field the edit did not carry is kept');
    p = model.validateProject(spec.remove(p, kind, mine.id));
    assert.ok(!p[kind].some((x) => x.id === mine.id));
  }
});
test('phases keep their stage, goal and exit criteria', () => {
  const p = model.validateProject(spec.save(base(), 'phases', { name: 'Launch', stage: 'Production', goal: 'Go live', exit: 'No open blockers' }));
  const ph = p.phases.find((x) => x.name === 'Launch');
  assert.deepEqual([ph.stage, ph.goal, ph.exit], ['Production', 'Go live', 'No open blockers']);
});
test('invalid input is refused and the project is not changed', () => {
  const p = base();
  assert.throws(() => spec.save(p, 'playbooks', { name: '   ' }), /name/);
  assert.throws(() => spec.save(p, 'phases', { name: 'X', stage: 'Someday' }), /Development, Testing or Production/);
  assert.throws(() => spec.save(p, 'nope', { name: 'X' }), /Unknown specification type/);
  assert.throws(() => spec.save(p, 'schemas', { id: 'missing', name: 'X' }), /no longer exists/);
  assert.throws(() => spec.remove(p, 'schemas', 'missing'), /no longer exists/);
  assert.equal(p.phases.length, 1);
});
test('deleting a phase clears the phase on its tasks instead of leaving a dangling id', () => {
  const p = model.validateProject(spec.remove(base(), 'phases', 'ph1'));
  assert.equal(p.phases.length, 0);
  assert.equal(p.tasks[0].phaseId, '');
});
test('the original project is never mutated', () => {
  const p = base(); const snap = JSON.stringify(p);
  spec.save(p, 'playbooks', { name: 'A' }); spec.remove(p, 'phases', 'ph1');
  assert.equal(JSON.stringify(p), snap);
});
