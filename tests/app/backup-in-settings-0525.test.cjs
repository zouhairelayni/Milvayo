// /tests/app/backup-in-settings-0525.test.cjs
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = (f) => fs.readFileSync(path.join(__dirname, '../..', f), 'utf8');

test('Backup is a tab of Settings and no longer a menu route', () => {
  const app = read('src/app/ModernApp.js');
  assert.doesNotMatch(app, /\['backup'/);
  assert.doesNotMatch(app, /backup: Backup/);
  const settings = read('src/screens/workspace/Workspace.js').split('export function Settings')[1];
  assert.match(settings, /value:'backup',label:'Backup'/);
  assert.match(settings, /tab==='backup'\?<Backup\/>/);
  assert.doesNotMatch(read('src/screens/workspace/Backup.js'), /<Page /, 'Settings owns the page');
});
test('only the Back up button is accent coloured on the Backup tab', () => {
  const src = read('src/screens/workspace/Backup.js');
  const buttons = src.match(/<Button [^>]*>/g) || [];
  const primary = buttons.filter((b) => !/variant=/.test(b));
  assert.equal(primary.length, 3, 'backup, download-ready and decrypted-import actions are primary');
  assert.ok(primary.some(b=>/Back up/.test(b)));
  assert.ok(primary.some(b=>/Download backup/.test(b)));
  assert.ok(primary.some(b=>/Import decrypted project/.test(b)));
});
test('backup scope: Project or Workspace, each with its own dropdown, and the chosen project is exported', () => {
  const src = read('src/screens/workspace/Backup.js');
  assert.match(src, /value: 'project', label: 'Project'/);
  assert.match(src, /value: 'workspace', label: 'Workspace'/);
  assert.equal((src.match(/<Dropdown /g) || []).length, 2);
  assert.match(src, /backupText\(all,\{snapshots:withSnapshots,projectId\}\)/);
  const store = read('src/store/store.js');
  assert.match(store, /options&&options\.projectId\?w\.projects\.find\(x=>x\.id===options\.projectId\):current\(w\)/);
  assert.match(store, /throw Error\('Project not found'\)/);
});
test('a running encryption shows progress and explicit Cancel while screen navigation retains the job', () => {
  const src = read('src/screens/workspace/Backup.js');
  assert.match(src, /<Bar value=\{jobState\.running\.progress \|\| 0\} \/>/);
  assert.match(src, /label="Cancel operation" small variant="secondary" onPress=\{backupJobs\.cancel\}/);
  assert.doesNotMatch(src, /abortRef\.current\.abort/);
  assert.match(src, /backupJobs\.startExport/);
});
test('Specifications offers add, edit and delete', () => {
  const src = read('src/screens/management/Management.js');
  assert.match(src, /saveSpec\(kind,\{\.\.\.d,id:entry\?\.id\}\)/);
  assert.match(src, /deleteSpec\(kind,entry\.id\)/);
  assert.match(src, /Add \$\{model\.specifications\.KINDS\[kind\]\.label\}/);
  const store = read('src/store/store.js');
  assert.match(store, /saveSpec:\(kind,entry\)=>/);
  assert.match(store, /deleteSpec:\(kind,id\)=>/);
});
