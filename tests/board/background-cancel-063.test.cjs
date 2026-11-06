// /tests/board/background-cancel-063.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{load}=require('../helpers/diagram-harness.cjs');
function harness(title=false){
 let cursor=0,time=1000,id=0,measure;const slots=[],effects=[],timeouts=new Map(),intervals=new Map(),listeners=new Set(),calls=[];
 const state=initial=>{const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],next=>{slots[i]=next;}];};
 const ref=initial=>state({current:initial})[0];
 const react={useRef:ref,useState:state,useEffect(fn){const entry=ref(null);if(!entry.current){entry.current=true;effects.push(fn);}}};
 const appState={currentState:'active',addEventListener:(_name,fn)=>{listeners.add(fn);return {remove:()=>listeners.delete(fn)};}};
 const module=load('src/board/boardGesture.native.js',{react,'react-native':{AppState:appState,PanResponder:{create:panHandlers=>({panHandlers})}},'react-native-reanimated':{useSharedValue:value=>ref({value}).current}},[],{
  Date:class extends Date{static now(){return time;}},setTimeout:(fn,ms)=>{timeouts.set(++id,{fn,at:time+ms});return id;},clearTimeout:key=>timeouts.delete(key),setInterval:fn=>{intervals.set(++id,fn);return id;},clearInterval:key=>intervals.delete(key),
 });
 const props={getScroll:()=>({x:0,y:0}),onLift:()=>calls.push('lift'),onMove:()=>calls.push('move'),onDrop:()=>calls.push('drop'),onCancel:()=>calls.push('cancel'),onTap:()=>calls.push('tap'),onTitleDoubleTap:()=>calls.push('rename'),...(title?{titleRef:{current:{measure:fn=>{measure=fn;}}}}:{})};
 const cleanups=[];const render=()=>{cursor=0;const value=module.useHoldDrag(props);effects.splice(0).forEach(fn=>cleanups.push(fn()));return value;};
 return {render,calls,timeouts,intervals,background(){appState.currentState='background';listeners.forEach(fn=>fn('background'));},resume(){appState.currentState='active';listeners.forEach(fn=>fn('active'));},advance(ms){time+=ms;for(const [key,timer]of [...timeouts])if(timer.at<=time){timeouts.delete(key);timer.fn();}},measure:()=>measure?.(0,0,100,100,0,0),dispose(){cleanups.forEach(fn=>fn?.());},listeners};
}
const touch={nativeEvent:{pageX:12,pageY:15}};
test('background cancels pending Board hold and stale releases cannot open a task after resume',()=>{
 const h=harness();let gesture=h.render();gesture.panHandlers.onTouchStart(touch);h.background();h.advance(1000);h.resume();gesture.panHandlers.onTouchEnd();gesture.panHandlers.onPanResponderRelease();assert.deepEqual(h.calls,[]);assert.equal(h.timeouts.size,0);assert.equal(h.intervals.size,0);
 gesture=h.render();gesture.panHandlers.onTouchStart(touch);gesture.panHandlers.onTouchEnd();assert.deepEqual(h.calls,['tap']);
});
test('background cancels a lifted list/card once, resets offset and unlocks through onCancel without committing a drop',()=>{
 const h=harness();let gesture=h.render();gesture.panHandlers.onTouchStart(touch);h.advance(350);gesture=h.render();assert.equal(gesture.lifted,true);assert.equal(h.intervals.size,1);
 h.background();h.background();h.resume();gesture.panHandlers.onPanResponderRelease();gesture.panHandlers.onTouchEnd();gesture=h.render();assert.equal(gesture.lifted,false);assert.equal(h.calls.filter(x=>x==='cancel').length,1);assert.equal(h.calls.includes('drop'),false);assert.equal(h.calls.includes('tap'),false);assert.equal(h.intervals.size,0);assert.equal(gesture.offset.x.value,0);assert.equal(gesture.offset.y.value,0);
 gesture.panHandlers.onTouchStart(touch);h.advance(350);gesture.panHandlers.onTouchEnd();assert.equal(h.calls.filter(x=>x==='drop').length,1);
});
test('background invalidates delayed title measurements and task-open timers; unmount removes lifecycle listener',()=>{
 for(const measured of [true,false]){const h=harness(true),gesture=h.render();gesture.panHandlers.onTouchStart(touch);gesture.panHandlers.onTouchEnd();if(measured)h.measure();h.background();if(!measured)h.measure();h.advance(1000);h.resume();assert.deepEqual(h.calls,[]);assert.equal(h.timeouts.size,0);h.dispose();assert.equal(h.listeners.size,0);}
});
