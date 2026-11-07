// /tests/app/phone-shell-parity-060.test.cjs
// Redesign batch 1 contract: the phone shell RELOCATES features, it never removes one.
// Fails if a menu entry, screen, header control, gesture or notice host becomes unreachable.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const nav = require('../../src/app/navigation/sections.cjs');
const root = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

// The 19 entries of the menu before the redesign. This list is frozen on purpose: delete an id here only with the owner's approval.
const MENU_BEFORE = ['overview', 'board', 'timeline', 'scheduling', 'tasks', 'sprints', 'releases', 'testing', 'resources',
  'collaboration', 'costs', 'projects', 'portfolios', 'programs', 'automations', 'reports', 'activity', 'specifications', 'settings'];

const homes = () => {
  const map = new Map();
  for (const s of nav.SECTIONS) for (const [k] of s.views) map.set(k, `${s.id} pill`);
  for (const g of nav.moreGroups()) for (const [k] of g.items) map.set(k, `more: ${g.group}`);
  return map;
};

test('all 19 menu entries still exist, in the same order, and each has exactly one home on the phone', () => {
  const ids = nav.NAV.flatMap(g => g.items.map(([k]) => k));
  assert.deepEqual(ids.filter(id=>id!=='canvas'), [
    'overview', 'board', 'timeline', 'scheduling', 'tasks', 'sprints', 'releases', 'testing', 'resources', 'collaboration', 'costs',
    'projects', 'portfolios', 'programs', 'automations', 'reports', 'activity', 'specifications', 'settings']);
  assert.equal(new Set(MENU_BEFORE).size, 19);
  const seen = [...nav.SECTIONS.flatMap(s => s.views.map(([k]) => k)), ...nav.moreGroups().flatMap(g => g.items.map(([k]) => k))];
  assert.equal(new Set(seen).size, seen.length, 'an entry is listed in two places');
  for (const id of MENU_BEFORE) assert.ok(homes().has(id), `${id} has no home`);
  assert.equal(homes().size, 20);assert.equal(homes().get('canvas'),'more: Project tools');
});

test('feature parity matrix: where every old menu entry lives now', () => {
  const expected = {
    overview: 'home pill', board: 'work pill', tasks: 'work pill', timeline: 'work pill', sprints: 'work pill',
    projects: 'projects pill', portfolios: 'projects pill', programs: 'projects pill',
    scheduling: 'more: Project tools', canvas:'more: Project tools', settings: 'more: App',
    releases: 'more: Project tools', testing: 'more: Project tools', resources: 'more: Project tools', collaboration: 'more: Project tools',
    costs: 'more: Project tools', automations: 'more: Project tools', reports: 'more: Project tools', activity: 'more: Project tools',
    specifications: 'more: Project tools',
  };
  assert.deepEqual(Object.fromEntries(homes()), expected);
});

test('every reachable id is a registered screen, and the retained primary views sit in Home or Work', () => {
  const app = read('src/app/ModernApp.js');
  const table = app.split('const SCREENS = {')[1].split('};')[0];
  const keys = [...table.matchAll(/^\s+([a-z]+):/gm)].map(m => m[1]);
  for (const id of [...MENU_BEFORE, 'more']) assert.ok(keys.includes(id), `${id} is not in SCREENS`);
  assert.ok(keys.includes('taskconfig'));
  assert.match(read('src/screens/tasks/Tasks.js'), /<TaskConfiguration embedded \/>/); // Task configuration is reached inside Tasks
  const cached = app.match(/const CACHED_TABS = \[([^\]]+)\]/)[1].match(/'([a-z]+)'/g).map(x => x.slice(1, -1));
  for (const id of cached) assert.ok(['home', 'work'].includes(nav.sectionOf(id)), `${id} would not be retained`);
});

