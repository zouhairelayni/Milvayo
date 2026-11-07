// /tests/ui/diagram-preview-export.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {load}=require('../helpers/diagram-harness.cjs'),{lifecycleHarness}=require('../helpers/lifecycle-harness.cjs');
const {nodes,control,text}=require('../helpers/screen-harness.cjs');
const {sceneFor}=require('../../src/governance/diagramScene.cjs');
const {pm,fixture}=require('../helpers/wbs-harness.cjs');
const UI=new Proxy({},{get:(_,key)=>key}),colors={ink:'#ffffff',bg:'#111111',surface:'#222222',muted:'#aaaaaa',line:'#444444',danger:'#ff4444'};

test('full-screen preview retains geometry, offers accessible compact controls, respects measured space and inspects current work elements',()=>{
 const h=lifecycleHarness(),raw=fixture().map(n=>({...n,owner:'Owner',note:'Read the full specification'})),root=pm.buildTree(raw,'Studio'),rows=pm.flattenTree(root),scene=sceneFor('tree',root,'down');
 const priorities=[];let closed=0;
 const mod=load('src/governance/DiagramPreview.js',{
  react:h.hooks,'react-native':{Modal:'Modal',View:'View',useWindowDimensions:()=>({width:320,height:844})},
  'react-native-safe-area-context':{SafeAreaProvider:'SafeAreaProvider',SafeAreaView:'SafeAreaView',useSafeAreaInsets:()=>({top:0,bottom:0,left:0,right:0})},
  'react-native-gesture-handler':{GestureHandlerRootView:'GestureHandlerRootView'},'../ui/ui':UI,'../ui/theme/theme':{useTheme:()=>({c:colors})},
  '../app/navigation/useBackNavigation':{useBackDismiss:(_v,_close,priority)=>priorities.push(priority)},'../app/navigation/BackSurface':{__esModule:true,default:'BackSurface'},
  '../ui/Reveal':{__esModule:true,default:'Reveal'},'../gestures/DiagramViewport':{__esModule:true,default:'DiagramViewport'},
  './wbsviews':{Scene:'Scene'},'./DiagramExports':{__esModule:true,default:'DiagramExports'},
 });
 const props={scene,name:'Studio',kind:'tree',nodes:raw,rows,getCSV:()=>'',onClose:()=>closed++},render=()=>h.render(mod.default,props);
 let tree=render();const viewport=()=>nodes(tree).find(n=>n.type==='DiagramViewport');
 assert.equal(viewport().props.scene,scene);assert.equal(viewport().props.fullScreen,true);assert.equal(viewport().props.scale,'fit');assert.ok(priorities.every(p=>p===20),'standard sheet priority preserves latest-layer ordering above parent sheets');
 for(const label of ['Fit diagram to screen','Reset diagram zoom','Zoom out diagram','Zoom in diagram','Close diagram preview'])assert.ok(control(tree,label),label);
 control(tree,'Reset diagram zoom').props.onPress();tree=render();assert.equal(viewport().props.scale,1);control(tree,'Zoom in diagram').props.onPress();tree=render();assert.equal(viewport().props.scale,1.25);
 viewport().props.onPose({scale:2,x:-200,y:-30});viewport().props.onZoom(2);tree=render();control(tree,'Zoom out diagram').props.onPress();tree=render();assert.equal(viewport().props.scale,1.6);
 control(tree,'Fit diagram to screen').props.onPress();tree=render();assert.equal(viewport().props.scale,'fit');
 const body=nodes(tree).find(n=>n.props.onLayout);body.props.onLayout({nativeEvent:{layout:{width:280,height:500}}});tree=render();assert.equal(viewport().props.viewportHeight,500);
 viewport().props.children.props.onSelect('w1');tree=render();const sheet=nodes(tree).find(n=>n.type==='Sheet');assert.equal(sheet.props.visible,true);assert.equal(sheet.props.title,'Design');assert.match(text(sheet),/Owner/);assert.match(text(sheet),/Read the full specification/);
 sheet.props.onClose();tree=render();assert.equal(nodes(tree).some(n=>n.type==='Sheet'),false);control(tree,'Close diagram preview').props.onPress();assert.equal(closed,1);assert.equal(props.scene,scene);
});

