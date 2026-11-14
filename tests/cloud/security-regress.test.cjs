// /tests/cloud/security-regress.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {database,workspace}=require('../helpers/cloud-fake.cjs'),{publicError}=require('../../src/cloud/server/publicError.cjs'),S=require('../../src/cloud/schema.cjs');
test('S1: a revoked administrator does not regain the organization role when re-invited',async()=>{
 const x=database(workspace());x.rows.set('orgs/org/members/bob',{active:true,role:'admin',displayName:'Bob'});
 await x.run('alice',{action:'revoke',uid:'bob'});assert.equal(x.rows.get('orgs/org/members/bob').role,'member','revocation drops the role');assert.equal(x.rows.get('orgs/org/members/bob').active,false);
 const inv=await x.run('alice',{action:'invite',uid:'bob',grant:{workspaceRole:'viewer',projects:{}}});await x.run('bob',{action:'accept',token:inv.token});
 const bob=x.rows.get('orgs/org/members/bob');assert.equal(bob.active,true);assert.equal(bob.role,'member');assert.equal(bob.displayName,'Bob','profile data survives');
 await assert.rejects(x.run('bob',{action:'grant',uid:'bob',grant:{workspaceRole:'manager',projects:{}}}),/administrator/,'the former admin cannot self-escalate');
 x.rows.set('orgs/org/members/carol',{active:true,role:'admin'});x.rows.set(x.root+'/grants/carol',{workspaceRole:'viewer',projects:{},version:1});
 const again=await x.run('alice',{action:'invite',uid:'carol',grant:{workspaceRole:'commenter',projects:{}}});await x.run('carol',{action:'accept',token:again.token});assert.equal(x.rows.get('orgs/org/members/carol').role,'admin','an active member keeps their role');
 x.rows.set('orgs/org/members/guest1',{active:true,role:'guest'});await x.run('alice',{action:'revoke',uid:'guest1'});assert.equal(x.rows.get('orgs/org/members/guest1').role,'guest');
});
test('F1: an operation ID is bound to the actor and the exact edit',async()=>{
 const x=database(workspace()),t=x.task('task-2');x.grant('bob',{workspaceRole:'manager',projects:{}});
 const a=await x.patch('alice','task-2',{title:'First title'},{opId:'same-op'});assert.equal(a.ok,true);const writes=x.writes.length;
 const same=await x.patch('alice','task-2',{title:'First title'},{opId:'same-op',baseRevision:t.revision});assert.equal(same.duplicate,true,'a genuine retry still succeeds');
 await assert.rejects(x.patch('alice','task-2',{title:'Second title'},{opId:'same-op',baseRevision:t.revision}),/reused with different content/);
 await assert.rejects(x.patch('bob','task-2',{title:'First title'},{opId:'same-op',baseRevision:t.revision}),/reused with different content/,'another actor cannot claim the operation');
 assert.equal(x.writes.length,writes);assert.equal(x.task('task-2').data.title,'First title');assert.ok(x.task('task-2').lastOpHash);
});
test('F2: the write freeze also stops chat messages, while security repairs stay possible',async()=>{
 const x=database(workspace()),project=x.task('task-0').projectId;
 assert.equal((await x.run('alice',{action:'message',projectId:project,mutationId:'m-open',body:'Before the freeze'})).duplicate,false);
 await x.control('alice',{writeFreeze:true});const messages=()=>[...x.rows.keys()].filter(k=>k.includes('/messages/')).length,before=messages();
 await assert.rejects(x.run('alice',{action:'message',projectId:project,mutationId:'m-frozen',body:'During the freeze'}),/paused/);assert.equal(messages(),before);
 x.grant('bob',{workspaceRole:'viewer',projects:{}});await x.run('alice',{action:'revoke',uid:'bob'});assert.equal(x.rows.get('orgs/org/members/bob').active,false,'revocation works during a freeze');
 await x.control('alice',{writeFreeze:false});assert.equal((await x.run('alice',{action:'message',projectId:project,mutationId:'m-after',body:'After'})).duplicate,false);
});
test('S2: only a platform owner can assign or change owner roles',async()=>{
 const x=database(workspace());for(const u of ['sec','own1','own2','newbie','victim'])x.rows.set('users/'+u,{});
 x.rows.set('platformRoles/sec',{role:'security'});x.rows.set('platformRoles/own1',{role:'owner'});x.rows.set('platformRoles/own2',{role:'owner'});x.rows.set('platformRoles/victim',{role:'owner'});
 await assert.rejects(x.run('sec',{action:'platformRole',uid:'newbie',role:'owner'}),/Only a platform owner/);await assert.rejects(x.run('sec',{action:'platformRole',uid:'victim',role:'none'}),/Only a platform owner/);
 assert.equal(x.rows.get('platformRoles/victim').role,'owner');
 assert.equal((await x.run('sec',{action:'platformRole',uid:'newbie',role:'operations'})).role,'operations','security may still assign non-owner roles');
 assert.equal((await x.run('own1',{action:'platformRole',uid:'newbie',role:'owner'})).role,'owner','owners may assign owners');
});
test('S3: unexpected errors never reach the caller; validation errors keep their message',async()=>{
 const t=publicError(new TypeError("Cannot read properties of undefined (reading 'projectId')"));assert.equal(t.status,500);assert.equal(t.body.code,'internal');assert.doesNotMatch(JSON.stringify(t.body),/projectId|undefined/);
 assert.equal(publicError(Object.assign(Error('ABORTED: too much contention on these documents'),{code:10})).status,500);
 assert.equal(publicError(Object.assign(Error('Firebase ID token has expired. Get a fresh token'),{code:'auth/id-token-expired'})).body.error,'Authentication failed');
 assert.equal(publicError(Object.assign(Error('Unknown driver failure'),{code:'internal-driver'})).status,500);
 assert.deepEqual(publicError(Object.assign(Error('Action is outside the scoped grant'),{code:'permission-denied'})),{status:403,body:{error:'Action is outside the scoped grant',code:'permission-denied'}});
 assert.deepEqual(publicError(Error('Workflow blocks In progress to Done')),{status:400,body:{error:'Workflow blocks In progress to Done',code:'invalid-argument'}});
 assert.equal(publicError('string').status,500);assert.equal(publicError(undefined).status,500);
 const x=database(workspace());await assert.rejects(x.run('alice',{action:'history',key:S.keyOf('tasks','p1','missing')}),e=>e.code==='failed-precondition'&&/Record is unavailable/.test(e.message)&&!(e instanceof TypeError));
});
test('S9: invitations need an active workspace and are capped at 100 pending',async()=>{
 const x=database(workspace());
 await assert.rejects(x.run('alice',{action:'invite',uid:'ghost',workspaceId:'missing',grant:{workspaceRole:'viewer',projects:{}}}),/unavailable/i);
 for(let i=0;i<100;i++)await x.run('alice',{action:'invite',uid:'u'+i,grant:{workspaceRole:'viewer',projects:{}}});
 await assert.rejects(x.run('alice',{action:'invite',uid:'overflow',grant:{workspaceRole:'viewer',projects:{}}}),/Too many pending invitations/);
 for(const [k,v] of x.rows)if(k.startsWith('orgs/org/invitations/')){x.rows.set(k,{...v,expires:Date.now()-1});}
 assert.ok((await x.run('alice',{action:'invite',uid:'after-expiry',grant:{workspaceRole:'viewer',projects:{}}})).token,'expired invitations no longer count');
});
test('ACL writes survive two transient RTDB failures and surface the third',async()=>{
 const x=database(workspace());x.grant('bob',{workspaceRole:'viewer',projects:{}});await x.run('bob',{action:'presenceAuthorize'});assert.equal(x.rtdb.nodes.get('acl/org/main/bob').unrestricted,true);
 x.rtdb.failNext(2);await x.run('alice',{action:'revoke',uid:'bob'});const acl=x.rtdb.nodes.get('acl/org/main/bob');assert.equal(acl.workspace,false);assert.equal(acl.unrestricted,false,'two transient failures are retried');
 const y=database(workspace());y.grant('bob',{workspaceRole:'viewer',projects:{}});await y.run('bob',{action:'presenceAuthorize'});y.rtdb.failNext(3);
 await assert.rejects(y.run('alice',{action:'revoke',uid:'bob'}),/RTDB unavailable/,'a persistent failure is still reported to the administrator');
});

test('viewer pulls keep administrator read counts hidden on cache hits and role changes',async()=>{
 const x=database(workspace());x.grant('bob',{workspaceRole:'viewer',projects:{}});
 const first=await x.run('bob',{action:'pull'}),cached=await x.run('bob',{action:'pull'});
 assert.equal(first.measured.documentReads,null);assert.equal(cached.measured.recordCacheHit,true);assert.equal(cached.measured.documentReads,null);
 const owner=await x.run('alice',{action:'pull'}),ownerCached=await x.run('alice',{action:'pull'});
 assert.ok(Number.isFinite(owner.measured.documentReads));assert.equal(ownerCached.measured.documentReads,3);
 x.rows.set('orgs/org/members/bob',{active:true,role:'admin'});
 assert.ok(Number.isFinite((await x.run('bob',{action:'pull'})).measured.documentReads));
 x.rows.set('orgs/org/members/bob',{active:true,role:'member'});
 assert.equal((await x.run('bob',{action:'pull'})).measured.documentReads,null);
});
