// /src/cloud/conflictGone.cjs
'use strict';
// Decides whether a record in a conflict was DELETED by someone else (0.8.30, audit finding F2).
// A full cloud read leaves deleted records out, so "not found" alone is not enough: it also happens when access to the project was removed,
// or when a create has not reached the cloud yet. A record counts as deleted only when ALL of these hold:
//   1. my queued change edits or deletes a record that existed (it has a "before" copy; a create is never "deleted"),
//   2. the cloud read has no live copy of it,
//   3. its project is still readable in that cloud read (otherwise it is an access problem, not a deletion),
//   4. there is evidence of deletion: this device holds the deleted marker, or the server refused with a "deleted" message.
function isGone(change,queued,cloudRecords,journalRecords){
 if(!change.before)return false;
 if(cloudRecords.some(r=>r.key===change.key&&!r.deleted))return false;
 const projectId=change.before.projectId;
 if(projectId&&!cloudRecords.some(r=>r.kind==='projects'&&!r.deleted&&r.projectId===projectId))return false;
 const marker=journalRecords.find(r=>r.key===change.key);
 return !!(marker&&marker.deleted)||/deleted/i.test(queued.error||'');
}
module.exports={isGone};
