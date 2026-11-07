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
  react:{Children:require('react').Children,useMemo:fn=>fn()},
  'react-native-svg':{__esModule:true,default:'Svg',G:'G'},
  'react-native-reanimated':{__esModule:true,default:{createAnimatedComponent:()=> 'AnimatedSvg'},useAnimatedProps:fn=>{camera=fn;return fn();}},
 },['CameraSvg']);
 const shared={value:{scale:2,x:-100,y:-50},get(){return this.value;}},children='cached vector nodes';
 const tree=mod.__test.CameraSvg({scene:{width:61618,height:474},viewport:{width:320,height:600},pose:shared,children});
 assert.equal(tree.props.viewBox,undefined);assert.equal(tree.props.vbWidth,320);assert.equal(tree.props.vbHeight,600);assert.equal(tree.props.align,'xMinYMin');
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
test('native Tree batch display follows the live camera without remounting children or using opacity bitmaps',()=>{
 let update;const mod=load('src/governance/DiagramSvg.native.js',{
  react:{Children:require('react').Children,useMemo:fn=>fn()},'react-native-svg':{__esModule:true,default:'Svg',G:'G'},
  'react-native-reanimated':{__esModule:true,default:{createAnimatedComponent:component=>'Animated'+component},useAnimatedProps:fn=>{update=fn;return fn();}},
 },['CameraBatch']);
 const pose={value:{scale:1,x:0,y:0},get(){return this.value;}};
 const child={cached:true},tree=mod.__test.CameraBatch({bounds:{x:2000,y:0,width:140,height:58},pose,viewport:{width:390,height:440},children:child});
 assert.equal(tree.props.children,child);assert.equal(update().display,'none');assert.equal(update().opacity,undefined);
 pose.value={scale:1,x:-1900,y:0};assert.equal(update().display,'inline');
 pose.value={scale:.1,x:0,y:0};assert.equal(update().display,'inline');
});

test('first native camera size follows explicit 100%/150%/Fit pose, independent of scene aspect ratio',()=>{
 const mod=load('src/governance/DiagramSvg.native.js',{react:{Children:require('react').Children,useMemo:fn=>fn()},'react-native-svg':{__esModule:true,default:'Svg',G:'G'},'react-native-reanimated':{__esModule:true,default:{createAnimatedComponent:()=> 'AnimatedSvg'},useAnimatedProps:fn=>fn()}},['CameraSvg']);
 for(const scale of [1,1.5,.25]){
  const initial={scale,x:-60,y:24},pose={get:()=>initial};const tree=mod.__test.CameraSvg({scene:{width:60000,height:500},viewport:{width:390,height:440},cameraInitial:initial,pose,children:[]});
  assert.equal(tree.props.viewBox,undefined);assert.equal(tree.props.minX,-initial.x/scale);assert.equal(tree.props.vbWidth,390/scale);assert.equal(tree.props.vbHeight,440/scale);
  assert.ok(Math.abs(tree.props.vbWidth/tree.props.vbHeight-390/440)<1e-12);
 }
});
