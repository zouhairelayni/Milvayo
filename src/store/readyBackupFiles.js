// /src/store/readyBackupFiles.js
import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Only completed ciphertext is retained. The document directory (unlike cache) survives normal app restarts.
const READY_KEY = 'niyarvo.readyEncryptedBackup.v1';
const PENDING_KEY = 'niyarvo.backupPending.v1';
const FILE_PREFIX = 'niyarvo-ready-';
let webReady = null;
const safeName = (name) => String(name || 'niyarvo-backup.niyav').replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 120);
const valid = (m) => !!(m && typeof m.id === 'string' && /^[0-9]+-[0-9]+$/.test(m.id) &&
  typeof m.name === 'string' && m.name.endsWith('.niyav') && m.name.length < 128 &&
  typeof m.file === 'string' && /^niyarvo-ready-[0-9]+-[0-9]+\.niyav$/.test(m.file) &&
  m.protected === true && Number.isInteger(m.bytes) && m.bytes > 0 && m.bytes <= 6 * 1024 * 1024);
const nativeFile = (meta) => new File(Paths.document, meta.file);
let serial = 0;
export async function loadReady() {
  if (Platform.OS === 'web') return webReady && webReady.meta;
  const raw = await AsyncStorage.getItem(READY_KEY);
  if (!raw) return null;
  let meta;
  try { meta = JSON.parse(raw); } catch { await AsyncStorage.removeItem(READY_KEY); return null; }
  if (!valid(meta) || !nativeFile(meta).exists) { await AsyncStorage.removeItem(READY_KEY); return null; }
  return meta;
}
export async function saveReady(name, bytes, { protected: isProtected, signal } = {}) {
  if (!isProtected) throw new Error('Only encrypted backups may be retained for later download.');
  if (!(bytes instanceof Uint8Array) || bytes.length < 56 || bytes.length > 6 * 1024 * 1024)
    throw new Error('The completed encrypted backup has an invalid size.');
  if (bytes[0] !== 0x4e || bytes[1] !== 0x49 || bytes[2] !== 0x59 || bytes[3] !== 0x56 || bytes[4] !== 1)
    throw new Error('Refusing to persist an unencrypted or unsupported backup.');
  const id = `${Date.now()}-${++serial}`;
  const file = `${FILE_PREFIX}${id}.niyav`;
  const meta = { id, name: safeName(name), file, bytes: bytes.length, protected: !!isProtected, at: new Date().toISOString() };
  if (Platform.OS === 'web') {
    if (signal && signal.aborted) throw new Error('Cancelled.');
    webReady = { meta, data: bytes };
    return meta;
  }
  const old = await loadReady();
  const dest = nativeFile(meta);
  dest.create();
  try {
    await dest.write(bytes);
    if (signal && signal.aborted) throw new Error('Cancelled.');
    await AsyncStorage.setItem(READY_KEY, JSON.stringify(meta));
    if (old) { try { nativeFile(old).delete(); } catch {} }
    return meta;
  } catch (error) {
    try { dest.delete(); } catch {}
    throw error;
  }
}
export async function shareReady(meta) {
  if (!valid(meta)) throw new Error('Invalid saved backup metadata.');
  if (Platform.OS === 'web') {
    if (!webReady || webReady.meta.id !== meta.id) throw new Error('This backup is no longer available. Create it again.');
    const url = URL.createObjectURL(new Blob([webReady.data], { type: 'application/octet-stream' }));
    const link = document.createElement('a');
    link.href = url; link.download = meta.name;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    return true;
  }
  const file = nativeFile(meta);
  if (!file.exists) throw new Error('Saved backup file was not found. Create a new backup.');
  if (!await Sharing.isAvailableAsync()) throw new Error('System sharing is unavailable on this device.');
  await Sharing.shareAsync(file.uri, { mimeType: 'application/octet-stream', dialogTitle: meta.name, UTI: 'public.data' });
  return true;
}
export async function removeReady(meta) {
  if (!valid(meta)) return;
  if (Platform.OS === 'web') {
    if (webReady && webReady.meta.id === meta.id) webReady = null;
    return;
  }
  const current = await loadReady();
  if (current && current.id === meta.id) await AsyncStorage.removeItem(READY_KEY);
  try { const file = nativeFile(meta); if (file.exists) file.delete(); } catch {}
}
export const markPending = (job) => AsyncStorage.setItem(PENDING_KEY, JSON.stringify({ kind: job.kind, at: job.startedAt }));
export const clearPending = () => AsyncStorage.removeItem(PENDING_KEY);
export async function readPending() {
  const raw = await AsyncStorage.getItem(PENDING_KEY);
  if (!raw) return null;
  try { const value = JSON.parse(raw); return value && ['encrypt', 'decrypt'].includes(value.kind) ? value : null; }
  catch { return null; }
}
