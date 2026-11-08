// /tests/cloud/cost-simulator.test.cjs
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {calibratedProjection,PROFILES,OPERATIONS,WORKSPACES,getCalibration}=require('../../src/cloud/tools/costSimCore.cjs');
function fakePilot(){
 const samples=[];
 const add=(tasks,kind,reads,writes,firstRevision=false)=>samples.push({tasks,kind,role:'owner',ok:true,reads,writes,deletes:0,functionMs:100,firstRevision});
 for(const tasks of [100,500]){
  add(tasks,'title',6,6,true);add(tasks,'owner',6,6,true);add(tasks,'status',8,7,true);
  add(tasks,'due',tasks+9,6,true);add(tasks,'softDelete',tasks+10,7,true);add(tasks,'restore',tasks+10,6,false);
  add(tasks,'coldPull',tasks+7,0,false);add(tasks,'resumePull',3,0,false);
  add(tasks,'message',null,null,false);add(tasks,'messages',null,null,false);
 }
 return {schema:'milvayo-cost-pilot-v1',generatedAt:'2026-11-08T00:00:00.000Z',samples};
}
test('profiles, operation mix and workspace size mix each sum to one',()=>{
 assert.ok(Math.abs(PROFILES.reduce((s,p)=>s+p.populationShare,0)-1)<1e-10);
 assert.ok(Math.abs(Object.values(OPERATIONS).reduce((s,x)=>s+x,0)-1)<1e-10);
 assert.ok(Math.abs(WORKSPACES.reduce((s,x)=>s+x.share,0)-1)<1e-10);
});
test('projection does not fabricate observations for 2000 tasks',()=>{
 const p=fakePilot();assert.equal(getCalibration(p.samples,'due',2000).reads,2009);
 assert.match(getCalibration(p.samples,'due',2000).source,/extrapolated/);
 const report=calibratedProjection(p);assert.equal(report.calibration[2000].due.source,'extrapolated-from-100-and-500');
 assert.match(report.uncertainties.join(' '),/NOT covered/);
});
test('scenarios scale usage linearly but apply free quotas after aggregating usage',()=>{
 const report=calibratedProjection(fakePilot());assert.deepEqual(report.results.map(r=>r.users),[100,1000,10000,100000]);
 for(const [i,r] of report.results.entries()){
  assert.ok(r.usage.firestoreReads>0&&r.usage.firestoreWrites>0);
  assert.equal(r.usage.firestoreDeletes,0);
  assert.equal(Object.hasOwn(r.usage,'rtdbDownloadGB'),false);
  assert.ok(r.knownSubtotalUSD>=0);
  if(i){const prev=report.results[i-1];assert.ok(Math.abs(r.usage.firestoreReads/prev.usage.firestoreReads-r.users/prev.users)<.00001);}
 }
});
test('explicit RTDB assumption changes subtotal and remains marked as modeled',()=>{
 const no=calibratedProjection(fakePilot(),{populations:[10000]}),withRTDB=calibratedProjection(fakePilot(),{populations:[10000],rtdbKBPerActiveDay:250});
 assert.ok(withRTDB.results[0].knownSubtotalUSD>no.results[0].knownSubtotalUSD);
 assert.ok(withRTDB.results[0].usage.rtdbDownloadGB>0);
 assert.match(withRTDB.uncertainties.at(-1),/not measured/i);
});
test('invalid and incomplete pilots fail without substituting imaginary values',()=>{
 assert.throws(()=>calibratedProjection({}),/Valid pilot/);
 const p=fakePilot();p.samples=p.samples.filter(x=>!(x.kind==='status'&&x.tasks===500));
 assert.throws(()=>calibratedProjection(p),/Insufficient successful pilot calibration/);
});
