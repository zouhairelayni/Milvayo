// /tests/domain/ui-automation-052.test.cjs
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const model=require('../../src/domain/model.cjs');
const read=rel=>fs.readFileSync(path.join(__dirname,'..', '..',rel),'utf8');
function fixture(){return model.makeProject({id:'p-052',tasks:[
 {id:'one',title:'Review UX',status:'Backlog',updatedAt:'2026-10-01T12:00:00Z'},
 {id:'two',title:'Review API',status:'Backlog',updatedAt:'2026-10-01T12:00:00Z',dependsOn:['one']},
 {id:'done',title:'Released',status:'Done',updatedAt:'2026-10-01T12:00:00Z'}]});}
function statusRule(destination){return {id:'np-task-checkbox-route',name:'Task checked',trigger:'status',status:'Done',enabled:true,daysBefore:0,actions:[{type:'moveStatus',value:destination}]};}
test('task check defaults to persistent Done status when no routing rule exists',()=>{
 const changed=model.moveTask(fixture(),'one','Done');
 assert.equal(changed.tasks.find(t=>t.id==='one').status,'Done');
 const restored=model.importProject(JSON.parse(JSON.stringify(changed)));
 assert.equal(restored.tasks.find(t=>t.id==='one').status,'Done');
});
test('user-configured task-check route moves to Validation and saves through import',()=>{
 const p=model.automation.saveCommand(fixture(),statusRule('Validation'));
 const changed=model.moveTask(p,'one','Done');
 assert.equal(changed.tasks.find(t=>t.id==='one').status,'Validation');
 assert.equal(changed.automationHistory.length,1);
 assert.equal(model.importProject(JSON.parse(JSON.stringify(changed))).tasks.find(t=>t.id==='one').status,'Validation');
});
test('Done automation target retains completed state and previous dependency guards',()=>{
 const p=model.automation.saveCommand(fixture(),statusRule('Done'));
 assert.equal(model.moveTask(p,'one','Done').tasks.find(t=>t.id==='one').status,'Done');
 assert.throws(()=>model.moveTask(p,'two','Done'),/dependency/i);
 assert.throws(()=>model.automation.saveCommand(p,statusRule('Unknown')),/Invalid destination status/);
});
test('card-aging automation applies to old open cards once per day and skips Done',()=>{
 const p=model.automation.saveCommand(fixture(),{id:'aging',name:'Stale cards',trigger:'aging',status:'Any',daysBefore:7,actions:[{type:'addLabel',value:'Aging'}]});
 const r=model.automation.run(p,{type:'aging'},{today:'2026-10-31'});
 assert.equal(r.applied.length,2);
 assert.deepEqual(r.project.tasks.find(t=>t.id==='done').labels,[]);
 assert.ok(r.project.tasks.find(t=>t.id==='one').labels.includes('Aging'));
 assert.equal(model.automation.run(r.project,{type:'aging'},{today:'2026-10-31'}).applied.length,0);
});
test('task-check and selection affordances are separate',()=>{
 const src=read('src/screens/tasks/Tasks.js');
 for(const expected of ["t.status==='Done'",'accessibilityRole="checkbox"',"moveTask(t.id",'onLongPress','Filter','allLabels','labelFilter'])assert.ok(src.includes(expected),expected);
 assert.ok(!src.includes("onPress={() => toggle(t.id)}"),'square must no longer toggle local-only selection');
});

test('task config is not duplicated in settings and confirmation wraps',()=>{
 const ws=read('src/screens/workspace/Workspace.js');const settings=ws.slice(ws.indexOf('export function Settings('));
 assert.ok(!settings.includes('Task type preview'));
 assert.ok(require('../helpers/ui-source.cjs')().includes("maxWidth:'100%'"));
});
