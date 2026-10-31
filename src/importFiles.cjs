'use strict';

// Native JSON transfer helpers. Keep file-provider handling out of the project model.
// expo-document-picker often returns an app-cache file:// URI, but Android providers
// can return a content:// URI. Only the provider-granted URI is accessed; the app
// never requests broad storage permission.
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const SAFE_NATIVE_URI = /^(file|content):\/\//i;

function userReadableImportError(error) {
  if (error && error.code === 'NP_IMPORT_ACCESS') return error.message;
  const message = String(error && error.message || error || 'Unknown error');
  if (/\bREAD\b.*permission|permission.*\bREAD\b|permission denied|EACCES|SecurityException|access denied|isn.t readable|FileSystemFile\.text|ExponentFileSystem\.readAsStringAsync/i.test(message)) {
    return 'Android could not read the selected document. Try selecting the JSON from the Downloads folder using the system picker, or import it from Niyarvo Projects Web. The current workspace has not changed.';
  }
  return message;
}

function validatePickedAsset(asset, maxBytes = MAX_IMPORT_BYTES) {
  if (!asset || typeof asset.uri !== 'string' || !SAFE_NATIVE_URI.test(asset.uri)) {
    throw new Error('The selected document has no supported local file address. Choose a JSON file through the system Files picker.');
  }
  if (typeof asset.size === 'number' && asset.size > maxBytes) {
    throw new Error('File exceeds 5 MB size limit.');
  }
  return asset;
}

async function readPickedJsonAsset(asset, options) {
  const {legacy, fileFactory, maxBytes = MAX_IMPORT_BYTES} = options || {};
  validatePickedAsset(asset, maxBytes);
  if (!legacy || typeof legacy.readAsStringAsync !== 'function') {
    throw new Error('Native file reader is unavailable.');
  }
  let tempUri;
  let text;
  const isContentUri = /^content:\/\//i.test(asset.uri);
  try {
    let readableUri = asset.uri;
    if (isContentUri) {
      if (!legacy.cacheDirectory || typeof legacy.copyAsync !== 'function') {
        throw new Error('Android document caching is unavailable.');
      }
      tempUri = `${legacy.cacheDirectory}niyarvo-import-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
      // The Android Storage Access Framework grants temporary access to content://.
      // Legacy copyAsync supports content:// -> private file://; readAsStringAsync
      // does not read arbitrary content:// URIs directly.
      await legacy.copyAsync({from: asset.uri, to: tempUri});
      readableUri = tempUri;
    }
    // Check the readable private copy as well (picked-file size is optional).
    if (typeof legacy.getInfoAsync === 'function') {
      // Metadata is optional; some Android providers deny stat while the
      // picker-granted file is still readable. The text-length guard below
      // remains mandatory if the metadata lookup is unavailable.
      let info;
      try { info = await legacy.getInfoAsync(readableUri); } catch { info = null; }
      if (info && typeof info.size === 'number' && info.size > maxBytes) {
        throw new Error('File exceeds 5 MB size limit.');
      }
    }
    try {
      text = await legacy.readAsStringAsync(readableUri, {encoding: 'utf8'});
    } catch (legacyError) {
      // Some Expo SDKs expose a working File.text() path even if the legacy
      // reader fails. Only retry a private/local file, never a content:// URI.
      if (!fileFactory || !/^file:\/\//i.test(readableUri)) throw legacyError;
      try { text = await fileFactory(readableUri).text(); }
      catch { throw legacyError; }
    }
    if (typeof text !== 'string') throw new Error('The selected file did not contain readable text.');
    if (text.length > maxBytes) throw new Error('File exceeds 5 MB size limit.');
    return text;
  } catch (error) {
    if (error && /exceeds 5 MB/.test(error.message)) throw error;
    throw new Error(userReadableImportError(error));
  } finally {
    // Never delete the original user-selected document. Delete only our copy.
    if (tempUri && typeof legacy.deleteAsync === 'function') {
      try { await legacy.deleteAsync(tempUri, {idempotent:true}); } catch { /* cache cleanup is best-effort */ }
    }
  }
}


/**
 * SDK 58's File.pickFileAsync opens Android's Storage Access Framework picker
 * and returns a native File backed by the provider-granted URI. Unlike
 * DocumentPicker's cached `file://` path inside Expo Go, this does not depend
 * on the DocumentPicker cache being readable by a different native module.
 * A cancel returns null, never a malformed document or a write.
 *
 * API dependencies are injected to test both the new and old return shapes.
 */
async function pickAndroidJsonText(fileClass, maxBytes = MAX_IMPORT_BYTES) {
  if (!fileClass || typeof fileClass.pickFileAsync !== 'function') {
    const error = new Error('System file picker is not available in this Expo build.');
    error.code = 'NP_PICKER_UNAVAILABLE';
    throw error;
  }
  let result;
  try {
    result = await fileClass.pickFileAsync({mimeTypes: ['*/*'], multipleFiles: false});
  } catch (error) {
    if (/cancelled|canceled|user canceled/i.test(String(error?.message || error))) return null;
    throw new Error(userReadableImportError(error));
  }
  if (result === null || result === undefined || result.canceled) return null;
  // SDK 58 provides {canceled:false,result:File}; older overloads returned File.
  const file = result.result || result;
  if (Array.isArray(file) || !file || typeof file.text !== 'function') {
    throw new Error('The system picker did not return a readable document.');
  }
  // Size metadata is advisory: some providers reject stat even when read works.
  let declaredSize;
  try { declaredSize = file.size; } catch { declaredSize = undefined; }
  if (typeof declaredSize === 'number' && declaredSize > maxBytes) {
    throw new Error('File exceeds 5 MB size limit.');
  }
  try {
    const text = await file.text();
    if (typeof text !== 'string') throw new Error('Selected document is not text.');
    if (text.length > maxBytes) throw new Error('File exceeds 5 MB size limit.');
    return text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
  } catch (error) {
    if (/exceeds 5 MB/.test(String(error?.message || ''))) throw error;
    throw new Error(userReadableImportError(error));
  }
}

module.exports = {MAX_IMPORT_BYTES, validatePickedAsset, readPickedJsonAsset, pickAndroidJsonText, userReadableImportError};
