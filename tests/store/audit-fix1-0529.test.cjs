// /tests/store/audit-fix1-0529.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const model = require('../../src/domain/model.cjs');
const read = (f) => fs.readFileSync(path.join(__dirname, '..', '..', f), 'utf8');

test('1: the writer is null until the first load, so every flush is guarded', () => {
  const src = read('src/store/store.js');
  // Startup paths are guarded: the AppState/cleanup save and api.flush.
  assert.match(src, /const save=\(\)=>\{void writer\.current\?\.flush\(\);\}/);
  assert.equal((src.match(/writer\.current\?\.flush\(\)/g) || []).length, 2);
  // The only plain call left is in swapTo, which throws 'still loading' first when currentRef is null (writer and currentRef are set together).
  const plain = src.match(/[^\n]*writer\.current\.flush\(\)[^\n]*/g) || [];
  assert.equal(plain.length, 1);
  assert.ok(src.indexOf("if(!currentRef.current)throw Error('The workspace is still loading.") < src.indexOf(plain[0]));
  assert.match(src, /flush:\(\)=>writer\.current\?\.flush\(\)\?\?Promise\.resolve\(true\)/);
  // The expression used by api.flush resolves true when there is no writer.
  const writer = { current: null };
  return Promise.resolve(writer.current?.flush() ?? Promise.resolve(true)).then((v) => assert.equal(v, true));
});

test('2: Flag overdue has a button on the Automations page, beside Due checks and Card aging', () => {
  const src = read('src/screens/workspace/Workspace.js');
  assert.match(src, /label="Due checks"[^\n]*label="Card aging"[^\n]*label="Flag overdue" small variant="secondary" icon="flag" onPress=\{sweepDue\}/);
});

test('3: due, aging and overdue sweeps tell the user when nothing applies', () => {
  const src = read('src/store/store.js');
  assert.match(src, /runDueCommands:[^\n]*if\(!r\.applied\.length\)\{notify\('No tasks matched\.','info'\);return p\}return r\.project/);
  assert.match(src, /runAgingCommands:[^\n]*if\(!r\.applied\.length\)\{notify\('No tasks matched\.','info'\);return p\}return r\.project/);
  assert.match(src, /sweepDue:[^\n]*if\(!p\.tasks\.some\(late\)\)\{notify\('No overdue tasks\.','info'\);return p\}/);
  // Match / no-match behaviour of the pure engine the two command buttons call.
  const base = model.makeProject({ name: 'T', tasks: [{ id: 'ONE', title: 'A', status: 'Backlog', priority: 'Low', due: '2026-11-02' }] });
  assert.equal(model.automation.run(base, { type: 'due' }, { today: '2026-10-31' }).applied.length, 0);
  const withRule = model.automation.saveCommand(base, { id: 'c1', name: 'Soon', trigger: 'due', status: 'Any', enabled: true, boardId: '', priorityFilter: 'Any', daysBefore: 2, actions: [{ type: 'addLabel', value: 'soon' }] });
  assert.ok(model.automation.run(withRule, { type: 'due' }, { today: '2026-10-31' }).applied.length > 0);
});

test('5: removed dead imports stay removed and the native gesture file has no web code', () => {
  const gone = [
    ['src/components/inline/CompactTools.js', /SectionTitle/], ['src/screens/board/Board.js', /isOverdue/],
    ['src/screens/delivery/Delivery.js', /\bAvatar\b|\bSTAGES\b/], ['src/screens/governance/Portfolios.js', /PRIORITY_COLOR|STATUS_COLOR/],
    ['src/screens/governance/Programs.js', /\bGrid\b|\bCell\b|\bStat\b|\bInput\b/], ['src/screens/governance/Projects.js', /setDocStatus/],
    ['src/screens/management/Management.js', /Pressable|SectionTitle|useTheme/], ['src/screens/tasks/TaskSheet.js', /\baddTask\b/],
    ['src/screens/workspace/Workspace.js', /\bChip\b|useWide|\bfmt\b|toCSV/], ['src/store/store.js', /\bButton\b/],
    ['src/domain/automation.cjs', /DEFAULT_BOARD_ID/], ['src/timeline/timelineDisplay.cjs', /\bfinite\b/],
    ['src/board/boardGesture.native.js', /attachDoc|detachDoc|IS_WEB|document\.|Platform/],
  ];
  for (const [file, pattern] of gone) assert.doesNotMatch(read(file), pattern, file);
  assert.match(read('src/screens/timeline/Timeline.js'), /const SPAN = display\.BASE_DAYS/); // kept: native-animation-contract asserts it
});
