// /tests/helpers/release-0712-review.cjs
'use strict';
// Static real JSX and an isolated real-browser PNG adapter fixture, without Metro or app automation.
const fs=require('node:fs'),vm=require('node:vm');
let source=fs.readFileSync(require.resolve('./render-redesign-review.cjs'),'utf8');
source=source.replace('docs/qa/redesign-063/source-review','docs/qa/release-0712/source-review');
source=source.replace("let width=390,mode='dark';", "let width=390,mode='dark',reviewHeight=844,exportReview=false,exportHook=0;");
source=source.replaceAll('height:844','height:reviewHeight');
source=source.replace("if(id==='react'||id==='react/jsx-runtime')return require(id);", "if(id==='react')return file.endsWith('/DiagramExports.js')?{...React,useState:initial=>React.useState(exportReview&&exportHook++===0?true:initial)}:React; if(id==='react/jsx-runtime')return require(id);");
source=source.replace("if(id==='react-native')return {...RN,", "if(id==='react-native-gesture-handler')return {GestureHandlerRootView:RN.View}; if(id==='react-native')return {...RN,Modal:({visible,children})=>visible?React.createElement(RN.View,{style:{flex:1}},children):null,");
source=source.replace("if(cache.has(file))return cache.get(file).exports;", `if(file.endsWith('/gestures/DiagramViewport.js'))return {__esModule:true,default:({scene,scale,fullScreen,viewportHeight,children})=>{
 const h=viewportHeight||Math.min(440,scene.height),available=fullScreen?width:width-60,factor=scale==='fit'?Math.min(1.6,(available-4)/scene.width,h/scene.height):scale;
 return React.createElement(RN.View,{style:{width:'100%',height:h,overflow:'hidden'}},React.createElement(RN.View,{style:{position:'absolute',left:fullScreen?Math.max(0,(width-scene.width*factor)/2):0,top:fullScreen?Math.max(0,(h-scene.height*factor)/2):0,width:scene.width,height:scene.height,transformOrigin:'top left',transform:[{scale:factor}]}},children));
 }}; if(cache.has(file))return cache.get(file).exports;`);
source=source.replace('diagnosticMonitor:{recordAction:noop,recordRender:noop}', 'diagnosticMonitor:{recordAction:noop,recordRender:noop,measureWork:(_name,fn)=>fn()}');
source=source.slice(0,source.indexOf("capture('overview-mobile'"));
source+=`
const pm=read('src/governance/pm.js'),geometry=require('../../src/governance/diagramScene.cjs');
const work=[{id:'w0',parent:null,name:'',hours:0},
 {id:'w1',parent:'w0',name:'Product foundation',hours:0},{id:'w2',parent:'w0',name:'Mobile delivery',hours:0},
 {id:'w3',parent:'w0',name:'Release readiness',hours:0},
 {id:'w4',parent:'w1',name:'Confirm scope',hours:8},{id:'w5',parent:'w1',name:'Map dependencies',hours:12},
 {id:'w6',parent:'w2',name:'Refine interactions',hours:16},{id:'w7',parent:'w2',name:'Verify Android gestures',hours:12},
 {id:'w8',parent:'w3',name:'Review evidence',hours:8},{id:'w9',parent:'w3',name:'Approve release',hours:4}];
project.governance.wbs=work;
const tree=pm.buildTree(work,'Milvayo delivery'),rows=pm.flattenTree(tree),Preview=read('src/governance/DiagramPreview.js').default,Exports=read('src/governance/DiagramExports.js').default;
const colors=tokens.palette('Coral','dark'),browserCases=[];
for(const kind of ['tree','fishbone','mind']){
 const scene=geometry.sceneFor(kind,tree,'down');
 for(const w of [320,390,1440]){
  reviewHeight=w===1440?900:844;
  capture('preview-'+kind+'-'+w,()=>e(RN.View,{style:{height:reviewHeight,width:w,backgroundColor:colors.bg}},e(Preview,{scene,name:'Milvayo delivery',kind,nodes:work,rows,getCSV:()=>pm.wbsCSV(tree),onClose:noop})),{},w,reviewHeight,false);
 }
 browserCases.push({kind,scene,svg:geometry.sceneToSvg(scene,colors),transparentSvg:geometry.sceneToSvg(scene,colors,{transparent:true})});
}
reviewHeight=844;exportReview=true;exportHook=0;
capture('exports-390',()=>e(RN.View,{style:{height:844,backgroundColor:colors.bg}},e(Exports,{scene:browserCases[0].scene,name:'Milvayo delivery',kind:'tree',getCSV:()=>pm.wbsCSV(tree)})),{},390,844,false);
exportReview=false;
const cacheTools=require('../../src/governance/diagramCache.cjs');cacheTools.diagramView(JSON.stringify(['local',project.id])).view='tree';
capture('embedded-tree-390',()=>e(RN.View,{style:{padding:16,height:844,backgroundColor:colors.bg}},e(read('src/screens/governance/pm/PmWbs.js').default)),{},390,844,false);
manifest.forEach(m=>{m.note='Static JSX with inert effects/handlers; modal content projected in place and viewport given a static fit transform; not live Expo or native acceptance.';});
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
let pngSource=fs.readFileSync(path.join(root,'src/governance/diagramPng.js'),'utf8').replace(/^import .*;$/mg,'').replace(/export /g,'');
const safeJSON=value=>JSON.stringify(value).replace(/</g,'\\u003c');
fs.writeFileSync(path.join(out,'png-browser-test.html'),'<!doctype html><meta charset="utf-8"><pre id="result">Pending</pre><script>const cases='+safeJSON(browserCases)+', colors='+safeJSON(colors)+';let current;const sceneToSvg=(_s,_c,o)=>o.transparent?current.transparentSvg:current.svg;'+pngSource+';const pngPlan='+require('../../src/governance/diagramExport.cjs').pngPlan.toString()+';(async()=>{const results=[];for(const item of cases){for(const [quality,transparent] of [[2,false],[4,true]]){current=item;const plan=pngPlan(item.scene,quality);const blob=await rasterizeDiagram({scene:item.scene,colors,plan,transparent});const data=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(blob);});results.push({kind:item.kind,quality,transparent,plan,bytes:blob.size,data});}}document.getElementById("result").textContent=JSON.stringify(results);document.body.dataset.complete="true";})().catch(e=>{document.getElementById("result").textContent=e.stack;document.body.dataset.failed="true";});<'+ '/script>');
console.log('Rendered',manifest.length,'static source fixtures and PNG browser harness');
`;
vm.runInThisContext('(function(require,module,exports,__dirname){'+source+'\n})',{filename:__filename})(require,module,module.exports,__dirname);

// A CLI capture ends navigation before a long chain of async image decodes necessarily settles.
// Select one export per lightweight browser invocation; start after initial document layout.
const pngFixture=require('node:path').resolve(__dirname,'../../docs/qa/release-0712/source-review/png-browser-test.html');
let driver=fs.readFileSync(pngFixture,'utf8');
driver=driver.replace(';(async()=>{const results=[];', ';setTimeout(()=>{(async()=>{const results=[];');
driver=driver.replace('for(const item of cases){for(const [quality,transparent] of [[2,false],[4,true]]){', 'for(const item of cases.filter(item=>item.kind===new URLSearchParams(location.search).get("kind"))){for(const [quality,transparent] of [[2,false],[4,true]].filter(pair=>pair[0]===Number(new URLSearchParams(location.search).get("quality")))){');
driver=driver.replace('document.body.dataset.failed="true";});</script>', 'document.body.dataset.failed="true";});},100);</script>');
fs.writeFileSync(pngFixture,driver);
