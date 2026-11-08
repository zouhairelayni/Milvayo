// /src/cloud/localWriter.web.js
export async function acquireLocalWriter(localId) {
  return require('./localWriterCore.cjs').acquireLocalWriter(globalThis.navigator?.locks, localId);
}
