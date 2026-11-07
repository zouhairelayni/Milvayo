// /tests/governance/canvas-exports.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {load}=require('../helpers/diagram-harness.cjs'),model=require('../../src/domain/model.cjs'),canvas=require('../../src/domain/canvas.cjs');
const pm=load('src/governance/pm.js',{'./data':{labourCosts:()=>[],money:String}}),scene=load('src/canvas/scene.js',{'../governance/pm':pm});
const {sceneToSvg}=require('../../src/governance/diagramScene.cjs'),{pngPlan}=require('../../src/governance/diagramExport.cjs');
const now='2026-11-07T04:00:00.000Z';
test('Canvas exports complete bounds, transformed connectors and escaped text; geometry stays stable on unrelated project changes',()=>{
 const p=model.makeProject({id:'p',tasks:[{id:'t',title:'Canonical task'}]}),b=canvas.createBoard({id:'b',projectId:'p',now});
 const a=canvas.createObject({id:'a',boardId:'b',x:-200,y:-100,text:'<script>alert("x")</script>',now}),z=canvas.createObject({id:'z',boardId:'b',x:1400,y:900,text:'Last object',now});
 const board=canvas.changeBoard(canvas.changeBoard(b,{type:'add',objects:[a,z]},now),{type:'connect',edge:{id:'e',from:'a',to:'z',style:'curve'}},now);
 const full=scene.exportScene(board,p,'scope');assert.ok(full.width>1800);assert.ok(full.height>1100);const svg=sceneToSvg(full,{bg:'#111',ink:'#fff',surface:'#222',muted:'#aaa'});assert.ok(svg.includes('Last object'));assert.ok(svg.includes('&lt;script&gt;'));assert.equal(svg.includes('<script>'),false);assert.ok(pngPlan(full,4,'android').pixels<=4*1024*1024);
 const value=scene.objectScene(board.objects[0],p,'scope');assert.equal(scene.objectScene(board.objects[0],{...p,name:'Different name'},'scope'),value);
 assert.equal(scene.transformPath('M 10 20 H 40 V 60 L 80 90',2,4,2),'M 22 44 H 82 V 124 L 162 184');
});
test('linked WBS uses canonical orientation-aware geometry and source updates while frozen snapshots retain their text',()=>{
 const {captureSource}=require('../../src/canvas/sources.cjs');const p=model.makeProject({id:'p',name:'Workspace',governance:{wbs:[{id:'w0',parent:null,name:''},{id:'w1',parent:'w0',name:'Scope'}]}}),b=canvas.createBoard({id:'b',projectId:'p',now});
 const link={sourceType:'wbs',sourceId:'w0',projectId:'p',mode:'live',view:'tree',direction:'down'},raw=canvas.createObject({id:'o',boardId:'b',type:'linked',sourceLink:link,width:800,height:400,now});
 const o=canvas.normalizeBoard({...b,objects:[raw]},p.id).objects[0],first=scene.objectScene(o,p,'scope');assert.ok(first.scene.items.some(i=>i.s==='Scope'));
 const edited=model.makeProject({...p,governance:{...p.governance,wbs:p.governance.wbs.map(n=>n.id==='w1'?{...n,name:'Changed scope'}:n)}});assert.notEqual(scene.objectScene(o,edited,'scope').scene,first.scene);
 const frozen=canvas.normalizeBoard({...b,objects:[{...raw,sourceLink:captureSource(p,link,now)}]},p.id).objects[0];assert.ok(scene.objectScene(frozen,edited,'scope').scene.items.some(i=>i.s==='Scope'));
});
