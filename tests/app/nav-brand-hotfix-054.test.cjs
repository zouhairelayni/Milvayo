// /tests/app/nav-brand-hotfix-054.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', '..');
const source = fs.readFileSync(path.join(root, 'src/app/navigation/sections.cjs'), 'utf8');
const navigation = source.split('const NAV = [')[1].split('const SECTIONS =')[0];

test('drawer/sidebar navigation keys are unique and Task configuration belongs to Tasks', () => {
  const keys = [...navigation.matchAll(/\[\s*'([a-z]+)'\s*,\s*'[^']+'\s*,\s*'[^']+'\s*\]/g)].map(x => x[1]);
  assert.ok(keys.length >= 17, 'unexpectedly short navigation inventory');
  assert.equal(new Set(keys).size, keys.length, 'duplicate navigation key');
  assert.equal(keys.filter(id => id === 'taskconfig').length, 0);
  assert.match(fs.readFileSync(path.join(root,'src/screens/tasks/Tasks.js'),'utf8'), /TaskConfiguration/);
});
