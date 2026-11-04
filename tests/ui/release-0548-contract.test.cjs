// /tests/ui/release-0548-contract.test.cjs
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const source=f=>fs.readFileSync(path.join(root,f),'utf8');

test('v0.5.48 uses shared header actions and text New task on mobile and desktop',()=>{
 const app=source('src/app/ModernApp.js'),bars=source('src/components/shell/Bars.js');
 assert.match(app, /HeaderActionsContext.Provider/);
 assert.match(app, /<HeaderControls controls=\{controls\} \/>/);
 assert.match(bars, /<HeaderControls controls=\{controls\} \/>/);
 assert.match(app, /label="New task" icon="plus"/);
 assert.match(bars, /label="New task" icon="plus"/);
 assert.match(bars,/horizontal showsHorizontalScrollIndicator=\{false\}/);
 for(const name of ['Days','Weeks','Months']) assert.ok(bars.includes(name),name);
});

test('Timeline first focus waits for visible screen, not drag activity, and zoom moves to header',()=>{
 const s=source('src/screens/timeline/Timeline.js');
 assert.match(s,/useScreenActive\(\)/);
 assert.match(s,/if \(!screenActive \|\| !viewportW \|\| !rows.length \|\| firstFocus.current\)/);
 assert.match(s,/todayTasks\[0\] \|\| upcoming/);
 assert.match(s,/chartRef.current\?\.scrollTo\(\{x:xNext,animated:false\}\)/);
 assert.match(s,/useHeaderActions\('timeline', zoomHeader, screenActive\)/);
 assert.doesNotMatch(s,/actions=\{<Segmented options=\{\['Days'/);
});

test('Board and Tasks Tools and new Sprint are in header with no second page action',()=>{
 const board=source('src/screens/board/Board.js'),tasks=source('src/screens/tasks/Tasks.js'),sprint=source('src/screens/delivery/Delivery.js');
 assert.match(board,/useHeaderActions\('board', headerControls, active\)/);
 assert.match(tasks,/useHeaderActions\('tasks', headerControls, screenActive\)/);
 assert.match(sprint,/useHeaderActions\('sprints', sprintHeader, screenActive\)/);
 assert.match(sprint,/label:'New sprint'/);
 assert.doesNotMatch(tasks,/label="New task" icon="plus"/);
});

test('all shared sheets have a handle and dismiss gesture and no standalone close X',()=>{
 const s=source('src/ui/uiLayout.js');
 const sheet=s.slice(s.indexOf('export function Sheet'),s.indexOf('export function Page'));
 assert.match(sheet,/onTouchStart=\{startSwipe\}/);
 assert.match(sheet,/onTouchEnd=\{finishSwipe\}/);
 assert.match(sheet,/Swipe down to dismiss/);
 assert.match(sheet,/dy>110/);
 assert.match(sheet,/onRequestClose=\{onClose\}/);
 assert.doesNotMatch(sheet,/icon="x"/);
});

test('Delete and Duplicate confirmations show only their selected primary action and cancel',()=>{
 const s=source('src/screens/tasks/TaskSheet.js');
 const footer=s.slice(s.indexOf('const footer = t ?'),s.indexOf('const row =',s.indexOf('const footer = t ?')));
 assert.match(footer,/confirmDuplicate \? <>/);
 assert.match(footer,/Confirm duplicate/);
 assert.match(footer,/confirmDelete \? <>/);
 assert.match(footer,/Confirm delete/);
 assert.match(footer,/Delete this task\? This cannot be undone/);
 assert.match(footer,/label="Done"/);
});

test('Menu cycles three modes, logo is regular accent text, and Settings offers four modes',()=>{
 const app=source('src/app/ModernApp.js'), menu=source('src/components/shell/Menus.js'),settings=source('src/screens/workspace/Workspace.js');
 assert.match(app,/mode === 'light' \? 'dark' : mode === 'dark' \? 'amoled' : 'light'/);
 assert.match(menu,/projects-word-mask\.png/);
 assert.match(menu,/tintColor:c.accent,alignSelf:'flex-end'/);
 assert.match(menu,/tintColor:c.accent,alignSelf:'flex-end'/);
 assert.match(menu,/width: 240/);
 for(const label of ['System','Daylight','Dark','AMOLED']) assert.ok(settings.includes(`label="${label}"`),label);
 const {palette}=require('../../src/ui/theme/themePalette.cjs');
 assert.equal(palette('Amber','light').accent,'#FFA500');
 assert.equal(palette('Orange','light').accent,'#E65A19');
 assert.equal(palette('Orange','dark').accent,'#FF6F61');
});

test('one complete historical changelog and categorized QA/instructions only',()=>{
 const changelog=path.join(root,'docs/changelog/CHANGELOG.md');
 const s=fs.readFileSync(changelog,'utf8');
 for(const v of ['0.1.0','0.2.0','0.3.12','0.4.2','0.5.0','0.5.31','0.5.34','0.5.35','0.5.47','0.5.48'])assert.ok(s.includes('## v'+v),v);
 assert.match(s,/No standalone changelog for this version was present/);
 assert.deepEqual(fs.readdirSync(path.join(root,'docs/changelog')),['CHANGELOG.md']);
 assert.equal(fs.existsSync(path.join(root,'CHG-NP-0.5.47.md')),false);
 assert.ok(fs.readdirSync(path.join(root,'docs/qa/legacy')).length>5);
 assert.ok(fs.readdirSync(path.join(root,'docs/qa/modern')).length>5);
 assert.ok(fs.statSync(path.join(root,'docs/instructions/niyav-format.md')).size>200);
});
