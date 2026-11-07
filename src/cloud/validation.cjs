// /src/cloud/validation.cjs
'use strict';
const S=require('./schema.cjs'),model=require('../domain/model.cjs');
function validateTransition(beforeRecords,afterRecords){
 const before=S.unpack(beforeRecords),after=S.unpack(afterRecords);
 for(const p of after.projects){const old=before.projects.find(v=>v.id===p.id);if(!old)continue;
  for(const t of p.tasks){const previous=old.tasks.find(v=>v.id===t.id);if(!previous){if(t.status==='Done'&&model.blockers(p,t).length)throw Error('Complete dependency tasks before Done');if(t.verified&&!model.canVerify(t)||t.merged&&!model.canMerge(t))throw Error('New task verification requires evidence');continue;}if(S.equal(previous,t))continue;
   if(previous.status!==t.status){model.taskSchema.checkTransition(old,previous,t.status);if(t.status==='Done'&&model.blockers(p,t).length)throw Error('Complete dependency tasks before Done');}
   if((!previous.verified&&t.verified||['tests','evidence','actual'].some(k=>!S.equal(previous[k],t[k]))&&t.verified)&&!model.canVerify(t))throw Error('Verification requires passing checks and evidence');
   if((!previous.merged&&t.merged||['tests','evidence','actual','mainSha'].some(k=>!S.equal(previous[k],t[k]))&&t.merged)&&!model.canMerge(t))throw Error('Merge checkpoint requires verification and a recorded SHA');
  }
  for(const r of p.releases){const previous=old.releases.find(v=>v.id===r.id);if(r.status==='Released'&&previous?.status!=='Released'&&!model.canRelease(r,p))throw Error('Release gates have not passed');}
  model.agile.validateLifecycleChange(old,p);
 }
 return true;
}
module.exports={validateTransition};
