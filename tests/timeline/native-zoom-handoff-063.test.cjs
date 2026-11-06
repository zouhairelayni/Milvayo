// /tests/timeline/native-zoom-handoff-063.test.cjs
'use strict';
const{test}=require('node:test');const assert=require('node:assert/strict');
const {validZoomCommit,createNativeZoomHandoff}=require('../../src/timeline/nativeZoomHandoff.cjs');
const{gestureHarness}=require('../helpers/diagram-harness.cjs');
test('native handoff waits for touch dispatch, applies once and invalidates superseded/unmounted sessions',()=>{
 const frames=new Map(),calls=[];let n=0;
 const q=createNativeZoomHandoff(fn=>{frames.set(++n,fn);return n;},id=>frames.delete(id),r=>calls.push(r));
 const frame=()=>{const a=[...frames.values()];frames.clear();a.forEach(fn=>fn());};
 q.begin(1);q.finish(1,{width:20,scroll:4});assert.deepEqual(calls,[]);frame();assert.deepEqual(calls,[]);frame();assert.equal(calls.length,1);
 q.begin(2);q.finish(2,{width:30});frame();q.begin(3);frame();assert.equal(calls.length,1);
 q.finish(2,{width:40});assert.equal(frames.size,0);q.finish(3,{width:50});q.cancel();frame();assert.equal(calls.length,1);
});
test('native commit validates complete geometry and clamps absolute dimensions/scroll',()=>{
 for(const v of [NaN,Infinity,-Infinity,0,-1])assert.equal(validZoomCommit(v,0,56,350),null);
 for(const [w,x,s,v] of [[34,NaN,56,350],[34,0,Infinity,350],[34,0,56,0]])assert.equal(validZoomCommit(w,x,s,v),null);
 const tiny=validZoomCommit(Number.MIN_VALUE,0,56,350);assert.ok(tiny.width>=3);assert.ok(Number.isFinite(34/tiny.width));
 const p=validZoomCommit(1000,1e9,40000,350);assert.ok(p.width*40000<=8192);assert.equal(p.scroll,8192-350);
});
test('native pinch ignores malformed focal/scale samples and cancels queued commits on background',()=>{
 const calls=[],h=gestureHarness('src/gestures/TimelinePinch.native.js',null,null,'useTimelinePinch');
 const props={width:34,span:56,viewportWidth:350,enabled:true,getScroll:()=>300,onStart(){calls.push('start')},onCommit(){calls.push('commit')},onEnd(){calls.push('end')}};
 const p=h.render(props);const e=(scale,focalX=100)=>({scale,focalX,numberOfPointers:2});
 h.gestures.pinch.onActivate(e(1));h.gestures.pinch.onUpdate(e(2));
 for(const bad of [e(NaN),e(Infinity),e(1,NaN),e(1,Infinity)])h.gestures.pinch.onUpdate(bad);
 assert.ok(p.style().transform.every(t=>Object.values(t).every(Number.isFinite)));
 h.gestures.pinch.onFinalize({});h.frame();assert.equal(calls.includes('commit'),false);
 h.appState('background');h.flushFrames();assert.equal(calls.includes('commit'),false);assert.equal(calls.at(-1),'end');
 h.gestures.pinch.onActivate(e(1));h.gestures.pinch.onUpdate(e(.5));h.gestures.pinch.onFinalize({state:3});h.flushFrames();assert.equal(calls.includes('commit'),false);
 h.cleanup();h.flushFrames();
});
test('native diagram offsets contain no shared values for RNGH render-time validation',()=>{
 const h=gestureHarness('src/gestures/DiagramGesture.native.js');
 h.render({bounds:{width:300,height:300,contentWidth:900,contentHeight:900},initialScale:1,resetKey:'qa',onZoom(){}});
 assert.equal(typeof h.gestures.pan.enabled,'boolean');
 for(const key of ['activeOffsetX','activeOffsetY','failOffsetY'])assert.ok(h.gestures.pan[key].every(Number.isFinite));
 h.cleanup();
});
