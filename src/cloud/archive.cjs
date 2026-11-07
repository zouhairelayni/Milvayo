// /src/cloud/archive.cjs
'use strict';
const S=require('./schema.cjs');
const {sha256}=require('js-sha256');
const hash=value=>sha256(S.stable(value));
const FAMILIES=['messages','conversations','watchers','notifications'];
function normalizeExtras(extras={},actor){
 const out={};for(const family of FAMILIES){const rows=extras[family]||[];if(!Array.isArray(rows)||rows.length>20000)throw Error('Invalid cloud collaboration archive');
  out[family]=rows.map(row=>{S.segment(row.id);S.assertJson(row.data);const data={...row.data,restored:true,restoredBy:actor};if(family==='notifications')data.read=true;return {id:row.id,data};}).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
  if(new Set(out[family].map(r=>r.id)).size!==out[family].length)throw Error('Duplicate collaboration archive ID');
 }return out;
}
function validateExtras(extras,records){
 if(!extras||Object.keys(extras).some(k=>!FAMILIES.includes(k))||FAMILIES.some(k=>!Array.isArray(extras[k])||extras[k].length>20000||new Set(extras[k].map(r=>r.id)).size!==extras[k].length))throw Error('Invalid collaboration archive families or duplicate IDs');
 const projects=new Set(records.filter(r=>r.kind==='projects').map(r=>r.projectId)),messages=new Map((extras.messages||[]).map(r=>[r.id,r.data])),threads=new Map((extras.conversations||[]).map(r=>[r.id,r.data])),sequences=new Set();
 for(const family of FAMILIES)for(const {id,data} of extras[family]||[]){S.segment(id);S.assertJson(data);if(!projects.has(data.projectId))throw Error('Archived collaboration project is unavailable');S.segment(data.threadId);
  if(data.threadId!=='project'&&(!data.taskId||data.threadId!=='task-'+data.taskId||!records.some(r=>r.kind==='tasks'&&r.projectId===data.projectId&&r.id===data.taskId)))throw Error('Archived conversation task is missing');
  if(family==='messages'){S.segment(data.actor);if(id!==data.id||typeof data.body!=='string'||!data.body.trim()||data.body.length>4000||!Number.isSafeInteger(data.sequence)||data.sequence<1||!Number.isSafeInteger(data.at)||!Array.isArray(data.mentions)||data.mentions.length>20)throw Error('Invalid archived message');data.mentions.forEach(S.segment);const thread=threads.get(hash([data.projectId,data.threadId])),seqKey=hash([data.projectId,data.threadId,data.sequence]);if(!thread||thread.sequence<data.sequence||sequences.has(seqKey))throw Error('Archived conversation sequence is invalid');sequences.add(seqKey);}
  if(family==='conversations'&&(id!==hash([data.projectId,data.threadId])||!Number.isSafeInteger(data.sequence)||data.sequence<0))throw Error('Invalid archived conversation');
  if(family==='watchers'||family==='notifications')S.segment(data.uid);
  if(family==='watchers'&&id!==hash([data.projectId,data.threadId,data.uid]))throw Error('Invalid archived watcher');
  if(family==='notifications'&&(!messages.has(data.messageId)||id!==hash([data.messageId,data.uid])||messages.get(data.messageId).projectId!==data.projectId||messages.get(data.messageId).threadId!==data.threadId))throw Error('Archived notification message is missing');
 }
 return true;
}
module.exports={FAMILIES,normalizeExtras,validateExtras};