function exportHarness({native=false,rasterize=async()=>new Blob(['png']),save=async()=>{},download=async()=>true}={}){
 const h=lifecycleHarness();let csv=0;
 const mocks={react:h.hooks,'react-native':{View:'View',Platform:{OS:native?'android':'web'}},'../ui/ui':{...Object.fromEntries(['Button','IconBtn','Segmented','Sheet','T'].map(n=>[n,n])),downloadText:download},
  '../ui/theme/theme':{useTheme:()=>({c:colors})},'./wbsviews':{Scene:'Scene',sceneToSvg:require('../../src/governance/diagramScene.cjs').sceneToSvg},
  './diagramPng':{needsSvgCapture:native,rasterizeDiagram:rasterize,saveDiagramPng:save}};
 const mod=load('src/governance/DiagramExports.js',mocks,['CaptureSource'],{AbortController});
 const scene=sceneFor('tree',pm.buildTree(fixture(),'Studio'),'down'),props={scene,name:'Studio',kind:'tree',getCSV:()=>{csv++;return 'latest,csv';}};
 return {h,mod,mocks,props,render:()=>h.render(mod.default,props),get csv(){return csv;}};
}
test('export menu serializes only on demand, stays open after success/failure and supports PNG quality/background options',async()=>{
 let ok=false;const downloads=[];const s=exportHarness({download:async(...args)=>{downloads.push(args);return ok;}});
 let tree=s.render();assert.equal(downloads.length,0);assert.equal(s.csv,0);control(tree,'Export work structure').props.onPress();tree=s.render();
 assert.match(text(tree),/complete structure/);assert.equal(nodes(tree).filter(n=>n.type==='Segmented').length,2);
 await control(tree,'SVG').props.onPress();tree=s.render();assert.match(text(tree),/not exported/);assert.equal(downloads[0][2],'image/svg+xml');assert.ok(nodes(tree).some(n=>n.type==='Sheet'));
 ok=true;await control(tree,'CSV').props.onPress();tree=s.render();assert.match(text(tree),/Export prepared/);assert.equal(s.csv,1);assert.equal(downloads.at(-1)[1],'latest,csv');
 nodes(tree).find(n=>n.type==='Segmented'&&n.props.options.some(o=>o.value==='4')).props.onChange('4');tree=s.render();assert.match(text(tree),/px/);
 control(tree,'Done').props.onPress();assert.equal(nodes(s.render()).some(n=>n.type==='Sheet'),false);
});
test('PNG cancellation and duplicate taps never trigger late saving or resurrect dismissed UI',async()=>{
 let finish,rasterCalls=0,saves=0;const s=exportHarness({rasterize:()=>{rasterCalls++;return new Promise(resolve=>{finish=resolve;});},save:async()=>saves++});
 let tree=s.render();control(tree,'Export work structure').props.onPress();tree=s.render();const button=control(tree,'PNG');
 const pending=button.props.onPress();await button.props.onPress();tree=s.render();assert.equal(rasterCalls,1);assert.match(text(tree),/Preparing export/);
 control(tree,'Cancel export').props.onPress();finish(new Blob(['png']));await pending;tree=s.render();assert.equal(saves,0);assert.equal(nodes(tree).some(n=>n.type==='Sheet'),false);s.h.unmount();
});
test('native export mounts its separate bounded source only on demand and captures once after layout, then releases it',async()=>{
 let rasterCalls=0,saves=0;const s=exportHarness({native:true,rasterize:async options=>{rasterCalls++;assert.ok(options.svgRef.current);return 'png';},save:async()=>saves++});
 let tree=s.render();assert.equal(nodes(tree).some(n=>typeof n.type==='function'),false);control(tree,'Export work structure').props.onPress();tree=s.render();
 const pending=control(tree,'PNG').props.onPress();tree=s.render();assert.equal(rasterCalls,0);const source=nodes(tree).find(n=>typeof n.type==='function'&&n.type.name==='CaptureSource');assert.ok(source);
 const child=lifecycleHarness(),m=load('src/governance/DiagramExports.js',{...s.mocks,react:child.hooks},['CaptureSource'],{AbortController});
 const drawing=child.render(m.__test.CaptureSource,source.props),svg=nodes(drawing).find(n=>n.type==='Scene');svg.props.svgRef.current={toDataURL(){}};
 svg.props.onReady();svg.props.onReady();await pending;tree=s.render();assert.equal(rasterCalls,1);assert.equal(saves,1);assert.equal(nodes(tree).some(n=>typeof n.type==='function'&&n.type.name==='CaptureSource'),false);
});
