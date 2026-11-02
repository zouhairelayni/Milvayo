// /tests/store/niyav-levels-0528.test.cjs
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const niyav = require('../../src/store/niyav.cjs');
const prim = require('../helpers/niyavNodePrimitives.cjs');
const codec = niyav.createCodec(prim);
const PW = 'a long enough password';
const text = JSON.stringify({ k: 'v'.repeat(2000) });
const stored = (b) => Buffer.from(b).readUInt32BE(8);

test('levels are 200k / 400k / 600k and Medium is the default', async () => {
  assert.deepEqual({ ...niyav.LEVELS }, { low: 200000, medium: 400000, high: 600000 });
  assert.equal(niyav.DEFAULT_LEVEL, 'medium');
  assert.equal(niyav.iterationsForLevel(undefined), 400000);
  assert.equal(niyav.iterationsForLevel('nope'), 400000);
  assert.equal(niyav.iterationsForLevel('__proto__'), 400000);
});

for (const level of ['low', 'medium', 'high']) {
  test(`${level}: round trip, count stored in file, opens without being told the level`, async () => {
    const out = await codec.encode(text, { password: PW, level });
    assert.equal(stored(out), niyav.LEVELS[level]);
    assert.equal(await codec.decode(out, { password: PW }), text);
    assert.equal(Buffer.from(out).subarray(0, 4).toString(), 'NIYV');
  });
}

test('no level given -> Medium; no password -> plain gzip regardless of level', async () => {
  assert.equal(stored(await codec.encode(text, { password: PW })), 400000);
  const gz = await codec.encode(text, { level: 'high' });
  assert.equal(codec.sniff(gz), 'gzip');
});

test('legacy 600,000-round file (made without the level option) still opens', async () => {
  const out = await codec.encode(text, { password: PW, iterations: 600000 });
  assert.equal(stored(out), 600000);
  assert.equal(await codec.decode(out, { password: PW }), text);
});

test('wrong password and a changed iteration count are rejected', async () => {
  const out = await codec.encode(text, { password: PW, level: 'low' });
  await assert.rejects(codec.decode(out, { password: 'another long password' }), { code: 'NIYAV_BAD_PASSWORD' });
  const forged = out.slice(); new DataView(forged.buffer, forged.byteOffset).setUint32(8, 400000);
  await assert.rejects(codec.decode(forged, { password: PW }), { code: 'NIYAV_BAD_PASSWORD' });
});

test('hostile iteration counts are refused before any key derivation', async () => {
  const out = await codec.encode(text, { password: PW, level: 'low' });
  let derived = 0;
  const spy = niyav.createCodec({ ...prim, pbkdf2: (...a) => { derived++; return prim.pbkdf2(...a); } });
  for (const n of [99999, 1000001, 10000000, 0xffffffff]) {
    const forged = out.slice(); new DataView(forged.buffer, forged.byteOffset).setUint32(8, n);
    await assert.rejects(spy.decode(forged, { password: PW }), { code: 'NIYAV_UNSUPPORTED' });
  }
  assert.equal(derived, 0);
  await assert.rejects(codec.encode(text, { password: PW, iterations: 1000001 }), { code: 'NIYAV_INPUT' });
});

test('truncated and corrupted protected files are rejected', async () => {
  const out = await codec.encode(text, { password: PW, level: 'low' });
  await assert.rejects(codec.decode(out.slice(0, 30), { password: PW }), { code: 'NIYAV_CORRUPT' });
  const bad = out.slice(); bad[bad.length - 5] ^= 1;
  await assert.rejects(codec.decode(bad, { password: PW }), { code: 'NIYAV_BAD_PASSWORD' });
});

test('cancellation stops derivation and creates no file', async () => {
  const ac = new AbortController(); ac.abort();
  const cancelling = niyav.createCodec({ ...prim, pbkdf2: (pw, s, i, d, o) => (o.signal.aborted ? Promise.reject(new niyav.NiyavError('NIYAV_CANCELLED', 'Cancelled.')) : prim.pbkdf2(pw, s, i, d)) });
  await assert.rejects(cancelling.encode(text, { password: PW, level: 'high', signal: ac.signal }), { code: 'NIYAV_CANCELLED' });
});

test('key from the stored count equals Node PBKDF2 (format unchanged)', async () => {
  const out = Buffer.from(await codec.encode(text, { password: PW, level: 'medium' }));
  const key = crypto.pbkdf2Sync(Buffer.from(PW, 'utf8'), out.subarray(12, 28), out.readUInt32BE(8), 32, 'sha256');
  const d = crypto.createDecipheriv('aes-256-gcm', key, out.subarray(28, 40)); d.setAAD(out.subarray(0, 40));
  d.setAuthTag(out.subarray(out.length - 16));
  const gz = Buffer.concat([d.update(out.subarray(40, out.length - 16)), d.final()]);
  assert.equal(require('node:zlib').gunzipSync(gz).toString(), text);
});
