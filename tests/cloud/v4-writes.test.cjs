// /tests/cloud/v4-writes.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {database,generate}=require('../helpers/cloud-fake.cjs'),{alignOrders,requestFor,createSender,publicRecord,plan,localAcks}=require('../../src/cloud/v4Writes.cjs'),S=require('../../src/cloud/schema.cjs'),model=require('../../src/domain/model.cjs');
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
 refuses([change(t,{...withData(t,{}),order:5}),change(other,{...withData(other,{}),order:9})],/several tasks at once/);
 refuses([change(t,{...withData(t,{title:'b'}),data:{dependsOn:[]}})],/removing the field title/);
 refuses([change(t,{...withData(t,{title:'b'}),order:5})].map(c=>({...c,after:{...c.after,data:{}}})),/removing the field title/);
 assert.throws(()=>requestFor([change(t,withData(t,{title:'b'})),change(other,withData(other,{title:'x'}))],'o'),/several records/,'the one-call form refuses what needs two calls');
 refuses([change(null,{key:'k',kind:'risks',projectId:'p',boardId:'b',id:'o',order:0,data:{}})],/adding this kind/);
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
const objects=x=>[...x.rows.values()].filter(r=>r.kind==='canvas.objects'&&!r.deleted).sort((a,b)=>a.key<b.key?-1:1);
test('Canvas mapping: move, resize and stacking become one patchCanvas with only those fields; other properties are refused',()=>{
 const x=world(),o=publicRecord(objects(x)[0]);
 const out=requestFor([change(o,withData(o,{x:o.data.x+5,zIndex:(o.data.zIndex||0)+1,updatedAt:'ignored'}))],'op-c');
 assert.deepEqual(out.request,{action:'patchCanvas',projectId:o.projectId,boardId:o.boardId,objectId:o.id,opId:'op-c',baseRevision:o.revision,set:{x:o.data.x+5,zIndex:(o.data.zIndex||0)+1}});
 assert.throws(()=>requestFor([change(o,withData(o,{type:'frame'}))],'o'),e=>e.code==='failed-precondition'&&/Canvas property type/.test(e.message));
 assert.deepEqual(requestFor([change(o,withData(o,{updatedAt:'only'}))],'o'),{noop:true});
});
test('Canvas mapping: objects removed together are one call per board; their connectors, threads and the frame reset are not sent',()=>{
 const x=world(),[a,b,c]=objects(x).map(publicRecord),conn={key:'canvas.connectors~'+a.projectId+'~'+a.boardId+'~k1',kind:'canvas.connectors',projectId:a.projectId,boardId:a.boardId,id:'k1',order:0,revision:1,data:{from:a.id,to:c.id}};
 const thread={...conn,key:conn.key+'t',kind:'canvas.threads',id:'t1',data:{objectId:b.id}};
 const steps=plan([change(b,null),change(a,null),change(conn,null),change(thread,null),change({...c,data:{...c.data,groupId:a.id}},{...c,data:{...c.data,groupId:''}})],'op');
 const calls=steps.map(s=>s.request);assert.equal(calls.length,1,'one delete for a and b; the connector, the thread and the frame reset are the server cascade');
 const del=calls.find(r=>r.action==='deleteCanvasObjects');assert.deepEqual(del.objectIds,[a.id,b.id].sort());assert.deepEqual(del.bases,{[a.id]:a.revision,[b.id]:b.revision});assert.equal(del.opId,'op');
});
test('Canvas sending: a move reaches the server; a delete returns the removed objects; a stale move on another field is re-applied',async t=>{
 t.mock.timers.enable({apis:['Date'],now:T0});const x=world(),[a,b]=objects(x).map(publicRecord),send=sender(x);
 await send({action:'commit',mutationId:'c-1',changes:[change(a,withData(a,{x:a.data.x+9}))]});assert.equal(x.record('canvas.objects',a.id).data.x,a.data.x+9);
 await x.service.execute('alice',{...x.scope,action:'patchCanvas',projectId:b.projectId,boardId:b.boardId,objectId:b.id,opId:'other',baseRevision:b.revision,set:{y:b.data.y+3}});
 await send({action:'commit',mutationId:'c-2',changes:[change(b,withData(b,{x:b.data.x+4}))]});
 const now=x.record('canvas.objects',b.id).data;assert.equal(now.x,b.data.x+4);assert.equal(now.y,b.data.y+3,'their move is kept');
 const cur=publicRecord(x.record('canvas.objects',a.id)),ack=await send({action:'commit',mutationId:'c-3',changes:[change(cur,null)]});
 assert.ok(ack.records.some(r=>r.id===a.id&&r.deleted===true));assert.equal(x.record('canvas.objects',a.id).deleted,true);
});

