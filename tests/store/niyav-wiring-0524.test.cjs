// /tests/store/niyav-wiring-0524.test.cjs
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const read = (f) => fs.readFileSync(path.join(__dirname, '../..', f), 'utf8');
const files = require('../../src/store/importFiles.cjs');

test('the known-answer vectors embedded in the app primitives match Node crypto and zlib', () => {
  const src = read('src/store/niyavPrimitives.js');
  const vec = (name) => src.match(new RegExp(`${name}: '([0-9a-f]+)'`))[1];
  const dk = crypto.pbkdf2Sync('password', 'salt', 1000, 32, 'sha256').toString('hex');
  assert.equal(vec('pbkdf2'), dk);
  assert.equal(dk, '632c2812e46d4604102ba7618e9d6d7d2f8128f6266b4a03264d2a0460b7dcb3', 'the widely published PBKDF2-HMAC-SHA256 value');
  const key = Buffer.from([...Array(32).keys()]);
  const nonce = Buffer.from([...Array(12).keys()].map((i) => i + 100));
  const sealed = Buffer.from(vec('aes'), 'hex');
  const d = crypto.createDecipheriv('aes-256-gcm', key, nonce);
  d.setAAD(Buffer.from('niyav-kat-aad')); d.setAuthTag(sealed.subarray(sealed.length - 16));
  assert.equal(Buffer.concat([d.update(sealed.subarray(0, sealed.length - 16)), d.final()]).toString(), 'niyarvo known answer');
  assert.equal(zlib.gunzipSync(Buffer.from(vec('gzip'), 'hex')).toString(), 'niyarvo-gzip-kat');
});

test('the app primitives fail closed: self-test before any protected file is made or opened', () => {
  const src = read('src/store/niyavPrimitives.js');
  assert.match(src, /from 'fflate'/); assert.match(src, /from '@noble\/hashes\/hmac'/);
  assert.match(src, /from '@noble\/ciphers\/aes'/); assert.match(src, /from 'expo-crypto'/);
  assert.match(src, /encode: async \(text, options\) => \{ await selfTest\(/);
  assert.match(src, /decode: async \(bytes, options\) => \{ await selfTest\(base\.sniff\(bytes\) === 'encrypted'\)/);
  assert.match(src, /new Gunzip\(/, 'inflate is streamed and limited, never one unbounded call');
  assert.match(src, /pbkdf2Chunked/, 'key derivation runs in slices so the screen stays responsive');
  assert.doesNotMatch(src, /pbkdf2Async/, 'pbkdf2Async only yields on a microtask, which freezes touch handling on a phone');
  assert.match(src, /mtime: 0/);
});

test('byte readers: Android picker, iOS picker, cancel, size limits', async () => {
  const bytes = new Uint8Array([1, 2, 3]);
  const file = { bytes: async () => bytes, size: 3 };
  assert.equal(await files.pickAndroidFileBytes({ pickFileAsync: async () => ({ canceled: false, result: file }) }), bytes);
  assert.equal(await files.pickAndroidFileBytes({ pickFileAsync: async () => ({ canceled: true }) }), null);
  await assert.rejects(files.pickAndroidFileBytes({ pickFileAsync: async () => ({ result: { bytes: async () => bytes, size: 6 * 1024 * 1024 } }) }), /5 MB/);
  await assert.rejects(files.pickAndroidFileBytes({ pickFileAsync: async () => ({ result: { text: async () => 'x' } }) }), /did not return a readable document/);
  await assert.rejects(files.pickAndroidFileBytes({}), { code: 'NP_PICKER_UNAVAILABLE' });
  class Fake { constructor(uri) { this.uri = uri; } async bytes() { return bytes; } }
  const pick = (name, size = 3) => ({ canceled: false, assets: [{ name, size, uri: 'file:///x' }] });
  assert.equal(await files.pickDocumentFileBytes(pick('a.niyav'), Fake), bytes);
  assert.equal(await files.pickDocumentFileBytes(pick('A.JSON'), Fake), bytes);
  assert.equal(await files.pickDocumentFileBytes({ canceled: true }, Fake), null);
  await assert.rejects(files.pickDocumentFileBytes(pick('a.txt'), Fake), /\.json or \.niyav/);
  await assert.rejects(files.pickDocumentFileBytes(pick('a.niyav', 6 * 1024 * 1024), Fake), /5 MB/);
  // existing text readers keep working
  assert.equal(await files.pickAndroidJsonText({ pickFileAsync: async () => ({ result: { text: async () => '\uFEFF{"a":1}', size: 7 } }) }), '{"a":1}');
});

test('Backup screen: formats, password rules, protected-file unlock, no password kept', () => {
  const src = read('src/screens/workspace/Backup.js');
  assert.match(src, /niyavCodec\.encode\(text,\{password:protect\?pw:undefined,level,\.\.\.job\}\)/, 'no password means a plain gzip file, never an empty one');
  assert.match(src, /Array\.from\(pw\)\.length<MIN_PASSWORD/);
  assert.match(src, /pw!==pw2/);
  assert.match(src, /if\(protect\)\{setPw\(''\);setPw2\(''\)\}/, 'the password fields are cleared after a protected export');
  assert.match(src, /niyavCodec\.sniff\(bytes\)==='encrypted'\)\{setLocked\(/);
  assert.match(src, /niyavCodec\.decode\(locked\.bytes,\{password:unlockPw,\.\.\.job\}\)/);
  assert.match(src, /setLocked\(null\);setUnlockPw\(''\)/);
  assert.equal((src.match(/<Input secure/g) || []).length, 3, 'every password field is a secure field');
  assert.equal(/console\.|AsyncStorage|diagnosticMonitor/.test(src), false, 'the password never reaches logs, storage or diagnostics');
  assert.match(src, /\.niyav/);
  assert.match(src, /downloadBytes\(`\$\{base\}\.niyav`/);
  assert.match(src, /backupText\(all,\{snapshots:withSnapshots,projectId\}\)/);
  assert.match(src, /cannot be opened by anyone/);
});

test('Input supports masked password entry without suggestions', () => {
  const src = read('src/ui/uiControls.js');
  assert.match(src, /secure = false/);
  assert.match(src, /secureTextEntry=\{secure\}/);
  assert.match(src, /autoCorrect=\{secure \? false : undefined\}/);
});

test('exports are compact JSON and leave out recovery snapshots unless asked', () => {
  const src = read('src/store/store.js');
  assert.match(src, /backupText:\(all,options\)=>/);
  assert.match(src, /workspace:withSnapshots\?w:\{\.\.\.w,backups:\[\]\}/);
  assert.equal(/backupText:[^\n]*null,2\)/.test(src), false, 'no pretty-printing');
});
