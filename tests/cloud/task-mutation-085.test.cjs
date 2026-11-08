// /tests/cloud/task-mutation-085.test.cjs
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
 return {rows,reads,writes,root,service,task:()=>[...rows.entries()].find(([k,v])=>k.startsWith(root+'/records/')&&v.kind==='tasks')[1],commit:changes=>service.execute('alice',{action:'commit',orgId:'org',workspaceId:'main',mutationId:'operation-'+(++id),changes})};
}
const change=(task,data)=>({key:task.key,baseRevision:task.revision,before:task,after:{...task,data:{...task.data,...data}}});
test('independent task validator agrees with canonical validation for valid and malformed field values',()=>{
 const w=generate({tasks:10,objects:25}),p=w.projects[0];p.customFields=[{id:'rating',name:'Rating',type:'number',required:false,options:[]}];
 p.tasks[0].dependsOn=[p.tasks[1].id];p.tasks[0].parentId=p.tasks[2].id;
 const records=S.pack(m.normalizeWorkspace(w)),old=records.find(r=>r.kind==='tasks'),project=records.find(r=>r.kind==='projects');
 const cases={title:['A','',null,3,'x'.repeat(240),'x'.repeat(241),'任务'],description:['',null,{},'x'.repeat(12000),'x'.repeat(12001)],priority:['Low','Medium','High','Critical','Unknown',null],customValues:[{},null,[],{rating:3},{rating:'3'},{rating:Infinity},{missing:true}],updatedAt:['2026-11-08',null,3,'x'.repeat(51)],verified:[false],merged:[false]};
 const accepts=fn=>{try{fn();return true;}catch{return false;}};
 for(const [field,values] of Object.entries(cases))for(const value of values){const next={...old,data:{...old.data,[field]:value}};assert.equal(accepts(()=>{S.assertJson(next);V.validateIndependent(old,next,project);}),accepts(()=>{S.assertJson(next);S.validateRecords(records.map(r=>r===old?next:r));validateTransition(records,records.map(r=>r===old?next:r));}),field+':'+JSON.stringify(value));}
 assert.equal(V.eligible(change(old,{dependsOn:[]})),false);assert.equal(V.eligible(change(old,{status:old.data.status==='Done'?'Backlog':'Done'})),false);assert.equal(V.eligible(change(old,{verified:true})),false);
});
test('simple saves remain six point reads at 10, 100, 500 and 2,000 tasks with no summary or task deletion',async()=>{
 for(const tasks of [10,100,500,2000]){const x=database(generate({tasks,objects:0})),task=x.task();let r=await x.commit(V.compactChanges([change(task,{title:'Edited'})]));assert.equal(r.measured.documentReads,6);assert.equal(r.committedSequence,r.sequence);assert.equal(r.measured.documentWrites,6);assert.equal(r.measured.documentDeletes,0);assert.equal(r.measured.fullProjectScan,false);assert.ok(!x.reads.includes(x.root+'/records'));assert.equal(x.writes.filter(p=>p.includes('/summaries/')).length,0);
  r=await x.commit(V.compactChanges([change(r.records[0],{description:'Accepted'})]));assert.equal(r.measured.documentWrites,5);assert.equal(r.measured.readBreakdown.configuration,0);assert.equal(r.measured.writeBreakdown.records,1);
 }
});
test('compact payloads retain exact old field checks, fresh custom configuration and idempotent receipts',async()=>{
 const w=generate({tasks:2,objects:0});w.projects[0].customFields=[{id:'rating',name:'Rating',type:'number',required:false,options:[]}];const x=database(m.normalizeWorkspace(w)),t=x.task();
 const patch=V.compactChanges([change(t,{customValues:{rating:2}})]);let r=await x.commit(patch);assert.equal(r.measured.documentReads,7);assert.equal(r.measured.readBreakdown.configuration,1);
 await assert.rejects(x.commit([{key:t.key,baseRevision:r.records[0].revision,patch:{before:{title:'Forged'},after:{title:'new'}}}]),/Forged/);
 await assert.rejects(x.commit([{key:t.key,baseRevision:r.records[0].revision,patch:{before:{status:t.data.status},after:{status:'Done'}}}]),/unsupported/);
 const body={action:'commit',orgId:'org',workspaceId:'main',mutationId:'same-id',changes:V.compactChanges([change(r.records[0],{title:'Replay'})])};const a=await x.service.execute('alice',body),n=x.writes.length,b=await x.service.execute('alice',body);assert.equal(b.duplicate,true);assert.equal(x.writes.length,n);assert.equal(b.measured.documentReads,5);assert.equal(b.measured.documentWrites,0);
 x.rows.get(x.root+'/grants/alice').workspaceRole='none';await assert.rejects(x.service.execute('alice',body),/grant/);assert.equal(a.records[0].data.title,'Replay');
});
test('stale independent fields merge against immutable revisions; competing fields and forged envelopes fail',async()=>{
 const x=database(generate({tasks:2,objects:0})),t=x.task();await x.commit(V.compactChanges([change(t,{title:'A'})]));const r=await x.commit(V.compactChanges([change(t,{description:'B'})]));assert.equal(r.records[0].data.title,'A');assert.equal(r.records[0].data.description,'B');assert.equal(r.measured.readBreakdown.versions,1);
 await assert.rejects(x.commit(V.compactChanges([change(t,{title:'C'})])),/Concurrent/);
 const fresh=r.records[0];await assert.rejects(x.commit([{...change(fresh,{title:'bad'}),before:{...fresh,projectId:'elsewhere'}}]),/Forged/);
 const noOp=await x.commit([change(fresh,{title:'A'})]);assert.equal(noOp.sequence,r.sequence);assert.equal(noOp.committedSequence,null);assert.equal(noOp.measured.documentWrites,1);assert.equal(noOp.measured.writeBreakdown.versions,0);
});
test('compact unchanged edits preserve receipt-only no-op behavior without task/version/sequence writes',async()=>{const x=database(generate({tasks:2,objects:0})),task=x.task(),r=await x.commit(V.compactChanges([change(task,{title:task.data.title})]));assert.equal(r.sequence,1);assert.equal(r.measured.documentWrites,1);assert.equal(r.measured.writeBreakdown.records,0);assert.equal(r.measured.writeBreakdown.versions,0);assert.equal(r.measured.writeBreakdown.sequence,0);assert.equal(r.records[0].revision,1);});
test('old full-payload receipts replay under fresh authorization and new receipts bind restore semantics',async()=>{const x=database(generate({tasks:2,objects:0})),task=x.task(),body={action:'commit',orgId:'org',workspaceId:'main',mutationId:'old-receipt',changes:[change(task,{title:'Previously acknowledged'})]},first=await x.service.execute('alice',body),receipt=x.rows.get(x.root+'/receipts/old-receipt');delete receipt.restore;delete receipt.result.committedSequence;const writes=x.writes.length,replayed=await x.service.execute('alice',body);assert.equal(replayed.duplicate,true);assert.equal(replayed.committedSequence,undefined);assert.equal(x.writes.length,writes);assert.equal(replayed.records[0].data.title,first.records[0].data.title);const fresh={...body,mutationId:'new-receipt',changes:[change(first.records[0],{title:'Next'})]};await x.service.execute('alice',fresh);await assert.rejects(x.service.execute('alice',{...fresh,restore:true}),/reused/);x.rows.get('orgs/org/members/alice').active=false;await assert.rejects(x.service.execute('alice',body),/unavailable/);});
test('forged patch paths, fields, old values and absent bases cannot change records',async()=>{const x=database(generate({tasks:2,objects:0})),task=x.task(),n=x.writes.length;for(const c of [{key:task.key,baseRevision:1,patch:{before:{title:'not original'},after:{title:'Forged'}}},{key:task.key,baseRevision:0,patch:{before:{title:task.data.title},after:{title:'Missing base'}}},{key:task.key,baseRevision:1,patch:{before:{owner:task.data.owner},after:{owner:'Unauthorized narrow field'}}},{key:task.key,baseRevision:1,before:task,patch:{before:{title:task.data.title},after:{title:'Ambiguous'}}},{key:task.key.replace('tasks~','comments~'),baseRevision:1,patch:{before:{title:task.data.title},after:{title:'Wrong family'}}}])await assert.rejects(x.commit([c]));assert.equal(x.writes.length,n);assert.equal(x.task().data.title,task.data.title);});
