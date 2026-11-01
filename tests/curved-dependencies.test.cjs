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
const {segmentsOf,hitsBar}=(()=>{
 const segmentsOf=pts=>pts.slice(1).map((q,i)=>({a:pts[i],b:q}));
 const hitsBar=(pts,box)=>segmentsOf(pts).some(({a,b})=>{const x0=Math.min(a.x,b.x),x1=Math.max(a.x,b.x),y0=Math.min(a.y,b.y),y1=Math.max(a.y,b.y);return x1>box.left+0.5&&x0<box.right-0.5&&y1>box.top+0.5&&y0<box.bottom-0.5});
 return {segmentsOf,hitsBar};
})();
test('routes are rounded orthogonal polylines with explicit endpoints',()=>{
 const paths=g.dependencyGeometry(rows,from,28);
 assert.equal(paths.length,6);
 for(const path of paths){
  const d=g.dependencyCurve(path);assert.match(d,/^M /);assert.match(d,/ L /);assert(!d.includes('NaN'));assert(!d.includes('Infinity'));
  for(const {a,b} of segmentsOf(path.points))assert(a.x===b.x||a.y===b.y,`${path.key} has a diagonal segment`);
  assert.equal(path.points[0].x,path.x1);assert.equal(path.points[0].y,path.y1);
  const last=path.points[path.points.length-1];assert.equal(last.y,path.y2);
 }
});
test('no route passes through a task bar other than its own two',()=>{
 const paths=g.dependencyGeometry(rows,from,28);
 for(const path of paths)for(const row of rows){
  if(row.kind!=='task'||row.task.id===path.fromId||row.task.id===path.toId)continue;
  const box=g.barBox(row,from,28);
  assert(!hitsBar(path.points.slice(0,-1),box),`${path.key} crosses ${row.task.id}`);
 }
});
test('parallel route segments keep a lane apart',()=>{
 const paths=g.dependencyGeometry(rows,from,28);const segs=[];
 for(const p of paths)for(const s of segmentsOf(p.points))if(s.a.x===s.b.x&&s.a.y!==s.b.y)segs.push({key:p.key,x:s.a.x,y0:Math.min(s.a.y,s.b.y),y1:Math.max(s.a.y,s.b.y)});
 for(let i=0;i<segs.length;i++)for(let j=i+1;j<segs.length;j++){
  const a=segs[i],b=segs[j];if(a.key===b.key)continue;
  const overlap=Math.min(a.y1,b.y1)-Math.max(a.y0,b.y0);
  if(overlap>6)assert(Math.abs(a.x-b.x)>=g.LANE-0.01,`${a.key} and ${b.key} share a track`);
 }
});
test('a successor with room to spare gets a short route and never loops back',()=>{
 const t=[{id:'p',title:'P',status:'Backlog',start:'2026-11-01',due:'2026-11-03',dependsOn:[]},{id:'q',title:'Q',status:'Backlog',start:'2026-11-06',due:'2026-11-07',dependsOn:['p']}];
 const r=g.layoutRows(g.buildRows(t));const [path]=g.dependencyGeometry(r,from,28);
 assert(path.points.length<=4,`expected a short route, got ${path.points.length} points`);
 const xs=path.points.map(q=>q.x);assert(Math.min(...xs)>=path.x1-1,'route must not loop back left of its start');
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
 assert.equal(g.dependencyCurve({}),'');
 assert.equal(g.linkPreviewPath(rows,from,28,'a',NaN,10),null);
});
test('link preview is an orthogonal route that ends exactly at the pointer',()=>{
 const pv=g.linkPreviewPath(rows,from,28,'a',300,rows[3].center);
 assert(pv);const last=pv.points[pv.points.length-1];assert.equal(last.x,300);assert.equal(last.y,rows[3].center);
 for(const {a,b} of segmentsOf(pv.points))assert(a.x===b.x||a.y===b.y);
});
test('release near a bar picks that bar, and not the source',()=>{
 const b=rows.find(r=>r.task?.id==='b');const bar=g.barBox(b,from,28);
 assert.equal(g.linkTargetAt(rows,from,28,bar.left+10,b.center,'a'),'b');
 assert.equal(g.linkTargetAt(rows,from,28,bar.left+10,b.center,'b'),null);
 assert.equal(g.linkTargetAt(rows,from,28,5000,b.center,'a'),null);
});
test('selected dependency removal changes only the successor and preserves others',()=>{
 const p=m.makeProject({tasks});
 const updated=m.setTaskDependencies(p,'d',['b','c']);
 assert(!updated.tasks.find(x=>x.id==='d').dependsOn.includes('a'));
 assert(updated.tasks.find(x=>x.id==='d').dependsOn.includes('b'));
 assert.equal(updated.tasks.find(x=>x.id==='a').title,'A');
});
test('back-to-back tasks (no gap) still get a clean S-shaped route without NaN',()=>{
 const t=[{id:'p',title:'P',status:'Backlog',start:'2026-11-01',due:'2026-11-03',dependsOn:[]},{id:'q',title:'Q',status:'Backlog',start:'2026-11-04',due:'2026-11-05',dependsOn:['p']}];
 const r=g.layoutRows(g.buildRows(t));const [path]=g.dependencyGeometry(r,from,28);
 assert(!g.dependencyCurve(path).includes('NaN'));
 for(const {a,b} of segmentsOf(path.points))assert(a.x===b.x||a.y===b.y);
});
