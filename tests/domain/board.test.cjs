// /tests/domain/board.test.cjs
const {test}=require('node:test');const assert=require('node:assert/strict');const m=require('../../src/domain/model.cjs');
const base=()=>m.makeProject({id:'p',name:'Fixture',tasks:[
 {id:'a',title:'A',status:'Backlog',start:'2026-11-02',due:'2026-11-05'},
 {id:'b',title:'B',status:'Backlog',dependsOn:['a']},
 {id:'c',title:'C',status:'In progress'},
 {id:'d',title:'D',status:'Done'}
]});
test('drag movement changes lane and stores ordering',()=>{
 let p=base();p=m.moveTask(p,'b','In progress',0);
 assert.equal(p.tasks.find(t=>t.id==='b').status,'In progress');
 assert.deepEqual(p.tasks.filter(t=>t.status==='In progress').sort((a,b)=>a.position-b.position).map(t=>t.id),['b','c']);
 p=m.moveTask(p,'c','In progress',0);
 assert.deepEqual(p.tasks.filter(t=>t.status==='In progress').sort((a,b)=>a.position-b.position).map(t=>t.id),['c','b']);
 assert.equal(m.importProject(JSON.parse(JSON.stringify(p))).tasks.find(t=>t.id==='b').position,1);
});
test('dependency completion guard, cycles, missing deps',()=>{
 const p=base();assert.deepEqual(m.blockers(p,p.tasks[1]),['a']);
 assert.throws(()=>m.moveTask(p,'b','Done'),/Complete dependency/);
 assert.throws(()=>m.setTaskDependencies(p,'a',['b']),/Circular/);
 assert.throws(()=>m.setTaskDependencies(p,'b',['missing']),/Missing dependency/);
 assert.throws(()=>m.setTaskDependencies(p,'b',['b']),/depend on itself/);
 const ready=m.moveTask(p,'a','Done');assert.equal(m.moveTask(ready,'b','Done').tasks.find(t=>t.id==='b').status,'Done');
});
test('automation applies only on entering configured status; preserves manual fields',()=>{
 const p=base();p.automations=[{id:'rule1',name:'Escalate',enabled:true,triggerStatus:'Validation',action:'priority',value:'High'},{id:'rule2',name:'Schedule',enabled:true,triggerStatus:'Validation',action:'dueDays',value:'5'}];
 const moved=m.moveTask(p,'a','Validation');const t=moved.tasks.find(t=>t.id==='a');
 assert.equal(t.priority,'High');assert.match(t.due,/^\d{4}-\d{2}-\d{2}$/);
 const movedAgain=m.moveTask(moved,'a','Validation');assert.equal(movedAgain.tasks.find(t=>t.id==='a').due,t.due);
});
test('date shifting works in UTC across a year boundary',()=>{
 assert.equal(m.shiftDate('2026-12-31',1),'2027-01-01');assert.equal(m.shiftDate('2026-03-01',-1),'2026-02-28');assert.throws(()=>m.shiftDate('2026-02-31',1),/Invalid date/);
});
test('attachments and dependency graph persist through import/export',()=>{
 const p=base();p.tasks[0].attachments=[{id:'file',name:'Specs',url:'https://example.test/specs'}];p.tasks[0].labels=['design'];p.automations=[{id:'rule1',name:'Escalate',enabled:false,triggerStatus:'Done',action:'priority',value:'High'}];
 const re=m.importProject(JSON.parse(JSON.stringify(p)));
 assert.equal(re.tasks[0].attachments[0].name,'Specs');assert.deepEqual(re.tasks[1].dependsOn,['a']);assert.equal(re.automations[0].enabled,false);
});
test('reject invalid imported dependency graph and oversized collections instead of truncating',()=>{
 assert.throws(()=>m.importProject({format:m.FORMAT,name:'P',tasks:[{id:'a',dependsOn:['b']}]}),/Missing dependency/);
 assert.throws(()=>m.normalizeWorkspace({projects:[base(),base()]}),/Duplicate project ID/);
 assert.throws(()=>m.normalizeWorkspace({projects:Array.from({length:31},(_,i)=>({id:`p${i}`,tasks:[]}))}),/limit/);
 assert.throws(()=>m.importProject({format:m.FORMAT,tasks:Array.from({length:10001},(_,i)=>({id:`t${i}`}))}),/limit/);
});
test('release gate invalidated by unfinished dependencies',()=>{
 let p=base();p=m.setTaskDependencies(p,'d',['a']);const t=p.tasks.find(t=>t.id==='d');
 const passed=m.verifyTask({...t,tests:[{title:'check',result:'passed',evidence:'log'}],actual:'passed',evidence:'log',mainSha:'SHA',releaseId:'r'});
 p={...p,tasks:p.tasks.map(t=>t.id==='d'?m.mergeTask(passed):t)};
 assert.equal(m.canRelease({id:'r',mainSha:'SHA'},p),false);
});
