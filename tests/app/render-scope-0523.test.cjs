// /tests/app/render-scope-0523.test.cjs
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const read=f=>fs.readFileSync(path.join(__dirname,'..','..',f),'utf8');

test('Projects: each card owns its edit fields, so typing re-renders one card',()=>{
 const src=read('src/screens/governance/Projects.js');
 assert.match(src,/const ProjectCard=memo\(function ProjectCard/);
 const projects=src.slice(src.indexOf('export function Projects('),src.indexOf('const ProjectCard='));
 assert.doesNotMatch(projects,/setEditing|setName|setCode|setDescription/,'no shared edit state left in Projects');
 assert.match(projects,/<ProjectCard key=\{p\.id\}/);
});
test('Project governance: the document list is memoised on document data only',()=>{
 const src=read('src/screens/governance/Projects.js');
 assert.match(src,/const DocGroups=memo\(/);
 assert.match(src,/a\.pm\.docs===b\.pm\.docs&&a\.pm\.wbs===b\.pm\.wbs&&a\.pm\.budget===b\.pm\.budget&&a\.pm\.risks===b\.pm\.risks/);
 assert.match(src,/<DocGroups pm=\{s\.pm\} setTab=\{setTab\}\/>/);
});
test('Timeline: bars are memoised and receive callbacks that never change identity',()=>{
 const src=read('src/screens/timeline/Timeline.js');
 assert.match(src,/const TaskBar = memo\(function TaskBar\(/);
 assert.match(src,/latest\.current = \{ onPreview, onCommit, onLink \};/);
 for(const name of ['onPreview','onCommit','onLink'])assert.match(src,new RegExp(`${name}=\\{bar\\.${name}\\}`),`${name} is the stable wrapper`);
 assert.doesNotMatch(src,/onPreview=\{onPreview\}/,'the per-render closure is not passed to a bar any more');
});
test('stable wrappers always reach the latest closure',()=>{
 // Same pattern as Timeline.js, run for real: the wrapper object never changes, the target does.
 const latest={current:{}};const calls=[];
 const bar={onCommit:(...a)=>latest.current.onCommit(...a)};
 const first=bar.onCommit;
 latest.current={onCommit:(...a)=>calls.push(['old',...a])};bar.onCommit(1);
 latest.current={onCommit:(...a)=>calls.push(['new',...a])};bar.onCommit(2);
 assert.equal(bar.onCommit,first);
 assert.deepEqual(calls,[['old',1],['new',2]]);
});

test('search boxes that only filter a list wait for a typing pause; Tasks counts in one pass',()=>{
 const tasks=read('src/screens/tasks/Tasks.js'),board=read('src/screens/board/Board.js');
 assert.match(tasks,/<Input lazy value=\{q\} onChangeText=\{setQ\} placeholder="Search title or owner"/);
 assert.match(board,/<Input lazy value=\{q\} onChangeText=\{setQ\} placeholder="Search board cards"/);
 assert.doesNotMatch(tasks,/s\.tasks\.filter\(t=>t\.status===st\)/,'no scan per status chip');
 assert.match(tasks,/\}, \[s\.tasks\]\);/);
});
