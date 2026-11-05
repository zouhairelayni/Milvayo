// /tests/ui/release-0534-functional.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const source = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const theme = require('../../src/ui/theme/theme.cjs');

test('all 10 RIVNA accents generate readable primary buttons and 4 appearance surfaces', () => {
  assert.equal(theme.ACCENTS.length, 10);
  for (const color of theme.ACCENTS) {
    for (const appearance of ['light', 'dark', 'amoled']) {
      const c = theme.palette(color.id, appearance);
      assert.ok(theme.contrast(c.accent, c.accentInk) >= 4.5, `${color.id} ${appearance} button contrast`);
      assert.equal(c.mode, appearance);
      if (appearance === 'amoled') assert.equal(c.bg, '#000000');
      if (appearance === 'light') assert.equal(c.surface, '#FFFFFF');
    }
    assert.match(color.start, /^#[0-9A-F]{6}$/);
    assert.match(color.end, /^#[0-9A-F]{6}$/);
  }
  const themeJS = source('src/ui/theme/theme.js');
  assert.match(themeJS, /\['system','light','dark','amoled'\]/);
  assert.match(themeJS, /c:palette\(accentPref, mode\)/);
});

test('Board has a single tools entry and all old filters live inside its sheet', () => {
  const board = source('src/screens/board/Board.js');
  assert.match(board, /useHeaderActions\('board', headerControls, active\)/);
  assert.match(board, /label: 'Tools'/);
  assert.match(board, /<Sheet visible=\{boardToolsOpen\}/);
  for (const label of ['Search board cards', 'High and above', 'Clear filters', 'Descriptions on cards', 'Card age']) {
    assert.ok(board.includes(label), label);
  }
  assert.match(source('src/screens/tasks/Tasks.js'), /togglePowerUp\(b.id, 'calendar'\)/);
  assert.match(source('src/screens/tasks/DueSoon.js'), />Due soon</);
  assert.doesNotMatch(board, /<Fold title="Filters"/);
  assert.doesNotMatch(board, /<Fold title="Board tools"/);
  assert.match(board, /dropBefore\(s\.tasks, cards, listId, slotIndex, movingId\)/);
});

test('Timeline has a single task ribbon and preserved dependency colors/drag geometry', () => {
  const timeline = source('src/screens/timeline/Timeline.js');
  assert.match(timeline, /<ScrollView horizontal showsHorizontalScrollIndicator=\{false\}/);
  for (const label of ['Hide items', 'Show items', 'First task', 'Today', 'Critical path', 'Parent tasks', 'To schedule']) {
    assert.ok(timeline.includes(label), label);
  }
  assert.match(timeline, /taskPanel === 'parents' \? <Sheet visible/);
  assert.match(timeline, /taskPanel === 'schedule' \? <Sheet visible/);
  assert.match(timeline, /np533DependencyColor\(l\)/);
  assert.match(timeline, /viewport\.svgViewBox/);
  assert.match(timeline, /useHoldDrag/);
  assert.match(timeline, /const rows = allScheduled/);
});

test('all navigation items use fills rather than decorative accent stripes', () => {
  const menus = source('src/components/shell/Menus.js');
  assert.doesNotMatch(menus, /borderLeftColor:\s*c\.accent|borderRightColor:\s*c\.accent/);
  assert.match(menus, /backgroundColor: on \? c\.surfaceAlt/);
});
