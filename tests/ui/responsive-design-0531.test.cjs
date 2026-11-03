// /tests/ui/responsive-design-0531.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '../..', file), 'utf8');
test('desktop sidebar can collapse and still exposes every destination', () => {
  const nav = read('src/components/shell/Menus.js');
  assert.match(nav, /setCollapsed\(v => !v\)/);
  assert.match(nav, /width: compact \? 72 : 264/);
  assert.match(nav, /accessibilityLabel=\{label\}/);
  assert.match(nav, /NavGroups nav=\{nav\} current=\{current\} go=\{go\} collapsed=\{compact\}/);
});
test('desktop top bar includes a real project switcher and task search', () => {
  const top = read('src/components/shell/Bars.js');
  const menus = read('src/components/shell/Menus.js');
  assert.match(top, /ProjectSwitcher onPickProject=\{onPickProject\}/);
  assert.match(top, /onChangeText=\{onQuery\}/);
  assert.match(menus, /onPickProject\(id, isNew\)/);
});
test('viewport adaptation does not fork cached pages or remount a new shell', () => {
  const app = read('src/app/ModernApp.js');
  assert.doesNotMatch(app, /if \(wide\) \{\s*return/);
  assert.match(app, /\{page\}/);
  assert.match(app, /!wide \? <TabBar/);
  assert.match(app, /<StoreFreeze frozen=\{!active\}>/);
});
test('all screens inherit a fluid page frame and shared tokenized controls', () => {
  const layout = read('src/ui/uiLayout.js');
  assert.doesNotMatch(layout, /maxWidth: 1180/);
  assert.match(layout, /alignSelf: 'stretch'/);
  assert.match(read('src/ui/uiControls.js'), /minHeight: 44/);
});
test('Kanban keeps gestures while revealing useful card metadata without emoji icons', () => {
  const board = read('src/screens/board/Board.js');
  assert.match(board, /useHoldDrag/);
  assert.match(board, /dragFor\(drag, i\)/);
  assert.match(board, /paperclip/);
  assert.match(board, /message-square/);
  assert.doesNotMatch(board, /📎|☑/);
});
test('Timeline renders task labels by default on desktop without removing virtualization', () => {
  const gantt = read('src/screens/timeline/Timeline.js');
  assert.match(gantt, /useState\(wide\)/);
  assert.match(gantt, /labelW = wide \? 264 : 160/);
  assert.match(gantt, /drawnBars\.map/);
  assert.match(gantt, /paintedRows\.map/);
});
