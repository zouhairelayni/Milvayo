'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const model=require('../src/model.cjs');
const ux=model.kanbanUX;
const task=(id,extra={})=>model.defaultTask({id,title:`Example ${id}`,owner:'Alex',...extra});
const project=()=>model.makeProject({id:'p',name:'Fixture',code:'FX',tasks:[
 task('a',{due:'2026-10-20',priority:'High',labels:['red'],position:0}),
 task('b',{due:'2026-10-31',priority:'Low',owner:'Sam',labels:['green'],position:1}),
 task('c',{due:'2026-11-01',priority:'Medium',labels:['red'],position:2}),
 task('d',{status:'Done',due:'2026-10-20',priority:'Low',position:3})
]});
test('Kan date classification never claims completed tasks are overdue',()=>{
 const p=project();const d='2026-10-31';assert.equal(ux.dateBucket(p.tasks[0],d),'overdue');assert.equal(ux.dateBucket(p.tasks[1],d),'today');assert.equal(ux.dateBucket(p.tasks[2],d),'tomorrow');assert.equal(ux.dateBucket(p.tasks[3],d),'later');assert.equal(ux.dateBucket({due:''},d),'none');
});
test('Kan filters work together and never mutate original tasks',()=>{
 const p=project();const old=JSON.stringify(p.tasks);assert.deepEqual(ux.filterCards(p.tasks,{priority:'High',label:'red',owner:'Alex',due:'overdue'},'2026-10-31').map(t=>t.id),['a']);assert.equal(JSON.stringify(p.tasks),old);
 assert.deepEqual(ux.filterCards(p.tasks,{due:'week'},'2026-10-31').map(t=>t.id),['b','c']);assert.deepEqual(ux.filterCards(p.tasks,{due:'none'},'2026-10-31'),[]);
 assert.deepEqual(ux.filterCards(p.tasks,{text:'EXAMPLE C'},'2026-10-31').map(t=>t.id),['c']);
});
test('Kan rejects unsupported due/priority filters',()=>{assert.throws(()=>ux.filterCards([],{due:'forever'}));assert.throws(()=>ux.filterCards([],{priority:'ultra'}));});
test('Kan duplicate strips verification, Git refs, scheduling predecessors and sprint membership',()=>{
 const p=project();p.tasks[0].verified=true;p.tasks[0].merged=true;p.tasks[0].sprintId='';p.tasks[0].dependsOn=['b'];p.tasks[0].tests=[{id:'test',title:'Check',result:'passed',evidence:'signed'}];
 const copy=ux.duplicateCard(p,'a','x','2026-10-31T00:00:00.000Z');const t=copy.tasks.at(-1);
 assert.equal(p.tasks.length,4);assert.equal(t.status,'Backlog');assert.equal(t.title,'Example a (copy)');assert.equal(t.verified,false);assert.equal(t.merged,false);assert.equal(t.sprintId,'');assert.deepEqual(t.dependsOn,[]);assert.deepEqual(t.githubLinks,[]);assert.equal(t.tests[0].result,'pending');assert.equal(t.tests[0].evidence,'');model.validateProject(copy);
});
test('Kan duplicate rejects unknown or duplicate IDs',()=>{assert.throws(()=>ux.duplicateCard(project(),'unknown','x'));assert.throws(()=>ux.duplicateCard(project(),'a','a'));});
test('Kan label editor deduplicates, revokes verification, blocks oversized lists',()=>{
 const p=project();p.tasks[0].verified=true;const n=ux.updateLabels(p,'a',['  green ','green','red']);assert.deepEqual(n.tasks[0].labels,['green','red']);assert.equal(n.tasks[0].verified,false);assert.deepEqual(p.tasks[0].labels,['red']);assert.throws(()=>ux.updateLabels(p,'a',Array(31).fill('x')));
});
test('Kan per-board description preference survives JSON normalization',()=>{
 const p=project(),next=ux.setBoardView(p,'board-default',{showDescriptions:true});assert.equal(next.kanbanViews['board-default'].showDescriptions,true);assert.equal(model.importProject(JSON.parse(JSON.stringify(next))).kanbanViews['board-default'].showDescriptions,true);assert.equal(p.kanbanViews['board-default'],undefined);
});
test('Kan additional boards isolate display preferences and remove deleted entries',()=>{
 const p=project(),other=model.boards.createBoard(p,'Ops');const id=other.boards.at(-1).id;
 let n=ux.setBoardView(other,id,{showDescriptions:true});n=ux.setBoardView(n,'board-default',{showDescriptions:false});assert.equal(n.kanbanViews[id].showDescriptions,true);assert.equal(n.kanbanViews['board-default'].showDescriptions,false);const deleted=model.boards.deleteBoard(n,id);assert.equal(deleted.kanbanViews[id],undefined);model.validateProject(deleted);
});
test('Kan drop index respects hidden cards under active filter',()=>{
 const all=project().tasks.filter(t=>t.status==='Backlog');const visible=all.filter(t=>t.labels.includes('red'));
 assert.equal(ux.resolveDropIndex(all,visible,'Backlog',0,'b'),0);
 assert.equal(ux.resolveDropIndex(all,visible,'Backlog',1,'b'),1);
 assert.equal(ux.resolveDropIndex(all,visible,'Backlog',2,'b'),2);
 assert.equal(ux.resolveDropIndex(all,[],'Backlog',0,'b'),2);
});
test('Kan Atlas-sized fixture survives import after new board preferences',()=>{
 const atlas=JSON.parse(fs.readFileSync(path.join(__dirname,'..','examples','ATLAS-MOCK.project.json'),'utf8'));
 const p=model.importProject(atlas);assert.equal(p.tasks.length,73);const updated=ux.setBoardView(p,'board-default',{showDescriptions:true});assert.equal(model.importProject(JSON.parse(JSON.stringify(updated))).kanbanViews['board-default'].showDescriptions,true);
});
test('modern board retains card/list gesture logic and management actions',()=>{const source=fs.readFileSync(path.join(__dirname,'../src/screens/Board.js'),'utf8');for(const name of ['boardGesture','moveListTo','placeTask','openTask','onScroll'])assert.ok(source.includes(name),name)});
