'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const model=require('../src/model.cjs');
const workflow=model.taskWorkflows;
const project=()=>model.makeProject({id:'P',name:'Test',tasks:[
 {id:'A',title:'Design',status:'Done',verified:true,merged:true,releaseId:'R',parentId:'',priority:'High',tests:[]},
 {id:'B',title:'Build',status:'In progress',dependsOn:['A'],parentId:'A',owner:'Sam',priority:'Medium',releaseId:'R'},
 {id:'C',title:'Validate',status:'Backlog',dependsOn:['B'],parentId:'B',priority:'Low',releaseId:'R'}],
 releases:[{id:'R',name:'Release',status:'Released',mainSha:'mocksha'}]});

test('old projects normalize to parentId empty without date loss',()=>{
 const a=model.makeProject({name:'Old',tasks:[{id:'t1',title:'Task',due:'2026-12-15'}]});
 assert.equal(a.tasks[0].parentId,'');assert.equal(a.tasks[0].due,'2026-12-15');
});
test('hierarchy depth, order and descendants',()=>{
 const p=project(); assert.deepEqual([...workflow.hierarchy(p.tasks)].map(([id,depth])=>[id,depth]),[['A',0],['B',1],['C',2]]);
 assert.deepEqual(workflow.hierarchyOrder(p.tasks).map(v=>v.task.id),['A','B','C']);
 assert.deepEqual([...workflow.descendants(p.tasks,'A')],['B','C']);
});
test('parent move is persisted and round-trips through project import/workspace recovery',()=>{
 let p=project();p=workflow.setParent(p,'C','A');model.validateProject(p);
 assert.equal(model.importProject(JSON.parse(JSON.stringify(p))).tasks.find(t=>t.id==='C').parentId,'A');
 const w=model.normalizeWorkspace({projects:[p],selectedId:p.id});assert.equal(w.projects[0].tasks[2].parentId,'A');
 const recovered=model.restoreSnapshot(w,model.projectSnapshot(w));assert.equal(recovered.projects[0].tasks[2].parentId,'A');
});
test('reject missing parent, self-parent and parent cycles atomically',()=>{
 const p=project();for(const [id,parent] of [['A','A'],['A','C'],['B','missing']]){
  assert.throws(()=>workflow.setParent(p,id,parent),/parent|Circular|own/);
  assert.equal(p.tasks.find(t=>t.id===id).parentId,id==='A'?'':'A');
 }
});
test('validate imported hierarchy against missing parents and circular cycles',()=>{
 for(const parents of [['q','x'],['y','x']]){const data=model.makeProject({tasks:[{id:'x',title:'X',parentId:parents[0]},{id:'y',title:'Y',parentId:parents[1]}]});assert.throws(()=>model.validateProject(data),/parent|Circular/)}
});
test('delete parent detaches children and removes predecessor links',()=>{
 const p=project(),next=model.deleteTaskWithLinks(p,'B');
 const a=next.tasks.find(t=>t.id==='A'),c=next.tasks.find(t=>t.id==='C');
 assert.equal(c.parentId,'');assert.deepEqual(c.dependsOn,[]);assert.equal(a.id,'A');
 assert.equal(next.releases[0].status,'Testing');model.validateProject(next);
});
test('query filters status, priority and searches parent-independent text',()=>{
 const p=project();assert.deepEqual(workflow.query(p.tasks,{status:'In progress'}).map(t=>t.id),['B']);
 assert.deepEqual(workflow.query(p.tasks,{priority:'Low',text:'VALID'}).map(t=>t.id),['C']);
 assert.deepEqual(workflow.query(p.tasks,{owner:'Sam'}).map(t=>t.id),['B']);
 assert.equal(workflow.query(p.tasks,{text:'no match'}).length,0);
});
test('bounded incremental pagination',()=>{
 const tasks=Array.from({length:999},(_,i)=>({id:String(i)}));
 assert.equal(workflow.page(tasks,40,1).items.length,40);
 assert.equal(workflow.page(tasks,40,25).items.length,999);
 assert.equal(workflow.page(tasks,40,25).hasMore,false);
 assert.equal(workflow.page(tasks,40,1).hasMore,true);
 assert.throws(()=>workflow.page(tasks,10000,1),/page/);
});
test('atomic bulk updates apply selected priority only and leave source unchanged',()=>{
 const p=project(),result=workflow.bulkUpdate(p,['A','B'],'priority','Critical');
 assert.equal(result.changed,2);assert.equal(result.project.tasks[0].priority,'Critical');
 assert.equal(result.project.tasks[2].priority,'Low');assert.equal(p.tasks[0].priority,'High');
 assert.equal(result.project.releases[0].status,'Testing');
});
test('bulk completed status validates blocking predecessor after proposed changes',()=>{
 const p=project();
 assert.throws(()=>workflow.bulkUpdate(p,['C'],'status','Done'),/blocked/);
 const result=workflow.bulkUpdate(p,['B','C'],'status','Done');
 assert.equal(result.changed,2);assert.equal(result.project.tasks.find(t=>t.id==='C').status,'Done');
});
test('bulk rejects invalid priority, status, duplicates and unknown ids without mutation',()=>{
 const p=project(),before=JSON.stringify(p);
 const attempts=[[['A'],'priority','Ultimate'],[['A'],'status','New'],[['A','A'],'priority','High'],[['X'],'priority','High'],[[],'priority','High']];
 for(const args of attempts)assert.throws(()=>workflow.bulkUpdate(p,...args));
 assert.equal(JSON.stringify(p),before);
});
test('bulk no-op keeps reference and does not claim changes',()=>{
 const p=project(),result=workflow.bulkUpdate(p,['A'],'priority','High');
 assert.equal(result.changed,0);assert.strictEqual(result.project,p);
});
test('automation rules apply to bulk status changes',()=>{
 const p={...project(),automations:[{enabled:true,name:'Promotion',triggerStatus:'Validation',action:'priority',value:'High'}]};
 const q=workflow.bulkUpdate(p,['B'],'status','Validation').project;
 assert.equal(q.tasks.find(t=>t.id==='B').priority,'High');
});
test('large workspaces filter and paginate predictably',()=>{
 const tasks=Array.from({length:10000},(_,i)=>({id:`T${i}`,title:`Ticket ${i}`,status:i%2?'Done':'Backlog',priority:'Medium',owner:'Member',labels:[]}));
 const matched=workflow.query(tasks,{status:'Done'});
 assert.equal(matched.length,5000);assert.equal(workflow.page(matched,40,1).items.length,40);
});
test('snapshot retains task hierarchy and bulk results',()=>{
 const p=workflow.bulkUpdate(project(),['B'],'priority','Critical').project;
 const w=model.normalizeWorkspace({projects:[p],selectedId:p.id});
 const s=model.workspaceSnapshot(w);const back=model.restoreSnapshot(w,s);
 assert.equal(back.projects[0].tasks.find(t=>t.id==='B').parentId,'A');
 assert.equal(back.projects[0].tasks.find(t=>t.id==='B').priority,'Critical');
});
