// /tests/ui/desktop-mode-0531-hf1.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.resolve(__dirname, '../..', name), 'utf8');
const { isDesktopLayout, WEB_DESKTOP_MIN, NATIVE_DESKTOP_MIN } = require('../../src/ui/layoutMode.cjs');

test('browser switches to actual desktop navigation at tablet/landscape widths', () => {
  assert.equal(WEB_DESKTOP_MIN, 700);
  assert.equal(NATIVE_DESKTOP_MIN, 900);
  for (const width of [700, 760, 800, 879, 880, 1024, 1440]) assert.equal(isDesktopLayout(width, 'web'), true, `web ${width}`);
  for (const width of [360, 390, 430, 699]) assert.equal(isDesktopLayout(width, 'web'), false, `web ${width}`);
  assert.equal(isDesktopLayout(820, 'android'), false);
  assert.equal(isDesktopLayout(900, 'android'), true);
  assert.equal(isDesktopLayout(1024, 'ios'), true);
  assert.equal(isDesktopLayout(NaN, 'web'), false);
});
test('desktop-site override is reversible and web-only', () => {
  assert.equal(isDesktopLayout(390, 'web', 'desktop'), true);
  assert.equal(isDesktopLayout(390, 'web', 'auto'), false);
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
  assert.match(app, /!wide \? <TabBar/);
  assert.match(menu, /accessibilityLabel="Use desktop layout"/);
  assert.match(menu, /accessibilityLabel="Return to automatic layout"/);
  assert.match(app, /onDesktopLayout=\{\(\) => \{ setMenu\(false\); setPreference\('desktop'\); \}\}/);
  assert.match(bars, /const compact = width < 1120/);
  assert.match(bars, /<ProjectSwitcher onPickProject=\{onPickProject\} compact=\{compact\}/);
});
