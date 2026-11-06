// /tests/helpers/remediation-benchmark.cjs
'use strict';
// CPU microbenchmarks only. No native FPS, interaction latency or release-mode claims.
const {performance}=require('node:perf_hooks');const {calendarLabels}=require('../../src/timeline/timelineDisplay.cjs');const {projectMetric}=require('../../src/domain/governanceSummary.cjs');const model=require('../../src/domain/model.cjs');
function measure(fn,n){const times=[];for(let run=0;run<5;run++){const t=performance.now();for(let i=0;i<n;i++)fn();times.push((performance.now()-t)/n);}return {medianMs:+times.sort((a,b)=>a-b)[2].toFixed(4),samplesMs:times.map(x=>+x.toFixed(4))};}
const ticks=Array.from({length:56},(_,i)=>i),origin=Date.parse('2026-11-05T00:00:00Z');
const oldLabels=()=>ticks.map(i=>{const d=new Date(origin+i*86400000);return {month:d.toLocaleDateString('en',{month:'short',timeZone:'UTC'}),day:d.getUTCDate()};});
const result={kind:'isolated CPU microbenchmarks; five samples per case; warm process; same Node engine',node:process.version,calendar56:{beforeIntl:measure(oldLabels,20),afterUtc:measure(()=>calendarLabels('2026-11-05',ticks),200)},datasets:[]};
for(const count of [34,1000]){const p=model.makeProject({name:'Benchmark',tasks:Array.from({length:count},(_,i)=>({id:'t'+i,title:'Task '+i,start:'2026-11-05',due:'2026-11-10'}))});const groups={a:p.tasks},lists=[{id:'a'}];const derive=()=>Object.fromEntries(lists.map(l=>[l.id,groups[l.id].map(t=>t.id)]));const cached=derive();result.datasets.push({count,boardDragOrder:{beforeRepeated:measure(derive,500),afterMemoHit:measure(()=>cached,500)},projects:{coldSummary:measure(()=>projectMetric({...p}),20),cachedUnchanged:measure(()=>projectMetric(p),500)}});}
console.log(JSON.stringify(result,null,2));
