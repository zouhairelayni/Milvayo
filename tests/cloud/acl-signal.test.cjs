// /tests/cloud/acl-signal.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {createService}=require('../../src/cloud/server/service.cjs');
const ACL_TTL_MS=600000;
function fakeRtdb(){const nodes=new Map();let failures=0;return {nodes,failNext(n=1){failures=n;},ref:path=>({transaction:async fn=>{if(failures>0){failures--;throw Error('RTDB unavailable');}const next=fn(nodes.get(path)??null);if(next!==undefined)nodes.set(path,structuredClone(next));return {committed:next!==undefined};}})};}
function setup(){
 const rows=new Map(),root='orgs/org/workspaces/main',rtdb=fakeRtdb();
 rows.set('orgs/org/members/alice',{active:true,role:'owner'});rows.set('orgs/org/members/bob',{active:true,role:'member'});
 rows.set(root,{state:'active',sequence:1});rows.set(root+'/grants/alice',{workspaceRole:'manager',projects:{},version:1});rows.set(root+'/grants/bob',{workspaceRole:'viewer',projects:{},version:1});rows.set('orgs/org/subscription/current',{seats:['alice'],allocations:{}});
 const snap=ref=>({ref,id:ref.path.split('/').at(-1),exists:rows.has(ref.path),data:()=>rows.has(ref.path)?structuredClone(rows.get(ref.path)):undefined});
 const collection=(path,filters=[])=>({path,filters,query:true,doc:(id=crypto.randomUUID())=>doc(path+'/'+id),where:(...f)=>collection(path,[...filters,f]),limit:()=>collection(path,filters),orderBy:()=>collection(path,filters)});
 const doc=path=>({path,collection:name=>collection(path+'/'+name)});
 const db={doc,runTransaction:async fn=>{const pending=[];const tx={get:async ref=>{if(!ref.query)return snap(ref);const docs=[...rows.keys()].filter(k=>k.startsWith(ref.path+'/')&&!k.slice(ref.path.length+1).includes('/')).map(k=>snap(doc(k))).filter(s=>ref.filters.every(([k,op,v])=>op==='array-contains'?(s.data()[k]||[]).includes(v):op==='=='?s.data()[k]===v:s.data()[k]>v));return {docs,size:docs.length};},set:(r,d)=>pending.push([r,d]),update:(r,d)=>pending.push([r,{...rows.get(r.path),...d}]),create:(r,d)=>{assert.ok(!rows.has(r.path));pending.push([r,d]);}};const result=await fn(tx);for(const [r,d] of pending)rows.set(r.path,structuredClone(d));return result;}};
 const service=createService(db,rtdb),scope={orgId:'org',workspaceId:'main'},aclPath='acl/org/main/bob';
 return {rows,rtdb,root,scope,aclPath,run:(uid,body)=>service.execute(uid,{...scope,...body}),setGrant:grant=>rows.set(root+'/grants/bob',{...grant,version:(rows.get(root+'/grants/bob').version||0)+1})};
}
test('the ACL marks a user unrestricted only with workspace-wide read and no project-level denial',async()=>{
 const cases=[
  ['workspace viewer, no project entries',{workspaceRole:'viewer',projects:{}},true],
  ['workspace viewer with an explicit confidential-project denial',{workspaceRole:'viewer',projects:{confidential:'none'}},false],
  ['workspace viewer, one project denied and one elevated',{workspaceRole:'viewer',projects:{confidential:'none',open:'commenter'}},false],
  ['project-only access',{workspaceRole:'none',projects:{a:'viewer'}},false],
  ['all projects denied under a workspace role',{workspaceRole:'viewer',projects:{a:'none',b:'none'}},false],
  ['no access at all',{workspaceRole:'none',projects:{}},false],
  ['guest-style scoped grant with extra project rights stays unrestricted',{workspaceRole:'commenter',projects:{a:'contributor',b:'viewer'}},true],
 ];
 for(const [name,grant,expected] of cases){const x=setup();x.setGrant(grant);await x.run('bob',{action:'presenceAuthorize'});const acl=x.rtdb.nodes.get(x.aclPath);assert.equal(acl.unrestricted,expected,name);assert.equal(acl.workspace,grant.workspaceRole!=='none',name);}
});
test('revocation writes a denying ACL immediately and bumps the access signal',async()=>{
 const x=setup();await x.run('bob',{action:'presenceAuthorize'});assert.equal(x.rtdb.nodes.get(x.aclPath).unrestricted,true);
 await x.run('alice',{action:'revoke',uid:'bob'});
 const acl=x.rtdb.nodes.get(x.aclPath);assert.equal(acl.workspace,false);assert.equal(acl.unrestricted,false);assert.deepEqual(acl.projects,{});
 assert.ok(x.rtdb.nodes.get('heads/org/main').access>0);
 await assert.rejects(x.run('bob',{action:'presenceAuthorize'}),/unavailable/i);
});
test('if the RTDB revocation write fails, data access ends at once and the ACL exposure is bounded by its expiry; retrying repairs it',async()=>{
 const x=setup();const before=Date.now();await x.run('bob',{action:'presenceAuthorize'});
 const granted=x.rtdb.nodes.get(x.aclPath);assert.equal(granted.unrestricted,true);assert.ok(granted.expiresAt-before<=ACL_TTL_MS+1000,'ACL expiry is bounded by the 10-minute TTL');
 x.rtdb.failNext(1);await assert.rejects(x.run('alice',{action:'revoke',uid:'bob'}),/RTDB unavailable/,'the administrator sees the failure');
 // Firestore state is already revoked: every API request re-checks membership and grants.
 assert.equal(x.rows.get('orgs/org/members/bob').active,false);assert.equal(x.rows.get(x.root+'/grants/bob').workspaceRole,'none');
 await assert.rejects(x.run('bob',{action:'pull',cursor:0}),/unavailable/i);await assert.rejects(x.run('bob',{action:'presenceAuthorize'}),/unavailable/i,'a revoked user cannot refresh the ACL');
 // The stale RTDB entry is the only remaining exposure, and it cannot outlive its expiry.
 const stale=x.rtdb.nodes.get(x.aclPath);assert.equal(stale.unrestricted,true);assert.ok(stale.expiresAt<=Date.now()+ACL_TTL_MS+1000);
 await x.run('alice',{action:'revoke',uid:'bob'});const repaired=x.rtdb.nodes.get(x.aclPath);assert.equal(repaired.workspace,false);assert.equal(repaired.unrestricted,false);
});
test('grant failures stay fail-closed: Firestore is denied first, a failed deny phase leaves only the bounded ACL expiry, and a failed final write leaves the ACL denied',async()=>{
 const x=setup();x.rows.set('orgs/org/subscription/current',{seats:['alice','bob'],allocations:{}});await x.run('bob',{action:'presenceAuthorize'});
 x.rtdb.failNext(1);await assert.rejects(x.run('alice',{action:'grant',uid:'bob',grant:{workspaceRole:'none',projects:{}}}),/RTDB unavailable/);
 const pending=x.rows.get(x.root+'/grants/bob');assert.equal(pending.workspaceRole,'none');assert.equal(pending.pending,true,'Firestore is already in the denying phase');
 assert.equal(x.rtdb.nodes.get(x.aclPath).unrestricted,true,'only the stale RTDB entry remains, bounded by its expiry');
 // Retry with a restricted grant; the final ACL write fails after the deny phase, so the ACL must stay denied.
 const original=x.rtdb.ref;let calls=0;x.rtdb.ref=path=>{const r=original(path);return path.startsWith('acl/')?{transaction:async fn=>{calls++;if(calls===2)throw Error('RTDB unavailable');return r.transaction(fn);}}:r;};
 await assert.rejects(x.run('alice',{action:'grant',uid:'bob',grant:{workspaceRole:'viewer',projects:{confidential:'none'}}}),/RTDB unavailable/);
 const acl=x.rtdb.nodes.get(x.aclPath);assert.equal(acl.workspace,false);assert.equal(acl.unrestricted,false);
});