test('moveTask mapping: a position change is one moveTask; moved and edited together are a patch then a moveTask; stale base is re-based when nobody else moved it',async t=>{
 t.mock.timers.enable({apis:['Date'],now:T0});const x=world(),[a,b]=tasks(x),before=publicRecord(a);
 assert.deepEqual(requestFor([change(before,{...withData(before,{}),order:before.order+0.5})],'op-m').request,{action:'moveTask',projectId:before.projectId,taskId:before.id,opId:'op-m',baseRevision:before.revision,order:before.order+0.5});
 const steps=plan([change(before,{...withData(before,{title:'Moved and renamed'}),order:before.order+0.5})],'op-n');
 assert.deepEqual(steps.map(s=>s.request.action),['patch','moveTask']);
 const send=sender(x);await send({action:'commit',mutationId:'op-n',changes:[change(before,{...withData(before,{title:'Moved and renamed'}),order:before.order+0.5})]});
 const now=x.task(a.id);assert.equal(now.data.title,'Moved and renamed');assert.equal(now.order,before.order+0.5);assert.equal(now.revision,3);
 const other=publicRecord(x.task(b.id));await x.service.execute('alice',{...x.scope,action:'moveTask',projectId:other.projectId,taskId:other.id,opId:'rival',baseRevision:other.revision,order:other.order+0.25});
 await assert.rejects(send({action:'commit',mutationId:'op-o',changes:[change(other,{...withData(other,{}),order:other.order+0.75})]}),e=>e.code==='conflict');
 assert.equal(x.task(b.id).order,other.order+0.25,'the first mover wins');
});

test('Canvas creates: a note and a connector map to their own calls in order; linked and grouped notes are sent (0.8.43); board bookkeeping is not sent but acknowledged locally',()=>{
 const x=world(),[a]=objects(x).map(publicRecord),mk=(kind,id,data,extra={})=>({key:kind+'~'+a.projectId+'~'+a.boardId+'~'+id,kind,projectId:a.projectId,boardId:a.boardId,id,order:7,data,...extra});
 const note=mk('canvas.objects','n1',{...a.data,id:'n1'}),edge=mk('canvas.connectors','e1',{id:'e1',from:a.id,to:'n1',label:'',style:'curve',arrow:true});
 const steps=plan([change(null,edge),change(null,note)],'op');assert.deepEqual(steps.map(s=>s.request.action),['createCanvasObject','createCanvasConnector']);
 assert.deepEqual(steps[0].request,{action:'createCanvasObject',projectId:a.projectId,boardId:a.boardId,objectId:'n1',order:7,data:note.data,opId:'op.0'});
 assert.equal(requestFor([change(null,mk('canvas.objects','n2',{...a.data,id:'n2',type:'linked'}))],'o').request.action,'createCanvasObject');
 assert.equal(requestFor([change(null,mk('canvas.objects','n3',{...a.data,id:'n3',groupId:'f'}))],'o').request.action,'createCanvasObject');
 // 0.8.43: a new frame is created before the notes that join it, even when the frame sorts later; joining or leaving a group is a field patch.
 const frame=mk('canvas.objects','zz-frame',{...a.data,id:'zz-frame',type:'frame'}),inside=mk('canvas.objects','aa-note',{...a.data,id:'aa-note',groupId:'zz-frame'});
 assert.deepEqual(plan([change(null,inside),change(null,frame)],'o').map(s=>s.request.objectId),['zz-frame','aa-note']);
 const join=requestFor([change(a,{...a,data:{...a.data,groupId:'zz-frame'}})],'o').request;assert.deepEqual({action:join.action,set:join.set},{action:'patchCanvas',set:{groupId:'zz-frame'}});
 const link={mode:'live',sourceType:'task',sourceId:'t1',projectId:a.projectId,view:'tree',direction:'down',scopeType:'project',scopeId:''};
 assert.deepEqual(requestFor([change(a,{...a,data:{...a.data,sourceLink:link}})],'o').request.set,{sourceLink:link});
 const board={key:'canvases~'+a.projectId+'~'+a.boardId,kind:'canvases',projectId:a.projectId,boardId:'',id:a.boardId,order:0,revision:3,sequence:3,data:{title:'T',revision:4,updatedAt:'a',viewport:{x:0,y:0,scale:1}}},next={...board,data:{...board.data,revision:5,updatedAt:'b',viewport:{x:9,y:9,scale:2}}};
 assert.deepEqual(plan([change(board,next)],'o'),[]);assert.deepEqual(requestFor([change(board,next)],'o'),{noop:true});
 const ack=localAcks([change(board,next)]);assert.equal(ack.length,1);assert.equal(ack[0].data.revision,5);assert.equal(ack[0].sequence,3,'the server revision does not move');
 // 0.8.41: a rename and an archive are sent as one board call; any other board property is still kept on the device.
 const rename=requestFor([change(board,{...next,data:{...next.data,title:'Renamed'}})],'o').request;
 assert.deepEqual({action:rename.action,boardId:rename.boardId,baseRevision:rename.baseRevision,set:rename.set},{action:'patchCanvasBoard',boardId:a.boardId,baseRevision:3,set:{title:'Renamed'}});
 assert.deepEqual(requestFor([change(board,{...next,data:{...next.data,archivedAt:'2026-11-23T10:00:00.000Z'}})],'o').request.set,{archivedAt:'2026-11-23T10:00:00.000Z'});
 assert.throws(()=>requestFor([change(board,{...next,data:{...next.data,ownerId:'x'}})],'o'),e=>e.code==='failed-precondition'&&e.local===true);
});

