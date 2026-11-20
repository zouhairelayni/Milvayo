// /tests/cloud/feed.emulator.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const H=require('../helpers/cloud-emulators.cjs');
const enabled=process.env.MILVAYO_EMULATORS==='1';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// Gate 3a against the real Functions, Firestore and Realtime Database emulators: the change feed (`pullV4`) and the per-project signal the server writes after each accepted edit.
test('v4 change feed: full sync, incremental sync, tombstones, ties, access reset and the per-project signal in the emulators',{skip:!enabled?'Not run: use npm run test:cloud against Firebase emulators':false,timeout:240000},async t=>{
 const env=await H.environment();t.after(()=>env.cleanup());
 const alice=await H.account('alice'),bob=await H.account('bob'),fixture=await H.publish(alice),scope={orgId:fixture.orgId,workspaceId:fixture.workspaceId};
 const call=(user,body)=>H.request(user,{...scope,...body}),rejects=(promise,pattern)=>assert.rejects(promise,e=>pattern.test(String(e.message)));
 const project=fixture.records.find(r=>r.kind==='projects'&&!r.deleted).id,headPath=`heads/${scope.orgId}/${scope.workspaceId}/${project}`;
 const headNow=async()=>{let v;await env.withSecurityRulesDisabled(async c=>{v=(await H.database(c).ref(headPath).get()).val();});return v;};
 const waitHead=async(previous)=>{for(let i=0;i<50;i++){const v=await headNow();if(v&&(!previous||v.n!==previous.n))return v;await sleep(100);}throw Error('the signal never moved');};
 const pullAll=async(extra={})=>{const out=[];let page,round,last;do{last=await call(alice,{action:'pullV4',projectId:project,limit:7,page,roundStartedAt:round,...extra});out.push(...last.records);page=last.page??undefined;round=last.roundStartedAt;}while(last.more);return {records:out,last};};
 await rejects(call(alice,{action:'pullV4',projectId:project}),/does not use the v4 change feed/);
 await call(alice,{action:'workspaceControl',protocol:4});
 await t.test('full sync pages through the project by key and returns a cursor; tombstones and internal fields are absent',async()=>{
  const {records,last}=await pullAll();const expected=fixture.records.filter(r=>r.projectId===project&&!r.deleted).length;
  assert.equal(records.length,expected);assert.equal(new Set(records.map(r=>r.key)).size,records.length);
  assert.equal(typeof last.cursor,'number');assert.equal(typeof last.accessVersion,'string');
  for(const r of records)for(const secret of ['lastOpId','lastOpHash','sequence','schema'])assert.equal(secret in r,false);
  assert.deepEqual(records.map(r=>r.key),[...records.map(r=>r.key)].sort(),'ordered by document key');
 });
 const start=await pullAll();let cursor=start.last.cursor,access=start.last.accessVersion;
 const task=start.records.find(r=>r.kind==='tasks'),other=start.records.filter(r=>r.kind==='tasks')[1];
 await t.test('an edit moves the project signal exactly once and shows up in the next incremental pull; an idle pull is empty',async()=>{
  const idle=await call(alice,{action:'pullV4',projectId:project,cursor,accessVersion:access});assert.deepEqual(idle.records.filter(r=>r.key===task.key),[],'nothing new yet (records inside the 30 s overlap may repeat, never new ones)');
  const before=await headNow();
  const edit=await call(alice,{action:'patch',projectId:project,taskId:task.id,opId:crypto.randomUUID(),baseRevision:task.revision,set:{title:'Feed edit'}});assert.equal(edit.ok,true);
  const head=await waitHead(before);assert.equal(typeof head.at,'number');assert.equal(typeof head.n,'number');
  const inc=await call(alice,{action:'pullV4',projectId:project,cursor,accessVersion:access,limit:100});
  const got=inc.records.find(r=>r.key===task.key);assert.equal(got.revision,edit.revision);assert.equal(got.data.title,'Feed edit');assert.equal(inc.full,false);
  assert.ok(inc.measured.documentReads<=inc.records.length+4,'reads follow the changes, not the project size');
 });
 await t.test('a conflict and a replayed operation do not change the content; a conflict leaves the signal alone',async()=>{
  const before=await headNow(),stale=await call(alice,{action:'patch',projectId:project,taskId:task.id,opId:crypto.randomUUID(),baseRevision:task.revision,set:{title:'Stale'}});
  assert.equal(stale.ok,false);await sleep(600);assert.deepEqual(await headNow(),before);
 });
 await t.test('a delete is a tombstone: the incremental feed returns it, a fresh full sync does not',async()=>{
  const current=(await pullAll()).records.find(r=>r.key===other.key);
  const del=await call(alice,{action:'deleteTask',projectId:project,taskId:other.id,opId:crypto.randomUUID(),baseRevision:current.revision});assert.equal(del.ok,true);
  const inc=await call(alice,{action:'pullV4',projectId:project,cursor,accessVersion:access,limit:100});
  const tomb=inc.records.find(r=>r.key===other.key);assert.equal(tomb.deleted,true);assert.equal(typeof tomb.deletedAt,'number');
  assert.equal((await pullAll()).records.some(r=>r.key===other.key),false);
 });
 await t.test('S1 real Firestore ordering: one cascade stamps equal updatedAt values and a tiny page size still delivers every changed record once',async()=>{
  const seen=[];let page,round,r;
  do{r=await call(alice,{action:'pullV4',projectId:project,cursor,accessVersion:access,limit:1,page,roundStartedAt:round});seen.push(...r.records.map(x=>x.key));page=r.page??undefined;round=r.roundStartedAt;}while(r.more);
  assert.equal(new Set(seen).size,seen.length,'no key repeated across one-record pages');assert.ok(seen.includes(task.key)&&seen.includes(other.key));
 });
 await t.test('S4 access: viewers can pull, strangers and revoked users cannot, a changed grant forces a reset',async()=>{
  await rejects(call(bob,{action:'pullV4',projectId:project}),/unavailable/);
  const invite=await call(alice,{action:'invite',uid:bob.uid,grant:{workspaceRole:'viewer',projects:{}}});await call(bob,{action:'accept',token:invite.token});
  const first=await call(bob,{action:'pullV4',projectId:project,limit:500});assert.ok(first.records.length>0);
  await call(alice,{action:'grant',uid:bob.uid,grant:{workspaceRole:'commenter',projects:{}}});
  const reset=await call(bob,{action:'pullV4',projectId:project,cursor:first.cursor,accessVersion:first.accessVersion});assert.equal(reset.reset,'access');assert.deepEqual(reset.records,[]);
  await call(alice,{action:'revoke',uid:bob.uid});await rejects(call(bob,{action:'pullV4',projectId:project}),/unavailable/);
 });
 await t.test('directory: lists the readable projects and workspace-level records, and an old workspace answers with its protocol only',async()=>{
  const dir=await call(alice,{action:'directoryV4'});assert.equal(dir.protocol,4);assert.ok(dir.projects.some(r=>r.projectId===project));assert.equal(typeof dir.accessVersion,'string');
  for(const r of dir.projects)for(const secret of ['lastOpId','lastOpHash','sequence','schema'])assert.equal(secret in r,false);
  await rejects(call(bob,{action:'directoryV4'}),/unavailable/);
 });
 await t.test('S6 an expired cursor asks for a full resync',async()=>{
  const r=await call(alice,{action:'pullV4',projectId:project,cursor:Date.now()-91*86400000});assert.equal(r.reset,'expired');
 });
 await t.test('moveTask stores a fractional position with one revision bump, signals the project and shows up in the feed',async()=>{
  const current=(await pullAll()).records.find(r=>r.key===task.key),before=await headNow(),order=current.order+0.5;
  const r=await call(alice,{action:'moveTask',projectId:project,taskId:task.id,opId:crypto.randomUUID(),baseRevision:current.revision,order});assert.equal(r.ok,true);assert.equal(r.record.order,order);assert.equal(r.record.revision,current.revision+1);
  await waitHead(before);const got=(await pullAll()).records.find(x=>x.key===task.key);assert.equal(got.order,order);assert.deepEqual(got.data,current.data,'the data is untouched');
  const stale=await call(alice,{action:'moveTask',projectId:project,taskId:task.id,opId:crypto.randomUUID(),baseRevision:current.revision,order:order+1});assert.equal(stale.ok,false);assert.equal(stale.code,'conflict');
 });
 await t.test('S7 idle cost: a pull with nothing new reads the three authorization documents plus only the records inside the 30 s overlap',async()=>{
  const fresh=await pullAll(),idle=await call(alice,{action:'pullV4',projectId:project,cursor:Date.now()+1000,accessVersion:fresh.last.accessVersion});
  assert.ok(idle.measured.documentReads<=idle.records.length+3,`idle pull read ${idle.measured.documentReads} documents for ${idle.records.length} records`);
 });
});
