// /tests/ui/canvas-header.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {screenHarness,nodes,control,text}=require('../helpers/screen-harness.cjs');
test('phone and desktop Canvas title stays centered between equal measured control slots',()=>{
 const h=screenHarness('src/components/shell/Bars.js',{});let back=0;const trailing={type:'Zoom',props:{label:'100%'}},controls={canvas:true,title:'Delivery workshop',onBack:()=>back++,trailing};
 for(const name of ['PhoneHeader','TopBar']){
  const wrapper=h.render(name,{controls}),render=()=>h.render(wrapper.type,wrapper.props);let tree=render();
  const [left,title,right]=tree.props.children;assert.equal(left.props.style.width,right.props.style.width);assert.equal(title.props.style.textAlign,'center');assert.equal(text(tree),'Delivery workshop');assert.equal(right.props.children.props.children,trailing);
  const measure=nodes(right).find(n=>n.props.onLayout);measure.props.onLayout({nativeEvent:{layout:{width:128.2}}});tree=render();assert.equal(tree.props.children[0].props.style.width,129);assert.equal(tree.props.children[2].props.style.width,129);
  control(tree,'Go back').props.onPress();assert.equal(control(tree,'New task'),undefined);
 }
 assert.equal(back,2);
});

test('unified Canvas header owns direct history, Fit and board actions without a floating history panel',()=>{
 const {load}=require('../helpers/diagram-harness.cjs'),{lifecycleHarness}=require('../helpers/lifecycle-harness.cjs'),h=lifecycleHarness(),calls=[];
 const mod=load('src/screens/canvas/CanvasHeader.js',{react:h.hooks,'react-native':{View:'View'},'@expo/vector-icons':{Feather:'Icon'},'../../ui/PressSurface':{__esModule:true,default:'Press'},'../../ui/uiBase':{T:'T'},'../../ui/theme/theme':{useTheme:()=>({c:{ink:'#fff',bg:'#111',line:'#222'}})}},['Action']);
 const tree=h.render(mod.default,{title:'Delivery workshop',zoom:.8,canUndo:false,canRedo:true,onBack:()=>calls.push('back'),onUndo(){},onRedo:()=>calls.push('redo'),onFit:()=>calls.push('fit'),onMore:()=>calls.push('more')}),actions=nodes(tree).filter(n=>n.type===mod.__test.Action);assert.equal(actions.length,5);assert.equal(actions.find(n=>n.props.label==='Undo').props.disabled,true);for(const label of ['Go back','Redo','Fit all Canvas objects, 80% zoom','Canvas board actions'])actions.find(n=>n.props.label===label).props.onPress();assert.deepEqual(calls,['back','redo','fit','more']);assert.equal(tree.props.style.minHeight,56);h.unmount();
});
