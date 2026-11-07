// /tests/domain/canvas-sources.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const model=require('../../src/domain/model.cjs'),{readSource,captureSource,createSourceResolver}=require('../../src/canvas/sources.cjs'),c=require('../../src/domain/canvas.cjs');
const now='2026-11-07T04:00:00.000Z';
test('live sources update on relevant changes while snapshots freeze, metadata edits reuse projections and missing links redact',()=>{
 const p=model.makeProject({id:'p',tasks:[{id:'t',title:'Scope',due:'2026-11-09'}]});const link={sourceType:'task',sourceId:'t',projectId:'p',mode:'live'};
 const resolve=createSourceResolver(),first=resolve.resolve(p,link),snapshot=captureSource(p,link,now),edited={...p,tasks:p.tasks.map(t=>({...t,title:'New scope'}))};
 assert.equal(readSource(edited,link).title,'New scope');assert.equal(readSource(edited,snapshot).title,'Scope');assert.equal(resolve.resolve({...p,name:'Unrelated name'},link),first);
 assert.equal(readSource({...p,tasks:[]},link).available,false);assert.equal(readSource({...p,id:'other'},link).available,false);assert.equal(readSource({...p,archived:true},link).available,false);
 const b=c.createBoard({id:'b',projectId:'p',now});const object=c.createObject({id:'o',boardId:b.id,type:'linked',sourceLink:link,now});const linked=c.changeBoard(b,{type:'add',objects:[object]},now);assert.throws(()=>c.duplicateBoard(linked,{id:'q',projectId:'other',now,nextId:()=> 'new'}),/another project/);
});
test('roadmaps use canonical dates and phase/sprint/milestone scopes without writing a second schedule',()=>{
 const p=model.makeProject({id:'p',tasks:[{id:'a',title:'Start',start:'2026-11-07',due:'2026-11-09',milestone:true},{id:'b',title:'No date'}]});const before=JSON.stringify(p);
 const link={sourceType:'roadmap',sourceId:p.id,projectId:p.id,mode:'live'};assert.equal(readSource(p,link).tasks.length,1);assert.equal(readSource(p,{...link,scopeType:'milestones'}).tasks.length,1);assert.equal(JSON.stringify(p),before);
});
test('project task diagrams contain canonical parent/subtask nodes for all three layouts without changing WBS',()=>{
 const p=model.makeProject({id:'p',tasks:[{id:'parent',title:'Delivery'},{id:'child',title:'Review',parentId:'parent'}]}),before=JSON.stringify(p.governance.wbs);
 for(const view of ['tree','fishbone','mind']){const result=readSource(p,{sourceType:'taskDiagram',sourceId:p.id,projectId:p.id,mode:'live',view});assert.equal(result.kind,'diagram');assert.equal(result.nodes.length,3);assert.equal(result.nodes.find(n=>n.id==='task:child').parent,'task:parent');}
 assert.equal(JSON.stringify(p.governance.wbs),before);
});
test('large project diagrams fail with an explicit limit and long canonical task IDs can be snapshotted intact',()=>{
 const p=model.makeProject({id:'long',tasks:[{id:'t'.repeat(120),title:'Long ID'}]}),link={projectId:p.id,sourceType:'taskDiagram',sourceId:p.id,mode:'live',view:'mind'},snapshot=captureSource(p,link,now);assert.equal(readSource(p,snapshot).nodes[1].id,'task:'+'t'.repeat(120));
 const large=model.makeProject({id:'big',tasks:Array.from({length:500},(_,i)=>({id:'t'+i,title:'Task '+i}))});const result=readSource(large,{...link,projectId:large.id,sourceId:large.id});assert.equal(result.available,false);assert.match(result.lines[0],/499/);
});
test('cross-project snapshot imports preserve the origin project so source navigation cannot target a coincidental task ID',()=>{
 const project=model.makeProject({id:'origin',tasks:[{id:'same',title:'Original task'}]}),link=captureSource(project,{sourceType:'task',sourceId:'same',projectId:project.id,mode:'live'},now);let board=c.createBoard({id:'board',projectId:project.id,now});board=c.changeBoard(board,{type:'add',objects:[c.createObject({id:'o',boardId:board.id,type:'linked',sourceLink:link,now})]},now);let serial=0;const copy=c.importBoard(c.exportBoard(board),{id:'copy',projectId:'destination',now,nextId:()=>`copy${serial++}`}),source=copy.objects[0].sourceLink;assert.equal(source.projectId,'destination');assert.equal(source.originProjectId,'origin');assert.equal(readSource(model.makeProject({id:'destination',tasks:[{id:'same',title:'Unrelated task'}]}),source).title,'Original task');
});
