// /tests/store/niyav.test.cjs
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const niyav = require('../../src/store/niyav.cjs');
const prim = require('../helpers/niyavNodePrimitives.cjs');
const codec = niyav.createCodec(prim);
const FAST = niyav.MIN_ITERATIONS; // the lowest value the format allows; keeps the suite quick
const PW = 'correct horse battery';
const sample = JSON.stringify({ format: 'niyarvo.workspace.v1', workspace: { projects: Array.from({ length: 300 }, (_, i) => ({ id: `p${i}`, name: `Projekt Übersicht ${i} ✓ 日本語`, tasks: ['a', 'b', 'c'] })) } });
const bytesOf = (s) => new Uint8Array(Buffer.from(s));

test('plain .niyav is a standard gzip stream any tool can open', async () => {
  const out = await codec.encode(sample);
  assert.deepEqual([out[0], out[1]], [0x1f, 0x8b]);
  assert.equal(zlib.gunzipSync(out).toString('utf8'), sample, 'independent gunzip reads it');
  assert.ok(out.length < sample.length / 5, 'repetitive backup JSON compresses well');
  assert.equal(await codec.decode(out), sample);
  assert.equal(codec.sniff(out), 'gzip');
});

test('plain JSON and BOM-prefixed JSON are still read as before', async () => {
  assert.equal(await codec.decode(bytesOf(sample)), sample);
  assert.equal(await codec.decode(new Uint8Array([0xef, 0xbb, 0xbf, ...bytesOf(sample)])), sample);
  assert.equal(codec.sniff(bytesOf('  \n{"a":1}')), 'json');
  for (const junk of ['', 'hello', '[1,2]', '\u0000\u0001']) assert.equal(codec.sniff(bytesOf(junk)), 'unknown');
  await assert.rejects(codec.decode(bytesOf('not a backup')), e => e.code === 'NIYAV_UNKNOWN' && /\.json or \.niyav/.test(e.message) && !/Niyarvo/.test(e.message));
});

test('protected .niyav has the documented layout and round-trips', async () => {
  const out = await codec.encode(sample, { password: PW, iterations: FAST });
  assert.equal(codec.sniff(out), 'encrypted');
  assert.deepEqual([...out.subarray(0, 4)], [0x4e, 0x49, 0x59, 0x56]);
  assert.deepEqual([...out.subarray(4, 8)], [1, 1, 1, 1]);
  assert.equal(new DataView(out.buffer, out.byteOffset).getUint32(8), FAST);
  assert.equal(out.length, 40 + zlib.gzipSync(sample, { level: 9 }).length + 16, 'header + gzip payload + 16-byte tag');
  assert.equal(await codec.decode(out, { password: PW }), sample);
});

test('an independent decoder written only from the documented layout opens a protected file', async () => {
  const out = Buffer.from(await codec.encode(sample, { password: PW, iterations: FAST }));
  const iterations = out.readUInt32BE(8), salt = out.subarray(12, 28), nonce = out.subarray(28, 40);
  const key = crypto.pbkdf2Sync(Buffer.from(PW.normalize('NFKC'), 'utf8'), salt, iterations, 32, 'sha256');
  const d = crypto.createDecipheriv('aes-256-gcm', key, nonce);
  d.setAAD(out.subarray(0, 40));
  d.setAuthTag(out.subarray(out.length - 16));
  const gz = Buffer.concat([d.update(out.subarray(40, out.length - 16)), d.final()]);
  assert.equal(zlib.gunzipSync(gz).toString('utf8'), sample);
});

test('wrong password and every kind of tampering fail closed with no plaintext', async () => {
  const out = await codec.encode(sample, { password: PW, iterations: FAST });
  await assert.rejects(codec.decode(out, { password: 'another password!' }), { code: 'NIYAV_BAD_PASSWORD' });
  await assert.rejects(codec.decode(out), { code: 'NIYAV_NEEDS_PASSWORD' });
  // Flip each header byte, a spread of ciphertext bytes, and the tag. Header bytes are authenticated data.
  const spots = [...Array(40).keys(), 41, 60, 100, out.length - 17, out.length - 1];
  for (const at of spots) {
    const bad = out.slice(); bad[at] ^= 0x01;
    await assert.rejects(codec.decode(bad, { password: PW }), (e) => ['NIYAV_BAD_PASSWORD', 'NIYAV_UNSUPPORTED', 'NIYAV_UNKNOWN', 'NIYAV_CORRUPT'].includes(e.code), `byte ${at}`);
  }
  await assert.rejects(codec.decode(out.slice(0, out.length - 1), { password: PW }), { code: 'NIYAV_BAD_PASSWORD' });
  await assert.rejects(codec.decode(out.slice(0, 50), { password: PW }), { code: 'NIYAV_CORRUPT' });
});

