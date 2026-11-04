// /tests/store/backup-notices-0555.test.cjs
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createBackupJobController} = require('../../src/store/backupJobCore.cjs');
const {palette,contrast,ACCENTS} = require('../../src/ui/theme/themePalette.cjs');
const src = (p) => fs.readFileSync(path.resolve(__dirname, '../..', p), 'utf8');
function deps(opts={}) {
  let ready=null;
  return {
    markPending:async()=>{}, clearPending:async()=>{}, readPending:async()=>null,
    loadReady:async()=>ready,
    saveReady:async(name,bytes)=>ready={id:'a',name,bytes:bytes.length},
    shareReady:async()=>true, removeReady:async()=>{ready=null;},
    encode:opts.encode|| (async()=>new Uint8Array([78,73,89,86])),
    decode:opts.decode|| (async()=>'private JSON that must not appear in a notification'),
  };
}
test('completion and failures create routeable, nonsecret notices without storing passwords or plaintext',async()=>{
  const manager=createBackupJobController(deps());
  const events=[]; const unsubscribe=manager.subscribe(s=>{if(s.event)events.push(s.event)});
  await manager.startExport({filename:'project.niyav',text:'secret snapshot',password:'very-secret-pass',protected:true});
  assert.equal(manager.getState().event.action,'backup');
  assert.match(manager.getState().event.text,/ready to download/i);
  assert.equal(manager.getState().event.title, 'Backup ready');
  assert.equal(manager.getState().event.sticky,true);
  assert.doesNotMatch(JSON.stringify(manager.getState()),/very-secret-pass|secret snapshot/);
  await manager.startUnlock({bytes:new Uint8Array([1]),password:'very-secret-pass',purpose:'project',workspaceId:'a'});
  assert.match(manager.getState().event.text,/decrypted/i);
  assert.equal(manager.getState().event.title,'Decryption complete');
  assert.equal(manager.getState().decrypted.workspaceId,'a');
  assert.doesNotMatch(JSON.stringify(manager.getState()),/private JSON/);
  assert.notEqual(events[0].id,manager.getState().event.id);
  unsubscribe();
  const failing=createBackupJobController(deps({decode:async()=>{throw new Error('Wrong password, or the file has been changed.');}}));
  await failing.startUnlock({bytes:new Uint8Array([1]),password:'invalid',purpose:'project',workspaceId:'a'});
  assert.equal(failing.getState().event.type,'error');
  assert.equal(failing.getState().event.action,'backup');
  assert.match(failing.getState().event.text,/Wrong password/);
});
test('Island supports swipe dismissal, pull down to read more, accent background and opening Backup',()=>{
  const island=src('src/components/notice/IslandNotice.js');
  assert.match(island,/PanResponder\.create/);
  assert.match(island,/Math\.abs\(dx\) >= 48/);
  assert.match(island,/dy >= 42/);
  assert.match(island,/setFullText\(true\)/);
  assert.match(island,/onAction\(display\.action\)/);
  assert.match(island,/backgroundColor: c\.accent/);
  assert.match(island,/display\.sticky/);
  const app=src('src/app/ModernApp.js');
  assert.match(app,/AppState\.addEventListener\('change'/);
  assert.match(app,/queuedBackupEvent\.current/);
  assert.match(app,/onAction=\{action =>/);
  assert.match(app,/go\('settings', 'backup notice'\)/);
  const settings=src('src/screens/workspace/Workspace.js');
  assert.match(settings,/if \(backupRequest\) setTab\('backup'\)/);
});
test('retry after incorrect password retains selected ciphertext in memory, never the typed password',()=>{
  const ui=src('src/screens/workspace/Backup.js');
  const unlock=ui.slice(ui.indexOf('  const unlock=()=>'),ui.indexOf('  const applyDecrypted=()=>'));
  assert.match(unlock,/backupJobs\.startUnlock/);
  assert.doesNotMatch(unlock,/setLocked\(null\)/);
  assert.match(unlock,/setUnlockPw\(''\)/);
  assert.match(ui,/locked && !jobState\.running && !jobState\.decrypted/);
});
test('AMOLED follows user-specified deep-black surface multipliers and keeps controls readable',()=>{
  for(const accent of ACCENTS){
    const dark=palette(accent.id,'dark');
    const amoled=palette(accent.id,'amoled');
    const rgb=(hex)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
    for(const key of ['surface','surfaceAlt']){
      const a=rgb(amoled[key]),d=rgb(dark[key]);
      const factor=key==='surface'?.50:.35;
      assert.ok(a.every((ch,i)=>Math.abs(ch-Math.round(d[i]*factor))<=1),`${accent.id} ${key} follows user AMOLED multiplier`);
    }
    assert.equal(amoled.bg,'#000000');
    assert.ok(contrast(amoled.line,amoled.surface)>1.25,`${accent.id} visible card outline`);
    assert.ok(contrast(amoled.accent,amoled.accentInk)>=4.5,`${accent.id} button contrast`);
    assert.ok(contrast(amoled.ink,amoled.surface)>=4.5,`${accent.id} text contrast`);
  }
  assert.equal(palette('Amber','light').accent,'#FFA500');
  assert.equal(palette('Orange','light').accent,'#E65A19');
});
