// /tests/app/cold-start-071.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),babel=require('@babel/core'),parser=require('@babel/parser'),generate=require('@babel/generator').default;
const {lifecycleHarness,fakeClock}=require('../helpers/lifecycle-harness.cjs');
const {nodes}=require('../helpers/screen-harness.cjs');
function setup(){
 const h=lifecycleHarness(),clock=fakeClock(),frames=new Map(),marks=[];let serial=0;const theme={restored:false,mode:'dark',c:{bg:'#000000',accent:'#FCA311'}};
 const ast=parser.parse(fs.readFileSync('src/app/ModernApp.js','utf8'),{sourceType:'module',plugins:['jsx']});const node=ast.program.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='ColdStartGate');
 const code=babel.transformSync(generate(node).code,{configFile:false,babelrc:false,plugins:[[require.resolve('@babel/plugin-transform-react-jsx'),{runtime:'automatic'}],require.resolve('@babel/plugin-transform-modules-commonjs')]}).code;
 const fn=vm.runInNewContext('(function(){'+code+';return ColdStartGate;})()', {...h.hooks,...clock,require:id=>require(id),requestAnimationFrame:fn=>{frames.set(++serial,fn);return serial;},cancelAnimationFrame:id=>frames.delete(id),diagnosticMonitor:{now:()=>0,recordStartup:name=>marks.push(name)},useTheme:()=>theme,View:'View',StatusBar:'StatusBar',StoreProvider:'StoreProvider',Shell:'Shell',BoardMorph:'BoardMorph'});
 return {h,clock,theme,frames,marks,frame(){const batch=[...frames.values()];frames.clear();batch.forEach(fn=>fn());},render:()=>h.render(fn),logo:tree=>nodes(tree).find(n=>n.type==='BoardMorph'),provider:tree=>nodes(tree).find(n=>n.type==='StoreProvider')};
}
test('cold start prepares the shell during playback and reveals immediately when both animation and workspace are ready',()=>{
 const s=setup();let tree=s.render();assert.ok(s.provider(tree));assert.equal(s.provider(tree).props.loading,null);assert.equal(s.logo(tree),undefined);
 s.theme.restored=true;tree=s.render();assert.equal(s.provider(tree).props.children.props.launching,true);assert.equal(s.logo(tree).props.solid,true);assert.equal(s.logo(tree).props.duration,1100);assert.equal(s.logo(tree).props.continuous,true);
 s.provider(tree).props.onReady();s.logo(tree).props.onStart();s.logo(tree).props.onFinish({frames:68,elapsed:1100,maxGap:17});tree=s.render();assert.equal(s.logo(tree),undefined);assert.equal(s.provider(tree).props.children.props.launching,false);assert.equal(s.clock.size,0,'no artificial one-second hold');
 s.frame();s.frame();assert.ok(s.marks.includes('first interactive frame (JS estimate)'));
 s.theme.c.accent='#A5D766';s.theme.mode='light';assert.equal(s.logo(s.render()),undefined);assert.equal(nodes(s.render()).find(n=>n.type==='StatusBar').props.style,'dark');s.h.unmount();
});
test('a slow or failed-safe workspace retains the completed logo until storage reports readiness, without replay',()=>{
 const s=setup();s.theme.restored=true;let tree=s.render();s.logo(tree).props.onFinish();tree=s.render();assert.equal(s.logo(tree).props.active,false);assert.equal(s.clock.size,0);
 s.provider(tree).props.onReady();assert.equal(s.logo(s.render()),undefined);s.h.unmount();
});
test('duplicate completion does not schedule a hold or replay; unmount cancels first-frame estimates',()=>{
 const s=setup();s.theme.restored=true;let tree=s.render();s.provider(tree).props.onReady();s.logo(tree).props.onFinish();s.render();assert.equal(s.frames.size,1);
 s.logo(tree).props.onFinish();s.render();assert.equal(s.frames.size,1);assert.equal(s.clock.size,0);s.h.unmount();assert.equal(s.frames.size,0);
});
