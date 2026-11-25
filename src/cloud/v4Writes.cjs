// /src/cloud/v4Writes.cjs
'use strict';
// Turns the journal's queued change (the record diff of one domain transaction) into ONE v4 server call, and sends it.
// Supported in a v4 workspace today: moving a task in its list (`moveTask`), edit task fields (`patch`), change task dependencies (`patchDependencies`), delete a task with its cascade (`deleteTask`), create a task, add a comment, log time,
// move/resize/re-stack a Canvas object (`patchCanvas`: position, size, stacking, text, colour, lock), edit or remove a connector (`patchCanvasConnector`, `deleteCanvasConnector`), add a Canvas object or connector (`createCanvasObject`, `createCanvasConnector`) and delete Canvas objects with their cascade (`deleteCanvasObjects`).
// Anything else (a reorder of several tasks at once, other Canvas edits, projects, ...) is refused with a clear message and stays in the recovery queue; nothing is lost and nothing is sent half-way.
const S=require('./schema.cjs');
// `local:true` marks a change the cloud cannot take yet: the journal keeps it on this device as "not shared yet" (0.8.35) instead of a conflict.
const notYet=why=>Object.assign(new Error('This change is not available in v4 workspaces yet ('+why+'). It stays in your recovery queue.'),{code:'failed-precondition',local:true});
// A Canvas save also rewrites the board's own record (revision counter, update time, viewport pose). Those are local bookkeeping in a v4 workspace: not sent (the server keeps one record per object, and writing the board on every move would make it a hot spot),
// but acknowledged locally so the app keeps its own counter. Title, archive state and other board fields are not bookkeeping and are still refused.
const BOARD_LOCAL=['revision','updatedAt','viewport'];
const bookkeeping=c=>{if(!c.before||!c.after||c.before.kind!=='canvases'||c.before.order!==c.after.order)return false;for(const k of new Set([...Object.keys(c.before.data),...Object.keys(c.after.data)]))if(!BOARD_LOCAL.includes(k)&&!S.equal(c.before.data[k],c.after.data[k]))return false;return true;};
const localAcks=changes=>Array.isArray(changes)?changes.filter(bookkeeping).map(c=>({...c.before,data:c.after.data,order:c.after.order})):[];
const CANVAS_FIELDS=['x','y','width','height','zIndex','text','color','locked','groupId','sourceLink'],CONNECTOR_FIELDS=['label','style','arrow','color'];
const projectOf=c=>(c.before||c.after).projectId;
// 0.8.45: governance records go through three generic actions (create, patch, delete) keyed by record kind. Later project lists join this set.
const PROJECT_RECORDS=new Set(['governance.risks','governance.budget.lines','governance.wbs','governance.docs']);
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
  if(after.kind==='canvas.objects'){
   return {request:{action:'createCanvasObject',projectId,boardId:after.boardId,objectId:after.id,order:after.order,data:after.data}};
  }
  if(after.kind==='canvas.connectors')return {request:{action:'createCanvasConnector',projectId,boardId:after.boardId,connectorId:after.id,order:after.order,data:after.data}};
  // 0.8.44: a new comment thread (with its first comment).
  if(after.kind==='canvas.threads')return {request:{action:'createCanvasThread',projectId,boardId:after.boardId,threadId:after.id,order:after.order,data:after.data}};
  // 0.8.42: a new, empty Canvas board (the board's own record only; its objects arrive as their own creates).
  if(after.kind==='canvases')return {request:{action:'createCanvasBoard',projectId,boardId:after.id,order:after.order,data:after.data}};
  if(PROJECT_RECORDS.has(after.kind))return {request:{action:'createProjectRecord',projectId,recordKind:after.kind,recordId:after.id,order:after.order,data:after.data}};
  throw notYet('adding this kind of record');
 }
 if(before&&!after){
  if(before.kind==='canvas.connectors')return {request:{action:'deleteCanvasConnector',projectId:before.projectId,boardId:before.boardId,connectorId:before.id,baseRevision:c.baseRevision}};
  if(before.kind==='tasks')return {request:{action:'deleteTask',projectId:before.projectId,taskId:before.id,baseRevision:c.baseRevision}};
  // 0.8.42: delete a board (archived first). The server removes the board's objects, connectors and comments with it, so the app's per-item deletes are not sent (see plan()).
  if(before.kind==='canvases')return {request:{action:'deleteCanvasBoard',projectId:before.projectId,boardId:before.id,baseRevision:c.baseRevision}};
  if(PROJECT_RECORDS.has(before.kind))return {request:{action:'deleteProjectRecord',projectId:before.projectId,recordKind:before.kind,recordId:before.id,baseRevision:c.baseRevision}};
  throw notYet('deleting this kind of record');
 }
 if(before&&after&&before.kind==='tasks'){
  if(before.order!==after.order){if(!S.equal(before.data,after.data))throw notYet('moving and editing a task together');return {request:{action:'moveTask',projectId:before.projectId,taskId:before.id,baseRevision:c.baseRevision,order:after.order}};}
  const set={};
  for(const k of new Set([...Object.keys(before.data),...Object.keys(after.data)])){
   if(S.equal(before.data[k],after.data[k])||k==='updatedAt')continue;
   if(!Object.hasOwn(after.data,k))throw notYet('removing the field '+k);
   if(k==='dependsOn')throw notYet('dependencies');
   set[k]=after.data[k];
  }
  if(!Object.keys(set).length)return {noop:true};
  return {request:{action:'patch',projectId:before.projectId,taskId:before.id,baseRevision:c.baseRevision,set}};
 }
 if(before&&after&&before.kind==='canvas.objects'){
  const set={};
  for(const k of new Set([...Object.keys(before.data),...Object.keys(after.data)])){
   if(S.equal(before.data[k],after.data[k])||k==='updatedAt')continue;
   if(!CANVAS_FIELDS.includes(k))throw notYet('editing the Canvas property '+k);
   set[k]=after.data[k];
  }
  if(before.order!==after.order)throw notYet('reordering Canvas objects');
  if(!Object.keys(set).length)return {noop:true};
  return {request:{action:'patchCanvas',projectId:before.projectId,boardId:before.boardId,objectId:before.id,baseRevision:c.baseRevision,set}};
 }
 // 0.8.44: replying to or resolving a Canvas comment thread. Only new replies and the resolved time are sent; anything else about a thread stays on the device.
 // 0.8.45: editing a governance record: only the fields that changed are sent. A change of position alone is handled by plan() (a shift caused by an insert or delete is not a change; a real reorder stays on the device).
 if(before&&after&&PROJECT_RECORDS.has(before.kind)){
  const set={};
  for(const k of new Set([...Object.keys(before.data),...Object.keys(after.data)])){
   if(S.equal(before.data[k],after.data[k]))continue;
   if(k==='id')throw notYet('changing the ID of a record');
   set[k]=after.data[k];
  }
  if(!Object.keys(set).length)return {noop:true};
  return {request:{action:'patchProjectRecord',projectId:before.projectId,recordKind:before.kind,recordId:before.id,baseRevision:c.baseRevision,set}};
 }
 if(before&&after&&before.kind==='canvas.threads'){
  const set={};
  for(const k of new Set([...Object.keys(before.data),...Object.keys(after.data)])){
   if(S.equal(before.data[k],after.data[k])||k==='updatedAt')continue;
   if(k!=='messages'&&k!=='resolvedAt')throw notYet('changing the Canvas comment property '+k);
   set[k]=after.data[k];
  }
  if(before.order!==after.order)throw notYet('reordering Canvas comments');
  if(!Object.keys(set).length)return {noop:true};
  return {request:{action:'patchCanvasThread',projectId:before.projectId,boardId:before.boardId,threadId:before.id,baseRevision:c.baseRevision,set}};
 }
 if(before&&after&&before.kind==='canvas.connectors'){
  const set={};
  for(const k of new Set([...Object.keys(before.data),...Object.keys(after.data)])){
   if(S.equal(before.data[k],after.data[k]))continue;
   if(!CONNECTOR_FIELDS.includes(k))throw notYet('editing the connector property '+k);
   // The app drops an empty colour from the connector; the server is told to clear it.
   if(!Object.hasOwn(after.data,k)){if(k!=='color')throw notYet('removing the connector property '+k);set.color='';continue;}
   set[k]=after.data[k];
  }
  if(!Object.keys(set).length)return {noop:true};
  return {request:{action:'patchCanvasConnector',projectId:before.projectId,boardId:before.boardId,connectorId:before.id,baseRevision:c.baseRevision,set}};
 }
 if(before.kind==='canvases'){
  // 0.8.41: rename or archive a board. The board's counter, update time and viewport are bookkeeping and never sent (see `bookkeeping`).
  const set={};
  for(const k of new Set([...Object.keys(before.data),...Object.keys(after.data)])){
   if(S.equal(before.data[k],after.data[k])||BOARD_LOCAL.includes(k))continue;
   if(!['title','archivedAt'].includes(k))throw notYet('changing the Canvas board property '+k);
   set[k]=Object.hasOwn(after.data,k)?after.data[k]:null;
  }
  if(before.order!==after.order)throw notYet('reordering Canvas boards');
  if(!Object.keys(set).length)return {noop:true};
  return {request:{action:'patchCanvasBoard',projectId:before.projectId,boardId:before.id,baseRevision:c.baseRevision,set}};
 }
 throw notYet('this kind of record');
}
// A queued edit may hold several unrelated record changes (the journal merges edits typed close together). They become several calls, in a fixed order (deletes, creates, edits; by key),
// each with its own stable operation ID, so a retry after a crash repeats exactly the same calls and the server ignores the ones it already applied.
// The records a task delete drags along (its links, comments, time entries, and the tasks that depended on it) are not sent: the server computes that cascade itself.
function plan(changes,opId){
 if(!Array.isArray(changes))throw notYet('empty change');
 const same=c=>c.before&&c.after&&S.equal(c.before.data,c.after.data)&&c.before.order===c.after.order;
 let list=changes.filter(c=>(c.before||c.after)&&!same(c)&&!bookkeeping(c));
 // A task that was moved and also edited becomes two calls: its fields as a patch, its position as `moveTask` (sent after the patch, re-based on the newer revision by the sender).
 const moveSteps=[],movedPer=new Map();
 for(const c of list)if(c.before&&c.after&&c.before.kind==='tasks'&&c.before.order!==c.after.order)movedPer.set(c.before.projectId,(movedPer.get(c.before.projectId)||0)+1);
 if([...movedPer.values()].some(n=>n>1))throw notYet('moving several tasks at once');
 list=list.flatMap(c=>{if(c.before&&c.after&&c.before.kind==='tasks'&&c.before.order!==c.after.order&&!S.equal(c.before.data,c.after.data)){moveSteps.push(c);return [{...c,after:{...c.after,order:c.before.order}}];}return [c];});
 const gone=new Set(list.filter(c=>c.before&&!c.after&&c.before.kind==='tasks').map(c=>c.before.projectId+'|'+c.before.id));
 // A dependency edit has its own call that also writes the links and resets the downstream chain on the server. The same task's other field edits go separately; the links and the downstream resets are not sent.
 const CASCADE_FIELDS=['dependsOn','verified','merged','updatedAt'],depChanged=c=>c.before&&c.after&&c.before.kind==='tasks'&&!S.equal((c.before.data.dependsOn||[]).filter(d=>!gone.has(c.before.projectId+'|'+d)),c.after.data.dependsOn||[]),depTasks=new Set(list.filter(depChanged).map(c=>c.before.projectId+'|'+c.before.id)),extra=[];
 if(depTasks.size){
  list=list.flatMap(c=>{
   const r=c.before||c.after,id=x=>r.projectId+'|'+x;
   if(r.kind==='dependencies')return depTasks.has(id(r.data.successorId))?[]:[c];
   if(depChanged(c)){const rest={...c.after,data:{...c.after.data}};for(const k of CASCADE_FIELDS)if(Object.hasOwn(c.before.data,k))rest.data[k]=c.before.data[k];else delete rest.data[k];extra.push({change:c,request:{action:'patchDependencies',projectId:r.projectId,taskId:r.id,baseRevision:c.baseRevision,dependsOn:c.after.data.dependsOn}});return [{...c,after:rest}];}
   if(r.kind==='tasks'&&c.before&&c.after&&CASCADE_FIELDS.some(k=>!S.equal(c.before.data[k],c.after.data[k]))){const rest={...c.after,data:{...c.after.data}};let onlyCascade=true;for(const k of new Set([...Object.keys(c.before.data),...Object.keys(c.after.data)]))if(!S.equal(c.before.data[k],c.after.data[k])&&!CASCADE_FIELDS.includes(k))onlyCascade=false;return onlyCascade?[]:[c];}
   return [c];
  });
 }
 // 0.8.42: a board deleted with up to 90 items is one call; the server removes the items with it. A bigger board sends its items first (50 per call, below), then the board.
 const bgone=new Set(),bcount=new Map();
 for(const c of list)if(c.before&&!c.after&&c.before.kind==='canvases')bgone.add(c.before.projectId+'|'+c.before.id);
 if(bgone.size){
  const key=c=>{const r=c.before||c.after;return r.projectId+'|'+r.boardId;},child=c=>c.before&&!c.after&&['canvas.objects','canvas.connectors','canvas.threads'].includes(c.before.kind)&&bgone.has(key(c));
  for(const c of list)if(child(c))bcount.set(key(c),(bcount.get(key(c))||0)+1);
  list=list.filter(c=>!(child(c)&&bcount.get(key(c))<=90));
 }
 // Canvas objects removed together become one call per board (up to 50 each). The connectors and comment threads attached to them, and the children that lose their frame, are the server's cascade and are not sent.
 const cgone=new Set(list.filter(c=>c.before&&!c.after&&c.before.kind==='canvas.objects').map(c=>c.before.projectId+'|'+c.before.boardId+'|'+c.before.id)),cdel=list.filter(c=>c.before&&!c.after&&c.before.kind==='canvas.objects');
 if(cgone.size){
  const only=(c,k0)=>{for(const k of new Set([...Object.keys(c.before.data),...Object.keys(c.after.data)]))if(!S.equal(c.before.data[k],c.after.data[k])&&k!==k0&&k!=='updatedAt')return false;return true;};
  list=list.filter(c=>{const r=c.before||c.after,id=x=>r.projectId+'|'+r.boardId+'|'+x;
   if(c.before&&!c.after&&r.kind==='canvas.objects')return false;
   if(!c.after&&r.kind==='canvas.connectors')return !(cgone.has(id(r.data.from))||cgone.has(id(r.data.to)));
   if(!c.after&&r.kind==='canvas.threads')return !cgone.has(id(r.data.objectId));
   if(c.before&&c.after&&r.kind==='canvas.objects'&&c.after.data.groupId===''&&cgone.has(id(c.before.data.groupId))&&only(c,'groupId'))return false;
   return true;});
 }
 const dropped=(c,r)=>{const id=x=>r.projectId+'|'+x;
  if(r.kind==='dependencies'&&!c.after)return gone.has(id(r.data.predecessorId))||gone.has(id(r.data.successorId));
  if(['comments','timeEntries','reminders'].includes(r.kind)&&!c.after)return gone.has(id(r.data.taskId));
  if(r.kind==='tasks'&&c.before&&c.after)return (c.before.data.dependsOn||[]).some(d=>gone.has(id(d)))||gone.has(id(c.before.data.parentId));
  return false;};
 if(gone.size)list=list.filter(c=>c.before&&!c.after&&c.before.kind==='tasks'||!dropped(c,c.before||c.after));

 // 0.8.45: governance lists keep their position as a stored number. A new record joins after the last one and a delete leaves a gap, so those never change anyone else's position (see alignOrders).
// So if an existing record's position still differs here, it is a genuine reorder (items swapped or moved). That cannot be sent yet and stays on the device, "not shared yet".
 for(const c of list)if(c.before&&c.after&&PROJECT_RECORDS.has(c.before.kind)&&c.before.order!==c.after.order)throw notYet('reordering '+c.before.kind.replace('governance.','governance '));
 const wdepthNew=new Map(list.filter(c=>!c.before&&c.after&&c.after.kind==='governance.wbs').map(c=>[c.after.projectId+'|'+c.after.id,c.after.data.parent])),wdepth=c=>{let n=0,id=c.after.data.parent;const k=c.after.projectId+'|';while(id&&wdepthNew.has(k+id)&&n<45){n++;id=wdepthNew.get(k+id);}return n;};
 const wdepthOld=new Map(list.filter(c=>c.before&&!c.after&&c.before.kind==='governance.wbs').map(c=>[c.before.projectId+'|'+c.before.id,c.before.data.parent])),wdeep=c=>{let n=0,id=c.before.data.parent;const k=c.before.projectId+'|';while(id&&wdepthOld.has(k+id)&&n<45){n++;id=wdepthOld.get(k+id);}return n;};
 const newGroup=new Map(list.filter(c=>!c.before&&c.after&&c.after.kind==='canvas.objects').map(c=>[c.after.projectId+'|'+c.after.boardId+'|'+c.after.id,c.after.data.groupId||''])),depth=c=>{let n=0,id=c.after.data.groupId,k=c.after.projectId+'|'+c.after.boardId+'|';while(id&&newGroup.has(k+id)&&n<10){n++;id=newGroup.get(k+id);}return n;},
  rank=c=>c.before&&!c.after?(c.before.kind==='governance.wbs'?-wdeep(c)*0.01:0):!c.before?(c.after.kind==='governance.wbs'?1+wdepth(c)*0.01:c.after.kind==='canvases'?0.5:c.after.kind==='canvas.connectors'?1.5:c.after.kind==='canvas.threads'?1.6:c.after.kind==='canvas.objects'?1+depth(c)*0.01:1):2,order=list.map(c=>({c,built:single(c)})).filter(x=>!x.built.noop).sort((a,b)=>rank(a.c)-rank(b.c)||(a.c.key<b.c.key?-1:a.c.key>b.c.key?1:0));
 const cgroups=new Map();for(const c of cdel.sort((a,b)=>a.key<b.key?-1:1)){const g=c.before.projectId+'|'+c.before.boardId,a=cgroups.get(g)||[];a.push(c);cgroups.set(g,a);}
 const canvasDeletes=[];for(const list2 of cgroups.values())for(let i=0;i<list2.length;i+=50){const part=list2.slice(i,i+50),first=part[0].before;canvasDeletes.push({change:part[0],request:{action:'deleteCanvasObjects',projectId:first.projectId,boardId:first.boardId,objectIds:part.map(c=>c.before.id),bases:Object.fromEntries(part.map(c=>[c.before.id,c.baseRevision]))}});}
 const moves=moveSteps.map(c=>({change:c,request:{action:'moveTask',projectId:c.before.projectId,taskId:c.before.id,baseRevision:c.baseRevision,order:c.after.order}}));
 const steps=[...canvasDeletes,...order.map(x=>({change:x.c,request:x.built.request})),...extra.sort((x,y)=>x.change.key<y.change.key?-1:1),...moves.sort((x,y)=>x.change.key<y.change.key?-1:1)];
 return steps.map((x,i)=>({change:x.change,request:{...x.request,opId:steps.length===1?opId:`${opId}.${i}`}}));
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
   if(result.code==='conflict'&&result.current&&attempt<maxReapply&&body.action==='moveTask'){
    const current=publicRecord(result.current);
    if(current.order!==change.before.order)throw Object.assign(new Error('Someone else moved this task too; compare the versions to resolve it'),{code:'conflict',current});
    body={...body,baseRevision:current.revision};continue;
   }
   if(result.code==='conflict'&&result.current&&attempt<maxReapply&&body.action==='patchDependencies'){
    const current=publicRecord(result.current);
    if(!S.equal(current.data.dependsOn,change.before.data.dependsOn))throw Object.assign(new Error('Someone else changed this task\'s dependencies; compare the versions to resolve it'),{code:'conflict',current});
    body={...body,baseRevision:current.revision};continue;
   }
   if(result.code!=='conflict'||!result.current||attempt>=maxReapply||!['patch','patchCanvas','patchCanvasConnector','patchCanvasThread','patchProjectRecord'].includes(body.action))throw Object.assign(new Error('Someone else changed this record; compare the versions to resolve it'),{code:'conflict',current:result.current?publicRecord(result.current):undefined});
   const current=publicRecord(result.current);
   try{const merged=S.mergeChange(current,{before:change.before,after:change.after});change={key:change.key,before:current,after:merged,baseRevision:current.revision};const built=single(change);if(built.noop)return [];body={...built.request,opId:body.opId};}
   catch(e){if(e.code==='failed-precondition')throw e;throw Object.assign(new Error('Someone else changed the same field; compare the versions to resolve it'),{code:'conflict',current});}
  }
 }
 return async function send(body){
  if(body.action!=='commit')return request(body);
  const records=[];
  for(const step of plan(body.changes,body.mutationId))records.push(...await sendOne(step));
  records.push(...localAcks(body.changes));
  return {records};
 };
}
// pack() numbers records by their position in the app's lists, but a v4 server keeps each record's order fixed (a delete leaves a gap). So that a deleted or added task does not look like a change to every task after it,
// positions are matched back to the stored orders whenever the surviving records are still in the same relative order; new records go after the last stored order. A move of one record is sent as `moveTask`; a bigger reorder is left alone and is refused by requestFor.
const MIN_GAP=1e-9;
// The one survivor whose removal leaves the others in their stored relative order (via the longest increasing run), or null when more than one is out of place.
function oneMoved(kept,old){
 const rank=kept.map(r=>old.get(r.key)),n=rank.length,tails=[],prev=new Array(n).fill(-1),at=[];
 for(let i=0;i<n;i++){let lo=0,hi=tails.length;while(lo<hi){const mid=(lo+hi)>>1;if(rank[tails[mid]]<rank[i]||(rank[tails[mid]]===rank[i]&&kept[tails[mid]].key<kept[i].key))lo=mid+1;else hi=mid;}if(lo>0)prev[i]=tails[lo-1];tails[lo]=i;}
 if(tails.length!==n-1)return null;
 const keep=new Set();for(let i=tails[tails.length-1];i>=0;i=prev[i])keep.add(i);
 for(let i=0;i<n;i++)if(!keep.has(i))return kept[i].key;return null;
}
function alignOrders(next,local){
 const group=r=>r.kind+'|'+r.projectId+'|'+r.boardId,stored=new Map(),groups=new Map();
 for(const r of local){if(!stored.has(group(r)))stored.set(group(r),[]);stored.get(group(r)).push(r);}
 for(const r of next){if(!groups.has(group(r)))groups.set(group(r),[]);groups.get(group(r)).push(r);}
 const orders=new Map();
 for(const [g,list] of groups){
  const old=new Map((stored.get(g)||[]).map(r=>[r.key,r.order])),kept=list.filter(r=>old.has(r.key)),byOld=[...kept].sort((a,b)=>old.get(a.key)-old.get(b.key)||(a.key<b.key?-1:1));
  const sameOrder=kept.every((r,i)=>r.key===byOld[i].key);
  // Exactly one survivor out of place is a real move of one record: it gets a position between its new neighbours (a fractional order, one write on the server); anything more complex is left alone and refused.
  const moved=sameOrder?null:oneMoved(kept,old);if(!sameOrder&&!moved)continue;
  let top=Math.max(-1,...old.values());
  for(const r of list)if(r.key!==moved)orders.set(r.key,old.has(r.key)?old.get(r.key):++top);
  if(moved){
   const at=list.findIndex(r=>r.key===moved),before=list.slice(0,at).reverse().find(r=>orders.has(r.key)),after=list.slice(at+1).find(r=>orders.has(r.key));
   const lo=before?orders.get(before.key):null,hi=after?orders.get(after.key):null;
   const value=lo===null?(hi>0?hi/2:null):hi===null?lo+1:(lo+hi)/2;
   if(value===null||(lo!==null&&hi!==null&&hi-lo<MIN_GAP*2)||(lo===null&&hi<MIN_GAP*2)||value>100000){for(const r of list)orders.delete(r.key);continue;}
   orders.set(moved,value);
  }
 }
 const was=new Map(local.map(r=>[r.key,r]));
 // The update time of a task or a Canvas object is set by the server in a v4 workspace (and the app's own clock reading is never sent), so the two can never agree.
 // A record that already exists keeps the stored value, so that an edit never shows up as a change of the update time and a later edit is not mistaken for a concurrent change to it.
 const keepStamp=r=>{const old=was.get(r.key);if(!old||!['tasks','canvas.objects'].includes(r.kind)||S.equal(old.data.updatedAt,r.data.updatedAt))return r;const data={...r.data};if(Object.hasOwn(old.data,'updatedAt'))data.updatedAt=old.data.updatedAt;else delete data.updatedAt;return {...r,data};};
 return next.map(r=>keepStamp(orders.has(r.key)&&orders.get(r.key)!==r.order?{...r,order:orders.get(r.key)}:r));
}
module.exports={alignOrders,plan,requestFor,createSender,publicRecord,localAcks};