test('alignOrders keeps the stored update time of a task or Canvas object, so an edit never looks like a change of it',()=>{
 const mk=(kind,u,x)=>({key:kind+'~p~~a',kind,projectId:'p',boardId:'',id:'a',order:0,data:{updatedAt:u,x}}),local=[mk('tasks','U0',1),mk('canvas.objects','U0',1),mk('comments','U0',1)],next=[mk('tasks','U9',2),mk('canvas.objects','U9',2),mk('comments','U9',2)];
 const out=alignOrders(next,local);assert.deepEqual(out.map(r=>[r.data.updatedAt,r.data.x]),[['U0',2],['U0',2],['U9',2]],'tasks and Canvas objects keep the stored time, other kinds are untouched; the real change stays');
 assert.equal(alignOrders([mk('tasks','U9',2)],[]).at(0).data.updatedAt,'U9','a new record keeps its own');
});

test('Canvas edits: text, colour and lock are one patchCanvas; a connector edit, colour clear and delete have their own calls; other connector properties are refused',()=>{
 const x=world(),[a]=objects(x).map(publicRecord),edge={key:'canvas.connectors~'+a.projectId+'~'+a.boardId+'~e1',kind:'canvas.connectors',projectId:a.projectId,boardId:a.boardId,id:'e1',order:0,revision:2,sequence:2,data:{id:'e1',from:a.id,to:'z',label:'',style:'curve',arrow:true,color:'#112233'}};
 assert.deepEqual(requestFor([change(a,withData(a,{text:'Hello',color:'#aabbcc',locked:true}))],'o').request.set,{text:'Hello',color:'#aabbcc',locked:true});
 const edit=(patch,drop)=>{const d={...edge.data,...patch};if(drop)delete d[drop];return change(edge,{...edge,data:d});};
 assert.deepEqual(requestFor([edit({label:'blocks',style:'elbow',arrow:false})],'o').request,{action:'patchCanvasConnector',projectId:a.projectId,boardId:a.boardId,connectorId:'e1',opId:'o',baseRevision:2,set:{label:'blocks',style:'elbow',arrow:false}});
 assert.deepEqual(requestFor([edit({},'color')],'o').request.set,{color:''},'a cleared colour is sent as an empty colour');
 assert.throws(()=>requestFor([edit({to:'other'})],'o'),e=>e.code==='failed-precondition'&&/connector property to/.test(e.message));
 assert.deepEqual(requestFor([change(edge,null)],'o').request,{action:'deleteCanvasConnector',projectId:a.projectId,boardId:a.boardId,connectorId:'e1',opId:'o',baseRevision:2});
});

