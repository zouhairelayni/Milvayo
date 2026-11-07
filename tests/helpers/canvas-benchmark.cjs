// /tests/helpers/canvas-benchmark.cjs
'use strict';
const fs=require('node:fs'),{performance}=require('node:perf_hooks');
const {load}=require('./diagram-harness.cjs'),model=require('../../src/domain/model.cjs'),core=require('../../src/domain/canvas.cjs');
const pm=load('src/governance/pm.js',{'./data':{labourCosts:()=>[],money:String}}),scene=load('src/canvas/scene.js',{'../governance/pm':pm});
const {diagramCache}=require('../../src/governance/diagramCache.cjs'),{sceneToSvg}=require('../../src/governance/diagramScene.cjs'),{utf8Bytes}=require('../../src/store/importFiles.cjs');
const now='2026-11-07T04:00:00.000Z',cases=[];
const percentile=(values,p)=>[...values].sort((a,b)=>a-b)[Math.min(values.length-1,Math.ceil(values.length*p)-1)];
for(const count of [40,200]){
 const nodes=Array.from({length:count},(_,i)=>({id:'w'+i,parent:i?'w'+Math.floor((i-1)/5):null,name:'Work package '+i,hours:i%9})),project=model.makeProject({id:'p'+count,governance:{wbs:nodes}});
 let board=core.createBoard({id:'b'+count,projectId:project.id,now});board=core.changeBoard(board,{type:'add',objects:[...Array.from({length:count},(_,i)=>core.createObject({id:'n'+i,boardId:board.id,text:'Release decision '+i,x:i%10*280,y:Math.floor(i/10)*180,now})),core.createObject({id:'wbs',boardId:board.id,type:'linked',sourceLink:{projectId:project.id,sourceType:'wbs',sourceId:'w0',mode:'live',view:'tree',direction:'down'},width:1200,height:600,now})]},now);
 const scope=JSON.stringify(['benchmark',project.id]),at=performance.now();for(const o of board.objects)scene.objectScene(o,project,scope);const first=performance.now()-at,before=diagramCache.stats(),samples=[];
 for(let i=0;i<25;i++){const start=performance.now();for(const o of board.objects)scene.objectScene(o,project,scope);samples.push(performance.now()-start);}
 const after=diagramCache.stats(),startExport=performance.now(),full=scene.exportScene(board,project,scope),svg=sceneToSvg(full,{bg:'#111',ink:'#fff',muted:'#aaa',surface:'#222'}),exportMs=performance.now()-startExport;
 cases.push({objects:board.objects.length,wbsNodes:count,firstProjectionMs:first,repeatedProjection:{samples:25,p50Ms:percentile(samples,.5),p95Ms:percentile(samples,.95)},layoutCalculationsBefore:before.calculations,layoutCalculationsAfter:after.calculations,export:{ms:exportMs,width:full.width,height:full.height,primitives:full.items.length,svgBytes:utf8Bytes(svg)},boardBackupBytes:utf8Bytes(core.exportBoard(board))});
}
const report={measurement:'Host Node projection/cache/export costs only, excluding app navigation, React/native mount, GPU, IO and device FPS',node:process.version,cases,diagramCache:diagramCache.stats(),hostHeapUsedBytes:process.memoryUsage().heapUsed};
fs.writeFileSync('docs/qa/release-080/host-measurements.json',JSON.stringify(report,null,2));console.log('Recorded bounded 40/200-object host measurements; no device performance claim');
