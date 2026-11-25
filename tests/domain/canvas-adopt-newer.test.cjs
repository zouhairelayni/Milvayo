// /tests/domain/canvas-adopt-newer.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {decide,keepSelection}=require('../../src/canvas/adoptNewer.cjs');
// Planner-tested only: the decision logic and the wiring text. The open Canvas screen itself is checked on devices.
test('an open Canvas takes a newer board only when it has no unsaved change of its own',()=>{
 assert.equal(decide({pending:false,expected:2,board:{revision:3}}),'adopt','someone else changed the board');
 assert.equal(decide({pending:false,expected:2,board:{revision:2}}),'same','my own save: nothing to take');
 assert.equal(decide({pending:true,expected:2,board:{revision:3}}),'keep','my unsaved change is never replaced silently');
 assert.equal(decide({pending:false,expected:5,board:{revision:4}}),'same','an older board is never taken back');
 assert.equal(decide({pending:false,expected:0,board:null}),'same');
});
test('selection keeps only objects that still exist',()=>{
 assert.deepEqual(keepSelection(['a','b','c'],{objects:[{id:'a'},{id:'c'}]}),['a','c']);assert.deepEqual(keepSelection(undefined,{objects:[]}),[]);
});
test('the editor wires the decision in: adopts the board, resets history, keeps valid selection',()=>{
 const src=fs.readFileSync('src/screens/canvas/CanvasEditor.js','utf8');
 assert.match(src,/require\('\.\.\/\.\.\/canvas\/adoptNewer\.cjs'\)/);
 assert.match(src,/adoptNewer\.decide\(\{pending:pending\.current,expected:expected\.current,board\}\)!=='adopt'/);
 assert.match(src,/current\.current=board;expected\.current=board\.revision;undo\.current=\[\];redo\.current=\[\];setDraft\(board\);setSelected\(prev=>adoptNewer\.keepSelection\(prev,board\)\)/);
});
