// /tests/ui/release-0549-design.test.cjs
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('shared header zoom, contextual tools, task action and hamburger use one 44pt control rhythm',()=>{
 const bars=read('src/components/shell/Bars.js'), app=read('src/app/ModernApp.js');
 const controls=read('src/ui/uiControls.js');
 assert.match(bars,/if \(controls\.kind === 'zoom'\).*height: 44/);
 assert.match(bars,/minHeight:44/);
 assert.match(bars,/style=\{\{ flex: 1, minWidth: 0, height: 44 \}\}/);
 assert.match(controls,/borderRadius: radius\.sm, minHeight: 40/);
 assert.match(controls,/width: 40, height: 40/);
 assert.match(app,/minHeight: 64, gap: 8/);
 assert.match(bars,/paddingVertical: compact \? 10 : 14/);
 assert.match(bars,/label="New task" icon="plus"/);
});

test('header action groups scroll instead of wrapping or squeezing onto a second line',()=>{
 const bars=read('src/components/shell/Bars.js');
 assert.match(bars,/contentContainerStyle=\{\{ flexGrow: 1, flexDirection:'row', alignItems:'center', justifyContent:'flex-end', gap:8 \}\}/);
 assert.match(bars,/horizontal showsHorizontalScrollIndicator=\{false\}/);
 const app=read('src/app/ModernApp.js');
 assert.match(app,/<HeaderControls controls=\{controls\} \/>/);
});

test('mobile menu is 75% of original 320pt width, with readable navigation and no decorative active stripe',()=>{
 const menu=read('src/components/shell/Menus.js');
 assert.match(menu,/width: 240,\s*maxWidth: '80%'/);
 assert.match(menu,/<Brand narrow \/>/);
 assert.match(menu,/gap: dense \? 8 : 12, minHeight: 44/);
 assert.match(menu,/<NavGroups nav=\{nav\} current=\{current\} go=\{go\} \/>/);
 assert.doesNotMatch(menu,/borderLeftWidth\s*:\s*\d+.*accent/);
});

test('every screen inherits improved field touch targets and non-shouting typography',()=>{
 const ui=read('src/ui/uiControls.js'),inline=read('src/components/inline/CompactTools.js');
 assert.match(ui,/minHeight: multiline \? 104 : 44/);
 assert.match(ui,/minHeight: 40, justifyContent: 'center'/);
 assert.match(ui,/minHeight: 40, justifyContent: 'center', backgroundColor:/);
 assert.match(ui,/Platform\.OS === 'web' && !wide \? 16 : 14/);
 assert.match(inline,/<T muted size=\{12\} weight="500">\{title\}<\/T>/);
 assert.doesNotMatch(inline,/<T muted upper size=\{11\}/);
 assert.match(inline,/minHeight:44/);
});

test('large-surface components and secondary list interactions use the same layout scale',()=>{
 const page=read('src/ui/uiLayout.js'), board=read('src/screens/board/Board.js');
 const tasks=read('src/screens/tasks/Tasks.js'),timeline=read('src/screens/timeline/Timeline.js');
 assert.match(page,/paddingTop: topPadding \?\? \(wide \? 24 : 16\)/);
 assert.match(board,/minHeight: 44, opacity: pressed \? 0\.6 : 1/);
 assert.match(tasks,/minHeight: 44, backgroundColor: c\.surfaceAlt/);
 assert.match(timeline,/minHeight: 44, justifyContent: 'center'/);
 assert.match(read('src/app/ModernApp.js'),/outline:2px solid currentColor/);
});

test('version and cumulative changelog remain synchronized',()=>{
 const pkg=require('../../package.json'), app=require('../../app.json'),lock=require('../../package-lock.json');
 assert.match(pkg.version,/^0\.5\./);
 assert.equal(app.expo.version,pkg.version);
 assert.equal(lock.version,pkg.version);
 assert.equal(lock.packages[''].version,pkg.version);
 assert.match(read('docs/changelog/CHANGELOG.md'),/## v0\.5\.50/);
 assert.ok(fs.existsSync(path.join(root,'docs/qa/NP-UI-DESIGN-AUDIT-v0.5.49.md')));
});
