// /tests/ui/onboarding-flow-063.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {screenHarness,nodes,control,text}=require('../helpers/screen-harness.cjs'),plan=require('../../src/screens/onboarding/onboardingPlan.cjs');
function setup(onFinish=()=>true,extra={}){
 let skipped=0,back;const scrolls=[];
 const h=screenHarness('src/screens/onboarding/Onboarding.js',{}, {platform:'android',...extra,mocks:{
  'react-native':{View:'View',ScrollView:'ScrollView',KeyboardAvoidingView:'KeyboardAvoidingView',Platform:{OS:extra.platform||'android'},useWindowDimensions:()=>({width:390}),BackHandler:{addEventListener:(_name,fn)=>{back=fn;return {remove(){}};}}},
  'react-native-safe-area-context':{useSafeAreaInsets:()=>({top:24,bottom:16})},'./onboardingPlan.cjs':plan,'../../components/illustrations/TourArtwork':{__esModule:true,default:'TourArtwork'},...extra.mocks,
 }});
 const props={onSkip:()=>skipped++,onFinish},render=()=>h.render('default',props);
 const rail=tree=>nodes(tree).find(n=>n.type==='ScrollView'&&n.props.horizontal);
 const choose=()=>{let tree=render();rail(tree).props.ref.current={scrollTo:value=>scrolls.push(value)};rail(tree).props.onMomentumScrollEnd({nativeEvent:{contentOffset:{x:780}}});tree=render();control(tree,'Choose a starter').props.onPress();return render();};
 return {h,props,render,rail,choose,scrolls,back:()=>back(),skipped:()=>skipped};
}
test('tour keeps three slides/four starters, Skip on every step changes no data, and Back restores pager position',()=>{
 let finishes=0;const s=setup(()=>{finishes++;return true;});let tree=s.render();assert.ok(text(tree).includes('Plan on a board'));assert.equal(s.back(),true);assert.equal(s.skipped(),1);
 tree=s.choose();assert.equal(nodes(tree).filter(n=>n.props.accessibilityRole==='radio').length,4);control(tree,'Skip the tour').props.onPress();assert.equal(s.skipped(),2);
 control(tree,'Continue').props.onPress();tree=s.render();control(tree,'Skip the tour').props.onPress();assert.equal(s.skipped(),3);assert.equal(finishes,0);
 s.back();tree=s.render();assert.ok(control(tree,'Continue'));s.back();tree=s.render();assert.ok(control(tree,'Choose a starter'));assert.equal(s.scrolls.at(-1).x,780);assert.equal(s.scrolls.at(-1).animated,false);s.back();tree=s.render();assert.ok(control(tree,'Next'));
});
test('each starter submits the selected ID and trimmed name; invalid names do not submit',async()=>{
 for(const starter of plan.STARTERS){const calls=[],s=setup(value=>{calls.push(value);return true;});let tree=s.choose();
  control(tree,`${starter.label}. ${starter.hint}`).props.onPress();tree=s.render();control(tree,'Continue').props.onPress();tree=s.render();assert.equal(control(tree,'Create project').props.disabled,true);await control(tree,'Create project').props.onPress();assert.equal(calls.length,0);
  nodes(tree).find(n=>n.type==='Input').props.onChangeText(' Garden ');tree=s.render();assert.equal(control(tree,'Create project').props.disabled,false);await control(tree,'Create project').props.onPress();assert.deepEqual(JSON.parse(JSON.stringify(calls)),[{name:'Garden',starterId:starter.id}]);
 }
});
test('rejected/thrown creation retains the draft, prevents duplicate submits and permits retry; success cannot submit twice',async()=>{
 let resolve,calls=0,throwNext=false;const s=setup(()=>{calls++;if(throwNext)throw Error('Save rejected');return new Promise(r=>{resolve=r;});});let tree=s.choose();control(tree,'Continue').props.onPress();tree=s.render();nodes(tree).find(n=>n.type==='Input').props.onChangeText('Garden');tree=s.render();
 const pending=control(tree,'Create project').props.onPress();control(tree,'Create project').props.onPress();tree=s.render();assert.equal(calls,1);assert.equal(control(tree,'Creating…').props.disabled,true);control(tree,'Skip the tour').props.onPress();s.back();assert.equal(s.skipped(),0);resolve(false);await pending;
 tree=s.render();assert.equal(nodes(tree).find(n=>n.type==='Input').props.value,'Garden');assert.ok(nodes(tree).some(n=>n.props.accessibilityRole==='alert'));throwNext=true;await control(tree,'Create project').props.onPress();tree=s.render();assert.ok(text(tree).includes('Save rejected'));
 throwNext=false;const retry=control(tree,'Create project').props.onPress();resolve(true);await retry;tree=s.render();await control(tree,'Create project').props.onPress();assert.equal(calls,3);
});
test('web paging settles once scrolling stops and malformed positions cannot select a nonexistent slide',()=>{
 let serial=0;const timers=new Map(),s=setup(()=>true,{platform:'web',globals:{setTimeout:fn=>{timers.set(++serial,fn);return serial;},clearTimeout:id=>timers.delete(id)}});let tree=s.render();s.rail(tree).props.onMomentumScrollEnd({nativeEvent:{contentOffset:{x:NaN}}});tree=s.render();assert.ok(control(tree,'Next'));
 s.rail(tree).props.onScroll({nativeEvent:{contentOffset:{x:780}}});assert.equal(timers.size,1);[...timers.values()][0]();tree=s.render();assert.ok(control(tree,'Choose a starter'));
});

test('web Escape uses tour Back and Tab stays within the visible tour controls',()=>{
 const listeners=new Map(),doc={activeElement:{isConnected:true,focus(){}} ,addEventListener:(_name,fn)=>listeners.set('key',fn),removeEventListener:()=>listeners.delete('key')};
 const s=setup(()=>true,{platform:'web',globals:{document:doc}}),tree=s.render();
 const make=()=>({disabled:false,getAttribute:()=>null,getClientRects:()=>[{}],focus(){doc.activeElement=this;}}),first=make(),last=make();tree.props.ref.current={querySelectorAll:()=>[first,last],contains:el=>[first,last].includes(el)};
 let prevented=0;doc.activeElement=last;listeners.get('key')({key:'Tab',preventDefault:()=>prevented++});assert.equal(doc.activeElement,first);
 listeners.get('key')({key:'Tab',shiftKey:true,preventDefault:()=>prevented++});assert.equal(doc.activeElement,last);assert.equal(prevented,2);
 listeners.get('key')({key:'Escape',preventDefault(){},stopPropagation(){}});assert.equal(s.skipped(),1);
});


test('a temporarily zero-width viewport never sends negative artwork or card dimensions to native views',()=>{
 const s=setup(()=>true,{mocks:{'react-native':{
  View:'View',ScrollView:'ScrollView',KeyboardAvoidingView:'KeyboardAvoidingView',Platform:{OS:'android'},
  useWindowDimensions:()=>({width:0}),BackHandler:{addEventListener:()=>({remove(){}})},
 }}});
 let tree=s.render();assert.ok(nodes(tree).filter(n=>n.type==='TourArtwork').every(n=>n.props.size>=0));tree=s.choose();assert.ok(nodes(tree).filter(n=>n.type==='Reveal'&&n.props.style?.width!==undefined).every(n=>n.props.style.width>=0));
});
