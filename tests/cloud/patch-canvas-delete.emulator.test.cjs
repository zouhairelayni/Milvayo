// /tests/cloud/patch-canvas-delete.emulator.test.cjs
'use strict';
// Firebase emulator integration test for v4 deleteCanvasObjects. Not runnable in the sandbox: use `npm run test:cloud` in Termux.
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const H=require('../helpers/cloud-emulators.cjs'),S=require('../../src/cloud/schema.cjs'),m=require('../../src/domain/model.cjs'),{generate}=require('../helpers/cloud-fake.cjs');
const enabled=process.env.MILVAYO_EMULATORS==='1',skip=!enabled?'Not run: use npm run test:cloud against Firebase emulators':false;
test('v4 deleteCanvasObjects removes an object with its connectors and comment anchors in the emulators',{skip,timeout:240000},async t=>{
 const env=await H.environment();t.after(()=>env.cleanup());
 const W=generate({tasks:3,objects:20}),p=W.projects[0],b=p.canvases[0],o=b.objects;
 p.canvases[0]={...b,objects:o.map((x,i)=>i===1?{...x,type:'frame'}:i===2?{...x,groupId:o[1].id}:x),connectors:[{id:'e1',from:o[4].id,to:o[1].id}],threads:[{id:'t1',objectId:o[1].id,x:1,y:2,messages:[]}]};
 const owner=await H.account('canvas-del-owner'),published=await H.publish(owner,m.normalizeWorkspace(W),'canvas-del'),scope={orgId:published.orgId,workspaceId:published.workspaceId},call=body=>H.request(owner,{...scope,...body}),records=async()=>{let rows;await env.withSecurityRulesDisabled(async c=>{rows=(await c.firestore().collection(`orgs/${scope.orgId}/workspaces/${scope.workspaceId}/records`).get()).docs.map(d=>d.data());});return rows;};
 await call({action:'workspaceControl',protocol:4});const all=await records(),frame=all.find(r=>r.kind==='canvas.objects'&&r.id===o[1].id);
 const r=await call({action:'deleteCanvasObjects',projectId:frame.projectId,boardId:frame.boardId,objectIds:[frame.id],bases:{[frame.id]:frame.revision},opId:crypto.randomUUID()});
 assert.equal(r.ok,true);t.diagnostic(`deleteCanvasObjects: ${r.measured.documentReads} reads, ${r.measured.documentWrites} writes, transactionMs ${r.measured.timings?.transactionMs}`);
 const after=await records(),live=after.filter(x=>!x.deleted);
 assert.equal(live.some(x=>x.id==='e1'||x.id==='t1'||x.id===frame.id),false);assert.equal(live.find(x=>x.id===o[2].id).data.groupId,'');assert.doesNotThrow(()=>S.validateRecords(live));
});
