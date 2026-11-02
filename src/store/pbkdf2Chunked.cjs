// /src/store/pbkdf2Chunked.cjs
'use strict';
const { NiyavError } = require('./niyav.cjs');

// PBKDF2-HMAC-SHA256 for ONE 32-byte block (all .niyav files use dkLen 32), run in short slices.
// Between slices it waits on a timer (a macrotask), so taps and screen changes are handled while the key is
// derived. @noble's pbkdf2Async only yields on a microtask, which never lets the phone process a touch.
// `mac(message)` is HMAC-SHA256 keyed with the password, injected so this file is tested against Node's crypto.
// shortcut: dkLen above 32 is refused, add block counters if a longer key is ever needed.
const wait = () => new Promise((resolve) => setTimeout(resolve, 0));

async function pbkdf2Chunked(mac, salt, iterations, dkLen, { onProgress, signal, tick = wait, sliceMs = 16 } = {}) {
  if (dkLen > 32) throw new NiyavError('NIYAV_INPUT', 'Unsupported key length.');
  const stop = () => { if (signal && signal.aborted) throw new NiyavError('NIYAV_CANCELLED', 'Cancelled.'); };
  stop();
  const first = new Uint8Array(salt.length + 4);
  first.set(salt); first[first.length - 1] = 1;
  let u = mac(first);
  const t = u.slice();
  let last = Date.now();
  for (let i = 1; i < iterations; i++) {
    u = mac(u);
    for (let j = 0; j < 32; j++) t[j] ^= u[j];
    if (i % 100 === 0 && Date.now() - last >= sliceMs) {
      if (onProgress) onProgress(i / iterations);
      await tick();
      stop();
      last = Date.now();
    }
  }
  if (onProgress) onProgress(1);
  return t.slice(0, dkLen);
}

module.exports = { pbkdf2Chunked };
