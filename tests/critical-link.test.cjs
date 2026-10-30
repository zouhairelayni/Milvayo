'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const model=require('../src/model.cjs');
const g=model.gantt;
const fixtures=[
 {id:'a',title:'Research',status:'Backlog',start:'2026-11-01',due:'2026-11-03',dependsOn:[]},
 {id:'b',title:'Design',status:'In progress',start:'2026-11-04',due:'2026-11-08',dependsOn:['a']},
 {id:'c',title:'Quick review',status:'In progress',start:'2026-11-04',due:'2026-11-04',dependsOn:['a']},
 {id:'d',title:'Release',status:'Done',start:'2026-11-09',due:'2026-11-09',milestone:true,dependsOn:['b','c']},
 {id:'e',title:'Unscheduled',status:'Backlog',start:'',due:'',dependsOn:[]},
];
test('critical path finds the longest dependency chain (not every dependency)',()=>{
 const c=g.criticalPath(fixtures);
 assert.equal(c.totalDays,8);
 assert.deepEqual(c.criticalIds,['a','b','d']);
 assert.deepEqual(c.criticalEdges,['a->b','b->d']);
 assert.equal(c.slack.c,4);
 assert.deepEqual(c.excludedIds,['e']);
 assert.equal(c.scheduledCount,4);
});
test('critical path works with independent parallel tasks',()=>{
 const c=g.criticalPath([{id:'a',start:'2026-11-01',due:'2026-11-03'},{id:'b',start:'2026-11-01',due:'2026-11-01'}]);
 assert.deepEqual(c.criticalIds,['a']); assert.equal(c.slack.b,2);
});
test('critical path handles empty, milestone-only and invalid dates',()=>{
 assert.equal(g.criticalPath([]).totalDays,0);
 const c=g.criticalPath([{id:'m',start:'2026-11-01',due:'2026-11-07',milestone:true}]);
 assert.equal(c.totalDays,0);assert.deepEqual(c.criticalIds,['m']);
 const invalid=g.criticalPath([{id:'bad',start:'2026-11-30',due:'2026-11-01'}]);
 assert.deepEqual(invalid.excludedIds,['bad']);
});
test('critical path rejects a cycle in untrusted input',()=>{
 assert.throws(()=>g.criticalPath([{id:'a',start:'2026-11-01',dependsOn:['b']},{id:'b',start:'2026-11-01',dependsOn:['a']}]),/Circular/);
});
test('pointer hit target requires contact with a scheduled successor bar',()=>{
 const rows=g.layoutRows(g.buildRows(fixtures));
 const target=rows.find(x=>x.key==='b'); const from=g.dayNumber('2026-11-01');
 const bar=g.barGeometry(target.task,from,30);
 assert.equal(g.linkTargetAt(rows,from,30,bar.x+12,target.center,'a'),'b');
 assert.equal(g.linkTargetAt(rows,from,30,bar.x+12,target.center,'b'),null);
 assert.equal(g.linkTargetAt(rows,from,30,bar.x+12,target.center+200,'a'),null);
 assert.equal(g.linkTargetAt(rows,from,30,5000,target.center,'a'),null);
 assert.equal(g.linkTargetAt(rows,from,30,NaN,target.center,'a'),null);
 assert.equal(g.linkTargetAt(rows,from,30,bar.x+12,target.top-1,'a'),null);
 const unscheduled=rows.find(x=>x.key==='e');
 assert.equal(g.linkTargetAt(rows,from,30,40,unscheduled.center,'a'),null);
});
test('independent link operations preserve other predecessors and reject cycles',()=>{
 let project=model.makeProject({tasks:fixtures});
 project=model.setTaskDependencies(project,'b',['a','c']);
 assert.deepEqual(project.tasks.find(t=>t.id==='b').dependsOn,['a','c']);
 assert.throws(()=>model.setTaskDependencies(project,'a',['d']),/Circular/);
});
test('critical path data does not mutate task models or alter persisted schema',()=>{
 const before=JSON.stringify(fixtures);g.criticalPath(fixtures);
 const rows=g.layoutRows(g.buildRows(fixtures));g.linkTargetAt(rows,g.dayNumber('2026-11-01'),30,100,100,'a');
 assert.equal(JSON.stringify(fixtures),before);
 const project=model.importProject(JSON.parse(JSON.stringify(model.makeProject({tasks:fixtures}))));
 assert(project.tasks.find(t=>t.id==='b').dependsOn.includes('a'));
});