test('hostile or downgraded key settings are refused before any key derivation runs', async () => {
  const out = await codec.encode(sample, { password: PW, iterations: FAST });
  let derived = 0;
  const counting = niyav.createCodec({ ...prim, pbkdf2: (...a) => { derived++; return prim.pbkdf2(...a); } });
  for (const iterations of [1, 99999, niyav.MAX_ITERATIONS + 1, 0xffffffff]) {
    const forged = out.slice(); new DataView(forged.buffer).setUint32(8, iterations);
    await assert.rejects(counting.decode(forged, { password: PW }), { code: 'NIYAV_UNSUPPORTED' });
  }
  const newer = out.slice(); newer[4] = 2;
  await assert.rejects(counting.decode(newer, { password: PW }), { code: 'NIYAV_UNSUPPORTED' });
  assert.equal(derived, 0, 'no CPU spent on a crafted header');
  await assert.rejects(codec.encode(sample, { password: PW, iterations: 1000 }), { code: 'NIYAV_INPUT' });
});

test('every file gets its own salt and nonce, so identical backups never look alike', async () => {
  const a = await codec.encode(sample, { password: PW, iterations: FAST });
  const b = await codec.encode(sample, { password: PW, iterations: FAST });
  assert.notDeepEqual(a.subarray(12, 28), b.subarray(12, 28));
  assert.notDeepEqual(a.subarray(28, 40), b.subarray(28, 40));
  assert.notDeepEqual(a.subarray(40), b.subarray(40));
});

test('password rules: at least 12 characters on export, unicode forms are equivalent, empty never means "no password"', async () => {
  await assert.rejects(codec.encode(sample, { password: 'short', iterations: FAST }), { code: 'NIYAV_PASSWORD' });
  await assert.rejects(codec.encode(sample, { password: '', iterations: FAST }), { code: 'NIYAV_PASSWORD' }, 'empty is an error, not an unprotected file');
  await assert.rejects(codec.encode(sample, { password: 12345678901234, iterations: FAST }), { code: 'NIYAV_PASSWORD' });
  const composed = 'Pässwörd-ünïcode-12', decomposed = composed.normalize('NFD');
  assert.notEqual(composed, decomposed);
  const out = await codec.encode(sample, { password: composed, iterations: FAST });
  assert.equal(await codec.decode(out, { password: decomposed }), sample, 'the same password typed on another keyboard opens the file');
  assert.equal(await codec.decode(out, { password: composed }), sample);
  await assert.rejects(codec.decode(out, { password: '' }), { code: 'NIYAV_PASSWORD' });
  await assert.rejects(codec.decode(out, { password: 'x'.repeat(300) }), { code: 'NIYAV_PASSWORD' });
});

test('size limits: oversize input is refused, and a compression bomb is stopped while inflating', async () => {
  await assert.rejects(codec.encode('x'.repeat(100), { maxBytes: 50 }), { code: 'NIYAV_TOO_LARGE' });
  const bomb = zlib.gzipSync(Buffer.alloc(6 * 1024 * 1024, 0x61)); // about 6 KB on disk, 6 MB inflated
  assert.ok(bomb.length < 20000);
  await assert.rejects(codec.decode(new Uint8Array(bomb)), { code: 'NIYAV_TOO_LARGE' });
  await assert.rejects(codec.decode(new Uint8Array(zlib.gzipSync('{"a":1}').subarray(0, 12))), { code: 'NIYAV_CORRUPT' });
});

test('a failed self-check refuses to produce a protected file', async () => {
  const broken = niyav.createCodec({ ...prim, aesGcmDecrypt: () => new Uint8Array([1, 2, 3]) });
  await assert.rejects(broken.encode(sample, { password: PW, iterations: FAST }), { code: 'NIYAV_SELFCHECK' });
});
