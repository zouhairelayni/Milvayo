// /tests/cloud/v4-writes.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {database,generate}=require('../helpers/cloud-fake.cjs'),{requestFor,createSender,publicRecord}=require('../../src/cloud/v4Writes.cjs'),S=require('../../src/cloud/schema.cjs'),model=require('../../src/domain/model.cjs');
// How a queued change becomes one v4 server call (src/cloud/v4Writes.cjs), checked against the real handlers on the in-memory database.
const T0=Date.parse('2026-11-19T12:00:00.000Z');
const world=()=>{const x=database(generate({tasks:14,objects:3,projects:1}),{protocol:4});x.project=[...x.rows.values()].find(r=>r.kind==='projects').projectId;return x;};
const rec=(x,kind,id)=>publicRecord(x.record(kind,id)),tasks=x=>[...x.rows.values()].filter(r=>r.kind==='tasks'&&!r.deleted).sort((a,b)=>a.id<b.id?-1:1);
const sender=(x,who='alice')=>createSender({request:async body=>x.service.execute(who,JSON.parse(JSON.stringify({...x.scope,...body})))});
const change=(before,after,extra={})=>({key:before?.key||after.key,before,after,baseRevision:before?.revision||0,...extra});
const withData=(r,data)=>({key:r.key,kind:r.kind,projectId:r.projectId,boardId:r.boardId,id:r.id,order:r.order,data:{...r.data,...data}});

