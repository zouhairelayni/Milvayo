// /tests/cloud/heads-rules.emulator.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const H=require('../helpers/cloud-emulators.cjs');
const enabled=process.env.MILVAYO_EMULATORS==='1';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
test('the global workspace change signal is readable only with unrestricted workspace-wide read access',{skip:!enabled?'Not run: use npm run test:cloud against Firebase emulators':false,timeout:240000},async t=>{
 const {assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
 const env=await H.environment();t.after(()=>env.cleanup());
 const alice=await H.account('alice'),bob=await H.account('bob'),dave=await H.account('dave'),carol=await H.account('carol');
 const fixture=await H.publish(alice),scope={orgId:fixture.orgId,workspaceId:fixture.workspaceId},headsPath=`heads/${scope.orgId}/${scope.workspaceId}`;
 const projects=fixture.records.filter(r=>r.kind==='projects'&&!r.deleted).map(r=>r.id);assert.ok(projects.length>=1);
 const call=(user,body)=>H.request(user,{...scope,...body}),read=uid=>H.database(env.authenticatedContext(uid)).ref(headsPath).get();
 const invite=async(user,grant)=>{const i=await call(alice,{action:'invite',uid:user.uid,grant});await call(user,{action:'accept',token:i.token});};
 const setGrant=async grant=>{await call(alice,{action:'grant',uid:bob.uid,grant});await call(bob,{action:'presenceAuthorize'});};
 const commit=async title=>{const current=(await call(alice,{action:'pull'})).records.find(r=>r.kind==='tasks');await call(alice,{action:'commit',mutationId:crypto.randomUUID(),changes:[{key:current.key,before:current,after:{...current,data:{...current.data,title}},baseRevision:current.revision}]});};
 const waitForHead=async()=>{for(let i=0;i<50;i++){let v;await env.withSecurityRulesDisabled(async c=>{v=(await H.database(c).ref(headsPath).get()).val();});if(v?.sequence)return v;await sleep(100);}throw Error('The server never wrote the change signal');};
 await invite(bob,{workspaceRole:'viewer',projects:{}});await invite(dave,{workspaceRole:'viewer',projects:{}});await commit('Signal one');const head=await waitForHead();assert.ok(head.sequence>=2);
 await t.test('unrestricted workspace access: global signal allowed',async()=>{await setGrant({workspaceRole:'viewer',projects:{}});await assertSucceeds(read(bob.uid));});
 await t.test('guest-style scoped grant with extra project rights is not denied merely for being scoped',async()=>{await setGrant({workspaceRole:'commenter',projects:Object.fromEntries(projects.map(p=>[p,'viewer']))});await assertSucceeds(read(bob.uid));});
 await t.test('workspace access with an explicit confidential-project denial: global signal denied',async()=>{await setGrant({workspaceRole:'viewer',projects:{[projects[0]]:'none'}});await assertFails(read(bob.uid));});
 await t.test('project-only access: global signal denied',async()=>{await setGrant({workspaceRole:'none',projects:{[projects[0]]:'viewer'}});await assertFails(read(bob.uid));});
 await t.test('all projects denied under a workspace role: global signal denied',async()=>{await setGrant({workspaceRole:'viewer',projects:Object.fromEntries(projects.map(p=>[p,'none']))});await assertFails(read(bob.uid));});
 await t.test('no access at all: global signal denied',async()=>{await setGrant({workspaceRole:'none',projects:{}});await assertFails(read(bob.uid));});
 await t.test('cross-organization and cross-workspace access is denied',async()=>{
  await setGrant({workspaceRole:'viewer',projects:{}});await assertSucceeds(read(bob.uid));
  await H.publish(carol);await assertFails(read(carol.uid),'a user of another organization');
  await H.publish(alice,undefined,'other-workspace');await assertFails(H.database(env.authenticatedContext(bob.uid)).ref(`heads/${scope.orgId}/other-workspace`).get());
  await assertFails(H.database(env.unauthenticatedContext()).ref(headsPath).get());
 });
 await t.test('legacy, expired and hand-written ACL entries fail closed; a valid entry works',async()=>{
  const acl=uid=>`acl/${scope.orgId}/${scope.workspaceId}/${uid}`;
  await env.withSecurityRulesDisabled(async c=>{const db=H.database(c);
   await db.ref(acl('legacy-uid')).set({version:1,workspace:true,projects:{},expiresAt:Date.now()+600000});
   await db.ref(acl('expired-uid')).set({version:1,workspace:true,projects:{},unrestricted:true,expiresAt:Date.now()-1000});
   await db.ref(acl('restricted-uid')).set({version:1,workspace:true,projects:{x:false},unrestricted:false,expiresAt:Date.now()+600000});
   await db.ref(acl('valid-uid')).set({version:1,workspace:true,projects:{},unrestricted:true,expiresAt:Date.now()+600000});});
  await assertFails(read('legacy-uid'));await assertFails(read('expired-uid'));await assertFails(read('restricted-uid'));await assertSucceeds(read('valid-uid'));
  await assertFails(H.database(env.authenticatedContext('valid-uid')).ref(headsPath).set({sequence:999}),'clients can never write the signal');
 });
 await t.test('a denied listener is cancelled with a permission error, the condition that switches the client to adaptive polling',async()=>{
  await setGrant({workspaceRole:'viewer',projects:{[projects[0]]:'none'}});
  const ref=H.database(env.authenticatedContext(bob.uid)).ref(headsPath);let values=0;const cancelled=await new Promise(resolve=>{const timer=setTimeout(()=>resolve(false),5000);ref.on('value',()=>{values++;},()=>{clearTimeout(timer);resolve(true);});});ref.off();
  assert.equal(cancelled,true);assert.equal(values,0);
 });
 await t.test('revoked access: global signal denied immediately',async()=>{await setGrant({workspaceRole:'viewer',projects:{}});await assertSucceeds(read(bob.uid));await call(alice,{action:'revoke',uid:bob.uid});await assertFails(read(bob.uid));});
 await t.test('diagnostic: does an already-attached listener keep receiving after revocation? (recorded, not asserted)',async()=>{
  await call(dave,{action:'presenceAuthorize'});const ref=H.database(env.authenticatedContext(dave.uid)).ref(headsPath);const seen=[];let cancelled=false;
  ref.on('value',s=>seen.push(s.val()?.sequence??null),()=>{cancelled=true;});await sleep(1500);const before=seen.length;
  await call(alice,{action:'revoke',uid:dave.uid});await commit('Signal after revocation');await waitForHead();await sleep(3000);ref.off();
  t.diagnostic(`attached listener after revocation: new events=${seen.length-before}, cancelled=${cancelled}. A new read is denied: ${await read(dave.uid).then(()=>'NO (allowed)',()=>'yes')}`);
 });
});