test('0.8.42 Canvas boards: a create is createCanvasBoard (before the notes put on it); a delete is one deleteCanvasBoard and its items are not sent separately; a very large board sends items first',()=>{
 const P='proj1',bd=(id,extra={})=>publicRecord({key:'canvases~'+P+'~~'+id,kind:'canvases',projectId:P,boardId:'',id,order:1,revision:3,data:{id,title:'T',archivedAt:'t',revision:2,...extra}}),item=(kind,id,b)=>publicRecord({key:kind+'~'+P+'~'+b+'~'+id,kind,projectId:P,boardId:b,id,order:0,revision:2,data:{id,boardId:b,from:'a',to:'b'}});
 const b=bd('nb');
 assert.deepEqual(requestFor([change(null,b)],'o').request,{action:'createCanvasBoard',projectId:P,boardId:'nb',order:1,opId:'o',data:b.data});
 const note={...item('canvas.objects','n1','nb'),revision:0},steps=plan([change(null,note),change(null,b)],'o');
 assert.equal(steps[0].request.action,'createCanvasBoard','the board is created before the note on it');assert.equal(steps[1].request.action,'createCanvasObject');
 const kids=[item('canvas.objects','n1','nb'),item('canvas.objects','n2','nb'),item('canvas.connectors','c1','nb')],del=plan([...kids.map(k=>change(k,null)),change(b,null)],'o');
 assert.equal(del.length,1,'the items go with the board');assert.deepEqual(del[0].request,{action:'deleteCanvasBoard',projectId:P,boardId:'nb',baseRevision:3,opId:'o'});
 const many=Array.from({length:120},(_,i)=>item('canvas.objects','m'+i,'nb')),big=plan([...many.map(k=>change(k,null)),change(b,null)],'o');
 assert.equal(big.filter(s=>s.request.action==='deleteCanvasObjects').length,3,'120 items: three calls of up to 50');assert.equal(big.at(-1).request.action,'deleteCanvasBoard','the board goes last');
 const other=item('canvas.objects','x1','otherboard');assert.ok(plan([change(other,null),change(b,null)],'o').some(s=>s.request.action==='deleteCanvasObjects'),'items of a different board are still their own delete');
});

test('0.8.44 Canvas comments: a new thread is one create (after the object it is on); a reply or a resolve is a patch of only messages / resolvedAt; moving a thread is kept on the device',()=>{
 const P='proj1',B='b1',th=(over={},extra={})=>publicRecord({key:'canvas.threads~'+P+'~'+B+'~t1',kind:'canvas.threads',projectId:P,boardId:B,id:'t1',order:2,revision:4,data:{id:'t1',objectId:'o1',x:0,y:0,resolvedAt:null,messages:[{id:'m1',authorId:'local-device',text:'hi',at:'2026-11-24T10:00:00.000Z'}],...over},...extra});
 const t=th();assert.deepEqual(requestFor([change(null,t)],'o').request,{action:'createCanvasThread',projectId:P,boardId:B,threadId:'t1',order:2,data:t.data,opId:'o'});
 const reply=th({messages:[...t.data.messages,{id:'m2',authorId:'local-device',text:'ok',at:'2026-11-24T10:05:00.000Z'}]});
 const r=requestFor([change(t,reply)],'o').request;assert.deepEqual({action:r.action,threadId:r.threadId,baseRevision:r.baseRevision,keys:Object.keys(r.set)},{action:'patchCanvasThread',threadId:'t1',baseRevision:4,keys:['messages']});
 assert.deepEqual(requestFor([change(t,th({resolvedAt:'2026-11-24T11:00:00.000Z'}))],'o').request.set,{resolvedAt:'2026-11-24T11:00:00.000Z'});
 assert.throws(()=>requestFor([change(t,th({x:90}))],'o'),e=>e.local===true);
 const obj=publicRecord({key:'canvas.objects~'+P+'~'+B+'~o1',kind:'canvas.objects',projectId:P,boardId:B,id:'o1',order:1,revision:0,data:{id:'o1',boardId:B,type:'note',x:0,y:0,width:240,height:144,zIndex:1,locked:false,groupId:'',text:'n'}});
 assert.deepEqual(plan([change(null,t),change(null,obj)],'o').map(s=>s.request.action),['createCanvasObject','createCanvasThread']);
});
