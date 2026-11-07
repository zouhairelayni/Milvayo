// /tests/app/screen-readiness.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {screenReadiness}=require('../../src/app/navigation/screenReadiness.cjs');
test('first snapshots wait only while unavailable; empty, cached, refreshing and offline data remain usable',()=>{
 for(const status of ['uninitialized','hydrating','loading'])assert.equal(screenReadiness({status}).view,'skeleton');
 for(const status of ['ready','empty','refreshing'])assert.equal(screenReadiness({status}).view,'content');
 for(const status of ['loading','hydrating','refreshing','error'])assert.equal(screenReadiness({status,hasData:true,offline:true,error:'retry'}).view,'content');
 assert.equal(screenReadiness({preparing:true}).view,'skeleton');
 assert.equal(screenReadiness({status:'error'}).view,'error');assert.equal(screenReadiness({offline:true,status:'loading'}).view,'offline');
 assert.equal(screenReadiness({status:'loading',error:'failed'}).view,'error');
 assert.equal(screenReadiness({status:'loading',hasData:true}).refreshing,true);
});
test('delayed hydration resolves immediately or fails explicitly with no elapsed-time gate',async()=>{
 for(const outcome of ['ready','empty','error']){
  let resolve;const pending=new Promise(r=>{resolve=r;});assert.equal(screenReadiness({status:'hydrating'}).view,'skeleton');
  resolve(outcome);assert.equal(screenReadiness({status:await pending}).view,outcome==='error'?'error':'content');
 }
});
test('retained page mounts without frame timers, reuses content identity and never replays its skeleton',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),babel=require('@babel/core');
 const {lifecycleHarness}=require('../helpers/lifecycle-harness.cjs');const h=lifecycleHarness();
 const text=fs.readFileSync(require.resolve('../../src/app/ModernApp.js'),'utf8');
 const fragment=text.slice(text.indexOf('const CachedPage ='),text.indexOf('\nfunction Shell'));
 const code=babel.transformSync(fragment+'\nglobalThis.CachedPage=CachedPage;',{babelrc:false,configFile:false,plugins:[[require.resolve('@babel/plugin-transform-react-jsx'),{runtime:'automatic'}],require.resolve('@babel/plugin-transform-modules-commonjs')]}).code;
 let schedules=0;const context={...h.hooks,require,memo:fn=>fn,startTransition:fn=>{schedules++;fn();},Platform:{OS:'android'},DEFERRED_NATIVE_TABS:['board'],SCREENS:{board:'Board'},screenReadiness,Profiler:'Profiler',ScreenPresence:'Presence',ScreenSkeleton:'Skeleton',StoreFreeze:'Freeze',ScreenErrorBoundary:'Boundary',diagnosticMonitor:{recordAction(){}},shouldRenderPage:()=>true};vm.runInNewContext(code,context);
 const render=active=>h.render(context.CachedPage,{pageId:'board',active});
 let tree=render(true),content=t=>t.props.children.props.children.props.children;
 assert.equal(content(tree).type,'Skeleton');tree=render(true);assert.equal(content(tree).type,'Profiler');const ready=content(tree);
 tree=render(false);assert.equal(content(tree),ready);tree=render(true);assert.equal(content(tree),ready);assert.equal(schedules,1);
 assert.equal(/requestAnimationFrame|setTimeout/.test(fragment),false);
});
