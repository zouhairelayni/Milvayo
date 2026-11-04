// /tests/app/root-remount-0513.test.cjs
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {initialCount,nextCount}=require('../../src/utils/progressiveCount.cjs');
const read=f=>fs.readFileSync(path.join(__dirname,'..', '..',f),'utf8');

test('progressive card mounting reveals a bounded chunk per step and never shrinks',()=>{
 assert.equal(initialCount(34,6),6);assert.equal(initialCount(3,6),3);assert.equal(initialCount(0,6),0);
 let n=initialCount(34,6),steps=0;
 while(n<34){const next=nextCount(n,34,6);assert.ok(next>n&&next-n<=6);n=next;steps++;}
 assert.equal(steps,5);assert.equal(nextCount(34,34,6),34);assert.equal(nextCount(0,0,6),0);
 assert.equal(nextCount(5,3,6),3,'a list that shrank while mounted clamps to its length');
 assert.equal(nextCount(1,9,0),2,'a zero step still advances');
});
test('heavy native tabs defer their first mount; web and Overview do not',()=>{
 const src=read('src/app/ModernApp.js');
 assert.match(src,/DEFERRED_NATIVE_TABS = \['timeline', 'board', 'tasks', 'sprints'\]/);
 assert.match(src,/Platform\.OS==='web' \|\| !DEFERRED_NATIVE_TABS\.includes\(pageId\)/);
 assert.equal(/DEFERRED_NATIVE_TABS = \[[^\]]*overview/.test(src),false);
});
test('Board initially renders ten cards and explicitly expands by ten without dropping visited cards',()=>{
 const src=read('src/screens/board/Board.js');
 assert.match(src,/const \[shown, setShown\] = useState\(10\)/);
 assert.match(src,/setShown\(n=>Math\.min\(cardTotal,n\+10\)\)/);
 assert.match(src,/allCards\.slice\(0, shown\)/);
 assert.match(src,/\{cardTotal\}<\/T>/,'header count shows every card, not only the mounted ones');
 assert.match(src,/cardTotal === 0 \?/,'empty state follows the true count');
});
