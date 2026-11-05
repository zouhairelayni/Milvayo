// /tests/domain/batch3-dead-model-0520.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const model=require('../../src/domain/model.cjs'),bridge=require('../../src/domain/modernBridge.cjs'),edit=require('../../src/timeline/timelineEdit.cjs');
const read=f=>fs.readFileSync(path.join(__dirname,'..', '..',f),'utf8');

test('functions superseded by a verified live path are removed',()=>{
 for(const n of ['stats','blankProject','shiftTask','resizeTask','boardLaneAt','boardAutoScrollDelta']){assert.equal(model[n],undefined,n);assert.ok(!new RegExp('function '+n+'\\(').test(read('src/domain/model.cjs')),n)}
 assert.equal(model.operations.portfolioStats,undefined);assert.ok(!/function portfolioStats\(/.test(read('src/domain/operations.cjs')));
});
test('tested model logic the UI does not expose yet is kept',()=>{
 for(const n of ['filterCards','dateBucket','resolveDropIndex','updateLabels'])assert.equal(typeof model.kanbanUX[n],'function',n);
 for(const n of ['bulkUpdate','descendants','hierarchyOrder'])assert.equal(typeof model.taskWorkflows[n],'function',n);
 assert.equal(typeof model.operations.capacitySummary,'function');
});
test('functions the app uses are still exported',()=>{
 for(const n of ['health','costSummary','savePortfolio','deletePortfolio','timeSummary'])assert.equal(typeof model.operations[n],'function',n);
 for(const n of ['demoProject','shiftDate','moveTask','createWorkspace'])assert.equal(typeof model[n],'function',n);
});
test('live date-edit path (Timeline > updateTask > patchTask) clears release metadata and keeps scheduling valid',()=>{
 let p=model.makeProject({tasks:[{id:'a',status:'Done',start:'2026-11-01',due:'2026-11-02'},{id:'b',status:'Done',verified:true,merged:true,start:'2026-11-03',due:'2026-11-04'}]});
 p=bridge.patchTask(p,'b',{start:'2026-11-04',due:'2026-11-05'});
 const b=p.tasks.find(t=>t.id==='b');assert.equal(b.verified,false);assert.equal(b.merged,false);assert.equal(b.start,'2026-11-04');
 assert.doesNotThrow(()=>model.validateProject(p));
});
test('live resize path: timelineEdit rules plus patchTask validation replace model.resizeTask',()=>{
 const add=(d,n)=>model.shiftDate(d,n),base={start:'2026-11-01',due:'2026-11-05'};
 assert.deepEqual(edit.apply('due',base,3,add),{start:'2026-11-01',due:'2026-11-08'});
 assert.deepEqual(edit.apply('due',base,-20,add),{start:'2026-11-01',due:'2026-11-01'});
 const p=model.makeProject({tasks:[{id:'t',start:base.start,due:base.due}]});
 assert.throws(()=>bridge.patchTask(p,'t',{due:'2026-10-01'}),/Due date cannot precede/);
});
test('portfolio health the screens show comes from operations.health (replaces portfolioStats)',()=>{
 const p=model.makeProject({id:'p',name:'P',tasks:[{id:'a',status:'Done'},{id:'b',status:'Backlog'}]});
 const h=model.operations.health(p);assert.equal(h.total,2);assert.equal(h.done,1);assert.equal(h.progress,50);
});
test('Board card age uses powerUps.ageInDays, same result as the old inline maths',()=>{
 assert.match(read('src/screens/board/Board.js'),/\{ageInDays\} = require\('\.\.\/\.\.\/domain\/powerUps\.cjs'\)/);
 assert.match(read('src/screens/board/Board.js'),/Updated \{ageInDays\(t\)\}d ago/);
 const pu=model.powerUps,now=new Date('2026-11-10T12:00:00Z');
 assert.equal(pu.ageInDays({updatedAt:'2026-11-07T12:00:00Z'},now),3);assert.equal(pu.ageInDays({createdAt:'2026-11-09T00:00:00Z'},now),1);
 assert.equal(pu.ageInDays({},now),0);assert.equal(pu.ageInDays({updatedAt:'2026-12-01T00:00:00Z'},now),0);
});
