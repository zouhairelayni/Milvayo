// /tests/app/wiring-0526.test.cjs
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '../..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const model = require('../../src/domain/model.cjs');
const kanban = require('../../src/board/kanbanUX.cjs');
const workflows = require('../../src/domain/taskWorkflows.cjs');
const planning = require('../../src/domain/planning.cjs');
const gantt = require('../../src/timeline/gantt.cjs');

const T = (id, o = {}) => ({ id, title: id, status: 'Backlog', priority: 'Medium', owner: 'Ana', labels: [], dependsOn: [], position: 0, ...o });

test('Board: dropping a card with a filter on keeps hidden cards where they were', () => {
  const all = [T('a', { list: 'L', position: 0, priority: 'High' }), T('b', { list: 'L', position: 1, priority: 'Low' }), T('c', { list: 'L', position: 2, priority: 'High' }), T('d', { list: 'L', position: 3, priority: 'Low' })];
  const visible = all.filter((t) => t.priority === 'High');
  assert.equal(kanban.dropBefore(all, visible, 'L', 0, 'x'), 'a');
  assert.equal(kanban.dropBefore(all, visible, 'L', 1, 'x'), 'c');
  assert.equal(kanban.dropBefore(all, visible, 'L', 2, 'x'), 'd', 'after the last visible card, in front of the hidden one that followed it');
  assert.equal(kanban.dropBefore(all, all, 'L', 4, 'x'), null, 'no filter: end of the list');
  assert.equal(kanban.dropBefore(all, [], 'L', 0, 'x'), null);
});
test('Board: due-date, priority, owner and tag filters come from kanbanUX.filterCards', () => {
  const src = read('src/screens/board/Board.js');
  assert.match(src, /filterCards\(s\.tasks\.filter\(\(t\) => t\.board === board\.id\), \{ text: q, owner: ownerF, label: labelF, priority: prioF, due: dueF \}\)/);
  assert.match(src, /DUE_FILTERS/);
  assert.match(src, /initialCount\(allCards\.length, FIRST_CARDS\)/);
  const today = '2026-11-10';
  const tasks = [T('over', { due: '2026-11-01' }), T('tod', { due: today }), T('tom', { due: '2026-11-11' }), T('wk', { due: '2026-11-15' }), T('none', { due: '' }), T('done', { due: '2026-11-01', status: 'Done' })];
  const ids = (due) => kanban.filterCards(tasks, { due }, today).map((t) => t.id);
  assert.deepEqual(ids('overdue'), ['over']);
  assert.deepEqual(ids('today'), ['tod']);
  assert.deepEqual(ids('week'), ['tod', 'tom', 'wk']);
  assert.deepEqual(ids('none'), ['none']);
});
test('Tasks: search, paging, sorting, tree, groups and rollups use the shared engines', () => {
  const src = read('src/screens/tasks/Tasks.js');
  for (const re of [/workflows\.query\(/, /workflows\.page\(rows, PAGE_SIZE, pages\)/, /planning\.filterSort\(/, /planning\.progressRollups\(/, /planning\.projectProgress\(/, /workflows\.hierarchyOrder\(/, /gantt\.buildRows\(/, /bulkSet\(picked, field, value\)/]) assert.match(src, re);
  const tasks = [T('p', { due: '2026-12-01' }), T('c1', { parentId: 'p', status: 'Done', due: '2026-12-02' }), T('c2', { parentId: 'p', due: '2026-12-03', progress: 50 }), T('z', { due: '2026-11-01', owner: 'Bo' })];
  const rollups = planning.progressRollups(tasks);
  assert.equal(rollups.get('p').progress, 75);
  assert.equal(planning.projectProgress(tasks).progress, 50, 'weighted by leaf count: (75 x 2 + 0 x 1) / 3');
  const found = workflows.query(tasks, { owner: 'Ana', text: 'c' });
  assert.deepEqual(found.map((t) => t.id), ['c1', 'c2']);
  const sorted = planning.filterSort(tasks, { id: 'x', name: 'x', filters: {}, sort: 'due', descending: false }, rollups);
  assert.equal(sorted[0].id, 'z');
  assert.deepEqual(workflows.hierarchyOrder(tasks).map((r) => [r.task.id, r.depth]), [['p', 0], ['c1', 1], ['c2', 1], ['z', 0]]);
  assert.equal(workflows.page(tasks, 2, 1).hasMore, true);
  assert.deepEqual(gantt.buildRows(tasks, 'status').filter((r) => r.kind === 'group').map((r) => r.title), ['Backlog', 'Done']);
});
test('bulk edit of priority, stage and owner goes through bulkUpdate and clears release metadata', () => {
  assert.match(read('src/store/store.js'), /bulkSet:\(ids,field,value\)=>safeMutation\(p=>model\.taskWorkflows\.bulkUpdate\(p,ids,field,value\)\.project/);
  const p = model.makeProject({ tasks: [T('a', { verified: true }), T('b')] });
  const next = workflows.bulkUpdate(p, ['a', 'b'], 'priority', 'Critical').project;
  assert.deepEqual(next.tasks.map((t) => t.priority), ['Critical', 'Critical']);
  assert.equal(next.tasks[0].verified, false);
  assert.throws(() => workflows.bulkUpdate(p, ['a'], 'priority', 'Urgent'), /Unsupported bulk operation/);
});
test('task sheet: tags go through updateLabels and the parent picker leaves out subtasks', () => {
  const src = read('src/screens/tasks/TaskSheet.js');
  assert.match(src, /setLabels\(t\.id, \[\.\.\.t\.labels, value\]\)/);
  assert.match(src, /descendants\(s\.tasks, t\.id\)/);
  assert.match(read('src/store/store.js'), /setLabels:\(id,labels\)=>safeMutation\(p=>model\.kanbanUX\.updateLabels\(p,id,labels\)/);
  const p = model.makeProject({ tasks: [T('a', { labels: ['x'], verified: true })] });
  const next = kanban.updateLabels(p, 'a', ['  x ', 'x', 'y']);
  assert.deepEqual(next.tasks[0].labels, ['x', 'y']);
  assert.equal(next.tasks[0].verified, false);
  assert.deepEqual([...workflows.descendants([T('p'), T('c', { parentId: 'p' }), T('g', { parentId: 'c' }), T('o')], 'p')].sort(), ['c', 'g']);
});
test('Resources shows open tasks and logged hours from operations.capacitySummary', () => {
  assert.match(read('src/screens/workspace/Workspace.js'), /operations\.capacitySummary\(p\)/);
  const p = model.makeProject({ resources: [{ id: 'r', name: 'Ana', weeklyHours: 10, hourlyRate: 0 }], tasks: [T('a', { estimateHours: 12 }), T('b', { status: 'Done', estimateHours: 5 })], timeEntries: [{ id: 'e', taskId: 'a', owner: 'Ana', date: '2026-11-01', hours: 3, note: '' }] });
  const [row] = model.operations.capacitySummary(p);
  assert.deepEqual([row.assignedTasks, row.remainingEstimate, row.logged, row.overCapacity], [1, 12, 3, true]);
});
test('Timeline: critical path, schedule problems, parent summaries, sample dates and a first-task jump', () => {
  const src = read('src/screens/timeline/Timeline.js');
  for (const re of [/gantt\.criticalPath\(rows\)/, /gantt\.dependencyConflicts\(rows\)/, /gantt\.invalidSchedules\(s\.tasks\)/, /gantt\.hierarchySummaries\(s\.tasks, rollups\)/, /gantt\.hierarchyRows\(s\.tasks, collapsed\)/, /gantt\.calendarDomain\(rows, TODAY\)/, /scheduleAfter\(x\.taskId\)/, /onPress=\{scheduleSample\}/, /critical=\{showCritical && critIds\.has\(t\.id\)\}/]) assert.match(src, re);
  const st = read('src/store/store.js');
  assert.match(st, /scheduleAfter:id=>safeMutation\(p=>model\.gantt\.afterPredecessors\(p,id\)/);
  assert.match(st, /scheduleSample:\(\)=>safeMutation\(p=>model\.gantt\.scheduleSample\(p,localDay\(\)\)/);
  const d = (id, start, due, dependsOn = []) => T(id, { start, due, dependsOn });
  const tasks = [d('a', '2026-11-01', '2026-11-03'), d('b', '2026-11-04', '2026-11-08', ['a']), d('c', '2026-11-09', '2026-11-10', ['b']), d('side', '2026-11-04', '2026-11-04', ['a'])];
  const path = gantt.criticalPath(tasks);
  assert.deepEqual(path.criticalIds.sort(), ['a', 'b', 'c']);
  assert.ok(path.criticalEdges.includes('a->b') && !path.criticalEdges.includes('a->side'));
  assert.deepEqual(gantt.dependencyConflicts([d('a', '2026-11-01', '2026-11-05'), d('b', '2026-11-03', '2026-11-06', ['a'])]), [{ taskId: 'b', predecessorId: 'a' }]);
  assert.deepEqual(gantt.invalidSchedules([d('bad', '2026-11-05', '2026-11-01'), d('ok', '2026-11-01', '2026-11-02')]), ['bad']);
  const p = gantt.afterPredecessors(model.makeProject({ tasks: [d('a', '2026-11-01', '2026-11-05'), d('b', '2026-11-03', '2026-11-04', ['a'])] }), 'b');
  assert.equal(p.tasks[1].start, '2026-11-06');
  const sum = gantt.hierarchySummaries([T('p'), d('k1', '2026-11-01', '2026-11-02'), d('k2', '2026-11-05', '2026-11-06')].map((t) => (t.id.startsWith('k') ? { ...t, parentId: 'p' } : t)));
  assert.equal(gantt.dateAt(sum.get('p').start), '2026-11-01');
  assert.equal(gantt.dateAt(sum.get('p').end), '2026-11-06');
  assert.equal(gantt.calendarDomain(tasks, '2026-12-01').from, gantt.dayNumber('2026-11-01') - 3);
});

// Every export of these modules is either used by a screen or the store, used inside its own module,
// or listed here with the reason it is not wired. A new export that nothing uses fails this test.
test('wiring ledger: no export of the audited modules is left unused without a reason', () => {
  const walk = (d, o = []) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p, o); else if (/\.(js|cjs)$/.test(f)) o.push(p); } return o; };
  const files = walk(path.join(root, 'src')); const text = new Map(files.map((f) => [f, fs.readFileSync(f, 'utf8')]));
  const modules = { 'src/board/kanbanUX.cjs': [], 'src/domain/taskWorkflows.cjs': [], 'src/domain/planning.cjs': [], 'src/domain/operations.cjs': [],
    // old Timeline renderer pieces: the screen draws, routes and hit-tests with timelineGeometry / timelineViewport instead
    'src/timeline/gantt.cjs': ['LAYOUT', 'STUB_OUT', 'STUB_IN', 'ARROW', 'LANE', 'barBox', 'roundedPath', 'linkPreviewPath', 'layoutRows', 'barGeometry', 'dependencyGeometry', 'linkTargetAt', 'dependencyCurve', 'connectorPoint', 'linkGesturePoint'],
    // the Timeline deliberately has no row pager (it hid tasks outside the window)
    'src/timeline/timelineWindow.cjs': ['PHONE_ROWS', 'DESKTOP_ROWS', 'pageRows'],
    // text readers replaced by the byte readers that also open .niyav files
    'src/store/importFiles.cjs': ['pickAndroidJsonText', 'pickDocumentJsonText'] };
  for (const [file, allowed] of Object.entries(modules)) {
    const abs = path.join(root, file); const own = text.get(abs);
    for (const name of Object.keys(require(abs))) {
      if (allowed.includes(name)) continue;
      const re = new RegExp(`(?<![\\w$])${name}(?![\\w$])`);
      const used = files.some((f) => f !== abs && re.test(text.get(f))) || (own.match(new RegExp(`(?<![\\w$])${name}(?![\\w$])`, 'g')) || []).length > 2;
      assert.ok(used, `${file} exports ${name} but nothing uses it`);
    }
  }
});
