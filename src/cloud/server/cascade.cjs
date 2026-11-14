// /src/cloud/server/cascade.cjs
'use strict';
// Bounded reference lookups for v4 delete and dependency edits. Every lookup is an indexed query on related records
// (dependents, children, task-linked items, downstream tasks), so reads grow with the number of related records, never with project size.
// Anything above the caps is refused with failed-precondition so the client falls back to the full editor.
const S=require('../schema.cjs');
const LIMITS=Object.freeze({queryRows:100,visitedTasks:200,changedRecords:100,upstreamTasks:300});
const TASK_LINKED=['timeEntries','comments','reminders'];
function createCascade({tx,a,projectId,fail,reads}){
 const col=a.ws.collection('records'),tooBig=what=>fail(`${what} is too large for a field patch; use the full editor`,'failed-precondition');
 async function query(field,op,value,count){
  const snap=await tx.get(col.where('projectId','==',projectId).where(field,op,value).limit(LIMITS.queryRows+1));
  reads.queries+=Math.max(1,snap.docs.length);if(snap.docs.length>LIMITS.queryRows)tooBig(count);
  return snap.docs.map(d=>d.data());
 }
 const liveTasks=rs=>rs.filter(r=>r.kind==='tasks'&&!r.deleted&&r.projectId===projectId);
 const api={
  dependents:async id=>liveTasks(await query('data.dependsOn','array-contains',id,'The dependency list')),
  children:async id=>liveTasks(await query('data.parentId','==',id,'The child list')),
  linked:async id=>(await query('data.taskId','==',id,'The linked item list')).filter(r=>TASK_LINKED.includes(r.kind)&&!r.deleted),
  async get(kind,id,counter='dependencies'){const snap=await tx.get(col.doc(S.keyOf(kind,projectId,id)));reads[counter]++;return snap.exists&&!snap.data().deleted?snap.data():null;},
  // Every task that transitively depends on the start tasks (excluding `exclude`), keyed by ID.
  async downstream(startIds,exclude=new Set()){
   const seen=new Map(),visited=new Set(startIds),queue=[...startIds];
   for(let i=0;i<queue.length;i++){
    for(const r of await api.dependents(queue[i])){
     if(exclude.has(r.id)||visited.has(r.id))continue;visited.add(r.id);if(visited.size>LIMITS.visitedTasks)tooBig('The downstream dependency chain');seen.set(r.id,r);queue.push(r.id);
    }
   }
   return seen;
  },
  // Cycle check for new predecessors: walks their predecessors upward and refuses if it reaches the edited task.
  async assertNoCycle(taskId,predecessors){
   const visited=new Set(),queue=[...predecessors];
   for(let i=0;i<queue.length;i++){
    const id=queue[i];if(id===taskId)fail('Dependency cycle: a task cannot depend on itself through other tasks','invalid-argument');
    if(visited.has(id))continue;visited.add(id);if(visited.size>LIMITS.upstreamTasks)tooBig('The upstream dependency chain');
    const t=await api.get('tasks',id);if(!t)continue;queue.push(...t.data.dependsOn);
   }
  },
 };
 return api;
}
// Mirrors projectScheduling.invalidateDependents on the affected tasks only. `start` maps task ID -> task record after any cascade edit.
// Returns the changed task records and the releases that fall back to Testing.
async function invalidate(c,start,extraReleaseIds,now,exclude=new Set()){
 const down=await c.downstream([...start.keys()],exclude),affected=new Map([...start,...down]),changed=new Map();
 const stamp=new Date(now).toISOString();
 for(const [id,r] of affected)if(r.data.verified||r.data.merged)changed.set(id,{...r,data:{...r.data,verified:false,merged:false,updatedAt:stamp}});
 const releaseIds=new Set([...extraReleaseIds,...[...affected.values()].filter(r=>r.data.releaseId).map(r=>r.data.releaseId)]);releaseIds.delete('');
 const releases=[];for(const id of releaseIds){const r=await c.get('releases',id,'releases');if(r&&['Ready','Released'].includes(r.data.status))releases.push({...r,data:{...r.data,status:'Testing'}});}
 return {changed,releases};
}
// Each dependency is its own record (kind `dependencies`, id `predecessor>successor`). Only the edges that change are read and written.
const edgeKey=(projectId,pred,succ)=>S.keyOf('dependencies',projectId,pred+'>'+succ);
const newEdge=(projectId,pred,succ)=>({...S.record('dependencies',projectId,pred+'>'+succ,{predecessorId:pred,successorId:succ,type:'FS',lagDays:0},0),revision:0,sequence:0,deleted:true});
async function readEdges(c,tx,col,reads,projectId,pairs){
 return Promise.all(pairs.map(async([pred,succ])=>{const snap=await tx.get(col.doc(edgeKey(projectId,pred,succ)));reads.links++;return {pred,succ,record:snap.exists?snap.data():null};}));
}
const shell=(kind,projectId,id,order=0,boardId='')=>({...S.record(kind,projectId,id,{},order,boardId),revision:0,sequence:0,deleted:true});
module.exports={LIMITS,TASK_LINKED,createCascade,invalidate,edgeKey,newEdge,readEdges,shell};
