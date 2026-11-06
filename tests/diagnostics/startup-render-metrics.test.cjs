// /tests/diagnostics/startup-render-metrics.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const core=require('../../src/diagnostics/core.cjs');
const {monitorHarness}=require('../helpers/monitor-harness.cjs');
const {load}=require('../helpers/diagram-harness.cjs');
const {lifecycleHarness}=require('../helpers/lifecycle-harness.cjs');
test('release reports retain bounded commit samples and explain missing React Profiler callbacks truthfully',()=>{
 const state=core.fresh('run',1);core.addCommit(state,'projects',12);core.addCommit(state,'projects',22);core.addCommit(state,'projects',NaN);
 assert.deepEqual(state.commits.projects,{count:2,sum:34,max:22});
 for(let i=0;i<100;i++)core.addCommit(state,'screen '+i,1);assert.equal(Object.keys(state.commits).length,32);
 const report=core.reportPerf(state);assert.match(report,/Standard release React disables/);assert.match(report,/projects: 2 commits, avg 17ms, max 22ms/);assert.match(report,/NOT React CPU duration/);
});
test('startup markers are distinct, bounded, sanitized and use a separate collection from ordinary breadcrumbs',()=>{
 const state=core.fresh('run',1);assert.equal(core.addStartup(state,'theme ready',14),true);assert.equal(core.addStartup(state,'theme ready',90),false);
 core.addStartup(state,'logo complete',1100,'password=private');for(let i=0;i<100;i++)core.addStartup(state,'stage '+i,i);
 assert.equal(state.startup.length,32);assert.equal(state.events.length,0);assert.equal(JSON.stringify(state).includes('private'),false);assert.match(core.reportPerf(state),/14ms \| theme ready/);
});
test('release render-to-commit hook records every committed render and never records an aborted render',()=>{
 const h=lifecycleHarness(),samples=[];let clock=0;
 const {useRenderMetric}=load('src/diagnostics/useRenderMetric.js',{react:h.hooks,'./monitor':{diagnosticMonitor:{now:()=>clock,recordCommit:(name,ms)=>samples.push([name,ms])}}});
 h.render(()=>{useRenderMetric('projects');clock+=12;return null;});h.render(()=>{useRenderMetric('projects');clock+=5;return null;});
 assert.deepEqual(samples,[['projects',12],['projects',5]]);
 assert.throws(()=>h.render(()=>{useRenderMetric('projects');throw Error('aborted');}));assert.equal(samples.length,2);h.unmount();
});
test('work timing preserves results and failures, coalesces diagnostic writes and survives persistence/clear',async()=>{
 const h=monitorHarness();await h.monitor.start();await h.advance(200);const count=h.writes.length;
 h.monitor.recordStartup('workspace ready');for(let i=0;i<20;i++){assert.equal(h.monitor.measureWork('project projection',()=>42),42);h.monitor.recordCommit('projects',12);}
 assert.throws(()=>h.monitor.measureWork('failed validation',()=>{throw Error('keep failure');}),/keep failure/);
 await h.advance(200);assert.equal(h.writes.length,count+1);assert.equal(h.writes.at(-1).commits.projects.count,20);assert.equal(h.writes.at(-1).work['project projection'].count,20);
 assert.equal(h.writes.at(-1).startup[0].name,'workspace ready');h.monitor.clear();await h.drain();assert.deepEqual(h.writes.at(-1).commits,{});assert.deepEqual(h.writes.at(-1).startup,[]);h.dispose();
});
