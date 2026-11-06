// /tests/diagnostics/error-background-063.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{monitorHarness}=require('../helpers/monitor-harness.cjs');
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};};
test('global and console errors are captured and flushed while startup storage is still pending, with original handlers preserved',async()=>{
 const read=deferred(),h=monitorHarness({read:()=>read.promise}),start=h.monitor.start();
 h.fatal(Error('Startup failure'),true);h.warn('Reanimated warning');h.error('password=private123');await h.drain();
 assert.equal(h.originalCalls.fatal.length,1);assert.equal(h.originalCalls.warn.length,1);assert.equal(h.monitor.snapshot().warnings,1);assert.equal(h.originalCalls.error.length,1);assert.equal(h.monitor.snapshot().crashes.length,1);assert.equal(h.writes.at(-1).errors,2);assert.equal(h.writes.at(-1).crashes[0].fatal,true);assert.equal(h.timers.size,0);assert.equal(h.io[0],'read');assert.ok(!JSON.stringify(h.writes).includes('private123'));
 read.resolve(null);await start;await h.advance(200);assert.equal(h.monitor.snapshot().crashes.length,1);
});
test('background transitions during startup and later background breadcrumbs never wait on foreground batching',async()=>{
 const read=deferred(),h=monitorHarness({read:()=>read.promise}),start=h.monitor.start();h.background();h.monitor.recordAction('Background evidence');await h.drain();
 assert.equal(h.writes.at(-1).active,false);assert.equal(h.writes.at(-1).events.at(-1).detail,'Background evidence');assert.equal(h.timers.size,0);
 h.monitor.clear();await h.drain();assert.equal(h.writes.at(-1).active,false);
 read.resolve(JSON.stringify({runId:'cleared-old-run',active:true,events:[{detail:'Old evidence'}],crashes:[]}));await start;await h.advance(200);
 assert.equal(h.monitor.snapshot().previous,null);assert.equal(h.monitor.snapshot().active,false);assert.equal(h.timers.size,0);
});
test('resume resets timer-delay accounting and restores ordinary foreground batching without duplicate handlers',async()=>{
 const h=monitorHarness();await h.monitor.start();await h.monitor.start();await h.advance(200);h.background();await h.drain();
 await h.advance(5000);h.resume();h.tick();assert.equal(h.monitor.snapshot().freezeMs,0);const count=h.writes.length;
 h.monitor.recordAction('Resumed');await h.drain();assert.equal(h.writes.length,count);await h.advance(200);assert.equal(h.writes.at(-1).active,true);
 h.error('One error');await h.drain();assert.equal(h.monitor.snapshot().errors,1);assert.equal(h.originalCalls.error.length,1);assert.equal(h.intervals.size,1);
});
test('starting in the background preserves state and a failed startup read still leaves capture functional',async()=>{
 const h=monitorHarness({currentState:'background',read:async()=>{throw Error('read failed');}});await h.monitor.start();await h.drain();assert.equal(h.monitor.snapshot().active,false);assert.equal(h.writes.at(-1).active,false);
 h.monitor.captureError({name:'NativeBridgeError',message:'Plain error object',stack:'Safe stack'});await h.drain();assert.equal(h.writes.at(-1).crashes[0].name,'NativeBridgeError');assert.equal(h.writes.at(-1).crashes[0].message,'Plain error object');
});
test('browser page hide immediately flushes evidence and page show resumes foreground batching',async()=>{
 const h=monitorHarness({platform:'web'});await h.monitor.start();await h.advance(200);h.monitor.recordAction('Before page hide');h.page('pagehide');await h.drain();
 assert.equal(h.writes.at(-1).active,false);assert.equal(h.timers.size,0);h.page('pageshow');assert.equal(h.monitor.snapshot().active,true);assert.equal(h.timers.size,1);
 h.dispose();await h.drain();assert.equal(h.browser.size,0);assert.equal(h.intervals.size,0);assert.equal(h.timers.size,0);assert.equal(h.restored(),true);
});
test('Fast Refresh disposal during a slow startup cannot resurrect listeners, timers or native-exit callbacks',async()=>{
 const read=deferred();let nativeReads=0;const h=monitorHarness({read:()=>read.promise,nativeExit:async()=>{nativeReads++;return {reason:1};}}),start=h.monitor.start();
 h.dispose();await h.drain();const count=h.writes.length;read.resolve(null);await start;await h.advance(300);
 assert.equal(nativeReads,0);assert.equal(h.writes.length,count);assert.equal(h.intervals.size,0);assert.equal(h.timers.size,0);assert.equal(h.restored(),true);
});
test('native-exit completion after clear or disposal cannot reintroduce cleared evidence',async()=>{
 for(const action of ['clear','dispose']){const exit=deferred(),h=monitorHarness({nativeExit:()=>exit.promise});await h.monitor.start();await h.advance(200);
  action==='clear'?h.monitor.clear():h.dispose();await h.drain();const count=h.writes.length;exit.resolve({reason:1,timestamp:1});await h.drain();await h.advance(300);assert.equal(h.monitor.snapshot().nativeExit,undefined);assert.equal(h.writes.length,count);
 }
});


test('synchronous native-history failure cannot reject startup, while valid OS history still persists',async()=>{
 const failed=monitorHarness({nativeExit:()=>{throw Error('native module unavailable');}});await failed.monitor.start();await failed.drain();failed.monitor.recordAction('Still running');await failed.advance(200);assert.ok(failed.writes.at(-1).events.some(e=>e.detail==='Still running'));
 const ready=monitorHarness({nativeExit:async()=>({reason:5,timestamp:42})});await ready.monitor.start();await ready.drain();await ready.advance(200);assert.equal(ready.writes.at(-1).nativeExit.reason,5);
});
