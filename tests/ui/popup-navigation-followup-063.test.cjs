// /tests/ui/popup-navigation-followup-063.test.cjs
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {screenHarness,nodes,control,text}=require('../helpers/screen-harness.cjs');
const model=require('../../src/domain/model.cjs');
const bridge=require('../../src/domain/modernBridge.cjs');
const {scheduleSeries}=require('../../src/domain/dashboard.cjs');
const event=x=>({nativeEvent:{contentOffset:{x}}});
const read=p=>fs.readFileSync(require('node:path').resolve(__dirname,'../..',p),'utf8');

test('date rail pages across months, recenters on the committed week, rejects duplicate/bad events and preserves day selection',()=>{
 const changes=[],shifts=[],scrolls=[],tasks=[{id:'due',due:'2026-12-03'}];
 const h=screenHarness('src/ui/DateRail.js',{}, {platform:'android'});
 let props={days:scheduleSeries(tasks,'2026-11-27'),tasks,value:null,onChange:x=>changes.push(x),onShift:x=>{shifts.push(x);return true;}};
 let tree=h.render('default',props);tree.props.ref.current={scrollTo:x=>scrolls.push(x)};
 assert.equal(nodes(tree).filter(n=>n.type==='PressSurface').length,21);assert.equal(tree.props.pagingEnabled,true);
 control(tree,'Focus 2026-12-03, 1 tasks due').props.onPress();assert.deepEqual(changes,['2026-12-03']);
 tree.props.onMomentumScrollEnd(event(NaN));tree.props.onMomentumScrollEnd(event(358));assert.deepEqual(shifts,[]);
 tree.props.onMomentumScrollEnd(event(716));tree.props.onMomentumScrollEnd(event(716));assert.deepEqual(shifts,[1]);
 props={...props,days:scheduleSeries(tasks,'2026-12-04'),value:'2026-12-03'};tree=h.render('default',props);
 assert.equal(scrolls.at(-1).x,358);assert.equal(scrolls.at(-1).animated,false);
 control(tree,'Focus 2026-12-03, 1 tasks due').props.onPress();assert.equal(changes.at(-1),null);
 tree.props.onAccessibilityAction({nativeEvent:{actionName:'decrement'}});assert.deepEqual(shifts,[1,-1]);
 props={...props,days:scheduleSeries(tasks,'2026-11-27'),onShift:x=>{shifts.push(x);return false;}};tree=h.render('default',props);
 tree.props.onMomentumScrollEnd(event(716));assert.equal(scrolls.at(-1).x,358);assert.equal(scrolls.at(-1).animated,true);
 tree.props.onLayout({nativeEvent:{layout:{width:640}}});tree=h.render('default',props);assert.equal(tree.props.contentOffset.x,640);assert.equal(scrolls.at(-1).x,640);
 assert.deepEqual(tasks,[{id:'due',due:'2026-12-03'}]);
});

test('web date paging waits for scroll to stop and empty rails do not shift',()=>{
 let serial=0;const timers=new Map(),shifts=[];
 const h=screenHarness('src/ui/DateRail.js',{}, {globals:{setTimeout:fn=>{timers.set(++serial,fn);return serial;},clearTimeout:id=>timers.delete(id)}});
 const props={days:scheduleSeries([],'2026-11-05'),value:null,onChange(){},onShift:x=>shifts.push(x)};
 let tree=h.render('default',props);tree.props.onScroll(event(500));tree.props.onScroll(event(716));assert.equal(timers.size,1);assert.deepEqual(shifts,[]);
 const fn=[...timers.values()][0];fn();assert.deepEqual(shifts,[1]);
 tree=h.render('default',{...props,days:[]});assert.equal(tree.props.contentOffset.x,0);tree.props.onMomentumScrollEnd(event(716));assert.deepEqual(shifts,[1]);
});

test('Home date swipe removes chevrons, changes the chart week, clears the day filter, and keeps the existing year bound',()=>{
 const store={s:{project:{name:'Studio'},tasks:[],checks:[],releases:[]}},h=screenHarness('src/screens/overview/Overview.js',store);
 const props={go(){},openTask(){},onNewTask(){}};
 const rail=tree=>nodes(tree).find(n=>n.type==='DateRail');
 let tree=h.render('default',props);assert.equal(control(tree,'Previous week'),undefined);assert.equal(control(tree,'Next week'),undefined);
 rail(tree).props.onChange('2026-11-06');tree=h.render('default',props);assert.match(text(tree),/Due 2026-11-06/);
 assert.equal(rail(tree).props.onShift(1),true);tree=h.render('default',props);assert.equal(rail(tree).props.days[0].date,'2026-11-12');assert.equal(rail(tree).props.value,null);
 for(let i=1;i<52;i++){assert.equal(rail(tree).props.onShift(1),true);tree=h.render('default',props);}
 assert.equal(rail(tree).props.onShift(1),false);
});

