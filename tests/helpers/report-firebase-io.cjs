// /tests/helpers/report-firebase-io.cjs
'use strict';
// Report all dispatched cloudApi actions, including missing and error-only cases.
// Executed after the real Firebase emulator suite. Counts reflect intercepted SDK calls, NOT Firebase billing.
const fs=require('node:fs'),path=require('node:path');
const log=process.argv[2];const output=process.argv[3]||process.env.HOME||process.cwd();
if(!log||!fs.existsSync(log)){console.error('Usage: node tests/helpers/report-firebase-io.cjs <firebase-emulator.log> [output-directory]');process.exit(2);}
fs.mkdirSync(output,{recursive:true});
function inventory(){
 const server='src/cloud/server/';
 const patterns=[['collaboration.cjs','return {watch,'],['administration.cjs','return {groupSave,'],['patch.cjs','return {patch,']];
 const names=[];
 for(const [name,marker] of patterns){const text=fs.readFileSync(server+name,'utf8'),start=text.lastIndexOf(marker);if(start<0)throw Error('Missing action inventory marker '+name);const end=text.indexOf('};',start);if(end<0)throw Error('Missing action inventory closing '+name);names.push(...text.slice(start+8,end).split(',').map(x=>x.trim()).filter(Boolean));}
 const text=fs.readFileSync(server+'service.cjs','utf8');const m=/const handlers=\{([^;]+)\};/.exec(text);if(!m)throw Error('Missing service dispatch inventory');const tail=m[1].split('patchHandlers(context),')[1];if(!tail)throw Error('Service dispatch format changed');names.push(...tail.split(',').map(x=>x.split(':')[0].trim()).filter(Boolean));
 return [...new Set(names)].sort();
}
const known=inventory(),raw=fs.readFileSync(log,'utf8'),prefix='[MILVAYO_IO_AUDIT] ';const entries=[],failures=[];
for(const line of raw.split(/\r?\n/)){
 const at=line.indexOf(prefix);if(at<0)continue;
 const fragment=line.slice(at+prefix.length);const end=fragment.lastIndexOf('}');if(end<0){failures.push('Malformed audit event');continue;}
 try{const record=JSON.parse(fragment.slice(0,end+1));if(record.tag!=='milvayo-v4-io-audit'){failures.push('Wrong audit tag');continue;}entries.push(record);}catch(e){failures.push('Unparseable audit event');}
}
const percentile=(numbers,q)=>numbers.length?numbers.slice().sort((a,b)=>a-b)[Math.min(numbers.length-1,Math.ceil(numbers.length*q)-1)]:null;
const sum=(items,fn)=>items.reduce((v,x)=>v+(fn(x)||0),0),fmt=n=>Number.isFinite(n)?+n.toFixed(2):null;
const records=known.map(action=>{
 const all=entries.filter(x=>x.action===action),success=all.filter(x=>x.outcome==='success'),partial=all.filter(x=>x.outcome==='application-rejected'),error=all.filter(x=>x.outcome==='error');
 const n=success.length,field=(k)=>({total:sum(success,x=>x.firestore[k]),min:n?Math.min(...success.map(x=>x.firestore[k]||0)):null,max:n?Math.max(...success.map(x=>x.firestore[k]||0)):null,mean:n?fmt(sum(success,x=>x.firestore[k])/n):null});
 return {action,status:n?'MEASURED_SUCCESS':all.length?'ERROR_ONLY':'NOT_EXERCISED',requests:all.length,successes:n,applicationRejections:partial.length,errors:error.length,latencyMs:{p50:fmt(percentile(success.map(x=>x.elapsedMs),.5)),p95:fmt(percentile(success.map(x=>x.elapsedMs),.95))},firestore:{reads:field('documentReads'),writes:field('writes'),deletes:field('deletes'),queries:field('queryCalls'),aggregations:field('aggregationCalls'),transactionAttempts:field('transactionAttempts'),transactionRetries:field('transactionRetries')},rtdb:{transactions:field('transactionCalls'),set:field('setCalls'),update:field('updateCalls'),remove:field('removeCalls'),get:field('getCalls')}};
});
const unknown=entries.filter(x=>!known.includes(x.action)).map(x=>x.action).filter((a,i,arr)=>arr.indexOf(a)===i);
const tally={totalCloudActions:known.length,measuredSuccess:records.filter(r=>r.status==='MEASURED_SUCCESS').length,errorOnly:records.filter(r=>r.status==='ERROR_ONLY').length,untested:records.filter(r=>r.status==='NOT_EXERCISED').length,auditEvents:entries.length,unparseableEvents:failures.length,unknownActions:unknown};
const results={schema:'milvayo.io.audit.emulator.v1',createdAt:new Date().toISOString(),project:'demo-milvayo-083',source:'Actual authenticated requests to local Functions emulator; Firestore Admin SDK operations intercepted in process',measurementLimitations:['Counts are SDK-observed operations, not exact billable reads/writes.','Query results are counted as max(1,returned docs); index entry reads, listener re-delivery and rules reads are not captured.','Transaction retry reads are counted per attempt; successful transaction writes are counted once.','RTDB calls are measured as methods, not bytes, listener events or billing.','Auth, client-side Firestore/Storage, Storage SDK, scheduled triggers, network bytes, deploys and Hosting are not captured.','A successful action call does not exercise all branches or workspace sizes.','Direct client SDK usage and admin tooling require separate tests.','Rejected/failed request I/O is retained in raw events; success-table averages exclude it.'],tally,actions:records,rawEvents:entries};
const base=path.join(output,'milvayo-v4-io-audit');fs.writeFileSync(base+'.json',JSON.stringify(results,null,2));
const flat=records.map(r=>({action:r.action,status:r.status,cases:r.successes,errorOnly:r.errors,readMean:r.firestore.reads.mean,readMax:r.firestore.reads.max,writeMean:r.firestore.writes.mean,writeMax:r.firestore.writes.max,deleteMean:r.firestore.deletes.mean,deleteMax:r.firestore.deletes.max,txRetries:r.firestore.transactionRetries.total,p50Ms:r.latencyMs.p50,p95Ms:r.latencyMs.p95,rtdbTxMean:r.rtdb.transactions.mean}));
const keys=Object.keys(flat[0]||{});const csv=v=>'"'+String(v??'').replaceAll('"','""')+'"';fs.writeFileSync(base+'.csv',[keys.join(','),...flat.map(x=>keys.map(k=>csv(x[k])).join(','))].join('\n')+'\n');
const md=['# Milvayo v4 — whole-cloud API emulator I/O audit','','**This is an exhaustive inventory of 49 callable cloudApi actions, not proof all 49 are tested.** A row without a successful measured invocation is explicitly unmeasured.','','SDK instrumentation on Firebase emulators: **not production billing**. Data come from the user-run cloud suite; workspaces are not all the same size.','','Total: '+tally.totalCloudActions+' actions; '+tally.measuredSuccess+' measured successes; '+tally.errorOnly+' error-only; '+tally.untested+' not exercised; '+tally.auditEvents+' observed calls.','','| Action | Coverage | Success cases | Mean reads | Max reads | Mean writes | Max writes | Mean deletes | p50 ms |','| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',...records.map(r=>`| ${r.action} | ${r.status} | ${r.successes} | ${r.firestore.reads.mean??'—'} | ${r.firestore.reads.max??'—'} | ${r.firestore.writes.mean??'—'} | ${r.firestore.writes.max??'—'} | ${r.firestore.deletes.mean??'—'} | ${r.latencyMs.p50??'—'} |`),'','## What is *not* measured','','- Firestore billing, index-entry reads, rule evaluation and listener reads','- RTDB subscriptions, bytes and billing','- Storage, Firebase Auth, Hosting, client SDK operations and offline sync','- Any branch or size not represented in the emulator tests','','## Next step','','Add an emulator scenario for each NOT_EXERCISED or ERROR_ONLY action; then cover each action’s successful/denied/no-op/retry/large-workspace branches. Run the same measurements after optimization.',''];
fs.writeFileSync(base+'.md',md.join('\n'));
console.log('\n=== MILVAYO FULL CLOUD ACTION AUDIT ===');console.table(tally);console.log('Unmeasured:',records.filter(x=>x.status!=='MEASURED_SUCCESS').map(x=>x.action+' ('+x.status+')').join(', ')||'none');console.log('Detailed results:',base+'.json',base+'.csv',base+'.md');
if(!entries.length){console.error('NO INSTRUMENTED EMULATOR REQUESTS FOUND — verify installation and log; results are NOT valid.');process.exitCode=2;}
if(failures.length){console.error('Some metric lines could not be parsed:',failures.length);process.exitCode=2;}
