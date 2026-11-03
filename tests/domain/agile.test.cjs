// /tests/domain/agile.test.cjs
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const m=require('../../src/domain/model.cjs');
const a=m.agile;
const make=()=>m.makeProject({id:'p',name:'Example',code:'EX',tasks:[
 {id:'a',title:'Build',status:'Backlog'},
 {id:'b',title:'Review',status:'Backlog'},
 {id:'c',title:'Done',status:'Done'}]});
const sprint={id:'s1',name:'Sprint 1',goal:'Deliver review',start:'2026-10-30',end:'2026-11-12'};
const now='2026-10-30T09:00:00.000Z';
const later='2026-10-31T09:00:00.000Z';
test('v0.3.1 project migrates without sprint fields and does not change tasks',()=>{
 const p=make();assert.deepEqual(p.sprints,[]);assert.ok(p.tasks.every(t=>t.sprintId===''));
 assert.equal(m.validateProject(p).id,p.id);
});
test('create sprint validates dates, IDs and 90-day maximum',()=>{
 const p=make();const q=a.createSprint(p,sprint);assert.equal(q.sprints[0].state,'planned');
 assert.equal(p.sprints.length,0);assert.throws(()=>a.createSprint(q,sprint),/already/);
 assert.throws(()=>a.createSprint(p,{...sprint,id:'x',end:'2027-03-30'}),/1–90/);
 assert.throws(()=>a.createSprint(p,{...sprint,id:'x',start:'2026-02-30'}),/dates/);
 assert.throws(()=>a.createSprint(p,{...sprint,id:'x',start:'2026-11-15'}),/dates/);
});
test('assignment belongs to only one planned sprint and is referentially valid',()=>{
 const p=a.createSprint(a.createSprint(make(),sprint),{...sprint,id:'s2',name:'Sprint 2'});
 const q=a.assign(p,'a','s1',now);const r=a.assign(q,'a','s2',now);
 assert.equal(r.tasks.find(t=>t.id==='a').sprintId,'s2');assert.equal(a.summary(r,'s1').total,0);
 assert.throws(()=>a.assign(q,'missing','s1'),/Task not found/);assert.throws(()=>a.assign(q,'a','missing'),/Sprint not found/);
 assert.equal(q.tasks.find(t=>t.id==='a').sprintId,'s1');
});
test('at most one sprint active, and start captures an authentic baseline',()=>{
 let p=a.createSprint(a.createSprint(make(),sprint),{...sprint,id:'s2',name:'Sprint 2'});
 p=a.assign(p,'a','s1',now);p=a.assign(p,'c','s1',now);p=a.startSprint(p,'s1',now);
 assert.equal(p.sprints[0].history.length,1);
 assert.deepEqual([p.sprints[0].history[0].remaining,p.sprints[0].history[0].total],[1,2]);
 assert.throws(()=>a.startSprint(p,'s2'),/Finish/);assert.throws(()=>a.startSprint(p,'s1'),/planned/);
});
test('status changes record progress; unchanged edits do not fabricate burndown events',()=>{
 let p=a.startSprint(a.assign(a.createSprint(make(),sprint),'a','s1',now),'s1',now);
 let q={...p,tasks:p.tasks.map(t=>t.id==='a'?{...t,status:'Done'}:t)};
 q=a.reconcileProgress(p,q,later);assert.deepEqual(q.sprints[0].history.map(x=>x.remaining),[1,0]);
 const unchanged=a.reconcileProgress(q,{...q,name:'Renamed'},later);assert.equal(unchanged.sprints[0].history.length,2);
 assert.equal(p.sprints[0].history.length,1);
});
test('assigning to active sprint adds a progress snapshot without altering status',()=>{
 let p=a.startSprint(a.createSprint(make(),sprint),'s1',now);
 let q=a.assign(p,'a','s1',later);
 assert.equal(q.tasks[0].status,'Backlog');assert.deepEqual(q.sprints[0].history.map(x=>x.total),[0,1]);
});
test('finish is explicit and immutable history freezes while unfinished tasks become backlog',()=>{
 let p=a.startSprint(a.assign(a.assign(a.createSprint(make(),sprint),'a','s1',now),'c','s1',now),'s1',now);
 p=a.finishSprint(p,'s1',later);
 assert.equal(p.sprints[0].state,'completed');assert.deepEqual(p.sprints[0].taskIds,['a','c']);
 assert.equal(p.sprints[0].history.at(-1).remaining,1);
 assert.ok(p.tasks.every(t=>t.sprintId===''));assert.equal(p.tasks.find(t=>t.id==='a').status,'Backlog');
 assert.throws(()=>a.assign(p,'b','s1'),/completed/);assert.throws(()=>a.finishSprint(p,'s1'),/active/);
 const history=JSON.stringify(p.sprints[0].history);
 const q=a.reconcileProgress(p,{...p,tasks:p.tasks.map(t=>({...t,status:'Done'}))},'2026-11-01T00:00:00.000Z');
 assert.equal(JSON.stringify(q.sprints[0].history),history);
});
test('planned sprint deletion unassigns tasks; active sprint deletion is refused',()=>{
 const p=a.assign(a.createSprint(make(),sprint),'a','s1',now);
 const q=a.deleteSprint(p,'s1');assert.equal(q.sprints.length,0);assert.equal(q.tasks[0].sprintId,'');
 assert.throws(()=>a.deleteSprint(a.startSprint(p,'s1',now),'s1'),/planned/);
});
test('burndown plots recorded days only, without fabricated future actuals',()=>{
 let p=a.startSprint(a.assign(a.createSprint(make(),sprint),'a','s1',now),'s1',now);
 p=a.reconcileProgress(p,{...p,tasks:p.tasks.map(t=>t.id==='a'?{...t,status:'Done'}:t)},later);
 const points=a.burndown(p,'s1','2026-10-31');assert.equal(points.length,2);
 assert.deepEqual(points.map(x=>x.remaining),[1,0]);assert.equal(points[0].ideal,1);
 assert.equal(a.burndown(p,'s1','2026-10-31').at(-1).date,'2026-10-31');
});
test('normalization round-trip preserves sprint history, scopes, and task assignment',()=>{
 let p=a.startSprint(a.assign(a.createSprint(make(),sprint),'a','s1',now),'s1',now);
 const copy=m.importProject(JSON.parse(JSON.stringify(p)));assert.deepEqual(copy.sprints,p.sprints);
 assert.equal(copy.tasks.find(t=>t.id==='a').sprintId,'s1');
 const ws=m.normalizeWorkspace({schemaVersion:1,projects:[copy],selectedId:copy.id});
 const backup=m.workspaceSnapshot(ws);const restored=m.restoreSnapshot(ws,backup);
 assert.deepEqual(restored.projects[0].sprints,p.sprints);
});
test('reject missing sprint, completed-sprint assignment and duplicate IDs in imported data',()=>{
 const p=make();p.tasks[0].sprintId='ghost';assert.throws(()=>m.validateProject(p),/missing or closed/);
 const q=a.createSprint(make(),sprint);q.sprints.push({...q.sprints[0]});assert.throws(()=>m.validateProject(q),/Duplicate sprint/);
 const r=a.finishSprint(a.startSprint(a.createSprint(make(),sprint),'s1',now),'s1',later);
 r.tasks[0].sprintId='s1';assert.throws(()=>m.validateProject(r),/missing or closed/);
});
test('unrelated project data and the user-selected accent stay outside sprint changes',()=>{
 let p=make();p.scheduling={...p.scheduling};p=a.createSprint(p,sprint);
 assert.equal(p.releases.length,0);assert.equal(p.tasks[0].verified,false);
 assert.deepEqual(Object.keys(p).includes('accentId'),false);
});
test('planned sprint edits preserve IDs, scope and validation, and cannot alter active history',()=>{
 let p=a.assign(a.createSprint(make(),sprint),'a','s1',now);
 const next=a.updatePlannedSprint(p,'s1',{name:'Sprint 1 revised',goal:'Deliver a working board',start:'2026-11-01',end:'2026-11-14'});
 assert.equal(next.sprints[0].name,'Sprint 1 revised');
 assert.equal(next.sprints[0].id,'s1');
 assert.equal(next.tasks[0].sprintId,'s1');
 assert.equal(next.sprints[0].goal,'Deliver a working board');
 assert.equal(p.sprints[0].name,sprint.name);
 assert.throws(()=>a.updatePlannedSprint(p,'s1',{start:'2026-11-20',end:'2026-11-14'}),/dates/);
 const active=a.startSprint(next,'s1',now);
 assert.throws(()=>a.updatePlannedSprint(active,'s1',{goal:'Change history'}),/planned/);
});
