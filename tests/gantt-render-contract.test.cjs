'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');const tl=fs.readFileSync(path.join(root,'src/screens/Timeline.js'),'utf8');const app=fs.readFileSync(path.join(root,'ModernApp.js'),'utf8');
test('one modern timeline draws viewport-limited SVG instead of massive native canvas',()=>{assert.match(tl,/<Svg width=\{paintWidth\} height=\{paintH\} viewBox=/);assert.doesNotMatch(tl,/<Svg width=\{gridW\}/);assert.match(tl,/display\.paintedRange/);assert.match(tl,/rows = allScheduled/)});
test('timeline retains all task rows with continuous scroll and no sliced-page navigation',()=>{assert.doesNotMatch(tl,/Next rows|Previous rows/);assert.match(tl,/paintedRows\.map/);assert.match(tl,/drawnBars\.map/)});
test('overview and board are separate modern screens, no second application exists',()=>{assert.match(app,/board: Board/);assert.match(app,/overview: Overview/);assert.doesNotMatch(app,/ClassicApp|Advanced workspace/);assert.equal(fs.existsSync(path.join(root,'ClassicApp.js')),false)});
