// /tests/cloud/patch-canvas-edit.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {database,generate}=require('../helpers/cloud-fake.cjs'),m=require('../../src/domain/model.cjs');
const world=()=>{const x=database(m.normalizeWorkspace(generate({tasks:3,objects:6,projects:1})),{protocol:4});x.grant('viewer',{workspaceRole:'viewer',projects:{}});return x;};
const live=(x,kind)=>[...x.rows.values()].filter(r=>r.kind===kind&&!r.deleted);
let n=0;const call=(x,body,who='alice')=>x.service.execute(who,{...x.scope,opId:'ce-'+(++n),...body});
const patchObject=(x,o,set,over={})=>call(x,{action:'patchCanvas',projectId:o.projectId,boardId:o.boardId,objectId:o.id,baseRevision:o.revision,set,...over});
const patchEdge=(x,e,set,over={},who)=>call(x,{action:'patchCanvasConnector',projectId:e.projectId,boardId:e.boardId,connectorId:e.id,baseRevision:e.revision,set,...over},who);
const deleteEdge=(x,e,over={},who)=>call(x,{action:'deleteCanvasConnector',projectId:e.projectId,boardId:e.boardId,connectorId:e.id,baseRevision:e.revision,...over},who);
const withEdge=async x=>{const [a,b]=live(x,'canvas.objects').filter(r=>r.boardId===live(x,'canvas.objects')[0].boardId);await call(x,{action:'createCanvasConnector',projectId:a.projectId,boardId:a.boardId,connectorId:'edge-1',order:1,data:{id:'edge-1',from:a.id,to:b.id,label:'',style:'curve',arrow:true}});return live(x,'canvas.connectors').find(r=>r.id==='edge-1');};
test('text, colour and lock edits are one write each; invalid values and a locked object are refused',async()=>{
 const x=world();let o=live(x,'canvas.objects')[0];
 let r=await patchObject(x,o,{text:'New words',color:'#aabbcc'});assert.equal(r.ok,true);assert.equal(x.writes.length,1);assert.equal(r.record.data.text,'New words');assert.equal(r.record.data.color,'#aabbcc');o=r.record;
 for(const bad of [{color:'red'},{text:'x'.repeat(12001)},{locked:'yes'}])await assert.rejects(patchObject(x,o,bad),/canonical|not patchable|Invalid/);
 r=await patchObject(x,o,{locked:true});assert.equal(r.ok,true);o=r.record;
 await assert.rejects(patchObject(x,o,{text:'edit while locked'}),/Unlock the object/);await assert.rejects(patchObject(x,o,{x:o.data.x+1}),/Unlock the object/);
 r=await patchObject(x,o,{locked:false});assert.equal(r.ok,true);o=r.record;r=await patchObject(x,o,{text:'now fine'});assert.equal(r.ok,true);
 await assert.rejects(patchObject(x,o,{type:'frame'}),/not patchable/);
});
test('connector edits: label, style, arrow and colour; clearing the colour removes it; invalid values and strangers are refused',async()=>{
 const x=world();let e=await withEdge(x);
 let r=await patchEdge(x,e,{label:'depends',style:'elbow',arrow:false,color:'#112233'});assert.equal(r.ok,true);assert.equal(x.writes.length,2);e=r.record;assert.deepEqual([e.data.label,e.data.style,e.data.arrow,e.data.color],['depends','elbow',false,'#112233']);
 r=await patchEdge(x,e,{color:''});assert.equal(r.ok,true);assert.equal('color' in r.record.data,false);e=r.record;
 for(const bad of [{style:'zigzag'},{color:'blue'},{label:'x'.repeat(201)},{from:'other'},{id:'x'}])await assert.rejects(patchEdge(x,e,bad),/canonical|not patchable|Invalid/);
 await assert.rejects(patchEdge(x,e,{label:'v'},{},'viewer'),/scoped grant/);
 await assert.rejects(patchEdge(x,{...e,id:'no-such'},{label:'x'}),/unavailable/);
 const stale=await patchEdge(x,{...e,revision:1},{label:'late'});assert.equal(stale.ok,false);assert.equal(stale.code,'conflict');
});
test('connector delete is one tombstone write; stale revisions conflict; repeats are accepted; viewers are refused',async()=>{
 const x=world(),e=await withEdge(x),before=x.writes.length;
 await assert.rejects(deleteEdge(x,e,{},'viewer'),/scoped grant/);
 const stale=await deleteEdge(x,{...e,revision:e.revision+5});assert.equal(stale.ok,false);assert.equal(stale.code,'conflict');
 const r=await deleteEdge(x,e,{opId:'del-fixed'});assert.equal(r.ok,true);assert.equal(x.writes.length-before,1);assert.equal(live(x,'canvas.connectors').some(c=>c.id==='edge-1'),false);
 assert.equal((await deleteEdge(x,e,{opId:'del-again'})).alreadyApplied,true);
 await assert.rejects(deleteEdge(x,{...e,id:'unknown'}),/unavailable/);
});
