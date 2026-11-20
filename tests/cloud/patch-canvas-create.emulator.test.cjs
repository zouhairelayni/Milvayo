// /tests/cloud/patch-canvas-create.emulator.test.cjs
'use strict';
// Firebase emulator integration test for v4 createCanvasObject and createCanvasConnector. Not runnable in the sandbox: use `npm run test:cloud` in Termux.
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const H=require('../helpers/cloud-emulators.cjs'),S=require('../../src/cloud/schema.cjs'),m=require('../../src/domain/model.cjs'),canvas=require('../../src/domain/canvas.cjs'),{generate}=require('../helpers/cloud-fake.cjs');
const enabled=process.env.MILVAYO_EMULATORS==='1',skip=!enabled?'Not run: use npm run test:cloud against Firebase emulators':false;
test('v4 Canvas creates write one document each, enforce the schema and the connector ends in the emulators',{skip,timeout:240000},async t=>{
 const env=await H.environment();t.after(()=>env.cleanup());
 const W=generate({tasks:3,objects:6}),owner=await H.account('canvas-create-owner'),published=await H.publish(owner,m.normalizeWorkspace(W),'canvas-create'),scope={orgId:published.orgId,workspaceId:published.workspaceId},call=body=>H.request(owner,{...scope,opId:crypto.randomUUID(),...body});
 const records=async()=>{let rows;await env.withSecurityRulesDisabled(async c=>{rows=(await c.firestore().collection(`orgs/${scope.orgId}/workspaces/${scope.workspaceId}/records`).get()).docs.map(d=>d.data());});return rows;};
 await call({action:'workspaceControl',protocol:4});const all=await records(),base=all.find(r=>r.kind==='canvas.objects'&&!r.deleted),sameBoard=all.filter(r=>r.kind==='canvas.objects'&&!r.deleted&&r.boardId===base.boardId&&r.projectId===base.projectId);
 const data=canvas.normalizeObject(canvas.createObject({id:'emu-note',boardId:base.boardId,x:5,y:6,text:'Emulator note',now:'2026-11-20T10:00:00.000Z',zIndex:80}),base.boardId,base.projectId);
 const r=await call({action:'createCanvasObject',projectId:base.projectId,boardId:base.boardId,objectId:'emu-note',order:50,data});assert.equal(r.ok,true);assert.equal(r.revision,1);
 t.diagnostic(`createCanvasObject: ${r.measured.documentReads} reads, ${r.measured.documentWrites} writes`);
 const edge={id:'emu-edge',from:sameBoard[0].id,to:'emu-note',label:'',style:'curve',arrow:true};
 const c=await call({action:'createCanvasConnector',projectId:base.projectId,boardId:base.boardId,connectorId:'emu-edge',order:50,data:edge});assert.equal(c.ok,true);
 t.diagnostic(`createCanvasConnector: ${c.measured.documentReads} reads, ${c.measured.documentWrites} writes`);
 await assert.rejects(call({action:'createCanvasConnector',projectId:base.projectId,boardId:base.boardId,connectorId:'bad-edge',order:51,data:{...edge,id:'bad-edge',to:'no-such-object'}}),/unavailable/);
 await assert.rejects(call({action:'createCanvasObject',projectId:base.projectId,boardId:base.boardId,objectId:'bad-note',order:52,data:{...data,id:'bad-note',width:1}}),/canonical/);
 const noteDoc=(await records()).find(x=>x.id==='emu-note'),edgeDoc=(await records()).find(x=>x.id==='emu-edge');
 const e1=await call({action:'patchCanvas',projectId:base.projectId,boardId:base.boardId,objectId:'emu-note',baseRevision:noteDoc.revision,set:{text:'Edited text',color:'#445566'}});assert.equal(e1.ok,true);t.diagnostic(`patchCanvas text: ${e1.measured.documentReads} reads, ${e1.measured.documentWrites} writes`);
 const e2=await call({action:'patchCanvasConnector',projectId:base.projectId,boardId:base.boardId,connectorId:'emu-edge',baseRevision:edgeDoc.revision,set:{label:'links',style:'elbow',color:'#112233'}});assert.equal(e2.ok,true);
 const e3=await call({action:'patchCanvasConnector',projectId:base.projectId,boardId:base.boardId,connectorId:'emu-edge',baseRevision:e2.revision,set:{color:''}});assert.equal(e3.ok,true);assert.equal('color' in e3.record.data,false);
 const e4=await call({action:'patchCanvas',projectId:base.projectId,boardId:base.boardId,objectId:'emu-note',baseRevision:e1.revision,set:{locked:true}});assert.equal(e4.ok,true);
 await assert.rejects(call({action:'patchCanvas',projectId:base.projectId,boardId:base.boardId,objectId:'emu-note',baseRevision:e4.revision,set:{text:'blocked'}}),/Unlock the object/);
 const d=await call({action:'deleteCanvasConnector',projectId:base.projectId,boardId:base.boardId,connectorId:'emu-edge',baseRevision:e3.revision});assert.equal(d.ok,true);t.diagnostic(`deleteCanvasConnector: ${d.measured.documentReads} reads, ${d.measured.documentWrites} writes`);
 const live=(await records()).filter(x=>!x.deleted);assert.ok(live.some(x=>x.id==='emu-note')&&!live.some(x=>x.id==='emu-edge'));
 assert.equal(live.some(x=>x.id==='bad-edge'||x.id==='bad-note'),false);assert.doesNotThrow(()=>S.validateRecords(live));
});
