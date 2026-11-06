// /tests/timeline/remediation-062.test.cjs
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createZoomQueue}=require('../../src/timeline/zoomQueue.cjs');
const display=require('../../src/timeline/timelineDisplay.cjs');
const {load,gestureHarness}=require('../helpers/diagram-harness.cjs');

test('rapid zoom inputs commit the latest focal position once per frame and can be cancelled',()=>{
 const frames=new Map(),commits=[];let serial=0;
 const q=createZoomQueue(fn=>{frames.set(++serial,fn);return serial;},id=>frames.delete(id),v=>commits.push(v));
 for(let i=1;i<=100;i++)q.push({width:i,scroll:i*10});
 assert.equal(frames.size,1);assert.equal(q.pending.width,100);
 frames.get(1)();frames.delete(1);assert.deepEqual(commits,[{width:100,scroll:1000}]);assert.equal(q.pending,null);
 q.push({width:5,scroll:4});q.clear();assert.equal(frames.size,0);assert.equal(q.pending,null);assert.equal(commits.length,1);
 q.push({width:7,scroll:8});frames.get(3)();assert.equal(commits.length,2);
});
test('calendar labels use UTC across leap/year boundaries and allocate only requested ticks',()=>{
 assert.deepEqual(display.calendarLabels('2024-02-28',[0,1,2]).map(x=>x.iso),['2024-02-28','2024-02-29','2024-03-01']);
 assert.deepEqual(display.calendarLabels('2026-12-31',[0,1]).map(x=>[x.day,x.month]),[[31,'Dec'],[1,'Jan']]);
 const ticks=display.ticks(40000,'Months',8192/40000);
 assert.equal(display.calendarLabels('2000-01-01',ticks).length,ticks.length);assert.ok(ticks.length<110);
});
test('vertical owner-derived window reaches final rows for 34 and 1000 tasks with bounded mounting',()=>{
 for(const count of [34,1000])for(const height of [320,800,1200]){
  const scroll=count*54-height+80, origin=80;
  const r=display.paintedRange(count,origin-scroll,height,54);
  assert.equal(r.last,count);assert.ok(r.first>0);assert.ok(r.last-r.first<=Math.ceil(height/54)+7);
  assert.equal(display.paintedRange(count,origin,height,54).first,0);
 }
});
test('native scroll keeps shared-value-bearing gesture relationships out of core Animated render props',()=>{
 let reads=0;const shared={};Object.defineProperty(shared,'value',{enumerable:true,get(){reads++;throw Error('render shared value read');}});
 const relation={nested:shared};let config;
 const module=load('src/gestures/TimelineScrollView.native.js',{'react-native':{Animated:{ScrollView:'AnimatedScrollView'}},'react-native-gesture-handler':{GestureDetector:'Detector',useNativeGesture:c=>{config=c;return c;}}});
 const tree=module.default({simultaneousWith:relation,horizontal:true});
 assert.equal(config.simultaneousWith,relation);assert.equal(tree.type,'Detector');
 const props=tree.props.children.props;assert.equal(props.horizontal,true);assert.equal('simultaneousWith' in props,false);
 const walk=o=>{if(o&&typeof o==='object')for(const key of Object.keys(o))walk(o[key]);};walk(props);assert.equal(reads,0);
});
test('pinch text counter-scale cancels parent scale without reading shared state during React render',()=>{
 const h=gestureHarness('src/gestures/TimelinePinch.native.js',null,null,'useTimelinePinch');
 const c=h.render({width:34,span:56,viewportWidth:320,enabled:true,getScroll:()=>0,onStart(){},onCommit(){},onEnd(){}});
 for(const scale of [.5,1.5,2]){c.previewTo(34*scale,0);const outer=c.style().transform[1].scaleX,inner=c.labelStyle().transform[0].scaleX;assert.equal(outer*inner,1);}
 c.reset();assert.equal(c.labelStyle().transform[0].scaleX,1);h.cleanup();
});
