// /src/cloud/v4Writes.cjs
'use strict';
// Turns the journal's queued change (the record diff of one domain transaction) into ONE v4 server call, and sends it.
// Supported in a v4 workspace today: edit task fields (`patch`), delete a task with its cascade (`deleteTask`), create a task, add a comment, log time.
// Anything else (dependencies, moving a task in a list, Canvas, projects, ...) is refused with a clear message and stays in the recovery queue; nothing is lost and nothing is sent half-way.
const S=require('./schema.cjs');
const notYet=why=>Object.assign(new Error('This change is not available in v4 workspaces yet ('+why+'). It stays in your recovery queue.'),{code:'failed-precondition'});
const projectOf=c=>(c.before||c.after).projectId;
// Server records carry bookkeeping the app never needs (operation IDs and hashes, legacy sequence); the journal compares `sequence`, which is the per-record revision here.
function publicRecord(r){const o={key:r.key,kind:r.kind,projectId:r.projectId,boardId:r.boardId,id:r.id,data:r.data,order:r.order,revision:r.revision,sequence:r.revision,updatedAt:r.updatedAt,updatedBy:r.updatedBy};if(r.deleted){o.deleted=true;o.deletedAt=r.deletedAt;}return o;}
// One record change -> one server call: {request} (without scope/opId), or {noop:true}. Throws code 'failed-precondition' for unsupported changes.
function single(c){
 const {before,after}=c;
 if(!before&&after){
  const projectId=after.projectId;
  if(after.kind==='tasks')return {request:{action:'createTask',projectId,taskId:after.id,order:after.order,data:after.data}};
  if(after.kind==='comments')return {request:{action:'addComment',projectId,taskId:after.data.taskId,commentId:after.id,data:after.data}};
  if(after.kind==='timeEntries')return {request:{action:'logTime',projectId,taskId:after.data.taskId,entryId:after.id,data:after.data}};
  throw notYet('adding this kind of record');
 }
 if(before&&!after){
  if(before.kind==='tasks')return {request:{action:'deleteTask',projectId:before.projectId,taskId:before.id,baseRevision:c.baseRevision}};
  throw notYet('deleting this kind of record');
 }
 if(before&&after&&before.kind==='tasks'){
  if(before.order!==after.order)throw notYet('moving a task in its list');
  const set={};
  for(const k of new Set([...Object.keys(before.data),...Object.keys(after.data)])){
   if(S.equal(before.data[k],after.data[k]))continue;
   if(!Object.hasOwn(after.data,k))throw notYet('removing the field '+k);
   if(k==='dependsOn')throw notYet('dependencies');
   set[k]=after.data[k];
  }
  if(!Object.keys(set).length)return {noop:true};
  return {request:{action:'patch',projectId:before.projectId,taskId:before.id,baseRevision:c.baseRevision,set}};
 }
 throw notYet('this kind of record');
}
// A queued edit may hold several unrelated record changes (the journal merges edits typed close together). They become several calls, in a fixed order (deletes, creates, edits; by key),
// each with its own stable operation ID, so a retry after a crash repeats exactly the same calls and the server ignores the ones it already applied.
// The records a task delete drags along (its links, comments, time entries, and the tasks that depended on it) are not sent: the server computes that cascade itself.
function plan(changes,opId){
 if(!Array.isArray(changes))throw notYet('empty change');
 const same=c=>c.before&&c.after&&S.equal(c.before.data,c.after.data)&&c.before.order===c.after.order;
 let list=changes.filter(c=>(c.before||c.after)&&!same(c));
 const gone=new Set(list.filter(c=>c.before&&!c.after&&c.before.kind==='tasks').map(c=>c.before.projectId+'|'+c.before.id));
 const dropped=(c,r)=>{const id=x=>r.projectId+'|'+x;
  if(r.kind==='dependencies'&&!c.after)return gone.has(id(r.data.predecessorId))||gone.has(id(r.data.successorId));
  if(['comments','timeEntries','reminders'].includes(r.kind)&&!c.after)return gone.has(id(r.data.taskId));
  if(r.kind==='tasks'&&c.before&&c.after)return (c.before.data.dependsOn||[]).some(d=>gone.has(id(d)))||gone.has(id(c.before.data.parentId));
  return false;};
 if(gone.size)list=list.filter(c=>c.before&&!c.after&&c.before.kind==='tasks'||!dropped(c,c.before||c.after));
 const rank=c=>c.before&&!c.after?0:!c.before?1:2,order=list.map(c=>({c,built:single(c)})).filter(x=>!x.built.noop).sort((a,b)=>rank(a.c)-rank(b.c)||(a.c.key<b.c.key?-1:a.c.key>b.c.key?1:0));
 return order.map((x,i)=>({change:x.c,request:{...x.built.request,opId:order.length===1?opId:`${opId}.${i}`}}));
}
// Single-call form used by tests and callers that expect exactly one call.
function requestFor(changes,opId){const steps=plan(changes,opId);if(!steps.length)return {noop:true};if(steps.length>1)throw notYet('one change touches several records');return {request:steps[0].request};}
// The journal calls send({action:'commit', mutationId, changes}) for a queued edit and expects an acknowledgment {records}. Other queued requests (chat messages) pass through unchanged.
// A stale base revision is answered with the current record: if the fields touched do not overlap with what changed meanwhile, the edit is re-applied on top (strict server, automatic reapply for online edits).
function createSender({request,maxReapply=2}){
 async function sendOne(step,tag){
  let {change,request:body}=step;
  for(let attempt=0;;attempt++){
   const result=await request(attempt?{...body,opId:`${body.opId}.r${attempt}`}:body);
   if(result.ok===true){const list=result.changed&&result.changed.length?result.changed:result.record?[result.record]:[];return list.map(publicRecord);}
   if(result.code==='deleted')throw Object.assign(new Error('The record was deleted by someone else; your edit is kept for recovery'),{code:'conflict'});
   if(result.code!=='conflict'||!result.current||attempt>=maxReapply||body.action!=='patch')throw Object.assign(new Error('Someone else changed this record; compare the versions to resolve it'),{code:'conflict',current:result.current?publicRecord(result.current):undefined});
   const current=publicRecord(result.current);
   try{const merged=S.mergeChange(current,{before:change.before,after:change.after});change={key:change.key,before:current,after:merged,baseRevision:current.revision};const built=single(change);if(built.noop)return [];body={...built.request,opId:body.opId};}
   catch(e){if(e.code==='failed-precondition')throw e;throw Object.assign(new Error('Someone else changed the same field; compare the versions to resolve it'),{code:'conflict',current});}
  }
 }
 return async function send(body){
  if(body.action!=='commit')return request(body);
  const records=[];
  for(const step of plan(body.changes,body.mutationId))records.push(...await sendOne(step));
  return {records};
 };
}
// pack() numbers records by their position in the app's lists, but a v4 server keeps each record's order fixed (a delete leaves a gap). So that a deleted or added task does not look like a change to every task after it,
// positions are matched back to the stored orders whenever the surviving records are still in the same relative order; new records go after the last stored order. A real reorder is left alone and is refused by requestFor.
function alignOrders(next,local){
 const group=r=>r.kind+'|'+r.projectId+'|'+r.boardId,stored=new Map(),groups=new Map();
 for(const r of local){if(!stored.has(group(r)))stored.set(group(r),[]);stored.get(group(r)).push(r);}
 for(const r of next){if(!groups.has(group(r)))groups.set(group(r),[]);groups.get(group(r)).push(r);}
 const orders=new Map();
 for(const [g,list] of groups){
  const old=new Map((stored.get(g)||[]).map(r=>[r.key,r.order])),kept=list.filter(r=>old.has(r.key)),byOld=[...kept].sort((a,b)=>old.get(a.key)-old.get(b.key)||(a.key<b.key?-1:1));
  const sameOrder=kept.every((r,i)=>r.key===byOld[i].key);if(!sameOrder)continue;
  let top=Math.max(-1,...old.values());
  for(const r of list)orders.set(r.key,old.has(r.key)?old.get(r.key):++top);
 }
 return next.map(r=>orders.has(r.key)&&orders.get(r.key)!==r.order?{...r,order:orders.get(r.key)}:r);
}
module.exports={alignOrders,plan,requestFor,createSender,publicRecord};
