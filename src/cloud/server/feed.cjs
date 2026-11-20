// /src/cloud/server/feed.cjs
'use strict';
// Firebase v4.0 Gate 3a: the change feed and the per-project change signal.
// `pullV4` replaces the v3 workspace-sequence pull for protocol-4 workspaces. One call reads one bounded page of one project:
//  - Full sync (no cursor): the project's live records by document key. It returns `roundStartedAt`; the client keeps it as its cursor.
//  - Incremental (cursor): records with updatedAt >= cursor - 30 s, ordered by (updatedAt, key). Tombstones are included. The 30 s overlap is applied only to the
//    first page of a round; later pages continue strictly after the last (updatedAt, key) so a short page can never stall. The client ignores a (key, revision) it already holds.
// `directoryV4` lists what a member may read (project records and workspace-level records), so the app knows which project feeds to open. It is called on connect, after an access change, and on the slow safety poll.
// After every accepted write the Function sets `heads/{org}/{workspace}/{project}` (best effort); clients pull only when it moves.
const crypto=require('node:crypto');
const S=require('../schema.cjs'),IAM=require('../iam.cjs');
const LIMITS=Object.freeze({pageDefault:200,pageMax:500,pageBytes:4000000,overlapMs:30000,retentionMs:90*86400000,signalTimeoutMs:1500});
// Writers whose accepted result must wake the other clients of the project.
const WRITERS=Object.freeze(['patch','moveTask','patchCanvas','deleteCanvasObjects','deleteTask','patchDependencies','createTask','addComment','logTime','createCanvasObject','createCanvasConnector','patchCanvasConnector','deleteCanvasConnector']);
// Internal bookkeeping (operation IDs and hashes, legacy sequence, schema tag) is never sent to clients.
const publicRecord=r=>{const o={key:r.key,kind:r.kind,projectId:r.projectId,boardId:r.boardId,id:r.id,data:r.data,order:r.order,revision:r.revision,updatedAt:r.updatedAt,updatedBy:r.updatedBy};if(r.deleted){o.deleted=true;o.deletedAt=r.deletedAt;}return o;};
const bounded=(promise,ms)=>{promise.catch(()=>{});let timer;return Promise.race([promise,new Promise(resolve=>{timer=setTimeout(resolve,ms);})]).finally(()=>clearTimeout(timer));};
function feedHandlers({db,rtdb,access,fail,digest,stamp=Date.now}){
 const safeInt=v=>Number.isSafeInteger(v)&&v>=0;
 async function pullV4(uid,b){
  const projectId=S.segment(b.projectId),limit=b.limit===undefined?LIMITS.pageDefault:b.limit;
  if(!Number.isSafeInteger(limit)||limit<1||limit>LIMITS.pageMax)fail('Invalid page size','invalid-argument');
  const full=b.cursor===undefined||b.cursor===null;
  if(!full&&!safeInt(b.cursor))fail('Invalid cursor','invalid-argument');
  const page=b.page??null;
  if(page!==null){
   if(typeof page!=='object'||Array.isArray(page))fail('Invalid page token','invalid-argument');
   try{S.documentKey(page.k);}catch{fail('Invalid page token','invalid-argument');}
   if(!full&&!safeInt(page.u))fail('Invalid page token','invalid-argument');
  }
  const now=stamp();
  if(page!==null&&(!safeInt(b.roundStartedAt)||b.roundStartedAt>now+LIMITS.overlapMs))fail('Invalid round start','invalid-argument');
  const roundStartedAt=page!==null?b.roundStartedAt:now;
  return db.runTransaction(async tx=>{
   const a=await access(tx,uid,b.orgId,b.workspaceId);
   if(a.member?.active!==true||!a.grant||a.meta?.state!=='active')fail('Workspace access is unavailable');
   if(a.meta.protocol!==4)fail('This workspace does not use the v4 change feed','failed-precondition');
   // Same answer for "no such project" and "not allowed": the feed never confirms that a project exists.
   if(!IAM.can(a.member,a.grant,projectId,'read'))fail('Workspace access is unavailable');
   // Any change of grant, role, workspace generation or protocol invalidates every cursor: the client starts again from a full sync.
   const accessVersion=digest({grant:a.grant,role:a.member.role,generation:a.meta.createdAt,sourceHash:a.meta.sourceHash,protocol:4}),admin=IAM.administer(a.member);
   const reset=(why)=>({ok:true,reset:why,accessVersion,records:[],more:false,page:null,roundStartedAt,full:false,measured:admin?{documentReads:3,documents:0}:undefined});
   if(b.accessVersion!==undefined&&b.accessVersion!==accessVersion)return reset('access');
   if(!full&&(now-b.cursor>LIMITS.retentionMs||b.cursor>now+LIMITS.overlapMs))return reset('expired');
   const col=a.ws.collection('records');let query=col.where('projectId','==',projectId);
   if(full){query=query.orderBy('__name__');if(page)query=query.startAfter(page.k);}
   else{const from=page?page.u:Math.max(0,b.cursor-LIMITS.overlapMs);query=query.where('updatedAt','>=',from).orderBy('updatedAt').orderBy('__name__');if(page)query=query.startAfter(page.u,page.k);}
   const snap=await tx.get(query.limit(limit+1)),docs=snap.docs.map(d=>d.data());
   // Page size and a byte budget both bound the response; at least one record is always returned so a page can never stall.
   const rows=[];let bytes=0,taken=0;
   for(const r of docs.slice(0,limit)){const size=Buffer.byteLength(JSON.stringify(r));if(taken&&bytes+size>LIMITS.pageBytes)break;bytes+=size;taken++;rows.push(r);}
   const more=docs.length>taken,last=rows.at(-1);
   const records=(full?rows.filter(r=>!r.deleted):rows).map(publicRecord);
   const next=more&&last?(full?{k:last.key}:{u:last.updatedAt,k:last.key}):null;
   const result={ok:true,records,more:!!next,page:next,roundStartedAt,full,accessVersion,measured:admin?{documentReads:snap.size+3,documents:records.length,bytes}:undefined};
   if(!result.more)result.cursor=roundStartedAt;
   return result;
  });
 }
 async function directoryV4(uid,b){
  return db.runTransaction(async tx=>{
   const a=await access(tx,uid,b.orgId,b.workspaceId);
   if(a.member?.active!==true||!a.grant||a.meta?.state!=='active')fail('Workspace access is unavailable');
   // An old workspace answers with its protocol only, so the app keeps using the v3 pull for it.
   if(a.meta.protocol!==4)return {ok:true,protocol:3};
   const accessVersion=digest({grant:a.grant,role:a.member.role,generation:a.meta.createdAt,sourceHash:a.meta.sourceHash,protocol:4}),admin=IAM.administer(a.member),col=a.ws.collection('records');
   const [projectSnap,sharedSnap]=await Promise.all([tx.get(col.where('kind','==','projects')),tx.get(col.where('projectId','==',''))]);
   // Same rule as the v3 pull: explicit denials hide workspace-level records too.
   const restricted=Object.values(a.grant.projects||{}).some(r=>r==='none'),byKey=(x,y)=>x.key<y.key?-1:x.key>y.key?1:0;
   const projects=projectSnap.docs.map(d=>d.data()).filter(r=>!r.deleted&&IAM.can(a.member,a.grant,r.projectId,'read')).sort(byKey).map(publicRecord);
   const shared=sharedSnap.docs.map(d=>d.data()).filter(r=>!r.deleted&&!restricted&&IAM.can(a.member,a.grant,r.projectId,'read')).sort(byKey).map(publicRecord);
   return {ok:true,protocol:4,accessVersion,grant:a.grant,membershipRole:a.member.role,projects,shared,measured:admin?{documentReads:projectSnap.size+sharedSnap.size+3,documents:projects.length+shared.length}:undefined};
  });
 }
 // Best effort and bounded: a slow or failed signal never fails or delays a committed edit by more than the timeout; clients also poll slowly.
 async function signalProject(b){
  if(typeof rtdb?.ref!=='function')return;
  try{await bounded(Promise.resolve(rtdb.ref(`heads/${S.segment(b.orgId)}/${S.segment(b.workspaceId)}/${S.segment(b.projectId)}`).set({at:stamp(),n:crypto.randomInt(1000000000)})),LIMITS.signalTimeoutMs);}catch{}
 }
 // Wraps the v4 writers: an accepted write (not a conflict, not a no-op) wakes the project's listeners.
 const withSignal=handlers=>Object.fromEntries(Object.entries(handlers).map(([name,fn])=>[name,WRITERS.includes(name)?async(uid,b)=>{const result=await fn(uid,b);if(result?.ok===true&&result.alreadyApplied!==true)await signalProject(b);return result;}:fn]));
 return {handlers:{pullV4,directoryV4},withSignal,signalProject};
}
module.exports={feedHandlers,LIMITS,WRITERS};
