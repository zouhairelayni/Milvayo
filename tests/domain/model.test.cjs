// /tests/domain/model.test.cjs
const {test}=require('node:test');const assert=require('node:assert/strict');const m=require('../../src/domain/model.cjs');
test('demo project roundtrip and required collections',()=>{const p=m.demoProject();const q=m.importProject(JSON.parse(JSON.stringify(p)));assert.equal(q.tasks.length,9);assert.equal(q.format,m.FORMAT);assert.equal(q.schemas.length,0);});
test('no merge without successful verification evidence and SHA',()=>{const t=m.defaultTask({title:'A',tests:[{id:'a',title:'check',result:'passed',evidence:'log1'}],evidence:'report1',actual:'expected 2 got 2'});assert.equal(m.canVerify(t),true);assert.equal(m.canMerge(t),false);assert.throws(()=>m.mergeTask(t));const verified=m.verifyTask(t);assert.equal(verified.verified,true);assert.equal(m.canMerge(verified),false);assert.equal(m.canMerge({...verified,mainSha:'abc123'}),true);});
test('reject malformed file and duplicate IDs',()=>{assert.throws(()=>m.importProject({tasks:[]}));assert.throws(()=>m.importProject({format:m.FORMAT,tasks:[{id:'a'},{id:'a'}]}));});
test('workspace normalization selects existing project only',()=>{const w=m.normalizeWorkspace({selectedId:'wrong',projects:[m.demoProject()]});assert.equal(w.selectedId,'sample-workspace');});
test('import title and text are bounded',()=>{const p=m.importProject({format:m.FORMAT,name:'x'.repeat(300),tasks:[{id:'z',title:'y'.repeat(1000)}]});assert.equal(p.name.length,180);assert.equal(p.tasks[0].title.length,240);});
test('workspace import recovery preserves all projects, not just selected',()=>{
 const a=m.makeProject({id:'a',name:'Alpha',tasks:[{id:'t1',title:'Original'}]});
 const b=m.makeProject({id:'b',name:'Beta',tasks:[{id:'t2',title:'Second'}]});
 const w={schemaVersion:1,selectedId:'b',projects:[a,b],backups:[],activity:[],revision:1};
 const snap=m.workspaceSnapshot(w,'Before import');
 const replacement={...w,projects:[m.makeProject({id:'c',name:'Third'})],selectedId:'c'};
 const restored=m.restoreSnapshot(replacement,snap);
 assert.deepEqual(restored.projects.map(p=>p.id),['a','b']);
 assert.equal(restored.selectedId,'b');
 assert.equal(restored.projects[0].tasks[0].title,'Original');
});
test('project snapshots restore deleted projects without removing other projects',()=>{
 const p=m.makeProject({id:'x',name:'X',tasks:[{id:'t',title:'Keep'}]});
 const w={schemaVersion:1,selectedId:'x',projects:[p]};
 const snap=m.projectSnapshot(w);
 const newW={...w,projects:[m.makeProject({id:'y',name:'Y'})],selectedId:'y'};
 const restored=m.restoreSnapshot(newW,snap);
 assert.deepEqual(restored.projects.map(p=>p.id),['y','x']);
});
test('release cannot be recorded as released until all linked tasks are merged and SHA supplied',()=>{
 const t=m.defaultTask({id:'t',releaseId:'r',tests:[{title:'Case',result:'passed',evidence:'Log'}],evidence:'run',actual:'pass',mainSha:'abcdef'});
 const project=m.makeProject({tasks:[t]});
 const r={id:'r',mainSha:'fedcba'};
 assert.equal(m.canRelease(r,project),false);
 const merged=m.mergeTask(m.verifyTask(t));
 assert.equal(m.canRelease(r,{...project,tasks:[merged]}),true);
 assert.equal(m.canRelease({...r,mainSha:''},{...project,tasks:[merged]}),false);
});
