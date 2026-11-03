// /tests/app/tab-retention-0514.test.cjs
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {createFreezeCell}=require('../../src/app/navigation/freezeCell.cjs');
const {shouldRenderPage,retainsHiddenTabs}=require('../../src/app/navigation/pageRetention.cjs');
const {resolveVisited,addVisited}=require('../../src/app/navigation/visitedTabs.cjs');
const read=f=>fs.readFileSync(path.join(__dirname,'..', '..',f),'utf8');
const tabs=['overview','board','timeline','tasks','sprints'];

test('freeze cell hands out the exact last visible value while hidden, then the live one',()=>{
 const a={rev:1},b={rev:2},c={rev:3};
 const cell=createFreezeCell(a);
 assert.equal(cell.resolve(b,false),b);
 assert.equal(cell.resolve(c,true),b,'hidden: same identity, so React skips the update');
 assert.equal(cell.resolve({rev:9},true),b);
 assert.equal(cell.resolve(c,false),c,'shown again: live value');
 assert.equal(cell.peek(),c);
 const same=createFreezeCell(a);same.resolve(a,true);assert.equal(same.resolve(a,false),a,'nothing changed while hidden: identity equal, no re-render');
});
test('a hidden page ignores query and handler-free changes; becoming visible always renders',()=>{
 const base={pageId:'board',active:false,openTask:()=>{},go:()=>{},query:''};
 assert.equal(shouldRenderPage(base,{...base,query:'abc'}),false);
 assert.equal(shouldRenderPage({...base,active:true},{...base,active:true,query:'abc'}),true);
 assert.equal(shouldRenderPage({...base,active:true},{...base,active:true}),false);
 assert.equal(shouldRenderPage(base,{...base,active:true}),true);
 assert.equal(shouldRenderPage({...base,active:true},base),true);
 assert.equal(shouldRenderPage(base,{...base,go:()=>{}}),true,'a changed handler is never silently ignored');
});
test('native retains tabs, web keeps its unmount policy',()=>{
 assert.equal(retainsHiddenTabs('android'),true);assert.equal(retainsHiddenTabs('ios'),true);assert.equal(retainsHiddenTabs('web'),false);
});
test('retained tab set restarts from the visible tab after a project switch and refills lazily',()=>{
 let s={projectId:'p1',list:['overview','board','timeline']};
 assert.deepEqual(resolveVisited(s,'p1','timeline',tabs),['overview','board','timeline']);
 assert.deepEqual(resolveVisited(s,'p2','timeline',tabs),['timeline'],'only the visible tab is rebuilt');
 assert.deepEqual(resolveVisited(s,'p2','settings',tabs),[],'a non-tab screen retains nothing');
 s=addVisited(s,'p2','timeline','board',tabs);
 assert.deepEqual(s,{projectId:'p2',list:['timeline','board']});
 assert.equal(addVisited(s,'p2','board','board',tabs),s,'no duplicate visit, no new object');
 assert.deepEqual(addVisited(s,'p2','board','settings',tabs),s);
});
test('Shell wires retention: frozen wrapper, stable element, inverted memo comparator, project-aware set',()=>{
 const app=read('src/app/ModernApp.js');
 assert.match(app,/<StoreFreeze frozen=\{!active\}>/);
 assert.match(app,/const content = useMemo\(/);
 assert.match(app,/\(prev, next\) => !shouldRenderPage\(prev, next\)/,'memo returns true to SKIP; the helper answers "must render"');
 assert.match(app,/const retainHiddenTab = \(\) => retainsHiddenTabs\(Platform\.OS\)/);
 assert.match(app,/resolveVisited\(visitedState, projectId, screen, CACHED_TABS\)/);
 assert.match(app,/addVisited\(v, projectIdRef\.current, fromScreen, k, CACHED_TABS\)/);
 assert.match(app,/tab shown from retained page/);
 const store=read('src/store/store.js');
 assert.match(store,/export function StoreFreeze\(/);
 assert.match(store,/<StoreContext\.Provider value=\{cell\.current\.resolve\(live,!!frozen\)\}>/);
});
