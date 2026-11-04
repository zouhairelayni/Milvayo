// /tests/app/merge-tasksheet-0527.test.cjs
// Proves the Task Sheet patch and the wire-engines release (both "0.5.26") live together after the 0.5.27 merge.
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'../..',p),'utf8');
const model=require('../../src/domain/model.cjs');

test('Board keeps wire-engines filters and drop position AND shows Task Sheet colored cards',()=>{
 const b=read('src/screens/board/Board.js');
 for(const re of [/filterCards\(/,/dropBefore\(/,/useState\(10\)/,/DUE_FILTERS/,/<TaskLabels labels=\{t\.labels\} colors=\{labelColors\}/,/labelColors=\{project\.labelColors\|\|\{\}\}/,/placeTask\(t\.id, lists\[to\]\.id, k\.dropBefore/]) assert.match(b,re,String(re));
 assert.doesNotMatch(b,/\{t\.id\.toUpperCase\(\)\} · \{t\.type\}/,'no internal ID on cards');
});
test('Tasks keeps wire-engines search/layouts/bulk edit AND colored labels without a visible ID',()=>{
 const t=read('src/screens/tasks/Tasks.js');
 for(const re of [/workflows\.query\(/,/LAYOUTS/,/applyBulkField/,/progressRollups/,/<TaskLabels labels=/]) assert.match(t,re,String(re));
 assert.doesNotMatch(t,/\{t\.id\.toUpperCase\(\)\} · \{t\.type\}/);
});
test('Task Sheet uses setLabels (trim, dedupe, clear verified) and the descendant-safe parent picker',()=>{
 const s=read('src/screens/tasks/TaskSheet.js');
 assert.match(s,/descendants\(s\.tasks, t\.id\)/);
 assert.match(s,/setLabels\(t\.id, \[\.\.\.t\.labels, value\]\)/);
 assert.match(s,/setLabelColor\(value, labelColorDraft\)/);
 assert.doesNotMatch(s,/set\(\{ ?labels:/,'every label edit goes through setLabels');
 assert.match(s,/options=\{\['Standard','Advanced'\]\}/);
});
test('Store exposes both action sets and Timeline keeps critical path',()=>{
 const st=read('src/store/store.js');
 for(const a of ['setLabelColor','setLabels','bulkSet','scheduleAfter','scheduleSample']) assert.match(st,new RegExp(`${a}:`),a);
 assert.match(read('src/screens/timeline/Timeline.js'),/gantt\.criticalPath\(/);
});
test('Mode switching and tag edits never change the task record shape or ID',()=>{
 const p=model.makeProject({id:'m',name:'M',code:'MRG',labelColors:{Red:'#DC2626'},tasks:[{id:'MRG-001',title:'T',labels:['Red']}]});
 const k=require('../../src/board/kanbanUX.cjs');
 const next=k.updateLabels(p,'MRG-001',[' Red ','red','Blue']);
 assert.equal(next.tasks[0].id,'MRG-001');assert.equal(next.labelColors.Red,'#DC2626');
 assert.ok(next.tasks[0].labels.includes('Blue'));
 const again=model.importProject(JSON.parse(JSON.stringify(next)));
 assert.equal(again.tasks[0].id,'MRG-001');assert.equal(again.labelColors.Red,'#DC2626');
});
test('Plain-string labels from old data still normalize',()=>{
 const p=model.importProject(JSON.parse(JSON.stringify(model.makeProject({id:'old',name:'Old',code:'OLD',tasks:[{id:'OLD-1',title:'x',labels:['a','b']}]}))));
 assert.deepEqual(p.tasks[0].labels,['a','b']);assert.ok(!p.labelColors||Object.keys(p.labelColors).length===0);
});
