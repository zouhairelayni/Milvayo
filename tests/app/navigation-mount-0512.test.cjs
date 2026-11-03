// /tests/app/navigation-mount-0512.test.cjs
const test=require('node:test'),assert=require('node:assert/strict');
const {createNavigationQueue}=require('../../src/app/navigation/navigationQueue.cjs');
const {visibleColumns}=require('../../src/board/boardColumns.cjs');
const core=require('../../src/diagnostics/core.cjs');
function harness(){let n=0;const frames=new Map(),commits=[];const q=createNavigationQueue(cb=>{frames.set(++n,cb);return n},id=>frames.delete(id),k=>commits.push(k));return {q,frames,commits,flush(){const batch=[...frames.values()];frames.clear();batch.forEach(cb=>cb());}};}
test('queued tab burst mounts only the final selection; later frames still navigate',()=>{
 const h=harness();for(const k of ['overview','board','timeline','board','timeline'])h.q.request(k);
 assert.equal(h.frames.size,1);h.flush();assert.deepEqual(h.commits,['timeline']);
 h.q.request('tasks');h.flush();assert.deepEqual(h.commits,['timeline','tasks']);
});
test('a menu navigation or shell unmount cancels a queued bottom-tab selection',()=>{
 const h=harness();h.q.request('overview');h.q.clear();h.flush();assert.deepEqual(h.commits,[]);
 h.q.request('timeline');h.flush();assert.deepEqual(h.commits,['timeline']);
});
test('native Board opens only near columns and reveals later columns on scroll',()=>{
 assert.deepEqual(visibleColumns(5,0,350,272),[0,1]);
 assert.deepEqual(visibleColumns(5,850,350,272),[2,3,4]);
 assert.deepEqual(visibleColumns(0,0,350,272),[]);
 assert.deepEqual(visibleColumns(5,0,0,272),[]);
 assert.deepEqual(visibleColumns(5,0,1500,290),[0,1,2,3,4]);
});
test('startup navigation survives a long run without unbounded diagnostic memory',()=>{
 const s=core.fresh('new',100);core.addEvent(s,'navigation','first timeline bounce',110);
 for(let i=0;i<200;i++)core.addEvent(s,'action','later interaction',200+i);
 assert.equal(s.startupEvents.length,40);assert.equal(s.events.length,90);
 assert.match(core.reportPerf(s,500),/first timeline bounce/);
 assert.match(core.reportCrash(s),/first timeline bounce/);
 assert.equal(core.fresh('other',600).startupEvents.length,0);
});

test('previous exceptions stay explicitly labelled without inflating current counts',()=>{
 const s=core.fresh('new',100);s.previous={updatedAt:90,active:false,crashes:[{at:80,source:'handler',screen:'timeline',name:'Error',message:'old fault',stack:'old stack'}]};
 const report=core.reportCrash(s);assert.match(report,/recorded JS exceptions: 0/);assert.match(report,/previous-run JS exceptions/);assert.match(report,/old fault/);assert.equal(s.crashes.length,0);
});
