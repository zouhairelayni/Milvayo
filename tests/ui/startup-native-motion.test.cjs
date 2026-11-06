// /tests/ui/startup-native-motion.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {load}=require('../helpers/diagram-harness.cjs');
const {lifecycleHarness}=require('../helpers/lifecycle-harness.cjs');
const {nodes}=require('../helpers/screen-harness.cjs');
const {ribbonPath}=require('../../src/components/brand/morphMotion.cjs');
function setup(reduced=false){
 const h=lifecycleHarness(),queue=[];let callback,starts=0,ends=[];
 const animation={active:false,setActive(value){this.active=value;}};
 const useSharedValue=initial=>h.hooks.useRef({value:initial,get(){return this.value;},set(value){this.value=value;}}).current;
 const component=load('src/components/brand/BoardMorph.native.js',{
  react:h.hooks,'react-native':{View:'View'},'react-native-svg':{__esModule:true,default:'Svg',Defs:'Defs',G:'G',LinearGradient:'LinearGradient',Path:'Path',Stop:'Stop'},
  'react-native-reanimated':{__esModule:true,default:{createAnimatedComponent:c=>c},useSharedValue,useReducedMotion:()=>reduced,useAnimatedProps:fn=>fn(),useFrameCallback(fn){callback=fn;return animation;}},
  'react-native-worklets':{scheduleOnRN:(fn,...args)=>queue.push(()=>fn(...args))},
  '../../ui/theme/theme':{useTheme:()=>({accentPref:'Coral',c:{accent:'#E98B7E'}})},
 }).default;
 const props={active:true,solid:true,duration:1100,continuous:true,onStart:()=>starts++,onFinish:result=>ends.push(result)};
 return {h,props,animation,queue,render:()=>h.render(component,props),frame(stamp,gap=16){if(animation.active)callback({timestamp:stamp,timeSincePreviousFrame:gap});},drain(){queue.splice(0).forEach(fn=>fn());},get starts(){return starts;},get ends(){return ends;}};
}
test('native logo waits for layout and advances continuously on UI frames while JS callbacks are queued',()=>{
 const s=setup();let tree=s.render();assert.equal(s.animation.active,false);
 tree.props.onLayout();tree=s.render();assert.equal(s.animation.active,true);
 const progress=nodes(tree).find(n=>n.props.progress)?.props.progress;assert.ok(progress);
 s.frame(1000,0);assert.equal(progress.get(),0);
 s.frame(1250,250);const early=progress.get();assert.ok(early>0&&early<1);const a=ribbonPath(0,early,true);
 s.render();s.frame(1550,300);assert.ok(progress.get()>early);assert.notEqual(ribbonPath(0,progress.get(),true),a);
 assert.equal(s.starts,0,'UI playback does not await the busy JS queue');
 s.frame(2100,550);assert.equal(progress.get(),1);assert.equal(s.queue.length,1,'final native geometry is not unmounted in the same frame');s.frame(2200,100);assert.equal(s.queue.length,2,'only start and finish cross to JS');
 s.drain();assert.equal(s.starts,1);assert.equal(s.ends.length,1);assert.equal(s.ends[0].elapsed,1100);assert.equal(s.ends[0].frames,4);assert.equal(s.ends[0].maxGap,550);assert.equal(s.animation.active,false);s.h.unmount();
});
test('reduced motion presents the final Board on the first native frame and reveals after that frame without a timed hold',()=>{
 const s=setup(true);s.render().props.onLayout();s.render();s.frame(1000,0);s.frame(1016,16);s.drain();assert.equal(s.ends.length,1);assert.equal(s.ends[0].elapsed,0);assert.equal(s.ends[0].frames,1);s.h.unmount();
});
test('unmount and inactive transitions cancel playback and reject queued completion from an old epoch',()=>{
 for(const unmount of [true,false]){
  const s=setup();s.render().props.onLayout();s.render();s.frame(1000,0);s.frame(2100,1100);s.frame(2116,16);
  if(unmount)s.h.unmount();else{s.props.active=false;s.render();}
  s.drain();assert.equal(s.ends.length,0);assert.equal(s.animation.active,false);if(!unmount)s.h.unmount();
 }
});

test('cold choreography moves every ribbon early and retains the exact original N and Board endpoints',()=>{
 for(let i=0;i<3;i++){
  assert.equal(ribbonPath(i,0,true),ribbonPath(i,0));assert.equal(ribbonPath(i,1,true),ribbonPath(i,1));
  assert.notEqual(ribbonPath(i,.12,true),ribbonPath(i,0,true));
  assert.notEqual(ribbonPath(i,.30,true),ribbonPath(i,.50,true));
 }
});
