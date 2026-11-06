// /tests/domain/advanced-tasks-tool.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const model = require('../../src/domain/model.cjs');
const bridge = require('../../src/domain/modernBridge.cjs');
const pt = require('../../src/domain/projectTools.cjs');
const { screenHarness, nodes } = require('../helpers/screen-harness.cjs');

test('Advanced tasks defaults preserve existing access, new projects stay lean, and switch/import round trips retain all task fields', () => {
  const p = model.makeProject({ id: 'p', name: 'Existing', tasks: [{ id: 't', title: 'A', expected: 'Proof', rollback: 'Restore', dependsOn: [] }] });
  assert.equal(p.tools.advancedTasks, true); assert.equal(pt.LEAN.advancedTasks, false);
  const off = model.makeProject({ ...p, tools: pt.setTool(p.tools, 'advancedTasks', false) }); assert.deepEqual(off.tasks, p.tasks);
  const restored = model.importProject(JSON.parse(JSON.stringify(off))); assert.equal(restored.tools.advancedTasks, false); assert.deepEqual(restored.tasks, p.tasks);
  assert.equal(pt.setTool(restored.tools, 'advancedTasks', true).advancedTasks, true);
  for (const id of ['tasks', 'board', 'scheduling', 'settings']) assert.equal(pt.screenOn(off.tools, id), true);
  assert.throws(() => pt.setTool(p.tools, 'advanced-tasks-typo', false), /Unknown tool/);
});

test('Planning & delivery remains available with legacy Advanced tasks off, while Manage tools omits the retired switch', () => {
  const p = model.makeProject({ id: 'p', name: 'P', tasks: [{ id: 't', title: 'A' }] }); const ws = model.normalizeWorkspace({ ...model.createWorkspace(), selectedId: 'p', projects: [p] });
  const s = bridge.projectView(ws), saved = JSON.stringify(ws), tools = { advancedTasks: false };
  const h = screenHarness('src/screens/tasks/TaskSheet.js', { s, workspace: ws }, { tools }); const props = { taskId: 't', onClose() {} };
  let tree = h.render('default', props);
  const tabs = nodes(tree).find(n => n.type === 'Segmented' && n.props.options.some(x => x.value === 'planning'));
  assert.ok(tabs); tabs.props.onChange('planning'); tree = h.render('default', props);
  const rows = nodes(tree).filter(n => n.type === 'InlineDrop').map(n => n.props.id);
  for (const id of ['schedule', 'dependencies', 'verification']) assert.ok(rows.includes(id), id);
  assert.equal(JSON.stringify(ws), saved);
  const calls = [], toolSheet = screenHarness('src/screens/more/ProjectToolsSheet.js', { s, setProjectTool: (...a) => calls.push(a) }, { tools });
  const options = nodes(toolSheet.render('default', { visible: true, onClose() {} }));
  assert.equal(options.some(n => n.props.accessibilityLabel === 'Advanced tasks tool'), false);
  const option = options.find(n => n.props.accessibilityLabel === 'Sprints tool');
  assert.ok(option); option.props.onValueChange(true); assert.deepEqual(calls, [['sprints', true]]);
});
