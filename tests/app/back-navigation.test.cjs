// /tests/app/back-navigation.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createScreenHistory}=require('../../src/app/navigation/screenHistory.cjs');
const {createBackEvents,backEvents}=require('../../src/app/navigation/backEvents.cjs');
const {createBrowserBack}=require('../../src/app/navigation/browserBack.cjs');
const {lifecycleHarness}=require('../helpers/lifecycle-harness.cjs');
const {load}=require('../helpers/diagram-harness.cjs');
function browser(){
 const entries=[null],queue=[],listeners=new Map();let at=0;
 const win={location:{href:'https://milvayo.test/'},addEventListener:(n,f)=>listeners.set(n,f),removeEventListener:n=>listeners.delete(n)};
 win.history={get state(){return entries[at];},replaceState:s=>{entries[at]=s;},pushState:s=>{entries.splice(at+1);entries.push(s);at++;},go:n=>queue.push(()=>{const next=at+n;if(next>=0&&next<entries.length){at=next;listeners.get('popstate')?.({state:entries[at]});}}),back:()=>win.history.go(-1),forward:()=>win.history.go(1)};
 return {win,flush(){let n=0;while(queue.length){assert.ok(++n<50,'browser history cannot loop');queue.shift()();}},get listeners(){return listeners.size;}};
}
function setup(allowed=()=>true){
 const b=browser(),history=createScreenHistory('w/p'),events=createBackEvents(),routes=[];
 const bridge=createBrowserBack(b.win,{history,events,restore:id=>{const entry=history.restore(id,allowed);if(!entry)return false;routes.push(entry.screen);return true;}});
 return {...b,history,events,bridge,routes,visit(screen){bridge.visit(history.push(screen));},back(){b.win.history.back();b.flush();},forward(){b.win.history.forward();b.flush();}};
}
test('screen history bounds memory, skips disabled tools, truncates forward branches and isolates project/workspace scope',()=>{
 const h=createScreenHistory('w/p','overview',4);h.push('board');h.push('board');assert.equal(h.back().screen,'overview');
 h.push('board');h.push('sprints');h.push('settings');assert.equal(h.back(s=>s!=='sprints').screen,'board');
 h.push('tasks');assert.equal(h.restore(4),null,'forward branch discarded');
 const stale=h.current.id;h.reset('other/p','projects');assert.equal(h.restore(stale),null);assert.equal(h.back().screen,'overview');assert.equal(h.back(),null);
 for(let i=0;i<30;i++)h.push('screen'+i);let n=0;while(h.back())n++;assert.equal(n,3);assert.equal(h.current.screen,'overview');
});
test('back dispatcher closes highest priority/latest layer before its root and cleans subscriptions',()=>{
 const e=createBackEvents(),calls=[];const remove=e.add(()=>calls.push('sheet'));const root=e.setRoot(()=>{calls.push('page');return false;});
 const tour=e.add(()=>calls.push('tour'),30);e.dispatch();tour();e.dispatch();remove();assert.equal(e.dispatch(),false);root();assert.deepEqual(calls,['tour','sheet','page']);
});
test('browser Back and Forward restore the actual screen history and disposal removes its listener',()=>{
 const s=setup();s.visit('board');s.visit('timeline');s.back();assert.equal(s.history.current.screen,'board');s.back();assert.equal(s.history.current.screen,'overview');s.forward();assert.equal(s.history.current.screen,'board');s.bridge.stop();assert.equal(s.win.history.state.milvayoNavigation.route,s.history.current.id);
});
test('browser Back dismisses one nested layer per gesture, without navigating the page behind it',()=>{
 const s=setup();s.visit('board');let outer,inner;const calls=[];
 outer=s.events.add(()=>{calls.push('outer');outer();});inner=s.events.add(()=>{calls.push('inner');inner();});
 s.back();assert.deepEqual(calls,['inner']);assert.equal(s.history.current.screen,'board');s.back();assert.deepEqual(calls,['inner','outer']);assert.equal(s.history.current.screen,'board');s.back();assert.equal(s.history.current.screen,'overview');s.bridge.stop();
});
test('a busy modal consumes repeated browser Back; manual close plus page navigation skips closed modal entries',()=>{
 const s=setup();s.visit('board');let calls=0;const remove=s.events.add(()=>calls++);
 s.back();s.back();assert.equal(calls,2);assert.equal(s.history.current.screen,'board');remove();s.flush();
 const remove2=s.events.add(()=>{});s.visit('settings');remove2();s.back();assert.equal(s.history.current.screen,'board');s.back();assert.equal(s.history.current.screen,'overview');s.forward();assert.equal(s.history.current.screen,'board');s.forward();assert.equal(s.history.current.screen,'settings');s.bridge.stop();
});
test('browser entries from a previous project cannot restore that project after scope reset',()=>{
 const s=setup();s.visit('timeline');s.history.reset('new/project','projects');s.bridge.reset();s.back();assert.equal(s.history.current.screen,'overview');assert.equal(s.history.scope,'new/project');s.back();assert.equal(s.history.current.screen,'overview');s.bridge.stop();
});
test('browser Back skips a disabled tool and aligns its history entry with the usable destination',()=>{
 let enabled=true;const s=setup(screen=>enabled||screen!=='sprints');s.visit('board');s.visit('sprints');s.visit('settings');enabled=false;s.back();assert.equal(s.history.current.screen,'board');assert.equal(s.win.history.state.milvayoNavigation.route,s.history.current.id);s.forward();assert.equal(s.history.current.screen,'settings');s.bridge.stop();
});
test('closing a project switcher during scope change does not queue a stale browser pop into the new project',()=>{
 const s=setup();s.visit('board');const remove=s.events.add(()=>{});s.history.reset('new/p','projects');remove();s.bridge.reset();s.flush();assert.equal(s.win.history.state.milvayoNavigation.route,s.history.current.id);s.back();assert.equal(s.history.current.screen,'overview');s.bridge.stop();
});
test('blocked browser History writes degrade safely instead of throwing from a modal effect',()=>{
 const b=browser(),history=createScreenHistory('w/p'),events=createBackEvents();b.win.history.replaceState=()=>{throw Error('History unavailable');};const bridge=createBrowserBack(b.win,{history,events,restore:()=>false});assert.equal(bridge.usable,false);assert.doesNotThrow(()=>{const remove=events.add(()=>{});remove();});bridge.stop();
});
test('Android system Back uses the current screen stack and returns false at Home; hook cleanup removes its listener',()=>{
 const h=lifecycleHarness();let listener,removed=0,screen='overview';const calls=[];
 const hook=load('src/app/navigation/useBackNavigation.js',{react:h.hooks,'react-native':{Platform:{OS:'android'},BackHandler:{addEventListener:(_n,fn)=>{listener=fn;return {remove:()=>removed++};}}}}).useBackNavigation;
 const props=()=>({scope:'w/p',screen,isAvailable:()=>true,go:k=>{screen=k;calls.push(k);}});
 let api=h.render(hook,props());api.visit('board');screen='board';api=h.render(hook,props());api.visit('timeline');screen='timeline';h.render(hook,props());assert.equal(listener(),true);assert.equal(screen,'board');h.render(hook,props());assert.equal(listener(),true);assert.equal(screen,'overview');h.render(hook,props());assert.equal(listener(),false);h.unmount();assert.equal(removed,1);assert.deepEqual(calls,['board','overview']);
});
test('iOS back is edge-only, single-finger and commits on a distance or velocity threshold; canceled/vertical motion is ignored',()=>{
 const h=lifecycleHarness();let gesture,calls=0;const clear=backEvents.setRoot(()=>{calls++;return true;});
 const component=load('src/app/navigation/BackSurface.native.js',{react:h.hooks,'react-native':{View:'View',Platform:{OS:'ios'}},'react-native-gesture-handler':{GestureDetector:'Detector',GestureHandlerRootView:'Root',usePanGesture:cfg=>{gesture=cfg;return cfg;}},'react-native-worklets':{scheduleOnRN:fn=>fn()}}).default;
 h.render(component,{children:'page'});assert.equal(gesture.hitSlop.width,24);assert.equal(gesture.maxPointers,1);
 for(const e of [{translationX:100,translationY:0,canceled:true},{translationX:15,translationY:0,velocityX:900},{translationX:90,translationY:100,velocityX:900}])gesture.onDeactivate(e);
 assert.equal(calls,0);gesture.onDeactivate({translationX:72,translationY:0,velocityX:0});gesture.onDeactivate({translationX:24,translationY:0,velocityX:700});assert.equal(calls,2);clear();h.unmount();
});
