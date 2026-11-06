// /tests/ui/release-0549-design.test.cjs
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('header action groups scroll instead of wrapping or squeezing onto a second line',()=>{
 const bars=read('src/components/shell/Bars.js');
 assert.match(bars,/contentContainerStyle=\{\{ flexGrow: 1, flexDirection:'row', alignItems:'center', justifyContent:'flex-end', gap:8 \}\}/);
 assert.match(bars,/horizontal showsHorizontalScrollIndicator=\{false\}/);
 const app=read('src/app/ModernApp.js');
 assert.match(app,/controls=\{controls\} onPickProject/);
 assert.match(bars,/function HeaderIcons/);
});

test('large-surface components and secondary list interactions use the same layout scale',()=>{
 const page=read('src/ui/uiLayout.js'), board=read('src/screens/board/Board.js')+read('src/screens/tasks/DueSoon.js');
 const tasks=read('src/screens/tasks/Tasks.js'),timeline=read('src/screens/timeline/Timeline.js');
 assert.match(page,/paddingTop: topPadding \?\? \(wide \? 24 : 16\)/);
 assert.match(board,/rowHeight=Math\.max\(56,/);
 assert.match(tasks,/minHeight: 44, backgroundColor: c\.surfaceAlt/);
 assert.match(timeline,/minHeight: 44, justifyContent: 'center'/);
 assert.match(read('src/app/ModernApp.js'),/outline:2px solid currentColor/);
});

test('version and cumulative changelog remain synchronized',()=>{
 const pkg=require('../../package.json'), app=require('../../app.json'),lock=require('../../package-lock.json');
 assert.match(pkg.version,/^\d+\.\d+\.\d+$/);
 assert.equal(app.expo.version,pkg.version);
 assert.equal(lock.version,pkg.version);
 assert.equal(lock.packages[''].version,pkg.version);
 assert.match(read('docs/changelog/CHANGELOG.md'),/## v0\.5\.50/);
 assert.ok(fs.existsSync(path.join(root,'docs/qa/NP-UI-DESIGN-AUDIT-v0.5.49.md')));
});
