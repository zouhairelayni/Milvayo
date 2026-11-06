// /tests/ui/release-0547-behavior.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const model = require('../../src/domain/model.cjs');
const bridge = require('../../src/domain/modernBridge.cjs');
const kanban = require('../../src/board/kanbanUX.cjs');
const {DEFAULT_BOARD_ID: MAIN} = model.boards;

test('Kanban top/bottom preference is board-scoped and survives backup/import', () => {
  let project = model.makeProject({id:'k',name:'Keep cards',code:'K'});
  const add = (name) => { const result=bridge.addTask(project,name,'Backlog',MAIN);project=result.project;return result.id;};
  add('First');add('Second');add('Third');
  const ordered = () => [...project.tasks].sort((a,b)=>a.position-b.position).map(t=>t.title);
  assert.deepEqual(ordered(),['First','Second','Third']);
  project = kanban.setBoardView(project,MAIN,{newTaskAtTop:true});
  add('Newest');
  assert.deepEqual(ordered(),['Newest','First','Second','Third']);
  project = kanban.setBoardView(project,MAIN,{showDescriptions:true});
  assert.equal(project.kanbanViews[MAIN].newTaskAtTop,true,'other view settings cannot reset insertion preference');
  const restored = model.importProject(JSON.parse(JSON.stringify(project)));
  assert.equal(restored.kanbanViews[MAIN].newTaskAtTop,true);
  project = kanban.setBoardView(restored, MAIN, {newTaskAtTop:false});
  add('Last');
  assert.deepEqual(ordered(),['Newest','First','Second','Third','Last']);
});

test('New task sheet remains draft-only until Save task explicitly calls the canonical store action', () => {
  const app=read('src/app/ModernApp.js');
  const sheet=read('src/screens/tasks/TaskSheet.js');
  const editor=sheet.slice(sheet.indexOf('export function NewTaskSheet'),sheet.indexOf('export default function TaskSheet'));
  assert.match(app,/const newTask = useCallback\(\(\) => setCreatingTask\(true\)/);
  assert.match(app,/const saveNewTask = \(\{title, description, status, priority\}\) => \{/);
  assert.match(app,/const id = addTask\(title, status, MAIN, \{description, priority\}\)/);
  assert.match(app,/<NewTaskSheet onClose=\{\(\)=>setCreatingTask\(false\)\} onSave=\{saveNewTask\}/);
  assert.match(editor,/onSave\(\{ title: name, description, status, priority \}\)/);
  assert.match(editor,/onPress=\{onClose\}/);
  assert.doesNotMatch(editor,/useStore\(|addTask\(|deleteTask\(/);
});

test('Board Tools, mobile swiping, task configuration and governance editor are real controls', () => {
  const board=read('src/screens/board/Board.js');
  assert.match(board,/label: 'Tools'/);
  assert.match(board,/useHeaderActions\('board', headerControls, active\)/);
  assert.match(board,/ScrollView horizontal showsHorizontalScrollIndicator=\{false\} style=\{\{flex:1/);
  assert.match(board,/const \[shown, setShown\] = useState\(10\)/);
  assert.match(board,/Show more \(\$\{cardTotal-shown\} remaining\)/);
  assert.match(board,/newTaskAtTop:true/);
  assert.match(read('src/components/shell/Bars.js'),/onTouchStart=/);
  assert.match(read('src/components/shell/Bars.js'),/onTouchEnd=/);
  assert.match(read('src/screens/tasks/Tasks.js'),/TaskConfiguration/);
  assert.match(read('src/screens/tasks/Tasks.js'),/useHeaderActions\('tasks', headerControls, screenActive\)/);
  assert.match(read('src/screens/governance/CreateProjectSheet.js'),/<Sheet visible=\{visible\}/);
});

test('single cumulative changelog and organized QA/instructions are present without duplication', () => {
  assert.deepEqual(fs.readdirSync(root).filter(x=>x.startsWith('CHG-NP-') && x.endsWith('.md')),[]);
  const file='docs/changelog/CHANGELOG.md';
  assert.ok(fs.statSync(path.join(root,file)).size>10000);
  const log=read(file);
  for (let i=35;i<=47;i++) assert.match(log,new RegExp('0\\.5\\.'+i));
  for (const name of ['qa/README.md','instructions/README.md','instructions/niyav-format.md'])
    assert.ok(fs.statSync(path.join(root,'docs',name)).size>200,name);
  assert.deepEqual(fs.readdirSync(path.join(root,'docs/changelog')),['CHANGELOG.md']);
});
