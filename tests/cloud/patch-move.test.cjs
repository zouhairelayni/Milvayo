// /tests/cloud/patch-move.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {database,generate}=require('../helpers/cloud-fake.cjs'),{alignOrders}=require('../../src/cloud/v4Writes.cjs'),S=require('../../src/cloud/schema.cjs');
const world=()=>{const x=database(generate({tasks:8,objects:0,projects:1}),{protocol:4});x.grant('viewer',{workspaceRole:'viewer',projects:{}});return x;};
const tasks=x=>[...x.rows.values()].filter(r=>r.kind==='tasks'&&!r.deleted).sort((a,b)=>a.order-b.order);
let n=0;const move=(x,t,order,over={},who='alice')=>x.service.execute(who,{...x.scope,action:'moveTask',projectId:t.projectId,taskId:t.id,opId:'move-'+(++n),baseRevision:t.revision,order,...over});
test('moveTask changes only the position: one write, the data untouched, the revision up by one',async()=>{
 const x=world(),t=tasks(x)[5],data=JSON.stringify(t.data),r=await move(x,t,0.5);
 assert.equal(r.ok,true);assert.equal(r.record.order,0.5);assert.equal(r.record.revision,t.revision+1);assert.equal(JSON.stringify(r.record.data),data);assert.equal(x.writes.length,1);
 assert.equal(r.measured?.documentWrites??1,1);assert.equal(tasks(x)[1].id,t.id,'sorted after the first task');
});
test('moveTask validates the position, honours stale revisions, duplicates and permissions',async()=>{
 const x=world(),t=tasks(x)[3];
 for(const bad of [-1,100001,'3',null])await assert.rejects(move(x,t,bad),/Invalid position/);
 const first=await move(x,t,2.5,{opId:'fixed'});assert.equal(first.ok,true);
 assert.equal((await move(x,t,2.5,{opId:'fixed'})).duplicate,true);await assert.rejects(move(x,t,2.6,{opId:'fixed'}),/reused with different content/);
 const stale=await move(x,t,1.5);assert.equal(stale.ok,false);assert.equal(stale.code,'conflict');assert.equal(stale.current.order,2.5);
 const same=await move(x,t,2.5,{baseRevision:1});assert.equal(same.alreadyApplied,true,'a stale retry that already holds the position is accepted');
 await assert.rejects(move(x,t,1,{baseRevision:first.revision},'viewer'),/scoped grant/);
 await assert.rejects(move(x,t,1,{taskId:'no-such-task',baseRevision:1}),/unavailable/);
});
test('moveTask is refused in a workspace that is not on v4 and during a write freeze',async()=>{
 const legacy=database(generate({tasks:3,objects:0,projects:1}),{protocol:null}),t=tasks(legacy)[0];
 await assert.rejects(move(legacy,t,0.5),/does not accept field patches/);
 const x=world(),u=tasks(x)[0];await x.service.execute('alice',{...x.scope,action:'workspaceControl',writeFreeze:true});await assert.rejects(move(x,u,0.5),/paused/);
});
test('alignOrders: one moved record gets a position between its new neighbours; two moved records, or no room, are left alone',()=>{
 const rec=(id,order)=>({key:'tasks~p~~'+id,kind:'tasks',projectId:'p',boardId:'',id,order,data:{}});
 const local=['a','b','c','d','e'].map((id,i)=>rec(id,i)),pos=ids=>ids.map((id,i)=>rec(id,i));
 const one=alignOrders(pos(['a','e','b','c','d']),local),orderOf=(list,id)=>list.find(r=>r.id===id).order;
 assert.equal(orderOf(one,'e'),0.5);for(const id of ['a','b','c','d'])assert.equal(orderOf(one,id),local.find(r=>r.id===id).order);
 assert.equal(orderOf(alignOrders(pos(['e','a','b','c','d']),local),'e'),0,'to the very front: half of the first order');
 assert.equal(orderOf(alignOrders(pos(['b','c','d','e','a']),local),'a'),5,'to the very end: after the last order');
 const two=alignOrders(pos(['b','a','d','c','e']),local);assert.deepEqual(two.map(r=>r.order),[0,1,2,3,4],'left as positions: the planner refuses it');
 const tight=['a','b'].map((id,i)=>rec(id,i===0?0:1e-10)),res=alignOrders(pos(['b','a']),tight);assert.equal(orderOf(res,'b'),0,'no room: position kept, the planner refuses it');
});
