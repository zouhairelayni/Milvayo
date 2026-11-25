// /tests/cloud/patch-canvas-create.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {database,generate}=require('../helpers/cloud-fake.cjs'),m=require('../../src/domain/model.cjs'),canvas=require('../../src/domain/canvas.cjs');
const world=()=>{const x=database(m.normalizeWorkspace(generate({tasks:3,objects:6,projects:1})),{protocol:4});x.grant('viewer',{workspaceRole:'viewer',projects:{}});return x;};
const live=(x,kind)=>[...x.rows.values()].filter(r=>r.kind===kind&&!r.deleted);
let n=0;const call=(x,body,who='alice')=>x.service.execute(who,{...x.scope,opId:'cc-'+(++n),...body});
const NOW='2026-11-20T10:00:00.000Z';
const note=(o,id,extra={})=>{const raw=canvas.createObject({id,boardId:o.boardId,x:10,y:20,text:'Hi',now:NOW,zIndex:70,...extra});try{return {...canvas.normalizeObject(raw,o.boardId,o.projectId)};}catch{return raw;}};
const addObject=(x,o,data,over={})=>call(x,{action:'createCanvasObject',projectId:o.projectId,boardId:o.boardId,objectId:data.id,order:99,data,...over});
const addEdge=(x,o,data,over={})=>call(x,{action:'createCanvasConnector',projectId:o.projectId,boardId:o.boardId,connectorId:data.id,order:99,data,...over});
test('createCanvasObject writes one document and keeps canonical state; duplicates and reuse are handled',async()=>{
 const x=world(),o=live(x,'canvas.objects')[0],data=note(o,'fresh-1'),before=live(x,'canvas.objects').length;
 const r=await addObject(x,o,data,{opId:'fixed-1'});assert.equal(r.ok,true);assert.equal(r.revision,1);assert.equal(x.writes.length,1);assert.equal(live(x,'canvas.objects').length,before+1);
 assert.deepEqual(live(x,'canvas.objects').find(v=>v.id==='fresh-1').data,data);
 assert.equal((await addObject(x,o,data,{opId:'fixed-1'})).duplicate,true);
 await assert.rejects(addObject(x,o,data,{opId:'other-op'}),/already exists/);
});
test('createCanvasObject rejects what canonical validation rejects, a group frame that does not exist, a missing board and a viewer',async()=>{
 const x=world(),o=live(x,'canvas.objects')[0];
 for(const bad of [{...note(o,'b1'),width:5},{...note(o,'b2'),x:1e9},{...note(o,'b3'),type:'nonsense'},{...note(o,'b4'),extra:'field'},{...note(o,'b5'),boardId:'another'}])await assert.rejects(addObject(x,o,bad),/canonical|carry its own/);
 await assert.rejects(addObject(x,o,note(o,'g1',{groupId:'someframe'})),/group frame is unavailable/);
 await assert.rejects(addObject(x,o,{...note(o,'l1'),type:'linked'}),/canonical/);
 await assert.rejects(addObject(x,{...o,boardId:'no-board'},note({...o,boardId:'no-board'},'nb1')),/unavailable/);
 await assert.rejects(addObject(x,o,note(o,'v1'),{opId:'v1'}).then(()=>call(x,{action:'createCanvasObject',projectId:o.projectId,boardId:o.boardId,objectId:'v2',order:1,data:note(o,'v2')},'viewer')),/scoped grant/);
 assert.equal(live(x,'canvas.objects').filter(r=>/^(b|g|l|nb)\d/.test(r.id)).length,0);
});
test('createCanvasConnector needs two live objects of the same board and a canonical connector',async()=>{
 const x=world(),[a,b]=live(x,'canvas.objects').filter(r=>r.boardId===live(x,'canvas.objects')[0].boardId);
 const edge={id:'edge-ok',from:a.id,to:b.id,label:'',style:'curve',arrow:true};
 const r=await addEdge(x,a,edge);assert.equal(r.ok,true);assert.equal(x.writes.length,1);assert.deepEqual(live(x,'canvas.connectors').find(v=>v.id==='edge-ok').data,edge);
 await assert.rejects(addEdge(x,a,{...edge,id:'e2',to:a.id}),/canonical/,'a connector cannot join an object to itself');
 await assert.rejects(addEdge(x,a,{...edge,id:'e3',to:'missing-object'}),/end is unavailable/);
 await assert.rejects(addEdge(x,a,{...edge,id:'e4',style:'zigzag'}),/canonical/);
 await assert.rejects(addEdge(x,a,{...edge,id:'e5',color:'red'}),/canonical/);
 await assert.rejects(addEdge(x,a,{...edge,id:'e6',extra:1}),/canonical/);
});
test('a Canvas create moves the project signal',async()=>{
 const x=world(),o=live(x,'canvas.objects')[0];
 const head=()=>JSON.stringify([...x.rtdb.nodes.entries()].filter(([k])=>k.startsWith('heads/')));
 const first=head();await addObject(x,o,note(o,'sig-1'));await new Promise(r=>setTimeout(r,50));assert.notEqual(head(),first,'the signal moved');
});
test('a board that already holds 1,000 objects refuses another one but still accepts a connector',async()=>{
 const x=database(m.normalizeWorkspace(generate({tasks:2,objects:1000,projects:1})),{protocol:4}),objs=live(x,'canvas.objects').filter(r=>r.boardId===live(x,'canvas.objects')[0].boardId);
 assert.equal(objs.length,1000);
 await assert.rejects(addObject(x,objs[0],note(objs[0],'over-cap')),/too large/);
 const r=await addEdge(x,objs[0],{id:'cap-edge',from:objs[0].id,to:objs[1].id,label:'',style:'curve',arrow:true});assert.equal(r.ok,true);
});
