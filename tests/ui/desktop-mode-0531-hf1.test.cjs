// /tests/ui/desktop-mode-0531-hf1.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.resolve(__dirname, '../..', name), 'utf8');
const { isDesktopLayout, WEB_DESKTOP_MIN, NATIVE_DESKTOP_MIN } = require('../../src/ui/layoutMode.cjs');

test('browser uses mobile navigation for a phone, Desktop site or forced mode for desktop', () => {
  // The fourth argument simulates an Android browser mobile / Desktop site signal.
  for (const width of [320, 360, 390, 430, 700]) {
    assert.equal(isDesktopLayout(width, 'web', 'auto', true), false, 'mobile UA '+width);
    assert.equal(isDesktopLayout(width, 'web', 'auto', false), true, 'desktop UA '+width);
    assert.equal(isDesktopLayout(width, 'web', 'desktop', true), true, 'explicit desktop '+width);
  }
  assert.equal(isDesktopLayout(319, 'web', 'auto', false), false);
  assert.equal(isDesktopLayout(390, 'android', 'desktop', false), false);
});
test('desktop-site override is reversible and web-only', () => {
  assert.equal(isDesktopLayout(390, 'web', 'desktop'), true);
  assert.equal(isDesktopLayout(390, 'web', 'auto'), true);
  assert.equal(isDesktopLayout(1440, 'web', 'mobile'), false);
  assert.equal(isDesktopLayout(390, 'android', 'desktop'), false);
  const ui = read('src/ui/uiBase.js');
  assert.match(ui, /isDesktopLayout\(width, Platform\.OS, preference\)/);
  assert.match(ui, /localStorage\.setItem\(STORAGE_KEY, value\)/);
  assert.match(ui, /localStorage\.removeItem\(STORAGE_KEY\)/);
});
test('wide shell shows sidebar and toolbar, phone shell retains bottom tabs; override is reachable', () => {
  const app = read('src/app/ModernApp.js');
  const menu = read('src/components/shell/Menus.js');
  const bars = read('src/components/shell/Bars.js');
  assert.match(app, /<LayoutProvider>/);
  assert.match(app, /\{wide \? <Sidebar/);
  assert.match(app, /\{wide \? <TopBar/);
  assert.match(app, /!wide && !controls\?\.canvas \? <TabBar/);
  assert.match(app, /onDesktopLayout|onAutoLayout/);
  assert.match(menu, /accessibilityLabel="Return to automatic layout"/);
  const more = read('src/screens/more/More.js'); // the phone's way to the desktop layout
  assert.match(more, /label="Desktop layout"/);
  assert.match(more, /setPreference\('desktop'\)/);
  assert.match(bars, /const compact = width < 1120/);
  assert.match(bars, /<ProjectSwitcher onPickProject=\{onPickProject\} compact=\{compact\}/);
});
