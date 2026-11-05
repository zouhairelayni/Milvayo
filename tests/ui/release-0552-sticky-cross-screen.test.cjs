// /tests/ui/release-0552-sticky-cross-screen.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'../..');
const read = f => fs.readFileSync(path.join(root,f),'utf8');

test('Timeline pins the ribbon and calendar before the scrollable page',()=>{
  const s=read('src/screens/timeline/Timeline.js');
  const ribbon=s.indexOf("<Chip label={showItems ? 'Hide items' : 'Show items'}");
  const date=s.indexOf('<Animated.View pointerEvents="none"');
  const page=s.indexOf('    <Page\n');
  const body=s.indexOf('ref={chartRef}',page);
  assert.ok(ribbon>=0 && date>ribbon && page>date && body>page);
  assert.doesNotMatch(s,/scrolledDown|hideChrome|scrollChromeRef|opacity:scrolledDown/);
  assert.match(s,/onScroll=\{horizontalScroll\}/);
  assert.match(s,/useNativeDriver: Platform\.OS !== 'web'/);
  assert.doesNotMatch(s,/calendarRef/);
  assert.match(s,/pointerEvents="none"/);
  assert.match(s,/ref=\{gridRef\}/);
  assert.match(s,/critical=\{showCritical && critIds\.has\(t\.id\)\}/);
  assert.match(s,/stroke=\{showCritical && critEdges/);
});

test('Releases uses one task-style editor and persistent form data saved on command',()=>{
  const s=read('src/screens/delivery/Delivery.js');
  assert.match(s,/useHeaderActions\('releases', releaseHeader, activeScreen\)/);
  assert.match(s,/<Sheet visible=\{formOpen\}/);
  assert.match(s,/title=\{editing\?'Edit release':'New release'\}/);
  assert.match(s,/<Labeled title="Notes"[^>]+markdown/);
  assert.match(s,/onPress=\{save\}/);
  assert.match(s,/setFormOpen\(false\)/);
  assert.doesNotMatch(s,/<Fold title=\{editing\?/);
});

test('Testing replaces per-card status-control clutter with an accessible editor sheet',()=>{
  const s=read('src/screens/delivery/Delivery.js');
  const testing=s.slice(s.indexOf('export function Testing()'));
  assert.match(testing,/const \[selectedCheckId, setSelectedCheckId\] = useState\(null\)/);
  assert.match(testing,/onPress=\{\(\) => setSelectedCheckId\(k\.id\)\}/);
  assert.match(testing,/<Sheet visible=\{!!selectedCheck\}/);
  assert.match(testing,/setCheck\(selectedCheck\.id, st\)/);
  assert.match(testing,/s\.checks\.slice\(0, limit\)/);
  assert.match(testing,/accessibilityLabel=\{`Edit acceptance check/);
});

test('Scheduling previews render safe, readable tasks, dates and errors instead of truncated JSON',()=>{
  const s=read('src/screens/management/Management.js');
  assert.match(s,/proposal\.changes\.slice\(0,20\)/);
  assert.match(s,/proposal\.issues\.slice\(0,10\)/);
  assert.match(s,/proposal\.canApply/);
  assert.match(s,/DangerConfirm label="Apply schedule"/);
  assert.doesNotMatch(s,/JSON\.stringify\(proposal\)\.slice/);
  assert.match(s,/const r=previewSchedule\(anchors\)/);
});

test('Overview shows real due dates, an empty state, and accessible metric touch areas',()=>{
  const s=read('src/screens/overview/Overview.js')+read('src/screens/overview/today.cjs');
  assert.match(s,/tasks\.filter\(t => t\.status !== 'Done'\)/);
  assert.match(s,/open\.filter\(t => dated\(t\) && t\.due >= today\)/);
  assert.match(s,/No upcoming dated tasks/);
  assert.match(s,/minHeight: 44/);
});

test('Sprint burndown lets vertical gestures reach the page',()=>{
  const s=read('src/components/charts/charts.js');
  assert.match(s,/onStartShouldSetPanResponder: \(\) => false/);
  assert.match(s,/Math\.abs\(g\.dx\) > Math\.abs\(g\.dy\) \* 1\.4/);
  assert.match(s,/onTouchEnd=\{e=>/);
  assert.match(s,/onPanResponderMove/);
});

test('Activity is progressively rendered and overspent cost gets semantic color',()=>{
  const s=read('src/screens/workspace/Workspace.js');
  assert.match(s,/const \[visibleCount,setVisibleCount\] = useState\(50\)/);
  assert.match(s,/s\.activity\.slice\(0,visibleCount\)/);
  assert.match(s,/Show more activity/);
  assert.match(s,/budget-actual<0\?PRIORITY_COLOR\.Critical/);
});

test('Critical notices announce errors assertively',()=>{
  const s=read('src/components/notice/IslandNotice.js');
  assert.match(s,/accessibilityLiveRegion=\{type === 'error' \? 'assertive' : 'polite'\}/);
  assert.match(s,/display\.type === 'error'\) return undefined/);
});

test('Current release is a full source version with one cumulative changelog',()=>{
  const pkg=require('../../package.json'),app=require('../../app.json'),lock=require('../../package-lock.json');
  assert.equal(pkg.version,'0.5.59');
  assert.equal(app.expo.version,pkg.version);
  assert.equal(lock.version,pkg.version);
  assert.equal(lock.packages[''].version,pkg.version);
  const changelog=read('docs/changelog/CHANGELOG.md');
  assert.match(changelog,/## v0\.1\.0/);
  assert.equal((changelog.match(/^## v0\.5\.53/gm)||[]).length,1);
  assert.ok(fs.existsSync(path.join(root,'docs/qa/NP-CROSS-SCREEN-DESIGN-AUDIT-v0.5.52.md')));
  assert.deepEqual(fs.readdirSync(path.join(root,'docs/changelog')),['CHANGELOG.md']);
});

test('Sprint assignment and archived lists are disclosed progressively without dropping actions',()=>{
  const s=read('src/screens/delivery/Delivery.js');
  assert.match(s,/title={`Assigned tasks · \$\{assigned.length\}`}/);
  assert.match(s,/title={`Available backlog · \$\{backlog.length\}`}/);
  assert.match(s,/title={`Final sprint scope · \$\{/);
  assert.match(s,/onPress=\{\(\) => assignSprintTask\(t.id, selected.id\)\}/);
  assert.match(s,/setBacklogLimit\(n => n \+ 25\)/);
});

test('Reports, Activity and Resources are readable and usable on phones',()=>{
  const s=read('src/screens/workspace/Workspace.js');
  assert.match(s,/No completed sprint data yet/);
  assert.match(s,/<ScrollView horizontal showsHorizontalScrollIndicator accessibilityLabel="Sprint velocity chart"/);
  assert.match(s,/width: 86, alignItems: 'center'/);
  assert.match(s,/flexDirection: wide \? 'row' : 'column'/);
  assert.match(s,/Show more activity/);
  assert.match(s,/title="Time entries"|title="Time entries"/); // screen retains the time-log group
  assert.match(s,/value=\{taskId\} onChange=\{setTaskId\}/);
  assert.match(s,/disabled=\{!taskId\}/);
});

test('Long specification text and Scheduling/Collaboration task selection use existing shared editors',()=>{
  const s=read('src/screens/management/Management.js');
  assert.match(s,/markdown=\{SPEC_LONG.includes\(f\)\}/);
  assert.match(s,/options=\{s.tasks.map\(t=>\(\{value:t.id,label:t.title\}\)\)\}/);
  assert.match(s,/options=\{s.tasks.filter\(t=>t.id!==pre\)/);
  assert.match(s,/disabled=\{!pre\|\|!succ\|\|pre===succ\}/);
  assert.match(s,/disabled=\{!taskId\}/);
  assert.doesNotMatch(s,/JSON.stringify\(proposal\)/);
});
