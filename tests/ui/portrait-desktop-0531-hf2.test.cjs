// /tests/ui/portrait-desktop-0531-hf2.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { isDesktopLayout } = require('../../src/ui/layoutMode.cjs');

test('mobile browser uses phone UI; Desktop site and manual desktop remain available', () => {
  assert.equal(isDesktopLayout(390, 'web', 'auto', true), false);
  assert.equal(isDesktopLayout(390, 'web', 'auto', false), true);
  assert.equal(isDesktopLayout(320, 'web', 'desktop', true), true);
  assert.equal(isDesktopLayout(768, 'web', 'auto', false), true);
});
test('Android native portrait still uses mobile navigation and gestures', () => {
  assert.equal(isDesktopLayout(390, 'android', 'auto'), false);
});
test('store uses a leaf UI import instead of importing back through the UI barrel', () => {
  const store = fs.readFileSync(path.join(__dirname, '../../src/store/store.js'), 'utf8');
  assert.match(store, /import\s*\{\s*T\s*\}\s*from\s*['"]\.\.\/ui\/uiBase['"]/);
  assert.doesNotMatch(store, /import\s*\{\s*T\s*\}\s*from\s*['"]\.\.\/ui\/ui['"]/);
});
