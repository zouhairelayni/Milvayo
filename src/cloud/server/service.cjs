// /src/cloud/server/service.cjs
'use strict';
const crypto=require('node:crypto');
const S=require('../schema.cjs'),IAM=require('../iam.cjs');
const summaries=require('../summary.cjs');
const fail=(message,code='permission-denied')=>{throw Object.assign(Error(message),{code});};
const digest=x=>crypto.createHash('sha256').update(S.stable(x)).digest('hex');
function createService(db,rtdb,getTelemetry=()=>({})){
 const readCache=new Map();
 const orgRef=o=>db.doc('orgs/'+S.segment(o));
 const wsRef=(o,w)=>orgRef(o).collection('workspaces').doc(S.segment(w));
 async function access(tx,uid,o,w){const org=orgRef(o),ws=wsRef(o,w);const [m,g,meta]=await Promise.all([tx.get(org.collection('members').doc(uid)),tx.get(ws.collection('grants').doc(uid)),tx.get(ws)]);return {member:m.data(),grant:g.data(),meta:meta.data(),ws,org};}
 const requireRead=(a,p)=>{if(!IAM.can(a.member,a.grant,p,'read')||a.meta?.state!=='active')fail('Workspace access is unavailable');};
 async function bootstrap(uid,b){
  const o='personal-'+uid,w=S.segment(b.workspaceId||'main'),org=orgRef(o),ws=wsRef(o,w);
  await db.runTransaction(async tx=>{const [existing,user]=await Promise.all([tx.get(org),tx.get(db.doc('users/'+uid))]);if(!existing.exists){tx.create(org,{name:'Personal workspace',owner:uid,createdAt:Date.now()});tx.create(org.collection('members').doc(uid),{active:true,role:'owner'});tx.create(org.collection('subscription').doc('current'),{capacity:5,seats:[uid],status:'simulated',plan:'local'});}else if(existing.data().owner!==uid)fail('Organization ownership mismatch');tx.set(db.doc('users/'+uid),{organizations:[...new Set([...(user.data()?.organizations||[]),o])]});});
  return {orgId:o,workspaceId:w};
 }
 async function organizationCreate(uid,b){
  S.segment(b.mutationId);if(typeof b.name!=='string'||!b.name.trim()||b.name.length>120)fail('Organization name required','invalid-argument');const id='org-'+digest(uid+'|'+b.mutationId).slice(0,32),org=orgRef(id);
  await db.runTransaction(async tx=>{const [old,user]=await Promise.all([tx.get(org),tx.get(db.doc('users/'+uid))]);if(old.exists){if(old.data().owner!==uid||old.data().name!==b.name.trim())fail('Organization creation ID reused','already-exists');return;}tx.create(org,{name:b.name.trim(),owner:uid,createdAt:Date.now()});tx.create(org.collection('members').doc(uid),{active:true,role:'owner'});tx.create(org.collection('subscription').doc('current'),{capacity:5,seats:[uid],status:'simulated',plan:'local'});tx.set(user.ref,{organizations:[...new Set([...(user.data()?.organizations||[]),id])]});});return {orgId:id};
 }
 async function begin(uid,b){
  const sourceHash=S.segment(b.sourceHash);if(!/^[a-f0-9]{64}$/.test(sourceHash))fail('Invalid import digest','invalid-argument');
  return db.runTransaction(async tx=>{const a=await access(tx,uid,b.orgId,b.workspaceId);if(!IAM.administer(a.member))fail('Organization administrator required');
   const extrasHash=b.extrasHash||'';if(extrasHash&&!/^[a-f0-9]{64}$/.test(extrasHash))fail('Invalid collaboration archive digest','invalid-argument');
   if(a.meta){if(a.meta.sourceHash===sourceHash&&(a.meta.extrasHash||'')===extrasHash)return {state:a.meta.state};fail('Workspace already exists; choose a new cloud workspace','already-exists');}
   const all=await tx.get(a.org.collection('workspaces').limit(21));if(all.size>=20)fail('Local cloud workspace limit is 20','failed-precondition');
   tx.create(a.ws,{state:'importing',schema:S.SCHEMA,sequence:0,sourceHash,extrasHash,importActor:uid,createdAt:Date.now(),restoredFrom:typeof b.restoredFrom==='string'?b.restoredFrom.slice(0,160):''});tx.create(a.ws.collection('grants').doc(uid),{workspaceRole:'manager',projects:{}});return {state:'importing'};
  });
 }
 function checkRecord(r){
  if(!r||!Number.isFinite(r.order)||r.order<0||r.order>100000)fail('Invalid record order','invalid-argument');
  const safe=S.record(r.kind,r.projectId,r.id,r.data,r.order,r.boardId);
  if(r.key!==safe.key)fail('Forged record path','invalid-argument');return safe;
 }
 async function importChunk(uid,b){
  if(!Array.isArray(b.records)||!b.records.length||b.records.length>100)fail('Import batch must have 1–100 records','invalid-argument');
  const records=S.importRecords(b.records);
  return db.runTransaction(async tx=>{const a=await access(tx,uid,b.orgId,b.workspaceId);if(!IAM.administer(a.member)||a.meta?.state!=='importing'||a.meta.importActor!==uid||a.meta.sourceHash!==b.sourceHash)fail('Import session is unavailable');for(const r of records)tx.set(a.ws.collection('records').doc(r.key),{...r,schema:S.SCHEMA,revision:1,sequence:1,deleted:r.deleted===true});return {accepted:records.length};});
 }
 async function finalize(uid,b){
  return db.runTransaction(async tx=>{const a=await access(tx,uid,b.orgId,b.workspaceId);if(!IAM.administer(a.member)||a.meta?.sourceHash!==b.sourceHash)fail('Import session is unavailable');if(a.meta.state==='active')return {active:true};
   if(a.meta.importActor!==uid)fail('Import actor mismatch');const snapshot=await tx.get(a.ws.collection('records'));const records=snapshot.docs.map(d=>d.data());S.validateRecords(records);
   if(digest(S.importRecords(records))!==a.meta.sourceHash)fail('Import digest mismatch; resume missing batches','failed-precondition');
   if(a.meta.extrasHash){const A=require('../archive.cjs'),extras={};for(const family of A.FAMILIES){const rows=await tx.get(a.ws.collection(family));extras[family]=rows.docs.map(d=>({id:d.id,data:d.data()})).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);}A.validateExtras(extras,records);if(digest(extras)!==a.meta.extrasHash)fail('Collaboration archive is incomplete','failed-precondition');}
   tx.update(a.ws,{state:'active',sequence:1,recordCount:records.length});for(const r of records.filter(r=>r.kind==='projects'&&!r.deleted))tx.create(a.ws.collection('summaries').doc(r.projectId),summaries.build(r.projectId,records,1));tx.create(a.ws.collection('audit').doc('import'),{actor:uid,action:a.meta.restoredFrom?'Restored into a new workspace':'Explicit workspace import',projectId:'',at:Date.now(),sourceHash:b.sourceHash,restoredFrom:a.meta.restoredFrom||''});return {active:true};
  });
 }
 async function importExtras(uid,b){const A=require('../archive.cjs');if(!A.FAMILIES.includes(b.family)||!Array.isArray(b.rows)||!b.rows.length||b.rows.length>100)fail('Invalid collaboration archive batch','invalid-argument');const rows=A.normalizeExtras({[b.family]:b.rows},uid)[b.family];return db.runTransaction(async tx=>{const a=await access(tx,uid,b.orgId,b.workspaceId);if(!IAM.administer(a.member)||a.meta?.state!=='importing'||a.meta.importActor!==uid||a.meta.sourceHash!==b.sourceHash||!a.meta.extrasHash)fail('Import session is unavailable');for(const r of rows)tx.set(a.ws.collection(b.family).doc(r.id),r.data);return {accepted:rows.length};});}
 async function pull(uid,b){
  const cursor=Number(b.cursor||0);if(!Number.isSafeInteger(cursor)||cursor<0)fail('Invalid cursor','invalid-argument');
  return db.runTransaction(async tx=>{const a=await access(tx,uid,b.orgId,b.workspaceId);if(a.member?.active!==true||!a.grant||a.meta?.state!=='active')fail('Workspace access is unavailable');
   // Explicit denies override workspace grants. Query before returning any content.
   const accessVersion=digest({grant:a.grant,membershipRole:a.member.role,generation:a.meta.createdAt,sourceHash:a.meta.sourceHash}),reset=b.accessVersion!==accessVersion||cursor>a.meta.sequence;
   const cacheKey=[b.orgId,b.workspaceId,uid,accessVersion,a.meta.sequence,reset?0:cursor].join('|'),cached=readCache.get(cacheKey);
   if(cached&&cached.expires>Date.now())return {...cached.result,measured:{...cached.result.measured,documentReads:3,recordCacheHit:true}};
   const snap=!reset&&cursor===a.meta.sequence?{docs:[],size:0}:await tx.get(a.ws.collection('records').where('sequence','>',reset?0:cursor));
   const restricted=Object.values(a.grant.projects||{}).some(r=>r==='none');
   const records=snap.docs.map(d=>d.data()).filter(r=>IAM.can(a.member,a.grant,r.projectId,'read')&&!(restricted&&!r.projectId));
   const result={records,cursor:a.meta.sequence,grant:a.grant,membershipRole:a.member.role,accessVersion,reset,measured:{documentReads:IAM.administer(a.member)?snap.size+3:null,bytes:Buffer.byteLength(JSON.stringify(records)),recordCacheHit:false}};
   if(readCache.size>=32)readCache.delete(readCache.keys().next().value);readCache.set(cacheKey,{expires:Date.now()+10000,result});return result;
  });
 }
 async function commit(uid,b){
  S.segment(b.mutationId);if(!Array.isArray(b.changes)||!b.changes.length||b.changes.length>100)fail('Mutation must have 1–100 record changes','invalid-argument');
  const hash=digest({changes:b.changes,actor:uid});
  return db.runTransaction(async tx=>{const a=await access(tx,uid,b.orgId,b.workspaceId);if(a.member?.active!==true||a.meta?.state!=='active')fail('Workspace access is unavailable');
   const receipt=a.ws.collection('receipts').doc(b.mutationId),[ack,subscription]=await Promise.all([tx.get(receipt),tx.get(a.org.collection('subscription').doc('current'))]);
   // Permission is checked even on replay; stale receipts cannot recover revoked data.
   for(const c of b.changes){const r=checkRecord(c.after||c.before);if(c.key!==r.key)fail('Mutation path mismatch','invalid-argument');const comment=r.kind==='comments'||r.kind==='canvas.threads',action=b.restore?'restore':!c.after?'delete':r.kind==='projects'?'manage':comment?'comment':!c.before?'create':'edit';if(!IAM.can(a.member,a.grant,r.projectId,action)||comment&&c.before&&!IAM.can(a.member,a.grant,r.projectId,'edit'))fail('Action is outside the scoped grant');}
   if(b.changes.some(c=>!['comments','canvas.threads'].includes((c.after||c.before).kind))&&!subscription.data()?.seats?.includes(uid))fail('A licensed seat is required for project editing');
   if(ack.exists){if(ack.data().hash!==hash||ack.data().actor!==uid)fail('Mutation ID reused','already-exists');return {...ack.data().result,duplicate:true};}
   const projects=[...new Set(b.changes.map(c=>(c.after||c.before).projectId))],scoped=projects.length===1&&!!projects[0]&&b.changes.every(c=>(c.after||c.before).kind!=='projects');
   const snapshot=await tx.get(scoped?a.ws.collection('records').where('projectId','==',projects[0]):a.ws.collection('records'));const records=new Map(snapshot.docs.map(d=>[d.id,d.data()])),sequence=a.meta.sequence+1,updates=[];
   const beforeRecords=[...records.values()];
   const seen=new Set();for(const c of b.changes){if(seen.has(c.key))fail('Duplicate mutation key','invalid-argument');seen.add(c.key);if(!Number.isSafeInteger(c.baseRevision)||c.baseRevision<0)fail('Invalid base revision','invalid-argument');const old=records.get(c.key);if(old?.deleted&&!b.restore)fail('Deleted records require an explicit authorized restore');if(c.before)checkRecord(c.before);if(c.after)checkRecord(c.after);
    if(c.before&&(!old||old.revision!==c.baseRevision)){
     // Merge uses the supplied base only if it matches an immutable server revision.
     const rev=await tx.get(a.ws.collection('versions').doc(c.key+'@'+c.baseRevision));
     if(!rev.exists||!S.equal(rev.data().record.data,c.before.data)||rev.data().record.order!==c.before.order)fail('Unknown mutation base','conflict');
    }else if(c.before&&(!S.equal(old.data,c.before.data)||old.order!==c.before.order))fail('Forged mutation base','conflict');
    const merged=S.mergeChange(old,c),next={...checkRecord(merged),schema:S.SCHEMA,revision:(old?.revision||0)+1,sequence,deleted:merged.deleted===true};updates.push({old,next});records.set(c.key,next);
    if(!b.restore&&((next.kind==='tasks'&&['verified','merged'].some(k=>next.data[k]&&!old?.data[k]))||(next.kind==='releases'&&next.data.status==='Released'&&old?.data.status!=='Released'))&&!IAM.can(a.member,a.grant,next.projectId,'approve'))fail('Approval permission required');
   }
   S.validateRecords([...records.values()]);
   if(!b.restore)require('../validation.cjs').validateTransition(beforeRecords,[...records.values()]);
   const summaryIds=[...new Set(updates.map(u=>u.next.projectId).filter(Boolean))];const previousSummaries=await Promise.all(summaryIds.map(p=>tx.get(a.ws.collection('summaries').doc(p))));
   const result={sequence,records:updates.map(u=>u.next),measured:{documentReads:snapshot.size+5,documentWrites:updates.length*2+3}};
   for(let i=0;i<summaryIds.length;i++){const p=summaryIds[i];tx.set(previousSummaries[i].ref,summaries.update(previousSummaries[i].data()||summaries.empty(p),updates.filter(u=>u.next.projectId===p),sequence));}result.measured.documentReads+=summaryIds.length;result.measured.documentWrites+=summaryIds.length;
   for(const {old,next} of updates){tx.set(a.ws.collection('records').doc(next.key),next);if(old?.revision===1){tx.set(a.ws.collection('versions').doc(old.key+'@1'),{record:old,actor:uid,at:Date.now()});result.measured.documentWrites++;}tx.create(a.ws.collection('versions').doc(next.key+'@'+next.revision),{record:next,actor:uid,at:Date.now()});}
   if(!IAM.administer(a.member))result.measured.documentReads=null;
   tx.update(a.ws,{sequence});tx.create(receipt,{actor:uid,hash,result,at:Date.now()});
   // Audit metadata is separate from content; versions above retain recoverable revisions.
   tx.create(a.ws.collection('audit').doc(b.mutationId),{actor:uid,action:b.restore?'Restore records':'Commit records',projectId:updates.every(u=>u.next.projectId===updates[0].next.projectId)?updates[0].next.projectId:'',keys:updates.map(u=>u.next.key),sequence,at:Date.now()});
   return result;
  });
 }
 async function grant(uid,b){
  const target=S.segment(b.uid),g=IAM.validGrant(b.grant),ws=wsRef(b.orgId,b.workspaceId),acl=rtdb.ref(`acl/${b.orgId}/${b.workspaceId}/${target}`);
  // A versioned deny phase makes concurrent grants converge without stale ACL resurrection.
  const version=await db.runTransaction(async tx=>{const a=await access(tx,uid,b.orgId,b.workspaceId);if(!IAM.administer(a.member)||!a.meta)fail('Organization administrator required');const [m,old,subscription]=await Promise.all([tx.get(a.org.collection('members').doc(target)),tx.get(ws.collection('grants').doc(target)),tx.get(a.org.collection('subscription').doc('current'))]);if(([g.workspaceRole,...Object.values(g.projects)].some(r=>['manager','contributor'].includes(r)))&&!subscription.data()?.seats?.includes(target))fail('Allocate a licensed seat before granting editing access');if(m.data()?.active!==true)fail('Active organization member required');const version=(old.data()?.version||0)+1;tx.set(ws.collection('grants').doc(target),{workspaceRole:'none',projects:{},version,pending:true});return version;});
  await acl.transaction(old=>(old?.version||0)>version?undefined:{version,workspace:false,projects:{},expiresAt:Date.now()+90000});
  const applied=await db.runTransaction(async tx=>{const a=await access(tx,uid,b.orgId,b.workspaceId),[old,member]=await Promise.all([tx.get(ws.collection('grants').doc(target)),tx.get(a.org.collection('members').doc(target))]);if(!IAM.administer(a.member))fail('Organization administrator required');if(old.data()?.version!==version||member.data()?.active!==true)return false;tx.set(old.ref,{...g,version});tx.create(ws.collection('audit').doc(),{actor:uid,action:'Changed scoped grant',target,projectId:'',at:Date.now()});return true;});
  if(applied)await writeAcl(target,b,g,version);return {ok:true,superseded:!applied};
 }
 async function writeAcl(target,b,g,version){
  await rtdb.ref(`acl/${b.orgId}/${b.workspaceId}/${target}`).transaction(old=>(old?.version||0)>version?undefined:{version,workspace:IAM.ROLES[g.workspaceRole]?.includes('read')||false,projects:Object.fromEntries(Object.entries(g.projects).map(([p,r])=>[p,IAM.ROLES[r]?.includes('read')||false])),expiresAt:Date.now()+90000});
 }
 async function presenceAuthorize(uid,b){
  const a=await db.runTransaction(tx=>access(tx,uid,b.orgId,b.workspaceId));if(a.member?.active!==true||a.meta?.state!=='active'||!a.grant)fail('Workspace access is unavailable');await writeAcl(uid,b,a.grant,a.grant.version||0);return {expiresAt:Date.now()+90000};
 }
 async function revoke(uid,b){
  const target=S.segment(b.uid);
  const scopes=await db.runTransaction(async tx=>{const org=orgRef(b.orgId),[actor,member,workspaces,subscription,pools]=await Promise.all([tx.get(org.collection('members').doc(uid)),tx.get(org.collection('members').doc(target)),tx.get(org.collection('workspaces')),tx.get(org.collection('subscription').doc('current')),tx.get(org.collection('seatAllocations').where('members','array-contains',target).limit(201))]);if(!IAM.administer(actor.data())||member.data()?.role==='owner')fail('An organization owner cannot be revoked');const grants=await Promise.all(workspaces.docs.map(w=>tx.get(w.ref.collection('grants').doc(target))));tx.set(member.ref,{...member.data(),active:false,revokedAt:Date.now()});tx.update(subscription.ref,{seats:(subscription.data()?.seats||[]).filter(s=>s!==target),allocations:Object.fromEntries(Object.entries(subscription.data()?.allocations||{}).map(([k,v])=>[k,v.filter(id=>id!==target)]))});for(const pool of pools.docs)tx.update(pool.ref,{members:pool.data().members.filter(id=>id!==target)});tx.create(org.collection('adminAudit').doc(),{actor:uid,action:'Revoked organization member',target,at:Date.now()});return grants.map((g,i)=>{const version=(g.data()?.version||0)+1;tx.set(g.ref,{workspaceRole:'none',projects:{},version});return {workspaceId:workspaces.docs[i].id,version};});});
  for(const s of scopes)await writeAcl(target,{...b,workspaceId:s.workspaceId},{workspaceRole:'none',projects:{}},s.version);return {revoked:true};
 }
 async function admin(uid,b){
  return db.runTransaction(async tx=>{const a=await access(tx,uid,b.orgId,b.workspaceId);if(!IAM.administer(a.member))fail('Organization administrator required');const [members,grants,sub,audit]=await Promise.all([tx.get(a.org.collection('members')),tx.get(a.ws.collection('grants')),tx.get(a.org.collection('subscription').doc('current')),tx.get(a.ws.collection('audit').orderBy('at','desc').limit(30))]);return {members:members.docs.map(d=>({uid:d.id,...d.data()})),grants:grants.docs.map(d=>({uid:d.id,...d.data()})),subscription:sub.data(),audit:audit.docs.map(d=>({id:d.id,...d.data()})),state:a.meta?.state,sequence:a.meta?.sequence};});
 }
 async function invite(uid,b){
   if(b.guest===true&&[b.grant?.workspaceRole,...Object.values(b.grant?.projects||{})].some(r=>['manager','contributor'].includes(r)))fail('Unlicensed guests may view or comment');
  const target=S.segment(b.uid),token=crypto.randomBytes(24).toString('hex'),id=digest(token);await db.runTransaction(async tx=>{const a=await access(tx,uid,b.orgId,b.workspaceId);if(!IAM.administer(a.member))fail('Organization administrator required');tx.create(a.org.collection('invitations').doc(id),{target,workspaceId:b.workspaceId,createdAt:Date.now(),expires:Date.now()+86400000,used:false,licensed:b.guest!==true,grant:IAM.validGrant(b.grant)});});return {token};
 }
 async function accept(uid,b){
  return db.runTransaction(async tx=>{const org=orgRef(b.orgId),ref=org.collection('invitations').doc(digest(b.token)),sref=org.collection('subscription').doc('current');const [i,s,member]=await Promise.all([tx.get(ref),tx.get(sref),tx.get(org.collection('members').doc(uid))]);const inv=i.data();if(!inv||inv.target!==uid||inv.used||inv.expires<Date.now()||inv.createdAt<=(member.data()?.revokedAt||0))fail('Invitation is invalid or expired');const grant=await tx.get(wsRef(b.orgId,inv.workspaceId).collection('grants').doc(uid));const seats=inv.licensed===false?s.data().seats:IAM.license(s.data(),s.data().seats,uid,true);tx.set(member.ref,{active:true,role:member.data()?.role||(inv.licensed===false?'guest':'member')});tx.set(grant.ref,{...inv.grant,version:(grant.data()?.version||0)+1});tx.update(sref,{seats});tx.update(ref,{used:true});return {workspaceId:inv.workspaceId};});
 }
 async function subscription(uid,b){
  if(!Number.isInteger(b.capacity)||b.capacity<0||b.capacity>100000)fail('Invalid simulated capacity','invalid-argument');return db.runTransaction(async tx=>{const org=orgRef(b.orgId),[m,s]=await Promise.all([tx.get(org.collection('members').doc(uid)),tx.get(org.collection('subscription').doc('current'))]);if(!IAM.administer(m.data())&&!(m.data()?.active&&m.data()?.role==='billing'))fail('Billing permission required');if(b.capacity<s.data().seats.length)fail('Allocated seats exceed new capacity','failed-precondition');tx.update(s.ref,{capacity:b.capacity,status:'simulated'});return {simulated:true};});
 }
 async function mockWebhook(uid,b){
  const event=require('./mockBilling.cjs').verify(b.event,b.signature);
  return db.runTransaction(async tx=>{const org=orgRef(b.orgId),[actor,sub,receipt]=await Promise.all([tx.get(org.collection('members').doc(uid)),tx.get(org.collection('subscription').doc('current')),tx.get(org.collection('billingEvents').doc(event.id))]);if(!IAM.administer(actor.data())&&!(actor.data()?.active&&actor.data()?.role==='billing'))fail('Billing permission required');const hash=digest(event);if(receipt.exists){if(receipt.data().hash!==hash)fail('Payment event ID reused','already-exists');return {simulated:true,duplicate:true};}if(event.type==='capacity'&&event.capacity<sub.data().seats.length)fail('Allocated seats exceed capacity','failed-precondition');tx.create(receipt.ref,{hash,event,actor:uid,at:Date.now(),simulated:true});if(event.type==='capacity')tx.update(sub.ref,{capacity:event.capacity});else if(event.type.startsWith('payment-'))tx.update(sub.ref,{paymentStatus:event.type==='payment-failed'?'grace-period-simulated':'current-simulated'});return {simulated:true,duplicate:false};});
 }
 async function platform(uid){const role=(await db.doc('platformRoles/'+uid).get()).data();if(!['owner','security','operations','billing'].includes(role?.role))fail('Platform role required');const orgs=await db.collection('orgs').get();return {role:role.role,organizations:orgs.docs.map(d=>({id:d.id,name:d.data().name})),simulatedBilling:true};}
 async function backup(uid,b){return db.runTransaction(async tx=>{const a=await access(tx,uid,b.orgId,b.workspaceId);if(a.member?.active!==true||a.meta?.state!=='active'||!a.grant)fail('Workspace access is unavailable');const snap=await tx.get(a.ws.collection('records'));const records=snap.docs.map(d=>d.data()).filter(r=>!b.projectId||r.projectId===b.projectId);for(const r of records){requireRead(a,r.projectId);if(!IAM.can(a.member,a.grant,r.projectId,'export'))fail('Export permission required');}const extras={};for(const family of require('../archive.cjs').FAMILIES){const rows=await tx.get(a.ws.collection(family));extras[family]=rows.docs.filter(d=>!b.projectId||d.data().projectId===b.projectId).map(d=>({id:d.id,data:d.data()})).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);}return {format:'milvayo.cloud.backup.v2',schema:S.SCHEMA,orgId:b.orgId,workspaceId:b.workspaceId,sequence:a.meta.sequence,records,extras,checksum:digest(records),dataChecksum:digest({records,extras}),exportedAt:Date.now()};});}
 async function history(uid,b){return db.runTransaction(async tx=>{const a=await access(tx,uid,b.orgId,b.workspaceId),r=await tx.get(a.ws.collection('records').doc(S.documentKey(b.key)));requireRead(a,r.data()?.projectId);if(!IAM.can(a.member,a.grant,r.data().projectId,'restore'))fail('Recovery permission required');const snap=await tx.get(a.ws.collection('versions').where('record.key','==',b.key).limit(100));return {versions:snap.docs.map(d=>d.data())};});}
 async function readSummaries(uid,b){return db.runTransaction(async tx=>{const a=await access(tx,uid,b.orgId,b.workspaceId);if(a.member?.active!==true||a.meta?.state!=='active'||!a.grant)fail('Workspace access is unavailable');const snap=await tx.get(a.ws.collection('summaries'));return {summaries:snap.docs.map(d=>d.data()).filter(s=>IAM.can(a.member,a.grant,s.projectId,'read')),measured:{documentReads:IAM.administer(a.member)?snap.size+3:null}};});}
 const context={db,rtdb,access,wsRef,orgRef,fail,digest,getTelemetry};
 const handlers={...require('./collaboration.cjs').collaboration(context),...require('./administration.cjs').administration(context),bootstrap,organizationCreate,importBegin:begin,importChunk,importExtras,importFinalize:finalize,pull,commit,grant,presenceAuthorize,revoke,admin,invite,accept,subscription,mockWebhook,platform,backup,history,summaries:readSummaries};
 return {async execute(uid,b){S.segment(uid);S.assertJson(b);if(Buffer.byteLength(JSON.stringify(b))>900000)fail('Request exceeds 900 KB','invalid-argument');if(!handlers[b.action])fail('Unknown operation','invalid-argument');return handlers[b.action](uid,b);},digest};
}
module.exports={createService,digest};
