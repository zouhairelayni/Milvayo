// /src/cloud/recovery.cjs
'use strict';
const S=require('./schema.cjs');
const {sha256}=require('js-sha256');
function verifyBackup(backup){
 if(!['milvayo.cloud.backup.v1','milvayo.cloud.backup.v2'].includes(backup?.format)||backup.schema!==S.SCHEMA||!Array.isArray(backup.records))throw Error('Unsupported cloud backup');
 if(sha256(S.stable(backup.records))!==backup.checksum)throw Error('Cloud backup checksum mismatch');
 if(backup.format==='milvayo.cloud.backup.v2'&&sha256(S.stable({records:backup.records,extras:backup.extras}))!==backup.dataChecksum)throw Error('Cloud collaboration backup checksum mismatch');
 if(new Set(backup.records.map(r=>r.key)).size!==backup.records.length)throw Error('Duplicate backup record ID');
 for(const r of backup.records)if(r.key!==S.keyOf(r.kind,r.projectId,r.id,r.boardId))throw Error('Invalid backup record path');
 S.validateRecords(backup.records);
 if(backup.format==='milvayo.cloud.backup.v2')require('./archive.cjs').validateExtras(backup.extras,backup.records);
 return backup;
}
function previewRestore(current,backup,{projectId='',key='',taskId=''}={}){
 verifyBackup(backup);
 const selected=backup.records.filter(r=>(!projectId||r.projectId===projectId)&&(!key||r.key===key)&&(!taskId||(r.kind==='tasks'&&r.id===taskId)||r.data.taskId===taskId));
 if(!selected.length)throw Error('No recovery records matched');
 const map=new Map(current.map(r=>[r.key,r]));for(const r of selected)map.set(r.key,r);
 const candidate=[...map.values()];S.validateRecords(candidate);
 const changes=S.diff(current.filter(r=>!r.deleted),candidate.filter(r=>!r.deleted));
 return {changes,affected:changes.map(c=>({key:c.key,action:!c.before?'create':!c.after?'delete':'replace'})),records:candidate};
}
module.exports={previewRestore,verifyBackup};
