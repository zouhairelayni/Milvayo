// /src/store/niyav.cjs
'use strict';

// .niyav backup container. Pure logic: every primitive (gzip, key derivation, cipher, randomness) is injected,
// so the format is tested here against Node's own zlib and crypto and runs in the app on fflate + @noble.
//
// Plain  .niyav = a standard gzip stream of the backup JSON (UTF-8). `gunzip file.niyav` opens it.
// Protected .niyav = fixed 40-byte header, then AES-256-GCM(ciphertext || 16-byte tag) of that gzip stream:
//
//   0   4  magic "NIYV"
//   4   1  format version (1)
//   5   1  key derivation: 1 = PBKDF2-HMAC-SHA256
//   6   1  cipher:         1 = AES-256-GCM
//   7   1  compression of the encrypted payload: 1 = gzip
//   8   4  PBKDF2 iterations, big-endian
//   12 16  random salt
//   28 12  random nonce
//   40  n  ciphertext || tag
//
// The whole header is the GCM additional data, so changing any header byte (iterations, salt, nonce, algorithm
// ids) makes decryption fail. The password is normalised to Unicode NFKC and encoded as UTF-8 before the KDF.
// Nothing is stored that identifies the content: no file name, project name, counts or timestamps.

const MAGIC = [0x4e, 0x49, 0x59, 0x56];
const VERSION = 1;
const KDF_PBKDF2_SHA256 = 1;
const CIPHER_AES256GCM = 1;
const COMPRESSION_GZIP = 1;
const HEADER_BYTES = 40;
const SALT_BYTES = 16;
const NONCE_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;
// Protection levels the user can pick. Only the PBKDF2 work factor differs (resistance to password guessing);
// every level uses the same AES-256-GCM key length. The count is stored in the header, so a file always opens
// with the level it was made with. 600000 is the OWASP 2023 figure and the value used by 0.5.24-0.5.27 files.
const LEVELS = Object.freeze({ low: 200000, medium: 400000, high: 600000 });
const DEFAULT_LEVEL = 'medium';
const DEFAULT_ITERATIONS = LEVELS[DEFAULT_LEVEL];
const iterationsForLevel = (level) => (Object.prototype.hasOwnProperty.call(LEVELS, level) ? LEVELS[level] : DEFAULT_ITERATIONS);
// Refuse weak files and refuse absurd costs before spending any CPU on a hostile header. The ceiling is well above
// the strongest preset and keeps a forged header from stalling a phone for minutes (0.5.28: was 10,000,000).
const MIN_ITERATIONS = 100000;
const MAX_ITERATIONS = 1000000;
const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 256;
const MAX_PLAIN_BYTES = 5 * 1024 * 1024;

class NiyavError extends Error {
  constructor(code, message) { super(message); this.name = 'NiyavError'; this.code = code; }
}

const concat = (...parts) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) { out.set(p, at); at += p.length; }
  return out;
};
const sameBytes = (a, b) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
};
const startsWith = (bytes, prefix) => bytes.length >= prefix.length && prefix.every((v, i) => bytes[i] === v);

// 'gzip' | 'encrypted' | 'json' | 'unknown'
function sniff(bytes) {
  if (!bytes || bytes.length < 2) return 'unknown';
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) return 'gzip';
  if (startsWith(bytes, MAGIC)) return 'encrypted';
  let i = startsWith(bytes, [0xef, 0xbb, 0xbf]) ? 3 : 0;
  while (i < bytes.length && (bytes[i] === 0x20 || bytes[i] === 0x09 || bytes[i] === 0x0a || bytes[i] === 0x0d)) i++;
  return bytes[i] === 0x7b ? 'json' : 'unknown';
}

function buildHeader(iterations, salt, nonce) {
  const h = new Uint8Array(HEADER_BYTES);
  h.set(MAGIC, 0);
  h[4] = VERSION; h[5] = KDF_PBKDF2_SHA256; h[6] = CIPHER_AES256GCM; h[7] = COMPRESSION_GZIP;
  h[8] = (iterations >>> 24) & 0xff; h[9] = (iterations >>> 16) & 0xff; h[10] = (iterations >>> 8) & 0xff; h[11] = iterations & 0xff;
  h.set(salt, 12);
  h.set(nonce, 28);
  return h;
}

function parseHeader(bytes) {
  if (bytes.length < HEADER_BYTES + TAG_BYTES) throw new NiyavError('NIYAV_CORRUPT', 'This backup file is incomplete.');
  if (bytes[4] !== VERSION) throw new NiyavError('NIYAV_UNSUPPORTED', 'This backup was made by a newer version of Niyarvo Projects. Update the app to open it.');
  if (bytes[5] !== KDF_PBKDF2_SHA256 || bytes[6] !== CIPHER_AES256GCM || bytes[7] !== COMPRESSION_GZIP) {
    throw new NiyavError('NIYAV_UNSUPPORTED', 'This backup uses an encryption method this version does not support.');
  }
  const iterations = ((bytes[8] << 24) | (bytes[9] << 16) | (bytes[10] << 8) | bytes[11]) >>> 0;
  if (iterations < MIN_ITERATIONS || iterations > MAX_ITERATIONS) {
    throw new NiyavError('NIYAV_UNSUPPORTED', 'This backup has unsafe key settings and was not opened.');
  }
  return {
    header: bytes.slice(0, HEADER_BYTES),
    iterations,
    salt: bytes.slice(12, 12 + SALT_BYTES),
    nonce: bytes.slice(28, 28 + NONCE_BYTES),
    sealed: bytes.slice(HEADER_BYTES),
  };
}

