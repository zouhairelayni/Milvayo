// /tests/store/canvas-storage.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const model=require('../../src/domain/model.cjs'),canvas=require('../../src/domain/canvas.cjs'),storage=require('../../src/store/canvasStorage.cjs');
const now='2026-11-07T04:00:00.000Z';
test('Canvas storage refuses growth past Android row headroom without losing existing tasks, boards or recovery',()=>{
 const p=model.makeProject({id:'p',tasks:[{id:'t',title:'Canonical'}]}),w=model.normalizeWorkspace({projects:[p],selectedId:'p'}),b=canvas.createBoard({id:'b',projectId:'p',now});
 const saved=storage.saveCanvas(w,b,null);assert.equal(saved.projects[0].tasks,w.projects[0].tasks);assert.equal(w.projects[0].canvases.length,0);
 const objects=Array.from({length:110},(_,i)=>canvas.createObject({id:'n'+i,boardId:b.id,text:'文'.repeat(5000),now}));
 const tooLarge=canvas.changeBoard(b,{type:'add',objects},now);const before=JSON.stringify(saved);assert.throws(()=>storage.saveCanvas(saved,tooLarge,b.revision),/storage space/);assert.equal(JSON.stringify(saved),before);
});
test('archived Canvas deletion retains a restorable pre-delete snapshot',()=>{
 const b=canvas.changeBoard(canvas.createBoard({id:'b',projectId:'p',now}),{type:'archive',archived:true},now),p=model.makeProject({id:'p',canvases:[b]}),w=model.normalizeWorkspace({projects:[p],selectedId:'p'}),snapshot=model.workspaceSnapshot(w,'Before deleting archived canvas');
 const next=storage.deleteCanvas(w,'b',b.revision,snapshot);assert.equal(next.projects[0].canvases.length,0);assert.equal(next.backups[0],snapshot);assert.equal(model.restoreSnapshot(next,snapshot).projects[0].canvases.length,1);
});
