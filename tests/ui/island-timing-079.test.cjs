// /tests/ui/island-timing-079.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {load}=require('../helpers/diagram-harness.cjs');
const {lifecycleHarness,fakeClock}=require('../helpers/lifecycle-harness.cjs');
const {nodes,control}=require('../helpers/screen-harness.cjs');
function setup(notice={id:'one',type:'success',text:'Saved'}){
 const h=lifecycleHarness(),clock=fakeClock(),calls=[];let props={notice,onDismiss:()=>calls.push('dismiss'),onAction:a=>calls.push(a),topOffset:38};
 const Component=load('src/components/notice/IslandNotice.js',{react:h.hooks,'react-native':{View:'View',ScrollView:'ScrollView',Pressable:'Pressable'},'@expo/vector-icons':{Feather:'Feather'},'./NoticeMotion':{__esModule:true,default:'NoticeMotion'},'../../ui/uiBase':{T:'T'},'../../ui/theme/theme':{useTheme:()=>({c:{danger:'#ff0000',accentText:'#ffa500'}})}},[],clock).default;
 return {h,clock,calls,render:()=>h.render(Component,props),replace(notice){props={...props,notice};},motion:tree=>nodes(tree).find(n=>n.type==='NoticeMotion')};
}
test('island shows for 3 seconds, shrinks, holds a full 3 seconds after settling, then dismisses after exit',()=>{
 const s=setup();let tree=s.render();assert.equal(tree.props.style.top,38);assert.equal(s.motion(tree).props.state,'expanded');
 s.clock.advance(2999);assert.equal(s.motion(s.render()).props.state,'expanded');s.clock.advance(1);tree=s.render();assert.equal(s.motion(tree).props.state,'compact');
 s.clock.advance(220);s.motion(tree).props.onCompact();s.motion(tree).props.onCompact();assert.equal(s.clock.size,1,'one compact hold timer');s.clock.advance(2999);assert.equal(s.motion(s.render()).props.state,'compact');s.clock.advance(1);assert.equal(s.motion(s.render()).props.state,'hidden');assert.deepEqual(s.calls,[]);s.clock.advance(150);assert.equal(s.render(),null);assert.deepEqual(s.calls,['dismiss']);s.h.unmount();
});
test('replacing a compact notification cancels its timers; stale timers and unmount cannot dismiss the replacement',()=>{
 const s=setup();s.render();s.clock.advance(3000);s.motion(s.render()).props.onCompact();s.clock.advance(1000);s.replace({id:'two',type:'warning',text:'Review'});s.render();assert.equal(s.motion(s.render()).props.state,'expanded');s.clock.advance(2000);assert.deepEqual(s.calls,[]);assert.equal(s.motion(s.render()).props.state,'expanded');s.h.unmount();assert.equal(s.clock.size,0);s.clock.advance(10000);assert.deepEqual(s.calls,[]);
});
test('compact islands reopen on tap, full reading pauses dismissal, sticky messages and Backup controls remain usable',()=>{
 const s=setup({id:'one',type:'error',text:'Details '.repeat(30),action:'backup'});s.render();s.clock.advance(3000);let tree=s.render();control(s.motion(tree).props.compact,'Read notification: Needs attention').props.onPress();tree=s.render();assert.equal(s.motion(tree).props.state,'expanded');
 control(s.motion(tree).props.expanded,'Read full notification').props.onPress();tree=s.render();assert.equal(s.clock.size,0);control(s.motion(tree).props.expanded,'Open Backup').props.onPress();assert.deepEqual(s.calls,['backup']);s.clock.advance(150);assert.deepEqual(s.calls,['backup','dismiss']);
 s.replace({id:'sticky',type:'info',text:'Waiting',sticky:true});s.render();s.clock.advance(20000);assert.equal(s.motion(s.render()).props.state,'expanded');s.h.unmount();
});
