// /tests/cloud/support-contract.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
// FIX-11 (0.8.36). The "support contract": for every kind of record and every kind of edit, what a v4 workspace does with it today.
// Three outcomes only: it is sent to the cloud, it is local bookkeeping (nothing to send), or it is "not shared yet" (kept on this device).
// Any other outcome (an unexplained error) fails. When support is added or removed this table must be changed on purpose, so nobody is surprised again by "it passed but did not sync".
// Planner-tested only: this checks the sender's plan, not a server or a device.
const W=require('../../src/cloud/v4Writes.cjs'),S=require('../../src/cloud/schema.cjs');
const rec=(kind,id,data,extra={})=>({key:[kind,extra.projectId??'p1',extra.boardId??'',id].join('~'),kind,id,projectId:extra.projectId??'p1',boardId:extra.boardId??'',data:{id,...data},order:extra.order??1,revision:1,sequence:1});
const chg=(before,after)=>({key:(before||after).key,before,after,baseRevision:before?1:0});
const w=(r,patch)=>({...r,data:{...r.data,...patch}});
const cases={};const add=(name,...changes)=>cases[name]=changes;
const T=rec('tasks','t1',{title:'A',status:'todo',dependsOn:[],parentId:''}),T2=rec('tasks','t2',{title:'B',status:'todo',dependsOn:[],parentId:''});
add('tasks: create',chg(null,T));add('tasks: edit title',chg(T,w(T,{title:'B'})));add('tasks: delete',chg(T,null));
add('tasks: move',chg(T,{...T,order:2}));add('tasks: move and edit together',chg(T,{...w(T,{title:'B'}),order:2}));
add('tasks: remove a field',chg(T,{...T,data:{id:'t1',title:'A',status:'todo',dependsOn:[]}}));
add('tasks: edit dependencies',chg(T,w(T,{dependsOn:['t2']})));
add('tasks: move two at once',chg(T,{...T,order:3}),chg(T2,{...T2,order:0}));
const C=rec('comments','c1',{taskId:'t1',text:'hi'});add('comments: create',chg(null,C));add('comments: edit',chg(C,w(C,{text:'x'})));add('comments: delete',chg(C,null));
const TE=rec('timeEntries','e1',{taskId:'t1',minutes:5});add('timeEntries: create',chg(null,TE));add('timeEntries: edit',chg(TE,w(TE,{minutes:9})));add('timeEntries: delete',chg(TE,null));
const bx={boardId:'b1'};const O=rec('canvas.objects','o1',{type:'note',x:1,y:2,width:10,height:10,text:'n',color:'',groupId:'',locked:false,zIndex:1,boardId:'b1'},bx);
add('canvas.objects: create',chg(null,O));add('canvas.objects: create linked',chg(null,w(O,{type:'linked'})));add('canvas.objects: create inside a group',chg(null,w(O,{groupId:'g'})));
add('canvas.objects: join a group',chg(O,w(O,{groupId:'g'})));add('canvas.objects: leave a group',chg(w(O,{groupId:'g'}),O));add('canvas.objects: change a linked source',chg(w(O,{type:'linked',sourceLink:{mode:'live'}}),w(O,{type:'linked',sourceLink:{mode:'snapshot'}})));
add('canvas.objects: move',chg(O,w(O,{x:5})));add('canvas.objects: edit text',chg(O,w(O,{text:'m'})));add('canvas.objects: edit unknown property',chg(O,w(O,{mystery:1})));
add('canvas.objects: delete',chg(O,null));add('canvas.objects: reorder',chg(O,{...O,order:4}));
const K=rec('canvas.connectors','k1',{from:'o1',to:'o2',boardId:'b1'},bx);
add('canvas.connectors: create',chg(null,K));add('canvas.connectors: edit label',chg(K,w(K,{label:'x'})));add('canvas.connectors: delete',chg(K,null));
const TH=rec('canvas.threads','th1',{objectId:'o1',x:0,y:0,resolvedAt:null,messages:[{id:'m1',text:'hi'}],boardId:'b1'},bx);add('canvas.threads: create',chg(null,TH));add('canvas.threads: reply',chg(TH,w(TH,{messages:[{id:'m1',text:'hi'},{id:'m2',text:'yo'}]})));add('canvas.threads: resolve',chg(TH,w(TH,{resolvedAt:'2026-11-24T10:00:00.000Z'})));add('canvas.threads: move',chg(TH,w(TH,{x:50})));add('canvas.threads: delete',chg(TH,null));
const B=rec('canvases','b1',{title:'Board',revision:0,updatedAt:'t',viewport:{x:0,y:0,scale:1},archivedAt:null,objects:undefined},{boardId:''});
add('canvases: counter/viewport only (bookkeeping)',chg(B,w(B,{revision:1,viewport:{x:5,y:5,scale:1}})));add('canvases: rename',chg(B,w(B,{title:'New'})));add('canvases: create board',chg(null,B));add('canvases: archive',chg(B,w(B,{archivedAt:'t'})));add('canvases: delete board',chg(B,null));
const P=rec('projects','p1',{name:'Proj',governance:{},scheduling:{}},{projectId:'p1'});add('projects: create',chg(null,P));add('projects: edit',chg(P,w(P,{name:'X'})));add('projects: delete',chg(P,null));
for(const k of ['governance.risks','governance.wbs','governance.budget.lines','governance.docs','boards','dependencies','portfolios','programs']){const R=rec(k,'r1',{name:'n'});add(k+': create',chg(null,R));add(k+': edit',chg(R,w(R,{name:'m'})));add(k+': delete',chg(R,null));}

