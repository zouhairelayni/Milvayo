// /tests/app/nav-brand-hotfix-054.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', '..');
const source = fs.readFileSync(path.join(root, 'src/app/ModernApp.js'), 'utf8');
const navigation = source.split('const NAV = [')[1].split('const SCREENS =')[0];

test('every drawer/sidebar navigation key is unique, including Task configuration', () => {
  const keys = [...navigation.matchAll(/\[\s*'([a-z]+)'\s*,\s*'[^']+'\s*,\s*'[^']+'\s*\]/g)].map(x => x[1]);
  assert.ok(keys.length >= 18, 'unexpectedly short navigation inventory');
  assert.equal(new Set(keys).size, keys.length, 'duplicate navigation key');
  assert.equal(keys.filter(id => id === 'taskconfig').length, 1);
  assert.ok(navigation.indexOf("group: 'Operate'") < navigation.indexOf("['taskconfig'"));
});

test('embedded PROJECTS branding is blue, set to the right of y and rasterized for app menu', () => {
  for (const variant of ['white', 'dark']) {
    const svg = fs.readFileSync(path.join(root, `assets/niyarvo-projects-${variant}.svg`), 'utf8');
    assert.match(svg, /<text x="765" y="303"[^>]*font-size="44"[^>]*font-weight="900"[^>]*fill="#2D9EE7"[^>]*>PROJECTS<\/text>/);
    assert.doesNotMatch(svg, /<text x="597" y="316"/);
    const png = fs.readFileSync(path.join(root, `assets/niyarvo-projects-${variant}.png`));
    assert.ok(png.length > 1000 && png.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])));
  }
});
