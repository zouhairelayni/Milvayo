// /tests/domain/governance-wbs-roundtrip.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {normalizeGovernance}=require('../../src/domain/governanceCore.cjs'),model=require('../../src/domain/model.cjs');
test('a 500-element legacy WBS preserves every element when its synthesized root is saved and imported repeatedly',()=>{
 const raw={wbs:Array.from({length:500},(_,i)=>({id:'node'+i,parent:'w0',name:'Work '+i}))},first=normalizeGovernance(raw),second=normalizeGovernance(first);assert.equal(first.wbs.length,501);assert.deepEqual(second.wbs,first.wbs);assert.equal(second.wbs.at(-1).id,'node499');
 const project=model.makeProject({id:'p',governance:raw}),round=model.importProject(JSON.parse(JSON.stringify(project)));assert.deepEqual(round.governance.wbs,project.governance.wbs);
 const {captureSource,readSource}=require('../../src/canvas/sources.cjs'),snapshot=captureSource(round,{projectId:'p',sourceType:'wbs',sourceId:'w0',mode:'live',view:'tree'},'2026-11-07T04:00:00.000Z');assert.equal(readSource(round,snapshot).nodes.length,501);
 assert.throws(()=>normalizeGovernance({wbs:[...raw.wbs,{id:'extra',parent:'w0',name:'Extra'}]}),/500 work elements/);assert.equal(raw.wbs.length,500,'rejected normalization leaves original data intact');
});
