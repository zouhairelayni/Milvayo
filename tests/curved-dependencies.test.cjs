'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const m=require('../src/model.cjs'),g=m.gantt;
const tasks=[
 {id:'a',title:'A',status:'Backlog',start:'2026-11-01',due:'2026-11-03',dependsOn:[]},
 {id:'b',title:'B',status:'In progress',start:'2026-11-04',due:'2026-11-09',dependsOn:['a']},
 {id:'c',title:'C',status:'Validation',start:'2026-11-05',due:'2026-11-10',dependsOn:['a','b']},
 {id:'d',title:'D',status:'Done',start:'2026-11-11',due:'2026-11-13',dependsOn:['a','b','c']},
];
const rows=g.layoutRows(g.buildRows(tasks));const from=g.dayNumber('2026-11-01');
test('curved paths have explicit endpoints and no straight-only geometry',()=>{
 const paths=g.dependencyGeometry(rows,from,28);
 assert.equal(paths.length,6);
 for(const path of paths){const d=g.dependencyCurve(path);assert.match(d,/^M /);assert.match(d,/ C /);assert.match(d,/ L /);assert(!d.includes('NaN'));assert(!d.includes('Infinity'))}
});
test('routes whose vertical spans overlap do not share the same trunk',()=>{
 const paths=g.dependencyGeometry(rows,from,28);
 for(let i=0;i<paths.length;i++)for(let j=i+1;j<paths.length;j++){
  const a=paths[i],b=paths[j];const overlap=Math.min(Math.max(a.y1,a.y2),Math.max(b.y1,b.y2))>=Math.max(Math.min(a.y1,a.y2),Math.min(b.y1,b.y2));
  if(overlap)assert(Math.abs(a.elbow-b.elbow)>=12,`${a.key} collides with ${b.key}`);
 }
});
test('routing is deterministic and leaves source tasks unchanged',()=>{
 const before=JSON.stringify(tasks);
 assert.deepEqual(g.dependencyGeometry(rows,from,28),g.dependencyGeometry(rows,from,28));
 assert.equal(JSON.stringify(tasks),before);
});
test('link gesture uses relative dx/dy and lands on successor bar',()=>{
 const target=rows.find(r=>r.task?.id==='b');const bar=g.barGeometry(target.task,from,28);
 const start=g.connectorPoint(rows,from,28,'a');assert(start);
 const end=g.linkGesturePoint(rows,from,28,'a',bar.x+12-start.x,target.center-start.y);
 assert.equal(g.linkTargetAt(rows,from,28,end.x,end.y,'a'),'b');
 assert.equal(end.y,target.center);
});
test('relative pointer is stable regardless of window or status-bar offset',()=>{
 const expected=g.linkGesturePoint(rows,from,28,'a',120,220);
 assert.deepEqual(expected,{x:g.connectorPoint(rows,from,28,'a').x+120,y:g.connectorPoint(rows,from,28,'a').y+220});
});
test('link pointer rejects invalid input or unscheduled source',()=>{
 assert.equal(g.linkGesturePoint(rows,from,28,'a',NaN,20),null);
 assert.equal(g.linkGesturePoint(rows,from,28,'missing',20,20),null);
 assert.equal(g.dependencyCurve({...g.dependencyGeometry(rows,from,28)[0],elbow:NaN}),'');
});
test('selected dependency removal changes only the successor and preserves others',()=>{
 const p=m.makeProject({tasks});
 const updated=m.setTaskDependencies(p,'d',['b','c']);
 assert(!updated.tasks.find(x=>x.id==='d').dependsOn.includes('a'));
 assert(updated.tasks.find(x=>x.id==='d').dependsOn.includes('b'));
 assert.equal(updated.tasks.find(x=>x.id==='a').title,'A');
});
