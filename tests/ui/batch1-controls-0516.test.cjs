// /tests/ui/batch1-controls-0516.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const model=require('../../src/domain/model.cjs'),planning=require('../../src/domain/planning.cjs');
const read=x=>fs.readFileSync(path.join(__dirname,'..', '..',x),'utf8');
test('saved view keeps and defaults the tag filter',()=>{
 let p=model.makeProject();
 p=planning.saveView(p,{id:'v',name:'Bugs',filters:{status:'All',label:'bug'}});
 assert.equal(p.savedViews[0].filters.label,'bug');
 p=planning.saveView(p,{id:'w',name:'Plain'});
 assert.equal(p.savedViews[1].filters.label,'All');
 const again=model.normalizeWorkspace(JSON.parse(JSON.stringify({...model.createWorkspace(),projects:[p],selectedId:p.id})));
 assert.equal(again.projects[0].savedViews[0].filters.label,'bug');
});
test('Tasks saves/restores the tag filter and renders the moved calendar preview; Costs has no dead state',()=>{
 const t=read('src/screens/tasks/Tasks.js');assert.ok(t.includes('label:labelFilter')&&t.includes("setLabelFilter(v.filters.label||'All')"));
 assert.match(t,/<DueSoon key=\{project.id\} tasks=\{upcoming\}/);
 const dates=read('src/screens/tasks/dueSoon.cjs');assert.ok(dates.includes("includes('calendar')")&&dates.includes('dueSoon(project, b.id, today)'));
 assert.doesNotMatch(read('src/screens/board/Board.js'),/<DueSoon|<UpcomingDates/);
 assert.ok(!read('src/screens/workspace/Workspace.js').includes('editingBudget'));
});
