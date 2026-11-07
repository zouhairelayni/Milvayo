// /tests/gestures/canvas-worklet-runtime.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const babel=require('@babel/core'),vm=require('node:vm'),path=require('node:path');
// Run Expo's actual native worklet transform, then reconstruct UI-runtime closures.
// The ordinary source harness preserves JS hoisting and cannot catch early captures.
function compiledInteraction(){
 const modules=new Map();
 function compile(filename){if(modules.has(filename))return modules.get(filename).exports;const {code}=babel.transformFileSync(filename,{babelrc:false,configFile:false,presets:['babel-preset-expo'],caller:{name:'metro',platform:'android',supportsStaticESM:false}});const box={exports:{}};modules.set(filename,box);vm.runInNewContext('(function(require,module,exports){'+code+'\n})',{global,Error},{filename:'canvas-worklet-module.cjs'})(id=>id.startsWith('.')?compile(path.resolve(path.dirname(filename),id)):require(id),box,box.exports);return box.exports;}
 const box={exports:compile(path.resolve(__dirname,'../../src/canvas/interaction.cjs'))};
 const cache=new Map();
 function hydrate(fn){
  if(typeof fn!=='function'||!fn.__initData)return fn;
  if(cache.has(fn))return cache.get(fn);
  const native=vm.runInNewContext(fn.__initData.code,{}, {filename:'canvas-ui-worklet.cjs'}),receiver={__closure:[]},bound=native.bind(receiver);cache.set(fn,bound);
  receiver.__closure=(fn.__closure||[]).map((value,index)=>{assert.notEqual(value,undefined,`${fn.name} captured undefined at ${index}`);return hydrate(value);});
  return bound;
 }
 return Object.fromEntries(Object.entries({...box.exports,...modules.get(path.resolve(__dirname,'../../src/canvas/routing.cjs')).exports}).map(([name,fn])=>[name,hydrate(fn)]));
}
test('compiled native connector preview executes captured helpers while drawing, targeting, resizing and cancelling',()=>{
 const ui=compiledInteraction(),a={id:'a',type:'note',x:0,y:0,width:100,height:80},b={id:'b',type:'note',x:300,y:200,width:100,height:80};
 assert.equal(ui.connectionPreview([a,b],null),'');
 for(let step=0;step<100;step++)assert.match(ui.connectionPreview([a,b],{from:'a',x:120+step,y:40+step,target:''}),/^M .* C /);
 assert.equal(ui.connectionPreview([a,b],{from:'a',target:'b'}),ui.connectorPath(a,b));
 assert.match(ui.connectorPath(a,b,{kind:'resize',id:'a',ids:['a'],dx:40,dy:30}),/^M /);
 assert.equal(ui.hitConnect([a,b],['a'],120,40,{scale:1,x:0,y:0}).id,'a');
 assert.equal(ui.hitConnector([{id:'e',from:'a',to:'b',style:'curve'}],[a,b],200,140,{scale:1,x:0,y:0}).id,'e');
 assert.equal(ui.connectionPreview([b],{from:'a',target:'b'}),'');
 const bounds=ui.pathBounds(ui.connectorPath(a,b,null,'curve',[a,b]));assert.equal(ui.routeAffected('a','b',{ids:['far'],kind:'move',boxes:[{x:999,y:999,width:100,height:80}],dx:0,dy:10},bounds),false);
 const blocker={id:'block',x:120,y:120,width:40,height:40};assert.match(ui.connectorPath(a,b,null,'straight',[a,b,blocker]),/^M /);assert.match(ui.connectorPath(a,b,null,'curve',[a,b,blocker]),/^M /);
});
