// /tests/store/canvas-deferred-save.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{createLatestWriter}=require('../../src/store/latestWriter.cjs');
test('Canvas deferred persistence coalesces edits and explicit flush writes the latest immutable snapshot',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const writes=[],writer=createLatestWriter(async value=>writes.push(value));writer.defer({revision:1});writer.defer({revision:2});assert.equal(writes.length,0);t.mock.timers.tick(159);await Promise.resolve();assert.equal(writes.length,0);t.mock.timers.tick(1);await writer.flush();assert.deepEqual(writes,[{revision:2}]);writer.defer({revision:3});assert.equal(await writer.flush(),true);assert.equal(writes.at(-1).revision,3);t.mock.timers.tick(1000);await Promise.resolve();assert.equal(writes.length,2);
});
test('a later immediate edit supersedes the deferred Canvas save and failed deferred writes remain retryable',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const writes=[];let fail=true;const writer=createLatestWriter(async value=>{if(fail)throw Error('offline disk');writes.push(value);});writer.defer(1);assert.equal(await writer.flush(),false);fail=false;assert.equal(await writer.flush(),true);writer.defer(2);await writer.enqueue(3);t.mock.timers.tick(1000);await writer.flush();assert.deepEqual(writes,[1,3]);
});
