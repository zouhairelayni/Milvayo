// /tests/ui/focused-performance-063.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {screenHarness,nodes,control,text}=require('../helpers/screen-harness.cjs'),{load}=require('../helpers/diagram-harness.cjs');
const model=require('../../src/domain/model.cjs'),bridge=require('../../src/domain/modernBridge.cjs'),dashboard=require('../../src/domain/dashboard.cjs');
test('rejected bulk status edits preserve task selection for retry; accepted edits clear it',()=>{
 const workspace=model.createWorkspace(),s=bridge.projectView(workspace),calls=[];let accept=false;
 const h=screenHarness('src/screens/tasks/Tasks.js',{workspace,s,bulkStatus:(ids,status)=>{calls.push({ids:[...ids],status});return accept;}}),props={openTask(){},onNewTask(){}};
 let tree=h.render('default',props);const row=nodes(tree).find(n=>n.props.onLongPress&&n.props.accessibilityHint==='Long press to select for bulk actions');row.props.onLongPress();tree=h.render('default',props);assert.match(text(tree),/1\s+selected/);
 control(tree,'Mark Done').props.onPress();tree=h.render('default',props);assert.match(text(tree),/1\s+selected/);assert.ok(control(tree,'Mark Done'));assert.equal(calls.length,1);
 accept=true;control(tree,'Mark Done').props.onPress();tree=h.render('default',props);assert.equal(control(tree,'Mark Done'),undefined);assert.deepEqual(calls[0],calls[1]);
});
test('date rail reuses adjacent pages through day-selection and callback changes, rebuilding only for actual page data/capability',()=>{
 let cursor=0,calls=0;const slots=[],hook=init=>{const i=cursor++;if(!(i in slots))slots[i]=typeof init==='function'?init():init;return slots[i];};
 const react={useState:init=>[hook(init),()=>{}],useRef:init=>hook(()=>({current:init})),useEffect(){},useLayoutEffect(){},useMemo(fn,deps){const cached=hook(()=>({deps:null}));if(!cached.deps||deps.some((v,i)=>v!==cached.deps[i])){cached.deps=deps;cached.value=fn();}return cached.value;}};
 const module=load('src/ui/DateRail.js',{react,'react-native':{View:'View',ScrollView:'ScrollView',Platform:{OS:'android'},useWindowDimensions:()=>({width:390})},'./uiBase':{T:'T'},'./PressSurface':{__esModule:true,default:'PressSurface'},'./theme/theme':{useTheme:()=>({c:{}})},'../domain/dashboard.cjs':{scheduleSeries:(...args)=>{calls++;return dashboard.scheduleSeries(...args);}}});
 const tasks=[],days=dashboard.scheduleSeries(tasks,'2026-11-05'),render=props=>{cursor=0;return module.default(props);};let props={tasks,days,onChange(){},onShift(){}};
 render(props);assert.equal(calls,2);render({...props,value:'2026-11-06',onShift(){}});assert.equal(calls,2);
 render({...props,tasks:[{id:'x',due:'2026-11-06'}]});assert.equal(calls,4);render({...props,onShift:undefined});assert.equal(calls,4);render(props);assert.equal(calls,6);
});
test('native reveal cancels pending work on unmount while retaining the existing duration and reduced-motion configuration',()=>{
 const effects=[],cancelled=[],config=[];const progress={get:()=>1,set(){}};
 const module=load('src/ui/Reveal.native.js',{react:{useEffect:fn=>effects.push(fn())},'react-native-reanimated':{__esModule:true,default:{View:'AnimatedView'},useSharedValue:()=>progress,useAnimatedStyle:fn=>fn(),withDelay:(_delay,value)=>value,withTiming:(value,options)=>{config.push(options);return value;},cancelAnimation:value=>cancelled.push(value),Easing:{bezier:()=> 'existing ease'},ReduceMotion:{System:'system'}}});
 const child={id:'kept'},tree=module.default({children:child,delay:80});assert.equal(tree.props.children,child);assert.equal(config[0].duration,190);assert.equal(config[0].reduceMotion,'system');effects[0]();assert.deepEqual(cancelled,[progress]);
});
