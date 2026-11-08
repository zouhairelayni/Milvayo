// /src/cloud/tools/costSimCore.cjs
'use strict';
const {estimate}=require('../costModel.cjs');
const priceTable=require('../../../docs/cloud/prices-us-central1.json');

// Editable illustrative MAU behavior assumptions, NOT observed Milvayo analytics.
const PROFILES=Object.freeze([
 {name:'casual',populationShare:.50,activeDays:8,actionsPerActiveDay:5,sessionMinutes:8,messagesPerActiveDay:.15,chatReadsPerActiveDay:1,remoteChangePullsPerActiveDay:1},
 {name:'regular',populationShare:.35,activeDays:18,actionsPerActiveDay:15,sessionMinutes:20,messagesPerActiveDay:.7,chatReadsPerActiveDay:3,remoteChangePullsPerActiveDay:3},
 {name:'power',populationShare:.15,activeDays:26,actionsPerActiveDay:40,sessionMinutes:60,messagesPerActiveDay:2,chatReadsPerActiveDay:8,remoteChangePullsPerActiveDay:10}
]);
const OPERATIONS=Object.freeze({title:.35,owner:.15,status:.20,due:.20,softDelete:.07,restore:.03});
const WORKSPACES=Object.freeze([{tasks:100,share:.55},{tasks:500,share:.35},{tasks:2000,share:.10}]);
const POPULATIONS=[100,1000,10000,100000];
const sum=a=>a.reduce((x,y)=>x+y,0);
const mean=arr=>arr.length?sum(arr)/arr.length:null;
const num=(n,label)=>{if(!Number.isFinite(n)||n<0)throw Error('Invalid '+label);return n;};
function checkDistribution(rows,share){const s=sum(rows.map(r=>r[share]));if(Math.abs(s-1)>1e-8)throw Error('Distribution must sum to 1 (got '+s+')');}
function activeBaseline(rows,kind,tasks){
 const exact=rows.filter(x=>x.kind===kind&&x.tasks===tasks&&x.role==='owner'&&x.ok&&Number.isFinite(x.reads)&&Number.isFinite(x.writes));
 if(!exact.length)return null;
 const r=mean(exact.map(x=>x.reads)),w=mean(exact.map(x=>x.writes));
 const ms=mean(exact.map(x=>x.functionMs).filter(Number.isFinite));
 return {reads:r,writes:w,deletes:mean(exact.map(x=>x.deletes)),functionMs:ms,samples:exact.length,firstRevision:exact.some(x=>x.firstRevision===true),source:'observed'};
}
function getCalibration(samples,kind,tasks){
 const actual=activeBaseline(samples,kind,tasks);
 if(actual)return actual;
 if(tasks===2000){
  const at500=activeBaseline(samples,kind,500),at100=activeBaseline(samples,kind,100);
  if(at500&&at100){
   // Extrapolation is allowed only if observed 100→500 reads obey the
   // expected constant-or-linear pattern. It is still NOT a 2000-task test.
   const delta=at500.reads-at100.reads;
   if(Math.abs(delta)<1e-8||Math.abs(delta-400)<1e-8)return {...at500,reads:at500.reads+(delta/400)*1500,source:'extrapolated-from-100-and-500'};
  }
 }
 return null;
}
function timeOf(samples,kind,fallback=null){const values=samples.filter(x=>x.kind===kind&&x.ok&&Number.isFinite(x.functionMs)).map(x=>x.functionMs);return mean(values)??fallback;}
function calibratedProjection(pilot,{populations=POPULATIONS,days=30,rtdbKBPerActiveDay=null,firstTouchShare=.25}={}){
 if(!pilot||pilot.schema!=='milvayo-cost-pilot-v1'||!Array.isArray(pilot.samples))throw Error('Valid pilot JSON required');
 num(firstTouchShare,'firstTouchShare');if(firstTouchShare>1)throw Error('firstTouchShare must be <= 1');
 if(!Number.isInteger(days)||days<1||days>366)throw Error('Invalid days');
 if(rtdbKBPerActiveDay!==null)num(rtdbKBPerActiveDay,'rtdbKBPerActiveDay');
 checkDistribution(PROFILES,'populationShare');checkDistribution(WORKSPACES,'share');
 if(Math.abs(sum(Object.values(OPERATIONS))-1)>1e-8)throw Error('Operations must sum to 1');
 const missing=[];const calibrated={};
 for(const {tasks} of WORKSPACES){calibrated[tasks]={};for(const kind of Object.keys(OPERATIONS)){
  const v=getCalibration(pilot.samples,kind,tasks);if(!v)missing.push(`${kind} / ${tasks} tasks`);else calibrated[tasks][kind]=v;
 }}
 if(missing.length)throw Error('Insufficient successful pilot calibration: '+missing.join(', '));
 const resume=activeBaseline(pilot.samples,'resumePull',100)||activeBaseline(pilot.samples,'resumePull',500);
 const cold=WORKSPACES.map(x=>({tasks:x.tasks,share:x.share,value:activeBaseline(pilot.samples,'coldPull',x.tasks)}));
 if(!resume||cold.some(x=>!x.value&&x.tasks!==2000))throw Error('Pilot lacks cold/resume pull measurements');
 const firstPullBySize=(tasks)=>{
  const actual=activeBaseline(pilot.samples,'coldPull',tasks);if(actual)return actual;
  const at500=activeBaseline(pilot.samples,'coldPull',500),at100=activeBaseline(pilot.samples,'coldPull',100);
  return {...at500,reads:at500.reads+((at500.reads-at100.reads)/400)*1500,source:'extrapolated-from-100-and-500'};
 };
 const messagesMs=timeOf(pilot.samples,'message',null),chatReadMs=timeOf(pilot.samples,'messages',null),pullMs=timeOf(pilot.samples,'resumePull',null);
 const uncertainties=['Not a measured monthly billing total: estimates use Firebase price table dated '+priceTable.asOf+'.',
  'Workload distributions, active days, operation mix and first-touch share are illustrative inputs, not real user analytics.',
  'Reads and writes are server instrumentation for successful responses, not certified billed usage; failed retries, rules-dependent reads and indexes are excluded.',
  'Cold-pull and canonical-edit readings at 2000 tasks are inferred from measured 100/500-task slopes, not executed at 2000 tasks in this pilot.',
  'For first-touch writes, subtracts one historical-version write on repeated edits where the sampled first edit created it.',
  'Conversation Firestore operations are uninstrumented; 7 reads/3 writes per sent message, 6 reads per chat fetch are provisional model assumptions, not measurements.',
  'Function compute is modeled using 1 vCPU, 512MiB and measured per-request wall durations; actual Cloud Run shared concurrency, rounding and idle billing can differ.',
  'Physical cleanup deletes, RTDB signal traffic, storage growth, hosting, backup, network egress, auth, security-rule dependent reads and any unpriced components are NOT covered.',
  'All user cohorts are modeled on one Firebase project with one set of free allowances; charges and quota behavior differ across separate projects.'];
 if(rtdbKBPerActiveDay===null)uncertainties.push('RTDB download traffic is intentionally excluded until measured or explicitly supplied.');
 else uncertainties.push('RTDB traffic uses the explicit '+rtdbKBPerActiveDay+' KB/active user-day assumption; it was not measured.');
 const results=[];
 for(const users of populations){num(users,'population');
  const totals={firestoreReads:0,firestoreWrites:0,firestoreDeletes:0,functionRequests:0,functionCpuSeconds:0,functionGiBSeconds:0};
  let mutations=0,chatMessages=0,chatFetches=0,activeUserDays=0,coldStarts=0;
  const addFunction=(count,ms)=>{totals.functionRequests+=count;if(Number.isFinite(ms)){const sec=count*ms/1000;totals.functionCpuSeconds+=sec;totals.functionGiBSeconds+=sec*.5;}};
  const profileDetail=[];
  for(const profile of PROFILES){
   const count=users*profile.populationShare,active=count*profile.activeDays,actions=active*profile.actionsPerActiveDay;
   const messages=active*profile.messagesPerActiveDay,chatFetch=active*profile.chatReadsPerActiveDay;
   activeUserDays+=active;mutations+=actions;chatMessages+=messages;chatFetches+=chatFetch;
   for(const {tasks,share} of WORKSPACES){
    for(const [kind,opShare] of Object.entries(OPERATIONS)){
     const sample=calibrated[tasks][kind],times=actions*opShare*share;
     totals.firestoreReads+=times*sample.reads;
     // The pilot edits different revision-1 tasks; only those writes have an extra
     // historical version. An edit of a later revision avoids that write.
     const firstVersionExtra=sample.firstRevision?1:0;
     totals.firestoreWrites+=times*(sample.writes-firstVersionExtra*(1-firstTouchShare));
     totals.firestoreDeletes+=times*sample.deletes;
     addFunction(times,sample.functionMs);
    }
    // Returning sessions reuse cursor; approximate just one cold hydration per
    // active user per month, not one for every daily session.
    const coldUsers=count*share,coldData=firstPullBySize(tasks);
    totals.firestoreReads+=coldUsers*coldData.reads;
    addFunction(coldUsers,coldData.functionMs);
    coldStarts+=coldUsers;
   }
   const resumePulls=active*(1+Math.ceil(profile.sessionMinutes/5)+profile.remoteChangePullsPerActiveDay);
   totals.firestoreReads+=resumePulls*resume.reads;
   addFunction(resumePulls,pullMs);
   // Conversation operations are model assumptions until instrumented in server.
   totals.firestoreReads+=messages*7+chatFetch*6;
   totals.firestoreWrites+=messages*3;
   addFunction(messages,messagesMs??pullMs);
   addFunction(chatFetch,chatReadMs??pullMs);
   profileDetail.push({profile:profile.name,users:count,activeUserDays:active,mutations:actions,messages,chatFetches:chatFetch,resumePulls});
  }
  if(rtdbKBPerActiveDay!==null)totals.rtdbDownloadGB=activeUserDays*rtdbKBPerActiveDay/1e6;
  const usage=Object.fromEntries(Object.entries(totals).map(([k,v])=>[k,Number(v.toFixed(4))]));
  const cost=estimate(usage,priceTable,{days});
  results.push({users,activeUserDays,mutations,chatMessages,chatFetches,coldStarts,usage,knownSubtotalUSD:cost.knownSubtotal,components:cost.components,profileDetail});
 }
 return {schema:'milvayo-cost-projection-v1',generatedAt:new Date().toISOString(),pilotGeneratedAt:pilot.generatedAt,days,priceTableDate:priceTable.asOf,region:priceTable.region,firstTouchShare,rtdbKBPerActiveDay,profiles:PROFILES,operations:OPERATIONS,workspaces:WORKSPACES,calibration:calibrated,results,uncertainties,certifiedBill:false};
}
module.exports={calibratedProjection,PROFILES,OPERATIONS,WORKSPACES,POPULATIONS,getCalibration};
