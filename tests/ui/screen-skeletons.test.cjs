// /tests/ui/screen-skeletons.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),React=require('react');
const {load}=require('../helpers/diagram-harness.cjs');
const {nodes}=require('../helpers/screen-harness.cjs');
function render(screen,width=390,native=true){
 const c={line:'#303030',surface:'#202020'};
 const mod=load('src/components/loading/ScreenSkeleton.js',{'react-native':{View:'View',Platform:{OS:native?'android':'web'},useWindowDimensions:()=>({width})},'../../ui/uiBase':{T:'T'},'../../ui/theme/theme':{useTheme:()=>({c})},'./SkeletonMotionSurface':{__esModule:true,default:'Motion'}},[],{});
 const expand=element=>{if(!React.isValidElement(element))return element;if(typeof element.type==='function')return expand(element.type(element.props));return React.cloneElement(element,{},React.Children.map(element.props.children,expand));};
 return expand(mod.default({screen,active:false}));
}
test('four skeleton compositions have bounded, distinct geometry with inert shapes and native-safe loading semantics',()=>{
 const counts=[];
 for(const screen of ['board','timeline','tasks','sprints']){
  const tree=render(screen),all=nodes(tree);counts.push(JSON.stringify(all.map(n=>n.props.style)));assert.equal(tree.props.accessibilityState.busy,true);
  const motion=all.find(n=>n.type==='Motion');assert.equal(motion.props.active,false);
  assert.ok(all.length<160);assert.equal(all.some(n=>n.props.onPress||n.props.accessibilityRole==='status'),false);
  assert.equal(all.find(n=>n.type==='T').props.accessibilityLiveRegion,'polite');
 }
 assert.equal(new Set(counts).size,4);
 assert.equal(nodes(render('tasks',1440,false)).find(n=>n.type==='T').props.role,'status');
 const mobile=nodes(render('board')),desktop=nodes(render('board',1440));
 assert.ok(mobile.some(n=>Array.isArray(n.props.style)&&n.props.style.some(s=>s?.width===280)));
 assert.ok(desktop.some(n=>Array.isArray(n.props.style)&&n.props.style.some(s=>s?.width===320)));
});
test('native loading motion respects dynamic reduced motion, stops on hidden state and removes subscriptions',async()=>{
 const {lifecycleHarness}=require('../helpers/lifecycle-harness.cjs');const h=lifecycleHarness();let listener,removed=0,cancelled=0,repeats=0;
 const shared={value:1,get(){return this.value;},set(v){this.value=v;}};
 const mod=load('src/components/loading/SkeletonMotionSurface.native.js',{
  react:h.hooks,'react-native':{AccessibilityInfo:{isReduceMotionEnabled:async()=>false,addEventListener:(_name,fn)=>{listener=fn;return {remove(){removed++;}};}}},
  'react-native-reanimated':{__esModule:true,default:{View:'AnimatedView'},cancelAnimation(){cancelled++;},Easing:{inOut:x=>x,quad:x=>x},useSharedValue:()=>shared,useAnimatedStyle:fn=>fn(),withTiming:()=>.58,withRepeat:()=>{repeats++;return .58;}},
 });
 const props={active:true,children:'shapes'};let tree=h.render(mod.default,props);assert.equal(repeats,0);await Promise.resolve();h.render(mod.default,props);assert.equal(repeats,1);
 listener(true);tree=h.render(mod.default,props);assert.equal(shared.value,1);assert.equal(tree.props.importantForAccessibility,'no-hide-descendants');
 listener(false);h.render(mod.default,props);h.render(mod.default,{...props,active:false});assert.equal(shared.value,1);h.unmount();assert.equal(removed,1);assert.ok(cancelled>=4);
});
