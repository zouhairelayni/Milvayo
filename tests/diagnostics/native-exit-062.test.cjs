// /tests/diagnostics/native-exit-062.test.cjs
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../helpers/diagram-harness.cjs');
const core = require('../../src/diagnostics/core.cjs');
function reader(module, os = 'android', version = 35) {
  return load('src/diagnostics/nativeExit.native.js', {
    'react-native': { Platform: { OS: os, Version: version } },
    expo: { requireOptionalNativeModule: () => module },
  }).readNativeExit;
}
test('Android native exit history returns only OS reason and timestamp', async () => {
  const read = reader({ getPreviousProcessExit: async () => ({ reason: 5, timestamp: 1234, description: 'private trace' }) });
  assert.deepEqual(JSON.parse(JSON.stringify(await read())), { reason: 5, timestamp: 1234 });
  const s = core.fresh('run', 2000); s.nativeExit = await read();
  const report = core.reportCrash(s);
  assert.match(report, /native crash \(reason 5\)/);
  assert.match(report, /may predate the previous JS run/);
  assert.match(report, /recorded JS exceptions: 0/);
  assert.doesNotMatch(report, /private trace/);
});
test('missing, malformed and failing native history never prevents startup', async () => {
  for (const module of [null, {}, { getPreviousProcessExit: async () => null }, { getPreviousProcessExit: async () => ({ reason: '5', timestamp: -1 }) }, { getPreviousProcessExit: async () => { throw Error('not available'); } }]) {
    assert.equal(await reader(module)(), null);
  }
  assert.equal(await reader({}, 'ios')(), null);
  assert.equal(await reader({}, 'android', 29)(), null);
});
test('an OS signal is not misreported as a proven low-memory or native crash', () => {
  const s = core.fresh('run', 2000); s.nativeExit = { reason: 2, timestamp: 1234 };
  assert.match(core.reportCrash(s), /OS signal \(cause not inferred\)/);
});