const outcomeOf=changes=>{try{const steps=W.plan(changes,'op');return steps.length?'sent: '+steps.map(s=>s.request.action).join('+'):'nothing to send (local bookkeeping or unchanged)';}catch(e){return e.local?'not shared yet':'ERROR '+e.code+' '+String(e.message).slice(0,60);}};
const EXPECTED={
 "tasks: create":"sent: createTask",
 "tasks: edit title":"sent: patch",
 "tasks: delete":"sent: deleteTask",
 "tasks: move":"sent: moveTask",
 "tasks: move and edit together":"sent: patch+moveTask",
 "tasks: remove a field":"not shared yet",
 "tasks: edit dependencies":"sent: patchDependencies",
 "tasks: move two at once":"not shared yet",
 "comments: create":"sent: addComment",
 "comments: edit":"not shared yet",
 "comments: delete":"not shared yet",
 "timeEntries: create":"sent: logTime",
 "timeEntries: edit":"not shared yet",
 "timeEntries: delete":"not shared yet",
 "canvas.objects: create":"sent: createCanvasObject",
 "canvas.objects: create linked":"sent: createCanvasObject",
 "canvas.objects: create inside a group":"sent: createCanvasObject",
 "canvas.objects: join a group":"sent: patchCanvas",
 "canvas.objects: leave a group":"sent: patchCanvas",
 "canvas.objects: change a linked source":"sent: patchCanvas",
 "canvas.objects: move":"sent: patchCanvas",
 "canvas.objects: edit text":"sent: patchCanvas",
 "canvas.objects: edit unknown property":"not shared yet",
 "canvas.objects: delete":"sent: deleteCanvasObjects",
 "canvas.objects: reorder":"not shared yet",
 "canvas.connectors: create":"sent: createCanvasConnector",
 "canvas.connectors: edit label":"sent: patchCanvasConnector",
 "canvas.connectors: delete":"sent: deleteCanvasConnector",
 "canvas.threads: create":"sent: createCanvasThread",
 "canvas.threads: reply":"sent: patchCanvasThread",
 "canvas.threads: resolve":"sent: patchCanvasThread",
 "canvas.threads: move":"not shared yet",
 "canvas.threads: delete":"not shared yet",
 "canvases: counter/viewport only (bookkeeping)":"nothing to send (local bookkeeping or unchanged)",
 "canvases: rename":"sent: patchCanvasBoard",
 "canvases: create board":"sent: createCanvasBoard",
 "canvases: archive":"sent: patchCanvasBoard",
 "canvases: delete board":"sent: deleteCanvasBoard",
 "projects: create":"not shared yet",
 "projects: edit":"not shared yet",
 "projects: delete":"not shared yet",
 "governance.risks: create":"sent: createProjectRecord",
 "governance.risks: edit":"sent: patchProjectRecord",
 "governance.risks: delete":"sent: deleteProjectRecord",
 "governance.wbs: create":"sent: createProjectRecord",
 "governance.wbs: edit":"sent: patchProjectRecord",
 "governance.wbs: delete":"sent: deleteProjectRecord",
 "governance.budget.lines: create":"sent: createProjectRecord",
 "governance.budget.lines: edit":"sent: patchProjectRecord",
 "governance.budget.lines: delete":"sent: deleteProjectRecord",
 "governance.docs: create":"sent: createProjectRecord",
 "governance.docs: edit":"sent: patchProjectRecord",
 "governance.docs: delete":"sent: deleteProjectRecord",
 "boards: create":"not shared yet",
 "boards: edit":"not shared yet",
 "boards: delete":"not shared yet",
 "dependencies: create":"not shared yet",
 "dependencies: edit":"not shared yet",
 "dependencies: delete":"not shared yet",
 "portfolios: create":"not shared yet",
 "portfolios: edit":"not shared yet",
 "portfolios: delete":"not shared yet",
 "programs: create":"not shared yet",
 "programs: edit":"not shared yet",
 "programs: delete":"not shared yet"
};
test('support contract: every kind of edit is sent, is local bookkeeping, or is kept as "not shared yet" - exactly as the table says',()=>{
 const actual=Object.fromEntries(Object.entries(cases).map(([name,changes])=>[name,outcomeOf(changes)]));
 assert.deepEqual(Object.keys(actual).sort(),Object.keys(EXPECTED).sort(),'the list of cases and the table must match');
 assert.deepEqual(actual,EXPECTED);
 for(const [name,v] of Object.entries(actual))assert.ok(/^(sent: |nothing to send|not shared yet$)/.test(v),name+' ended with an unexplained outcome: '+v);
});
test('support contract: what the owner uses every day is sent (tasks, Canvas objects and connectors)',()=>{
 for(const name of ['tasks: create','tasks: edit title','tasks: delete','tasks: move','canvas.objects: create','canvas.objects: move','canvas.objects: edit text','canvas.objects: delete','canvas.connectors: create','canvas.connectors: edit label','canvas.connectors: delete'])assert.match(EXPECTED[name],/^sent: /,name);
});
