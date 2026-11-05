// /tests/app/single-app-migration-051.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..', '..');const read=f=>fs.readFileSync(path.join(root,f),'utf8');
test('one app entry, one store, and no legacy screen reachable',()=>{assert.doesNotMatch(read('src/app/App.js'),/ClassicApp/);assert.match(read('src/app/App.js'),/ModernApp/);assert.equal(fs.existsSync(path.join(root,'ClassicApp.js')),false);assert.match(read('src/store/store.js'),/milvayo-v1/);assert.doesNotMatch(read('src/app/ModernApp.js'),/Advanced workspace/)});
test('app does not replace dependency files during initialization',()=>{const s=read('src/app/App.js')+read('src/store/store.js');assert.doesNotMatch(s,/writeFile.*package(-lock)?\.json|unlink.*package(-lock)?\.json/)})
test('timeline does not jump away from task bars after opening',()=>{const s=read('src/screens/timeline/Timeline.js');assert.doesNotMatch(s,/if \(viewportW > 0\) goToday\(false\)/);assert.match(s,/goToday\(true\)/);assert.match(s,/if \(rows\.length && next\.first === next\.last\) return/)});
test('management screens use original domain mutation layer',()=>{const api=read('src/store/store.js');for(const x of ['updateTaskPlanning','deleteTaskWithLinks','costSummary','updateCalendar','automation.saveCommand','restoreWorkspace','workspaceSnapshot','setBudget'])assert.ok(api.includes(x),x)});
test('all legacy management capabilities are presented in one compact interface',()=>{const names=read('src/app/ModernApp.js');for(const x of ['Scheduling','TaskConfiguration','Collaboration','Specifications','Resources','Costs','Projects','Portfolios','Programs','Automations','Releases'])assert.ok(names.includes(x),x);assert.match(read('src/screens/workspace/Workspace.js'),/Fold title=/);assert.match(read('src/screens/workspace/Workspace.js'),/import Backup from '\.\/Backup'/);assert.match(read('src/screens/tasks/TaskSheet.js'),/InlineDrop/)});
test('one cumulative changelog under docs/changelog and QA/instructions in their own directories',()=>{
  assert.deepEqual(fs.readdirSync(root).filter(x=>/^CHG-NP-|^NP-QA-/.test(x)),[]);
  assert.deepEqual(fs.readdirSync(path.join(root,'docs/changelog')),['CHANGELOG.md']);
  for(const f of ['docs/qa/README.md','docs/instructions/README.md','docs/instructions/niyav-format.md'])assert.ok(fs.statSync(path.join(root,f)).size>200,f);
  const log=read('docs/changelog/CHANGELOG.md');
  for(const v of ['0.1.0','0.2.0','0.3.12','0.4.2','0.5.31','0.5.34','0.5.47'])assert.ok(log.includes('## v'+v),v);
});

test('five mobile primary tabs, all other screens through one drawer',()=>{const app=read('src/app/ModernApp.js');const block=app.slice(app.indexOf('const TABS = ['),app.indexOf('];',app.indexOf('const TABS = ['))+2);assert.equal((block.match(/\['/g)||[]).length,5);for(const name of ['Scheduling','TaskConfiguration','Collaboration','Specifications'])assert.ok(app.includes(name));});
test('unique encrypted backup format reference lives only in docs/instructions',()=>{const file='docs/instructions/niyav-format.md';assert.ok(fs.existsSync(path.join(root,file)));assert.equal(fs.existsSync(path.join(root,'reference/niyav-format.md')),false);assert.ok(read(file).length>300);});