test('task description precedes planning; copy failures keep context, draft save guards duplication, delete closes only after success',()=>{
 const workspace=model.createWorkspace();workspace.projects[0]=bridge.addTask(workspace.projects[0],'Review brief').project;
 const s=bridge.projectView(workspace),calls=[];let saveOK=false,copyOK=false,deleteOK=false,closed=0;
 const store={s,workspace,updateTask:(...args)=>{calls.push(['save',...args]);return saveOK;},duplicateTask:id=>{calls.push(['copy',id]);return copyOK?'copy-id':null;},deleteTask:id=>{calls.push(['delete',id]);return deleteOK;}};
 const h=screenHarness('src/screens/tasks/TaskSheet.js',store),props={taskId:s.tasks[0].id,onClose:()=>closed++};
 const actions=tree=>nodes(tree).find(n=>n.type==='ActionMenu').props.items;
 let tree=h.render('default',props);const all=nodes(tree);assert.ok(all.findIndex(n=>n.props.children==='Description')<all.findIndex(n=>n.props.children==='Plan this task'));
 assert.ok(actions(tree).every(x=>x.confirmation));assert.equal(actions(tree)[0].onPress(),false);assert.equal(closed,0);
 control(tree,'Edit description').props.onPress();tree=h.render('default',props);nodes(tree).find(n=>n.props.placeholder==='Add a description...').props.onChangeText('New details');tree=h.render('default',props);
 const count=calls.filter(x=>x[0]==='copy').length;assert.equal(actions(tree)[0].onPress(),false);assert.equal(calls.filter(x=>x[0]==='copy').length,count);
 saveOK=true;copyOK=true;assert.equal(actions(tree)[0].onPress(),'copy-id');assert.equal(closed,0);
 tree=h.render('default',props);assert.equal(actions(tree)[1].onPress(),false);assert.equal(closed,0);deleteOK=true;assert.equal(actions(tree)[1].onPress(),true);assert.equal(closed,1);
});

test('bottom navigation has icon selection without a tile and still rejects stale press intents',()=>{
 const calls=[],h=screenHarness('src/components/shell/Bars.js',{});let accepted=false;
 const props={tabs:[['home','Home','home'],['work','Work','columns']],current:'home',go:x=>calls.push(x),intent:{begin:k=>({key:k}),accept:()=>accepted},onCreate:()=>calls.push('create')};
 const tree=h.render('TabBar',props),home=control(tree,'Home'),work=control(tree,'Work');
 assert.equal(home.props.accessibilityState.selected,true);assert.equal(home.props.children[0].type,'NavIcon');assert.equal(home.props.children[0].props.selected,true);assert.equal(work.props.children[0].props.selected,false);
 assert.equal(home.props.style({pressed:false}).backgroundColor,undefined);const e={nativeEvent:{timestamp:42}};
 home.props.onPressIn(e);home.props.onPress(e);assert.deepEqual(calls,[]);accepted=true;work.props.onPressIn(e);work.props.onPress(e);control(tree,'Create').props.onPress();assert.deepEqual(calls,['work','create']);
});

test('Settings removes only its duplicate tools entry; More and Board header retain their tools',()=>{
 const settings=read('src/screens/workspace/Workspace.js'),more=read('src/screens/more/More.js'),board=read('src/screens/board/Board.js');
 assert.doesNotMatch(settings,/ProjectToolsSheet|Choose tools|Manage tools/);assert.match(more,/label="Manage tools"/);assert.match(more,/<ProjectToolsSheet/);
 assert.doesNotMatch(board,/label="Filter board"/);assert.match(board,/label: 'Tools', icon: 'sliders'/);
});

