// /src/cloud/costModel.cjs
'use strict';
function estimate(usage,table,{days=30}={}){
 if(!table?.region||!table.rates||!Number.isInteger(days)||days<1||days>366)throw Error('Select a valid region, price table and billing period');
 const rows=[],reads=['firestoreReads','indexEntryReads','ruleDependentReads'];let remainingReadAllowance=(table.rates.firestoreReads?.free||0)*days;
 for(const [key,amount] of Object.entries(usage)){
  if(!Number.isFinite(amount)||amount<0)throw Error('Invalid usage for '+key);
  const rate=table.rates[key];if(!rate){if(amount)rows.push({component:key,quantity:amount,cost:null,reason:'Unit price not configured'});continue;}
  if(rate.price!==null&&(!Number.isFinite(rate.price)||rate.price<0))throw Error('Invalid unit price for '+key);
  const free=reads.includes(key)?Math.min(amount,remainingReadAllowance):(rate.free||0)*(rate.period==='day'?days:1);if(reads.includes(key))remainingReadAllowance-=free;
  const billable=Math.max(0,amount-free),cost=rate.price===null&&billable>0?null:billable*(rate.price||0);
  rows.push({component:key,quantity:amount,free,billable,unit:rate.unit,unitPrice:rate.price,source:rate.source,cost});
 }
 return {region:table.region,asOf:table.asOf,days,currency:'USD',components:rows,knownSubtotal:rows.reduce((s,r)=>s+(r.cost||0),0),unpriced:rows.filter(r=>r.cost===null).map(r=>r.component),certifiedBill:false};
}
function projectUsage(users,variant,{days=30,tasksPerWorkspace=500,actionsPerUserDay=30,viewers=10,pollsPerUserDay=240,conversationPollsPerUserDay=120,messagesPerUserDay=3,watchers=5,simpleMutationShare=.8,simpleReads=6,simpleWrites=5,retryMultiplier=1,postSaveRefreshesPerUserDay=actionsPerUserDay,postSaveRefreshReads=4}={}){
 if(!Number.isFinite(simpleMutationShare)||simpleMutationShare<0||simpleMutationShare>1||![simpleReads,simpleWrites,retryMultiplier,postSaveRefreshesPerUserDay,postSaveRefreshReads].every(n=>Number.isFinite(n)&&n>=0))throw Error('Invalid mutation budget');
 const optimizedMutations=['v085-mutations','v085-combined','v085-stress'].includes(variant),optimizedPolling=['v085-polling','v085-combined','v085-stress'].includes(variant);
 if(optimizedPolling){const {simulatePolling}=require('./polling.cjs');pollsPerUserDay=simulatePolling({durationMs:pollsPerUserDay*5000}).requests;conversationPollsPerUserDay=simulatePolling({durationMs:conversationPollsPerUserDay*3000,activeMs:3000,idleMs:30000,hiddenMs:120000}).requests;}
 const comparison=variant==='v084-baseline'||typeof variant==='string'&&variant.startsWith('v085-'),postSaveRefreshes=comparison?users*postSaveRefreshesPerUserDay*days:0;
 const actions=users*actionsPerUserDay*days,naive=variant==='full-record-resave',summary=variant==='summaries',high=variant==='high-concurrency';
 const changed=naive?tasksPerWorkspace:1,readsPerMutation=(optimizedMutations?simpleMutationShare*simpleReads+(1-simpleMutationShare)*(tasksPerWorkspace+8):tasksPerWorkspace+8)*(variant==='v085-stress'?retryMultiplier:1),writesPerMutation=optimizedMutations?simpleMutationShare*simpleWrites+(1-simpleMutationShare)*6:2*changed+4,chatPolls=users*conversationPollsPerUserDay*days,messages=users*messagesPerUserDay*days,chatReads=chatPolls*7+messages*(6+watchers*3),requests=actions+users*pollsPerUserDay*days+chatPolls+messages+postSaveRefreshes;
 return {firestoreReads:actions*(readsPerMutation+(high?viewers:0))+users*days*(variant==='incremental'?tasksPerWorkspace*4:summary?4:tasksPerWorkspace)+users*pollsPerUserDay*days*3+chatReads+postSaveRefreshes*postSaveRefreshReads,firestoreWrites:actions*writesPerMutation+messages*(3+watchers),firestoreDeletes:0,indexEntryReads:0,ruleDependentReads:0,firestoreStorageGiB:users*20000/2**30,firestoreEgressGiB:0,functionRequests:requests,functionCpuSeconds:requests*.25,functionGiBSeconds:requests*.25*.25,functionEgressGiB:users*days*.002,rtdbStorageGB:users*200/1e9,rtdbDownloadGB:users*days*.001,hostingStorageGB:0,hostingTransferGB:0,storageGB:0,storageUploads:0,storageDownloads:0,appCheckAssessments:0,secretAccesses:0,schedulerJobs:0,eventDeliveries:0,loggingGiB:0,cloudBuildMinutes:0,artifactStorageGB:0,backupGiB:0,pitrGiB:0,restoreGiB:0,cloneGiB:0,enterpriseIdentityMAU:0};
}
module.exports={estimate,projectUsage};
