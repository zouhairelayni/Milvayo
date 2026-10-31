'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const windowing=require('../src/gantt-window.cjs');
const gantt=require('../src/gantt.cjs');
function fixture(count=73){
 const tasks=Array.from({length:count},(_,i)=>({id:`P-${i}`,title:`Task ${i}`,status:i%2?'In progress':'Backlog',stage:'Development',position:i,start:'2026-10-01',due:'2026-10-03',dependsOn:i>0&&i%5===0?[`P-${i-1}`]:[]}));
 return {tasks,rows:gantt.layoutRows(gantt.buildRows(tasks,'status'),60)};
}
test('a 73-task project only mounts rows around the visible Android viewport',()=>{
 const {rows}=fixture();const first=windowing.visibleRows(rows,0,320,180);
 assert.ok(rows.length>=73);assert.ok(first.length<=14);assert.equal(first[0].kind,'group');
 const last=windowing.visibleRows(rows,rows.at(-1).top-200,320,180);
 assert.ok(last.length<=15);assert.ok(last.some(x=>x.task?.id==='P-71'));
});
test('large 10,000-task project renders bounded row window without deleting tasks',()=>{
 const {tasks,rows}=fixture(10000);const start=500000;
 const view=windowing.visibleRows(rows,start,340,180);
 assert.equal(tasks.length,10000);
 assert.ok(view.length>0&&view.length<20);
 assert.equal(rows.length,10002);
});
test('window boundary retains rows above and below during scroll updates',()=>{
 const {rows}=fixture();
 for(const y of [0,149,150,299,300,700,1500,3600]){
  const rounded=Math.floor(y/150)*150;
  const visible=windowing.visibleRows(rows,rounded,300,180);
  for(const row of rows){if(row.top<=y+300&&row.top+row.height>=y)assert.ok(visible.includes(row),`${row.key} missing at ${y}`)}
 }
});
test('horizontal window renders only date columns near the visible range',()=>{
 const range=windowing.visibleDays(540,24,1000,280,270);
 assert.ok(range.start<=Math.floor(1000/24));
 assert.ok(range.end>=Math.ceil((1000+280)/24));
 assert.ok(range.end-range.start<60);
 assert.deepEqual(windowing.visibleDays(0,24,0,300),{start:0,end:0});
});
test('quantized horizontal scroll does not leave unrendered date columns',()=>{
 for(const x of [0,149,150,299,301,1950,4900]){
  const anchor=Math.floor(x/150)*150;
  const {start,end}=windowing.visibleDays(540,24,anchor,300,270);
  assert.ok(start*24<=x || start===0);
  assert.ok(end*24>=x+300);
 }
});
test('visible curved dependencies are clipped without changing their coordinates',()=>{
 const {rows}=fixture();const paths=gantt.dependencyGeometry(rows,gantt.dayNumber('2026-09-28'),24);
 assert.ok(paths.length>=14);
 const drawn=windowing.visibleLinks(paths,0,0,250,350,75);
 assert.ok(drawn.length<paths.length);
 for(const p of drawn)assert.strictEqual(paths.find(x=>x.key===p.key),p);
});
test('scrolling to a dependency retains both endpoints and original hit-test math',()=>{
 const {rows}=fixture();const paths=gantt.dependencyGeometry(rows,gantt.dayNumber('2026-09-28'),24);
 const p=paths[6];
 const visible=windowing.visibleLinks(paths,Math.max(0,p.x1-90),Math.max(0,p.y1-65),500,600,90);
 assert.ok(visible.find(x=>x.key===p.key));
 const target=gantt.linkTargetAt(rows,gantt.dayNumber('2026-09-28'),24,p.x2,p.y2,p.fromId);
 assert.equal(target,p.toId);
});
test('invalid scroll input cannot create negative range indices',()=>{
 assert.deepEqual(windowing.visibleDays(100,0,30,250),{start:0,end:0});
 assert.equal(windowing.visibleDays(100,24,-999,250).start,0);
 assert.deepEqual(windowing.visibleRows([],0,300),[]);
});
