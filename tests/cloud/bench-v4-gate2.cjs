// /tests/cloud/bench-v4-gate2.cjs
// Standalone, emulator-only benchmark (NOT automatically included in test:cloud).
// Measures v4 task-patch read/write/delete instrumentation and 30 authenticated users
// committing to distinct tasks in the same shared workspace simultaneously.
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const H = require('../helpers/cloud-emulators.cjs');
const {generate} = require('../../src/cloud/tools/fixtures.cjs');
const {PROJECT_ID} = require('../../src/cloud/config.cjs');

const USERS = 30;
const TASKS = 100;
const OUTPUT = path.join(os.homedir(), 'milvayo-v4-gate2-bench30.json');
const percentile = (values, q) => {
  const ordered = values.filter(Number.isFinite).sort((a, b) => a - b);
  return ordered.length ? +ordered[Math.min(ordered.length - 1, Math.ceil(ordered.length * q) - 1)].toFixed(1) : null;
};
const round = n => +n.toFixed(1);
const log = (...args) => console.log('[v4-benchmark]', ...args);

function ensureEmulators() {
  if (PROJECT_ID !== 'demo-milvayo-083' || !PROJECT_ID.startsWith('demo-'))
    throw Error('Benchmark is restricted to the demo-milvayo-083 project');
  const required = {
    FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
    FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
    FIREBASE_DATABASE_EMULATOR_HOST: '127.0.0.1:9000',
  };
  for (const [name, value] of Object.entries(required)) {
    if (process.env[name] !== value) throw Error(`Local emulator required: ${name}=${value}`);
  }
  if (process.env.GCLOUD_PROJECT && process.env.GCLOUD_PROJECT !== PROJECT_ID)
    throw Error('Wrong emulator project');
}

