// /tests/app/first-run-tour.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),babel=require('@babel/core');
const {load}=require('../helpers/diagram-harness.cjs'),plan=require('../../src/screens/onboarding/onboardingPlan.cjs'),keys=require('../../src/store/workspaces.cjs');
const read=file=>fs.readFileSync(path.resolve(__dirname,'../..',file),'utf8');
const app=read('src/app/ModernApp.js');
test('module-load fresh detection is read-only, precedes render, excludes upgrades/recovered workspaces and fails closed',async()=>{
 for(const [index,main,stored,expected]of [[null,null,[],1],['index',null,[],0],[null,'workspace',[],0],[null,null,[keys.KEY_PREFIX+'recovered'],0],[null,null,['milvayo-accent-v1'],1]]){
  let opens=0;const calls=[];const module=load('src/screens/onboarding/freshInstall.js',{'@react-native-async-storage/async-storage':{multiGet:ids=>{calls.push(ids);return Promise.resolve([[keys.INDEX_KEY,index],[keys.MAIN_KEY,main]]);},getAllKeys:()=>Promise.resolve(stored)},'./tourEvents.cjs':{markFreshInstall:()=>opens++}});
  assert.equal(calls.length,1);await module.freshInstallProbe;assert.equal(opens,expected);
 }
 for(const storage of [{multiGet:()=>{throw Error('bridge failed');}},{multiGet:async()=>[],getAllKeys:async()=>[]},{multiGet:async()=>{throw Error('read failed');},getAllKeys:async()=>[]},{multiGet:async()=>{throw Error('late failure');},getAllKeys:()=>{throw Error('bridge failed');}}]){
  let opens=0;await load('src/screens/onboarding/freshInstall.js',{'@react-native-async-storage/async-storage':storage,'./tourEvents.cjs':{markFreshInstall:()=>opens++}}).freshInstallProbe;assert.equal(opens,0);
 }
 assert.match(app,/import '\.\.\/screens\/onboarding\/freshInstall'/);assert.doesNotMatch(read('src/screens/onboarding/freshInstall.js'),/setItem|multiSet|removeItem/);
});
test('fresh eligibility is delivered once after subscribing, manual replay works, and unsubscribed handlers never fire',()=>{
 const events=load('src/screens/onboarding/tourEvents.cjs',{});let opens=0;events.markFreshInstall();const unsubscribe=events.subscribeTour(()=>opens++);assert.equal(opens,1);assert.equal(events.takeFreshInstall(),false);events.requestTour();assert.equal(opens,2);unsubscribe();events.requestTour();assert.equal(opens,2);events.markFreshInstall();assert.equal(events.takeFreshInstall(),true);assert.equal(events.takeFreshInstall(),false);
 assert.match(app,/useState\(false\)/);assert.doesNotMatch(app,/useState\(takeFreshInstall\)/);
});
test('finishing passes one atomic starter configuration to creation, navigates only on acceptance, and keeps the tour on rejection',()=>{
 const ast=babel.parseSync(app,{babelrc:false,configFile:false,parserOpts:{plugins:['jsx']}});let node;babel.traverse(ast,{VariableDeclarator(p){if(p.node.id.name==='finishTour')node=p.node.init.arguments[0];}});
 let accept=false;const calls=[];const finish=vm.runInNewContext('('+app.slice(node.start,node.end)+')',{validName:plan.validName,starterPlan:plan.starterPlan,starterTools:plan.starterTools,createProject:value=>{calls.push(['create',value]);return accept?'new-id':null;},go:(...args)=>calls.push(['go',...args]),setTaskId:value=>calls.push(['task',value]),setTouring:value=>calls.push(['tour',value])});
 assert.equal(finish({name:' ',starterId:'board'}),false);assert.equal(calls.length,0);assert.equal(finish({name:'Garden',starterId:'board'}),false);assert.deepEqual(calls.map(c=>c[0]),['create']);
 accept=true;for(const starter of plan.STARTERS){calls.length=0;assert.equal(finish({name:' Garden ',starterId:starter.id}),true);assert.equal(calls[0][1].name,'Garden');assert.deepEqual(JSON.parse(JSON.stringify(calls[0][1].tools)),plan.starterTools(starter.id));assert.equal(calls.filter(c=>c[0]==='create').length,1);assert.equal(calls.at(-1)[1],starter.screen);}
 assert.doesNotMatch(app.slice(node.start,node.end),/setProjectTool|deleteProject|importProject|restoreWorkspace/);
});
test('More keeps current manager/tools layout and adds replay; active tour hides underlying accessibility and keeps notices in its layer',()=>{
 const more=read('src/screens/more/More.js');assert.match(more,/label="Take the tour"/);for(const item of ['WorkspaceSwitcher onPickProject','label="Manage tools"','placeholder="Find a workspace tool"','label="Appearance"','label="Desktop layout"'])assert.ok(more.includes(item),item);
 assert.match(app,/importantForAccessibility=\{touring\?'no-hide-descendants':'auto'\}/);assert.ok(app.includes('onFinish={finishTour}>{noticeLayer}</Onboarding>'));assert.equal((app.match(/<IslandNotice /g)||[]).length,1);assert.match(app,/onSkip=\{\(\)=>setTouring\(false\)\}/);
});
