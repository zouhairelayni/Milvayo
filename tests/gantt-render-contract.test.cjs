'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const root=path.join(__dirname,'..');const gantt=fs.readFileSync(path.join(root,'src/GanttView.js'),'utf8');const app=fs.readFileSync(path.join(root,'App.js'),'utf8');
test('Timeline never creates a full height and width dependency SVG',()=>{
 assert.doesNotMatch(gantt,/<Svg[^>]*width=\{canvasWidth\}[^>]*height=\{totalHeight\}/);
 assert.match(gantt,/<Svg pointerEvents="box-none" width=\{chartWidth\}/);
 assert.match(gantt,/ganttWindow\.visibleLinks\(/);
});
test('Timeline limits task rows and date columns to the viewport',()=>{
 assert.match(gantt,/windowRows\.map\(/);
 assert.match(gantt,/windowRows\.filter\(row=>row\.kind==='task'\)/);
 assert.match(gantt,/visibleDayCells\.map\(/);
 assert.doesNotMatch(gantt,/\{days\.map\(/);
});
test('Overview no longer mounts a second interactive Kanban board',()=>{
 const from=app.indexOf(' const dashboard='),to=app.indexOf(' const boardScreen=',from);
 assert.ok(from>0&&to>from);
 const overview=app.slice(from,to);
 assert.doesNotMatch(overview,/<Board\s/);
 assert.doesNotMatch(overview,/Kanban board/);
 assert.match(app.slice(to,to+900),/<Board\s/);
});
test('mobile Kanban progressively loads cards instead of mounting 60 per lane initially',()=>{
 assert.match(app,/const PAGE=boardScreenWidth>=860\?36:12/);
 assert.match(app,/list\.slice\(0,boardLimits\[status\]\|\|PAGE\)/);
 assert.match(app,/\(a\[status\]\|\|PAGE\)\+PAGE/);
});
