// /src/store/backupJobs.js
import { niyavCodec } from './niyavPrimitives';
import { loadReady, saveReady, shareReady, removeReady, markPending, clearPending, readPending } from './readyBackupFiles';
const { createBackupJobController } = require('./backupJobCore.cjs');

// Module singleton: changing tabs or unmounting Backup does NOT abort work.
// Expo Go may suspend the JS runtime after the OS backgrounds the app. A pending job then resumes
// only if the process survives; a terminated job is reported interrupted, never silently resumed
// with a stored password. Proper uninterrupted processing requires a native foreground service.
export const backupJobs = createBackupJobController({
  encode: niyavCodec.encode,
  decode: niyavCodec.decode,
  saveReady, loadReady, shareReady, removeReady, markPending, clearPending, readPending,
});
