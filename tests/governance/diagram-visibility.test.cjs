// /tests/governance/diagram-visibility.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {treeScene}=require('../../src/governance/diagramScene.cjs');
const {batchVisible}=require('../../src/governance/diagramVisibility.cjs');
const {pm}=require('../helpers/wbs-harness.cjs');
test('Tree batches retain each primitive exactly once in both orientations and skip offscreen text',()=>{
 for(const dir of ['down','right']){
  const nodes=[{id:'w0',name:'Project',parent:null},...Array.from({length:250},(_,i)=>({id:'w'+(i+1),parent:'w0',name:'Work package '+i,hours:i}))];
  const scene=treeScene(pm.buildTree(nodes,'Project'),dir),indexes=scene.batches.flatMap(b=>b.indexes);
  assert.equal(indexes.length,scene.items.length);assert.equal(new Set(indexes).size,indexes.length);
  const visible=scene.batches.filter(b=>batchVisible(b.bounds,{scale:1,x:0,y:0},{width:390,height:440}));
  assert.ok(visible.flatMap(b=>b.indexes).filter(i=>scene.items[i].t==='text').length<scene.items.filter(i=>i.t==='text').length/4);
  const fit=Math.min(390/scene.width,440/scene.height);
  assert.ok(scene.batches.every(b=>batchVisible(b.bounds,{scale:fit,x:0,y:0},{width:390,height:440})));
 }
});
test('spatial visibility follows continuous camera pose and includes stroke overscan',()=>{
 const box={x:1000,y:1000,width:140,height:58},viewport={width:390,height:440};
 assert.equal(batchVisible(box,{scale:1,x:0,y:0},viewport),false);
 assert.equal(batchVisible(box,{scale:1,x:-900,y:-900},viewport),true);
 assert.equal(batchVisible(box,{scale:.1,x:0,y:0},viewport),true);
 assert.equal(batchVisible({x:400,y:0,width:1,height:1},{scale:1,x:0,y:0},viewport),true);
});
