// /src/store/importFiles.cjs
'use strict';

// Native JSON transfer helpers. Keep file-provider handling out of the project model.
// expo-document-picker often returns an app-cache file:// URI, but Android providers
// can return a content:// URI. Only the provider-granted URI is accessed; the app
// never requests broad storage permission.
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

// UTF-8 size of a string without TextEncoder or Blob (not guaranteed in every runtime). A code unit is at most 3 bytes, so short strings skip the loop.
function utf8Bytes(text) {
  let n = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c < 0x80) n += 1;
    else if (c < 0x800) n += 2;
    else if (c >= 0xD800 && c <= 0xDBFF && (text.charCodeAt(i + 1) & 0xFC00) === 0xDC00) { n += 4; i++; }
    else n += 3;
  }
  return n;
}
const tooBig = (text, maxBytes = MAX_IMPORT_BYTES) => text.length > maxBytes || (text.length * 3 > maxBytes && utf8Bytes(text) > maxBytes);

function userReadableImportError(error) {
  if (error && error.code === 'NP_IMPORT_ACCESS') return error.message;
  const message = String(error && error.message || error || 'Unknown error');
  if (/\bREAD\b.*permission|permission.*\bREAD\b|permission denied|EACCES|SecurityException|access denied|isn.t readable|FileSystemFile\.text|ExponentFileSystem\.readAsStringAsync/i.test(message)) {
    return 'The selected file could not be read. Check its access permissions and try again. On Android, choose it from Downloads using the system picker. Your workspace has not changed.';
  }
  return message;
}

// Non-Android native path (iOS): DocumentPicker result -> text. FileClass is injected so tests can fake it.
async function pickDocumentJsonText(selection, FileClass, maxBytes = MAX_IMPORT_BYTES) {
  if (!selection || selection.canceled || !selection.assets?.length) return null;
  const asset = selection.assets[0];
  if (!asset.name?.toLowerCase().endsWith('.json')) throw new Error('Choose a .json file.');
  if (asset.size > maxBytes) throw new Error('File exceeds 5 MB size limit.');
  const text = await new FileClass(asset.uri).text();
  if (tooBig(text, maxBytes)) throw new Error('File exceeds 5 MB size limit.');
  return text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
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
// Shared by the text and byte readers: opens the system picker and returns the provider-granted File, or null.
async function pickAndroidFile(fileClass, maxBytes, method) {
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
  if (Array.isArray(file) || !file || typeof file[method] !== 'function') {
    throw new Error('The system picker did not return a readable document.');
  }
  // Size metadata is advisory: some providers reject stat even when read works.
  let declaredSize;
  try { declaredSize = file.size; } catch { declaredSize = undefined; }
  if (typeof declaredSize === 'number' && declaredSize > maxBytes) {
    throw new Error('File exceeds 5 MB size limit.');
  }
  return file;
}

async function pickAndroidJsonText(fileClass, maxBytes = MAX_IMPORT_BYTES) {
  const file = await pickAndroidFile(fileClass, maxBytes, 'text');
  if (!file) return null;
  try {
    const text = await file.text();
    if (typeof text !== 'string') throw new Error('Selected document is not text.');
    if (tooBig(text, maxBytes)) throw new Error('File exceeds 5 MB size limit.');
    return text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
  } catch (error) {
    if (/exceeds 5 MB/.test(String(error?.message || ''))) throw error;
    throw new Error(userReadableImportError(error));
  }
}

// Same picker, raw bytes: needed for .niyav (gzip or password protected), which is not text.
async function pickAndroidFileBytes(fileClass, maxBytes = MAX_IMPORT_BYTES) {
  const file = await pickAndroidFile(fileClass, maxBytes, 'bytes');
  if (!file) return null;
  try {
    const bytes = await file.bytes();
    if (!(bytes instanceof Uint8Array)) throw new Error('Selected document could not be read.');
    if (bytes.length > maxBytes) throw new Error('File exceeds 5 MB size limit.');
    return bytes;
  } catch (error) {
    if (/exceeds 5 MB/.test(String(error?.message || ''))) throw error;
    throw new Error(userReadableImportError(error));
  }
}

// iOS: DocumentPicker result -> bytes. Accepts .json and .niyav.
async function pickDocumentFileBytes(selection, FileClass, maxBytes = MAX_IMPORT_BYTES) {
  if (!selection || selection.canceled || !selection.assets?.length) return null;
  const asset = selection.assets[0];
  if (!/\.(json|niyav)$/i.test(asset.name || '')) throw new Error('Choose a .json or .niyav file.');
  if (asset.size > maxBytes) throw new Error('File exceeds 5 MB size limit.');
  const bytes = await new FileClass(asset.uri).bytes();
  if (!(bytes instanceof Uint8Array)) throw new Error('Selected document could not be read.');
  if (bytes.length > maxBytes) throw new Error('File exceeds 5 MB size limit.');
  return bytes;
}

// JSON.parse('null') succeeds, so reject non-objects before callers read .format.
function parseBackupJson(text) {
  let value;
  try { value = JSON.parse(text); } catch {
    const error = new Error('This JSON file is malformed or damaged. Check the file and try again.');
    error.code = 'BACKUP_JSON_CORRUPT';
    throw error;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    const error = new Error('This file does not contain a valid Milvayo backup. Choose a project or complete workspace backup.');
    error.code = 'BACKUP_STRUCTURE';
    throw error;
  }
  return value;
}

module.exports = {MAX_IMPORT_BYTES, parseBackupJson, tooBig, utf8Bytes, pickAndroidJsonText, pickAndroidFileBytes, pickDocumentJsonText, pickDocumentFileBytes, userReadableImportError};
