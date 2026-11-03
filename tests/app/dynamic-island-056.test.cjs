// /tests/app/dynamic-island-056.test.cjs
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..', '..',p),'utf8');

test('Dynamic Island has distinct compact, expanded and closing phases with interactive controls',()=>{
 const source=read('src/components/notice/IslandNotice.js');
 assert.match(source,/setStage\('compact'\)/);
 assert.match(source,/setStage\('expanded'\)/);
 assert.match(source,/setStage\('hidden'\)/);
 assert.match(source,/accessibilityLabel="Dismiss notification"/);
 assert.match(source,/accessibilityLabel="Collapse notification"/);
 assert.match(source,/clearTimers\(\)/);
});
test('errors stay visible until dismissed and ordinary updates auto-collapse',()=>{
 const source=read('src/components/notice/IslandNotice.js');
 assert.match(source,/display\.type==='error'\) return undefined/);
 assert.match(source,/setStage\('compact'\),display\.type==='warning'/);
 assert.match(source,/setTimeout\(dismiss,1250\)/);
});
test('Android and iOS use Reanimated UI-thread worklets to animate island dimensions',()=>{
 const native=read('src/components/notice/NoticeMotion.native.js');
 assert.match(native,/useSharedValue/);
 assert.match(native,/useAnimatedStyle/);
 assert.match(native,/withSpring/);
 assert.match(native,/withTiming/);
 assert.match(native,/\bwidth:\s*interpolate/);
 assert.match(native,/\bheight:\s*interpolate/);
 assert.doesNotMatch(native,/PanResponder|setInterval|requestAnimationFrame/);
});
test('Desktop web animates state transitions and safe-area anchors remain in the shell',()=>{
 const web=read('src/components/notice/NoticeMotion.web.js');
 assert.match(web,/Animated\.timing/);
 assert.match(web,/inputRange/);
 const shell=read('src/app/ModernApp.js');
 assert.match(shell,/wide \? Math\.max\(20, insets\.top \+ 16\)/);
 assert.match(shell,/noticeTopOffset\(insets, Platform\.OS, NativeStatusBar\.currentHeight\)/);
});
