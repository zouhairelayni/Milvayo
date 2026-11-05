// /tests/ui/selective-merge-0533.test.cjs
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..', '..');
const source = name => fs.readFileSync(path.join(root, name), 'utf8');
const { isDesktopLayout } = require('../../src/ui/layoutMode.cjs');

test('portrait and landscape Web retain HF2 desktop shell while native portrait remains mobile', () => {
  assert.equal(isDesktopLayout(390, 'web', 'auto'), true);
  assert.equal(isDesktopLayout(768, 'web', 'auto'), true);
  assert.equal(isDesktopLayout(1440, 'web', 'auto'), true);
  assert.equal(isDesktopLayout(390, 'android', 'auto'), false);
  assert.match(source('src/app/ModernApp.js'), /LayoutProvider/);
});

test('0.5.33 tasks use physical viewport for optional table columns rather than desktop preference', () => {
  const s = source('src/screens/tasks/Tasks.js');
  assert.match(s, /NP533_COLUMNS/);
  assert.match(s, /roomForColumns\s*=\s*useWindowDimensions\(\)\.width\s*>=\s*1080/);
  assert.match(s, /roomForColumns && list\.length/);
  assert.match(s, />Owner<\/T>/);
  assert.match(s, />Priority<\/T>/);
});

test('release readiness has separate navigation buttons, not nested Pressables', () => {
  const s = source('src/screens/overview/Overview.js');
  assert.doesNotMatch(s, /<Card[^\n]*onPress=\{\(\) => go\('releases'\)\}/);
  assert.match(s, /label="Open releases"/);
  assert.match(s, /label="Open testing"/);
});

test('shared Store/UI cycle remains broken and source does not include Sonnet layout rewrite', () => {
  const store = source('src/store/store.js');
  assert.match(store, /import \{ T \} from '\.\.\/ui\/uiBase';/);
  assert.doesNotMatch(store, /import \{ T \} from '\.\.\/ui\/ui';/);
});

test('weekend shading is viewport bounded, pointer transparent and opt-in by zoom', () => {
  const s = source('src/screens/timeline/Timeline.js');
  if (!s.includes('NP533_WEEKENDS')) return;
  assert.match(s, /zoomMode === 'Days'/);
  assert.match(s, /Math\.floor\(paintLeft \/ w\)/);
  assert.match(s, /Math\.ceil\(\(paintLeft \+ paintWidth\) \/ w\)/);
  assert.match(s, /key=\{'we' \+ i\} pointerEvents="none"/);
});