test('mapping: one task field edit becomes one patch with only the changed fields',()=>{
 const before=publicRecord({key:'tasks~p~~t',kind:'tasks',projectId:'p',boardId:'',id:'t',order:2,revision:4,data:{title:'a',priority:'Low',labels:['x']}});
 const out=requestFor([change(before,withData(before,{title:'b',labels:['x','y']}))],'op-1');
 assert.deepEqual(out.request,{action:'patch',projectId:'p',taskId:'t',opId:'op-1',baseRevision:4,set:{title:'b',labels:['x','y']}});
 assert.deepEqual(requestFor([change(before,withData(before,{}))],'op-2'),{noop:true});
});
test('mapping: delete, create, comment and time entry each become their own call',()=>{
 const t=publicRecord({key:'tasks~p~~t',kind:'tasks',projectId:'p',boardId:'',id:'t',order:0,revision:3,data:{title:'a'}}),dep={key:'dependencies~p~~a%3Eb',kind:'dependencies',projectId:'p',boardId:'',id:'a>b',order:0,data:{predecessorId:'t',successorId:'z'}};
 assert.deepEqual(requestFor([change(t,null),change({...dep,revision:1},null)],'o').request,{action:'deleteTask',projectId:'p',taskId:'t',opId:'o',baseRevision:3});
 assert.deepEqual(requestFor([change(null,{key:'tasks~p~~n',kind:'tasks',projectId:'p',boardId:'',id:'n',order:9,data:{title:'n'}})],'o').request,{action:'createTask',projectId:'p',taskId:'n',opId:'o',order:9,data:{title:'n'}});
 assert.equal(requestFor([change(null,{key:'k',kind:'comments',projectId:'p',boardId:'',id:'c1',order:0,data:{id:'c1',taskId:'t'}})],'o').request.action,'addComment');
 assert.equal(requestFor([change(null,{key:'k',kind:'timeEntries',projectId:'p',boardId:'',id:'e1',order:0,data:{id:'e1',taskId:'t'}})],'o').request.entryId,'e1');
});
test('mapping: anything not supported yet is refused with a clear message and never half-sent',()=>{
 const t=publicRecord({key:'tasks~p~~t',kind:'tasks',projectId:'p',boardId:'',id:'t',order:0,revision:1,data:{title:'a',dependsOn:[]}}),other=publicRecord({key:'tasks~p~~u',kind:'tasks',projectId:'p',boardId:'',id:'u',order:1,revision:1,data:{title:'u'}});
 const refuses=(changes,pattern)=>assert.throws(()=>requestFor(changes,'o'),e=>e.code==='failed-precondition'&&pattern.test(e.message)&&/recovery queue/.test(e.message));
 assert.deepEqual(requestFor([change(t,withData(t,{dependsOn:['u'],verified:false}))],'o').request,{action:'patchDependencies',projectId:'p',taskId:'t',baseRevision:1,dependsOn:['u'],opId:'o'});
 refuses([change(t,{...withData(t,{}),order:5})],/moving a task/);
 refuses([change(t,{...withData(t,{title:'b'}),data:{dependsOn:[]}})],/removing the field title/);
 refuses([change(t,withData(t,{title:'b'})),change(other,{...withData(other,{}),order:7})],/moving a task/);
 assert.throws(()=>requestFor([change(t,withData(t,{title:'b'})),change(other,withData(other,{title:'x'}))],'o'),/several records/,'the one-call form refuses what needs two calls');
 refuses([change(null,{key:'k',kind:'canvas.objects',projectId:'p',boardId:'b',id:'o',order:0,data:{}})],/adding this kind/);
 refuses([change({key:'k',kind:'projects',projectId:'p',boardId:'',id:'p',order:0,revision:1,data:{}},{key:'k',kind:'projects',projectId:'p',boardId:'',id:'p',order:0,data:{name:'z'}})],/this kind of record/);
 assert.deepEqual(requestFor([],'o'),{noop:true});assert.throws(()=>requestFor(null,'o'),/empty/);
});
test('sending: an edit reaches the server as a patch and the acknowledgment carries clean records',async t=>{
 t.mock.timers.enable({apis:['Date'],now:T0});const x=world(),task=tasks(x)[0],before=publicRecord(task),send=sender(x);
 const ack=await send({action:'commit',mutationId:'m-1',changes:[change(before,withData(before,{title:'Via sender'}))]});
 assert.equal(x.task(task.id).data.title,'Via sender');assert.equal(x.task(task.id).revision,2);assert.equal(ack.records.length,1);
 assert.equal(ack.records[0].sequence,2);for(const k of ['lastOpId','lastOpHash'])assert.equal(k in ack.records[0],false);
 const again=await send({action:'commit',mutationId:'m-1',changes:[change(before,withData(before,{title:'Via sender'}))]});assert.equal(x.task(task.id).revision,2,'a replay of the same operation changes nothing');assert.ok(Array.isArray(again.records));
});
test('sending: a delete returns every record the cascade changed, tombstones included',async t=>{
 t.mock.timers.enable({apis:['Date'],now:T0});const x=world(),all=tasks(x),victim=all[0];
 const linked=await x.service.execute('alice',{...x.scope,action:'patchDependencies',projectId:x.project,taskId:all[1].id,opId:'dep',baseRevision:all[1].revision,dependsOn:[victim.id]});assert.equal(linked.ok,true,'a dependent exists, so the delete has a cascade');
 const current=publicRecord(x.task(victim.id)),ack=await sender(x)({action:'commit',mutationId:'m-2',changes:[change(current,null)]});
 assert.ok(ack.records.length>=2,'the task and what depended on it');const tomb=ack.records.find(r=>r.key===victim.key);assert.equal(tomb.deleted,true);assert.equal(typeof tomb.deletedAt,'number');
 assert.equal(x.task(victim.id).deleted,true);
});
test('sending: a stale edit on a different field is re-applied on top; the same field becomes a conflict with the current record',async t=>{
 t.mock.timers.enable({apis:['Date'],now:T0});const x=world(),task=tasks(x)[0],before=publicRecord(task),send=sender(x);
 await x.service.execute('alice',{...x.scope,action:'patch',projectId:x.project,taskId:task.id,opId:'other',baseRevision:1,set:{priority:'High'}});
 await send({action:'commit',mutationId:'m-3',changes:[change(before,withData(before,{title:'Mine'}))]});
 const now=x.task(task.id);assert.equal(now.data.title,'Mine');assert.equal(now.data.priority,'High','their change is kept');assert.equal(now.revision,3);
 const stale=publicRecord(task);
 await assert.rejects(send({action:'commit',mutationId:'m-4',changes:[change(stale,withData(stale,{priority:'Low'}))]}),e=>e.code==='conflict'&&e.current.data.priority==='High'&&/same field/.test(e.message));
 assert.equal(x.task(task.id).data.priority,'High');
});
test('sending: edits to a deleted task and deletes of a changed task are conflicts; a delete of an already deleted task is fine',async t=>{
 t.mock.timers.enable({apis:['Date'],now:T0});const x=world(),all=tasks(x),a=all[0],b=all[1],send=sender(x);
 const beforeA=publicRecord(a);await x.service.execute('alice',{...x.scope,action:'deleteTask',projectId:x.project,taskId:a.id,opId:'gone',baseRevision:a.revision});
 await assert.rejects(send({action:'commit',mutationId:'m-5',changes:[change(beforeA,withData(beforeA,{title:'x'}))]}),e=>e.code==='conflict'&&/deleted/.test(e.message));
 const ok=await send({action:'commit',mutationId:'m-6',changes:[change(beforeA,null)]});assert.deepEqual(ok.records,[]);
 const beforeB=publicRecord(b);await x.service.execute('alice',{...x.scope,action:'patch',projectId:x.project,taskId:b.id,opId:'chg',baseRevision:1,set:{title:'Changed'}});
 await assert.rejects(send({action:'commit',mutationId:'m-7',changes:[change(beforeB,null)]}),e=>e.code==='conflict');
 assert.equal(x.task(b.id).deleted,false);
});
test('sending: create, comment and time entry work end to end; other queued requests pass through untouched',async t=>{
 t.mock.timers.enable({apis:['Date'],now:T0});const x=world(),task=tasks(x)[0],send=sender(x);
 const draft=model.defaultTask({id:'fresh-task',title:'Fresh'});
 const created=await send({action:'commit',mutationId:'m-8',changes:[change(null,{key:S.keyOf('tasks',x.project,'fresh-task'),kind:'tasks',projectId:x.project,boardId:'',id:'fresh-task',order:50,data:draft})]});
 assert.equal(created.records[0].id,'fresh-task');assert.equal(x.task('fresh-task').revision,1);
 const comment={id:'cm-1',taskId:task.id,author:'Ann',body:'Hello',at:'2026-11-19T12:00:00.000Z'};
 await send({action:'commit',mutationId:'m-9',changes:[change(null,{key:S.keyOf('comments',x.project,'cm-1'),kind:'comments',projectId:x.project,boardId:'',id:'cm-1',order:0,data:comment})]});
 assert.equal(x.record('comments','cm-1').data.body,'Hello');
 const entry={id:'te-1',taskId:task.id,owner:'Ann',date:'2026-11-01',hours:2,rateAtEntry:null,note:''};
 await send({action:'commit',mutationId:'m-10',changes:[change(null,{key:S.keyOf('timeEntries',x.project,'te-1'),kind:'timeEntries',projectId:x.project,boardId:'',id:'te-1',order:0,data:entry})]});
 assert.equal(x.record('timeEntries','te-1').data.hours,2);
 const seen=[];await createSender({request:async body=>{seen.push(body);return {ok:true};}})({action:'message',body:'hi',mutationId:'q'});assert.deepEqual(seen,[{action:'message',body:'hi',mutationId:'q'}]);
});

