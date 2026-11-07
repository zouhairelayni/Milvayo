// /tests/domain/canvas-groups.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),canvas=require('../../src/domain/canvas.cjs'),{groupProblem}=require('../../src/domain/canvasGroups.cjs');
const now='2026-11-07T04:00:00.000Z';
function fixture(){const b=canvas.createBoard({id:'b',projectId:'p',now}),objects=['note','diagram'].map((type,i)=>canvas.createObject({id:'o'+i,boardId:'b',type,x:40+i*120,y:40,width:80,height:64,now,...(type==='diagram'?{nodes:[{id:'w0',parent:null,name:'Root',hours:0}],diagramType:'tree'}:{})}));return canvas.changeBoard(b,{type:'add',objects},now);}
test('atomic grouping, move, resize, ungroup, undo and import preserve world positions and diagram internals',()=>{
 let b=fixture();const original=canvas.contentOf(b),frame=canvas.createObject({id:'g',boardId:'b',type:'frame',x:20,y:20,width:300,height:200,now});b=canvas.changeBoard(b,{type:'group',ids:['o0','o1'],frame},now);assert.deepEqual(b.objects.slice(1).map(o=>[o.x,o.y]),[[40,40],[160,40]]);
 b=canvas.changeBoard(b,{type:'move',ids:['g'],dx:30,dy:40},now);assert.equal(b.objects.find(o=>o.id==='o0').x,70);
 b=canvas.changeBoard(b,{type:'patch',id:'g',patch:{width:600,height:400}},now);const diagram=b.objects.find(o=>o.id==='o1');assert.deepEqual([diagram.x,diagram.y,diagram.width,diagram.height],[330,100,160,128]);assert.deepEqual(diagram.nodes,original.objects[1].nodes);
 const positions=b.objects.map(o=>[o.id,o.x,o.y,o.width,o.height]);b=canvas.changeBoard(b,{type:'ungroup',id:'g'},now);assert.deepEqual(b.objects.map(o=>[o.id,o.x,o.y,o.width,o.height]),positions);assert.ok(b.objects.every(o=>!o.groupId));
 const restored=canvas.importBoard(canvas.exportBoard(b),{id:'copy',projectId:'p',now,nextId:(()=>{let n=0;return()=>''+(++n);})()});assert.deepEqual(restored.objects.map(o=>[o.x,o.y,o.width,o.height]),b.objects.map(o=>[o.x,o.y,o.width,o.height]));assert.equal(canvas.changeBoard(b,{type:'restore',content:original},now).objects.length,2);
});
test('nested groups, locked children, invalid resize and stale gesture coordinates fail without mutating the board',()=>{
 let b=fixture();assert.match(groupProblem(b.objects,['o0']),/two/);const frame=canvas.createObject({id:'g',boardId:'b',type:'frame',x:20,y:20,width:300,height:200,now});b=canvas.changeBoard(b,{type:'group',ids:['o0','o1'],frame},now);const before=JSON.stringify(b);assert.match(groupProblem(b.objects,['g','o0']),/nested/);assert.throws(()=>canvas.changeBoard(b,{type:'group',ids:['g','o0'],frame:{...frame,id:'nested'}},now),/nested/);assert.equal(JSON.stringify(b),before);
 const locked=canvas.changeBoard(b,{type:'lock',id:'o1',locked:true},now);assert.throws(()=>canvas.changeBoard(locked,{type:'patch',id:'g',patch:{width:600,height:400}},now),/Unlock/);assert.throws(()=>canvas.changeBoard(b,{type:'patch',id:'g',patch:{width:40,height:32}},now),/Invalid object|proportionally/);
 const moved=canvas.changeBoard(b,{type:'move',ids:['o0'],dx:10,dy:0},now);assert.throws(()=>canvas.changeBoard(moved,{type:'move',ids:['o0'],dx:20,dy:10,bases:[b.objects.find(o=>o.id==='o0')]},now),/position changed/);
});

test('alignment translates grouped descendants exactly once and rejects a selection containing only one independent root',()=>{
 let b=fixture();const frame=canvas.createObject({id:'g',boardId:'b',type:'frame',x:20,y:20,width:300,height:200,now});b=canvas.changeBoard(b,{type:'group',ids:['o0','o1'],frame},now);b=canvas.changeBoard(b,{type:'add',objects:[canvas.createObject({id:'outside',boardId:'b',x:-100,y:100,now})]},now);const before=b.objects.find(o=>o.id==='o0');const aligned=canvas.changeBoard(b,{type:'align',ids:['g','o0','outside']},now);assert.equal(aligned.objects.find(o=>o.id==='g').x,-100);assert.equal(aligned.objects.find(o=>o.id==='o0').x,before.x-120);assert.throws(()=>canvas.changeBoard(b,{type:'align',ids:['g','o0']},now),/independent/);
});
