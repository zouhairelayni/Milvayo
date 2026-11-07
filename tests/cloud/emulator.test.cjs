// /tests/cloud/emulator.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const H=require('../helpers/cloud-emulators.cjs'),S=require('../../src/cloud/schema.cjs'),m=require('../../src/domain/model.cjs');
const enabled=process.env.MILVAYO_EMULATORS==='1';
test('emulator-backed authorization, incremental sync, recovery and collaboration', {skip:!enabled?'Not run: use npm run test:cloud against Firebase emulators':false,timeout:240000},async t=>{
 const env=await H.environment();t.after(()=>env.cleanup());const alice=await H.account('alice'),bob=await H.account('bob'),outsider=await H.account('outsider'),platform=await H.account('platform');
 const fixture=await H.publish(alice),scope={orgId:fixture.orgId,workspaceId:fixture.workspaceId},ws=`orgs/${scope.orgId}/workspaces/${scope.workspaceId}`,org=`orgs/${scope.orgId}`;
 const call=(user,body)=>H.request(user,{...scope,...body});let records=(await call(alice,{action:'pull'})).records;const task=records.find(r=>r.kind==='tasks');
 await t.test('HTTP function and all client collections deny signed-out and cross-tenant access',async()=>{
  await assert.rejects(call(null,{action:'pull'}),{status:401});await assert.rejects(call(outsider,{action:'pull'}),{status:403});
  await call(alice,{action:'importBegin',workspaceId:'hidden-staging',sourceHash:'0'.repeat(64)});await assert.rejects(call(outsider,{action:'backup',workspaceId:'hidden-staging'}),{status:403});await assert.rejects(call(alice,{action:'backup',workspaceId:'hidden-staging'}),{status:403});
  const {assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
  for(const context of [env.unauthenticatedContext(),env.authenticatedContext(outsider.uid)]){await assertFails(context.firestore().doc(`${ws}/records/${task.key}`).get());await assertFails(context.firestore().collection(`${ws}/records`).get());}
  await assertSucceeds(env.authenticatedContext(alice.uid).firestore().doc(`${ws}/records/${task.key}`).get());
  for(const path of [`${ws}/records/${task.key}`,`${org}/members/${alice.uid}`,`${org}/subscription/current`,`platformRoles/${alice.uid}`,`${ws}/grants/${alice.uid}`,`${ws}/versions/fake`])await assertFails(env.authenticatedContext(alice.uid).firestore().doc(path).set({role:'owner',active:true}));
 });
 await t.test('organization and platform administration do not automatically reveal customer content',async()=>{
  await env.withSecurityRulesDisabled(async c=>{await c.firestore().doc(`platformRoles/${platform.uid}`).set({role:'owner'});await c.firestore().doc(`${org}/members/${bob.uid}`).set({active:true,role:'admin'});});
  assert.ok((await call(platform,{action:'platform'})).organizations.length>0);await assert.rejects(call(platform,{action:'pull'}),{status:403});await assert.rejects(call(alice,{action:'platform'}),{status:403});await assert.rejects(call(bob,{action:'pull'}),{status:403});assert.ok((await call(bob,{action:'admin'})).members.length>=2);
 });
 await t.test('scoped roles, explicit project denials and storage isolation are enforced',async()=>{
  await call(alice,{action:'grant',uid:bob.uid,grant:{workspaceRole:'viewer',projects:{}}});assert.equal((await call(bob,{action:'pull'})).records.length,records.length);
  const change={key:task.key,before:task,after:{...task,data:{...task.data,title:'Forged'}},baseRevision:1};await assert.rejects(call(bob,{action:'commit',mutationId:crypto.randomUUID(),changes:[change]}),{status:403});
  await call(alice,{action:'grant',uid:bob.uid,grant:{workspaceRole:'viewer',projects:{[task.projectId]:'none'}}});assert.equal((await call(bob,{action:'pull'})).records.filter(r=>r.projectId===task.projectId).length,0);
  const {assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');const sharedKey=S.keyOf('portfolios','','private-hierarchy');await env.withSecurityRulesDisabled(c=>c.firestore().doc(`${ws}/records/${sharedKey}`).set({key:sharedKey,kind:'portfolios',projectId:'',data:{name:'Confidential hierarchy'}}));try{await assertFails(env.authenticatedContext(bob.uid).firestore().doc(`${ws}/records/${sharedKey}`).get());await assertSucceeds(env.authenticatedContext(alice.uid).firestore().doc(`${ws}/records/${sharedKey}`).get());await assertSucceeds(env.authenticatedContext(bob.uid).firestore().doc(ws).get());}finally{await env.withSecurityRulesDisabled(c=>c.firestore().doc(`${ws}/records/${sharedKey}`).delete());}const path=`attachments/${scope.orgId}/${scope.workspaceId}/${task.projectId}/${alice.uid}/test.txt`;
  await assertSucceeds(env.authenticatedContext(alice.uid).storage().ref(path).putString('hello','raw',{contentType:'text/plain'}));await assertFails(env.authenticatedContext(bob.uid).storage().ref(path).getMetadata());await assertFails(env.authenticatedContext(outsider.uid).storage().ref(path).getMetadata());
  await assertFails(env.authenticatedContext(alice.uid).storage().ref(path).putString('bad','raw',{contentType:'text/html'}));
 });
 await t.test('independent fields merge using server revisions; duplicate delivery has one effect',async()=>{
  const op={action:'commit',mutationId:crypto.randomUUID(),changes:[{key:task.key,before:task,after:{...task,data:{...task.data,title:'New title'}},baseRevision:1}]};const a=await call(alice,op),duplicate=await call(alice,op);assert.equal(a.sequence,duplicate.sequence);assert.equal(duplicate.duplicate,true);await require('@firebase/rules-unit-testing').assertFails(env.authenticatedContext(alice.uid).firestore().doc(`${ws}/receipts/${op.mutationId}`).get());
  const b=await call(alice,{action:'commit',mutationId:crypto.randomUUID(),changes:[{key:task.key,before:task,after:{...task,data:{...task.data,owner:'Planner'}},baseRevision:1}]});assert.equal(b.records[0].data.title,'New title');assert.equal(b.records[0].data.owner,'Planner');
  await assert.rejects(call(alice,{action:'commit',mutationId:crypto.randomUUID(),changes:[{key:task.key,before:task,after:{...task,data:{...task.data,title:'Conflicting title'}},baseRevision:1}]}),{code:'conflict'});
  const version=(await call(alice,{action:'pull'})).accessVersion,delta=await call(alice,{action:'pull',cursor:1,accessVersion:version});assert.equal(delta.records.length,1);assert.equal(delta.records[0].revision,3);
 });
 await t.test('malformed fields, forged bases, dependency cycles and partial multi-record edits roll back',async()=>{
  records=(await call(alice,{action:'pull'})).records;const current=records.find(r=>r.key===task.key),beforeSeq=(await call(alice,{action:'pull'})).cursor;
  for(const patch of [{platformRole:'owner'},{dependsOn:[task.id]},{title:'x'.repeat(100001)}])await assert.rejects(call(alice,{action:'commit',mutationId:crypto.randomUUID(),changes:[{key:current.key,before:current,after:{...current,data:{...current.data,...patch}},baseRevision:current.revision}]}));
  await assert.rejects(call(alice,{action:'commit',mutationId:crypto.randomUUID(),changes:[{key:current.key,before:{...current,data:{...current.data,title:'Fake base'}},after:current,baseRevision:current.revision}]}),{code:'conflict'});assert.equal((await call(alice,{action:'pull'})).cursor,beforeSeq);
 });
 await t.test('backup integrity, soft deletion, revision history and restore preserve domain references',async()=>{
  const backup=await call(alice,{action:'backup'});assert.equal(backup.checksum,crypto.createHash('sha256').update(S.stable(backup.records)).digest('hex'));assert.ok((await call(alice,{action:'history',key:task.key})).versions.length>=2);
  const nowRecords=(await call(alice,{action:'pull'})).records;const target=nowRecords.find(r=>r.kind==='tasks'&&r.id==='NST-009');await call(alice,{action:'commit',mutationId:crypto.randomUUID(),changes:[{key:target.key,before:target,after:null,baseRevision:target.revision}]});const deleted=(await call(alice,{action:'pull'})).records.find(r=>r.key===target.key);assert.equal(deleted.deleted,true);
  const changes=[{key:target.key,before:null,after:target,baseRevision:deleted.revision}];await call(alice,{action:'commit',restore:true,mutationId:crypto.randomUUID(),changes});assert.equal((await call(alice,{action:'pull'})).records.find(r=>r.key===target.key).deleted,false);
 });
 await t.test('invitation targeting, one-use acceptance and concurrent seat limits are transactional',async()=>{
  const c=await H.account('seat-c'),d=await H.account('seat-d');await call(alice,{action:'subscription',capacity:2});const invite=await call(alice,{action:'invite',uid:c.uid,grant:{workspaceRole:'viewer',projects:{}}}),other=await call(alice,{action:'invite',uid:d.uid,grant:{workspaceRole:'viewer',projects:{}}});
  await assert.rejects(call(outsider,{action:'accept',token:invite.token}),{status:403});const results=await Promise.allSettled([call(c,{action:'accept',token:invite.token}),call(d,{action:'accept',token:other.token})]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal((await call(alice,{action:'admin'})).subscription.seats.length,2);
  const winner=results[0].status==='fulfilled'?c:d,token=winner===c?invite.token:other.token;await assert.rejects(call(winner,{action:'accept',token}),{status:403});await assert.rejects(call(alice,{action:'subscription',capacity:1}));
 });
 await t.test('summary projections, mock billing signatures and concurrent grants retain authorization',async()=>{
  const summary=await call(alice,{action:'summaries'});assert.equal(summary.summaries[0].taskCount,9);assert.equal((await call(bob,{action:'summaries'})).summaries.length,0);
  const billing=require('../../src/cloud/server/mockBilling.cjs'),event={provider:'mock',id:crypto.randomUUID(),type:'capacity',capacity:5,at:Date.now()},signature=billing.sign(event);assert.equal((await call(alice,{action:'mockWebhook',event,signature})).simulated,true);assert.equal((await call(alice,{action:'mockWebhook',event,signature})).duplicate,true);await assert.rejects(call(outsider,{action:'mockWebhook',event,signature}),{status:403});await assert.rejects(call(alice,{action:'mockWebhook',event,signature:'0'.repeat(64)}));
  await Promise.all([call(alice,{action:'grant',uid:bob.uid,grant:{workspaceRole:'viewer',projects:{}}}),call(alice,{action:'grant',uid:bob.uid,grant:{workspaceRole:'none',projects:{}}})]);
  await env.withSecurityRulesDisabled(async c=>{const grant=(await c.firestore().doc(`${ws}/grants/${bob.uid}`).get()).data(),acl=(await H.database(c).ref(`acl/${scope.orgId}/${scope.workspaceId}/${bob.uid}`).get()).val();assert.equal(acl.version,grant.version);assert.equal(acl.workspace,grant.workspaceRole==='viewer');});
 });
 await t.test('member revocation denies existing content and releases the seat without granting platform rights',async()=>{await call(alice,{action:'revoke',uid:bob.uid});await assert.rejects(call(bob,{action:'pull'}),{status:403});await assert.rejects(call(bob,{action:'admin'}),{status:403});await assert.rejects(call(alice,{action:'revoke',uid:alice.uid}),{status:403});});
 await t.test('Realtime Database protects rooms, multiple sessions and revocation independently',async()=>{
  const {assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');await call(alice,{action:'grant',uid:alice.uid,grant:{workspaceRole:'manager',projects:{}}});
  const path=`presence/${scope.orgId}/${scope.workspaceId}/${task.projectId}/${alice.uid}`,db=H.database(env.authenticatedContext(alice.uid)),value={state:'editing',resource:task.id,expiresAt:Date.now()+60000};
  await assertSucceeds(db.ref(path+'/one').set(value));await assertSucceeds(db.ref(path+'/two').set(value));await assertSucceeds(db.ref(path+'/one').remove());assert.ok((await db.ref(path).get()).child('two').exists());
  await assertFails(H.database(env.authenticatedContext(outsider.uid)).ref(path).get());await assertFails(db.ref(path+'/bad').set({...value,secret:'injected'}));await assertFails(db.ref(`acl/${scope.orgId}`).set({anything:true}));
  await call(alice,{action:'grant',uid:alice.uid,grant:{workspaceRole:'none',projects:{}}});await assertFails(db.ref(path).get());await assert.rejects(call(alice,{action:'commit',mutationId:crypto.randomUUID(),changes:[{key:task.key,before:task,after:task,baseRevision:1}]}),{status:403});
 });
});
