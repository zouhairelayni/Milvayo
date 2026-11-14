// /tests/cloud/patch-create.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {database,generate}=require('../helpers/cloud-fake.cjs'),{scenario}=require('../helpers/cloud-scenarios.cjs'),m=require('../../src/domain/model.cjs'),S=require('../../src/cloud/schema.cjs');
const accepts=async p=>{try{return (await p).ok!==false;}catch{return false;}};
let n=0;const stripped=r=>{const d={...r.data};delete d.updatedAt;return d;};
const liveOf=x=>[...x.rows.values()].filter(r=>r.key&&r.kind&&!r.deleted);
const edge=(pid,pred,succ)=>S.record('dependencies',pid,pred+'>'+succ,{predecessorId:pred,successorId:succ,type:'FS',lagDays:0},0);
const legacyCreate=(x,records)=>x.service.execute('alice',{...x.scope,action:'commit',mutationId:'create-'+(++n),changes:records.map(r=>({key:r.key,baseRevision:0,before:null,after:r}))});
function world(opts={edges:[[2,1]]}){const {workspace,id}=scenario(opts);return {workspace,id,lean:database(workspace),legacy:database(workspace,{protocol:null})};}
const taskOf=(x,id)=>[...x.rows.values()].find(r=>r.kind==='tasks'&&r.id===id);
const leanCreate=(x,pid,id,data,over={})=>x.service.execute('alice',{...x.scope,action:'createTask',projectId:pid,taskId:id,opId:'op-'+(++n),order:50,data,...over});
const TASKS=(id,mk)=>[
 ['minimal',{}],['rich fields',{description:'D',priority:'High',start:'2026-11-10',due:'2026-12-01',labels:['a'],estimateHours:5}],['status in progress',{status:'In progress'}],['status Done, no dependencies',{status:'Done'}],['invalid status',{status:'Bogus'}],
 ['verified',{verified:true}],['merged',{merged:true}],['parent exists',{parentId:id(1)}],['parent missing',{parentId:'ghost'}],['parent is itself',{parentId:'NEW'}],
 ['depends on an existing task',{dependsOn:[id(0)]}],['depends on a missing task',{dependsOn:['ghost']}],['duplicate dependency',{dependsOn:[id(0),id(0)]}],['Done with an incomplete dependency',{status:'Done',dependsOn:[id(0)]}],
 ['board set',{boardId:'other'}],['unknown task type',{taskTypeId:'unknown-type'}],['title longer than allowed',{title:'x'.repeat(400)}],['invalid tests list',{tests:'x'}],['sprint set',{sprintId:'s1'}],
];
test('createTask accepts and rejects exactly like canonical validation and writes one document (plus links)',async()=>{
 let compared=0;
 for(const scn of [{edges:[[2,1]]},{edges:[[2,1]],verified:[1]}]){
  const probe=world(scn),id=probe.id,cases=TASKS(id);
  for(const [name,over] of cases){
   const w=world(scn),pid=taskOf(w.lean,w.id(0)).projectId,newId='new-task',fill=o=>({...m.defaultTask({id:newId,title:'New task'}),...Object.fromEntries(Object.entries(o).map(([k,v])=>[k,v==='NEW'?newId:v]))});
   const data=fill(over),a=await accepts(leanCreate(w.lean,pid,newId,data)),records=[S.record('tasks',pid,newId,data,50),...(Array.isArray(data.dependsOn)?[...new Set(data.dependsOn)].map(p=>edge(pid,p,newId)):[])],b=await accepts(legacyCreate(w.legacy,records));
   if(a)assert.equal(b,true,'createTask accepted what canonical validation rejected: '+name);
   const covered=!['boardId','sprintId','verified','merged'].some(k=>k in over);
   if(b&&covered)assert.equal(a,true,'createTask rejected a valid creation: '+name);
   if(a&&b){assert.deepEqual(stripped(taskOf(w.lean,newId)),stripped(taskOf(w.legacy,newId)),name);assert.deepEqual(new Set(liveOf(w.lean).filter(r=>r.kind==='dependencies').map(r=>r.key)),new Set(liveOf(w.legacy).filter(r=>r.kind==='dependencies').map(r=>r.key)),name+': links');assert.doesNotThrow(()=>S.validateRecords(liveOf(w.lean)),name+': canonical state');}
   compared++;
  }
 }
 assert.equal(compared,38);
});
test('createTask rejects a duplicate id, honors idempotency and the caps, and costs bounded reads at any project size',async()=>{
 for(const size of [10,100,500,2000]){
  const w=m.normalizeWorkspace(generate({tasks:size,objects:0})),x=database(w),existing=x.tasks()[0],data=m.defaultTask({id:'brand-new',title:'Brand new'});
  const r=await x.service.execute('alice',{...x.scope,action:'createTask',projectId:existing.projectId,taskId:'brand-new',opId:'create-1',order:7,data});
  assert.equal(r.ok,true);assert.equal(r.measured.documentWrites,1);assert.ok(r.measured.documentReads<=12,`${size} tasks: ${r.measured.documentReads} reads`);assert.equal(x.writes.length,1);
  assert.equal((await x.service.execute('alice',{...x.scope,action:'createTask',projectId:existing.projectId,taskId:'brand-new',opId:'create-1',order:7,data})).duplicate,true);
  await assert.rejects(x.service.execute('alice',{...x.scope,action:'createTask',projectId:existing.projectId,taskId:'brand-new',opId:'create-2',order:7,data}),/already exists/);
  await assert.rejects(x.service.execute('alice',{...x.scope,action:'createTask',projectId:existing.projectId,taskId:existing.id,opId:'create-3',data:{...data,id:existing.id}}),/already exists/);
 }
 const x=database(m.normalizeWorkspace(generate({tasks:5,objects:0}))),proto=x.tasks()[0];for(let i=0;i<9000;i++){const k=x.root+'/records/tasks~'+proto.projectId+'~~fill-'+i;x.rows.set(k,{...proto,key:k,id:'fill-'+i});}
 await assert.rejects(x.service.execute('alice',{...x.scope,action:'createTask',projectId:proto.projectId,taskId:'one-too-many',opId:'cap',data:m.defaultTask({id:'one-too-many',title:'x'})}),/too large for a field patch/);
});
const COMMENTS=[['valid',{}],['empty body is allowed by the normalizer',{body:''}],['body longer than 4000',{body:'x'.repeat(4001)}],['blank author',{author:''}],['author longer than 120',{author:'a'.repeat(121)}],['extra field',{extra:1}],['task mismatch',{taskId:'ghost'}],['padded text',{body:'  padded  '}]];
const TIMES=[['valid',{}],['zero hours',{hours:0}],['more than 24 hours',{hours:25}],['fractional hours',{hours:1.234}],['half hour',{hours:0.5}],['invalid date',{date:'2026-02-30'}],['negative rate',{rateAtEntry:-1}],['valid rate',{rateAtEntry:75}],['long note',{note:'n'.repeat(1001)}],['unknown owner',{owner:'Nobody'}],['blank owner',{owner:''}],['extra field',{extra:1}]];
test('addComment and logTime match canonical validation and write exactly one document at any project size',async()=>{
 for(const [kind,cases,build,action,idField] of [['comments',COMMENTS,(tid,o)=>({id:'item-1',taskId:tid,author:'Ann',body:'Note',at:'2026-01-01T00:00:00.000Z',...o}),'addComment','commentId'],['timeEntries',TIMES,(tid,o)=>({id:'item-1',taskId:tid,owner:'Ann',date:'2026-11-01',hours:2,rateAtEntry:null,note:'',...o}),'logTime','entryId']])
  for(const [name,over] of cases){
   const w=world({edges:[[2,1]]}),t=taskOf(w.lean,w.id(1)),data=build(t.id,over),taskId=over.taskId||t.id;
   const a=await accepts(w.lean.service.execute('alice',{...w.lean.scope,action,projectId:t.projectId,taskId,[idField]:'item-1',opId:'op-'+(++n),data})),b=await accepts(legacyCreate(w.legacy,[S.record(kind,t.projectId,'item-1',data,0)]));
   if(a)assert.equal(b,true,`${action} accepted what canonical validation rejected: ${name}`);
   if(b&&!('at' in over))assert.equal(a,true,`${action} rejected a valid record: ${name}`);
   if(a&&b){assert.equal(w.lean.writes.length,1);assert.doesNotThrow(()=>S.validateRecords(liveOf(w.lean)));}
  }
 for(const size of [10,500,2000]){
  const x=database(m.normalizeWorkspace(generate({tasks:size,objects:0}))),t=x.tasks()[0];
  const c=await x.service.execute('alice',{...x.scope,action:'addComment',projectId:t.projectId,taskId:t.id,commentId:'c1',opId:'oc',data:{id:'c1',taskId:t.id,author:'Ann',body:'Hello',at:'x'}}),e=await x.service.execute('alice',{...x.scope,action:'logTime',projectId:t.projectId,taskId:t.id,entryId:'e1',opId:'oe',data:{id:'e1',taskId:t.id,owner:'Ann',date:'2026-11-01',hours:2,rateAtEntry:null,note:''}});
  for(const r of [c,e]){assert.equal(r.measured.documentWrites,1);assert.ok(r.measured.documentReads<=9,`${size} tasks: ${r.measured.documentReads} reads`);}
 }
});
test('create handlers keep the permission model (viewers cannot create or log time; commenters may comment but not create)',async()=>{
 const {lean:x,id}=world(),t=taskOf(x,id(1));x.grant('viewer',{workspaceRole:'viewer',projects:{}});x.grant('commenter',{workspaceRole:'commenter',projects:{}});x.rows.set('orgs/org/subscription/current',{capacity:5,seats:['alice','viewer','commenter'],allocations:{}});
 const comment=u=>x.service.execute(u,{...x.scope,action:'addComment',projectId:t.projectId,taskId:t.id,commentId:'c-'+u,opId:'o-'+u,data:{id:'c-'+u,taskId:t.id,author:'A',body:'b',at:'x'}});
 await assert.rejects(comment('viewer'),/scoped grant/);assert.equal((await comment('commenter')).ok,true);
 await assert.rejects(x.service.execute('commenter',{...x.scope,action:'createTask',projectId:t.projectId,taskId:'n1',opId:'o',data:m.defaultTask({id:'n1',title:'x'})}),/scoped grant/);
 await assert.rejects(x.service.execute('commenter',{...x.scope,action:'logTime',projectId:t.projectId,taskId:t.id,entryId:'e1',opId:'o2',data:{id:'e1',taskId:t.id,owner:'A',date:'2026-11-01',hours:1,rateAtEntry:null,note:''}}),/scoped grant/);
});

test('without aggregation support (some emulator builds) creation still works through the bounded fallback and says so',async()=>{
 const x=database(m.normalizeWorkspace(generate({tasks:50,objects:0}))),t=x.tasks()[0];x.aggregation(false);
 const r=await x.service.execute('alice',{...x.scope,action:'createTask',projectId:t.projectId,taskId:'fallback-task',opId:'fb',data:m.defaultTask({id:'fallback-task',title:'x'})});
 assert.equal(r.ok,true);assert.equal(r.measured.readBreakdown.aggregationFallback,1);assert.equal(r.measured.documentWrites,1);
});
