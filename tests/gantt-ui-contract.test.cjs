'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const gantt=fs.readFileSync(require.resolve('../src/GanttView.js'),'utf8');
const app=fs.readFileSync(require.resolve('../App.js'),'utf8');
const pkg=require('../package.json');
test('pointer tracking uses pan deltas, scroll compensation and measured contact offset',()=>{
 assert.match(gantt,/onLinkPointer\(task\.id,p\.dx,p\.dy,p\.moveX,p\.moveY\)/);
 assert.match(gantt,/onLinkFinish\(task\.id,p\.dx,p\.dy/);
 assert.match(gantt,/viewportMath\.dragDelta\(dx,dy,offsets\.current\.x,offsets\.current\.y,sess\.scrollX,sess\.scrollY/);
 assert.match(gantt,/if\(Math\.abs\(x\)<32&&Math\.abs\(y\)<32\)/);
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
 assert.match(gantt,/Pinch the chart to zoom/);
 assert.match(gantt,/onTouchMove=\{pinchMove\}/);
 assert.match(gantt,/const vx=viewportMath\.edgeVelocity/);
 assert.match(gantt,/const vy=viewportMath\.edgeVelocity/);
 assert.match(app,/<Txt size=\{12\} color=\{C.muted\} lines=\{1\}>\{project.name\}<\/Txt>/);
 assert.doesNotMatch(app,/Manage, verify and preserve your work/);
});
test('Expo SDK 58 has matching SVG integration',()=>{
 assert.match(pkg.version,/^(?:0\.2\.(?:[5-9]|[1-9][0-9]+)|0\.[3-9]\.\d+|[1-9]\d*\.\d+\.\d+)$/);
 assert.equal(pkg.dependencies['react-native-svg'],'15.16.0');
 assert.match(pkg.dependencies.expo,/58\.0/);
});
