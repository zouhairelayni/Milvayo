// /tests/cloud/patch.emulator.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const H=require('../helpers/cloud-emulators.cjs');
const enabled=process.env.MILVAYO_EMULATORS==='1';
test('Firebase v4 field patch: one write, protocol guard, stale and duplicate handling in the Functions and Firestore emulators',{skip:!enabled?'Not run: use npm run test:cloud against Firebase emulators':false,timeout:180000},async()=>{
 const alice=await H.account('alice'),bob=await H.account('bob'),fixture=await H.publish(alice),scope={orgId:fixture.orgId,workspaceId:fixture.workspaceId};
 const call=(user,body)=>H.request(user,{...scope,...body}),rejects=(promise,pattern)=>assert.rejects(promise,e=>pattern.test(String(e.message)));
 const task=async()=>(await call(alice,{action:'pull'})).records.find(r=>r.kind==='tasks'&&!r.deleted);
 let t=await task(),patch=(user,set,over={})=>call(user,{action:'patch',projectId:t.projectId,taskId:t.id,opId:crypto.randomUUID(),baseRevision:t.revision,set,...over});
 await rejects(patch(alice,{title:'Too early'}),/does not accept field patches/);
 await call(alice,{action:'workspaceControl',protocol:4});
 await rejects(call(alice,{action:'commit',mutationId:crypto.randomUUID(),changes:[{key:t.key,baseRevision:t.revision,before:t,after:{...t,data:{...t.data,title:'Legacy'}}}]}),/Update the app/);
 const op=crypto.randomUUID(),first=await patch(alice,{title:'Lean title',priority:'High'},{opId:op});
 assert.equal(first.ok,true);assert.equal(first.revision,t.revision+1);assert.equal(first.measured.documentWrites,1,'a routine edit is one Firestore write');assert.ok(first.measured.documentReads<=5);
 const dup=await patch(alice,{title:'Lean title',priority:'High'},{opId:op});assert.equal(dup.duplicate,true);
 const stale=await patch(alice,{title:'Stale'},{opId:crypto.randomUUID()});assert.equal(stale.ok,false);assert.equal(stale.code,'conflict');assert.equal(stale.current.data.title,'Lean title');
 const invite=await call(alice,{action:'invite',uid:bob.uid,grant:{workspaceRole:'viewer',projects:{}}});await call(bob,{action:'accept',token:invite.token});
 // Gate 2 does not increment v3 workspace sequence, so pull() may return a stale cached revision.
 // The acknowledged patch response is authoritative until Gate 3 replaces change discovery.
 t=first.record;assert.equal(t.revision,first.revision);await rejects(patch(bob,{title:'Viewer edit'}),/scoped grant/);
 await call(alice,{action:'workspaceControl',writeFreeze:true});await rejects(patch(alice,{title:'Frozen'}),/paused/);await call(alice,{action:'workspaceControl',writeFreeze:false});
 assert.equal((await patch(alice,{title:'Unfrozen'})).ok,true);
});
