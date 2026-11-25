// /tests/cloud/storage-rules.emulator.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const H=require('../helpers/cloud-emulators.cjs');
const enabled=process.env.MILVAYO_EMULATORS==='1';
// 0.8.38 (FIX-10): the Storage rules check that the member and grant records exist before reading them. Access must stay exactly as before.
// Server-tested only when you run npm run test:cloud on the emulators (this sandbox has none).
test('storage rules: members by role, strangers refused, size and type limits',{skip:!enabled?'Not run: use npm run test:cloud against Firebase emulators':false,timeout:240000},async t=>{
 const {assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
 const env=await H.environment();t.after(()=>env.cleanup());
 const alice=await H.account('alice'),bob=await H.account('bob'),eve=await H.account('eve');
 const fixture=await H.publish(alice),scope={orgId:fixture.orgId,workspaceId:fixture.workspaceId};
 const project=fixture.records.find(r=>r.kind==='projects'&&!r.deleted).id;
 const call=(user,body)=>H.request(user,{...scope,...body});
 const i=await call(alice,{action:'invite',uid:bob.uid,grant:{workspaceRole:'viewer',projects:{}}});await call(bob,{action:'accept',token:i.token});
 // Works with either shape of the storage handle that the test library may return.
 const handle=user=>env.authenticatedContext(user.uid).storage();
 const modular=()=>{try{return require('firebase/storage');}catch{return null;}};
 const put=(user,path,size=10,contentType='image/png')=>{const st=handle(user),bytes=new Uint8Array(size);if(typeof st.ref==='function')return st.ref(path).put(bytes,{contentType});const m=modular();return m.uploadBytes(m.ref(st,path),bytes,{contentType});};
 const meta=(user,path)=>{const st=handle(user);if(typeof st.ref==='function')return st.ref(path).getMetadata();const m=modular();return m.getMetadata(m.ref(st,path));};
 const file=(uid,name='a.png')=>`attachments/${scope.orgId}/${scope.workspaceId}/${project}/${uid}/${name}`;
 await t.test('an active manager can upload a small allowed file to their own folder and read it back',async()=>{
  await assertSucceeds(put(alice,file(alice.uid)));await assertSucceeds(meta(alice,file(alice.uid)));
 });
 await t.test('a viewer can read but not upload',async()=>{
  await assertSucceeds(meta(bob,file(alice.uid)));await assertFails(put(bob,file(bob.uid,'b.png')));
 });
 await t.test('nobody can write into another person\'s folder',async()=>{
  await assertFails(put(alice,file(bob.uid,'c.png')));
 });
 await t.test('a person with no member record is refused (this is the case that used to warn about a null value)',async()=>{
  await assertFails(meta(eve,file(alice.uid)));await assertFails(put(eve,file(eve.uid,'e.png')));
 });
 await t.test('too big or the wrong type is refused',async()=>{
  await assertFails(put(alice,file(alice.uid,'big.png'),5*1024*1024+1));await assertFails(put(alice,file(alice.uid,'x.exe'),10,'application/x-msdownload'));
 });
});
