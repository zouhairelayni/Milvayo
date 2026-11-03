// /tests/app/notice-safe-anchor-055.test.cjs
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..', '..',p),'utf8');
const {noticeTopOffset}=require('../../src/components/notice/noticePlacement.cjs');

test('mobile island floats near top of app window, not under the app header or scrolling content',()=>{
 const app=read('src/app/ModernApp.js');
 assert.match(app,/return \(\s*<View style=\{\{ flex: 1, position: 'relative', backgroundColor: c\.bg \}\}>/);
 assert.match(app,/<SafeAreaView edges=\{\['top', 'bottom', 'left', 'right'\]\}/);
 const safeStart=app.lastIndexOf('<SafeAreaView edges=');
 const safeEnd=app.indexOf('</SafeAreaView>',safeStart);
 const host=app.lastIndexOf('<IslandNotice',app.indexOf('export default function ModernApp'));
 assert.ok(safeEnd>=0 && host>safeEnd,'island should be a sibling of the safe-area content so it anchors to screen top');
 assert.doesNotMatch(app.slice(safeStart,safeEnd),/<IslandNotice/, 'do not anchor inside the scrollable page');
 assert.match(app.slice(host),/noticeTopOffset\(insets, Platform\.OS, NativeStatusBar\.currentHeight\)/);
});

test('top placement preserves iOS notch and Android system status area',()=>{
 assert.equal(noticeTopOffset({top:59},'ios',0),69);
 assert.equal(noticeTopOffset({top:24},'android',24),34);
 assert.equal(noticeTopOffset({top:0},'android',28),38,'fallback when edge-to-edge returns zero inset');
 assert.equal(noticeTopOffset({top:38},'android',24),48);
 assert.equal(noticeTopOffset({top:0},'web',0),10);
 assert.equal(noticeTopOffset({},'ios'),10);
 assert.equal(noticeTopOffset({top:-10},'ios'),10);
});

test('native animation and desktop wide safe area remain intact',()=>{
 const app=read('src/app/ModernApp.js');
 assert.match(app,/wide=\{wide\}/);
 assert.match(app,/wide \? Math\.max\(20, insets\.top \+ 16\)/);
 const notice=read('src/components/notice/IslandNotice.js');
 assert.match(notice,/NoticeMotion key=\{display\.id\}/);
 assert.match(read('src/components/notice/NoticeMotion.native.js'),/pointerEvents="box-none"/);
 assert.match(read('src/components/notice/NoticeMotion.native.js'),/withSpring/);
});
