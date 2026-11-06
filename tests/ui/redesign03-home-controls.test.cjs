// /tests/ui/redesign03-home-controls.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { screenHarness, nodes, control, text } = require('../helpers/screen-harness.cjs');
const { todayTasks } = require('../../src/screens/overview/today.cjs');

const state = tasks => ({ s: { project: { name: 'Studio' }, tasks, checks: [], releases: [{ name: '1.0', stage: 'Planned', gates: [] }] } });
test('Home control inventory: first task, explicit import, projects, task rows, All tasks, status tiles, Overdue, Milestones, In sprint, releases, testing and Project overview', () => {
  const calls = [];
  const props = { onNewTask: () => calls.push('create'), onOpenBackup: () => calls.push('backup'), go: x => calls.push(x), openStatus: x => calls.push(x), openTask: x => calls.push(x) };
  const h = screenHarness('src/screens/overview/Overview.js', state([]));
  const tree = h.render('default', props);
  for (const label of ['Add your first task', 'Import a project', 'Open projects', 'All tasks', 'Open releases', 'Open testing']) assert.ok(control(tree, label), label);
  control(tree, 'Add your first task').props.onPress(); control(tree, 'Import a project').props.onPress(); control(tree, 'Open projects').props.onPress();
  assert.deepEqual(calls, ['create', 'backup', 'projects']);
  for (const label of ['Backlog', 'In progress', 'Validation', 'Done']) {
    const stat = nodes(tree).find(n => n.type === 'MetricStrip').props.items.find(item => item.label === label); assert.ok(stat, label); stat.onPress();
  }
  assert.ok(text(tree).includes('Project overview'));
  assert.equal(nodes(tree).some(n => n.type === 'Fold'), false);
  const noTools = screenHarness('src/screens/overview/Overview.js', state([]), { tools: {} }).render('default', props);
  assert.equal(control(noTools, 'Open releases'), undefined); assert.equal(control(noTools, 'Open testing'), undefined);
});

test('Today handles overdue, blocked, done, missing dependency and undated tasks without mutation; display survives project import', () => {
  const model = require('../../src/domain/model.cjs');
  const p = model.makeProject({ name: 'Today fixture', tasks: [
    { id: 'late', title: 'Late', due: '2026-11-04' }, { id: 'now', title: 'Today', due: '2026-11-05' },
    { id: 'done', title: 'Done', status: 'Done', due: '2026-11-01' },
    { id: 'wait', title: 'Wait', dependsOn: ['late'] }, { id: 'free', title: 'No date' },
  ] });
  const before = JSON.stringify(p);
  const result = todayTasks(p.tasks, '2026-11-05');
  assert.deepEqual(result.attention.map(x => x.task.id), ['late', 'wait']);
  assert.deepEqual(result.upcoming.map(x => x.id), ['now']);
  assert.deepEqual(todayTasks([], '2026-11-05'), { attention: [], upcoming: [] });
  assert.equal(todayTasks([{ id: 'orphan', status: 'Backlog', dependsOn: ['missing'] }], '2026-11-05').attention.length, 1);
  assert.deepEqual(todayTasks(model.importProject(JSON.parse(before)).tasks, '2026-11-05'), result);
  assert.equal(JSON.stringify(p), before);
  const store = state(p.tasks); const calls = [];
  const h = screenHarness('src/screens/overview/Overview.js', store);
  const props = { openTask: id => calls.push(id), go() {}, openStatus() {} };
  let tree = h.render('default', props);
  assert.equal(control(tree, 'Add your first task'), undefined);
  assert.equal(control(tree, 'Open task Late'), undefined);
  control(tree, 'Needs attention (2)').props.onPress(); tree = h.render('default', props);
  assert.ok(nodes(tree).find(n => n.type === 'Sheet').props.compact);
  control(tree, 'Open task Late').props.onPress(); tree = h.render('default', props);
  assert.equal(control(tree, 'Open task Late'), undefined);
  control(tree, 'Next due (1)').props.onPress(); tree = h.render('default', props); control(tree, 'Open task Today').props.onPress();
  assert.deepEqual(calls, ['late', 'now']);
  store.s.project.id = 'sample-workspace';
  const starter = h.render('default', { onNewTask() {}, onOpenBackup() {}, go() {}, openStatus() {} });
  assert.ok(control(starter, 'Add a task')); assert.ok(control(starter, 'Import a project'));
});

test('Today alert buttons keep empty states in compact sheets and leave project metrics as the main view', () => {
  const h = screenHarness('src/screens/overview/Overview.js', state([])); const props = { go() {}, openStatus() {} };
  let tree = h.render('default', props); assert.equal(nodes(tree).some(n => n.type === 'Sheet'), false); assert.ok(text(tree).includes('Weighted progress'));
  control(tree, 'Needs attention (0)').props.onPress(); tree = h.render('default', props); assert.ok(text(tree).includes('Nothing needs attention'));
  control(nodes(tree).find(n => n.type === 'Sheet'), 'Done').props.onPress(); tree = h.render('default', props); assert.equal(nodes(tree).some(n => n.type === 'Sheet'), false);
  control(tree, 'Next due (0)').props.onPress(); tree = h.render('default', props); assert.ok(text(tree).includes('No upcoming dated tasks'));
  nodes(tree).find(n => n.type === 'Sheet').props.onClose(); assert.equal(nodes(h.render('default', props)).some(n => n.type === 'Sheet'), false);
});

test('Today weighted-progress acceptance text wraps within its card at narrow widths', () => {
  const store = state([]); store.s.checks = Array.from({ length: 120 }, () => ({ status: 'passed' }));
  const h = screenHarness('src/screens/overview/Overview.js', store);
  const tree = h.render('default', { go() {}, openStatus() {} });
  const row = nodes(tree).find(n => n.type === 'View' && Array.isArray(n.props.children) && n.props.children.some(child => child && child.type === 'T' && text(child).includes('acceptance checks passed')));
  assert.equal(row.props.style.flexWrap, 'wrap');
  const label = nodes(row).find(n => n.type === 'T' && text(n).includes('acceptance checks passed'));
  assert.equal(label.props.style.flexShrink, 1); assert.equal(label.props.style.maxWidth, '100%');
  assert.ok(text(label).includes('120')); assert.ok(text(tree).includes('Weighted progress'));
});
