// /tests/gestures/canvas-surface.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {load}=require('../helpers/diagram-harness.cjs'),{lifecycleHarness,fakeClock}=require('../helpers/lifecycle-harness.cjs');
const object={id:'a',x:0,y:0,width:100,height:80,zIndex:0};
test('native Canvas previews hundreds of drag updates without JS writes, commits once, cancels safely and keeps pinch focal point',()=>{
 const h=lifecycleHarness(),gestures={};let moves=0,last,selected=0;
 const mod=load('src/canvas/CanvasSurface.native.js',{
  react:h.hooks,'react-native':{View:'View'},'react-native-svg':{__esModule:true,default:'Svg',Path:'Path',Rect:'Rect',Defs:'Defs',Pattern:'Pattern',Circle:'Circle'},
  'react-native-gesture-handler':{GestureDetector:'Detector',usePanGesture:c=>(gestures.pan=c),usePinchGesture:c=>(gestures.pinch=c),useTapGesture:c=>{if(c.numberOfTaps===2)gestures.doubleTap=c;else gestures.tap=c;return c;},useExclusiveGestures:(...x)=>x,useSimultaneousGestures:(...x)=>x},
  'react-native-reanimated':{__esModule:true,default:{createAnimatedComponent:()=> 'AnimatedPath'},useAnimatedProps:fn=>fn(),useFrameCallback(){},useSharedValue:initial=>h.hooks.useRef({value:initial,get(){return this.value;},set(v){this.value=v;}}).current},
  '../diagnostics/monitor':{diagnosticMonitor:{recordAction(){}}},'react-native-worklets':{scheduleOnRN:(fn,...args)=>fn(...args)},'../governance/DiagramSvg':{__esModule:true,default:'DiagramSvg'},'./CanvasDrawing':{__esModule:true,default:'Drawing'},'../ui/theme/theme':{useTheme:()=>({c:{bg:'#111',ink:'#fff'}})},
 });
 const props={board:{revision:0,objects:[object]},selected:[],mode:'select',initialPose:{scale:1,x:0,y:0},request:0,viewport:{width:390,height:440},onSelect:()=>selected++,onMove:(ids,dx,dy)=>{moves++;last={ids,dx,dy};},onPose(){},onDraw(){},onEditObject:id=>{assert.equal(id,'a');selected++;},onEditEdge(){}};
 let tree=h.render(mod.default,props);gestures.pan.onActivate({x:20,y:20,translationX:0,translationY:0});
 for(let i=0;i<300;i++)gestures.pan.onUpdate({numberOfPointers:1,translationX:i,translationY:16});assert.equal(moves,0);gestures.pan.onFinalize({state:5});assert.equal(moves,1);assert.equal(last.dx,299);assert.equal(last.dy,16);assert.ok(selected>0);
 tree=h.render(mod.default,{...props,board:{...props.board,revision:1}});gestures.pan.onActivate({x:20,y:20,translationX:0,translationY:0});gestures.pan.onUpdate({numberOfPointers:1,translationX:50,translationY:50});gestures.pan.onTouchesCancel();gestures.pan.onFinalize({state:3});assert.equal(moves,1);
 gestures.pinch.onActivate({focalX:100,focalY:100,scale:1,numberOfPointers:2});gestures.pinch.onUpdate({focalX:100,focalY:100,scale:2,numberOfPointers:2});const svg=require('../helpers/screen-harness.cjs').nodes(tree).find(n=>n.type==='DiagramSvg');assert.equal(svg.props.pose.get().scale,2);assert.equal(svg.props.pose.get().x,-100);assert.equal(moves,1);gestures.doubleTap.onDeactivate({x:0,y:0});
 let connections=0,resizes=0;const b={...object,id:'b',x:300,y:200};
 const handles={...props,selected:['a'],request:1,board:{revision:2,objects:[object,b],connectors:[]},onConnect:(from,to)=>{assert.equal(from,'a');assert.equal(to,'b');connections++;},onResize:(id,width,height)=>{assert.equal(id,'a');assert.equal(width,140);assert.equal(height,110);resizes++;return true;}};
 tree=h.render(mod.default,handles);gestures.pan.onActivate({x:120,y:40,translationX:0,translationY:0});gestures.pan.onUpdate({x:350,y:240,translationX:230,translationY:200,numberOfPointers:1});assert.equal(connections,0);gestures.pan.onFinalize({state:5});assert.equal(connections,1);
 tree=h.render(mod.default,{...handles,request:2});gestures.pan.onActivate({x:120,y:40,translationX:0,translationY:0});gestures.pan.onUpdate({x:200,y:500,translationX:80,translationY:460,numberOfPointers:1});gestures.pan.onFinalize({state:5});assert.equal(connections,1,'empty drops do not create lines');
 tree=h.render(mod.default,{...handles,request:3});gestures.pan.onActivate({x:100,y:80,translationX:0,translationY:0});gestures.pan.onUpdate({x:140,y:110,translationX:40,translationY:30,numberOfPointers:1});gestures.pan.onFinalize({state:5});assert.equal(resizes,1);h.unmount();
});
test('browser Canvas uses the SVG WebShape DOM ref, commits at release and removes listeners',()=>{
 const h=lifecycleHarness(),clock=fakeClock(),events=new Map(),attributes=new Map();
 const stage={setAttribute:(k,v)=>attributes.set(k,v)},host={getBoundingClientRect:()=>({left:0,top:0}),querySelector:()=>({setAttribute(){}}),addEventListener:(k,fn)=>events.set(k,fn),removeEventListener:k=>events.delete(k),setPointerCapture(){},hasPointerCapture:()=>false};let refs=0,moves=0,reports=0,connections=0,resizes=0;
 const mod=load('src/canvas/CanvasSurface.web.js',{
  react:{...h.hooks,useRef:value=>h.hooks.useRef(refs++===0?host:refs===2?{elementRef:{current:stage}}:value)},'react-native':{View:'View'},'react-native-svg':{__esModule:true,default:'Svg',G:'G',Path:'Path',Rect:'Rect',Defs:'Defs',Pattern:'Pattern',Circle:'Circle'},'./CanvasDrawing':{__esModule:true,default:'Drawing'},'../ui/theme/theme':{useTheme:()=>({c:{bg:'#111',ink:'#fff'}})},
 },[],{CSS:{escape:x=>x},setTimeout:clock.setTimeout,clearTimeout:clock.clearTimeout});
 const props={board:{revision:0,objects:[object],connectors:[]},selected:[],mode:'select',initialPose:{scale:1,x:0,y:0},request:0,viewport:{width:390,height:440},onSelect(){},onMove(){moves++;return true;},onPose(){reports++;},onDraw(){}};
 h.render(mod.default,props);assert.match(attributes.get('transform'),/scale\(1\)/);
 const e={button:0,pointerType:'mouse',pointerId:1,clientX:20,clientY:20,preventDefault(){}};events.get('pointerdown')(e);for(let i=0;i<100;i++)events.get('pointermove')({...e,clientX:20+i});assert.equal(moves,0);events.get('pointerup')({...e,type:'pointerup'});assert.equal(moves,1);
 reports=0;for(let i=0;i<20;i++)events.get('wheel')({...e,deltaX:0,deltaY:-1,deltaMode:0});assert.match(attributes.get('transform'),/scale\(1\.10/);assert.equal(reports,0);clock.advance(120);assert.equal(reports,1,'wheel motion reports once after the burst');
 const b={...object,id:'b',x:300,y:200},handles={...props,request:1,selected:['a'],board:{revision:1,objects:[object,b],connectors:[]},onConnect:(from,to)=>{assert.equal(from,'a');assert.equal(to,'b');connections++;},onResize:(id,w,h)=>{assert.equal(id,'a');assert.equal(w,140);assert.equal(h,110);resizes++;}};h.render(mod.default,handles);
 const pointer=(x,y,type='pointerup')=>({...e,clientX:x,clientY:y,type});events.get('pointerdown')(pointer(120,40));events.get('pointermove')(pointer(350,240));assert.equal(connections,0);events.get('pointerup')(pointer(350,240));assert.equal(connections,1);
 events.get('pointerdown')(pointer(120,40));events.get('pointermove')(pointer(500,500));events.get('pointercancel')(pointer(500,500,'pointercancel'));assert.equal(connections,1);
 events.get('pointerdown')(pointer(100,80));events.get('pointermove')(pointer(140,110));events.get('pointerup')(pointer(140,110));assert.equal(resizes,1);
 events.get('wheel')({...e,deltaX:0,deltaY:1,deltaMode:0});h.unmount();assert.equal(events.size,0);assert.equal(clock.size,0);
});
