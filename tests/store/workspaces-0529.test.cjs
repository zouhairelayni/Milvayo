// /tests/store/workspaces-0529.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const W = require('../../src/store/workspaces.cjs');
const model = require('../../src/domain/model.cjs');
const { createLatestWriter } = require('../../src/store/latestWriter.cjs');
const read = (f) => fs.readFileSync(path.join(__dirname, '..', '..', f), 'utf8');

const two = () => W.addItem(W.defaultIndex('t0'), 'Client work', 'ws-a', 't1');

test('first workspace keeps the original storage key, so existing data needs no migration', () => {
  const index = W.defaultIndex();
  assert.equal(index.items.length, 1);
  assert.equal(W.keyFor(index.activeId), 'niyarvo-projects-v1');
  assert.equal(W.keyFor('ws-a'), W.KEY_PREFIX + 'ws-a');
});

test('create, rename, switch and delete keep the list valid', () => {
  let index = two();
  assert.equal(index.activeId, 'ws-a');
  index = W.renameItem(index, 'ws-a', '  Client   work 2 ');
  assert.equal(index.items[1].name, 'Client work 2');
  index = W.setActive(index, 'main');
  assert.equal(index.activeId, 'main');
  index = W.removeItem(index, 'ws-a');
  assert.deepEqual(index.items.map((x) => x.id), ['main']);
});

test('names are trimmed, required, limited and unique ignoring case', () => {
  const index = two();
  assert.throws(() => W.addItem(index, '   ', 'ws-b'), /name required/);
  assert.throws(() => W.addItem(index, 'client WORK', 'ws-b'), /already exists/);
  assert.throws(() => W.renameItem(index, 'main', 'CLIENT work'), /already exists/);
  assert.equal(W.renameItem(index, 'ws-a', 'client work').items[1].name, 'client work'); // own name, other case
  assert.equal(W.cleanName('x'.repeat(200)).length, W.cleanName('y'.repeat(60)).length);
});

test('the last workspace cannot be deleted, and the workspace limit holds', () => {
  assert.throws(() => W.removeItem(W.defaultIndex(), 'main'), /last workspace/);
  let index = W.defaultIndex();
  for (let i = 1; i < W.MAX; i += 1) index = W.addItem(index, `W${i}`, `ws-${i}`);
  assert.throws(() => W.addItem(index, 'One more', 'ws-x'), /limit/);
});

test('deleting the open workspace moves to the first one left', () => {
  const index = W.removeItem(two(), 'ws-a');
  assert.equal(index.activeId, 'main');
  const three = W.addItem(two(), 'Third', 'ws-b');
  assert.equal(W.removeItem(W.setActive(three, 'ws-a'), 'ws-a').activeId, 'main');
});

test('unreadable or damaged saved lists fall back safely', () => {
  for (const raw of [null, '', '{bad json', '[]', '{"items":[]}', '{"items":[{"id":"../x"}]}']) {
    const index = W.parseIndex(raw);
    assert.equal(index.items.length, 1);
    assert.equal(index.activeId, 'main');
  }
  const damaged = W.parseIndex(JSON.stringify({ activeId: 'gone', items: [{ id: 'a', name: '' }, { id: 'a', name: 'dup' }, { id: 'b', name: 'Bee' }] }));
  assert.deepEqual(damaged.items.map((x) => [x.id, x.name]), [['a', 'Workspace'], ['b', 'Bee']]);
  assert.equal(damaged.activeId, 'a');
});

test('interrupted create: data without a list entry is recovered, not lost', () => {
  const index = W.defaultIndex();
  const fixed = W.reconcileIndex(index, ['niyarvo-projects-v1', W.KEY_PREFIX + 'ws-orphan', 'unrelated-key']);
  assert.deepEqual(fixed.items.map((x) => x.id), ['main', 'ws-orphan']);
  assert.match(fixed.items[1].name, /Recovered workspace/);
  assert.equal(W.reconcileIndex(fixed, ['niyarvo-projects-v1', W.KEY_PREFIX + 'ws-orphan']), fixed); // second run changes nothing
});

test('interrupted delete: a listed workspace whose data is gone is dropped; one odd read never empties the list', () => {
  const index = two();
  const fixed = W.reconcileIndex(index, ['niyarvo-projects-v1']);
  assert.deepEqual(fixed.items.map((x) => x.id), ['main']);
  assert.equal(fixed.activeId, 'main');
  assert.equal(W.reconcileIndex(W.defaultIndex(), []).items.length, 1); // fresh install: no data yet
  assert.equal(W.reconcileIndex(index, []).items.length, 2);
});

test('two workspaces hold the same project ids without touching each other', async () => {
  const store = new Map();
  const base = model.createWorkspace();
  store.set(W.keyFor('main'), JSON.stringify(base));
  store.set(W.keyFor('ws-a'), JSON.stringify(base)); // same ids on purpose: a backup imported as a second workspace
  const edited = model.normalizeWorkspace({ ...base, projects: base.projects.map((p) => ({ ...p, name: 'Renamed in A' })) });
  store.set(W.keyFor('ws-a'), JSON.stringify(edited));
  assert.equal(JSON.parse(store.get(W.keyFor('main'))).projects[0].name, base.projects[0].name);
  assert.equal(JSON.parse(store.get(W.keyFor('ws-a'))).projects[0].id, base.projects[0].id);
});

test('a writer made for one key can never write into another key, even if flushed late', async () => {
  const store = new Map();
  let release;
  const gate = new Promise((r) => { release = r; });
  const make = (key, slow) => createLatestWriter(async (v) => { if (slow) await gate; store.set(key, v); });
  const a = make('A', true), b = make('B', false);
  const pending = a.enqueue('edit in A');
  await b.enqueue('edit in B');
  release();
  assert.equal(await a.flush(), true);
  await pending;
  assert.deepEqual([...store.entries()], [['B', 'edit in B'], ['A', 'edit in A']]);
});

test('store wiring: per-key writer, serialized switches, epoch and import guards, workspace-scoped screens', () => {
  const store = read('src/store/store.js');
  assert.match(store, /makeWriter=key=>/);
  assert.doesNotMatch(store, /const KEY=/);
  assert.match(store, /writer\.current\.flush\(\)\)\)throw/); // old workspace saved before the switch
  assert.match(store, /if\(swapping\.current\)/);
  assert.match(store, /epoch!==epochRef\.current\)return false/);
  assert.match(store, /expectWorkspaceId&&expectWorkspaceId!==/);
  assert.match(store, /workspaces\.removeItem\(cur,id\); \/\/ refuses the last workspace/);
  assert.match(read('src/screens/workspace/Backup.js'), /importProject\(text, workspaceId\)/);
  const app = read('src/app/ModernApp.js');
  assert.match(app, /const projectId = `\$\{workspaceId\}\//);
  assert.doesNotMatch(app, /key=\{`\$\{workspace\.selectedId\}/);
  assert.match(read('src/components/shell/Menus.js'), /<WorkspaceDrawer/);
});
