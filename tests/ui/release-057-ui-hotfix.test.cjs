// /tests/ui/release-057-ui-hotfix.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const source = file => fs.readFileSync(path.join(root, file), 'utf8');

test('PROJECTS is about 20 percent smaller and matches themed Board logo in all layouts', () => {
  const menu = source('src/components/shell/Menus.js');
  assert.match(menu, /projects-word-mask\.png/);
  assert.match(menu, /width:compact\?38:narrow\?75:102,height:compact\?7:narrow\?11:14,tintColor:c\.accent,alignSelf:'flex-end'/);
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

test('mobile menu replaces the header toggle with one top-left drawer toggle', () => {
  const app = source('src/app/ModernApp.js');
  const menu = source('src/components/shell/Menus.js');
  const mobileDrawer = menu.slice(menu.indexOf('export function SideMenu('));
  assert.match(app, /menu \? <View style=\{\{ width: 40, height: 40 \}\} \/> : <MenuToggle open=\{false\}/);
  assert.equal((mobileDrawer.match(/<MenuToggle /g) || []).length, 1);
  const toggle = mobileDrawer.indexOf('<MenuToggle open={visible} animateBeforeClose');
  const brand = mobileDrawer.indexOf('<Brand narrow animated active={visible} />');
  assert.ok(toggle >= 0 && brand > toggle, 'drawer toggle must be above logo at top-left');
  assert.match(mobileDrawer, /<Pressable accessibilityRole="button" accessibilityLabel="Dismiss menu" onPress=\{onClose\} style=\{\{ flex: 1 \}\} \/>/);
});

test('existing v0.5.57 version, user accent values and AMOLED darkness are intact', () => {
  const { ACCENTS, palette } = require('../../src/ui/theme/themePalette.cjs');
  assert.equal(require('../../package.json').version, '0.5.59');
  assert.equal(ACCENTS.length, 10);
  assert.equal(palette('Amber','light').accent, '#FFA500');
  assert.equal(palette('Orange','light').accent, '#E65A19');
  assert.equal(palette('Mint','amoled').bg, '#000000');
  const src = source('src/ui/theme/themePalette.cjs');
  assert.match(src, /scale\(a.darkCard, 0\.50\)/);
  assert.match(src, /scale\(a.darkBackground, 0\.35\)/);
});
