// /src/store/backupJobCore.cjs
'use strict';

// An in-process job host: switching screens must never cancel a backup.
// Only finished, password-encrypted .niyav bytes may be persisted; passwords, derived keys,
// source JSON and decrypted import text are intentionally never persisted.
function createBackupJobController(deps) {
  const listeners = new Set();
  const state = { running: null, ready: null, decrypted: null, interrupted: null, error: null, event: null };
  let active = null;
  let decryptedText = null;
  let hydrated = false;
  let sequence = 0;
  const snapshot = () => ({ ...state, running: state.running && { ...state.running } });
  const emit = () => { const value = snapshot(); for (const listener of listeners) listener(value); };
  const finishNotice = (text, type = 'success', title = 'Backup update') => { state.event = { id: `backup-${++sequence}`, title, text, type, action: 'backup', sticky: true }; };
  const subscribe = (listener) => { listeners.add(listener); listener(snapshot()); return () => listeners.delete(listener); };
  const cancelled = () => Object.assign(new Error('Cancelled. No backup file was created or opened.'), { code: 'NIYAV_CANCELLED' });
  async function hydrate() {
    if (hydrated) return;
    hydrated = true;
    try {
      const [ready, pending] = await Promise.all([deps.loadReady(), deps.readPending()]);
      // Loading old metadata must never overwrite a newer backup started while IO was pending.
      if (!state.ready) state.ready = ready || null;
      if (!active && pending) state.interrupted = 'The previous backup operation was interrupted. Start it again; no password or plaintext was saved.';
      emit();
    } catch (e) { state.error = `Saved backup status could not be loaded: ${e.message}`; emit(); }
  }
  function start(kind, args) {
    if (active) throw new Error('Another backup or unlock is already in progress.');
    if (kind !== 'encrypt' && kind !== 'decrypt') throw new Error('Unsupported backup job.');
    if (kind === 'encrypt' && (!args.protected || typeof args.password !== 'string')) throw new Error('Persistent backups require password protection.');
    const id = ++sequence;
    const controller = new AbortController();
    active = { id, controller };
    state.running = { kind, progress: 0, label: kind === 'encrypt' ? 'Encrypting backup' : 'Decrypting backup' };
    state.interrupted = null;
    state.error = null;
    if (kind === 'decrypt') { decryptedText = null; state.decrypted = null; }
    emit();
    const onProgress = (n) => {
      if (!active || active.id !== id) return;
      const pct = Math.max(0, Math.min(1, Number(n) || 0));
      if (pct === 1 || pct - state.running.progress >= 0.01) { state.running = { ...state.running, progress: pct }; emit(); }
    };
    // Keep the operation owned by this singleton, not by any mounted screen. Deliberately do not
    // persist the password or a resumable KDF intermediate; Android can suspend JS in background.
    const completion = (async () => {
      try {
        await deps.markPending({ kind, startedAt: new Date().toISOString() });
        if (controller.signal.aborted) throw cancelled();
        if (kind === 'encrypt') {
          let bytes = await deps.encode(args.text, { password: args.password, level: args.level, signal: controller.signal, onProgress });
          if (controller.signal.aborted) throw cancelled();
          const ready = await deps.saveReady(args.filename, bytes, { protected: !!args.protected, signal: controller.signal });
          bytes = null;
          // Once an encrypted file has committed, keep it even if Cancel raced with the final write.
          state.ready = ready;
          finishNotice('Encrypted backup ready to download. Open Backup to save or share the file.', 'success', 'Backup ready');
        } else {
          const text = await deps.decode(args.bytes, { password: args.password, signal: controller.signal, onProgress });
          if (controller.signal.aborted) throw cancelled();
          decryptedText = text;
          state.decrypted = { purpose: args.purpose, workspaceId: args.workspaceId };
          finishNotice('Backup decrypted. Open Backup to review the data before importing or restoring.', 'success', 'Decryption complete');
        }
      } catch (error) {
        if (error && error.code !== 'NIYAV_CANCELLED') {
          state.error = error && error.message ? error.message : 'Backup operation failed.';
          finishNotice(`${kind === 'encrypt' ? 'Encryption' : 'Decryption'} failed: ${state.error}`, 'error', 'Backup failed');
        } else if (error && error.code === 'NIYAV_CANCELLED') {
          finishNotice('Backup operation cancelled; no new file was produced.', 'info', 'Backup cancelled');
        }
      } finally {
        // Ignore storage-clear errors here; pending metadata is nonsecret and the file is not marked
        // ready until the encrypted bytes are safely written.
        try { await deps.clearPending(); } catch {}
        if (active && active.id === id) { active = null; state.running = null; }
        emit();
      }
    })();
    return completion;
  }
  const startExport = (args) => start('encrypt', args);
  const startUnlock = (args) => start('decrypt', args);
  const cancel = () => { if (active) active.controller.abort(); };
  const getDecrypted = () => decryptedText == null || !state.decrypted ? null : { ...state.decrypted, text: decryptedText };
  const discardDecrypted = () => { decryptedText = null; state.decrypted = null; emit(); };
  async function shareReady() {
    if (!state.ready) throw new Error('No completed encrypted backup is available.');
    return deps.shareReady(state.ready);
  }
  async function discardReady() {
    if (!state.ready) return;
    const old = state.ready;
    // Only clear the visible result after successful cleanup, so storage failures don't hide a usable backup.
    await deps.removeReady(old);
    if (state.ready === old) { state.ready = null; emit(); }
  }
  return { getState: snapshot, subscribe, hydrate, startExport, startUnlock, cancel, getDecrypted, discardDecrypted, shareReady, discardReady };
}

module.exports = { createBackupJobController };
