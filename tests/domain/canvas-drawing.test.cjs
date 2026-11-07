// /tests/domain/canvas-drawing.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const c=require('../../src/domain/canvas.cjs'),{erasedStrokeIds}=require('../../src/canvas/drawing.cjs');
const now='2026-11-07T04:00:00.000Z';
test('brush widths and colors survive backup, reject invalid widths and erase only actual unlocked stroke geometry',()=>{
 let board=c.createBoard({id:'b',projectId:'p',now});const stroke=c.createObject({id:'stroke',boardId:'b',type:'draw',points:[{x:0,y:0},{x:100,y:100}],width:100,height:100,strokeWidth:12,color:'#80A7EF',now});board=c.changeBoard(board,{type:'add',objects:[stroke]},now);
 let serial=0;const imported=c.importBoard(c.exportBoard(board),{id:'copy',projectId:'p',now,nextId:()=>`i${serial++}`});assert.equal(imported.objects[0].strokeWidth,12);assert.equal(imported.objects[0].color,'#80A7EF');
 assert.throws(()=>c.changeBoard(board,{type:'patch',id:'stroke',patch:{strokeWidth:Infinity}},now),/brush width/);
 assert.deepEqual(erasedStrokeIds(board.objects,[{x:0,y:100},{x:100,y:0}],2),['stroke']);assert.deepEqual(erasedStrokeIds(board.objects,[{x:1,y:99}],2),[],'empty bounding-box area stays untouched');assert.deepEqual(erasedStrokeIds([{...stroke,locked:true}],[{x:50,y:50}],20),[]);
 const old=c.normalizeBoard({...board,objects:[{...stroke,strokeWidth:undefined}]},'p');assert.equal(old.objects[0].strokeWidth,2,'earlier drawings keep their original width');
 const removed=c.changeBoard(board,{type:'remove',ids:erasedStrokeIds(board.objects,[{x:50,y:50}],2)},now);assert.equal(removed.objects.length,0);assert.equal(c.changeBoard(removed,{type:'restore',content:c.contentOf(board)},now).objects[0].strokeWidth,12);
});
