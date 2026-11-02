// /src/store/niyavPrimitives.js
import { Gunzip, gzipSync, strFromU8, strToU8 } from 'fflate';
import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
import { gcm } from '@noble/ciphers/aes';
import * as Crypto from 'expo-crypto';

const { createCodec, NiyavError } = require('./niyav.cjs');
const { pbkdf2Chunked } = require('./pbkdf2Chunked.cjs');

// Pure-JavaScript, audited primitives that run unchanged in Expo Go, Android, iOS and the browser:
// fflate (gzip), @noble/hashes (HMAC-SHA256 for PBKDF2), @noble/ciphers (AES-256-GCM), expo-crypto (secure randomness).
// Install: npm install fflate@0.8.2 @noble/hashes@1.8.0 @noble/ciphers@1.3.0 && npx expo install expo-crypto

const concat = (chunks, total) => {
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) { out.set(c, at); at += c.length; }
  return out;
};

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
  pbkdf2: (password, salt, iterations, dkLen, options) => {
    const keyed = hmac.create(sha256, password);
    return pbkdf2Chunked((message) => keyed.clone().update(message).digest(), salt, iterations, dkLen, options);
  },
  aesGcmEncrypt: (key, nonce, aad, plain) => gcm(key, nonce, aad).encrypt(plain),
  aesGcmDecrypt: (key, nonce, aad, sealed) => gcm(key, nonce, aad).decrypt(sealed),
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
    const sealed = primitives.aesGcmEncrypt(key, nonce, aad, strToU8('niyarvo known answer'));
    if (toHex(sealed) !== KAT.aes) throw fail();
    if (strFromU8(primitives.aesGcmDecrypt(key, nonce, aad, sealed)) !== 'niyarvo known answer') throw fail();
    const bad = sealed.slice(); bad[0] ^= 1;
    let rejected = false;
    try { primitives.aesGcmDecrypt(key, nonce, aad, bad); } catch { rejected = true; }
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
