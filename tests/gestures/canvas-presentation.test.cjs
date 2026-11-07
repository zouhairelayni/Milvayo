// /tests/gestures/canvas-presentation.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {selectionAnchor,insertionPoint,inlineEditorBox}=require('../../src/canvas/presentation.cjs');
test('selection strip follows world position, pan, zoom, drag and resize while staying inside safe space',()=>{
 const boxes=[{id:'a',x:100,y:160,width:120,height:100}],viewport={width:390,height:720},pose={scale:1,x:0,y:0};
 const at=selectionAnchor(boxes,pose,null,viewport);assert.ok(at.y+at.height<160);const pan=selectionAnchor(boxes,{...pose,y:20},null,viewport);assert.equal(pan.y,at.y+20);
 const move=selectionAnchor(boxes,pose,{kind:'move',ids:['a'],dx:30,dy:40},viewport);assert.equal(move.y,at.y+40);assert.ok(move.x>=at.x);
 for(const width of [320,360,390,430,844,1440])for(const scale of [.05,.2,1,4])for(const x of [-10000,0,10000]){const view={width,height:390},p=selectionAnchor(boxes,{scale,x,y:x},null,view,326);assert.ok(p.x>=12);assert.ok(p.x+p.width<=width-12);assert.ok(p.y>=12);assert.ok(p.y+p.height<=view.height-84);}
});
test('new objects are placed visibly without changing the camera and low-zoom editors remain usable',()=>{
 const pose={scale:.2,x:-800,y:300},before={...pose},viewport={width:360,height:700},point=insertionPoint(pose,viewport);assert.ok((point.x+120)*pose.scale+pose.x>0);assert.deepEqual(pose,before);
 const input=inlineEditorBox({x:10000,y:10000,width:240,height:144},pose,viewport);assert.ok(input.width>=160);assert.ok(input.x>=12&&input.x+input.width<=348);assert.ok(input.y+input.height<=viewport.height-72);assert.deepEqual(pose,before);
});
test('touch-history mismatch warnings are classified without hiding them or retaining touch coordinates',()=>{
 const {warningKind}=require('../../src/diagnostics/core.cjs');assert.equal(warningKind(['Cannot record touch end without a touch start.','Touch End: %s','Touch Bank: %s','{"identifier":2,"pageX":291.84375}']),'touch-history-mismatch');assert.equal(warningKind(['Cannot record touch move without a touch start.']),'touch-history-mismatch');assert.equal(warningKind(['Another warning']),'unclassified');
});
