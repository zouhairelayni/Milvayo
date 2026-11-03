// /scripts/performance-benchmark.cjs
'use strict';
// Optional: node scripts/performance-benchmark.cjs. Synthetic Node CPU timings, not device FPS.
const {performance}=require('node:perf_hooks');
const model=require('../src/domain/model.cjs'),bridge=require('../src/domain/modernBridge.cjs');
const tasks=Array.from({length:2000},(_,i)=>({id:`task-${i}`,title:`Task ${i}`,estimateHours:2,owner:'Operator',start:'2026-10-01',due:'2026-10-03',dependsOn:i?[`task-${i-1}`]:[]}));
const project=model.makeProject({tasks});const normalize=model.createWorkspaceNormalizer();const workspace=normalize({projects:Array.from({length:5},(_,i)=>({...project,id:`project-${i}`}))});
for(const [name,fn] of Object.entries({costSummary:()=>model.operations.costSummary(project),health:()=>model.operations.health(project),projectView:()=>bridge.projectView(workspace),workspaceEdit:()=>normalize({...workspace,projects:workspace.projects.map((p,i)=>i?p:{...p,name:'Edited'})})})){
 fn();const samples=[];for(let i=0;i<7;i++){const start=performance.now();fn();samples.push(performance.now()-start);}console.log(`${name}: ${samples.sort((a,b)=>a-b)[3].toFixed(2)} ms median`);
}
