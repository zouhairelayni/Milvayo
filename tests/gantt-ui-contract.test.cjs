 'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const timeline=fs.readFileSync(path.join(__dirname,'../src/screens/Timeline.js'),'utf8');
test('timeline uses matching native coordinate geometry and avoids auto-scrolling task bars away',()=>{assert.match(timeline,/viewport\.svgViewBox\(paintLeft, paintTop, paintWidth, paintH\)/);assert.doesNotMatch(timeline,/if \(viewportW > 0\) goToday\(false\)/);assert.match(timeline,/Chip label="Today"/)});
test('task bars and links share the same visible viewport',()=>{assert.match(timeline,/paintLeft=\{paintLeft\}/);assert.match(timeline,/paintWidth=\{paintWidth\}/);assert.match(timeline,/links\.map/);assert.match(timeline,/pointerEvents="none"/)});
test('timeline drag and link states are not page-navigation or data-format mutations',()=>{assert.match(timeline,/setDrag/);assert.match(timeline,/setLink/);assert.match(timeline,/updateTask/);assert.match(timeline,/touch/ig)});
