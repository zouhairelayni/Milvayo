// /tests/cloud/security.emulator.test.cjs
'use strict';
// Firebase emulator integration test for the Gate 2 security fixes. Not runnable in the sandbox: use `npm run test:cloud` in Termux.
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const H=require('../helpers/cloud-emulators.cjs'),{PROJECT_ID}=require('../../src/cloud/config.cjs');
const enabled=process.env.MILVAYO_EMULATORS==='1',skip=!enabled?'Not run: use npm run test:cloud against Firebase emulators':false;
test('Gate 2 security fixes hold against the real Functions, Firestore and Auth emulators',{skip,timeout:300000},async t=>{
 const env=await H.environment();t.after(()=>env.cleanup());
 let alice,bob,carol,scope;
 t.beforeEach(async()=>{
  alice=await H.account('sec-alice');bob=await H.account('sec-bob');carol=await H.account('sec-carol');
  const fixture=await H.publish(alice);scope={orgId:fixture.orgId,workspaceId:fixture.workspaceId};
  const invite=await call(alice,{action:'invite',uid:bob.uid,grant:{workspaceRole:'viewer',projects:{}}});await call(bob,{action:'accept',token:invite.token});
 });
 const call=(u,b)=>H.request(u,{...scope,...b}),rejects=(p,re)=>assert.rejects(p,e=>re.test(String(e.message)));
 const member=async uid=>{let value;await env.withSecurityRulesDisabled(async c=>{value=(await c.firestore().doc(`orgs/${scope.orgId}/members/${uid}`).get()).data();});return value;};
 const task=async()=>(await call(alice,{action:'pull'})).records.find(r=>r.kind==='tasks'&&!r.deleted);
 await t.test('S1: a revoked administrator does not regain the role when re-invited',async()=>{
  const first=await call(alice,{action:'invite',uid:bob.uid,grant:{workspaceRole:'viewer',projects:{}}});await call(bob,{action:'accept',token:first.token});
  await call(alice,{action:'memberRole',uid:bob.uid,role:'admin'});assert.equal((await member(bob.uid)).role,'admin');
  await call(alice,{action:'revoke',uid:bob.uid});assert.equal((await member(bob.uid)).active,false);assert.equal((await member(bob.uid)).role,'member');
  const again=await call(alice,{action:'invite',uid:bob.uid,grant:{workspaceRole:'viewer',projects:{}}});await call(bob,{action:'accept',token:again.token});
  assert.equal((await member(bob.uid)).role,'member');await rejects(call(bob,{action:'grant',uid:bob.uid,grant:{workspaceRole:'manager',projects:{}}}),/administrator/);
 });
 await t.test('F1: an operation ID cannot acknowledge a different edit or another user',async()=>{
  await call(alice,{action:'workspaceControl',protocol:4});const x=await task(),op=crypto.randomUUID(),base={action:'patch',projectId:x.projectId,taskId:x.id,opId:op,baseRevision:x.revision};
  assert.equal((await call(alice,{...base,set:{title:'Original edit'}})).ok,true);
  assert.equal((await call(alice,{...base,set:{title:'Original edit'}})).duplicate,true);
  await rejects(call(alice,{...base,set:{title:'A different edit'}}),/reused with different content/);
 });
 await t.test('F2: the write freeze stops chat while revocation still works',async()=>{
  const x=await task();await call(alice,{action:'workspaceControl',writeFreeze:true});
  await rejects(call(alice,{action:'message',projectId:x.projectId,mutationId:crypto.randomUUID(),body:'During the freeze'}),/paused/);
  const invite=await call(alice,{action:'invite',uid:carol.uid,grant:{workspaceRole:'viewer',projects:{}}});await call(carol,{action:'accept',token:invite.token});await call(alice,{action:'revoke',uid:carol.uid});assert.equal((await member(carol.uid)).active,false);
  await call(alice,{action:'workspaceControl',writeFreeze:false});assert.ok(await call(alice,{action:'message',projectId:x.projectId,mutationId:crypto.randomUUID(),body:'After the freeze'}));
 });
 await t.test('S3: errors are generic or coded, never internal text, and telemetry stays out of non-administrator responses',async()=>{
  const bad=await fetch(`http://127.0.0.1:5001/${PROJECT_ID}/us-central1/cloudApi`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer not-a-real-token'},body:JSON.stringify({action:'pull',...scope})});
  const body=await bad.json();assert.equal(bad.status,401);assert.equal(body.code,'unauthenticated');assert.doesNotMatch(JSON.stringify(body),/decod|firebase|jwt|token/i);
  const missing=await call(alice,{action:'history',key:'tasks~nope~~nothing'}).then(()=>null,e=>String(e.message));assert.ok(missing);assert.doesNotMatch(missing,/Cannot read properties|undefined|TypeError/);
  for(let i=0;i<2;i++){const pulled=await call(bob,{action:'pull'});assert.equal(pulled.membershipRole,'member');assert.equal(pulled.measured.documentReads,null);assert.equal(pulled.telemetry,undefined);assert.equal(pulled.timings,undefined);}
 });
 await t.test('S9: invitations to a workspace that does not exist are refused',async()=>{
  await rejects(H.request(alice,{orgId:scope.orgId,workspaceId:'does-not-exist',action:'invite',uid:carol.uid,grant:{workspaceRole:'viewer',projects:{}}}),/unavailable/i);
 });
});
