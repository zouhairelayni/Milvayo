// /tests/ui/header-list-sprint-076.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {screenHarness,nodes,control,text}=require('../helpers/screen-harness.cjs');
const model=require('../../src/domain/model.cjs'),bridge=require('../../src/domain/modernBridge.cjs');
test('every top phone header omits its screen title beside the hamburger/back control, while in-screen headings remain',()=>{
 const h=screenHarness('src/components/shell/Bars.js',{});
 for(const kind of ['main','sub','hub']){const tree=h.render('PhoneHeader',{kind,title:'Workspace settings',onPickProject(){},onBack(){}});assert.equal(text(tree).includes('Workspace settings'),false);}
 const ui=screenHarness('src/ui/uiLayout.js',{});assert.ok(text(ui.render('ScreenIntro',{title:'Workspace settings',description:'Local preferences'})).includes('Workspace settings'));
});
test('List has no duplicate Add task action and retains its organize/filter controls',()=>{
 const workspace=model.normalizeWorkspace({...model.createWorkspace(),selectedId:'p',projects:[model.makeProject({id:'p',name:'Studio'})]});
 const store={workspace,s:bridge.projectView(workspace)},h=screenHarness('src/screens/tasks/Tasks.js',store);const tree=h.render('default',{openTask(){},onNewTask(){throw Error('duplicate create');}});
 assert.equal(control(tree,'Add task'),undefined);assert.equal(control(tree,'New task'),undefined);assert.ok(h.headers.tasks.actions.length>0);
});
test('New sprint is in the scrolling selector row, absent from the top header, and opens the existing creation form',()=>{
 const h=screenHarness('src/screens/delivery/Delivery.js',{s:{tasks:[],sprints:[{id:'a',name:'Sprint A',state:'planned',start:'2026-11-06',end:'2026-11-19'}]}});let tree=h.render('Sprints',{openTask(){}});
 assert.equal(h.headers.sprints.actions.length,0);const row=nodes(tree).find(n=>n.type==='ScrollView'&&n.props.horizontal);assert.ok(control(row,'New sprint'));assert.equal(control(row,'New sprint').props.icon,'plus');control(row,'New sprint').props.onPress();tree=h.render('Sprints',{openTask(){}});assert.ok(control(tree,'Save sprint'));
});
