'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const s=require('../src/scheduling.cjs');
const task=(id,start,due,dependsOn=[],extra={})=>({id,start,due,dependsOn,verified:true,merged:true,updatedAt:'2026-10-30T00:00:00.000Z',...extra});
const p=(...tasks)=>({id:'scheduling-test',tasks});
const plan=(project,changedTaskIds=['a'],other={})=>s.previewCascade(project,{changedTaskIds,...other});
const link=(type,lagDays=0,predecessorId='a',successorId='b')=>({type,lagDays,predecessorId,successorId});
const weekdays={mode:'workdays',weekdays:[1,2,3,4,5]};

test('UTC date validation rejects rollover and non-ISO dates',()=>{
 assert.equal(s.dayNumber('2026-02-29'),null);assert.equal(s.dayNumber('2024-02-29')!==null,true);
 assert.equal(s.dayNumber('2026-11-1'),null);assert.equal(s.dateAt(s.dayNumber('2026-11-01')),'2026-11-01');
});
test('workdays calendar respects Friday-Monday, DST and explicit holiday',()=>{
 const cal=s.makeCalendar({...weekdays,closed:['2026-11-02']});
 assert.equal(s.dateAt(cal.next(s.dayNumber('2026-10-30'),1)),'2026-11-03');
 assert.equal(s.dateAt(cal.shift(s.dayNumber('2026-10-30'),2)),'2026-11-04');
 assert.equal(cal.isWorkday('2026-11-01'),false);
});
test('opened weekend override is eligible and holiday exceptions cannot contradict',()=>{
 const cal=s.makeCalendar({...weekdays,opened:['2026-10-31']});
 assert.equal(s.dateAt(cal.next(s.dayNumber('2026-10-30'),1)),'2026-10-31');
 assert.throws(()=>s.makeCalendar({...weekdays,closed:['2026-10-31'],opened:['2026-10-31']}),/contradictory/);
});
test('rejects invalid weekday sets and ambiguous override dates',()=>{
 for(const x of [[],[0],[8],[1,1],'mon'])assert.throws(()=>s.makeCalendar({mode:'workdays',weekdays:x}),/weekdays/);
 assert.throws(()=>s.makeCalendar({closed:['2026-02-30']}),/exception/);
 assert.throws(()=>s.makeCalendar({mode:'sometimes'}),/mode/);
});
test('calendar mode uses continuous days, not workdays',()=>{
 const cal=s.makeCalendar();assert.equal(s.dateAt(cal.next(s.dayNumber('2026-10-30'),1)),'2026-10-31');
});
test('legacy dependsOn converts to FS lag zero',()=>{
 const links=s.normalizeLinks(p(task('a','2026-11-01','2026-11-02'),task('b','2026-11-03','2026-11-04',['a']))).edges;
 assert.deepEqual(links,[link('FS')]);
});
test('typed links overlay only existing persisted edges',()=>{
 const pr=p(task('a','2026-11-01','2026-11-02'),task('b','2026-11-03','2026-11-04',['a']));
 assert.deepEqual(s.normalizeLinks(pr,[link('SS',-2)]).edges,[link('SS',-2)]);
 assert.throws(()=>s.normalizeLinks(pr,[link('SS',0,'b','a')]),/must match/);
});
test('rejects duplicate typed links, bad types and out-of-range lag',()=>{
 const pr=p(task('a','2026-11-01','2026-11-02'),task('b','2026-11-03','2026-11-04',['a']));
 assert.throws(()=>s.normalizeLinks(pr,[link('FS'),link('FS')]),/Duplicate typed/);
 assert.throws(()=>s.normalizeLinks(pr,[link('XX')]),/Invalid dependency type/);
 assert.throws(()=>s.normalizeLinks(pr,[link('FS',366)]),/Lag/);
 assert.throws(()=>s.normalizeLinks(pr,[link('FS',.5)]),/Lag/);
});
test('cycle, self link, duplicate task IDs and missing predecessor are rejected',()=>{
 const a=task('a','2026-11-01','2026-11-02',['b']);const b=task('b','2026-11-03','2026-11-04',['a']);
 assert.throws(()=>s.normalizeLinks(p(a,b)),/Circular/);
 assert.throws(()=>s.normalizeLinks(p(task('a','2026-11-01','2026-11-02',['a']))),/Invalid predecessor/);
 assert.throws(()=>s.normalizeLinks(p(a,a)),/duplicate task/);
 assert.throws(()=>s.normalizeLinks(p(task('a','2026-11-01','2026-11-02',['unknown']))),/Invalid predecessor/);
});
test('FS push-only preserves task duration, user-scheduled anchor and original project',()=>{
 const pr=p(task('a','2026-11-01','2026-11-05'),task('b','2026-11-03','2026-11-04',['a']));
 const before=JSON.stringify(pr),preview=plan(pr);
 assert.equal(preview.canApply,true);assert.equal(preview.changes[0].newStart,'2026-11-06');assert.equal(preview.changes[0].newDue,'2026-11-07');
 assert.equal(JSON.stringify(pr),before);
 const committed=s.applyCascade(pr,preview,'2026-11-01T00:00:00.000Z');
 assert.equal(committed.tasks[0],pr.tasks[0]);assert.equal(committed.tasks[1].start,'2026-11-06');
 assert.equal(committed.tasks[1].verified,false);assert.equal(committed.tasks[1].merged,false);
 assert.equal(pr.tasks[1].verified,true);
});
test('FS zero lag skips weekends under workdays calendar',()=>{
 const pr=p(task('a','2026-10-29','2026-10-30'),task('b','2026-10-30','2026-11-02',['a']));
 const preview=plan(pr,['a'],{calendar:weekdays});
 assert.equal(preview.canApply,true);assert.deepEqual(preview.changes.map(c=>[c.newStart,c.newDue]),[['2026-11-02','2026-11-03']]);
});
test('workdays skip holidays and preserve counted effort across weekends',()=>{
 const calendar={...weekdays,closed:['2026-11-02']};
 const pr=p(task('a','2026-10-29','2026-10-30'),task('b','2026-10-29','2026-10-30',['a']));
 const preview=plan(pr,['a'],{calendar});
 assert.deepEqual(preview.changes.map(c=>[c.newStart,c.newDue]),[['2026-11-03','2026-11-04']]);
});
test('FS positive lag adds days after next available date',()=>{
 const pr=p(task('a','2026-11-01','2026-11-03'),task('b','2026-11-04','2026-11-04',['a']));
 assert.equal(plan(pr,['a'],{typedLinks:[link('FS',2)]}).changes[0].newStart,'2026-11-06');
});
test('FS negative lag permits controlled overlap',()=>{
 const pr=p(task('a','2026-11-01','2026-11-05'),task('b','2026-11-01','2026-11-02',['a']));
 assert.equal(plan(pr,['a'],{typedLinks:[link('FS',-2)]}).changes[0].newStart,'2026-11-04');
});
test('SS constrains successor start against predecessor start',()=>{
 const pr=p(task('a','2026-11-05','2026-11-09'),task('b','2026-11-01','2026-11-03',['a']));
 const preview=plan(pr,['a'],{typedLinks:[link('SS',2)]});
 assert.deepEqual([preview.changes[0].newStart,preview.changes[0].newDue],['2026-11-07','2026-11-09']);
});
test('FF constrains successor finish while preserving duration',()=>{
 const pr=p(task('a','2026-11-01','2026-11-09'),task('b','2026-11-01','2026-11-03',['a']));
 const preview=plan(pr,['a'],{typedLinks:[link('FF',0)]});
 assert.deepEqual([preview.changes[0].newStart,preview.changes[0].newDue],['2026-11-07','2026-11-09']);
});
test('SF constrains successor finish against predecessor start',()=>{
 const pr=p(task('a','2026-11-05','2026-11-09'),task('b','2026-11-01','2026-11-02',['a']));
 const preview=plan(pr,['a'],{typedLinks:[link('SF',1)]});
 assert.deepEqual([preview.changes[0].newStart,preview.changes[0].newDue],['2026-11-05','2026-11-06']);
});
test('multiple incoming predecessors use the most restrictive constraint',()=>{
 const pr=p(task('a','2026-11-01','2026-11-08'),task('b','2026-11-03','2026-11-10'),task('c','2026-11-01','2026-11-02',['a','b']));
 const preview=plan(pr,['a','b']);
 assert.deepEqual(preview.changes.map(c=>[c.newStart,c.newDue]),[['2026-11-11','2026-11-12']]);
});
test('cascade propagates through multiple successor levels in topological order',()=>{
 const pr=p(task('a','2026-11-01','2026-11-08'),task('b','2026-11-02','2026-11-03',['a']),task('c','2026-11-04','2026-11-04',['b']));
 const preview=plan(pr);
 assert.deepEqual(preview.changes.map(c=>[c.taskId,c.newStart]),[['b','2026-11-09'],['c','2026-11-11']]);
});
test('only descendants of explicit anchor may move',()=>{
 const pr=p(task('a','2026-11-01','2026-11-08'),task('b','2026-11-02','2026-11-03',['a']),task('x','2026-11-01','2026-11-08'),task('y','2026-11-02','2026-11-03',['x']));
 assert.deepEqual(plan(pr).changes.map(c=>c.taskId),['b']);
});
test('never pulls already-later successor earlier',()=>{
 const pr=p(task('a','2026-11-01','2026-11-02'),task('b','2026-11-20','2026-11-22',['a']));
 const preview=plan(pr);assert.deepEqual(preview.changes,[]);assert.equal(preview.canApply,true);
});
test('milestone represented by due-only date shifts due but preserves blank start',()=>{
 const pr=p(task('a','2026-11-01','2026-11-05'),task('b','','2026-11-03',['a'],{milestone:true}));
 const preview=plan(pr);
 assert.deepEqual([preview.changes[0].newStart,preview.changes[0].newDue],['','2026-11-06']);
});
test('audit reports conflicts with typed link metadata and no mutation',()=>{
 const pr=p(task('a','2026-11-01','2026-11-08'),task('b','2026-11-03','2026-11-04',['a']));
 const stamp=JSON.stringify(pr);
 const result=s.auditSchedule(pr,{typedLinks:[link('FS',1)]});
 assert.equal(result.issues[0].code,'dependency_conflict');assert.equal(result.issues[0].earliestStart,'2026-11-10');
 assert.equal(JSON.stringify(pr),stamp);
});
test('partial-date successor blocks preview rather than inventing date',()=>{
 const pr=p(task('a','2026-11-01','2026-11-08'),task('b','','2026-11-03',['a']));
 const preview=plan(pr);assert.equal(preview.canApply,false);
 assert.equal(preview.issues[0].code,'unscheduled_successor');
 assert.throws(()=>s.applyCascade(pr,preview),/unresolved/);
});
test('missing predecessor date blocks preview and audit reports it',()=>{
 const pr=p(task('a','',''),task('b','2026-11-03','2026-11-04',['a']));
 assert.equal(plan(pr).canApply,false);
 assert.equal(plan(pr).issues[0].code,'unscheduled_predecessor');
 assert.equal(s.auditSchedule(pr).issues[0].code,'unscheduled_dependency');
});
test('invalid project dates on closed days block workdays plan',()=>{
 const pr=p(task('a','2026-10-31','2026-11-01'),task('b','2026-11-02','2026-11-03',['a']));
 assert.equal(plan(pr,['a'],{calendar:weekdays}).canApply,false);
});
test('invalid anchor dependency is reported and does not move anchor',()=>{
 const pr=p(task('a','2026-11-07','2026-11-10',['root']),task('root','2026-11-01','2026-11-08'));
 const preview=plan(pr,['a']);
 assert.equal(preview.canApply,false);assert.equal(preview.issues[0].code,'anchor_dependency_conflict');
 assert.deepEqual(preview.changes,[]);
});
test('stale-preview refuses a changed task date or verification state',()=>{
 const pr=p(task('a','2026-11-01','2026-11-05'),task('b','2026-11-03','2026-11-04',['a']));
 const preview=plan(pr);
 assert.throws(()=>s.applyCascade({...pr,tasks:pr.tasks.map(t=>t.id==='b'?{...t,due:'2026-11-06'}:t)},preview),/Stale/);
 assert.throws(()=>s.applyCascade({...pr,tasks:pr.tasks.map(t=>t.id==='b'?{...t,verified:false}:t)},preview),/Stale/);
});
test('empty changed anchors, unknown and duplicate anchors reject',()=>{
 const pr=p(task('a','2026-11-01','2026-11-02'));
 assert.throws(()=>s.previewCascade(pr,{}),/changedTaskIds/);
 assert.throws(()=>plan(pr,['a','a']),/unique/);
 assert.throws(()=>plan(pr,['x']),/Unknown/);
});
test('non-integer day shifts and oversized lags cannot enter scheduling',()=>{
 const cal=s.makeCalendar(weekdays);
 assert.throws(()=>cal.shift(s.dayNumber('2026-11-02'),1.5),/offset/);
 assert.throws(()=>cal.shift(s.dayNumber('2026-11-02'),10001),/offset/);
});
test('deterministic preview contains no current-time dependent data',()=>{
 const pr=p(task('a','2026-11-01','2026-11-04'),task('b','2026-11-01','2026-11-02',['a']));
 assert.deepEqual(plan(pr),plan(pr));
});
test('applied schedule clears checks only on moved successors',()=>{
 const pr=p(task('a','2026-11-01','2026-11-08'),task('b','2026-11-02','2026-11-03',['a']),task('c','2026-11-20','2026-11-21',['a']));
 const out=s.applyCascade(pr,plan(pr),'2026-10-31T00:00:00.000Z');
 assert.equal(out.tasks[0].verified,true);assert.equal(out.tasks[1].verified,false);assert.equal(out.tasks[2].verified,true);
 assert.equal(out.tasks[1].updatedAt,'2026-10-31T00:00:00.000Z');
});
test('existing project model stays import-export compatible after FS schedule',()=>{
 const model=require('../src/model.cjs');
 const source=model.makeProject({name:'Test',tasks:[task('a','2026-11-01','2026-11-05'),task('b','2026-11-02','2026-11-03',['a'])]});
 const output=s.applyCascade(source,plan(source));
 const restored=model.importProject(JSON.parse(JSON.stringify(output)));
 assert.equal(restored.tasks.find(t=>t.id==='b').start,'2026-11-06');
 assert.deepEqual(restored.tasks.find(t=>t.id==='b').dependsOn,['a']);
});
test('preview cannot be applied to another project with identical tasks',()=>{
 const tasks=[task('a','2026-11-01','2026-11-04'),task('b','2026-11-02','2026-11-03',['a'])];
 const first={id:'project-alpha',tasks};const second={id:'project-beta',tasks};
 assert.throws(()=>s.applyCascade(second,plan(first)),/Stale/);
});
test('rejects a pathological task span rather than scanning millions of days',()=>{
 const project=p(task('a','2026-11-01','2026-11-04'),task('b','1800-01-01','2200-01-01',['a']));
 const preview=plan(project);
 assert.equal(preview.canApply,false);
 assert(preview.issues.some(i=>i.code==='invalid_schedule'));
});
test('workday FF lag and milestone SF relationship align correctly',()=>{
 const project=p(task('a','2026-10-29','2026-11-03'),task('b','2026-10-29','2026-10-30',['a']));
 const f=s.previewCascade(project,{changedTaskIds:['a'],calendar:weekdays,typedLinks:[link('FF',1)]});
 assert.equal(f.canApply,true);
 assert.deepEqual(f.changes.map(c=>[c.newStart,c.newDue]),[['2026-11-03','2026-11-04']]);
 const milestone=p(task('a','2026-11-05','2026-11-09'),task('b','','2026-11-02',['a'],{milestone:true}));
 const t=plan(milestone,['a'],{typedLinks:[link('SF',0)]});
 assert.equal(t.changes[0].newDue,'2026-11-05');
});
test('applying a clean preview retains existing task objects and dependency structure',()=>{
 const project=p(task('a','2026-11-01','2026-11-05'),task('b','2026-11-06','2026-11-07',['a']));
 const preview=plan(project);assert.deepEqual(preview.changes,[]);
 const result=s.applyCascade(project,preview);
 assert.equal(result.tasks[0],project.tasks[0]);assert.equal(result.tasks[1],project.tasks[1]);
 assert.deepEqual(result.tasks[1].dependsOn,['a']);
});
