// /src/cloud/server/patch.cjs
'use strict';
// Firebase v4.0 lean task patch (Gate 2 prototype). Writes exactly one document for a routine task edit:
// no version, receipt, audit, workspace-sequence or summary write. Available only on workspaces whose protocol is 4.
const S=require('../schema.cjs'),IAM=require('../iam.cjs'),V=require('../taskMutation.cjs');
const ALLOWED=new Set([...V.WORKFLOW].filter(k=>k!=='updatedAt'));
function patchHandlers({db,access,fail,stamp=Date.now}){
 const reject=(code,current)=>({ok:false,code,current});
 async function patch(uid,b){
  S.segment(b.projectId);S.segment(b.taskId);S.segment(b.opId);
  if(!Number.isSafeInteger(b.baseRevision)||b.baseRevision<1)fail('Invalid base revision','invalid-argument');
  if(!b.set||typeof b.set!=='object'||Array.isArray(b.set)||!Object.keys(b.set).length||Object.keys(b.set).length>20)fail('A patch needs 1–20 fields','invalid-argument');
  for(const k of Object.keys(b.set))if(!ALLOWED.has(k))fail(k==='updatedAt'?'updatedAt is set by the server':`Field is not patchable: ${k}`,'invalid-argument');
  const key=S.keyOf('tasks',b.projectId,b.taskId);let attempts=0;
  return db.runTransaction(async tx=>{
   attempts++;const reads={authorization:3,subscription:0,task:0,configuration:0,dependencies:0};
   const a=await access(tx,uid,b.orgId,b.workspaceId);
   if(a.member?.active!==true||a.meta?.state!=='active')fail('Workspace access is unavailable');
   if(!IAM.can(a.member,a.grant,b.projectId,'edit'))fail('Action is outside the scoped grant');
   if(a.meta.protocol!==4)fail('This workspace does not accept field patches','failed-precondition');
   if(a.meta.writeFreeze===true)fail('Writes are temporarily paused for this workspace','failed-precondition');
   const ref=a.ws.collection('records').doc(key),[sub,snap]=await Promise.all([tx.get(a.org.collection('subscription').doc('current')),tx.get(ref)]);reads.subscription=1;reads.task=1;
   if(!sub.data()?.seats?.includes(uid))fail('A licensed seat is required for project editing');
   if(!snap.exists)fail('Task is unavailable','failed-precondition');
   const old=snap.data();if(old.kind!=='tasks'||old.projectId!==b.projectId||old.id!==b.taskId)fail('Task is unavailable','failed-precondition');
   const measured=()=>IAM.administer(a.member)?{documentReads:Object.values(reads).reduce((x,y)=>x+y,0),documentWrites:0,documentDeletes:0,readBreakdown:reads,validationClass:'patch',transactionAttempts:attempts}:undefined;
   if(old.deleted)return {...reject('deleted',old),measured:measured()};
   // Retry safety without receipts: the last accepted operation is remembered on the task itself.
   if(old.lastOpId===b.opId)return {ok:true,duplicate:true,revision:old.revision,record:old,measured:measured()};
   const applied=Object.entries(b.set).every(([k,v])=>S.equal(old.data[k],v));
   if(old.revision!==b.baseRevision)return applied?{ok:true,alreadyApplied:true,revision:old.revision,record:old,measured:measured()}:{...reject('conflict',old),measured:measured()};
   const now=stamp(),data={...old.data,...b.set,updatedAt:new Date(now).toISOString()},next={...old,data};
   let project;if(V.needsConfiguration(old,next)){const p=await tx.get(a.ws.collection('records').doc(S.keyOf('projects',b.projectId,b.projectId)));reads.configuration=1;project=p.data();}
   V.validateWorkflow(old,next,project);
   if(old.data.status!==data.status&&data.status==='Done'&&data.dependsOn.length){
    const deps=await Promise.all(data.dependsOn.map(id=>tx.get(a.ws.collection('records').doc(S.keyOf('tasks',b.projectId,id)))));reads.dependencies=deps.length;
    const status=new Map(deps.filter(d=>d.exists&&!d.data().deleted).map(d=>[d.data().id,d.data().data.status]));V.validateDone(old,next,id=>status.get(id));
   }
   const record={...old,data,revision:old.revision+1,updatedAt:now,updatedBy:uid,lastOpId:b.opId};
   tx.update(ref,{data,revision:record.revision,updatedAt:now,updatedBy:uid,lastOpId:b.opId});
   const m=measured();if(m)m.documentWrites=1;
   return {ok:true,revision:record.revision,record,measured:m};
  });
 }
 // Administrator controls: the workspace protocol marker and the destructive-write freeze.
 async function workspaceControl(uid,b){
  return db.runTransaction(async tx=>{
   const a=await access(tx,uid,b.orgId,b.workspaceId);if(!IAM.administer(a.member)||!a.meta)fail('Organization administrator required');
   const change={};if(b.protocol!==undefined){if(![3,4].includes(b.protocol))fail('Protocol must be 3 or 4','invalid-argument');change.protocol=b.protocol;}
   if(b.writeFreeze!==undefined){if(typeof b.writeFreeze!=='boolean')fail('writeFreeze must be true or false','invalid-argument');change.writeFreeze=b.writeFreeze;}
   if(!Object.keys(change).length)fail('Nothing to change','invalid-argument');
   tx.update(a.ws,change);tx.create(a.org.collection('adminAudit').doc(),{actor:uid,action:'Changed workspace controls',workspaceId:b.workspaceId,...change,at:Date.now()});
   return {ok:true,...change};
  });
 }
 return {patch,workspaceControl};
}
module.exports={patchHandlers,ALLOWED};
