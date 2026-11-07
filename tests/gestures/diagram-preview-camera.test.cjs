// /tests/gestures/diagram-preview-camera.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {load,gestureHarness}=require('../helpers/diagram-harness.cjs');
const {fitScale,constrainPose}=require('../../src/gestures/diagramZoom.cjs');
const bounds={width:320,height:600,contentWidth:61618,contentHeight:474,minScale:316/61618,center:true,fullScreen:true};
test('full-screen Fit contains an entire very wide tree and centers spare space without changing embedded zoom limits',()=>{
 const scale=fitScale(bounds);assert.equal(scale,316/61618);assert.ok(scale<.25);
 const pose=constrainPose({scale,x:0,y:0},bounds);assert.equal(pose.x,2);assert.ok(pose.y>290);
 assert.ok(bounds.contentWidth*pose.scale<=bounds.width);assert.ok(bounds.contentHeight*pose.scale<=bounds.height);
 assert.equal(fitScale({...bounds,minScale:undefined,center:false}),.25);
});
test('native camera uses only viewport bitmap dimensions and UI animated viewBox values, never scene-size views',()=>{
 let camera;const mod=load('src/governance/DiagramSvg.native.js',{
  'react-native-svg':{__esModule:true,default:'Svg'},
  'react-native-reanimated':{__esModule:true,default:{createAnimatedComponent:()=> 'AnimatedSvg'},useAnimatedProps:fn=>{camera=fn;return fn();}},
 },['CameraSvg']);
 const shared={value:{scale:2,x:-100,y:-50},get(){return this.value;}},children='cached vector nodes';
 const tree=mod.__test.CameraSvg({scene:{width:61618,height:474},viewport:{width:320,height:600},pose:shared,children});
 assert.equal(tree.props.width,320);assert.equal(tree.props.height,600);assert.equal(tree.props.children,children);
 assert.deepEqual(JSON.parse(JSON.stringify(camera())),{minX:50,minY:25,vbWidth:160,vbHeight:300});
 shared.value={scale:4,x:-160,y:0};assert.equal(camera().vbWidth,80);assert.equal(camera().minX,40);
 const exportView=mod.default({scene:{width:61618,height:474},children});assert.ok(exportView.props.width<=512);assert.ok(exportView.props.height<=512);
});
test('native viewport camera survives many UI updates and reports only on completion; full-screen diagonal panning stays local',()=>{
 let pose,zooms=0,reports=0;const h=gestureHarness('src/gestures/DiagramGesture.native.js');
 const props={bounds,initialScale:.5,resetKey:'preview:tree:0',renderViewport:p=>{pose=p;return 'cached SVG';},onZoom:()=>zooms++,onPose:()=>reports++};
 let tree=h.render(props);assert.equal(tree.props.children.props.children,'cached SVG');
 const event=scale=>({scale,numberOfPointers:2,focalX:100,focalY:100});h.gestures.pinch.onActivate(event(1));
 for(let i=0;i<500;i++)h.gestures.pinch.onUpdate(event(1+i/500));assert.equal(zooms,0);assert.equal(reports,0);assert.ok(pose.get().scale>.9);
 h.gestures.pinch.onFinalize({});assert.equal(zooms,1);assert.equal(reports,1);tree=h.render(props);
 assert.deepEqual(Array.from(h.gestures.pan.failOffsetY),[-1000000,1000000]);h.cleanup();
});
test('web full-screen wheel zoom and mouse pan preserve pose; embedded scroll handoff remains in its own existing tests',()=>{
 const handlers=new Map(),host={style:{},getBoundingClientRect:()=>({left:0,top:0}),addEventListener:(k,fn)=>handlers.set(k,fn),removeEventListener:k=>handlers.delete(k),setPointerCapture(){},hasPointerCapture:()=>false,releasePointerCapture(){}},stage={style:{}},reports=[];
 const h=gestureHarness('src/gestures/DiagramGesture.js',host,stage);
 h.render({bounds,initialScale:1,resetKey:'full',onPose:p=>reports.push(p)});
 let prevented=false;handlers.get('wheel')({deltaX:0,deltaY:-10,clientX:120,clientY:120,preventDefault(){prevented=true;}});
 assert.equal(prevented,true);assert.ok(reports.at(-1).scale>1);const pose=reports.at(-1);
 h.cleanup();assert.equal(handlers.size,0);h.render({bounds,initialScale:1,initialPose:pose,resetKey:'return'});assert.match(stage.style.transform,/scale\(1\.105/);h.cleanup();
});
