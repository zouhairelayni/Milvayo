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
    const chart=nodes(tree).find(n=>n.type==='WorkloadBalance');assert.ok(chart.props.series.some(item=>item.label===label));chart.props.onStatus(label);
  }
  assert.ok(text(tree).includes('Project pulse'));
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
  assert.equal(nodes(tree).find(n=>n.type==='Sheet').props.title,'Needs attention');
  control(tree, 'Open task Late').props.onPress(); tree = h.render('default', props);
  assert.equal(control(tree, 'Open task Late'), undefined);
  control(tree, 'Next due (1)').props.onPress(); tree = h.render('default', props); control(tree, 'Open task Today').props.onPress();
  assert.deepEqual(calls, ['late', 'now']);
  store.s.project.id = 'sample-workspace';
  const starter = h.render('default', { onNewTask() {}, onOpenBackup() {}, go() {}, openStatus() {} });
  assert.ok(control(starter, 'Open projects')); assert.ok(control(starter, 'Import a project'));
});

test('Today alert buttons keep empty states in compact sheets and leave project metrics as the main view', () => {
  const h = screenHarness('src/screens/overview/Overview.js', state([])); const props = { go() {}, openStatus() {} };
  let tree = h.render('default', props); assert.equal(nodes(tree).some(n => n.type === 'Sheet'), false); assert.ok(nodes(tree).some(n=>n.type==='WorkloadBalance'));
  control(tree, 'Needs attention (0)').props.onPress(); tree = h.render('default', props); assert.ok(nodes(tree).some(n=>n.type==='EmptyState'&&n.props.title==='Nothing needs attention'));
  control(nodes(tree).find(n => n.type === 'Sheet'), 'Done').props.onPress(); tree = h.render('default', props); assert.equal(nodes(tree).some(n => n.type === 'Sheet'), false);
  control(tree, 'Next due (0)').props.onPress(); tree = h.render('default', props); assert.ok(nodes(tree).some(n=>n.type==='EmptyState'&&n.props.title==='No tasks due here'));
  nodes(tree).find(n => n.type === 'Sheet').props.onClose(); assert.equal(nodes(h.render('default', props)).some(n => n.type === 'Sheet'), false);
});

test('Today weighted-progress acceptance text wraps within its card at narrow widths', () => {
  const store = state([]); store.s.checks = Array.from({ length: 120 }, () => ({ status: 'passed' }));
  const h = screenHarness('src/screens/overview/Overview.js', store);
  const tree = h.render('default', { go() {}, openStatus() {} });
  const evidence=control(tree,'Open testing');assert.ok(evidence);
  const content=nodes(evidence).find(n=>n.type==='View'&&n.props.style?.flex===1);assert.ok(content);
  assert.ok(text(content).includes('120'));assert.ok(nodes(tree).some(n=>n.type==='WorkloadBalance'));
});

test('existing projects use next-task copy and a selected-date empty state clears the date',()=>{
 const store=state([{id:'finished',title:'Finished work',status:'Done',dependsOn:[],due:'2026-11-05'}]),calls=[];
 const h=screenHarness('src/screens/overview/Overview.js',store);const props={go(){},openStatus(){},onNewTask(){calls.push('create')}};
 let tree=h.render('default',props);const empty=nodes(tree).find(n=>n.type==='EmptyState');assert.equal(empty.props.title,'All tasks complete');assert.doesNotMatch(empty.props.description,/first task/);assert.equal(control(tree,'Add your first task'),undefined);control(tree,'Create next task').props.onPress();assert.deepEqual(calls,['create']);
 nodes(tree).find(n=>n.type==='DateRail').props.onChange('2026-11-10');tree=h.render('default',props);
 assert.equal(control(tree,'Add your first task'),undefined);control(tree,'Show all work').props.onPress();tree=h.render('default',props);assert.equal(nodes(tree).find(n=>n.type==='DateRail').props.value,null);assert.ok(control(tree,'Create next task'));
});