test('sections: Home, Work, Projects, More; Work holds Board, Timeline, List, Sprints in that order', () => {
  assert.deepEqual(nav.SECTIONS.map(s => s.id), ['home', 'work', 'projects', 'more']);
  assert.deepEqual(nav.SECTIONS[1].views, [['board', 'Board'], ['timeline', 'Timeline'], ['tasks', 'List'], ['sprints', 'Sprints']]);
  assert.deepEqual(nav.SECTIONS[2].views.map(v => v[0]), ['projects', 'portfolios', 'programs']);
  assert.equal(nav.sectionOf('releases'), 'more');
  assert.equal(nav.sectionOf('more'), 'more');
  assert.equal(nav.sectionOf('taskconfig'), 'more');
  assert.equal(nav.labelOf('specifications'), 'Specifications');
  assert.equal(nav.labelOf('more'), 'More');
});

test('swipe on the bar or the pill steps one neighbour, ignores short or vertical drags, stops at the ends', () => {
  const ids = ['board', 'tasks', 'timeline', 'sprints'];
  assert.equal(nav.swipeStep(ids, 'tasks', -120, 5), 'timeline'); // swipe left, next
  assert.equal(nav.swipeStep(ids, 'tasks', 120, 5), 'board');     // swipe right, previous
  assert.equal(nav.swipeStep(ids, 'board', 120, 0), null);
  assert.equal(nav.swipeStep(ids, 'sprints', -120, 0), null);
  assert.equal(nav.swipeStep(ids, 'tasks', -64, 0), null);        // under the 65 threshold
  assert.equal(nav.swipeStep(ids, 'tasks', -90, 80), null);       // mostly vertical
  assert.equal(nav.swipeStep(ids, 'unknown', -120, 0), null);
  assert.equal(nav.swipeStep(['home', 'work', 'projects', 'more'], 'projects', -100, 0), 'more');
});

