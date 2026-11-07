// /tests/domain/project-tools-060.test.cjs
// Per-project tool switches: migration default, lean new projects, data never touched, navigation follows the switches.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const model = require('../../src/domain/model.cjs');
const pt = require('../../src/domain/projectTools.cjs');
const nav = require('../../src/app/navigation/sections.cjs');
const root = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const ids = items => items.map(([k]) => k);

test('migration: a project saved before the switches existed has every tool on', () => {
  const old = model.makeProject({ id: 'p1', name: 'Saved before', tasks: [{ id: 'T-1', title: 'A' }] });
  assert.deepEqual(old.tools, pt.allOn());
  assert.equal(Object.keys(old.tools).length, 11);
  assert.ok(Object.values(old.tools).every(v => v === true));
  const ws = model.normalizeWorkspace({ ...model.createWorkspace(), projects: [{ ...old, tools: undefined }] });
  assert.ok(Object.values(ws.projects[0].tools).every(v => v === true));
});

test('damaged or unknown switch values never stop a workspace loading and never switch anything off by accident', () => {
  for (const bad of [null, 'x', 7, [], ['costs'], { costs: 'no' }, { costs: 0 }, { nonsense: false }]) {
    const p = model.makeProject({ id: 'p', name: 'P', tools: bad });
    assert.deepEqual(p.tools, pt.allOn(), JSON.stringify(bad));
  }
  assert.equal(pt.normalizeTools({ costs: false }).costs, false);
});

test('a brand-new project starts lean; the sample and existing projects do not', () => {
  assert.deepEqual(Object.entries(pt.LEAN).filter(([, v]) => v).map(([k]) => k), ['sprints', 'releases', 'testing', 'activity']);
  assert.match(read('src/store/store.js'), /tools:projectTools\.initialTools\(details.tools\)/);
  assert.ok(Object.values(model.demoProject().tools).every(Boolean));
});

test('switching a tool changes the switch only: the tool data is untouched and the switch survives save, load and edit', () => {
  const p = model.makeProject({ id: 'p', name: 'P', sprints: [], releases: [{ id: 'r1', name: 'R', status: 'Planned' }],
    tasks: [{ id: 'T-1', title: 'A' }, { id: 'T-2', title: 'B' }] });
  const off = model.makeProject({ ...p, tools: pt.setTool(p.tools, 'releases', false) });
  assert.equal(off.tools.releases, false);
  assert.equal(off.tools.sprints, true);
  assert.deepEqual(off.releases, p.releases);
  assert.deepEqual(off.tasks, p.tasks);
  const reloaded = model.normalizeWorkspace(JSON.parse(JSON.stringify({ ...model.createWorkspace(), projects: [off], selectedId: 'p' })));
  assert.equal(reloaded.projects[0].tools.releases, false);
  const edited = model.makeProject({ ...reloaded.projects[0], name: 'Renamed' }); // what updateProject does
  assert.equal(edited.tools.releases, false);
  assert.equal(pt.setTool(off.tools, 'releases', true).releases, true);
  assert.throws(() => pt.setTool(off.tools, 'board', false), /Unknown tool/);
  assert.throws(() => pt.setTool(off.tools, 'settings', false), /Unknown tool/);
});

test('core screens can never be switched off, and screen tools have matching routes', () => {
  for (const core of ['overview', 'board', 'timeline', 'tasks', 'scheduling', 'projects', 'portfolios', 'programs', 'settings', 'more']) {
    assert.equal(pt.isTool(core), false, core);
    assert.equal(pt.screenOn(pt.LEAN, core), true, core);
  }
  const screens = nav.NAV.flatMap(g => g.items.map(([k]) => k));
  for (const id of pt.SCREEN_IDS) assert.ok(screens.includes(id), `${id} is not a screen`);
  assert.equal(pt.isTool('advancedTasks'), true);
  assert.equal(pt.SCREEN_IDS.includes('advancedTasks'), false);
});

test('navigation follows the switches: pill, More and the wide sidebar', () => {
  const work = nav.SECTIONS.find(s => s.id === 'work');
  assert.deepEqual(ids(nav.viewsOf(work, pt.allOn())), ['board', 'timeline', 'tasks', 'sprints']);
  assert.deepEqual(ids(nav.viewsOf(work, { ...pt.allOn(), sprints: false })), ['board', 'timeline', 'tasks']);
  assert.deepEqual(ids(nav.moreGroups(pt.LEAN).find(g => g.group === 'Project tools').items), ['scheduling', 'canvas', 'releases', 'testing', 'activity']);
  const none = Object.fromEntries(pt.IDS.map(id => [id, false]));
  const groups = nav.moreGroups(none);
  assert.deepEqual(groups.map(g => g.group), ['Project tools', 'App']); // the group stays, so Manage tools is always reachable
  assert.deepEqual(ids(groups[0].items), ['scheduling','canvas']);
  const side = nav.navFor({ ...pt.allOn(), costs: false }).flatMap(g => ids(g.items));
  assert.ok(!side.includes('costs') && side.includes('resources'));
});

test('with every tool on, all 19 entries are reachable; switching any tool off and on again restores it', () => {
  const reach = tools => new Set([
    ...nav.SECTIONS.flatMap(s => ids(nav.viewsOf(s, tools))),
    ...nav.moreGroups(tools).flatMap(g => ids(g.items)),
  ]);
  assert.equal(reach(pt.allOn()).size, 20);
  for (const id of pt.IDS) {
    const off = pt.setTool(pt.allOn(), id, false);
    assert.equal(reach(off).size, pt.SCREEN_IDS.includes(id) ? 19 : 20, id);
    assert.equal(reach(pt.setTool(off, id, true)).size, 20, id);
  }
});

test('wiring: store action, More tool switches, Overview shortcuts, redirect and Create sheet follow the switches', () => {
  assert.match(read('src/store/store.js'), /setProjectTool:\(toolId,on\)=>trans\(/);
  assert.match(read('src/screens/more/More.js'), /<ProjectToolsSheet visible=\{managing\}/);
  assert.doesNotMatch(read('src/screens/workspace/Workspace.js'), /label="Choose tools"/);
  const sheet = read('src/screens/more/ProjectToolsSheet.js');
  assert.match(sheet, /<Switch value=\{tools\[tool\.id\]\} onValueChange=\{on => setProjectTool\(tool\.id, on\)\}/);
  const overview = read('src/screens/overview/Overview.js');
  for (const t of ['tools.releases', 'tools.testing']) assert.ok(overview.includes(t), t);
  const app = read('src/app/ModernApp.js');
  assert.match(app, /if \(!screenOn\(tools, screen\)\) go\(sectionOf\(screen\) === 'work' \? 'board' : 'more'/);
  assert.match(app, /onRelease=\{tools\.releases \?/);
  const schema = JSON.parse(read('schemas/niyarvo.project.v1.schema.json'));
  assert.equal(schema.properties.tools.type, 'object');
});
