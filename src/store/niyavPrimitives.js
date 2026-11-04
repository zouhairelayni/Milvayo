// /src/store/niyavPrimitives.js
import { Gunzip, gzipSync, strFromU8, strToU8 } from 'fflate';
import { sha256 } from 'js-sha256';
import * as Crypto from 'expo-crypto';

const { createCodec, NiyavError } = require('./niyav.cjs');
const { pbkdf2Chunked } = require('./pbkdf2Chunked.cjs');
const { createExpoAesGcm } = require('./expoAesGcm.cjs');
const aes = createExpoAesGcm(Crypto);

// Portable backup: fflate gzip, maintained js-sha256 HMAC for sliced PBKDF2 on Expo Go,
// and Expo SDK 58 native AES-256-GCM + secure randomness. Web Crypto accelerates PBKDF2 on HTTPS.
// The .niyav v1 wire format, SHA-256 KDF and 16-byte GCM authentication tag are unchanged.

const concat = (chunks, total) => {
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) { out.set(c, at); at += c.length; }
  return out;
};

// Browsers (and any runtime that ships WebCrypto) derive the key natively in a fraction of the time. Hermes in Expo
// Go has no crypto.subtle and expo-crypto offers no PBKDF2, so Android and iOS use the chunked JavaScript path.
// The native result is compared once with the JavaScript result before it is trusted; any doubt falls back.
// It cannot be interrupted mid-derivation, so cancellation is honoured before and after the call.
let nativeState = null; // null = untested, true = verified, false = unusable
const subtle = () => (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle && typeof globalThis.crypto.subtle.deriveBits === 'function' ? globalThis.crypto.subtle : null);
const deriveNative = async (s, password, salt, iterations) => {
  const key = await s.importKey('raw', password, 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await s.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256));
};
async function nativePbkdf2(password, salt, iterations, dkLen, { onProgress, signal } = {}) {
  const s = nativeState === false ? null : subtle();
  if (!s || dkLen !== 32) return null;
  const stop = () => { if (signal && signal.aborted) throw new NiyavError('NIYAV_CANCELLED', 'Cancelled.'); };
  try {
    if (nativeState === null) {
      const a = await deriveNative(s, strToU8('password'), strToU8('salt'), 1000);
      nativeState = toHex(a) === '632c2812e46d4604102ba7618e9d6d7d2f8128f6266b4a03264d2a0460b7dcb3';
      if (!nativeState) return null;
    }
    stop();
    const out = await deriveNative(s, password, salt, iterations);
    stop();
    if (onProgress) onProgress(1);
    return out;
  } catch (error) {
    if (error instanceof NiyavError) throw error;
    nativeState = false;
    return null;
  }
}

const primitives = {
  strToU8: (s) => strToU8(s),
  strFromU8: (u8) => strFromU8(u8),
  // mtime 0: the file does not record when it was made.
  gzip: (u8) => gzipSync(u8, { level: 9, mtime: 0 }),
  // Streams the inflate and stops as soon as the output passes the limit, so a tiny hostile file cannot fill memory.
  gunzip: (u8, maxBytes) => {
    const chunks = [];
    let total = 0;
    const stream = new Gunzip((chunk) => {
      total += chunk.length;
      if (total > maxBytes) throw new NiyavError('NIYAV_TOO_LARGE', 'File exceeds 5 MB size limit.');
      chunks.push(chunk);
    });
    stream.push(u8, true);
    return concat(chunks, total);
  },
  // Slices of about 16 ms with a timer wait between them (see pbkdf2Chunked.cjs); onProgress and signal come from the screen.
  pbkdf2: async (password, salt, iterations, dkLen, options) => {
    const fast = await nativePbkdf2(password, salt, iterations, dkLen, options);
    if (fast) return fast;
    // Create a new HMAC per PBKDF2 round; always pass binary data, never strings.
    // The algorithm and the derived keys are unchanged from Noble/Node PBKDF2.
    return pbkdf2Chunked((message) => Uint8Array.from(sha256.hmac.create(password).update(message).array()), salt, iterations, dkLen, options);
  },
  aesGcmEncrypt: aes.encrypt,
  aesGcmDecrypt: aes.decrypt,
  randomBytes: (n) => Crypto.getRandomBytes(n),
};

