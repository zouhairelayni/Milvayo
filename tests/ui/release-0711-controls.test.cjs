// /tests/ui/release-0711-controls.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {screenHarness,nodes,control,text}=require('../helpers/screen-harness.cjs');
const model=require('../../src/domain/model.cjs'),bridge=require('../../src/domain/modernBridge.cjs');
const {dueSoonForList}=require('../../src/screens/tasks/dueSoon.cjs');

test('Board creation trims names, rejects blanks, preserves failed drafts and selects the new board only on success',()=>{
 let ok=false,closed=0;const calls=[],selected=[];
 const h=screenHarness('src/screens/board/BoardManagement.js',{addBoard:name=>{calls.push(name);return ok?'new-board':null;}}, {mocks:{'../../board/boardInteractions.cjs':require('../../src/board/boardInteractions.cjs')}});
 const props={visible:true,board:{id:'current',name:'Current'},onClose:()=>closed++,onCreated:id=>selected.push(id)};
 let tree=h.render('BoardCreateSheet',props);
 assert.equal(control(tree,'Create board').props.disabled,true);control(tree,'Create board').props.onPress();assert.deepEqual(calls,[]);
 const input=()=>nodes(tree).find(n=>n.props.accessibilityLabel==='Board name');input().props.onChangeText('  Delivery  ');tree=h.render('BoardCreateSheet',props);
 control(tree,'Create board').props.onPress();tree=h.render('BoardCreateSheet',props);assert.equal(input().props.value,'  Delivery  ');assert.equal(closed,0);assert.deepEqual(selected,[]);
 ok=true;control(tree,'Create board').props.onPress();assert.deepEqual(calls,['Delivery','Delivery']);assert.deepEqual(selected,['new-board']);assert.equal(closed,1);
});

test('List creation targets the current board and selected status; failure retains the draft and never selects a different board',()=>{
 let ok=false,closed=0;const calls=[];
 const h=screenHarness('src/screens/board/BoardManagement.js',{addList:(...a)=>{calls.push(a);return ok;}}, {mocks:{'../../board/boardInteractions.cjs':require('../../src/board/boardInteractions.cjs')}});
 const props={visible:true,board:{id:'design',name:'Design'},onClose:()=>closed++,onCreated(){throw Error('list must not select a board');}};
 let tree=h.render('BoardCreateSheet',props);nodes(tree).find(n=>n.type==='Segmented').props.onChange('list');tree=h.render('BoardCreateSheet',props);
 assert.match(text(tree),/Add a list to\s+Design/);nodes(tree).find(n=>n.props.accessibilityLabel==='List name').props.onChangeText(' Review ');
 nodes(tree).find(n=>n.type==='Segmented'&&n.props.options.includes('Done')).props.onChange('Done');tree=h.render('BoardCreateSheet',props);
 control(tree,'Create list').props.onPress();tree=h.render('BoardCreateSheet',props);assert.equal(closed,0);assert.equal(nodes(tree).find(n=>n.props.accessibilityLabel==='List name').props.value,' Review ');
 ok=true;control(tree,'Create list').props.onPress();assert.equal(closed,1);assert.deepEqual(calls,[['design','Review','Done'],['design','Review','Done']]);
});

function boardSetup(){
 let workspace=model.createWorkspace();workspace.projects[0]=bridge.addBoard(workspace.projects[0],'Design');
 const id=workspace.projects[0].boards.at(-1).id,calls=[];let ok=false;
 const store={workspace,s:bridge.projectView(workspace),deleteBoard:value=>{calls.push(value);return ok;}};
 const h=screenHarness('src/screens/board/Board.js',store,{platform:'android',mocks:{
  '../../store/data':{MAIN:bridge.MAIN,PRIORITIES:model.PRIORITIES,fmt:String},
  './BoardManagement':{AddCard:'AddCard',BoardCreateSheet:'BoardCreateSheet',BoardsManager:'BoardsManager'},
  '../../board/boardGesture':{useHoldDrag:()=>({panHandlers:{},lifted:false,offset:{}}),cancelPendingBoardHolds(){}},
  '../../board/boardMotion':{BoardMotion:'BoardMotion'},
  '../../board/boardColumns.cjs':require('../../src/board/boardColumns.cjs'),
  '../../board/boardInteractions.cjs':require('../../src/board/boardInteractions.cjs'),
  '../../board/kanbanUX.cjs':require('../../src/board/kanbanUX.cjs'),
  '../../board/boardDragContext.cjs':require('../../src/board/boardDragContext.cjs'),
  '../../domain/powerUps.cjs':require('../../src/domain/powerUps.cjs'),
 }});
 return {h,id,calls,ok:()=>{ok=true;}};
}

