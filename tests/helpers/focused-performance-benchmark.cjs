// /tests/helpers/focused-performance-benchmark.cjs
'use strict';
// Bounded same-engine CPU sample. No native FPS, render-frame or release-build claims.
const {performance}=require('node:perf_hooks');
const model=require('../../src/domain/model.cjs'),bridge=require('../../src/domain/modernBridge.cjs'),{scheduleSeries}=require('../../src/domain/dashboard.cjs');
function measure(fn,n=12){fn();const samples=[];for(let sample=0;sample<5;sample++){const start=performance.now();for(let i=0;i<n;i++)fn();samples.push((performance.now()-start)/n);}const ordered=[...samples].sort((a,b)=>a-b);return {medianMs:+ordered[2].toFixed(4),samplesMs:samples.map(x=>+x.toFixed(4))};}
const tasks=Array.from({length:1000},(_,i)=>({id:'t'+i,title:'Task '+i,due:`2026-11-${String(i%28+1).padStart(2,'0')}`,status:i%3?'Backlog':'Done'}));
const projects=Array.from({length:10},(_,i)=>model.makeProject({id:'p'+i,name:'Project '+i,code:'P'+i,tasks}));
const portfolios=Array.from({length:20},(_,i)=>({id:'f'+i,name:'Portfolio '+i,projectIds:projects.map(p=>p.id)}));
const workspace={...model.createWorkspace(),projects,selectedId:'p0',portfolios};let serial=0;
const deriveEdit=()=>bridge.projectView({...workspace,projects:projects.map((p,i)=>i?p:{...p,name:'Edited '+serial++})});
const original=model.operations.health;let healthCalls=0;model.operations.health=(...args)=>{healthCalls++;return original(...args);};deriveEdit();const firstHealthCalls=healthCalls;healthCalls=0;deriveEdit();const nextEditHealthCalls=healthCalls;model.operations.health=original;
console.log(JSON.stringify({kind:'isolated CPU and operation-count audit; five warm-process samples; no native performance claims',node:process.version,fixture:{tasks:1000,projects:10,portfolios:20},schedule21Days:measure(()=>scheduleSeries(tasks,'2026-11-01',21),30),projectViewEdit:measure(deriveEdit),healthCalls:{first:firstHealthCalls,nextEdit:nextEditHealthCalls}},null,2));
