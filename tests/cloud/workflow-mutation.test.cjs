// /tests/cloud/workflow-mutation.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const S=require('../../src/cloud/schema.cjs'),V=require('../../src/cloud/taskMutation.cjs'),m=require('../../src/domain/model.cjs'),{generate}=require('../../src/cloud/tools/fixtures.cjs');
const {validateTransition}=require('../../src/cloud/validation.cjs'),{createService}=require('../../src/cloud/server/service.cjs');
function database(workspace){
 const root='orgs/org/workspaces/main',rows=new Map(),reads=[],writes=[];
 for(const r of S.pack(workspace))rows.set(root+'/records/'+r.key,{...r,revision:1,sequence:1,deleted:false});
 rows.set('orgs/org/members/alice',{active:true,role:'owner'});rows.set(root+'/grants/alice',{workspaceRole:'manager',projects:{}});rows.set(root,{state:'active',sequence:1});rows.set('orgs/org/subscription/current',{seats:['alice']});
 const snap=ref=>({ref,id:ref.path.split('/').at(-1),exists:rows.has(ref.path),data:()=>structuredClone(rows.get(ref.path))});
 const collection=(path,filters=[])=>({path,filters,query:true,doc:id=>doc(path+'/'+id),where:(...f)=>collection(path,[...filters,f])});
 const doc=path=>({path,collection:name=>collection(path+'/'+name)});
 const db={doc,runTransaction:async fn=>{const pending=[];const tx={get:async ref=>{reads.push(ref.path);if(!ref.query)return snap(ref);const docs=[...rows.keys()].filter(k=>k.startsWith(ref.path+'/')&&!k.slice(ref.path.length+1).includes('/')).map(k=>snap(doc(k))).filter(s=>ref.filters.every(([k,op,v])=>op==='=='?s.data()[k]===v:s.data()[k]>v));return {docs,size:docs.length};},set:(r,d)=>pending.push([r,d]),update:(r,d)=>pending.push([r,{...rows.get(r.path),...d}]),create:(r,d)=>{assert.ok(!rows.has(r.path));pending.push([r,d]);}};const result=await fn(tx);for(const [r,d] of pending){rows.set(r.path,structuredClone(d));writes.push(r.path);}return result;}};
 const service=createService(db,{});let id=0;
 return {rows,reads,writes,root,service,tasks:()=>[...rows.entries()].filter(([k,v])=>k.startsWith(root+'/records/')&&v.kind==='tasks').map(([,v])=>v),commit:changes=>service.execute('alice',{action:'commit',orgId:'org',workspaceId:'main',mutationId:'operation-'+(++id),changes})};
}
const change=(task,data,order)=>({key:task.key,baseRevision:task.revision,before:task,after:{...task,data:{...task.data,...data},order:order??task.order}});
const accepts=fn=>{try{fn();return true;}catch{return false;}};
function workspace({workflow,dependency}={}){
 const w=generate({tasks:6,objects:0}),p=w.projects[0];p.tasks.forEach((t,i)=>{t.status='Backlog';t.verified=false;t.merged=false;});
 p.tasks[0].dependsOn=[p.tasks[1].id];p.tasks[1].status=dependency||'Backlog';
 if(workflow)p.workflow={enabled:true,transitions:[{from:'Backlog',to:'In progress'},{from:'In progress',to:'Validation'},{from:'Validation',to:'Done'}]};
 return m.normalizeWorkspace(w);
}
test('Class B validation accepts and rejects exactly like canonical validation for status, owner, stage and position edits',()=>{
 let compared=0;
 for(const workflow of [false,true])for(const dependency of ['Backlog','Done'])for(const from of ['Backlog','In progress','Validation','Done']){
  const w=workspace({workflow,dependency}),records=S.pack(w),project=records.find(r=>r.kind==='projects'),old0=records.find(r=>r.kind==='tasks'&&r.id==='task-0'),old={...old0,data:{...old0.data,status:from}};
  const base=records.map(r=>r===old0?old:r),dep=base.find(r=>r.kind==='tasks'&&r.id==='task-1');
  const cases=[{status:'Backlog'},{status:'In progress'},{status:'Validation'},{status:'Done'},{status:'Bogus'},{status:null},{owner:'Someone'},{owner:''},{stage:'Testing'},{stage:'Nope'},{position:3},{position:-1},{status:'Done',owner:'Someone'},{listId:''},{listId:'unknown-list'},{verified:true},{merged:true},{boardId:'other'},{dependsOn:[]},{sprintId:'x'}];
  for(const data of cases){
   const next={...old,data:{...old.data,...data}};
   const narrow=accepts(()=>{S.assertJson(next);assert.ok(V.eligibleB({before:old,after:next}));V.validateWorkflow(old,next,project);V.validateDone(old,next,id=>id===dep.id?dep.data.status:undefined);});
   const canonical=accepts(()=>{S.assertJson(next);const after=base.map(r=>r===old?next:r);S.validateRecords(after);validateTransition(base,after);});
   // The narrow path may refuse more (falls back to canonical) but must never accept what canonical rejects.
   if(narrow)assert.equal(canonical,true,`narrow accepted but canonical rejected ${workflow}/${dependency}/${from}/${JSON.stringify(data)}`);
   // Everything canonical accepts inside the Class B field set must also be accepted narrowly (no workflow regression).
   if(canonical&&V.eligibleB({before:old,after:next}))assert.equal(narrow,true,`narrow rejected a valid edit ${workflow}/${dependency}/${from}/${JSON.stringify(data)}`);
   compared++;
  }
 }
 assert.equal(compared,320);
});
test('a status move reads only bounded documents instead of scanning the project at 10, 500 and 2,000 tasks',async()=>{
 for(const tasks of [10,500,2000]){
  const x=database(generate({tasks,objects:0})),task=x.tasks().find(t=>t.data.status==='Backlog'&&!t.data.dependsOn.length);
  const r=await x.commit([change(task,{status:'In progress'})]);
  assert.equal(r.measured.validationClass,'B');assert.equal(r.measured.fullProjectScan,false);assert.ok(r.measured.documentReads<=9,'reads '+r.measured.documentReads);
  assert.ok(!x.reads.includes(x.root+'/records'));assert.equal(r.records[0].data.status,'In progress');
 }
});
test('Done reads only the task\'s own dependencies and still blocks incomplete dependencies',async()=>{
 const w=workspace({dependency:'Backlog'}),x=database(w),task=x.tasks().find(t=>t.id==='task-0');
 await assert.rejects(x.commit([change(task,{status:'Done'})]),/dependency/);
 const y=database(workspace({dependency:'Done'})),t=y.tasks().find(t=>t.id==='task-0'),r=await y.commit([change(t,{status:'Done'})]);
 assert.equal(r.measured.readBreakdown.dependencies,1);assert.ok(r.measured.documentReads<=10);assert.equal(r.records[0].data.status,'Done');
 const z=database(workspace({dependency:'Backlog'})),a=z.tasks().find(t=>t.id==='task-0'),b=z.tasks().find(t=>t.id==='task-1');
 const both=await z.commit([change(b,{status:'Done'}),change(a,{status:'Done'})]);assert.equal(both.measured.readBreakdown.dependencies,0,'a dependency changed in the same mutation is not re-read');
});
test('workflow rules, stale revisions and non-class-B fields still use the existing protections',async()=>{
 const x=database(workspace({workflow:true})),task=x.tasks().find(t=>t.id==='task-3');
 await assert.rejects(x.commit([change(task,{status:'Done'})]),/Workflow blocks/);
 await assert.rejects(x.commit([change(task,{status:'Bogus'})]),/schema/);
 const r=await x.commit([change(task,{owner:'Maya',position:2})]);assert.equal(r.measured.validationClass,'B');
 const verify=await x.commit([change(r.records[0],{verified:true})]).then(()=>'accepted',e=>e.message);assert.notEqual(verify,'accepted');
 const canonical=await x.commit([change(r.records[0],{boardId:'other'})]).then(x=>x.measured.validationClass,e=>'rejected');assert.notEqual(canonical,'B');
});
test('a pure reorder keeps order checks and 3-way merging while using bounded reads',async()=>{
 const x=database(generate({tasks:50,objects:0})),[first,second]=x.tasks().sort((a,b)=>a.order-b.order);
 const r=await x.commit([change(first,{},second.order),change(second,{},first.order)]);assert.equal(r.measured.validationClass,'B');assert.equal(r.measured.fullProjectScan,false);
 await assert.rejects(x.commit([change(first,{},1000000)]),/order/);
});
