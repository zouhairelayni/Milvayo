// /tests/ui/list-due-soon-screen-chrome.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const model = require('../../src/domain/model.cjs');
const bridge = require('../../src/domain/modernBridge.cjs');
const powerUps = require('../../src/domain/powerUps.cjs');
const { dueSoonForList } = require('../../src/screens/tasks/dueSoon.cjs');
const { screenHarness, nodes, control, text } = require('../helpers/screen-harness.cjs');
const read = file => fs.readFileSync(path.resolve(__dirname, '../..', file), 'utf8');
const fixture = () => model.makeProject({ id: 'p', name: 'Studio', boards: [{ id: 'board-design', name: 'Design' }, { id: 'board-hidden', name: 'Hidden' }, { id: 'board-old', name: 'Archive', archived: true }], powerUps: { 'board-default': ['calendar'], 'board-design': ['calendar'], 'board-old': ['calendar'] }, tasks: [
  { id: 'a', title: 'First', due: '2026-11-05' }, { id: 'b', title: 'Second', boardId: 'board-design', due: '2026-11-06' },
  { id: 'past', title: 'Past', due: '2026-11-04' }, { id: 'later', title: 'Later', due: '2026-12-06' },
  { id: 'done', title: 'Done', status: 'Done', due: '2026-11-05' }, { id: 'undated', title: 'Undated' },
  { id: 'hidden', title: 'Disabled board', boardId: 'board-hidden', due: '2026-11-05' }, { id: 'old', title: 'Archived board', boardId: 'board-old', due: '2026-11-05' },
] });

test('Due soon merges enabled boards, preserves date/status/archive rules and survives import without mutation', () => {
  const p = fixture(), saved = JSON.stringify(p); const result = dueSoonForList(p, '2026-11-05');
  assert.deepEqual(result.tasks.map(t => t.id), ['a', 'b']); assert.deepEqual(result.boards.map(b => b.id), ['board-default', 'board-design']);
  assert.deepEqual(dueSoonForList(model.importProject(JSON.parse(saved)), '2026-11-05'), result); assert.equal(JSON.stringify(p), saved);
  assert.deepEqual(dueSoonForList({ ...p, powerUps: {} }, '2026-11-05'), { boards: [], tasks: [] });
  const many = model.makeProject({ ...p, tasks: Array.from({ length: 50 }, (_, n) => ({ id: String(n), title: 'Task ' + n, boardId: n % 2 ? 'board-design' : 'board-default', due: '2026-11-06', position: n })) });
  assert.equal(dueSoonForList(many, '2026-11-05').tasks.length, 30);
});

test('List keeps the preview, task-open callback and relocated per-board date switches; Board contains neither dates panel nor date switch', () => {
  let workspace = model.normalizeWorkspace({ ...model.createWorkspace(), selectedId: 'p', projects: [fixture()] }); const calls = [];
  const store = { workspace, s: bridge.projectView(workspace), togglePowerUp(id, tool) {
    calls.push([id, tool]); workspace = { ...workspace, projects: workspace.projects.map(p => p.id === 'p' ? powerUps.toggle(p, id, tool) : p) }; store.workspace = workspace; store.s = bridge.projectView(workspace);
  } };
  const savedTasks = JSON.stringify(workspace.projects[0].tasks); const h = screenHarness('src/screens/tasks/Tasks.js', store);
  const props = { openTask: id => calls.push(id), onNewTask() {} }; let tree = h.render('default', props);
  let preview = nodes(tree).find(n => n.type === 'DueSoon'); assert.deepEqual(preview.props.tasks.map(t => t.id), ['a', 'b']); preview.props.onOpenTask('a'); assert.equal(calls.at(-1), 'a');
  h.headers.tasks.actions[0].onPress(); tree = h.render('default', props); control(tree, 'Design').props.onPress(); tree = h.render('default', props);
  assert.deepEqual(calls.at(-1), ['board-design', 'calendar']); preview = nodes(tree).find(n => n.type === 'DueSoon'); assert.deepEqual(preview.props.tasks.map(t => t.id), ['a']);
  control(tree, 'Main board').props.onPress(); tree = h.render('default', props); assert.equal(nodes(tree).some(n => n.type === 'DueSoon'), false);
  assert.equal(JSON.stringify(workspace.projects[0].tasks), savedTasks);
  const board = read('src/screens/board/Board.js'); assert.doesNotMatch(board, /UpcomingDates|DueSoon|\['calendar'/);
});

test('Home, Work and Projects hide project-name text while both header layouts retain the hamburger, search and popup controls', () => {
  const store = { s: { project: { name: 'Studio' } }, workspaceList: { activeId: 'w', items: [{ id: 'w', name: 'Workspace' }] } };
  const menu = screenHarness('src/components/shell/Menus.js', store);
  let tree = menu.render('ProjectSwitcher', { showProjectName: false, onPickProject() {} }); assert.equal(text(tree).includes('Studio'), false); assert.ok(control(tree, 'Open workspace menu'));
  tree = menu.render('ProjectSwitcher', { onPickProject() {} }); assert.ok(text(tree).includes('Studio'));
  const header = screenHarness('src/components/shell/Bars.js', {});
  for (const name of ['TopBar', 'PhoneHeader']) {
    tree = header.render(name, { kind: 'main', showProjectName: false, onPickProject() {}, onQuery() {}, onNew() {} });
    assert.equal(nodes(tree).find(n => n.type === 'ProjectSwitcher').props.showProjectName, false);
    assert.ok(nodes(tree).some(n => n.props.label === 'Search tasks' || n.props.accessibilityLabel === 'Search tasks'));
  }
  assert.equal((read('src/app/ModernApp.js').match(/showProjectName=\{screen !== 'overview' && section.id !== 'work' && section.id !== 'projects'\}/g) || []).length, 2);
});

test('Visible page titles are removed while back/header actions, overview sections and modal titles remain', () => {
  const h = screenHarness('src/components/shell/Bars.js', {}); let backed = 0;
  assert.equal(h.render('PhoneHeader', { kind: 'hub', title: 'More' }), null);
  const tree = h.render('PhoneHeader', { kind: 'sub', title: 'Testing', onBack: () => backed++, controls: { actions: [{ label: 'New item', icon: 'plus', onPress() {} }] } });
  assert.equal(text(tree).includes('Testing'), false); control(tree, 'Back to More').props.onPress(); assert.equal(backed, 1);
  assert.ok(nodes(tree).some(n => typeof n.type === 'function' && n.type.name === 'HeaderIcons'));
  for (const file of ['src/screens/overview/Overview.js', 'src/screens/delivery/Delivery.js']) assert.doesNotMatch(read(file), /accessibilityRole="header"/);
  assert.match(read('src/screens/overview/Overview.js'), /Project overview<\/SectionTitle>/);
  assert.match(read('src/ui/uiLayout.js'), /accessibilityRole="header">\{title\}/);
});
