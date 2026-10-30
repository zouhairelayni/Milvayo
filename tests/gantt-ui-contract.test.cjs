'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const gantt=fs.readFileSync(require.resolve('../src/GanttView.js'),'utf8');
const app=fs.readFileSync(require.resolve('../App.js'),'utf8');
const pkg=require('../package.json');
test('pointer mapping uses pan deltas, not asynchronous window measurement',()=>{
 assert.match(gantt,/onLinkPointer\(task\.id,p\.dx,p\.dy\)/);
 assert.match(gantt,/onLinkFinish\(task\.id,p\.dx,p\.dy/);
 assert.doesNotMatch(gantt,/canvasOrigin|canvasRef|\.moveX|\.moveY|measureInWindow/);
});
test('dependency rendering is SVG and offers direct removal plus a touch fallback',()=>{
 assert.match(gantt,/from 'react-native-svg'/);
 assert.match(gantt,/g\.dependencyCurve\(path\)/);
 assert.match(gantt,/onPress=\{onSelect\}/);
 assert.match(gantt,/Remove link/);
 assert.match(gantt,/Project dependencies/);
 assert.match(gantt,/const removeSelectedLink=/);
});
test('Unslop changes are in UI, not only in a rules document',()=>{
 assert.match(gantt,/showHelp/);
 assert.match(gantt,/showScheduleIssues/);
 assert.match(gantt,/Hide help/);
 assert.match(app,/<Txt size=\{12\} color=\{C.muted\}>\{project.name\}<\/Txt>/);
 assert.doesNotMatch(app,/Manage, verify and preserve your work/);
});
test('Expo SDK 58 has matching SVG integration',()=>{
 assert.equal(pkg.version,'0.2.4');
 assert.equal(pkg.dependencies['react-native-svg'],'15.16.0');
 assert.match(pkg.dependencies.expo,/58\.0/);
});
