// /tests/cloud/presence-rules.emulator.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const H=require('../helpers/cloud-emulators.cjs'),P=require('../../src/cloud/presenceCore.cjs');
const enabled=process.env.MILVAYO_EMULATORS==='1';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// Presence now lives at presence/{org}/{workspace}/{project}/{resourceKey}/{uid}/{session}. These cases check the database rules against the real emulator.
test('presence rules: per-resource path, access checks, entry lifetime and per-person child events',{skip:!enabled?'Not run: use npm run test:cloud against Firebase emulators':false,timeout:240000},async t=>{
 const {assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
 const env=await H.environment();t.after(()=>env.cleanup());
 const alice=await H.account('alice'),bob=await H.account('bob'),carol=await H.account('carol'),dave=await H.account('dave');
 const fixture=await H.publish(alice),scope={orgId:fixture.orgId,workspaceId:fixture.workspaceId};
 const project=fixture.records.find(r=>r.kind==='projects'&&!r.deleted).id,otherProject='other-project-'+crypto.randomUUID().slice(0,8);
 const call=(user,body)=>H.request(user,{...scope,...body}),db=user=>H.database(env.authenticatedContext(user.uid));
 const invite=async(user,grant)=>{const i=await call(alice,{action:'invite',uid:user.uid,grant});await call(user,{action:'accept',token:i.token});await call(user,{action:'presenceAuthorize'});};
 const keyA=P.resourceKey('task:A'),keyB=P.resourceKey('task:B'),room=(key,p=project)=>`presence/${scope.orgId}/${scope.workspaceId}/${p}/${key}`;
 const entry=(over={})=>({state:'viewing',resource:'task:A',expiresAt:Date.now()+P.TTL_MS,...over});
 await invite(bob,{workspaceRole:'viewer',projects:{}});await invite(dave,{workspaceRole:'viewer',projects:{}});
 await invite(carol,{workspaceRole:'viewer',projects:{}});await call(alice,{action:'grant',uid:carol.uid,grant:{workspaceRole:'none',projects:{[project]:'viewer'}}});await call(carol,{action:'presenceAuthorize'});

 await t.test('a person with read access can publish their own entry with the normal lifetime, and a longer lifetime than the old 90 seconds',async()=>{
  const path=`${room(keyA)}/${bob.uid}/${crypto.randomUUID()}`;
  await assertSucceeds(db(bob).ref(path).set(entry()));
  await assertSucceeds(db(bob).ref(path).set(entry({state:'editing',expiresAt:Date.now()+200000})),'the heartbeat is slower now, so entries must be allowed to live past 90 seconds');
  await assertSucceeds(db(bob).ref(path).remove());
 });
 await t.test('nobody can write under another person\'s ID',async()=>{
  await assertFails(db(bob).ref(`${room(keyA)}/${alice.uid}/${crypto.randomUUID()}`).set(entry()));
 });
 await t.test('a resource key must be exactly 22 URL-safe characters',async()=>{
  for(const bad of ['task-1','A'.repeat(21),'A'.repeat(23),'AAAAAAAAAAAAAAAAAAAA!!','AAAAAAAAAAAAAAAAAAAA+='])await assertFails(db(bob).ref(`${room(bad)}/${bob.uid}/${crypto.randomUUID()}`).set(entry()),`key ${JSON.stringify(bad)}`);
 });
 await t.test('the old shape (no resource level) and writes above the session level are denied',async()=>{
  await assertFails(db(bob).ref(`presence/${scope.orgId}/${scope.workspaceId}/${project}/${bob.uid}/${crypto.randomUUID()}`).set(entry()),'old path shape');
  await assertFails(db(bob).ref(`${room(keyA)}/${bob.uid}`).set({s1:entry()}),'whole-person write');
  await assertFails(db(bob).ref(room(keyA)).set({[bob.uid]:{s1:entry()}}),'whole-room write');
 });
 await t.test('entry content is validated: lifetime, state, extra fields',async()=>{
  const path=`${room(keyA)}/${bob.uid}/${crypto.randomUUID()}`;
  await assertFails(db(bob).ref(path).set(entry({expiresAt:Date.now()+400000})),'longer than 330 s');
  await assertFails(db(bob).ref(path).set(entry({expiresAt:Date.now()-1000})),'already expired');
  await assertFails(db(bob).ref(path).set(entry({state:'admin'})),'unknown state');
  await assertFails(db(bob).ref(path).set({...entry(),secret:'x'}),'extra field');
  await assertFails(db(bob).ref(path).set(entry({resource:'x'.repeat(161)})),'resource label too long');
 });
 await t.test('access is checked per project: a project-only grant cannot use or read another project',async()=>{
  const carolPath=`${room(keyA)}/${carol.uid}/${crypto.randomUUID()}`;
  await assertSucceeds(db(carol).ref(carolPath).set(entry()));
  await assertFails(db(carol).ref(`${room(keyA,otherProject)}/${carol.uid}/${crypto.randomUUID()}`).set(entry()));
  await assertFails(db(carol).ref(room(keyA,otherProject)).get());
  await assertSucceeds(db(carol).ref(room(keyA)).get());
  await assertSucceeds(db(carol).ref(carolPath).remove());
 });
 await t.test('outsiders and signed-out users cannot read or write',async()=>{
  const outsider=await H.account('outsider');
  await assertFails(db(outsider).ref(room(keyA)).get());await assertFails(db(outsider).ref(`${room(keyA)}/${outsider.uid}/${crypto.randomUUID()}`).set(entry()));
  await assertFails(H.database(env.unauthenticatedContext()).ref(room(keyA)).get());
 });
 await t.test('child listeners deliver only the person who changed, and only for their own resource',async()=>{
  const dpath=`${room(keyA)}/${dave.uid}/d1`,cpath=`${room(keyA)}/${carol.uid}/c1`;
  await assertSucceeds(db(dave).ref(dpath).set(entry()));await assertSucceeds(db(carol).ref(cpath).set(entry()));
  const ref=db(bob).ref(room(keyA)),events=[];
  ref.on('child_added',s=>events.push({type:'added',uid:s.key,value:s.val()}));ref.on('child_changed',s=>events.push({type:'changed',uid:s.key,value:s.val()}));ref.on('child_removed',s=>events.push({type:'removed',uid:s.key}));
  await sleep(1500);
  assert.deepEqual(events.map(e=>e.type+':'+e.uid).sort(),[`added:${carol.uid}`,`added:${dave.uid}`].sort(),'the existing room arrives once, one event per person');
  events.length=0;
  await assertSucceeds(db(carol).ref(cpath).set(entry({state:'typing'})));await sleep(800);
  assert.equal(events.length,1);assert.equal(events[0].type,'changed');assert.equal(events[0].uid,carol.uid);assert.deepEqual(Object.keys(events[0].value),['c1'],'only Carol\'s sessions are in the event; Dave\'s data is not repeated');
  events.length=0;
  await assertSucceeds(db(dave).ref(`${room(keyB)}/${dave.uid}/d2`).set(entry({resource:'task:B'})));await sleep(800);
  assert.equal(events.length,0,'another resource in the same project never reaches this listener');
  await assertSucceeds(db(carol).ref(cpath).remove());await sleep(800);
  assert.deepEqual(events.map(e=>e.type+':'+e.uid),[`removed:${carol.uid}`]);
  ref.off();
 });
 await t.test('revoked access: reading and publishing are denied',async()=>{
  await call(alice,{action:'revoke',uid:bob.uid});
  await assertFails(db(bob).ref(room(keyA)).get());await assertFails(db(bob).ref(`${room(keyA)}/${bob.uid}/${crypto.randomUUID()}`).set(entry()));
 });
});
