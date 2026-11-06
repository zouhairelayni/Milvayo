// /tests/ui/header-workspace-popup.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { screenHarness, nodes, control } = require('../helpers/screen-harness.cjs');
const drawer = (tree, name) => nodes(tree).find(n => typeof n.type === 'function' && n.type.name === name);
const store = () => ({ s: { project: { name: 'Studio' } }, projects: [{ id: 'p1', name: 'Studio', current: true, release: '1', tasks: 2 }, { id: 'old', name: 'Archived', archived: true }], workspaceList: { activeId: 'w1', items: [{ id: 'w1', name: 'Main' }, { id: 'w2', name: 'Other' }] }, workspace: { projects: [{ id: 'p1' }] } });

test('Hamburger opens a compact Projects/Workspaces sheet; project selection, creation/cancel and Done remain wired', () => {
  const calls = []; const h = screenHarness('src/components/shell/Menus.js', store()); const props = { onPickProject: (...a) => calls.push(a), compact: true };
  let tree = h.render('ProjectSwitcher', props); assert.equal(nodes(tree).some(n => n.type === 'Sheet'), false);
  control(tree, 'Open workspace menu').props.onPress(); tree = h.render('ProjectSwitcher', props);
  assert.ok(nodes(tree).find(n => n.type === 'Sheet').props.compact);
  let p = drawer(tree, 'ProjectDrawer'); let body = h.render(p.type, p.props);
  assert.equal(control(body, 'Open project Archived'), undefined);
  control(body, 'Open project Studio').props.onPress(); assert.deepEqual(calls, [['p1', false]]);
  assert.equal(nodes(h.render('ProjectSwitcher', props)).some(n => n.type === 'Sheet'), false);
  control(tree, 'Open workspace menu').props.onPress(); tree = h.render('ProjectSwitcher', props); p = drawer(tree, 'ProjectDrawer'); body = h.render(p.type, p.props);
  control(body, 'Create new project').props.onPress(); body = h.render(p.type, p.props);
  nodes(body).find(n => n.type === 'CreateProjectSheet').props.onClose(); body = h.render(p.type, p.props); assert.ok(control(body, 'Create new project'));
  control(body, 'Create new project').props.onPress(); body = h.render(p.type, p.props); nodes(body).find(n => n.type === 'CreateProjectSheet').props.onCreated('p3');
  assert.deepEqual(calls.at(-1), ['p3', true]);
  control(tree, 'Open workspace menu').props.onPress(); tree = h.render('ProjectSwitcher', props); control(tree, 'Done').props.onPress();
  assert.equal(control(h.render('ProjectSwitcher', props), 'Done'), undefined);
});

test('Workspace view retains create/rename/confirmed delete and failed-switch recovery; successful switch returns to Projects', async () => {
  const s = store(); let accepted = false; const calls = [];
  Object.assign(s, { switchWorkspace: async id => { calls.push(['switch', id]); return accepted; }, createWorkspace: async name => { calls.push(['create', name]); return accepted; }, renameWorkspace: async (...a) => { calls.push(['rename', ...a]); return accepted; }, deleteWorkspace: async id => { calls.push(['delete', id]); return accepted; } });
  const h = screenHarness('src/components/shell/Menus.js', s); const props = { onPickProject() {} };
  let tree = h.render('ProjectSwitcher', props); control(tree, 'Open workspace menu').props.onPress(); tree = h.render('ProjectSwitcher', props);
  nodes(tree).find(n => n.type === 'Segmented').props.onChange('Workspaces'); tree = h.render('ProjectSwitcher', props);
  const w = drawer(tree, 'WorkspaceDrawer'); let body = h.render(w.type, w.props);
  await control(body, 'Open workspace Other').props.onPress(); assert.ok(drawer(h.render('ProjectSwitcher', props), 'WorkspaceDrawer'), 'failure keeps the view open');
  control(body, 'Edit workspace Other').props.onPress(); body = h.render(w.type, w.props);
  nodes(body).find(n => n.type === 'Input').props.onChangeText('Renamed'); body = h.render(w.type, w.props);
  await control(body, 'Save name').props.onPress(); assert.ok(control(h.render(w.type, w.props), 'Save name'), 'failed rename preserves the editor');
  accepted = true; await control(body, 'Save name').props.onPress(); body = h.render(w.type, w.props); assert.equal(control(body, 'Save name'), undefined);
  control(body, 'Edit workspace Other').props.onPress(); body = h.render(w.type, w.props); await control(body, 'Delete workspace').props.onConfirm();
  assert.ok(calls.some(x => x[0] === 'delete' && x[1] === 'w2'));
  control(body, 'Create new workspace').props.onPress(); body = h.render(w.type, w.props); nodes(body).find(n => n.type === 'Input').props.onChangeText('New'); body = h.render(w.type, w.props);
  accepted = false; await control(body, 'Create').props.onPress(); assert.ok(control(h.render(w.type, w.props), 'Create'));
  accepted = true; await control(body, 'Create').props.onPress(); assert.ok(drawer(h.render('ProjectSwitcher', props), 'ProjectDrawer'));
  s.workspaceList.items = [s.workspaceList.items[0]];
  control(tree, 'Open workspace menu').props.onPress(); tree = h.render('ProjectSwitcher', props); nodes(tree).find(n => n.type === 'Segmented').props.onChange('Workspaces'); tree = h.render('ProjectSwitcher', props);
  const only = drawer(tree, 'WorkspaceDrawer'); body = h.render(only.type, only.props); control(body, 'Edit workspace Main').props.onPress();
  assert.equal(control(h.render(only.type, only.props), 'Delete workspace'), undefined);
});