test('bottom bar: Home, Work, Create, Projects, More; swipe and stale-press guards are kept', () => {
  const bars = read('src/components/shell/Bars.js');
  const app = read('src/app/ModernApp.js');
  assert.match(bars, /\[\.\.\.tabs\.slice\(0, 2\), \['create'\], \.\.\.tabs\.slice\(2\)\]/);
  assert.match(bars, /accessibilityLabel="Create"/);
  assert.match(bars, /onTouchStart=\{swipe\.onStart\} onTouchEnd=\{swipe\.onEnd\}/);
  assert.equal((bars.match(/useSwipe\(/g) || []).length, 3); // definition + bar + pill
  assert.match(bars, /swipe\.swipedAt\.current<450/);
  assert.match(bars, /intent\.accept\(press,k\)/);
  assert.match(app, /<TabBar tabs=\{TABS\} current=\{section\.id\} go=\{requestSection\} intent=\{intentRef\.current\} onCreate=\{newTask\}/);
  assert.match(app, /lastView\.current\[id\] \|\| SECTIONS\.find/); // the bar returns to the last view used in a section
});

test('view pill: reuses the shared Segmented control, swipes between views, ignores the tap a swipe ends in', () => {
  const bars = read('src/components/shell/Bars.js');
  const pill = bars.slice(bars.indexOf('export function ViewPill'), bars.indexOf('function HeaderIcons'));
  assert.match(pill, /<Segmented fill/);
  assert.match(pill, /swipedAt\.current >= 450/);
  assert.match(read('src/app/ModernApp.js'), /views\.length > 1 \? <ViewPill views=\{views\} current=\{screen\} go=\{requestTab\}/);
});

test('header keeps every per-screen control: Tools, New sprint, New release, Timeline tools, search', () => {
  for (const [file, id] of [['src/screens/board/Board.js', 'board'], ['src/screens/tasks/Tasks.js', 'tasks'],
    ['src/screens/delivery/Delivery.js', 'sprints'], ['src/screens/delivery/Delivery.js', 'releases'], ['src/screens/timeline/Timeline.js', 'timeline']]) {
    assert.match(read(file), new RegExp(`useHeaderActions\\('${id}'`), `${id} lost its header controls`);
  }
  const bars = read('src/components/shell/Bars.js');
  const icons = bars.slice(bars.indexOf('function HeaderIcons'), bars.indexOf('export function PhoneHeader'));
  assert.doesNotMatch(icons, /controls\.kind === 'zoom'/);
  assert.match(icons, /controls\.actions\?\.map/);
  assert.match(read('src/screens/timeline/Timeline.js'), /useHeaderActions\('timeline', null, screenActive\)/);
  const header = bars.slice(bars.indexOf('export function PhoneHeader'));
  assert.match(header, /accessibilityLabel="Search tasks"/);
  assert.match(header, /onQuery\(''\); setSearching\(false\)/); // closing search clears the filter it set
  assert.match(header, /<ProjectSwitcher onPickProject=\{onPickProject\} compact showProjectName=\{false\} \/>/);
  assert.match(header, /label="Go back"/);
});

test('Create sheet: the + button opens New task, with Project and Release one tap away', () => {
  const app = read('src/app/ModernApp.js');
  assert.match(app, /const newTask = useCallback\(\(\) => setCreatingTask\(true\), \[\]\)/);
  assert.match(app, /<NewTaskSheet onClose=\{\(\)=>setCreatingTask\(false\)\} onSave=\{saveNewTask\}/);
  assert.match(app, /<CreateMore onProject=/);
  assert.match(app, /<CreateProjectSheet visible=\{creatingProject\}/);
  assert.match(app, /onCreated=\{id => pickProject\(id, true\)\}/); // same flow as the project drawer
  assert.match(app, /setReleaseRequest\(true\); go\('releases', 'create sheet'\)/);
  assert.match(read('src/screens/tasks/TaskSheet.js'), /export function NewTaskSheet\(\{ onClose, onSave, extra \}\)/);
  assert.match(read('src/screens/tasks/TaskSheet.js'), /\{extra\}/);
  const release = read('src/screens/delivery/Delivery.js');
  assert.match(release, /export function Releases\(\{ releaseRequest = false, onReleaseRequestHandled \}\)/);
  assert.match(release, /onReleaseRequestHandled\?\.\(\)/); // consumed, so a later visit does not reopen the form
  assert.match(read('src/components/shell/CreateMore.js'), /Or create/);
});

test('More: the rest of the old menu, workspace switcher, appearance cycle and desktop layout', () => {
  const more = read('src/screens/more/More.js');
  assert.match(more, /moreGroups\(tools\)\.map/);
  assert.match(more, /label="Manage tools"/);
  assert.match(more, /<WorkspaceSwitcher onPickProject=\{onPickProject\} \/>/);
  assert.match(more, /NEXT_MODE = \{ light: 'dark', dark: 'amoled', amoled: 'light' \}/);
  assert.match(more, /<Row icon="monitor" label="Desktop layout"/);
  const menus = read('src/components/shell/Menus.js');
  assert.match(menus, /export function WorkspaceSwitcher/);
  assert.match(menus, /switchWorkspace|createWorkspace|renameWorkspace|deleteWorkspace/); // the workspace drawer itself is unchanged
});

test('reused, not rebuilt: island notice, board drag, timeline gestures and dependency lines are still wired', () => {
  const app = read('src/app/ModernApp.js');
  assert.match(app, /<IslandNotice notice=\{backupNotice \|\| notice\}/);
  assert.match(app, /onAction=\{action => \{ if \(action === 'backup'\)/);
  assert.match(read('src/screens/board/Board.js'), /import \{ useHoldDrag, cancelPendingBoardHolds \} from '\.\.\/\.\.\/board\/boardGesture'/);
  assert.match(read('src/screens/timeline/Timeline.js'), /<TimelineGestureHost>/);
  assert.match(read('src/screens/timeline/Timeline.js'), /np533DependencyColor/);
  assert.match(read('src/screens/timeline/Timeline.js'), /hold and drag onto another row to add a dependency/);
});

test('wide layout is untouched: sidebar with all 19 entries and the toolbar New task button', () => {
  const app = read('src/app/ModernApp.js');
  assert.match(app, /\{wide \? <Sidebar nav=\{navFor\(tools\)\}/);
  assert.match(app, /\{wide \? <TopBar query=\{query\}/);
  assert.match(read('src/components/shell/Bars.js'), /<Button label="New task" icon="plus" small onPress=\{onNew\} \/>/);
  assert.match(read('src/components/shell/Menus.js'), /<NavGroups nav=\{nav\} current=\{current\} go=\{go\} collapsed=\{compact\} \/>/);
});
