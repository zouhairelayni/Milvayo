// /tests/cloud/patch-fields.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {database,workspace,generate}=require('../helpers/cloud-fake.cjs'),m=require('../../src/domain/model.cjs'),P=require('../../src/cloud/server/patch.cjs'),V=require('../../src/cloud/taskMutation.cjs');
const accepts=async p=>{try{return (await p).ok!==false;}catch{return false;}},long=n=>'x'.repeat(n);
const CASES=[
 {start:'2026-11-10'},{due:'2026-12-01'},{start:'2026-11-10',due:'2026-12-01'},{start:'banana'},{due:'2026-13-45'},{start:''},{due:''},{start:'2027-01-01',due:'2026-11-10'},{due:'1999-01-01'},{start:'2026-02-30'},
 {milestone:true},{milestone:false},{milestone:true,start:'2026-11-10',due:'2026-12-01'},{milestone:'yes'},{estimateHours:5},{estimateHours:-1},{estimateHours:'x'},{estimateHours:1e9},{progress:50},{progress:150},{progress:-5},{progress:100,status:'Done'},
 {labels:['a','b']},{labels:Array.from({length:31},(_,i)=>'l'+i)},{labels:'nope'},{labels:['a','a']},{repo:'org/repo'},{repo:long(121)},{branch:long(201)},{commit:'abc123'},{mainSha:long(121)},
 {githubLinks:[]},{githubLinks:[{url:'https://github.com/o/r/pull/1'}]},{githubLinks:'x'},{attachments:[{id:'a1',name:'Spec',url:'https://example.com/spec'}]},{attachments:[{id:'a1',name:'Bad',url:'javascript:alert(1)'}]},
 {expected:'ok'},{rollback:'revert'},{expected:long(4001)},{taskTypeId:'task'},{taskTypeId:'bug'},{taskTypeId:'unknown-type'},
 {tests:[{id:'t1',title:'Check',result:'passed',evidence:'log'}]},{tests:[{title:'x',result:'weird'}]},{tests:'x'},{evidence:'proof'},{actual:'did it'},{start:'2026-11-10',owner:'Maya'},{due:'2026-12-01',status:'In progress'},
];
function scheduled(type,dependency){const W=generate({tasks:6,objects:0}),p=W.projects[0];p.tasks.forEach(t=>{t.status='Backlog';t.verified=false;t.merged=false;});p.tasks[0].dependsOn=[p.tasks[1].id];p.tasks[1].status=dependency;p.tasks[1].start='2026-11-02';p.tasks[1].due='2026-11-06';p.tasks[0].start='2026-11-09';p.tasks[0].due='2026-11-13';p.scheduling={links:[{predecessorId:p.tasks[1].id,successorId:p.tasks[0].id,type,lagDays:2}]};return m.normalizeWorkspace(W);}
test('extended task fields: the patch never accepts what canonical validation rejects, and accepts everything valid, across schedules, dependencies and verified tasks',async()=>{
 let compared=0;
 for(const sched of [null,'FS','SS','FF'])for(const verified of [false,true])for(const dependency of ['Backlog','Done'])for(const set of CASES){
  const w=sched?scheduled(sched,dependency):workspace({dependency}),legacy=database(w,{protocol:null}),lean=database(w);
  if(verified)for(const x of [legacy,lean]){const t=x.task('task-3');x.rows.set(x.root+'/records/'+t.key,{...t,data:{...t.data,verified:true}});}
  const id=verified?'task-3':'task-0',a=await accepts(lean.patch('alice',id,set)),b=await accepts(legacy.commit('alice',id,set)),label=JSON.stringify({sched,verified,dependency,set});
  if(a)assert.equal(b,true,'patch accepted what canonical validation rejected: '+label);
  if(b&&Object.keys(set).every(k=>P.ALLOWED.has(k)))assert.equal(a,true,'patch rejected a valid edit: '+label);
  if(a&&b){const {updatedAt:_a,...pa}=lean.task(id).data,{updatedAt:_b,...pb}=legacy.task(id).data;assert.deepEqual(pa,pb,'result differs: '+label);}
  compared++;
 }
 assert.equal(compared,784);
});
test('dates and other routine fields cost one write and a bounded read count at any project size (legacy: a full project scan)',async()=>{
 for(const tasks of [100,500,2000]){
  const w=m.normalizeWorkspace(generate({tasks,objects:0})),lean=database(w),legacy=database(w,{protocol:null}),t=lean.tasks().find(t=>!t.data.dependsOn.length),set={start:'2026-11-20',due:'2026-11-27',labels:['planned'],estimateHours:8};
  const r=await lean.patch('alice',t.id,set);assert.equal(r.measured.documentWrites,1);assert.equal(r.measured.documentReads,5,'no project scan at '+tasks+' tasks');assert.equal(lean.writes.length,1);
  const l=await legacy.commit('alice',t.id,set);assert.ok(l.measured.documentReads>=tasks,'legacy scans the project: '+l.measured.documentReads);
 }
});
test('verified tasks keep their evidence locked; a patch can unverify and edit evidence in one step only like canonical',async()=>{
 const x=database(workspace()),t=x.task('task-3');x.rows.set(x.root+'/records/'+t.key,{...t,data:{...t.data,verified:true}});
 await assert.rejects(x.patch('alice','task-3',{evidence:'changed after verification'}),/canonical validation/);
 assert.equal((await x.patch('alice','task-3',{verified:false,evidence:'now editable'})).ok,true);
});
