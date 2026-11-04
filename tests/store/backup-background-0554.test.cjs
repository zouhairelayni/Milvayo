// /tests/store/backup-background-0554.test.cjs
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createBackupJobController } = require('../../src/store/backupJobCore.cjs');

const source = (p) => fs.readFileSync(path.join(__dirname, '../..', p), 'utf8');
const barrier = () => {
  let release;
  const promise = new Promise((resolve) => { release = resolve; });
  return { promise, release };
};
function backend(options = {}) {
  const disk = { ready: null, pending: null, data: null };
  const calls = { saves: 0, shares: 0, removes: 0 };
  const deps = {
    loadReady: async () => disk.ready,
    readPending: async () => disk.pending,
    markPending: async (x) => { disk.pending = x; },
    clearPending: async () => { disk.pending = null; },
    encode: options.encode || (async (text, { password }) => { assert.equal(password, 'long-secure-password'); return new TextEncoder().encode(`CIPHERTEXT:${text.length}`); }),
    decode: options.decode || (async (bytes, { password }) => { assert.equal(password, 'long-secure-password'); return '{"project":"private"}'; }),
    saveReady: async (name, bytes, { protected: isProtected, signal }) => {
      if (signal.aborted) throw Object.assign(new Error('Cancelled'), { code: 'NIYAV_CANCELLED' });
      calls.saves++;
      disk.data = bytes;
      disk.ready = { id: '12-1', name, file: 'niyarvo-ready-12-1.niyav', bytes: bytes.length, protected: isProtected };
      return disk.ready;
    },
    shareReady: async (x) => { assert.equal(x.id, disk.ready.id); calls.shares++; return true; },
    removeReady: async (x) => { calls.removes++; if (disk.ready && disk.ready.id === x.id) { disk.ready = null; disk.data = null; } },
  };
  return { disk, calls, deps };
}
test('encryption survives screen unsubscribe and retains only completed ciphertext for later download', async () => {
  const {disk,calls,deps} = backend({ encode: async (text, { password, signal, onProgress }) => {
    assert.equal(password, 'long-secure-password'); assert.equal(text,'confidential project');
    onProgress(0.5); await gate.promise;
    assert.equal(signal.aborted, false);
    return new TextEncoder().encode('SAFE-CIPHERTEXT');
  }});
  const gate = barrier();
  const controller = createBackupJobController(deps);
  const changes = [];
  const unmount = controller.subscribe(s => changes.push(s));
  const op = controller.startExport({ text:'confidential project', password:'long-secure-password', protected:true, filename:'project.niyav' });
  unmount(); // equivalent to navigating from Backup to Board/Timeline
  assert.ok(controller.getState().running);
  gate.release(); await op;
  assert.equal(controller.getState().running, null);
  assert.equal(controller.getState().ready.name, 'project.niyav');
  assert.equal(controller.getState().ready.protected, true);
  assert.equal(disk.data.toString(), new TextEncoder().encode('SAFE-CIPHERTEXT').toString());
  assert.doesNotMatch(JSON.stringify(disk.ready),/password|confidential project/);
  // Remounting in the same process AND a fresh job manager can find the encrypted file.
  const rehydrated = createBackupJobController(deps); await rehydrated.hydrate();
  assert.equal(rehydrated.getState().ready.id, '12-1');
  await rehydrated.shareReady(); assert.equal(calls.shares,1);
  await rehydrated.discardReady(); assert.equal(disk.ready,null);
});

test('decryption runs outside screen and requires explicit import; plaintext is never persisted', async () => {
  const gate = barrier();
  const {disk,deps} = backend({ decode: async (_bytes,{onProgress}) => {
    onProgress(0.4); await gate.promise; return '{"private":"decrypted"}';
  }});
  const controller = createBackupJobController(deps);
  const op = controller.startUnlock({ bytes:new Uint8Array([1,2,3]), password:'long-secure-password', purpose:'project', workspaceId:'workspace-a' });
  assert.equal(controller.getDecrypted(),null);
  gate.release(); await op;
  assert.equal(controller.getState().decrypted.workspaceId,'workspace-a');
  assert.equal(controller.getDecrypted().text,'{"private":"decrypted"}');
  assert.equal(disk.data,null);
  assert.equal(disk.pending,null);
  controller.discardDecrypted();
  assert.equal(controller.getDecrypted(),null);
});

test('single-flight guard, cancellation and failures do not create false ready files', async () => {
  const {disk,calls,deps} = backend({ encode: async (_text,{signal}) => {
    await Promise.resolve();
    if(signal.aborted) throw Object.assign(new Error('Cancelled'),{code:'NIYAV_CANCELLED'});
    throw new Error('KDF failure');
  }});
  const controller = createBackupJobController(deps);
  const op = controller.startExport({text:'secret',password:'long-secure-password',protected:true,filename:'a.niyav'});
  assert.throws(()=>controller.startExport({text:'x',password:'long-secure-password',protected:true,filename:'b.niyav'}),/already in progress/);
  controller.cancel(); await op;
  assert.equal(controller.getState().ready,null);
  assert.equal(controller.getState().error,null);
  assert.equal(calls.saves,0);
  assert.equal(disk.pending,null);
  const op2 = controller.startExport({text:'secret',password:'long-secure-password',protected:true,filename:'b.niyav'});
  await op2;
  assert.match(controller.getState().error,/KDF failure/);
  assert.equal(calls.saves,0);
});

test('cold restart reports interrupted operation without storing a password or silently resuming', async () => {
  const {disk,deps} = backend();
  disk.pending = {kind:'encrypt',startedAt:'2026-11-03T00:00:00.000Z'};
  const controller = createBackupJobController(deps);
  await controller.hydrate();
  assert.match(controller.getState().interrupted,/interrupted/);
  assert.equal(controller.getState().running,null);
  assert.equal(controller.getState().ready,null);
  assert.equal(controller.getDecrypted(),null);
});

test('source enforces durable encrypted-only downloads and no unmount cancellation', () => {
  const ui = source('src/screens/workspace/Backup.js');
  const jobs = source('src/store/backupJobs.js');
  const storage = source('src/store/readyBackupFiles.js');
  assert.match(ui,/backupJobs\.startExport/);
  assert.match(ui,/backupJobs\.startUnlock/);
  assert.match(ui,/Download backup/);
  assert.match(ui,/backupJobs\.subscribe/);
  assert.doesNotMatch(ui,/leaving this screen cancels it/);
  assert.match(jobs,/module singleton/i);
  assert.match(storage,/Paths\.document/);
  assert.match(storage,/await dest\.write\(bytes\)/);
  assert.match(storage,/Sharing\.shareAsync\(file\.uri/);
  assert.doesNotMatch(storage,/setItem\([^\n]*password/);
  assert.doesNotMatch(storage,/setItem\([^\n]*plaintext/);
});