// Known-answer vectors computed with Node's crypto and zlib (PBKDF2-HMAC-SHA256 "password"/"salt"/1000 matches the
// widely published value). If any installed library misbehaves, protected backups are refused instead of created
// in a form that nothing could open.
const hex = (s) => Uint8Array.from(s.match(/../g).map((h) => parseInt(h, 16)));
const toHex = (u8) => Array.from(u8, (b) => b.toString(16).padStart(2, '0')).join('');
const KAT = {
  pbkdf2: '632c2812e46d4604102ba7618e9d6d7d2f8128f6266b4a03264d2a0460b7dcb3',
  aes: '2672a7070b9f39be550c309fb4450b9331b56378f7de91ab205867a1295a7aeba0f1c13c',
  gzip: '1f8b0800000000000203cbcbac4c2c2acbd74dafca2cd0cd4e2c010082b497a210000000',
};
const fail = () => new NiyavError('NIYAV_SELFTEST', 'Backup compression or encryption is not working on this device. No file was created or opened.');

async function checkGzip() {
  try {
    if (strFromU8(primitives.gunzip(hex(KAT.gzip), 1024)) !== 'niyarvo-gzip-kat') throw fail();
    const sample = strToU8('{"k":"v"}'.repeat(500));
    if (strFromU8(primitives.gunzip(primitives.gzip(sample), 1 << 20)) !== strFromU8(sample)) throw fail();
  } catch (error) { throw error instanceof NiyavError ? error : fail(); }
}
async function checkCrypto() {
  try {
    const dk = await primitives.pbkdf2(strToU8('password'), strToU8('salt'), 1000, 32);
    if (toHex(dk) !== KAT.pbkdf2) throw fail();
    const key = Uint8Array.from({ length: 32 }, (_, i) => i);
    const nonce = Uint8Array.from({ length: 12 }, (_, i) => i + 100);
    const aad = strToU8('niyav-kat-aad');
    const sealed = await primitives.aesGcmEncrypt(key, nonce, aad, strToU8('niyarvo known answer'));
    if (toHex(sealed) !== KAT.aes) throw fail();
    if (strFromU8(await primitives.aesGcmDecrypt(key, nonce, aad, sealed)) !== 'niyarvo known answer') throw fail();
    const bad = sealed.slice(); bad[0] ^= 1;
    let rejected = false;
    try { await primitives.aesGcmDecrypt(key, nonce, aad, bad); } catch { rejected = true; }
    if (!rejected) throw fail();
    const a = primitives.randomBytes(16), b = primitives.randomBytes(16);
    if (a.length !== 16 || toHex(a) === toHex(b)) throw fail();
  } catch (error) { throw error instanceof NiyavError ? error : fail(); }
}
let gzipChecked = null;
let cryptoChecked = null;
const selfTest = async (needCrypto) => {
  gzipChecked = gzipChecked || checkGzip().catch((e) => { gzipChecked = null; throw e; });
  await gzipChecked;
  if (needCrypto) {
    cryptoChecked = cryptoChecked || checkCrypto().catch((e) => { cryptoChecked = null; throw e; });
    await cryptoChecked;
  }
};

const base = createCodec(primitives);

export const niyavCodec = {
  sniff: base.sniff,
  encode: async (text, options) => { await selfTest(!!options && options.password !== undefined && options.password !== null); return base.encode(text, options); },
  decode: async (bytes, options) => { await selfTest(base.sniff(bytes) === 'encrypted'); return base.decode(bytes, options); },
};
export { NiyavError };