function createCodec(prim) {
  const passwordBytes = (password, { forWriting }) => {
    if (typeof password !== 'string') throw new NiyavError('NIYAV_PASSWORD', 'Enter a password.');
    const chars = Array.from(password).length;
    if (forWriting && chars < MIN_PASSWORD_LENGTH) throw new NiyavError('NIYAV_PASSWORD', `Use a password of at least ${MIN_PASSWORD_LENGTH} characters.`);
    if (chars === 0 || chars > MAX_PASSWORD_LENGTH) throw new NiyavError('NIYAV_PASSWORD', 'Enter the password for this backup.');
    // NFKC so the same password typed on another keyboard or device derives the same key.
    const normalised = typeof password.normalize === 'function' ? password.normalize('NFKC') : password;
    return prim.strToU8(normalised);
  };

  async function inflate(gz, maxBytes) {
    try { return await prim.gunzip(gz, maxBytes); } catch (error) {
      if (error && error.code === 'NIYAV_TOO_LARGE') throw error;
      throw new NiyavError('NIYAV_CORRUPT', 'This backup file is damaged and could not be read.');
    }
  }

  // text -> bytes. No password: standard gzip. With a password: protected envelope (see header comment).
  async function encode(text, { password, level, iterations = iterationsForLevel(level), maxBytes = MAX_PLAIN_BYTES, onProgress, signal } = {}) {
    if (typeof text !== 'string') throw new NiyavError('NIYAV_INPUT', 'Nothing to back up.');
    const plain = prim.strToU8(text);
    if (plain.length > maxBytes) throw new NiyavError('NIYAV_TOO_LARGE', 'The backup is larger than the 5 MB limit.');
    const gz = await prim.gzip(plain);
    if (password === undefined || password === null) return gz;

    if (!Number.isInteger(iterations) || iterations < MIN_ITERATIONS || iterations > MAX_ITERATIONS) {
      throw new NiyavError('NIYAV_INPUT', 'Unsafe key derivation settings.');
    }
    const pw = passwordBytes(password, { forWriting: true });
    const salt = prim.randomBytes(SALT_BYTES);
    const nonce = prim.randomBytes(NONCE_BYTES);
    const header = buildHeader(iterations, salt, nonce);
    const key = await prim.pbkdf2(pw, salt, iterations, KEY_BYTES, { onProgress, signal });
    try {
      const sealed = await prim.aesGcmEncrypt(key, nonce, header, gz);
      // Prove the file can be opened with the key already in memory (no second key derivation) before it is saved.
      const check = await prim.aesGcmDecrypt(key, nonce, header, sealed);
      if (!sameBytes(check, gz)) throw new NiyavError('NIYAV_SELFCHECK', 'The protected backup failed its own check and was not created.');
      return concat(header, sealed);
    } finally { key.fill(0); pw.fill(0); }
  }

  // bytes -> backup JSON text. Accepts plain JSON, gzip and protected files.
  async function decode(bytes, { password, maxBytes = MAX_PLAIN_BYTES, onProgress, signal } = {}) {
    const kind = sniff(bytes);
    if (kind === 'json') {
      const body = startsWith(bytes, [0xef, 0xbb, 0xbf]) ? bytes.subarray(3) : bytes;
      if (body.length > maxBytes) throw new NiyavError('NIYAV_TOO_LARGE', 'File exceeds 5 MB size limit.');
      return prim.strFromU8(body);
    }
    if (kind === 'gzip') return prim.strFromU8(await inflate(bytes, maxBytes));
    if (kind !== 'encrypted') throw new NiyavError('NIYAV_UNKNOWN', 'This file is not a Niyarvo backup.');

    const parsed = parseHeader(bytes);
    if (password === undefined || password === null) throw new NiyavError('NIYAV_NEEDS_PASSWORD', 'This backup is password protected.');
    const pw = passwordBytes(password, { forWriting: false });
    const key = await prim.pbkdf2(pw, parsed.salt, parsed.iterations, KEY_BYTES, { onProgress, signal });
    let gz;
    try {
      try { gz = await prim.aesGcmDecrypt(key, parsed.nonce, parsed.header, parsed.sealed); } catch {
        // GCM cannot tell a wrong password from a modified file, and the message should not pretend it can.
        throw new NiyavError('NIYAV_BAD_PASSWORD', 'Wrong password, or the file has been changed.');
      }
    } finally { key.fill(0); pw.fill(0); }
    return prim.strFromU8(await inflate(gz, maxBytes));
  }

  return { encode, decode, sniff };
}

module.exports = {
  createCodec, sniff, NiyavError,
  HEADER_BYTES, SALT_BYTES, NONCE_BYTES, TAG_BYTES, KEY_BYTES,
  LEVELS, DEFAULT_LEVEL, DEFAULT_ITERATIONS, iterationsForLevel, MIN_ITERATIONS, MAX_ITERATIONS, MIN_PASSWORD_LENGTH, MAX_PLAIN_BYTES,
};
