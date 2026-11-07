// /tests/ui/canvas-pill.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{load}=require('../helpers/diagram-harness.cjs'),{lifecycleHarness,fakeClock}=require('../helpers/lifecycle-harness.cjs'),{nodes}=require('../helpers/screen-harness.cjs');
test('pill idles after interaction, wakes on touch/focus and cancels its timer on close or unmount',()=>{
 const h=lifecycleHarness(),clock=fakeClock(),mod=load('src/screens/canvas/CanvasPill.js',{react:h.hooks,'react-native':{View:'View',useWindowDimensions:()=>({fontScale:1})},'@expo/vector-icons':{Feather:'Feather'},'../../ui/uiBase':{T:'T'},'../../ui/PressSurface':{__esModule:true,default:'Press'},'../../ui/theme/theme':{useTheme:()=>({c:{}})},'./CanvasPillMotion':{__esModule:true,default:'Motion'}},[],clock);
 let props={open:false,width:320},render=()=>h.render(mod.default,props),tree=render(),motion=()=>nodes(tree).find(n=>n.type==='Motion');assert.equal(motion().props.active,false);assert.equal(nodes(tree).filter(n=>n.type==='Press').length,1);
 props={...props,open:true};render();tree=render();assert.equal(motion().props.active,true);assert.equal(nodes(tree).filter(n=>n.type==='Press').length,5);clock.advance(1800);tree=render();assert.equal(motion().props.active,false);tree.props.onTouchStart();tree=render();assert.equal(motion().props.active,true);props={...props,open:false};render();tree=render();assert.equal(motion().props.active,false);assert.equal(clock.size,0);tree.props.onFocus();assert.equal(clock.size,1);h.unmount();assert.equal(clock.size,0);
});