test('planning: several unrelated changes in one queued edit become several calls in a fixed order with stable operation IDs; the cascade of a delete is not sent',()=>{
 const {plan}=require('../../src/cloud/v4Writes.cjs');
 const mk=(id,p,extra={})=>publicRecord({key:`tasks~${p}~~${id}`,kind:'tasks',projectId:p,boardId:'',id,order:0,revision:2,data:{title:id,dependsOn:[],parentId:''},...extra});
 const a=mk('a','p'),b=mk('b','p'),c=mk('c','q'),dependent=mk('d','p',{data:{title:'d',dependsOn:['a'],parentId:''}});
 const link={key:'dependencies~p~~a%3Ed',kind:'dependencies',projectId:'p',boardId:'',id:'a>d',order:0,revision:1,data:{predecessorId:'a',successorId:'d'}};
 const changes=[change(c,withData(c,{title:'C2'})),change(a,null),change(link,null),change(dependent,{...withData(dependent,{}),data:{...dependent.data,dependsOn:[],verified:false}}),change(b,withData(b,{title:'B2'})),change(null,{key:'tasks~p~~n',kind:'tasks',projectId:'p',boardId:'',id:'n',order:3,data:{title:'n'}})];
 const steps=plan(changes,'op'),again=plan([...changes].reverse(),'op');
 assert.deepEqual(steps.map(s=>s.request.action),['deleteTask','createTask','patch','patch']);
 assert.deepEqual(steps.map(s=>s.request.opId),['op.0','op.1','op.2','op.3']);assert.deepEqual(again.map(s=>s.request),steps.map(s=>s.request),'the same calls whatever the order of the changes');
 assert.deepEqual(steps.filter(s=>s.request.action==='patch').map(s=>s.request.taskId),['b','c']);
 assert.deepEqual(plan([change(b,null),{key:'gone',before:null,after:null}],'op').map(s=>s.request.opId),['op']);
 assert.deepEqual(plan([change(b,withData(b,{}))],'op'),[]);
});
