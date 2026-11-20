// /tests/cloud/heads-project-rules.emulator.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const H=require('../helpers/cloud-emulators.cjs');
const enabled=process.env.MILVAYO_EMULATORS==='1';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// The per-project change signal heads/{org}/{workspace}/{project} follows the same read rule as project presence. Only the server writes it.
test('per-project change signal rules: read follows project access, nobody but the server can write',{skip:!enabled?'Not run: use npm run test:cloud against Firebase emulators':false,timeout:240000},async t=>{
 const {assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
 const env=await H.environment();t.after(()=>env.cleanup());
 const alice=await H.account('alice'),bob=await H.account('bob'),carol=await H.account('carol');
 const fixture=await H.publish(alice),scope={orgId:fixture.orgId,workspaceId:fixture.workspaceId};
 const projects=fixture.records.filter(r=>r.kind==='projects'&&!r.deleted).map(r=>r.id),[project]=projects,otherProject='other-project-'+crypto.randomUUID().slice(0,8);
 const base=`heads/${scope.orgId}/${scope.workspaceId}`,path=p=>`${base}/${p}`;
 const call=(user,body)=>H.request(user,{...scope,...body}),db=user=>H.database(env.authenticatedContext(user.uid)),read=(user,p=project)=>db(user).ref(path(p)).get();
 const invite=async(user,grant)=>{const i=await call(alice,{action:'invite',uid:user.uid,grant});await call(user,{action:'accept',token:i.token});await call(user,{action:'presenceAuthorize'});};
 const setGrant=async(user,grant)=>{await call(alice,{action:'grant',uid:user.uid,grant});await call(user,{action:'presenceAuthorize'});};
 await env.withSecurityRulesDisabled(async c=>{const d=H.database(c);await d.ref(path(project)).set({at:Date.now(),n:1});await d.ref(path(otherProject)).set({at:Date.now(),n:2});});
 await invite(bob,{workspaceRole:'viewer',projects:{}});await invite(carol,{workspaceRole:'viewer',projects:{}});
 await t.test('workspace-wide access can read the signal of any project it can read',async()=>{await assertSucceeds(read(bob));});
 await t.test('project-only access reads its own project and nothing else',async()=>{
  await setGrant(carol,{workspaceRole:'none',projects:{[project]:'viewer'}});
  await assertSucceeds(read(carol));await assertFails(read(carol,otherProject),'a project she has no grant for');await assertFails(db(carol).ref(base).get(),'the workspace level');
 });
 await t.test('an explicit denial of the project blocks the signal even with a workspace role',async()=>{
  await setGrant(bob,{workspaceRole:'viewer',projects:{[project]:'none'}});await assertFails(read(bob));
 });
 await t.test('a workspace role does not reveal a project that is denied to this person',async()=>{
  await setGrant(bob,{workspaceRole:'viewer',projects:{[otherProject]:'none'}});await assertFails(read(bob,otherProject));
 });
 await t.test('no access, revoked access, outsiders, other workspaces and signed-out users are refused',async()=>{
  const outsider=await H.account('outsider');await assertFails(read(outsider));await assertFails(H.database(env.unauthenticatedContext()).ref(path(project)).get());
  await assertFails(db(bob).ref(`heads/${scope.orgId}/other-workspace/${project}`).get());
  await call(alice,{action:'revoke',uid:carol.uid});await assertFails(read(carol));
 });
 await t.test('clients can never write the signal, at any level',async()=>{
  await assertFails(db(alice).ref(path(project)).set({at:Date.now(),n:3}));await assertFails(db(alice).ref(`${path(project)}/n`).set(3));await assertFails(db(alice).ref(base).set({[project]:{at:1,n:1}}));
  await assertFails(db(alice).ref(path('new-project')).set({at:Date.now(),n:4}));
 });
 await t.test('listeners get the server\'s update, and only for their project',async()=>{
  await setGrant(bob,{workspaceRole:'viewer',projects:{}});
  const events=[],ref=db(bob).ref(path(project));ref.on('value',s=>events.push(s.val()));await sleep(1000);events.length=0;
  await env.withSecurityRulesDisabled(async c=>{await H.database(c).ref(path(otherProject)).set({at:Date.now(),n:5});});await sleep(600);assert.equal(events.length,0,'another project never wakes this listener');
  await env.withSecurityRulesDisabled(async c=>{await H.database(c).ref(path(project)).set({at:Date.now(),n:6});});await sleep(800);assert.equal(events.length,1);assert.equal(events[0].n,6);
  ref.off();
 });
});
