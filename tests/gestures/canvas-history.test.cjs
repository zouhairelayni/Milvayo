// /tests/gestures/canvas-history.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{pushHistory,MAX_HISTORY_BYTES}=require('../../src/canvas/history.cjs');
test('undo history keeps recent operations within count and byte budgets, including multibyte notes',()=>{
 let stack=[];for(let i=0;i<40;i++)stack=pushHistory(stack,{id:i,text:'Plan'});assert.equal(stack.length,30);assert.equal(stack[0].id,10);
 stack=[];for(let i=0;i<8;i++)stack=pushHistory(stack,{id:i,text:'計'.repeat(400000)});const {utf8Bytes}=require('../../src/store/importFiles.cjs');assert.ok(stack.reduce((sum,v)=>sum+utf8Bytes(JSON.stringify(v)),0)<=MAX_HISTORY_BYTES);assert.equal(stack.at(-1).id,7);assert.ok(stack.length<8);
});
