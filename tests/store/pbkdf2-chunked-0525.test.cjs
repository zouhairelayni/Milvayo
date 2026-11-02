// /tests/store/pbkdf2-chunked-0525.test.cjs
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { pbkdf2Chunked } = require('../../src/store/pbkdf2Chunked.cjs');
const { createCodec } = require('../../src/store/niyav.cjs');
const zlib = require('node:zlib');

const macFor = (pw) => (m) => new Uint8Array(crypto.createHmac('sha256', pw).update(m).digest());
const hex = (u8) => Buffer.from(u8).toString('hex');

test('chunked PBKDF2 gives the same key as Node for 1, 2 and many iterations', async () => {
  const pw = Buffer.from('correct horse battery'), salt = crypto.randomBytes(16);
  for (const n of [1, 2, 999, 25000]) {
    const got = await pbkdf2Chunked(macFor(pw), salt, n, 32, { sliceMs: 0, tick: async () => {} });
    assert.equal(hex(got), crypto.pbkdf2Sync(pw, salt, n, 32, 'sha256').toString('hex'), `${n} iterations`);
  }
});

test('it waits on the timer between slices and reports rising progress that ends at 1', async () => {
  let waits = 0; const seen = [];
  await pbkdf2Chunked(macFor('pw'), Buffer.from('s'), 5000, 32, { sliceMs: 0, tick: async () => { waits++; }, onProgress: (p) => seen.push(p) });
  assert.ok(waits >= 10, 'yielded many times');
  assert.deepEqual(seen, [...seen].sort((a, b) => a - b));
  assert.equal(seen[seen.length - 1], 1);
});

test('the default wait is a real timer, so touches are handled between slices', async () => {
  const src = require('node:fs').readFileSync(require.resolve('../../src/store/pbkdf2Chunked.cjs'), 'utf8');
  assert.match(src, /setTimeout\(resolve, 0\)/);
});

test('cancelling stops the work with NIYAV_CANCELLED, before and during the derivation', async () => {
  const ac = new AbortController(); ac.abort();
  await assert.rejects(pbkdf2Chunked(macFor('pw'), Buffer.from('s'), 1000, 32, { signal: ac.signal }), { code: 'NIYAV_CANCELLED' });
  const live = new AbortController(); let n = 0;
  await assert.rejects(pbkdf2Chunked(macFor('pw'), Buffer.from('s'), 600000, 32, { signal: live.signal, sliceMs: 0, tick: async () => { if (++n === 3) live.abort(); } }), { code: 'NIYAV_CANCELLED' });
  assert.equal(n, 3, 'stopped right after the cancel, not at the end');
});

test('a key longer than one block is refused', async () => {
  await assert.rejects(pbkdf2Chunked(macFor('pw'), Buffer.from('s'), 10, 64), { code: 'NIYAV_INPUT' });
});

test('the codec passes progress and cancel to key derivation, and files still round-trip', async () => {
  const prim = {
    strToU8: (s) => new Uint8Array(Buffer.from(s, 'utf8')), strFromU8: (u) => Buffer.from(u).toString('utf8'),
    gzip: (u) => new Uint8Array(zlib.gzipSync(u)), gunzip: (u) => new Uint8Array(zlib.gunzipSync(u)),
    pbkdf2: (pw, salt, it, len, o) => pbkdf2Chunked(macFor(Buffer.from(pw)), salt, it, len, { ...o, sliceMs: 0, tick: async () => {} }),
    aesGcmEncrypt: (key, nonce, aad, plain) => { const c = crypto.createCipheriv('aes-256-gcm', key, nonce); c.setAAD(aad); return new Uint8Array(Buffer.concat([c.update(plain), c.final(), c.getAuthTag()])); },
    aesGcmDecrypt: (key, nonce, aad, sealed) => { const d = crypto.createDecipheriv('aes-256-gcm', key, nonce); d.setAAD(aad); d.setAuthTag(sealed.slice(-16)); return new Uint8Array(Buffer.concat([d.update(sealed.slice(0, -16)), d.final()])); },
    randomBytes: (n) => new Uint8Array(crypto.randomBytes(n)),
  };
  const codec = createCodec(prim);
  let last = 0;
  const bytes = await codec.encode('{"k":"v"}', { password: 'a long enough password', iterations: 100000, onProgress: (p) => { last = p; } });
  assert.equal(last, 1);
  assert.equal(await codec.decode(bytes, { password: 'a long enough password' }), '{"k":"v"}');
  const ac = new AbortController(); ac.abort();
  await assert.rejects(codec.encode('{}', { password: 'a long enough password', signal: ac.signal }), { code: 'NIYAV_CANCELLED' });
  await assert.rejects(codec.decode(bytes, { password: 'a long enough password', signal: ac.signal }), { code: 'NIYAV_CANCELLED' });
  await assert.rejects(codec.decode(bytes, { password: 'the wrong password!!' }), { code: 'NIYAV_BAD_PASSWORD' });
});
