// /tests/helpers/niyavNodePrimitives.cjs
'use strict';
// Reference primitives for tests: Node's own zlib and crypto implement the same standards the app uses
// (gzip, PBKDF2-HMAC-SHA256, AES-256-GCM), so a file made with one reads with the other.
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const { NiyavError } = require('../../src/store/niyav.cjs');

module.exports = {
  strToU8: (s) => new Uint8Array(Buffer.from(s, 'utf8')),
  strFromU8: (u8) => Buffer.from(u8).toString('utf8'),
  gzip: (u8) => new Uint8Array(zlib.gzipSync(u8, { level: 9 })),
  gunzip: (u8, maxBytes) => {
    try { return new Uint8Array(zlib.gunzipSync(u8, { maxOutputLength: maxBytes })); } catch (error) {
      if (error.code === 'ERR_BUFFER_TOO_LARGE') throw new NiyavError('NIYAV_TOO_LARGE', 'File exceeds 5 MB size limit.');
      throw error;
    }
  },
  pbkdf2: (pw, salt, iterations, dkLen) => new Promise((resolve, reject) => crypto.pbkdf2(pw, salt, iterations, dkLen, 'sha256', (e, key) => (e ? reject(e) : resolve(new Uint8Array(key))))),
  aesGcmEncrypt: (key, nonce, aad, plain) => {
    const c = crypto.createCipheriv('aes-256-gcm', key, nonce); c.setAAD(aad);
    return new Uint8Array(Buffer.concat([c.update(plain), c.final(), c.getAuthTag()]));
  },
  aesGcmDecrypt: (key, nonce, aad, sealed) => {
    const d = crypto.createDecipheriv('aes-256-gcm', key, nonce); d.setAAD(aad);
    d.setAuthTag(sealed.subarray(sealed.length - 16));
    return new Uint8Array(Buffer.concat([d.update(sealed.subarray(0, sealed.length - 16)), d.final()]));
  },
  randomBytes: (n) => new Uint8Array(crypto.randomBytes(n)),
};
