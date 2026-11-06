// /tests/diagnostics/save-coalescing-063.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{monitorHarness}=require('../helpers/monitor-harness.cjs');
test('ordinary breadcrumbs retain every bounded event while persistence is coalesced without an unbounded delay',async()=>{
 const h=monitorHarness();await h.monitor.start();await h.advance(200);const initial=h.writes.length;
 for(let i=0;i<100;i++){h.monitor.recordAction('Step '+i);await h.advance(5);}
 await h.advance(200);assert.equal(h.writes.length-initial,3);assert.equal(h.monitor.snapshot().events.at(-1).detail,'Step 99');assert.equal(h.writes.at(-1).events.at(-1).detail,'Step 99');assert.equal(h.timers.size,0);
});
test('crashes, backgrounding and clear bypass pending saves; no stale run is persisted after clear',async()=>{
 const h=monitorHarness();await h.monitor.start();await h.advance(200);let count=h.writes.length;
 h.monitor.recordAction('Before error');h.monitor.captureError(Error('Failure'));await h.drain();assert.equal(h.writes.length,count+1);assert.equal(h.writes.at(-1).crashes.length,1);assert.equal(h.timers.size,0);
 count=h.writes.length;h.monitor.recordAction('Before background');h.background();await h.drain();assert.equal(h.writes.length,count+1);assert.equal(h.writes.at(-1).active,false);
 h.monitor.recordAction('Old run');h.monitor.clear();await h.drain();assert.equal(h.writes.at(-1).crashes.length,0);assert.equal(h.writes.at(-1).events.length,0);count=h.writes.length;await h.advance(300);assert.equal(h.writes.length,count);
});
test('failed diagnostic persistence stays retryable and does not interrupt live reports',async()=>{
 const h=monitorHarness();await h.monitor.start();await h.advance(200);h.setFail(true);h.monitor.recordAction('Retry evidence');await h.advance(200);
 assert.ok(h.monitor.crashReport());assert.ok(h.monitor.performanceReport());h.setFail(false);h.background();await h.drain();assert.ok(h.writes.at(-1).events.some(e=>e.detail==='Retry evidence'));
});
