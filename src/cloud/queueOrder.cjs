// /src/cloud/queueOrder.cjs
'use strict';
// Decides which queued edit may be sent next (0.8.29, audit finding F1).
// Before: the queue was strictly one at a time, so one refused edit (a conflict) or one retry delay froze every edit behind it.
// Now: an edit that is stuck only holds back later edits that DEPEND on it. Independent edits keep going.
// Later edit L is held behind an earlier stuck edit E when:
//   1. they touch the same record (their order must never change), or
//   2. E creates or deletes a record that L refers to (a connector needs its note, a comment needs its task, a project's records need the project), or
//   3. L creates or deletes a record that E refers to (never delete what a waiting edit still points to), or
//   4. both are queued chat messages (messages keep their order).
// The rule is deliberately cautious: when in doubt it holds the later edit back (the old behaviour), it never reorders edits of one record.
const cache=new WeakMap();// queue items are frozen objects, so a footprint is computed once per item
function footprint(q){
 let f=cache.get(q);if(f)return f;
 f={request:!!q.request,keys:new Set(),ownStructural:new Set(),refs:new Set()};
 for(const c of q.request?[]:q.changes){
  const r=c.after||c.before,p=r.projectId||'',structural=!c.before||!c.after,own=[p+'|'+r.id];
  if(r.kind==='projects')own.push('proj:'+r.id);
  f.keys.add(c.key);if(structural)for(const t of own)f.ownStructural.add(t);
  if(p)f.refs.add('proj:'+p);if(r.boardId)f.refs.add(p+'|'+r.boardId);
  const walk=(v,depth)=>{if(typeof v==='string'){if(v&&v.length<=400)f.refs.add(p+'|'+v);}else if(depth<3&&v&&typeof v==='object')for(const x of Array.isArray(v)?v:Object.values(v))walk(x,depth+1);};
  walk(r.data,0);
 }
 cache.set(q,f);return f;
}
const meets=(a,b)=>{for(const x of a)if(b.has(x))return true;return false;};
// True when `later` must wait for the unresolved `earlier` edit.
function dependsOn(later,earlier){
 const L=footprint(later),E=footprint(earlier);
 if(L.request||E.request)return L.request&&E.request;
 return meets(L.keys,E.keys)||meets(E.ownStructural,L.refs)||meets(L.ownStructural,E.refs);
}
// One state per queued edit, in queue order:
//   conflict = refused for good, needs a decision; local = kept on this device, the cloud cannot take it yet (0.8.35), localheld = waits behind such an edit; waiting = retry delay running;
//   held = waits for an earlier stuck edit it depends on; ready = may be sent now.
function classify(queue,now){
 const out=[],stuck=[],stuckIdx=[];
 for(const q of queue){
  let state;
  if(q.status==='conflict')state='conflict';
  else if(q.status==='local')state='local';
  else if((q.nextAttempt||0)>now)state='waiting';
  else{const blocker=stuck.findIndex(e=>dependsOn(q,e));
   // Behind an edit that is kept on this device (the cloud cannot take it yet) an edit is also "not shared yet", it must not count as waiting forever (0.8.35).
   state=blocker<0?'ready':['local','localheld'].includes(out[stuckIdx[blocker]])?'localheld':'held';}
  if(state!=='ready'){stuck.push(q);stuckIdx.push(out.length);}
  out.push(state);
 }
 return out;
}
// The next edit to send: the first ready one in queue order, or null.
function nextRunnable(queue,now){
 const states=classify(queue,now),i=states.indexOf('ready');
 return i<0?null:queue[i];
}
module.exports={footprint,dependsOn,classify,nextRunnable};
