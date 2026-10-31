const {test}=require('node:test');
const assert=require('node:assert/strict');
const model=require('../src/model.cjs');
const pmod=model.projectScheduling;
const raw=()=>({id:'proj-t',name:'Scheduler',format:model.FORMAT,tasks:[
 {id:'A',title:'Research',start:'2026-11-02',due:'2026-11-04'},
 {id:'B',title:'Develop',start:'2026-11-05',due:'2026-11-06',dependsOn:['A'],verified:true,merged:true,releaseId:'rel1'},
 {id:'C',title:'Ship',start:'2026-11-09',due:'2026-11-10',dependsOn:['B']}
],releases:[{id:'rel1',name:'Alpha',status:'Released',mainSha:'sha'}]});
test('legacy projects gain explicit per-project FS links without changing task schedules',()=>{
 const p=model.makeProject(raw());assert.deepEqual(p.scheduling.calendar.mode,'calendar');
 assert.deepEqual(p.scheduling.links.map(x=>[x.predecessorId,x.successorId,x.type,x.lagDays]),[['A','B','FS',0],['B','C','FS',0]]);
 assert.equal(p.tasks[0].start,'2026-11-02');assert.equal(p.tasks[1].due,'2026-11-06');
});
test('full JSON project and workspace restore preserve typed links and calendar exceptions',()=>{
 let p=model.makeProject(raw());p=pmod.updateCalendar(p,{mode:'workdays',weekdays:[1,2,3,4,5],closed:['2026-11-09'],opened:[]});p=pmod.updateTypedLink(p,'A','B','SS',2);
 const imported=model.importProject(JSON.parse(JSON.stringify(p)));
 assert.deepEqual(imported.scheduling,p.scheduling);
 const w={schemaVersion:1,selectedId:p.id,projects:[p],activity:[],backups:[],revision:1};
 const snapshot=model.workspaceSnapshot(w,'checkpoint');
 const restored=model.restoreSnapshot({...w,projects:[model.blankProject()]},snapshot);
 assert.deepEqual(restored.projects[0].scheduling,p.scheduling);
 assert.deepEqual(model.normalizeWorkspace(JSON.parse(JSON.stringify(w))).projects[0].scheduling,p.scheduling);
});
test('separate projects retain separate calendars and dependency settings',()=>{
 const one=model.makeProject(raw()),two=model.makeProject({...raw(),id:'project-two'});
 const changed=pmod.updateCalendar(one,{mode:'workdays',weekdays:[1,2,3,4],closed:[],opened:[]});
 assert.equal(two.scheduling.calendar.mode,'calendar');assert.equal(changed.scheduling.calendar.mode,'workdays');
 const ws=model.normalizeWorkspace({projects:[changed,two],selectedId:'project-two'});assert.equal(ws.projects[0].scheduling.calendar.mode,'workdays');
});
test('unlinking, deleting task and re-linking keeps typed metadata in sync',()=>{
 const original=pmod.updateTypedLink(model.makeProject(raw()),'A','B','FF',3);
 const unlinked=model.setTaskDependencies(original,'B',[]);
 assert.deepEqual(unlinked.scheduling.links.map(e=>[e.predecessorId,e.successorId]),[['B','C']]);
 const relinked=model.setTaskDependencies(unlinked,'B',['A']);
 assert.deepEqual(relinked.scheduling.links.map(e=>[e.predecessorId,e.successorId,e.type]),[['A','B','FS'],['B','C','FS']]);
 const deleted=pmod.reconcileProjectScheduling({...original,tasks:original.tasks.filter(t=>t.id!=='B').map(t=>({...t,dependsOn:[]}))});
 assert.equal(deleted.scheduling.links.length,0);
});
test('rejected imports with orphan, duplicate and malformed typed links',()=>{
 const r=raw();r.scheduling={calendar:{mode:'calendar',weekdays:[1,2,3,4,5],closed:[],opened:[]},links:[{predecessorId:'X',successorId:'B',type:'FS',lagDays:0}]};
 assert.throws(()=>model.importProject(r),/no matching/);
 r.scheduling.links=[{predecessorId:'A',successorId:'B',type:'XX',lagDays:0}];assert.throws(()=>model.importProject(r),/Invalid dependency type/);
 r.scheduling.links=[{predecessorId:'A',successorId:'B',type:'FS',lagDays:0},{predecessorId:'A',successorId:'B',type:'SS',lagDays:0}];assert.throws(()=>model.importProject(r),/Duplicate dependency settings/);
 r.scheduling.links=[];r.scheduling.calendar.closed=['2026-02-30'];assert.throws(()=>model.importProject(r),/Invalid calendar/);
});
test('validate project rejects stale stored relationships and normalizer repairs only deliberate internal unlink',()=>{
 let p=model.makeProject(raw());p={...p,scheduling:{...p.scheduling,links:[...p.scheduling.links,{predecessorId:'X',successorId:'C',type:'FS',lagDays:0}]}};
 assert.throws(()=>model.validateProject(p),/no matching/);
 assert.equal(pmod.reconcileProjectScheduling(p).scheduling.links.length,2);
});
test('working calendar controls only affects selected project and audits do not mutate',()=>{
 let p=model.makeProject(raw());p=pmod.updateCalendar(p,{mode:'workdays',weekdays:[1,2,3,4,5],closed:['2026-11-09'],opened:[]});
 const before=JSON.stringify(p);const info=pmod.audit(p);
 assert.ok(info.issues.some(x=>x.code==='invalid_schedule'));assert.equal(JSON.stringify(p),before);
});
test('calendar validation rejects empty weekdays, bad ISO dates and contradictions',()=>{
 const p=model.makeProject(raw());
 assert.throws(()=>pmod.updateCalendar(p,{mode:'workdays',weekdays:[],closed:[],opened:[]}),/weekday/);
 assert.throws(()=>pmod.updateCalendar(p,{mode:'calendar',weekdays:[1],closed:['2026-02-30'],opened:[]}),/date/);
 assert.throws(()=>pmod.updateCalendar(p,{mode:'workdays',weekdays:[1],closed:['2026-11-09'],opened:['2026-11-09']}),/contradictory/);
});
test('schedule preview is read-only, applying invalidates verification and stale edits reject',()=>{
 let p=model.makeProject(raw());p={...p,tasks:p.tasks.map(t=>t.id==='A'?{...t,start:'2026-11-09',due:'2026-11-11'}:t)};
 const before=JSON.stringify(p),preview=pmod.preview(p,['A']);
 assert.equal(JSON.stringify(p),before);assert.equal(preview.canApply,true);assert.deepEqual(preview.changes.map(c=>c.taskId),['B','C']);
 const scheduled=pmod.apply(p,preview);assert.equal(scheduled.tasks.find(t=>t.id==='B').verified,false);
 assert.equal(scheduled.tasks.find(t=>t.id==='B').merged,false);
 assert.equal(p.tasks.find(t=>t.id==='B').verified,true);assert.throws(()=>pmod.apply({...p,tasks:p.tasks.map(t=>t.id==='B'?{...t,title:'new',updatedAt:'later'}:t)},preview),/Stale/);
});
test('edit metadata retained across task date adjustment and read-only audit',()=>{
 let p=pmod.updateTypedLink(model.makeProject(raw()),'A','B','FF',1);
 p=model.shiftTask(p,'A',1);
 const next=pmod.reconcileProjectScheduling(p);
 assert.equal(next.scheduling.links[0].type,'FF');assert.equal(next.scheduling.links[0].lagDays,1);
 assert.equal(pmod.audit(next).links[0].type,'FF');
});
test('no unsanctioned automatic scheduling on imports and restored backups',()=>{
 const r=raw();r.tasks[1].start='2026-11-01';
 const imported=model.importProject(r),before=model.workspaceSnapshot({selectedId:imported.id,projects:[imported]},'before');
 const r2=model.restoreSnapshot({selectedId:imported.id,projects:[imported]},before).projects[0];
 assert.equal(imported.tasks[1].start,'2026-11-01');assert.equal(r2.tasks[1].start,'2026-11-01');
 assert.ok(pmod.audit(r2).issues.length>0);
});
test('editing typed links reopens successor verification and downgrades Released gate',()=>{
 const original=model.makeProject(raw());
 const updated=pmod.updateTypedLink(original,'A','B','SS',1);
 assert.equal(updated.tasks.find(t=>t.id==='B').verified,false);
 assert.equal(updated.tasks.find(t=>t.id==='B').merged,false);
 assert.equal(updated.releases[0].status,'Testing');
 assert.equal(original.releases[0].status,'Released');
 assert.equal(pmod.updateTypedLink(original,'A','B','FS',0),original);
});
test('task dependency changes invalidate downstream evidence and release status',()=>{
 let p=model.makeProject(raw());p={...p,tasks:p.tasks.map(t=>t.id==='C'?{...t,verified:true,merged:true,releaseId:'rel1'}:t)};
 p=model.setTaskDependencies(p,'B',[]);
 assert.equal(p.tasks.find(t=>t.id==='B').verified,false);
 assert.equal(p.tasks.find(t=>t.id==='C').verified,false);
 assert.equal(p.releases[0].status,'Testing');
});
test('deleting a task clears metadata and invalidates dependents, never leaves Released',()=>{
 let p=model.makeProject(raw());
 p=model.deleteTaskWithLinks(p,'B');
 assert.deepEqual(p.tasks.map(t=>t.id),['A','C']);
 assert.equal(p.scheduling.links.length,0);
 assert.equal(p.releases[0].status,'Testing');
 assert.deepEqual(p.tasks.find(t=>t.id==='C').dependsOn,[]);
 assert.throws(()=>model.deleteTaskWithLinks(p,'B'),/Task not found/);
});
test('typed dependencies attach to correct Gantt anchor endpoints',()=>{
 const g=require('../src/gantt.cjs');
 const proj=model.makeProject(raw());
 const rows=g.layoutRows(g.buildRows(proj.tasks,'status'),60);const start=g.dayNumber('2026-11-01');
 const paths=g.dependencyGeometry(rows,start,24,[{predecessorId:'A',successorId:'B',type:'SS',lagDays:0}]);
 const path=paths.find(x=>x.fromId==='A'&&x.toId==='B');
 assert.equal(path.x1,g.barGeometry(proj.tasks[0],start,24).x);
 assert.equal(path.x2,g.barGeometry(proj.tasks[1],start,24).x);
 const ff=g.dependencyGeometry(rows,start,24,[{predecessorId:'A',successorId:'B',type:'FF',lagDays:0}]).find(x=>x.toId==='B');
 assert.equal(ff.x2,g.barGeometry(proj.tasks[1],start,24).endX);
});
