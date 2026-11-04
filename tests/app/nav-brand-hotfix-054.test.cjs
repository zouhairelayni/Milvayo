// /tests/app/nav-brand-hotfix-054.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', '..');
const source = fs.readFileSync(path.join(root, 'src/app/ModernApp.js'), 'utf8');
const navigation = source.split('const NAV = [')[1].split('const SCREENS =')[0];

test('drawer/sidebar navigation keys are unique and Task configuration belongs to Tasks', () => {
  const keys = [...navigation.matchAll(/\[\s*'([a-z]+)'\s*,\s*'[^']+'\s*,\s*'[^']+'\s*\]/g)].map(x => x[1]);
  assert.ok(keys.length >= 17, 'unexpectedly short navigation inventory');
  assert.equal(new Set(keys).size, keys.length, 'duplicate navigation key');
  assert.equal(keys.filter(id => id === 'taskconfig').length, 0);
  assert.match(fs.readFileSync(path.join(root,'src/screens/tasks/Tasks.js'),'utf8'), /TaskConfiguration/);
});

test('Board logo replaces company N and retains 20%-smaller accent-colored PROJECTS', () => {
  const menu = fs.readFileSync(path.join(root, 'src/components/shell/Menus.js'), 'utf8');
  assert.match(menu,/BoardMorph/);
  assert.match(menu,/projects-word-mask\.png/);
  assert.match(menu,/tintColor:c\.accent/);
  assert.match(menu,/tintColor:c.accent,alignSelf:'flex-end'/);
  assert.match(menu,/alignItems:'flex-end'/);
  for (const file of ['niyarvo-word-mask.png','projects-word-mask.png']) {
    const bytes = fs.readFileSync(path.join(root, 'assets', file));
    assert.ok(bytes.length > 100 && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),file);
  }
});
