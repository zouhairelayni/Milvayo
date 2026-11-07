// /tests/helpers/diagram-performance.cjs
'use strict';
// Host-only layout/JSX measurements; never a claim about Android FPS or native mounting.
const fs=require('node:fs'),path=require('node:path'),{performance}=require('node:perf_hooks');
const {load}=require('./diagram-harness.cjs');
const pm=load('src/governance/pm.js',{'./data':{labourCosts:()=>[],money:String}});
const mocks={'react-native-svg':{__esModule:true,default:'svg',Path:'path',Rect:'rect',Text:'text'},'../ui/theme/theme':{font:'System',useTheme:()=>({c:{}})}};
const {execFileSync}=require('node:child_process'),babel=require('@babel/core'),vm=require('node:vm');
const oldSource=execFileSync('git',['show','074a734:src/governance/wbsviews.js'],{encoding:'utf8'});
const compiled=babel.transformSync(oldSource,{filename:'wbsviews.js',babelrc:false,configFile:false,plugins:[[require.resolve('@babel/plugin-transform-react-jsx'),{runtime:'automatic'}],require.resolve('@babel/plugin-transform-modules-commonjs')]}).code;
const box={exports:{}};vm.runInThisContext('(function(require,module,exports){'+compiled+'\n})')(id=>mocks[id]||require(id),box,box.exports);const views=box.exports;
const nodes=Array.from({length:500},(_,i)=>({id:'w'+i,parent:i?'w'+Math.floor((i-1)/5):null,name:i?'Work element '+i:'Project',hours:i%9}));
if(process.argv[2]==='trace'){
 const {lifecycleHarness}=require('./lifecycle-harness.cjs'),{nodes:elements}=require('./screen-harness.cjs'),h=lifecycleHarness();
 const counts={tree:0,fishbone:0,mind:0},trace=[];let exports=0;
 const source=execFileSync('git',['show','074a734:src/screens/governance/pm/PmWbs.js'],{encoding:'utf8'});
 const code=babel.transformSync(source,{filename:'PmWbs.js',babelrc:false,configFile:false,plugins:[[require.resolve('@babel/plugin-transform-react-jsx'),{runtime:'automatic'}],require.resolve('@babel/plugin-transform-modules-commonjs')]}).code;
 const imports={react:h.hooks,'react-native':{Pressable:'Pressable',ScrollView:'ScrollView',View:'View'},
  '../../../ui/ui':new Proxy({useWide:()=>false,downloadText:()=>exports++},{get:(o,k)=>o[k]||k}),
  '../../../governance/store':{useStore:()=>({s:{project:{name:'Independent project'},pm:{wbs:nodes}}})},
  '../../../ui/theme/theme':{useTheme:()=>({c:{}})},'../../../governance/pm':pm,
  '../../../governance/wbsviews':{...views,sceneFor:(...args)=>{counts[args[0]]++;return views.sceneFor(...args);}},
  './PmDocs':{DocHeader:'DocHeader'},'./pmui':{Field:'Field',NumInput:'NumInput',OwnerPick:'OwnerPick'},
  '../../../components/inline/MarkdownField':{__esModule:true,default:'MarkdownField'},'../../../gestures/DiagramViewport':{__esModule:true,default:'DiagramViewport'}};
 const moduleBox={exports:{}};vm.runInThisContext('(function(require,module,exports){'+code+'\n})')(id=>imports[id]||require(id),moduleBox,moduleBox.exports);
 let page=h.render(moduleBox.exports.default);trace.push({view:'outline',calculations:{...counts}});
 for(const kind of ['tree','fishbone','tree']){elements(page).find(n=>n.type==='Segmented'&&n.props.options.some(x=>x.value==='outline')).props.onChange(kind);page=h.render(moduleBox.exports.default);trace.push({view:kind,calculations:{...counts}});}
 const result={sourceCheckpoint:'074a734',kind:'Original component executed with deterministic memo hooks; not native React commits',trace,normalRenderFileExports:exports};
 fs.writeFileSync(path.resolve(__dirname,'../../docs/qa/release-0712/baseline-lifecycle.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}else{
const tree=pm.buildTree(nodes,'Independent project');
const median=a=>[...a].sort((a,b)=>a-b)[Math.floor(a.length/2)];
const cases={};
for(const kind of ['tree','fishbone','mind']){
 const times=[],jsx=[];let scene;
 for(let i=0;i<15;i++){let at=performance.now();scene=views.sceneFor(kind,tree,'down');times.push(performance.now()-at);at=performance.now();views.Scene({scene});jsx.push(performance.now()-at);}
 cases[kind]={nodes:nodes.length,primitives:scene.items.length,width:scene.width,height:scene.height,layoutMedianMs:median(times),jsxGenerationMedianMs:median(jsx),layoutCalculations:15,svgGenerations:15,nativeBitmapRgbaBytesAtDensity3:Math.ceil(scene.width)*Math.ceil(scene.height)*9*4};
}
const result={kind:'Node host selected-layout and direct JSX generation microbenchmark, 15 calls/type; no device/render commit measurement',node:process.version,cases};
const out=path.resolve(__dirname,'../../docs/qa/release-0712');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'baseline.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));

}
