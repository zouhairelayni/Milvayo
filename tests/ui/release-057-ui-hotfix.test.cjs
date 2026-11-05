// /tests/ui/release-057-ui-hotfix.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const source = file => fs.readFileSync(path.join(root, file), 'utf8');

test('the Milvayo wordmark is one tinted mask beside the themed Board logo in all layouts', () => {
  const menu = source('src/components/shell/Menus.js');
  assert.match(menu, /milvayo-mask\.png/);
  assert.match(menu, /const width = compact \? 60 : narrow \? 119 : 158;/);
  assert.match(menu, /height:Math\.round\(width\*45\/316\),tintColor:c\.ink/);
  assert.match(menu, /<BoardMorph size=/);
  assert.doesNotMatch(menu, /tintColor:c\.accentText/);
});

test('accent-filled action text and icons are consistently white', () => {
  const ui = source('src/ui/uiControls.js');
  assert.match(ui, /const fg = primary \? '#FFFFFF'/);
  assert.match(ui, /<Feather name=\{icon\} size=\{13\} color=\{fg\}/);
  assert.match(ui, /color=\{solid \? '#FFFFFF' : c\.ink\}/);
  assert.match(source('src/screens/tasks/Tasks.js'), /<Feather name="check" size=\{13\} color="#FFFFFF"/);
  assert.match(source('src/components/notice/IslandNotice.js'), /const ink = '#FFFFFF'/);
  assert.match(source('src/components/inline/TaskLabels.js'), /color=\{onPress \? '#FFFFFF' : textColor\(color\)\}/);
  assert.match(source('src/screens/delivery/Delivery.js'), /<Button label="Finish sprint" icon="flag"/);
});

test('the header hamburger opens the workspace popup while More retains the screen navigation', () => {
  const app = source('src/app/ModernApp.js');
  const bars = source('src/components/shell/Bars.js');
  assert.doesNotMatch(app, /MenuToggle|SideMenu/);
  assert.equal(fs.existsSync(path.join(root, 'src/components/shell/MenuToggle.js')), false);
  assert.match(bars, /<ProjectSwitcher onPickProject=\{onPickProject\} compact showProjectName=\{showProjectName\} \/>/);
  const menu = source('src/components/shell/Menus.js').split('export function ProjectSwitcher')[1].split('export function WorkspaceSwitcher')[0];
  assert.match(menu, /accessibilityLabel="Open workspace menu"/);
  assert.match(menu, /<Sheet visible=\{visible\} compact/);
  assert.doesNotMatch(menu, /<Modal|<NavGroups/);
  assert.match(app, /go\('more', 'back to More'\)/);
});

test('existing v0.5.57 version, user accent values and AMOLED darkness are intact', () => {
  const { ACCENTS, palette } = require('../../src/ui/theme/themePalette.cjs');
  assert.match(require('../../package.json').version,/^\d+\.\d+\.\d+$/);
  assert.equal(ACCENTS.length, 10);
  assert.equal(palette('Amber','light').accent, '#FFA500');
  assert.equal(palette('Orange','light').accent, '#E65A19');
  assert.equal(palette('Mint','amoled').bg, '#000000');
  const src = source('src/ui/theme/themePalette.cjs');
  assert.match(src, /scale\(a.darkCard, 0\.50\)/);
  assert.match(src, /scale\(a.darkBackground, 0\.35\)/);
});
