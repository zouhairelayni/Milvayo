// /tests/app/cold-start-071.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),babel=require('@babel/core'),parser=require('@babel/parser'),generate=require('@babel/generator').default;
const {lifecycleHarness,fakeClock}=require('../helpers/lifecycle-harness.cjs');
const {nodes}=require('../helpers/screen-harness.cjs');
function setup(){
 const h=lifecycleHarness(),clock=fakeClock(),theme={restored:false,mode:'dark',c:{bg:'#000000',accent:'#FCA311'}};
 const ast=parser.parse(fs.readFileSync('src/app/ModernApp.js','utf8'),{sourceType:'module',plugins:['jsx']});const node=ast.program.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='ColdStartGate');
 const code=babel.transformSync(generate(node).code,{configFile:false,babelrc:false,plugins:[[require.resolve('@babel/plugin-transform-react-jsx'),{runtime:'automatic'}],require.resolve('@babel/plugin-transform-modules-commonjs')]}).code;
 const fn=vm.runInNewContext('(function(){'+code+';return ColdStartGate;})()', {...h.hooks,...clock,require:id=>require(id),useTheme:()=>theme,View:'View',StatusBar:'StatusBar',StoreProvider:'StoreProvider',Shell:'Shell',BoardMorph:'BoardMorph'});
 return {h,clock,theme,render:()=>h.render(fn),logo:tree=>nodes(tree).find(n=>n.type==='BoardMorph'),provider:tree=>nodes(tree).find(n=>n.type==='StoreProvider')};
}
test('cold start hydrates concurrently, starts only after theme restoration, and holds the completed mark exactly one second',()=>{
 const s=setup();let tree=s.render();assert.ok(s.provider(tree));assert.equal(s.provider(tree).props.loading,null);assert.equal(s.logo(tree),undefined);
 s.theme.restored=true;tree=s.render();assert.equal(s.provider(tree).props.children,null,'screen notices do not start behind the cold-start overlay');assert.equal(s.logo(tree).props.solid,true);assert.equal(s.logo(tree).props.active,true);
 s.provider(tree).props.onReady();s.logo(tree).props.onFinish();tree=s.render();assert.equal(s.logo(tree).props.active,false);assert.equal(s.clock.size,1);
 s.clock.advance(999);assert.ok(s.logo(s.render()));s.clock.advance(1);assert.equal(s.logo(s.render()),undefined);
 s.theme.c.accent='#A5D766';s.theme.mode='light';s.render();assert.equal(s.clock.size,0);assert.equal(s.logo(s.render()),undefined,'theme/foreground rerenders do not replay startup');assert.equal(nodes(s.render()).find(n=>n.type==='StatusBar').props.style,'dark');s.h.unmount();
});
test('a slow or failed-safe workspace keeps the final logo until its readiness callback, without replaying the animation',()=>{
 const s=setup();s.theme.restored=true;let tree=s.render();s.logo(tree).props.onFinish();s.render();s.clock.advance(1000);tree=s.render();assert.equal(s.logo(tree).props.active,false);
 s.provider(tree).props.onReady();assert.equal(s.logo(s.render()),undefined);s.h.unmount();
});
test('duplicate completion does not restart the hold; unmount cancels its pending timer',()=>{
 const s=setup();s.theme.restored=true;let tree=s.render();s.logo(tree).props.onFinish();s.render();s.clock.advance(500);s.logo(s.render()).props.onFinish();s.render();assert.equal(s.clock.size,1);s.clock.advance(499);assert.ok(s.logo(s.render()));s.h.unmount();assert.equal(s.clock.size,0);
});
