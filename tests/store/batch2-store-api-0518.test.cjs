// /tests/store/batch2-store-api-0518.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
test('unused store actions are removed; the ones the UI uses remain',()=>{
 const s=fs.readFileSync(path.join(__dirname,'..', '..','src/store/store.js'),'utf8');
 for(const n of ['moveList:','moveTaskToList:','setGovernanceDoc:'])assert.ok(!s.includes('  '+n));
 for(const n of ['moveListTo:','setGovernanceDocValue:','setGovernanceDocStatus:'])assert.ok(s.includes('  '+n));
});

test('snapshot budget is checked on every edit, not only when snapshots change',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const src=fs.readFileSync(path.join(__dirname,'../../src/store/store.js'),'utf8');
 assert.ok(src.includes('backupBudget.fitBackups(next)'));
 assert.ok(!src.includes('next.backups!==prev.backups'));
 const {fitBackups}=require('../../src/store/backupBudget.cjs');
 const b=()=>({id:'x',blob:'a'.repeat(450000)});
 const w={projects:[{x:'p'.repeat(1200000)}],backups:[b(),b(),b()]};
 assert.equal(fitBackups(w).trimmed,true);
});