test('Board plus leads the ribbon, opens one sheet with both creation paths, and Main has no delete action',()=>{
 const {h}=boardSetup();let tree=h.render();const plus=control(tree,'Create board or list');assert.ok(plus);
 const row=nodes(tree).find(n=>n.type==='View'&&Array.isArray(n.props.children)&&n.props.children[0]===plus);assert.ok(row);
 assert.equal(control(tree,'Add list'),undefined);assert.equal(nodes(tree).some(n=>n.type==='BoardCreateSheet'),false);
 plus.props.onPress();tree=h.render();const sheet=nodes(tree).find(n=>n.type==='BoardCreateSheet');assert.equal(sheet.props.board.id,bridge.MAIN);
 sheet.props.onClose();tree=h.render();assert.equal(nodes(tree).some(n=>n.type==='BoardCreateSheet'),false);
 h.headers.board.actions[0].onPress();tree=h.render();assert.equal(nodes(tree).some(n=>n.type==='ActionMenu'&&n.props.label==='Board actions'),false);
});

test('Board deletion requires confirmation, cancel is inert, failure stays in tools and success returns to Main',async()=>{
 const {h,id,calls,ok}=boardSetup();let tree=h.render();let chip=nodes(tree).find(n=>typeof n.type==='function'&&n.props.board?.id===id&&n.props.onSelect);chip.props.onSelect();tree=h.render();
 h.headers.board.actions[0].onPress();tree=h.render();const action=nodes(tree).find(n=>n.type==='ActionMenu'&&n.props.label==='Board actions');assert.ok(action);assert.deepEqual(calls,[]);
 const menu=screenHarness('src/ui/uiExperience.js',{}),props=action.props;let popup=menu.render('ActionMenu',props);
 control(popup,'Board actions').props.onPress();popup=menu.render('ActionMenu',props);control(popup,'Delete board').props.onPress();popup=menu.render('ActionMenu',props);
 assert.match(text(popup),/move its tasks to Main/);assert.deepEqual(calls,[]);control(popup,'Cancel').props.onPress();popup=menu.render('ActionMenu',props);assert.deepEqual(calls,[]);
 control(popup,'Delete board').props.onPress();popup=menu.render('ActionMenu',props);await control(popup,'Delete board').props.onPress();popup=menu.render('ActionMenu',props);
 assert.match(text(popup),/not applied/);assert.deepEqual(calls,[id]);assert.ok(nodes(h.render()).some(n=>n.type==='Sheet'&&n.props.visible));
 ok();await control(popup,'Delete board').props.onPress();tree=h.render();assert.deepEqual(calls,[id,id]);assert.equal(nodes(tree).some(n=>n.type==='Sheet'&&n.props.visible),false);
 control(tree,'Create board or list').props.onPress();tree=h.render();assert.equal(nodes(tree).find(n=>n.type==='BoardCreateSheet').props.board.id,bridge.MAIN);
});

test('Deleting a board preserves tasks, dependency data and dates through import; Main is protected',()=>{
 let p=model.makeProject({id:'p',name:'Studio',tools:{advancedTasks:false},boards:[{id:'design',name:'Design'}],tasks:[
  {id:'a',title:'Design',boardId:'design',start:'2026-11-06',due:'2026-11-08'},
  {id:'b',title:'Build',boardId:'design',dependsOn:['a'],expected:'Evidence'},
 ]});
 const saved=JSON.stringify(p);assert.throws(()=>bridge.deleteBoard(p,bridge.MAIN),/Main/);assert.equal(JSON.stringify(p),saved);
 const result=bridge.deleteBoard(p,'design');assert.ok(result.tasks.every(t=>t.boardId===bridge.MAIN));
 assert.deepEqual(result.tasks.map(({boardId,listId,...t})=>t),p.tasks.map(({boardId,listId,...t})=>t));
 assert.deepEqual(model.importProject(JSON.parse(JSON.stringify(result))).tasks,result.tasks);assert.equal(result.tools.advancedTasks,false);
});

