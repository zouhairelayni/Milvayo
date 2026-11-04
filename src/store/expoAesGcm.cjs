// /src/store/expoAesGcm.cjs
'use strict';

// Expo SDK 58 native AES-GCM adapter. No bespoke encryption implementation or browser polyfill.
// .niyav v1 stores ciphertext || 16-byte tag, with its 12-byte nonce in the header.
// The entire 40-byte header is authenticated as AAD. Both are identical to older backups.
function createExpoAesGcm(crypto) {
  const bytes = (value) => new Uint8Array(value);
  const check = (key, nonce, aad) => {
    if (!(key instanceof Uint8Array) || key.length !== 32) throw new TypeError('AES-256 requires a 32-byte key');
    if (!(nonce instanceof Uint8Array) || nonce.length !== 12) throw new TypeError('AES-GCM requires a 12-byte nonce');
    if (!(aad instanceof Uint8Array)) throw new TypeError('AES-GCM additional data must be bytes');
  };
  async function encrypt(key, nonce, aad, plaintext) {
    check(key, nonce, aad);
    if (!(plaintext instanceof Uint8Array)) throw new TypeError('Plaintext must be bytes');
    const nativeKey = await crypto.AESEncryptionKey.import(key);
    const sealed = await crypto.aesEncryptAsync(plaintext, nativeKey, {
      nonce: { bytes: nonce }, additionalData: aad, tagLength: 16,
    });
    return bytes(await sealed.ciphertext({ encoding: 'bytes', includeTag: true }));
  }
  async function decrypt(key, nonce, aad, ciphertextAndTag) {
    check(key, nonce, aad);
    if (!(ciphertextAndTag instanceof Uint8Array) || ciphertextAndTag.length < 16)
      throw new TypeError('Missing AES-GCM authentication tag');
    const nativeKey = await crypto.AESEncryptionKey.import(key);
    const sealed = crypto.AESSealedData.fromParts(nonce, ciphertextAndTag, 16);
    return bytes(await crypto.aesDecryptAsync(sealed, nativeKey, { additionalData: aad, output: 'bytes' }));
  }
  return { encrypt, decrypt };
}

module.exports = { createExpoAesGcm };
