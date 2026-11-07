// /tests/governance/diagram-paint.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {diagramPaintHarness}=require('../helpers/diagram-paint-harness.cjs');
const {sceneFor}=require('../../src/governance/diagramScene.cjs');
const {pm,fixture}=require('../helpers/wbs-harness.cjs');
test('drawing primitives are generated once per selected scene and reused across switches, zoom and unrelated theme changes',()=>{
 const h=diagramPaintHarness(),tree=pm.buildTree(fixture(),'Studio'),a=sceneFor('tree',tree,'down'),b=sceneFor('mind',tree);
 const first=h.render({scene:a});const children=first.props.children[1];h.render({scene:b});const again=h.render({scene:a});assert.equal(again.props.children[1],children);
 assert.deepEqual(JSON.parse(JSON.stringify(h.stats())),{generations:2,hits:1});
 h.colors({ink:'#fafafa',bg:'#111111',surface:'#222222',muted:'#aaaaaa',accent:'#123456'});assert.equal(h.render({scene:a,scale:2}).props.children[1],children);assert.equal(h.stats().generations,2);
 h.colors({ink:'#111111',bg:'#ffffff',surface:'#eeeeee',muted:'#444444'});assert.notEqual(h.render({scene:a}).props.children[1],children);assert.equal(h.stats().generations,3);
});
test('preview selection binds current callbacks without storing old handlers in cached drawing output',()=>{
 const h=diagramPaintHarness(),scene=sceneFor('tree',pm.buildTree(fixture(),'Studio'),'down'),calls=[];
 let tree=h.render({scene,onSelect:id=>calls.push('first:'+id)});let rect=tree.props.children[1].find(n=>n.props.onPress);rect.props.onPress();
 tree=h.render({scene,onSelect:id=>calls.push('second:'+id)});rect=tree.props.children[1].find(n=>n.props.onPress);rect.props.onPress();assert.deepEqual(calls,['first:w0','second:w0']);assert.equal(h.stats().generations,1);
});