async function main() {
  ensureEmulators();
  const summary = {
    generatedAt: new Date().toISOString(),
    project: PROJECT_ID,
    environment: {platform: process.platform, arch: process.arch, node: process.version},
    scope: 'Local Firebase emulators only. Synthetic tasks, synthetic accounts, no production data.',
    warning: 'The measured read/write/delete counts are service instrumentation, NOT certified Firebase billable operations. Setup/verification reads and writes, retry attempts and rules reads are not included. 30 distinct accounts each edit a different task field on a distinct task in one shared workspace.',
    users: USERS,
    workspaceTasks: TASKS,
    costSamples: [],
    concurrency: null,
    error: null,
  };
  function save() {
    const tmp = OUTPUT + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(summary, null, 2) + '\n');
    fs.renameSync(tmp, OUTPUT);
  }
  const startedAll = performance.now();
  try {
    log('Creating synthetic 100-task workspace');
    const owner = await H.account('bench-v4-owner');
    const published = await H.publish(owner, generate({tasks:TASKS, objects:0}), 'bench-v4');
    const scope = {orgId:published.orgId, workspaceId:published.workspaceId};
    const call = (user, body) => H.request(user, {...scope, ...body});
    const initial = await call(owner, {action:'pull'});
    const allTasks = initial.records.filter(r => r.kind === 'tasks' && !r.deleted);
    if (allTasks.length < USERS + 10) throw Error('Not enough tasks for independent edits');
    await call(owner, {action:'subscription', capacity:USERS+2});
    await call(owner, {action:'workspaceControl', protocol:4});

    log('Measuring single-task patch costs: title / priority / status');
    const costTasks = [allTasks[0], allTasks[1], allTasks.find((t, i) => i>2 && t.data.status==='Backlog')];
    if (!costTasks[2]) throw Error('No Backlog task for status test');
    const cases = [
      ['title', costTasks[0], {title:'Measured v4 title'}],
      ['priority', costTasks[1], {priority:'High'}],
      ['status', costTasks[2], {status:'In progress'}],
    ];
    for (const [kind, task, set] of cases) {
      const start = performance.now();
      const res = await call(owner, {
        action:'patch', projectId:task.projectId, taskId:task.id,
        opId:crypto.randomUUID(), baseRevision:task.revision, set,
      });
      if (!res.ok || res.measured?.documentWrites !== 1 || res.measured?.documentDeletes !== 0)
        throw Error(`${kind} sample did not return the expected one-write patch measurement: ${JSON.stringify(res)}`);
      const item = {
        operation:kind, reads:res.measured.documentReads,
        writes:res.measured.documentWrites, deletes:res.measured.documentDeletes,
        transactionAttempts:res.measured.transactionAttempts,
        latencyMs:round(performance.now()-start),
        source:'Authenticated owner request to Functions emulator; server-reported instrumentation',
      };
      summary.costSamples.push(item);
      log(`${kind}: ${item.reads} reads, ${item.writes} writes, ${item.deletes} deletes, ${item.latencyMs} ms`);
      save();
    }

    log(`Registering and inviting ${USERS} distinct synthetic users (setup excluded from costs and latency)`);
    const peers = [];
    for (let i = 0; i < USERS; i++) {
      const user = await H.account('bench-v4-peer-'+i);
      const invite = await call(owner, {
        action:'invite', uid:user.uid,
        grant:{workspaceRole:'contributor', projects:{}},
      });
      await call(user, {action:'accept', token:invite.token});
      peers.push(user);
      if ((i+1)%10===0) log('Accounts ready:', i+1);
    }

    // Each user edits a *different* task, with mixed task-field workloads.
    // This isolates the shared-workspace bottleneck without same-task conflicts.
    const targets = allTasks.slice(10,10+USERS);
    const fieldSet = (task,i) => {
      const id = crypto.randomUUID().slice(0,8);
      switch(i%7){
        case 0:return {title:`Concurrent title ${i} ${id}`};
        case 1:return {description:`Concurrent description ${i} ${id}`};
        case 2:return {priority:'Critical'};
        case 3:return {owner:`Concurrent teammate ${i}`};
        case 4:return {stage:'Testing'};
        case 5:return {position:task.data.position+3};
        default:return {status:task.data.status==='Backlog'?'In progress':'Backlog'};
      }
    };
    const expected = targets.map((task,i)=>({user:peers[i],task,set:fieldSet(task,i)}));
    log('Starting', USERS, 'simultaneous mixed workflow patch requests');
    const wallStart = performance.now();
    const settled = await Promise.allSettled(expected.map(async ({user,task,set}, i) => {
      const start = performance.now();
      const response = await call(user, {
        action:'patch', projectId:task.projectId, taskId:task.id,
        opId:crypto.randomUUID(), baseRevision:task.revision, set,
      });
      return {i, response, latencyMs:round(performance.now()-start)};
    }));
    const elapsedMs = round(performance.now()-wallStart);
    const passed = [], failed=[];
    settled.forEach((result,i) => {
      if (result.status==='rejected') failed.push({i, error:result.reason?.message||String(result.reason),code:result.reason?.code||null});
      else if (result.value.response?.ok !== true) failed.push({i, error:JSON.stringify(result.value.response),code:result.value.response?.code||null});
      else passed.push(result.value);
    });
    const latencies = passed.map(x => x.latencyMs);
    const workloadMix = expected.reduce((map,x)=>{
      const field=Object.keys(x.set)[0];map[field]=(map[field]||0)+1;return map;
    },{});
    summary.concurrency = {
      distinctAuthenticatedUsers:USERS,
      simultaneousRequests:USERS,
      distinctTasks:USERS,
      sameWorkspace:true,
      workloadMix,
      successfulPatches:passed.length,
      failures:failed.length,
      failureDetails:failed,
      elapsedMs,
      completedPerSecond:round(passed.length / (elapsedMs / 1000)),
      p50Ms:percentile(latencies,0.50),
      p95Ms:percentile(latencies,0.95),
      p99Ms:percentile(latencies,0.99),
      maxMs:latencies.length?Math.max(...latencies):null,
      independentVerification:null,
    };
    save();
    log('Patches complete:', passed.length, 'succeeded,', failed.length, 'failed; elapsed', elapsedMs, 'ms');

    // Independent server-side verification, excluded from mutation cost samples.
    // Uses the Admin SDK connected only to the local Firestore emulator.
    const {initializeApp, deleteApp} = require('firebase-admin/app');
    const {getFirestore} = require('firebase-admin/firestore');
    const app = initializeApp({projectId:PROJECT_ID}, 'milvayo-v4-30-user-benchmark');
    try {
      const db = getFirestore(app);
      const collection = db.collection('orgs').doc(scope.orgId).collection('workspaces')
        .doc(scope.workspaceId).collection('records');
      const docs = await db.getAll(...targets.map(t => collection.doc(t.key)));
      const mismatches = [];
      for (let i=0;i<USERS;i++) {
        const [field,value]=Object.entries(expected[i].set)[0];
        const actual=docs[i].data()?.data?.[field];
        if (actual!==value)mismatches.push({i,field,expected:value,actual:actual??null});
      }
      summary.concurrency.independentVerification = {
        matchingEdits:USERS-mismatches.length,
        mismatches,
        note:'30 extra Firestore reads for validation; excluded from patch counts',
      };
      log('Independent verification:', USERS-mismatches.length, '/', USERS, 'mixed task changes match');
    } finally {
      await deleteApp(app);
    }
    summary.totalElapsedMs=round(performance.now()-startedAll);
    save();
    console.log('\n=== FINAL V4 COST AND 30-USER BOTTLENECK RESULTS ===');
    console.table(summary.costSamples.map(({operation,reads,writes,deletes,latencyMs})=>({operation,reads,writes,deletes,latencyMs})));
    console.log(JSON.stringify(summary.concurrency,null,2));
    console.log('Full JSON report:',OUTPUT);
    if (failed.length || summary.concurrency.independentVerification.matchingEdits !== USERS) process.exitCode=1;
  } catch (err) {
    summary.error={message:err.message,stack:err.stack};
    save();
    console.error('[v4-benchmark] ERROR',err);
    process.exitCode=1;
  }
}
main().catch(err=>{console.error(err);process.exitCode=1;});
