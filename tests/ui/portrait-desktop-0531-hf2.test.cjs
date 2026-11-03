'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { isDesktopLayout } = require('../../src/ui/layoutMode.cjs');

test('phone browser portrait uses the desktop shell automatically', () => {
  assert.equal(isDesktopLayout(390, 'web', 'auto'), true);
  assert.equal(isDesktopLayout(320, 'web', 'auto'), true);
  assert.equal(isDesktopLayout(768, 'web', 'auto'), true);
});
test('Android native portrait still uses mobile navigation and gestures', () => {
  assert.equal(isDesktopLayout(390, 'android', 'auto'), false);
});
test('store uses a leaf UI import instead of importing back through the UI barrel', () => {
  const store = fs.readFileSync(path.join(__dirname, '../../src/store/store.js'), 'utf8');
  assert.match(store, /import\s*\{\s*T\s*\}\s*from\s*['"]\.\.\/ui\/uiBase['"]/);
  assert.doesNotMatch(store, /import\s*\{\s*T\s*\}\s*from\s*['"]\.\.\/ui\/ui['"]/);
});