test('held Board lists render above the ribbon without replacing the responder; release restores strip clipping and scroll',()=>{
 const workspace=model.createWorkspace(),store={workspace,s:bridge.projectView(workspace)},h=screenHarness('src/screens/board/Board.js',store,{platform:'android',globals:{setInterval:()=>1,clearInterval(){}},mocks:{
 '../../store/data':{MAIN:model.boards.DEFAULT_BOARD_ID,PRIORITIES:model.PRIORITIES,fmt:String},
 './BoardManagement':{AddCard:'AddCard',BoardCreateSheet:'BoardCreateSheet',BoardsManager:'BoardsManager'},
 '../../board/boardGesture':{useHoldDrag:()=>({panHandlers:{},lifted:false,offset:{}}),cancelPendingBoardHolds(){}},
 '../../board/boardMotion':{BoardMotion:'BoardMotion'},
 '../../board/boardInteractions.cjs':require('../../src/board/boardInteractions.cjs'),
 '../../board/boardColumns.cjs':require('../../src/board/boardColumns.cjs'),
 '../../board/kanbanUX.cjs':require('../../src/board/kanbanUX.cjs'),
 '../../domain/powerUps.cjs':require('../../src/domain/powerUps.cjs'),
 '../../board/boardDragContext.cjs':require('../../src/board/boardDragContext.cjs'),
 }});
 const strip=tree=>nodes(tree).find(n=>n.type==='ScrollView'&&n.props.removeClippedSubviews===false);
 const column=tree=>nodes(tree).find(n=>typeof n.type==='function'&&n.type.name==='ListColumn');
 const ancestor=tree=>nodes(tree).find(n=>n.type==='View'&&n.props.children===strip(tree));
 let tree=h.render();let col=column(tree);assert.ok(col);assert.equal(h.render(col.type,col.props).props.liftAmount,.6);assert.equal(strip(tree).props.style.overflow,'hidden');
 col.props.setLock(true);col.props.setDrag({kind:'list',id:col.props.list.id,from:0,to:0});tree=h.render();
 assert.equal(ancestor(tree).props.style.zIndex,20);assert.equal(strip(tree).props.style.overflow,'visible');assert.equal(strip(tree).props.scrollEnabled,false);
 assert.equal(strip(tree).props.style.marginTop+strip(tree).props.contentContainerStyle.paddingTop,0);assert.equal(strip(tree).props.contentContainerStyle.paddingTop,96);
 assert.equal(strip(tree).props.removeClippedSubviews,false);assert.equal(column(tree).type,col.type);
 col.props.setLock(false);col.props.setDrag(null);tree=h.render();assert.equal(ancestor(tree).props.style.zIndex,0);assert.equal(strip(tree).props.style.overflow,'hidden');assert.equal(strip(tree).props.scrollEnabled,true);assert.equal(strip(tree).props.contentContainerStyle.paddingTop,0);
});


test('description edit icons track the theme; cancel discards, rejected saves retain the draft, and successful/empty saves preview in place',()=>{
 const {palette}=require('../../src/ui/theme/themePalette.cjs');let c=palette('Mint','dark'),accept=false,closed=0;
 const workspace=model.createWorkspace(),s=bridge.projectView(workspace),task=s.tasks[0],calls=[];
 const store={s,workspace,updateTask:(id,patch)=>{calls.push([id,patch.description]);if(!accept)return false;task.description=patch.description;return true;}};
 const h=screenHarness('src/screens/tasks/TaskSheet.js',store,{mocks:{'../../ui/theme/theme':{useTheme:()=>({c}),STATUS_COLOR:{},PRIORITY_COLOR:{}}}});
 const props={taskId:task.id,onClose:()=>closed++},render=()=>h.render('default',props),input=tree=>nodes(tree).find(n=>n.props.placeholder==='Add a description...');
 let tree=render();control(tree,'Edit description').props.onPress();tree=render();
 const save=control(tree,'Save description'),cancel=control(tree,'Cancel description editing');
 assert.equal(save.props.style.width,44);assert.equal(cancel.props.style.height,44);assert.equal(save.props.children.type,'Svg');assert.equal(save.props.children.props.stroke,c.accentText);assert.equal(cancel.props.children.props.stroke,c.danger);
 for(const mode of ['light','amoled']){c=palette('Violet',mode);tree=render();assert.equal(control(tree,'Save description').props.children.props.stroke,c.accentText);assert.equal(control(tree,'Cancel description editing').props.children.props.stroke,c.danger);}
 input(tree).props.onChangeText('Discard this');tree=render();control(tree,'Cancel description editing').props.onPress();tree=render();assert.equal(input(tree),undefined);assert.equal(calls.length,0);assert.equal(closed,0);
 control(tree,'Edit description').props.onPress();tree=render();assert.equal(input(tree).props.value,task.description||'');input(tree).props.onChangeText('Keep this draft');tree=render();
 control(tree,'Save description').props.onPress();tree=render();assert.equal(input(tree).props.value,'Keep this draft');assert.equal(closed,0);
 accept=true;control(tree,'Save description').props.onPress();tree=render();assert.equal(input(tree),undefined);assert.equal(task.description,'Keep this draft');assert.equal(closed,0);
 control(tree,'Edit description').props.onPress();tree=render();input(tree).props.onChangeText('');tree=render();control(tree,'Save description').props.onPress();tree=render();assert.equal(task.description,'');assert.equal(input(tree),undefined);
 const count=calls.length;control(tree,'Edit description').props.onPress();tree=render();control(tree,'Save description').props.onPress();assert.equal(calls.length,count);assert.equal(input(render()),undefined);
});
