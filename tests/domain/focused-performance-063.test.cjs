// /tests/domain/focused-performance-063.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const model=require('../../src/domain/model.cjs'),{scheduleSeries}=require('../../src/domain/dashboard.cjs'),{load}=require('../helpers/diagram-harness.cjs');
const plain=x=>JSON.parse(JSON.stringify(x));
function fixture(){const projects=Array.from({length:3},(_,i)=>model.makeProject({id:'p'+i,name:'Project '+i,tasks:Array.from({length:3},(_,n)=>({id:`p${i}-t${n}`,title:'Task '+n,due:'2026-11-05'}))}));return {...model.createWorkspace(),projects,selectedId:'p0',portfolios:Array.from({length:8},(_,i)=>({id:'f'+i,name:'Portfolio '+i,projectIds:projects.map(p=>p.id)}))};}
test('portfolio health computes once per immutable project/day, matches domain truth and refreshes after edits or rollover',()=>{
 let today='2026-11-05',calls=0;const bridge=load('src/domain/modernBridge.cjs',{'../utils/localDay.cjs':{localDay:()=>today},'./model.cjs':{...model,operations:{...model.operations,health:(...args)=>{calls++;return model.operations.health(...args);}}}});
 let w=fixture(),before=JSON.stringify(w),v=bridge.projectView(w);assert.equal(calls,3);assert.equal(v.portfolios[0].health,'On track');
 w={...w,projects:w.projects.map((p,i)=>i?p:{...p,name:'Renamed'})};v=bridge.projectView(w);assert.equal(calls,4);assert.equal(v.portfolios[0].projects[0],'Renamed');
 const health=w.projects.map(p=>model.operations.health(p,today));assert.equal(v.portfolios[0].progress,health.reduce((n,h)=>n+h.progress,0)/(3*100));
 today='2026-11-06';v=bridge.projectView(w);assert.equal(calls,7);assert.equal(v.portfolios[0].health,'At risk');
 const frozen=model.normalizeWorkspace(JSON.parse(before));assert.equal(JSON.stringify(frozen.projects[0].tasks),JSON.stringify(w.projects[0].tasks));assert.equal(bridge.projectView(frozen).portfolios[0].health,'At risk');
 assert.deepEqual(plain(bridge.projectView({...w,portfolios:[{id:'empty',name:'Empty',projectIds:[]}]}).portfolios),[{id:'empty',name:'Empty',projects:[],health:'On track',progress:0}]);
});
test('completed sprint velocity is derived once per projection and frozen burndown remains unchanged after task edits/import',()=>{
 let calls=0;const bridge=load('src/domain/modernBridge.cjs',{'./model.cjs':{...model,operations:{...model.operations,sprintVelocity:p=>{calls++;return model.operations.sprintVelocity(p);}}}});
 const p=model.makeProject({id:'p',name:'History',tasks:[{id:'t',title:'Current task'}],sprints:Array.from({length:12},(_,i)=>({id:'s'+i,name:'Sprint '+i,start:'2026-11-01',end:'2026-11-03',startedAt:'2026-11-01T09:00:00Z',completedAt:'2026-11-03T10:00:00Z',state:'completed',taskIds:[],history:[{at:'2026-11-01T09:00:00Z',total:4,remaining:4},{at:'2026-11-03T10:00:00Z',total:4,remaining:1}]}))});
 const w={...model.createWorkspace(),projects:[p],selectedId:'p'},v=bridge.projectView(w);assert.equal(calls,1);assert.ok(v.sprints.every(s=>s.velocity===3));
 for(const s of v.sprints){const expected=model.agile.burndown(p,s.id);assert.deepEqual(plain(s.burn.recorded),expected.map(x=>x.remaining));}
 const copy=model.normalizeWorkspace(JSON.parse(JSON.stringify({...w,projects:[{...p,tasks:p.tasks.map(t=>({...t,status:'Done'}))}]})));
 assert.deepEqual(plain(bridge.projectView(copy).sprints),plain(v.sprints));assert.equal(calls,2);
});
test('schedule aggregation keeps UTC weekdays, stable task order, Done counts, bounds and persistence behavior without mutating tasks',()=>{
 const tasks=[{id:'a',due:'2026-12-31',status:'Done'},{id:'b',due:'2027-01-01',status:'Backlog'},{id:'c',due:'2026-12-31',status:'Backlog'},{id:'none',due:''},{id:'invalid',due:'2026-02-30'}],before=JSON.stringify(tasks);
 const rows=scheduleSeries(tasks,'2026-12-31',3);assert.deepEqual(rows,[{date:'2026-12-31',label:'Thu',value:2,done:1,ids:['a','c']},{date:'2027-01-01',label:'Fri',value:1,done:0,ids:['b']},{date:'2027-01-02',label:'Sat',value:0,done:0,ids:[]}]);
 assert.deepEqual(scheduleSeries(JSON.parse(before),'2026-12-31',3),rows);assert.equal(JSON.stringify(tasks),before);assert.deepEqual(scheduleSeries(tasks,'2026-02-30'),[]);assert.equal(scheduleSeries([], '2026-11-01',100).length,31);assert.equal(scheduleSeries([], '2026-11-01',0).length,1);
});
