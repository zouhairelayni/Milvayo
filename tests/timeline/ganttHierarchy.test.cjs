// /tests/timeline/ganttHierarchy.test.cjs
'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const g=require('../../src/timeline/gantt.cjs');const planning=require('../../src/domain/planning.cjs');
const tasks=[
 {id:'epic',title:'Ship app',status:'Backlog',position:1,start:'',due:'',progress:0},
 {id:'design',title:'Design',parentId:'epic',status:'Done',position:0,start:'2026-10-01',due:'2026-10-04',estimateHours:3},
 {id:'dev',title:'Build',parentId:'epic',status:'In progress',position:1,start:'',due:'',estimateHours:5},
 {id:'impl',title:'API',parentId:'dev',status:'In progress',position:0,start:'2026-10-05',due:'2026-10-10',estimateHours:5,progress:50},
 {id:'free',title:'Independent',status:'Backlog',position:2,start:'',due:''}
];
test('hierarchy sorts roots and children and maintains depth',()=>{
 const rows=g.hierarchyRows(tasks);assert.deepEqual(rows.map(r=>r.task.id),['epic','design','dev','impl','free']);
 assert.deepEqual(rows.map(r=>r.depth),[0,1,1,2,0]);
 assert.equal(rows[0].hasChildren,true);assert.equal(rows[2].childCount,1);
});
test('collapse hides descendants, not siblings, and does not change data',()=>{
 const before=JSON.stringify(tasks);const rows=g.hierarchyRows(tasks,['dev']);
 assert.deepEqual(rows.map(r=>r.task.id),['epic','design','dev','free']);
 assert.equal(rows[2].collapsed,true);assert.equal(JSON.stringify(tasks),before);
});
test('summary span aggregates scheduled descendants and weighted leaf progress',()=>{
 const rollups=planning.progressRollups(tasks);const s=g.hierarchySummaries(tasks,rollups);
 assert.equal(s.get('epic').start,g.dayNumber('2026-10-01'));
 assert.equal(s.get('epic').end,g.dayNumber('2026-10-10'));
 assert.equal(s.get('epic').progress,69); // (3*100+5*50)/8 = 68.75
 assert.equal(s.get('dev').progress,50);assert.equal(s.has('free'),false);
});
test('missing parent is shown as root and cyclic records are bounded',()=>{
 const rows=g.hierarchyRows([{id:'a',parentId:'b'},{id:'b',parentId:'a'},{id:'c',parentId:'missing'}]);
 assert.equal(rows.length,3);assert.equal(new Set(rows.map(r=>r.task.id)).size,3);
 assert.equal(g.hierarchySummaries([{id:'a',parentId:'b'},{id:'b',parentId:'a'}]).size,0);
});
test('parent summary without any scheduled descendant is omitted',()=>{
 const s=g.hierarchySummaries([{id:'a'},{id:'b',parentId:'a'}]);assert.equal(s.size,0);
});
