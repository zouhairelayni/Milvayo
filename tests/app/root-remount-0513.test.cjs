// /tests/app/root-remount-0513.test.cjs
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const read=f=>fs.readFileSync(path.join(__dirname,'..', '..',f),'utf8');

test('heavy native tabs defer their first mount; web and Overview do not',()=>{
 const src=read('src/app/ModernApp.js');
 assert.match(src,/DEFERRED_NATIVE_TABS = \['timeline', 'board', 'tasks', 'sprints'\]/);
 assert.match(src,/Platform\.OS==='web' \|\| !DEFERRED_NATIVE_TABS\.includes\(pageId\)/);
 assert.equal(/DEFERRED_NATIVE_TABS = \[[^\]]*overview/.test(src),false);
});
test('Board initially mounts five cards and grows only through list scrolling without dropping visited cards',()=>{
 const src=read('src/screens/board/Board.js');
 assert.match(src,/shown:INITIAL_CARDS/);
 assert.match(src,/nextCardCount\(shown,cardTotal,/);
 assert.match(src,/allCards\.slice\(0, shown\)/);
 assert.match(src,/\{cardTotal\}<\/T>/,'header count shows every card, not only the mounted ones');
 assert.match(src,/cardTotal === 0 \?/,'empty state follows the true count');
});
