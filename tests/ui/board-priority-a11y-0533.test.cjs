// /tests/ui/board-priority-a11y-0533.test.cjs
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
test('priority color dot includes accessible priority name',()=>{
 const s=fs.readFileSync(path.join(__dirname,'../../src/screens/board/Board.js'),'utf8');
 assert.match(s,/accessible accessibilityLabel=\{`Priority \$\{t\.priority\}`\}/);
});
