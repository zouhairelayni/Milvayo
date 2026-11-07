// /tests/helpers/diagram-0713-benchmark.cjs
'use strict';
const {performance}=require('node:perf_hooks');
const {treeScene}=require('../../src/governance/diagramScene.cjs');
const {batchVisible}=require('../../src/governance/diagramVisibility.cjs');
const {createDiagramCache}=require('../../src/governance/diagramCache.cjs');
const {pm}=require('./wbs-harness.cjs');
const results=[];
for(const count of [40,250])for(const direction of ['down','right']){
 const nodes=Array.from({length:count},(_,i)=>({id:'w'+i,parent:i?'w'+Math.floor((i-1)/5):null,name:'Work element '+i,hours:i%9}));
 const root=pm.buildTree(nodes,'Benchmark'),cache=createDiagramCache(),samples=[];
 for(let i=0;i<5;i++){const at=performance.now();cache.get(['benchmark','tree',direction],()=>treeScene(root,direction));samples.push(performance.now()-at);}
 const scene=cache.get(['benchmark','tree',direction],()=>{throw Error('Unexpected rebuild');}).value;
 const visible=scene.batches.filter(b=>batchVisible(b.bounds,{scale:1,x:0,y:0},{width:390,height:440}));
 const text=items=>items.filter(i=>i.t==='text').length;
 results.push({nodes:count,direction,firstLookupMs:samples[0],cachedLookupSamplesMs:samples.slice(1),primitives:scene.items.length,textBeforeCulling:text(scene.items),textAfterCulling:text(visible.flatMap(b=>b.indexes.map(i=>scene.items[i]))),batches:scene.batches.length,cache:cache.stats()});
}
console.log(JSON.stringify({measurement:'Host Node layout/cache and modeled native draw eligibility, not device frame time or FPS',node:process.version,viewport:{width:390,height:440},pose:{scale:1,x:0,y:0},results},null,2));
