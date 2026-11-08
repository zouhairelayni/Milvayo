// /src/cloud/tools/cost3.cjs
'use strict';
// Modeled projections for Firebase v3.0. Assumptions are inputs, not observed behavior; sensitivity rows show how much each one matters.
const fs=require('node:fs'),{estimate,projectUsage}=require('../costModel.cjs');
const table=JSON.parse(fs.readFileSync(process.argv[2]||'docs/cloud/prices-us-central1.json','utf8')),out='docs/qa/cloud-v3';
const base={days:30,actionsPerUserDay:30,tasksPerWorkspace:500,simpleMutationShare:.8,simpleReads:6,simpleWrites:5,retryMultiplier:2,pollsPerUserDay:240,conversationPollsPerUserDay:120,messagesPerUserDay:3,watchers:5,postSaveRefreshesPerUserDay:30,postSaveRefreshReads:4};
const variants=['v085-combined','v3-mutations','v3-signal','v3-combined'],rows=[];
// Mutation mixes: [share that is a simple field edit, share that is a workflow/status move]. The remainder still needs a full project scan.
const mixes=[[.8,0],[.8,.1],[.8,.2],[.5,0],[.5,.25],[.5,.5]];
for(const users of [100,1000,10000])for(const sessionMinutesPerUserDay of [20,120,480])for(const [simpleMutationShare,workflowMutationShare] of mixes)for(const variant of variants){
 const usage=projectUsage(users,variant,{...base,simpleMutationShare,sessionMinutesPerUserDay,workflowMutationShare}),cost=estimate(usage,table);
 rows.push({users,variant,sessionMinutesPerUserDay,simpleMutationShare,workflowMutationShare,monthly:cost.knownSubtotal,reads:usage.firestoreReads,writes:usage.firestoreWrites,requests:usage.functionRequests});
}
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(out+'/cost-projections.json',JSON.stringify({source:'Modeled workload, not observed user behavior or certified Firebase bill',scope:'Known infrastructure subtotal only. Function concurrency credit is NOT modeled (CPU-seconds per request unchanged).',assumptions:base,rows},null,2)+'\n');
fs.writeFileSync(out+'/cost-projections.csv','users,variant,session_minutes,simple_share,workflow_share,known_monthly_usd,reads,writes,requests\n'+rows.map(r=>[r.users,r.variant,r.sessionMinutesPerUserDay,r.simpleMutationShare,r.workflowMutationShare,r.monthly.toFixed(2),Math.round(r.reads),Math.round(r.writes),Math.round(r.requests)].join(',')).join('\n')+'\n');
const pick=(users,variant,s,[a,w])=>rows.find(r=>r.users===users&&r.variant===variant&&r.sessionMinutesPerUserDay===s&&r.simpleMutationShare===a&&r.workflowMutationShare===w).monthly.toFixed(2);
console.log('1,000 users, known monthly USD (v0.8.5 combined -> v3 combined)');
for(const s of [20,120,480])for(const mix of mixes)console.log(`session ${s} min, simple ${mix[0]*100}% workflow ${mix[1]*100}%: ${pick(1000,'v085-combined',s,mix)} -> ${pick(1000,'v3-combined',s,mix)}`);
