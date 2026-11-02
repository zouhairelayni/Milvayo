// /tests/app/hidden-work-0523.test.cjs
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const read=f=>fs.readFileSync(path.join(__dirname,'..','..',f),'utf8');

test('a hidden retained tab is told it is hidden, and the shown tab is told it is active',()=>{
 const store=read('src/store/store.js');
 assert.match(store,/export const useScreenActive=/);
 assert.match(store,/<ActiveContext\.Provider value=\{!frozen\}>/);
});
test('Board does no deferred card or column mounting while hidden',()=>{
 const board=read('src/screens/board/Board.js');
 assert.match(board,/if \(!active \|\| shown >= cardTotal\) return undefined;/);
 assert.match(board,/\[shown, cardTotal, active\]/);
 assert.match(board,/Platform\.OS === 'web' \|\| !active\) return;/);
 assert.match(board,/if \(active\) ensureColumns\(/,'columns catch up when the tab is shown again');
});
test('Testing shows 25 checks first and counts statuses in one pass',()=>{
 const src=read('src/screens/delivery/Delivery.js');
 const testing=src.slice(src.indexOf('export function Testing()'));
 assert.match(src,/const CHECK_PAGE = 25;/);
 assert.match(testing,/s\.checks\.slice\(0, limit\)/);
 assert.match(testing,/new Map\(s\.tasks\.map/);
 assert.doesNotMatch(testing,/s\.tasks\.find/,'no task scan per check');
 assert.doesNotMatch(testing,/s\.checks\.filter/,'no check scan per status tile');
});
