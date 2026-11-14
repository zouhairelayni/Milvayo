// /tests/cloud/patch-canvas.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {database,generate}=require('../helpers/cloud-fake.cjs'),m=require('../../src/domain/model.cjs'),P=require('../../src/cloud/server/patch.cjs');
const accepts=async p=>{try{return (await p).ok!==false;}catch{return false;}};
function world(objects){const w=m.normalizeWorkspace(generate({tasks:3,objects})),x=database(w),legacy=database(w,{protocol:null});return {x,legacy};}
const objectOf=x=>[...x.rows.values()].find(r=>r.kind==='canvas.objects'&&!r.deleted);
let n=0;
const patch=(x,o,set,over={})=>x.service.execute('alice',{...x.scope,action:'patchCanvas',projectId:o.projectId,boardId:o.boardId,objectId:o.id,opId:'canvas-op-'+(++n),baseRevision:o.revision,set,...over});
const legacyCommit=(x,o,set)=>x.service.execute('alice',{...x.scope,action:'commit',mutationId:'canvas-m-'+(++n),changes:[{key:o.key,baseRevision:o.revision,before:o,after:{...o,data:{...o.data,...set}}}]});
const CASES=[{x:10},{y:-250},{x:1e6},{x:1000001},{y:-1000001},{x:'10'},{x:null},{width:40},{width:39},{width:20000},{width:20001},{height:32},{height:31},{height:20001},{zIndex:0},{zIndex:-1},{zIndex:100000},{zIndex:100001},{x:5,y:6,width:300,height:200,zIndex:3},{x:1.5},{width:'wide'},{locked:true},{groupId:'nope'},{text:'edited'},{color:'#123456'},{type:'frame'}];
test('Canvas geometry patches accept and reject exactly like canonical validation',async()=>{
 const {x,legacy}=world(30),a=objectOf(x),b=objectOf(legacy);let compared=0;
 for(const set of CASES){
  const x2=world(30),o=objectOf(x2.x),l=objectOf(x2.legacy),lean=await accepts(patch(x2.x,o,set)),old=await accepts(legacyCommit(x2.legacy,l,set)),label=JSON.stringify(set);
  if(lean)assert.equal(old,true,'patch accepted what canonical validation rejected: '+label);
  if(old&&Object.keys(set).every(k=>P.CANVAS_ALLOWED.has(k)))assert.equal(lean,true,'patch rejected a valid edit: '+label);
  if(lean&&old)assert.deepEqual(objectOf(x2.x).data,objectOf(x2.legacy).data,'result differs: '+label);
  compared++;
 }
 assert.equal(compared,CASES.length);assert.ok(a&&b);
});
test('a Canvas move is one write and five reads at any board size (legacy: a full project scan)',async()=>{
 for(const count of [10,100,500,1000]){
  const {x,legacy}=world(count),o=objectOf(x),r=await patch(x,o,{x:o.data.x+40,y:o.data.y+20});
  assert.equal(r.ok,true);assert.equal(r.measured.documentWrites,1);assert.equal(r.measured.documentReads,5,'no scan at '+count+' objects');assert.equal(x.writes.length,1);assert.equal(r.record.data.x,o.data.x+40);
  const l=await legacyCommit(legacy,objectOf(legacy),{x:objectOf(legacy).data.x+40});assert.ok(l.measured.documentReads>count,'legacy reads the project: '+l.measured.documentReads);
 }
});
test('Canvas patches keep authorization, stale, duplicate and tombstone behavior',async()=>{
 const {x}=world(10),o=objectOf(x);x.grant('viewer',{workspaceRole:'viewer',projects:{}});
 await assert.rejects(x.service.execute('viewer',{...x.scope,action:'patchCanvas',projectId:o.projectId,boardId:o.boardId,objectId:o.id,opId:'v1',baseRevision:o.revision,set:{x:1}}),/scoped grant/);
 const first=await patch(x,o,{x:11},{opId:'canvas-fixed'});assert.equal(first.ok,true);
 assert.equal((await patch(x,o,{x:11},{opId:'canvas-fixed'})).duplicate,true);await assert.rejects(patch(x,o,{x:12},{opId:'canvas-fixed'}),/reused with different content/);
 const stale=await patch(x,o,{x:99},{opId:'canvas-stale'});assert.equal(stale.ok,false);assert.equal(stale.code,'conflict');
 await assert.rejects(patch(x,o,{text:'no'}),/not patchable/);await assert.rejects(patch(x,o,{x:1},{boardId:'other-board'}),/unavailable/);
 x.rows.set(o.key&&x.root+'/records/'+o.key,{...x.record('canvas.objects',o.id),deleted:true});assert.equal((await patch(x,o,{x:2},{opId:'canvas-dead',baseRevision:2})).code,'deleted');
});
