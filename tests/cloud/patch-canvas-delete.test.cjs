// /tests/cloud/patch-canvas-delete.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {database,generate}=require('../helpers/cloud-fake.cjs'),m=require('../../src/domain/model.cjs'),S=require('../../src/cloud/schema.cjs'),canvas=require('../../src/domain/canvas.cjs');
const NOW='2026-11-10T00:00:00.000Z';
function board(objects=14){
 const W=generate({tasks:3,objects}),p=W.projects[0],b=p.canvases[0],o=b.objects;
 p.canvases[0]={...b,objects:o.map((x,i)=>i===1||i===6?{...x,type:'frame'}:i===2||i===3?{...x,groupId:o[1].id}:i===7?{...x,groupId:o[6].id}:i===10?{...x,locked:true}:x),
  connectors:[{id:'e1',from:o[4].id,to:o[5].id},{id:'e2',from:o[2].id,to:o[8].id},{id:'e3',from:o[5].id,to:o[1].id}],
  threads:[{id:'t1',objectId:o[2].id,x:1,y:2,messages:[{id:'m1',text:'hi',at:NOW}]},{id:'t2',objectId:o[9].id,x:3,y:4,messages:[]},{id:'t3',objectId:'',x:5,y:6,messages:[]}]};
 return m.normalizeWorkspace(W);
}
const objectIds=w=>w.projects[0].canvases[0].objects.map(o=>o.id);
const live=x=>[...x.rows.values()].filter(r=>r.key&&r.kind&&!r.deleted);
const strip=r=>r.kind==='canvases'?{...r.data,revision:0,updatedAt:''}:r.data;
const mapOf=records=>new Map(records.filter(r=>!r.deleted).map(r=>[r.key,strip(r)]));
function expected(w,ids){const ws=S.unpack(S.pack(w),w),p=ws.projects[0],next=canvas.changeBoard(p.canvases[0],{type:'remove',ids},NOW);return mapOf(S.pack(m.normalizeWorkspace({...ws,projects:[{...p,canvases:[next]}]})).map(r=>({...r,deleted:false})));}
const call=(x,body)=>x.service.execute('alice',{...x.scope,action:'deleteCanvasObjects',opId:'cd-'+Math.random().toString(36).slice(2),...body});
const obj=(x,id)=>[...x.rows.values()].find(r=>r.kind==='canvas.objects'&&r.id===id);
const CASES=[['a plain object with a connector',[4]],['a frame: children lose their group, its connector goes',[1]],['two children of a frame with an anchored comment and a connector',[2,3]],['several unrelated objects',[4,5,9]],['two frames',[1,6]],['an object and its frame together',[1,2]],['a single object that is a frame child',[7]]];
test('deleteCanvasObjects reaches exactly the state of the domain remove cascade',async()=>{
 for(const [name,picks] of CASES){
  const w=board(),x=database(w),ids=objectIds(w),chosen=picks.map(i=>ids[i]),want=expected(w,chosen);
  const r=await call(x,{projectId:obj(x,chosen[0]).projectId,boardId:obj(x,chosen[0]).boardId,objectIds:chosen,bases:Object.fromEntries(chosen.map(id=>[id,obj(x,id).revision]))});
  assert.equal(r.ok,true,name);const got=mapOf(live(x));
  for(const [k,v] of want){assert.ok(got.has(k),`${name}: missing ${k}`);assert.deepEqual(got.get(k),v,`${name}: ${k}`);}
  for(const k of got.keys())assert.ok(want.has(k),`${name}: unexpected live record ${k}`);
  assert.doesNotThrow(()=>S.validateRecords(live(x)),name+': canonical state');
 }
});
test('a locked object, a stale revision and a missing object are refused without writing; retries are idempotent',async()=>{
 const w=board(),x=database(w),ids=objectIds(w),p=obj(x,ids[0]),base=id=>obj(x,id).revision,body=(list,extra={})=>({projectId:p.projectId,boardId:p.boardId,objectIds:list,bases:Object.fromEntries(list.map(id=>[id,base(id)])),...extra});
 await assert.rejects(call(x,body([ids[10]])),/Unlock the object/);await assert.rejects(call(x,{projectId:p.projectId,boardId:p.boardId,objectIds:['ghost'],bases:{ghost:1}}),/unavailable/);
 const stale=await call(x,body([ids[4]],{bases:{[ids[4]]:99}}));assert.equal(stale.ok,false);assert.equal(stale.code,'conflict');assert.equal(x.writes.length,0);
 const first=await call(x,body([ids[4]],{opId:'cd-fixed'}));assert.equal(first.ok,true);
 const retry=await call(x,{...body([ids[4]],{opId:'cd-fixed'}),bases:{[ids[4]]:1}});assert.ok(retry.alreadyApplied||retry.duplicate);
});
test('the cost is bounded by the selection and its relations, not by the board size',async()=>{
 for(const objects of [100,500,999]){
  const W=generate({tasks:3,objects}),w=m.normalizeWorkspace(W),x=database(w),legacy=database(w,{protocol:null}),o=[...x.rows.values()].find(r=>r.kind==='canvas.objects'),lo=[...legacy.rows.values()].find(r=>r.id===o.id&&r.kind==='canvas.objects');
  const r=await call(x,{projectId:o.projectId,boardId:o.boardId,objectIds:[o.id],bases:{[o.id]:o.revision}});
  assert.equal(r.ok,true);assert.ok(r.measured.documentReads<=13,`${objects} objects: ${r.measured.documentReads} reads`);assert.equal(r.measured.documentWrites,1);
  const l=await legacy.service.execute('alice',{...legacy.scope,action:'commit',mutationId:'cl-'+objects,changes:[{key:lo.key,baseRevision:lo.revision,before:lo,after:null}]});assert.ok(l.measured.documentReads>objects);
 }
});
test('permissions and the selection limit hold',async()=>{
 const w=board(),x=database(w),ids=objectIds(w),p=obj(x,ids[0]);x.grant('editor',{workspaceRole:'contributor',projects:{}});x.rows.set('orgs/org/subscription/current',{capacity:5,seats:['alice','editor'],allocations:{}});
 await assert.rejects(x.service.execute('editor',{...x.scope,action:'deleteCanvasObjects',projectId:p.projectId,boardId:p.boardId,objectIds:[ids[4]],bases:{[ids[4]]:1},opId:'e1'}),/scoped grant/);
 await assert.rejects(call(x,{projectId:p.projectId,boardId:p.boardId,objectIds:Array.from({length:51},(_,i)=>'o'+i),bases:{}}),/between 1 and 50/);
});
