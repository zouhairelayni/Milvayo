// /tests/app/performance-stability-0510.test.cjs
const test=require('node:test'),assert=require('node:assert/strict');
const model=require('../../src/domain/model.cjs'),ops=require('../../src/domain/operations.cjs'),bridge=require('../../src/domain/modernBridge.cjs');
const {createLatestWriter}=require('../../src/store/latestWriter.cjs');
const viewport=require('../../src/timeline/timelineViewport.cjs'),windowing=require('../../src/timeline/timelineWindow.cjs');
const fs=require('node:fs'),path=require('node:path');
const source=p=>fs.readFileSync(path.join(__dirname,'..', '..',p),'utf8');
test('pending saves coalesce and preserve the newest complete snapshot',async()=>{
 const saved=[];let release;const writer=createLatestWriter(async v=>{saved.push(v);if(v===1)await new Promise(r=>release=r);});
 writer.enqueue(1);await Promise.resolve();for(let i=2;i<=100;i++)writer.enqueue(i);
 release();assert.equal(await writer.flush(),true);assert.deepEqual(saved,[1,100]);
});
test('a burst before IO serializes only the final snapshot',async()=>{
 const saved=[];const writer=createLatestWriter(v=>saved.push(JSON.stringify(v)));
 for(let i=0;i<100;i++)writer.enqueue({revision:i});await writer.flush();assert.deepEqual(saved,['{"revision":99}']);
});
test('failed saves remain retryable and do not falsely report durable success',async()=>{
 let fail=true,errors=0,saved;const writer=createLatestWriter(v=>{if(fail)throw Error('disk full');saved=v;},{onError:()=>errors++});
 assert.equal(await writer.enqueue('latest'),false);assert.equal(errors,1);fail=false;assert.equal(await writer.flush(),true);assert.equal(saved,'latest');
});
test('a failed old write cannot overwrite a newer pending value',async()=>{
 let reject;const values=[];const w=createLatestWriter(v=>{values.push(v);if(v===1)return new Promise((_,r)=>reject=r);});
 w.enqueue(1);await Promise.resolve();w.enqueue(2);reject(Error('old write failed'));assert.equal(await w.flush(),true);assert.deepEqual(values,[1,2]);
});
test('incremental normalization shares unchanged projects and validates changed ones',()=>{
 const normalize=model.createWorkspaceNormalizer();let w=normalize({projects:[model.makeProject({id:'a'}),model.makeProject({id:'b'})]});
 const next=normalize({...w,projects:[{...w.projects[0],name:'Updated'},w.projects[1]]});
 assert.equal(next.projects[1],w.projects[1]);assert.notEqual(next.projects[0],w.projects[0]);
 assert.throws(()=>normalize({...next,projects:[{...next.projects[0],tasks:[{id:'bad',dependsOn:['missing']}]},next.projects[1]]}),/Missing|predecessor/);
 assert.deepEqual(model.normalizeWorkspace(JSON.parse(JSON.stringify(next))),next);
});
test('10k reversed dependencies validate without recursive stack overflow',()=>{
 const tasks=Array.from({length:10000},(_,i)=>({id:`t${i}`,dependsOn:i<9999?[`t${i+1}`]:[]}));
 const p=model.makeProject({tasks});assert.doesNotThrow(()=>model.validateProject(p));
});
test('deep malformed parent chains produce a controlled validation error',()=>{
 const tasks=Array.from({length:10000},(_,i)=>({id:`t${i}`,parentId:i<9999?`t${i+1}`:''}));assert.throws(()=>model.taskWorkflows.hierarchy(tasks),/40 levels/);
});
test('indexed summaries preserve leaf costs, captured rates, blockers and comments',()=>{
 const p=model.makeProject({tasks:[{id:'p',estimateHours:100,owner:'A'},{id:'a',parentId:'p',estimateHours:2,owner:'A',dependsOn:['b']},{id:'b',estimateHours:3,owner:'A'}],resources:[{id:'r',name:'A',hourlyRate:20,weeklyHours:40}],timeEntries:[{id:'time',taskId:'a',owner:'A',date:'2026-10-01',hours:2,rateAtEntry:10}],comments:[{id:'c',taskId:'a',author:'A',body:'Hello',at:'2026-10-01'}]});
 assert.equal(ops.costSummary(p).plannedCost,100);assert.equal(ops.costSummary(p).cost,20);assert.equal(ops.health(p).blocked,1);
 const view=bridge.projectView({projects:[p],selectedId:p.id});assert.equal(view.tasks.find(t=>t.id==='a').logged,2);assert.equal(view.tasks.find(t=>t.id==='a').comments[0].text,'Hello');
});
test('interval routing matches exhaustive routing across randomized layouts',()=>{
 let seed=19;const rand=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
 for(let n=0;n<1500;n++){
  const extents=Array.from({length:30},()=>{const a=rand()*1500;return [a,a+rand()*600];});const start=rand()*2000;let expected=start;
  for(let c=start;c>=8;c-=6){if(!extents.some(([a,b])=>c>=a-4&&c<=b+4)){expected=c;break;}}
  assert.ok(Math.abs(viewport.routingLane(extents,0,29,start)-Math.max(6,expected))<1e-7);
 }
});
test('one-sided task dates produce finite geometry and invalid dates are excluded',()=>{
 const rows=windowing.scheduled([{id:'a',start:'',due:'2026-10-10'},{id:'b',start:'2026-10-11',due:''},{id:'bad',start:'2026-02-30',due:''}]);
 assert.equal(rows.length,2);for(const t of rows){assert.equal(t.start,t.due);assert.ok(Number.isFinite(Date.parse(t.start)));}
 const src=source('src/screens/timeline/Timeline.js');assert.match(src,/new Map\(rows\.map/);assert.match(src,/point\.every\(Number\.isFinite\)/);
});
test('invalid WBS graphs reject before rendering or saving',()=>{
 const {normalizeGovernance}=require('../../src/domain/governanceCore.cjs');const n=(id,parent)=>({id,parent});
 for(const wbs of [[n('w0',null),n('x','w0'),n('x','w0')],[n('w0','x'),n('x','w0')],[n('w0',null),n('x','y'),n('y','x')],[n('w0',null),n('x','absent')]])assert.throws(()=>normalizeGovernance({wbs}),/WBS/);
 assert.equal(normalizeGovernance({wbs:[n('w0',null),n('__proto__','w0')]}).wbs.length,2);
});
test('project/task identity resets stale editors; hidden pages do not stay subscribed',()=>{
 const app=source('src/app/ModernApp.js');assert.match(app,/const retainHiddenTab = \(\) => retainsHiddenTabs\(Platform\.OS\)/);assert.match(app,/<StoreFreeze frozen=\{!active\}>/);assert.match(app,/key=\{`\$\{projectId\}:\$\{taskId\}`\}/);
 assert.match(source('src/governance/pm.js'),/require\('\.\.\/domain\/model.cjs'\)\.id\(prefix\)/);assert.match(source('src/gestures/gesture.native.js'),/else callbacks.current.onCancel\?\.\(\)/);
});
test('critical path handles a reversed 10k dated chain without overflowing the stack',()=>{
 const tasks=Array.from({length:10000},(_,i)=>({id:`t${i}`,start:'2026-10-01',due:'2026-10-01',dependsOn:i<9999?[`t${i+1}`]:[]}));
 assert.equal(model.gantt.criticalPath(tasks).totalDays,10000);
});
