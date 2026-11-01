'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const m=require('../src/model.cjs'),b=require('../src/modernBridge.cjs');
const make=()=>m.makeProject({id:'p',name:'Niyarvo example',code:'NP',tasks:[
 {id:'one',title:'One',status:'Backlog',priority:'Critical',start:'2026-11-01',due:'2026-11-05',labels:['important'],estimateHours:3,customValues:{},tests:[{id:'ch',title:'Check',result:'pending'}]},
 {id:'two',title:'Two',status:'In progress',dependsOn:['one'],start:'2026-11-04',due:'2026-11-08'},
 {id:'three',title:'Three',status:'Validation',start:'',due:''}
 ]});
const ws=p=>m.normalizeWorkspace({schemaVersion:1,selectedId:p.id,projects:[p],activity:[],backups:[]});
test('legacy board and tasks are projected without mutating the source',()=>{const p=make(),j=JSON.stringify(p),view=b.projectView(ws(p));assert.equal(view.boards.length,1);assert.equal(view.boards[0].lists.length,4);assert.equal(view.tasks.length,3);assert.equal(view.tasks[0].effort,3);assert.equal(view.tasks[0].board,b.MAIN);assert.equal(JSON.stringify(p),j)});
test('create list and rename persist through original workspace import, retaining IDs',()=>{let p=b.addList(make(),b.MAIN,'Ready for review','Validation');const id=p.boards[0].lists[0].id;p=b.renameList(p,b.MAIN,id,'Ready');const restored=m.normalizeWorkspace(JSON.parse(JSON.stringify(ws(p)))).projects[0];assert.equal(restored.boards[0].lists[0].id,id);assert.equal(restored.boards[0].lists[0].name,'Ready');assert.equal(restored.tasks[0].id,'one')});
test('drag task to new list persists custom field and test evidence',()=>{let p=b.addList(make(),b.MAIN,'Waiting','In progress');const id=p.boards[0].lists[0].id;p=b.placeTask(p,'one',id,null);p=m.importProject(JSON.parse(JSON.stringify(p)));assert.equal(p.tasks.find(x=>x.id==='one').listId,id);assert.equal(p.tasks.find(x=>x.id==='one').status,'In progress');assert.deepEqual(p.tasks.find(x=>x.id==='one').labels,['important']);assert.equal(p.tasks.find(x=>x.id==='one').tests[0].id,'ch')});
test('blockers prevent Done drops and preserve original project after failure',()=>{const p=make(),before=JSON.stringify(p);assert.throws(()=>b.changeStatus(p,'two','Done'),/Complete dependency/);assert.equal(JSON.stringify(p),before)});
test('cycle validation is enforced in modern task editor',()=>{const p=make();assert.throws(()=>b.patchTask(p,'one',{dependsOn:['two']}),/Circular/)});
test('invalid date cannot silently corrupt a scheduled task',()=>{const p=make();assert.throws(()=>b.patchTask(p,'one',{due:'2026-02-30'}),/real YYYY/);assert.throws(()=>b.patchTask(p,'one',{due:'2026-10-30'}),/precede/)});
test('list delete migrates tasks instead of dropping them',()=>{let p=b.addList(make(),b.MAIN,'Queue','Backlog');const id=p.boards[0].lists[0].id;p=b.placeTask(p,'one',id,null);p=b.deleteList(p,b.MAIN,id);assert.equal(p.tasks.length,3);assert.equal(b.projectView(ws(p)).tasks.find(x=>x.id==='one').list,p.boards[0].lists.find(x=>x.status==='Backlog').id)});
test('cannot remove final list, invalid list, or protected board',()=>{let p=make();assert.throws(()=>b.deleteBoard(p,b.MAIN),/cannot be deleted/);assert.throws(()=>b.addList(p,b.MAIN,'  ','Done'),/List name/);p=b.addList(p,b.MAIN,'A','Done');assert.throws(()=>b.placeTask(p,'one','missing',null),/List missing/)});
test('board delete preserves task and sends it to Main',()=>{let p=b.addBoard(make(),'Mobile');const board=p.boards.at(-1);p=m.boards.assignBoard(p,'one',board.id);p=b.deleteBoard(p,board.id);assert.equal(p.tasks.length,3);assert.equal(p.tasks[0].boardId,b.MAIN);assert.equal(p.tasks[0].listId,'')});
test('historic cost uses rate snapshot not current rate',()=>{let p=make();p=m.operations.addResource(p,{name:'Ava',weeklyHours:40,hourlyRate:30});p=m.operations.logTime(p,{taskId:'one',owner:'Ava',date:'2026-10-31',hours:2});p={...p,resources:p.resources.map(r=>({...r,hourlyRate:60}))};const view=b.projectView(ws(p));assert.equal(view.actualLabour,60);assert.equal(view.tasks.find(t=>t.id==='one').logged,2)});
test('real 73-task Atlas fixture projects cleanly without fake seed tasks',()=>{const json=JSON.parse(fs.readFileSync(path.join(__dirname,'..','examples','ATLAS-MOCK.project.json'),'utf8'));const p=m.importProject(json),v=b.projectView(ws(p));assert.equal(v.tasks.length,73);assert.ok(v.boards[0].lists.every(l=>l.id.includes('board-default')))});
test('list order survives normalisation',()=>{let p=b.addList(make(),b.MAIN,'First','Backlog');const first=p.boards[0].lists[0].id;p=b.moveListTo(p,b.MAIN,first,2);p=m.importProject(JSON.parse(JSON.stringify(p)));assert.equal(p.boards[0].lists[2].id,first)});
test('status transition still updates sprint burndown history',()=>{let p=make();p=m.agile.createSprint(p,{id:'s1',name:'Test',start:'2026-10-30',end:'2026-11-02'});p=m.agile.assign(p,'one','s1');p=m.agile.startSprint(p,'s1');const next=b.reconcile(p,b.changeStatus(p,'one','Done'));assert.equal(next.sprints[0].history.at(-1).remaining,0)});
test('new task is created with the target board and list in the canonical model',()=>{
 let p=b.addBoard(make(),'Launch');const board=p.boards.at(-1);
 p=b.addList(p,board.id,'Editorial','Validation');const lane=p.boards.at(-1).lists[0];
 const out=b.addTask(p,'Review the rollout','Validation',board.id,{list:lane.id,priority:'High',labels:['launch']});
 const restored=m.importProject(JSON.parse(JSON.stringify(out.project)));
 const t=restored.tasks.find(t=>t.id===out.id);
 assert.ok(t);assert.equal(t.boardId,board.id);assert.equal(t.listId,lane.id);assert.equal(t.status,'Validation');assert.deepEqual(t.labels,['launch']);
});
test('task delivery evidence and attachment references survive persisted workspace round-trip',()=>{
 let p=make();p=b.patchTask(p,'one',{expected:'Expected',actual:'Passed',evidence:'QA run 41',rollback:'Restore the last build',repo:'niyarvo',branch:'work',commit:'abc',mainSha:'def',attachments:[{id:'a1',name:'Screenshot',url:'https://example.com/qa.png'}],tests:[{id:'ch',title:'Check',result:'passed',evidence:'Recorded'}]});
 const restored=ws(p).projects[0].tasks.find(t=>t.id==='one');
 assert.equal(restored.tests[0].evidence,'Recorded');assert.equal(restored.evidence,'QA run 41');assert.equal(restored.mainSha,'def');assert.equal(restored.attachments[0].url,'https://example.com/qa.png');
});
test('verification requires evidence, then preserves merge checkpoint and rejects stale verification',()=>{
 let p=make();const task=()=>p.tasks.find(t=>t.id==='one');
 assert.throws(()=>m.verifyTask(task()),/evidence/);
 p=b.patchTask(p,'one',{actual:'Fine',evidence:'Test log',mainSha:'deadbeef',tests:[{id:'ch',title:'Check',result:'passed',evidence:'Log'}]});
 p={...p,tasks:p.tasks.map(t=>t.id==='one'?m.verifyTask(t):t)};
 p={...p,tasks:p.tasks.map(t=>t.id==='one'?m.mergeTask(t):t)};
 assert.equal(task().verified,true);assert.equal(task().merged,true);
 p=b.patchTask(p,'one',{title:'Changed scope'});assert.equal(task().verified,false);assert.equal(task().merged,false);
});
test('board archive flag survives normalization; archived board and tasks remain intact',()=>{
 let p=b.addBoard(make(),'Archive me');const id=p.boards.at(-1).id;p=m.boards.assignBoard(p,'one',id);
 p=b.archiveBoard(p,id,true);p=m.importProject(JSON.parse(JSON.stringify(p)));
 assert.equal(p.boards.find(x=>x.id===id).archived,true);
 assert.equal(p.tasks.find(x=>x.id==='one').boardId,id);
});
