const {test}=require('node:test');
const assert=require('node:assert/strict');
const v=require('../src/viewport.cjs');
test('pinch widths are bounded and reversible',()=>{
 assert.equal(v.zoomWidth(24,2),48);
 assert.equal(v.zoomWidth(48,.5),24);
 assert.equal(v.zoomWidth(24,100),96);
 assert.equal(v.zoomWidth(24,.0001),6);
});
test('midpoint anchored scroll preserves the focused calendar position',()=>{
 const oldWidth=24,newWidth=48,scroll=120,screenCenter=80;
 const next=v.anchorScroll(scroll,screenCenter,oldWidth,newWidth);
 assert.equal((scroll+screenCenter)/oldWidth,(next+screenCenter)/newWidth);
});
test('pinch distance is Euclidean and handles a single pointer',()=>{
 assert.equal(v.touchDistance([{pageX:0,pageY:0},{pageX:3,pageY:4}]),5);
 assert.equal(v.touchDistance([{pageX:0,pageY:0}]),0);
});
test('fit width respects both minimum readability and maximum render bounds',()=>{
 assert.equal(v.fitWidth(300,30),10);
 assert.equal(v.fitWidth(120,540),6);
 assert.equal(v.fitWidth(2000,4),96);
});
test('edge pan has dead zone and symmetry',()=>{
 assert.equal(v.edgeVelocity(80,0,200,48),0);
 assert.ok(v.edgeVelocity(12,0,200,48)<0);
 assert.ok(v.edgeVelocity(188,0,200,48)>0);
 assert.equal(v.edgeVelocity(0,0,200,48),-v.edgeVelocity(200,0,200,48));
});
test('edge pan handles positions beyond the viewport and invalid positions safely',()=>{
 assert.equal(v.edgeVelocity(500,0,200,48),12);
 assert.equal(v.edgeVelocity(-500,0,200,48),-12);
 assert.equal(v.edgeVelocity(NaN,0,200),0);
 assert.equal(v.edgeVelocity(0,0,0),0);
});
test('bounded scroll values never go negative',()=>{
 assert.equal(v.clamp(-300,0,120),0);
 assert.equal(v.clamp(230,0,120),120);
});

test('drag connection hit test compensates for horizontal and vertical auto-scroll',()=>{
 const d=v.dragDelta(12,5,142,93,100,42,2,-1);
 assert.deepEqual(d,{x:56,y:55});
 const stationary=v.dragDelta(0,0,10,20,10,20);
 assert.deepEqual(stationary,{x:0,y:0});
});

test('canvasPointer = contact + finger movement + scroll since the grant',()=>{
 const p=v.canvasPointer({x:100,y:200},30,-10,{x:50,y:40},{x:20,y:40});
 assert.deepEqual(p,{x:160,y:190});
});
test('contactPoint uses the touch location on the handle, and falls back to the handle centre',()=>{
 assert.deepEqual(v.contactPoint(100,50,6,9,112,66),{x:106,y:59});
 assert.deepEqual(v.contactPoint(100,50,NaN,9,112,66),{x:112,y:66});
 assert.deepEqual(v.contactPoint(100,50,900,9,112,66),{x:112,y:66});
});
test('viewportLocal maps a chart point to the visible area',()=>{
 assert.deepEqual(v.viewportLocal({x:400,y:300},{x:350,y:100},124),{x:174,y:200});
});
