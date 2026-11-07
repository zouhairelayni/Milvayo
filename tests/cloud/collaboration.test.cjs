// /tests/cloud/collaboration.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const H=require('../helpers/cloud-emulators.cjs'),S=require('../../src/cloud/schema.cjs'),A=require('../../src/cloud/archive.cjs');
const {generate}=require('../../src/cloud/tools/fixtures.cjs'),{verifyBackup}=require('../../src/cloud/recovery.cjs');
test('emulator conversations, organization administration, licenses and staged recovery',{skip:process.env.MILVAYO_EMULATORS!=='1'?'Not run: Firebase emulators required':false,timeout:480000},async t=>{
 const env=await H.environment();t.after(()=>env.cleanup());const owner=await H.account('collab-owner'),guest=await H.account('collab-guest'),stranger=await H.account('collab-stranger'),operator=await H.account('collab-operator');
 const fixture=await H.publish(owner,generate({tasks:120,objects:2})),scope={orgId:fixture.orgId,workspaceId:fixture.workspaceId},projectId=fixture.workspace.projects[0].id,taskId='task-0',threadId='task-'+taskId,thread={projectId,taskId,threadId};
 const call=(u,b)=>H.request(u,{...scope,...b}),org='orgs/'+scope.orgId,ws=org+'/workspaces/'+scope.workspaceId;
 let messageId;
 await t.test('guests do not consume a seat or gain editing and organization permissions',async()=>{
  await assert.rejects(call(owner,{action:'invite',uid:guest.uid,guest:true,grant:{workspaceRole:'contributor',projects:{}}}),{status:403});
  const invite=await call(owner,{action:'invite',uid:guest.uid,guest:true,grant:{workspaceRole:'commenter',projects:{}}});await call(guest,{action:'accept',token:invite.token});
  const admin=await call(owner,{action:'admin'});assert.equal(admin.subscription.seats.includes(guest.uid),false);assert.equal(admin.members.find(m=>m.uid===guest.uid).role,'guest');
  await require('@firebase/rules-unit-testing').assertFails(env.authenticatedContext(guest.uid).firestore().doc(ws).get());await assert.rejects(call(guest,{action:'organizationStructure'}),{status:403});await assert.rejects(call(owner,{action:'grant',uid:guest.uid,grant:{workspaceRole:'contributor',projects:{}}}),{status:403});
 });
 await t.test('groups validate membership, department references and do not grant content',async()=>{
  await call(owner,{action:'groupSave',kind:'departments',id:'design',name:'Design',members:[guest.uid]});await call(owner,{action:'groupSave',kind:'teams',id:'planning',name:'Planning',members:[owner.uid,guest.uid],departmentId:'design'});
  await assert.rejects(call(owner,{action:'groupSave',kind:'teams',id:'bad',name:'Bad',members:[stranger.uid]}),{status:403});await assert.rejects(call(owner,{action:'groupDelete',kind:'departments',id:'design'}),{code:'failed-precondition'});
  const structure=await call(owner,{action:'organizationStructure'});assert.equal(structure.teams[0].departmentId,'design');await assert.rejects(call(stranger,{action:'organizationStructure'}),{status:403});
  await assert.rejects(call(owner,{action:'memberRole',uid:owner.uid,role:'admin'}),{code:'failed-precondition'});await call(owner,{action:'memberRole',uid:guest.uid,role:'member'});await call(owner,{action:'retention',days:90});
 });
 await t.test('licenses count a person once across allocations and cap concurrency transactionally',async()=>{
  await call(owner,{action:'seatCap',scope:projectId,capacity:1});await call(owner,{action:'seatAllocation',uid:guest.uid,scope:projectId,enabled:true});
  await call(owner,{action:'seatAllocation',uid:guest.uid,scope:'portfolio',enabled:true});assert.equal((await call(owner,{action:'admin'})).subscription.seats.length,2);
  await assert.rejects(call(owner,{action:'seatAllocation',uid:owner.uid,scope:projectId,enabled:true}));await assert.rejects(call(owner,{action:'seatCap',scope:projectId,capacity:0}));
  await call(owner,{action:'seatCap',scope:'limited',capacity:1});const raced=await Promise.allSettled([owner,guest].map(u=>call(owner,{action:'seatAllocation',uid:u.uid,scope:'limited',enabled:true})));assert.equal(raced.filter(r=>r.status==='fulfilled').length,1);await call(owner,{action:'grant',uid:guest.uid,grant:{workspaceRole:'contributor',projects:{}}});await call(owner,{action:'seatRelease',uid:guest.uid});
  const admin=await call(owner,{action:'admin'});assert.equal(admin.subscription.seats.includes(guest.uid),false);assert.equal(admin.grants.find(g=>g.uid===guest.uid).workspaceRole,'commenter');
  await env.withSecurityRulesDisabled(async c=>{assert.ok((await c.firestore().collection(org+'/seatAllocations').get()).docs.every(d=>!d.data().members.includes(guest.uid)));});
 });
 await t.test('authenticated messages are idempotent, target authorized members and keep private notifications',async()=>{
  await call(guest,{action:'profile',name:'Guest Planner'});const members=await call(owner,{...thread,action:'directory'});assert.ok(members.members.some(m=>m.name==='Guest Planner'));assert.ok(members.members.every(m=>!('email' in m)));
  await call(guest,{...thread,action:'watch',enabled:true});await assert.rejects(call(guest,{...thread,action:'watch',uid:owner.uid,enabled:true}),{status:403});
  const payload={...thread,action:'message',mutationId:crypto.randomUUID(),body:'Review the plan',mentions:[guest.uid]};messageId=payload.mutationId;const result=await call(owner,payload);assert.equal(result.notifications,1);assert.equal((await call(owner,payload)).duplicate,true);
  await assert.rejects(call(owner,{...payload,body:'Changed duplicate'}),{code:'already-exists'});await assert.rejects(call(owner,{...payload,mutationId:crypto.randomUUID(),mentions:[stranger.uid]}),{status:403});await assert.rejects(call(stranger,{...thread,action:'messages'}),{status:403});
  const messages=await call(guest,{...thread,action:'messages',latest:true});assert.equal(messages.messages.length,1);assert.equal(messages.messages[0].actor,owner.uid);assert.equal(messages.watching,true);
  const notifications=await call(guest,{action:'notifications'});assert.equal(notifications.notifications.length,1);assert.equal('body' in notifications.notifications[0],false);await assert.rejects(call(owner,{action:'notificationRead',id:notifications.notifications[0].id}),{status:403});await call(guest,{action:'notificationRead',id:notifications.notifications[0].id});
  await call(guest,{...thread,action:'message',mutationId:crypto.randomUUID(),body:'Acknowledged',mentions:[]});assert.equal((await call(owner,{...thread,action:'messages',before:2})).messages[0].id,messageId);assert.equal((await call(owner,{...thread,action:'messages',cursor:1})).messages.length,1);
 });
 await t.test('message history pages preserve ordering and incremental poll cursors',async()=>{
  for(let i=0;i<51;i++)await call(owner,{...thread,action:'message',mutationId:crypto.randomUUID(),body:'Page item '+i,mentions:[]});const latest=await call(owner,{...thread,action:'messages',latest:true});assert.equal(latest.messages.length,50);assert.equal(latest.hasOlder,true);const older=await call(owner,{...thread,action:'messages',before:latest.oldest});assert.equal(older.messages.length,3);assert.equal(older.hasOlder,false);const update=await call(owner,{...thread,action:'messages',cursor:latest.cursor});assert.equal(update.messages.length,0);assert.equal('hasOlder' in update,false);
 });
 await t.test('revoked project grants remove mentions, notifications and watchers without leakage',async()=>{
  await call(owner,{action:'grant',uid:guest.uid,grant:{workspaceRole:'commenter',projects:{[projectId]:'none'}}});assert.equal((await call(guest,{action:'notifications'})).notifications.length,0);
  await assert.rejects(call(guest,{...thread,action:'messages'}),{status:403});await assert.rejects(call(owner,{...thread,action:'message',mutationId:crypto.randomUUID(),body:'Forbidden mention',mentions:[guest.uid]}),{status:403});
  assert.equal((await call(owner,{...thread,action:'message',mutationId:crypto.randomUUID(),body:'No stale watcher delivery',mentions:[]})).notifications,0);await call(owner,{action:'grant',uid:guest.uid,grant:{workspaceRole:'commenter',projects:{}}});
 });
 await t.test('large complete recovery keeps collaboration isolated until checksum activation',async()=>{
  const oldTask=(await call(owner,{action:'pull'})).records.find(r=>r.kind==='tasks'&&r.id===taskId);await call(owner,{action:'commit',mutationId:crypto.randomUUID(),changes:[{key:oldTask.key,before:oldTask,after:null,baseRevision:oldTask.revision}]});const backup=await call(owner,{action:'backup'});verifyBackup(backup);assert.ok(backup.records.length>100);assert.ok(backup.extras.messages.length>=3);
  const extras=A.normalizeExtras(backup.extras,owner.uid),records=S.importRecords(backup.records),digest=x=>crypto.createHash('sha256').update(S.stable(x)).digest('hex'),target={...scope,workspaceId:'restored'},sourceHash=digest(records);
  await call(owner,{...target,action:'importBegin',sourceHash,extrasHash:digest(extras),restoredFrom:scope.workspaceId});
  for(const batch of require('../../src/cloud/batches.cjs').batches(records))await call(owner,{...target,action:'importChunk',sourceHash,records:batch});
  await assert.rejects(call(owner,{...target,action:'importFinalize',sourceHash}),{code:'failed-precondition'});await assert.rejects(call(owner,{...target,...thread,action:'messages'}),{status:403});
  for(const [family,rows] of Object.entries(extras))for(const batch of require('../../src/cloud/batches.cjs').batches(rows))await call(owner,{...target,action:'importExtras',sourceHash,family,rows:batch});
  await call(owner,{...target,action:'importFinalize',sourceHash});const restored=await call(owner,{...target,action:'backup'});verifyBackup(restored);assert.equal(restored.records.length,backup.records.length);assert.equal(restored.extras.messages.length,backup.extras.messages.length);assert.ok(restored.extras.messages.every(m=>m.data.restoredBy===owner.uid));assert.ok(restored.extras.notifications.every(n=>n.data.read));assert.equal(restored.records.find(r=>r.key===oldTask.key).deleted,true);await assert.rejects(call(owner,{...target,...thread,action:'messages'}),{status:403});const deleted=restored.records.find(r=>r.key===oldTask.key);await call(owner,{...target,action:'commit',restore:true,mutationId:crypto.randomUUID(),changes:[{key:deleted.key,before:null,after:{...deleted,deleted:false},baseRevision:deleted.revision}]});assert.equal((await call(owner,{...target,...thread,action:'messages'})).messages[0].id,messageId);
  await assert.rejects(call(guest,{...target,...thread,action:'messages'}),{status:403});assert.equal((await call(owner,{action:'backup'})).checksum,backup.checksum);
 });
 await t.test('platform operations and configuration remain separate from customer content',async()=>{
  await env.withSecurityRulesDisabled(c=>c.firestore().doc('platformRoles/'+operator.uid).set({role:'operations'}));const metrics=await call(operator,{action:'platformOperations'});assert.ok(metrics.workerTelemetry.requests>0);await assert.rejects(call(operator,{action:'pull'}),{status:403});await assert.rejects(call(owner,{action:'platformOperations'}),{status:403});await assert.rejects(call(operator,{action:'platformConfigure',release:'0.8.4',flags:{collaboration:true}}),{status:403});
  await env.withSecurityRulesDisabled(c=>c.firestore().doc('platformRoles/'+operator.uid).set({role:'release'}));assert.equal((await call(operator,{action:'platformConfigure',release:'0.8.4',flags:{collaboration:true}})).localOnly,true);assert.equal((await call(operator,{action:'platformOperations'})).configuration.flags.collaboration,true);
  await call(operator,{action:'bootstrap'});await env.withSecurityRulesDisabled(c=>c.firestore().doc('platformRoles/'+operator.uid).set({role:'owner'}));await call(operator,{action:'platformRole',uid:owner.uid,role:'owner'});await call(operator,{action:'platformRole',uid:operator.uid,role:'support'});await assert.rejects(call(operator,{action:'platformRole',uid:operator.uid,role:'owner'}),{status:403});await call(owner,{action:'platformRole',uid:operator.uid,role:'none'});await assert.rejects(call(operator,{action:'platformOperations'}),{status:403});

 });
});
