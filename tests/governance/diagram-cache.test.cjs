// /tests/governance/diagram-cache.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createDiagramCache,diagramRevision,diagramView}=require('../../src/governance/diagramCache.cjs');
const {wbsHarness,fixture}=require('../helpers/wbs-harness.cjs');
const {nodes,control}=require('../helpers/screen-harness.cjs');
const select = tree => nodes(tree).find(n=>n.type==='Segmented'&&n.props.options.some(o=>o.value==='tree')) || nodes(tree).find(n=>n.type==='Segmented'&&n.props.options.some(o=>o.value==='outline'));
const viewport=tree=>nodes(tree).find(n=>n.type==='DiagramViewport');

test('only selected layout is generated; switching back and remounting reuses geometry and view state without export work',()=>{
 const s=wbsHarness();let tree=s.render();assert.deepEqual(s.calculations,{tree:0,fishbone:0,mind:0});
 const scenes={};
 for(const kind of ['tree','fishbone','mind','tree','fishbone','mind']){select(tree).props.onChange(kind);tree=s.render();const scene=viewport(tree).props.scene;if(scenes[kind])assert.equal(scene,scenes[kind]);scenes[kind]=scene;}
 assert.deepEqual(s.calculations,{tree:1,fishbone:1,mind:1});assert.equal(s.serializations,0);
 assert.equal(nodes(tree).filter(n=>n.type==='DiagramViewport').length,1);
 viewport(tree).props.onPose({scale:2,x:-50,y:-20});viewport(tree).props.onZoom(2);tree=s.render();
 s.h.unmount();const again=wbsHarness({cache:s.cache,scope:s.store.currentId});tree=again.render();
 assert.equal(select(tree).props.value,'mind');assert.equal(viewport(tree).props.scene,scenes.mind);assert.deepEqual(again.calculations,{tree:0,fishbone:0,mind:0});
 assert.deepEqual(viewport(tree).props.initialPose,{scale:2,x:-50,y:-20});assert.ok(again.actions.some(a=>a.includes('cache hit')));
});

test('task edits, budget, WBS owners and notes do not regenerate vectors; CSV reads current metadata',()=>{
 const s=wbsHarness();let tree=s.render();select(tree).props.onChange('tree');tree=s.render();const first=viewport(tree).props.scene;
 s.store.s.tasks=[{id:'task',title:'Edited actual task'}];s.store.s.project={...s.store.s.project,budget:900};
 s.store.s.pm.wbs=s.store.s.pm.wbs.map(n=>({...n,owner:'Fresh owner',note:'Updated description'}));tree=s.render();
 assert.equal(viewport(tree).props.scene,first);assert.deepEqual(s.calculations,{tree:1,fishbone:0,mind:0});
 const csv=nodes(tree).find(n=>n.type==='DiagramExports').props.getCSV();assert.match(csv,/Fresh owner/);assert.match(csv,/Updated description/);assert.equal(s.serializations,0);
});

test('titles, order, parent relationships and root title invalidate layouts lazily; hours invalidate only top-down Tree',()=>{
 const s=wbsHarness();let tree=s.render();const choose=kind=>{select(tree).props.onChange(kind);tree=s.render();return viewport(tree).props.scene;};
 const first={tree:choose('tree'),fishbone:choose('fishbone'),mind:choose('mind')};
 s.store.s.pm.wbs=s.store.s.pm.wbs.map(n=>n.id==='w1'?{...n,hours:21}:n);tree=s.render();assert.equal(viewport(tree).props.scene,first.mind);
 assert.equal(choose('fishbone'),first.fishbone);assert.notEqual(choose('tree'),first.tree);assert.deepEqual(s.calculations,{tree:2,fishbone:1,mind:1});
 for(const edit of [
  a=>a.map(n=>n.id==='w1'?{...n,name:'Design revised'}:n),
  a=>[a[0],a[2],a[1]],
  a=>a.map(n=>n.id==='w2'?{...n,parent:'w1'}:n),
 ]){
  const before={...s.calculations};s.store.s.pm.wbs=edit(s.store.s.pm.wbs);tree=s.render();assert.equal(s.calculations.tree,before.tree+1);assert.equal(s.calculations.fishbone,before.fishbone);assert.equal(s.calculations.mind,before.mind);
  choose('fishbone');choose('mind');choose('tree');
 }
 const before={...s.calculations};s.store.s.project.name='New project name';tree=s.render();assert.equal(s.calculations.tree,before.tree+1);
});

