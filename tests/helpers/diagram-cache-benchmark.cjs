// /tests/helpers/diagram-cache-benchmark.cjs
'use strict';
const fs=require('node:fs'),path=require('node:path'),{performance}=require('node:perf_hooks');
const {createDiagramCache,diagramRevision}=require('../../src/governance/diagramCache.cjs');
const {sceneFor}=require('../../src/governance/diagramScene.cjs');
const {pm}=require('./wbs-harness.cjs'),{diagramPaintHarness}=require('./diagram-paint-harness.cjs');
const nodes=Array.from({length:500},(_,i)=>({id:'w'+i,parent:i?'w'+Math.floor((i-1)/5):null,name:i?'Work element '+i:'Project',hours:i%9}));
const cache=createDiagramCache(),paint=diagramPaintHarness(),calculations={tree:0,fishbone:0,mind:0};
const median=a=>[...a].sort((a,b)=>a-b)[Math.floor(a.length/2)];
function request(kind,data=nodes){
 const at=performance.now(),revision=diagramRevision(data,'Independent project');
 const tree=cache.get(['sample','hierarchy',revision.full],()=>pm.buildTree(data,'Independent project'),()=>data.length*768).value;
 const scene=cache.get(['sample',kind,kind==='tree'?revision.full:revision.structure,'down'],()=>{calculations[kind]++;return sceneFor(kind,tree,'down');},value=>value.items.length*1024+JSON.stringify(value).length*2).value;
 paint.render({scene});return {ms:performance.now()-at,primitives:scene.items.length,width:scene.width,height:scene.height};
}
global.gc?.();const heapBefore=process.memoryUsage().heapUsed,cases={};
for(const kind of ['tree','fishbone','mind'])cases[kind]={firstOpen:request(kind),reopenSamplesMs:[]};
for(let i=0;i<30;i++)for(const kind of ['tree','fishbone','mind'])cases[kind].reopenSamplesMs.push(request(kind).ms);
for(const kind of Object.keys(cases))cases[kind].reopenMedianMs=median(cases[kind].reopenSamplesMs);
const beforeUnrelated={...calculations},paintBefore=paint.stats().generations;
const changedMetadata=nodes.map(n=>({...n,owner:'New owner',note:'Updated notes'}));
for(const kind of ['tree','fishbone','mind'])request(kind,changedMetadata);
const unrelated={before:beforeUnrelated,after:{...calculations},paintGenerationsBefore:paintBefore,paintGenerationsAfter:paint.stats().generations};
const edited=nodes.map(n=>n.id==='w499'?{...n,name:'Revised delivery work element'}:n);
for(const kind of ['tree','fishbone','mind'])cases[kind].relevantTitleEdit=request(kind,edited);
global.gc?.();const result={kind:'Host Node actual hierarchy/layout and JSX generation requests with cache; NOT React native commit, Android launch time or FPS',node:process.version,nodes:500,cases,calculations,unrelated,paint:paint.stats(),directSceneFunctionCalls:paint.renders,cache:cache.stats(),hostHeap:{gcAvailable:!!global.gc,before:heapBefore,after:process.memoryUsage().heapUsed},nativeBitmapEstimate:{density:3,viewport390x440RgbaBytes:390*440*9*4,preview390x700RgbaBytes:390*700*9*4,doesNotIncludeOtherNativeBuffers:true}};
fs.writeFileSync(path.resolve(__dirname,'../../docs/qa/release-0712/cache-benchmark.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