test('List keeps only header search/tools and restores saved search to the same header',()=>{
 let p=model.makeProject({id:'p',name:'Studio',tasks:[{id:'a',title:'Design review'},{id:'b',title:'Build service'}]});
 p.savedViews=[{id:'review',name:'Reviews',filters:{text:'review',status:'All'},sort:'title'}];
 const workspace=model.normalizeWorkspace({...model.createWorkspace(),selectedId:'p',projects:[p]}),queries=[];
 const h=screenHarness('src/screens/tasks/Tasks.js',{workspace,s:bridge.projectView(workspace)}),props={query:'service',onQueryChange:q=>queries.push(q),openTask(){}};
 let tree=h.render('default',props);assert.equal(control(tree,'Filter and organize tasks'),undefined);
 assert.equal(nodes(tree).some(n=>n.props.placeholder==='Search title or owner'||n.props.accessibilityLabel==='Search task list'),false);
 assert.match(text(tree),/Build service/);assert.doesNotMatch(text(tree),/Design review/);
 h.headers.tasks.actions[0].onPress();tree=h.render('default',props);assert.ok(control(tree,'Apply view'));control(tree,'Apply view').props.onPress();
 tree=h.render('default',{...props,query:queries.at(-1)});tree=h.render('default',{...props,query:queries.at(-1)});
 assert.deepEqual(queries,['review']);assert.match(text(tree),/Design review/);assert.doesNotMatch(text(tree),/Build service/);
});

test('Due soon scroll demand is bounded, skips background updates, resets on new data and supports accessibility',()=>{
 let active=true;const tasks=Array.from({length:10},(_,i)=>({id:String(i),title:'Task '+i,due:'2026-11-10'}));
 const h=screenHarness('src/screens/tasks/DueSoon.js',{}, {platform:'android',mocks:{'../../store/store':{useScreenActive:()=>active}}});
 const props={tasks,onOpenTask(){}};let tree=h.render('default',props);const scroll=()=>nodes(tree).find(n=>n.type==='ScrollView'),count=()=>nodes(tree).filter(n=>n.type==='Pressable').length;
 assert.equal(count(),3);scroll().props.onScrollBeginDrag();const e={nativeEvent:{contentOffset:{y:20},layoutMeasurement:{height:168},contentSize:{height:196}}};
 active=false;tree=h.render('default',props);scroll().props.onScroll(e);tree=h.render('default',props);assert.equal(count(),3);
 active=true;tree=h.render('default',props);scroll().props.onScroll(e);tree=h.render('default',props);assert.equal(count(),6);
 scroll().props.onScroll(e);tree=h.render('default',props);assert.equal(count(),6,'same layout feedback cannot mount all remaining tasks');
 const next={...props,tasks:[...tasks]};tree=h.render('default',next);assert.equal(count(),3);
 scroll().props.onAccessibilityAction({nativeEvent:{actionName:'increment'}});tree=h.render('default',next);assert.equal(count(),6);
 assert.equal(nodes(tree).some(n=>n.type==='FlatList'),false);assert.equal(control(tree,'See more'),undefined);assert.doesNotMatch(text(tree),/Open tasks due/);
});

test('Due soon retains every eligible task beyond thirty, with deterministic order and unchanged import eligibility',()=>{
 const p=model.makeProject({id:'p',name:'Studio',powerUps:{[bridge.MAIN]:['calendar']},tasks:Array.from({length:65},(_,i)=>({id:'t'+i,title:'Task '+i,due:'2026-11-10',position:i}))});
 const result=dueSoonForList(p,'2026-11-06');assert.equal(result.tasks.length,65);assert.deepEqual(result.tasks.map(t=>t.id),p.tasks.map(t=>t.id));
 assert.deepEqual(dueSoonForList(model.importProject(JSON.parse(JSON.stringify(p))),'2026-11-06'),result);
});