test('workspace and project IDs isolate identical structures, and tree direction has an independent cache entry',()=>{
 const cache=createDiagramCache(),a=wbsHarness({cache,scope:'same',workspace:'a'}),b=wbsHarness({cache,scope:'same',workspace:'b'});
 let t=a.render();select(t).props.onChange('tree');t=a.render();const down=viewport(t).props.scene;
 let u=b.render();select(u).props.onChange('tree');u=b.render();assert.notEqual(viewport(u).props.scene,down);
 const dir=nodes(t).find(n=>n.type==='Segmented'&&n.props.options.some(o=>o.value==='right'));dir.props.onChange('right');t=a.render();assert.notEqual(viewport(t).props.scene,down);
 nodes(t).find(n=>n.type==='Segmented'&&n.props.options.some(o=>o.value==='right')).props.onChange('down');t=a.render();assert.equal(viewport(t).props.scene,down);
 const c=wbsHarness({cache,scope:'other',workspace:'a'});t=c.render();select(t).props.onChange('tree');t=c.render();assert.notEqual(viewport(t).props.scene,down);
});

test('Expand reuses selected geometry and only one live diagram; closing restores the embedded pose',()=>{
 const s=wbsHarness();let tree=s.render();select(tree).props.onChange('tree');tree=s.render();const scene=viewport(tree).props.scene;
 viewport(tree).props.onPose({scale:1.5,x:-15,y:-20});control(tree,'Expand diagram').props.onPress();tree=s.render();
 assert.equal(viewport(tree),undefined);const preview=nodes(tree).find(n=>n.type==='DiagramPreview');assert.equal(preview.props.scene,scene);
 preview.props.onClose();tree=s.render();assert.equal(viewport(tree).props.scene,scene);assert.deepEqual(viewport(tree).props.initialPose,{scale:1.5,x:-15,y:-20});assert.equal(s.calculations.tree,1);
  control(tree,'Expand diagram').props.onPress();tree=s.render();s.store.s.pm.wbs=[fixture()[0]];tree=s.render();assert.equal(nodes(tree).some(n=>n.type==='DiagramPreview'),false);
  s.store.s.pm.wbs=fixture();tree=s.render();assert.equal(nodes(tree).some(n=>n.type==='DiagramPreview'),false,'restoring data must not reopen a dismissed empty preview');
});

test('cache enforces entry/byte budgets and LRU; oversize results/errors are never retained',()=>{
 const c=createDiagramCache({maxEntries:2,maxBytes:1200,now:()=>0});let calls=0;
 const get=key=>c.get(['p','tree',key],()=>({name:key,count:++calls}),()=>100);
 const a=get('a').value;get('b');assert.equal(get('a').value,a);get('c');assert.equal(c.stats().entries,2);assert.equal(get('b').hit,false);
 const too=()=>c.get(['p','mind','huge'],()=>({big:true}),()=>2000);assert.equal(too().hit,false);assert.equal(too().hit,false);assert.ok(c.stats().estimatedBytes<=1200);
 assert.throws(()=>c.get(['p','tree','bad'],()=>{throw Error('broken');}),/broken/);assert.equal(c.get(['p','tree','bad'],()=>42).hit,false);
 c.clear();assert.equal(c.stats().estimatedBytes,0);assert.equal(c.stats().entries,0);
 const key='view-test-'+Date.now();diagramView(key).view='mind';for(let i=0;i<13;i++)diagramView(key+i);assert.equal(diagramView(key).view,'outline');
});

test('semantic revision survives cloned inputs and ignores undisplayed metadata without changing import data',()=>{
 const model=require('../../src/domain/model.cjs'),raw=fixture();const before=JSON.stringify(raw),a=diagramRevision(raw,'Studio');
 assert.equal(diagramRevision(raw,'Studio'),a);const b=diagramRevision(raw.map(n=>({...n,owner:'Owner',note:'Note'})),'Studio');assert.equal(a.full,b.full);
 const p=model.makeProject({name:'Studio',governance:{wbs:raw}}),roundTrip=model.importProject(JSON.parse(JSON.stringify(p)));
 assert.deepEqual(roundTrip.governance.wbs,p.governance.wbs);assert.equal(JSON.stringify(raw),before);
});
