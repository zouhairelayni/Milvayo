// /tests/store/import-android-0519.test.cjs
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {fitBackups,SOFT_LIMIT,HARD_LIMIT}=require('../../src/store/backupBudget.cjs');
const model=require('../../src/domain/model.cjs');
const read=f=>fs.readFileSync(path.join(__dirname,'..', '..',f),'utf8');
const snap=(n,bytes)=>({id:'b'+n,label:'snapshot '+n,blob:'x'.repeat(bytes)});

test('snapshot budget keeps the newest snapshots, drops the oldest, never touches the live workspace',()=>{
 const live={projects:[{id:'p'}],revision:1,backups:[snap(1,600000),snap(2,600000),snap(3,600000),snap(4,600000)]};
 const {workspace,trimmed}=fitBackups(live);
 assert.equal(trimmed,true);
 assert.deepEqual(workspace.backups.map(b=>b.id),['b1','b2'],'newest first, oldest dropped until it fits');
 assert.ok(JSON.stringify(workspace).length<=SOFT_LIMIT);
 assert.equal(workspace.projects,live.projects);
});
test('snapshot budget is a no-op under the limit and keeps one snapshot above the soft limit',()=>{
 const small={projects:[],backups:[snap(1,1000),snap(2,1000)]};
 assert.equal(fitBackups(small).workspace,small);assert.equal(fitBackups(small).trimmed,false);
 const one={projects:[],backups:[snap(1,SOFT_LIMIT+1000)]};
 assert.equal(fitBackups(one).workspace.backups.length,1,'a single oversized-but-loadable snapshot is kept for rollback');
 assert.equal(fitBackups({projects:[],backups:[]}).trimmed,false);
});
test('a snapshot that would make the workspace unloadable is dropped',()=>{
 const huge={projects:[],backups:[snap(1,HARD_LIMIT+5000)]};
 const r=fitBackups(huge);assert.deepEqual(r.workspace.backups,[]);assert.equal(r.trimmed,true);
});
test('a workspace backup file imports as projects and restores as a whole workspace through the model',()=>{
 const base=model.createWorkspaceNormalizer()(model.createWorkspace());
 const extra=['Alpha','Beta'].map(n=>model.makeProject({id:model.id('project'),name:n,code:n.slice(0,3).toUpperCase()}));
 const exported=JSON.parse(JSON.stringify({format:'niyarvo.workspace.v1',exportedAt:model.iso(),workspace:{...base,selectedId:extra[0].id,projects:[...base.projects,...extra]}}));
 // Import project path, as the store runs it
 assert.equal(exported.workspace.schemaVersion,1);
 const created=exported.workspace.projects.map(raw=>model.importProject(raw));
 assert.equal(created.length,3);
 // Restore path, as the store runs it
 const incoming=model.normalizeWorkspace(exported.workspace);
 assert.equal(incoming.projects.length,3);assert.equal(incoming.selectedId,extra[0].id);
});
test('Android imports use the system picker; DocumentPicker is only the iOS path',()=>{
 const src=read('src/screens/workspace/Backup.js');
 assert.match(src,/\{MAX_IMPORT_BYTES,tooBig,parseBackupJson,pickAndroidFileBytes,pickDocumentFileBytes\}/);
 // 0.5.24: all pickers read bytes so .niyav (gzip or protected) opens on every platform.
 const android=src.indexOf("if(Platform.OS==='android')return pickAndroidFileBytes(File);");
 const doc=src.indexOf('DocumentPicker.getDocumentAsync');
 assert.ok(android>0&&doc>android,'Android returns before the DocumentPicker cache path');
 assert.match(src,/No file selected/,'a cancelled or failed picker is never silent');
 const helper=read('src/store/importFiles.cjs');
 assert.match(helper,/mimeTypes: \['\*\/\*'\]/,'every file type is offered');
});
test('import and restore report the real error, not a generic one',()=>{
 const store=read('src/store/store.js');
 assert.match(store,/lastError=useRef\(''\)/);
 assert.match(store,/error:lastError\.current\|\|'Import failed; no projects were replaced\.'/);
 assert.match(store,/error:ok\?'':\(lastError\.current\|\|'Workspace restore failed'\)/);
 assert.match(store,/backupBudget\.fitBackups\(next\)/);
 assert.doesNotMatch(store,/next\.backups!==prev\.backups/,'the budget runs on every edit');
});