test('Compact sheet is bounded on phone and wide layouts; ordinary sheets retain their full drawer layout and dismissal rules', () => {
  for (const wide of [false, true]) {
    const h = screenHarness('src/ui/uiLayout.js', {}, { wide }); let closed = 0;
    let tree = h.render('Sheet', { compact: true, visible: true, title: 'Workspace menu', onClose: () => closed++ });
    const panel = nodes(tree).find(n => n.props.accessibilityViewIsModal);
    assert.equal(panel.props.style.maxHeight, '76%'); assert.equal(panel.props.style.flex, undefined); assert.equal(panel.props.style.width, wide ? 420 : '100%');
    control(tree, 'Dismiss Workspace menu').props.onPress(); tree.props.onRequestClose(); panel.props.onAccessibilityEscape(); assert.equal(closed, 3);
    panel.props.onTouchStart({ nativeEvent: { touches: [{ pageX: 10, pageY: 10 }] } }); panel.props.onTouchEnd({ nativeEvent: { changedTouches: [{ pageX: 10, pageY: 140 }] } }); assert.equal(closed, 4);
    nodes(tree).find(n => n.type === 'ScrollView').props.onScroll({ nativeEvent: { contentOffset: { y: 20 } } });
    panel.props.onTouchStart({ nativeEvent: { touches: [{ pageX: 10, pageY: 10 }] } }); panel.props.onTouchEnd({ nativeEvent: { changedTouches: [{ pageX: 10, pageY: 140 }] } }); assert.equal(closed, 4);
    tree = h.render('Sheet', { visible: true, onClose() {} }); const standard = nodes(tree).find(n => n.props.accessibilityViewIsModal).props.style;
    assert.equal(standard.width, wide ? 560 : '100%'); assert.equal(standard.flex, wide ? 1 : undefined);
  }
});

test('Bottom bar has no upper outline or selected surface, selected icons grow and navigation remains accessible', () => {
  const h = screenHarness('src/components/shell/Bars.js', {}); const calls = [];
  const props = { tabs: [['home', 'Home', 'home'], ['work', 'Work', 'columns']], current: 'home', go: id => calls.push(id), intent: { begin: target => ({ target }), accept: () => true }, onCreate() {} };
  const tree = h.render('TabBar', props); assert.equal(tree.props.style.borderTopWidth, undefined);
  const home = control(tree, 'Home'), work = control(tree, 'Work'); assert.equal(home.props.style({}).backgroundColor, undefined);
  assert.equal(nodes(home).find(n => n.type === 'NavIcon').props.selected, true); assert.equal(nodes(work).find(n => n.type === 'NavIcon').props.selected, false);
  work.props.onPressIn({ nativeEvent: { timestamp: 1 } }); work.props.onPress({ nativeEvent: { timestamp: 2 } }); assert.deepEqual(calls, ['work']);
  assert.ok(control(tree, 'Create'));
});


test('More workspace row opens the shared compact manager directly, starts with Workspaces and forwards project picks',()=>{
 const calls=[],h=screenHarness('src/components/shell/Menus.js',store());
 const entry=h.render('WorkspaceSwitcher',{onPickProject:(...args)=>calls.push(args)});assert.equal(entry.type.name,'ProjectSwitcher');assert.equal(entry.props.workspaceTrigger,true);
 const render=()=>h.render(entry.type,entry.props);let tree=render();assert.equal(nodes(tree).some(n=>n.type==='Modal'),false);assert.equal(nodes(tree).some(n=>n.type==='Sheet'),false);
 const row=drawer(tree,'WorkspaceRow');h.render(row.type,row.props).props.onPress();tree=render();
 assert.equal(nodes(tree).find(n=>n.type==='Sheet').props.compact,true);assert.equal(nodes(tree).find(n=>n.type==='Segmented').props.value,'Workspaces');assert.equal(drawer(tree,'WorkspaceDrawer').props.embedded,true);assert.equal(nodes(tree).some(n=>n.type==='Modal'),false);
 nodes(tree).find(n=>n.type==='Segmented').props.onChange('Projects');tree=render();let projects=drawer(tree,'ProjectDrawer');control(h.render(projects.type,projects.props),'Open project Studio').props.onPress();assert.deepEqual(calls,[['p1',false]]);assert.equal(nodes(render()).some(n=>n.type==='Sheet'),false);
 row.props.onPress();tree=render();nodes(tree).find(n=>n.type==='Segmented').props.onChange('Projects');tree=render();projects=drawer(tree,'ProjectDrawer');projects.props.onPick('new-project',true);assert.deepEqual(calls.at(-1),['new-project',true]);
 row.props.onPress();tree=render();nodes(tree).find(n=>n.type==='Sheet').props.onClose();assert.equal(nodes(render()).some(n=>n.type==='Sheet'),false);
});
