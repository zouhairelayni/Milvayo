// /tests/board/scroll-card-mounting.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {INITIAL_CARDS,nextCardCount}=require('../../src/board/cardMountWindow.cjs');
const {newCtx,slotFor,cardTop,listScrollAtPointer}=require('../../src/board/boardDragContext.cjs');
const {dropBefore}=require('../../src/board/kanbanUX.cjs');
const {load}=require('../helpers/diagram-harness.cjs'),{lifecycleHarness}=require('../helpers/lifecycle-harness.cjs');
const {nodes,text}=require('../helpers/screen-harness.cjs');
function setup(platform='android'){
 const h=lifecycleHarness(),gestures=[];let active=true,canceled=0;
 const api={addTask(){},renameList(){},moveListTo(){},deleteList(){},updateTask(){},placeTask(){}};
 const mod=load('src/screens/board/Board.js',{
  react:{...h.hooks,memo:fn=>fn},'react-native':{Dimensions:{get:()=>({height:844})},Platform:{OS:platform},View:'View',Pressable:'Pressable',ScrollView:'ScrollView'},
  '@expo/vector-icons':{Feather:'Feather'},'../../ui/ui':new Proxy({useWide:()=>false},{get:(o,k)=>o[k]||k}),
  '../../store/store':{useStore:()=>({}),useStoreActions:()=>api,useScreenActive:()=>active},'../../components/shell/HeaderActions':{},'../../components/inline/CompactTools':{},
  '../../components/inline/TaskLabels':'TaskLabels','../../ui/theme/theme':{useTheme:()=>({c:{surface:'#222222',line:'#333333'}}),PRIORITY_COLOR:{},STATUS_COLOR:{}},
  '../../store/data':{MAIN:'main',PRIORITIES:[],fmt:x=>x},'./BoardManagement':{AddCard:'AddCard',BoardCreateSheet:'BoardCreateSheet',BoardsManager:'BoardsManager'},
  '../../board/boardGesture':{useHoldDrag:options=>{gestures.push(options);return {panHandlers:{},lifted:false,offset:{}};},cancelPendingBoardHolds:()=>canceled++},
  '../../board/boardMotion':{BoardMotion:'BoardMotion'},'../../diagnostics/useRenderMetric':{useRenderMetric(){}},
 },['ListColumn','TaskCard']);
 const cards=Array.from({length:23},(_,i)=>({id:'t'+i,title:'Card '+i,list:'L',status:'Backlog',priority:'Low'}));
 const k=newCtx(),board={id:'main',lists:[{id:'L',name:'Backlog',status:'Backlog'}]};k.order.L=cards.map(t=>t.id);
 const props={board,list:board.lists[0],index:0,total:1,step:294,width:280,cards,windowKey:'all',features:[],labelColors:{},openTask(){},drag:null,setDrag(){},setLock(){},k};
 const render=()=>h.render(mod.__test.ListColumn,props),scroll=tree=>nodes(tree).find(n=>n.type==='ScrollView');
 const event=y=>({nativeEvent:{contentOffset:{y},layoutMeasurement:{height:400},contentSize:{height:900}}});
 return {h,mod,props,k,gestures,render,scroll,event,active:value=>{active=value;},get canceled(){return canceled;}};
}
test('each board list mounts five cards and only user scroll near the loaded end adds the next five',()=>{
 const s=setup();let tree=s.render();const count=t=>nodes(t).filter(n=>n.props.t).length;assert.equal(count(tree),5);assert.equal(text(tree).includes('Show more'),false);
 s.scroll(tree).props.onScroll(s.event(380));tree=s.render();assert.equal(count(tree),5,'programmatic/layout events cannot pre-mount the rest');
 s.scroll(tree).props.onScrollBeginDrag();assert.equal(s.canceled,1);s.scroll(tree).props.onScroll(s.event(20));assert.equal(count(s.render()),5);
 s.scroll(s.render()).props.onScroll(s.event(380));tree=s.render();assert.equal(count(tree),10);
 s.scroll(tree).props.onScroll(s.event(380));assert.equal(count(s.render()),10,'content/layout feedback cannot grow the whole list at one offset');
 s.active(false);s.scroll(s.render()).props.onScroll(s.event(450));assert.equal(count(s.render()),10,'hidden tabs do no deferred card mounting');
 s.active(true);s.scroll(s.render()).props.onScroll(s.event(500));assert.equal(count(s.render()),15);
 s.props.windowKey='filtered';tree=s.render();assert.equal(count(tree),5,'new filters are capped on their first render, before effects');s.h.unmount();assert.equal(s.k.lists.L,undefined);
});
test('web wheel/keyboard and accessibility scrolling also unlock demand mounting without a Show more control',()=>{
 const s=setup('web');let tree=s.render();s.scroll(tree).props.onWheel();s.scroll(tree).props.onScroll(s.event(400));assert.equal(nodes(s.render()).filter(n=>n.props.t).length,10);
 s.props.windowKey='reset';tree=s.render();s.scroll(tree).props.onAccessibilityAction({nativeEvent:{actionName:'increment'}});assert.equal(nodes(s.render()).filter(n=>n.props.t).length,10);s.h.unmount();
});
test('mount counts are bounded and unchanged by non-user, inactive, top or invalid scroll samples',()=>{
 const base={active:true,userScroll:true,offset:600,viewport:400,content:1000};assert.equal(INITIAL_CARDS,5);
 assert.equal(nextCardCount(5,23,base),10);assert.equal(nextCardCount(20,23,base),23);assert.equal(nextCardCount(23,23,base),23);
 for(const patch of [{active:false},{userScroll:false},{offset:0},{offset:NaN},{viewport:0},{content:Infinity},{offset:1}])assert.equal(nextCardCount(5,23,{...base,...patch}),5);
});
test('drop hit testing includes page and list scrolling and inserts before the unmounted tail, including filtered order',()=>{
 const k=newCtx();k.order.L=Array.from({length:10},(_,i)=>'t'+i);k.lists.L={scroll:{y:80}};k.scroll.y=70;
 for(let i=0;i<5;i++)k.win['t'+i]={y:100+i*100,h:80,sy:20,cy:30,listId:'L'};
 assert.equal(cardTop(k,k.win.t0),0);assert.deepEqual(slotFor(k,'L',10),{index:0,before:'t0'});
 assert.deepEqual(slotFor(k,'L',490),{index:5,before:'t5'});
 const visible=k.order.L.map((id,i)=>({id,list:'L',position:i*2})),hidden={id:'hidden',list:'L',position:9};
 assert.equal(dropBefore([...visible,hidden],visible,'L',slotFor(k,'L',490).index,'moving'),'t5');
 const empty=newCtx();empty.order.L=['unmounted'];assert.deepEqual(slotFor(empty,'L',300),{index:0,before:'unmounted'});
});
test('held-card auto-scroll selects the target list after horizontal/page scroll and clamps its range',()=>{
 const k=newCtx(),entry={scroll:{y:30,max:100,box:{x:300,y:200,w:280,h:400,sx:0,sy:0}}};k.lists.L=entry;k.scroll={x:200,y:100};
 assert.equal(listScrollAtPointer(k,{x:150,y:480}).entry,entry);assert.equal(listScrollAtPointer(k,{x:150,y:480}).y,44);
 assert.equal(listScrollAtPointer(k,{x:150,y:110}).y,16);assert.equal(listScrollAtPointer(k,{x:150,y:300}),null);assert.equal(listScrollAtPointer(k,{x:600,y:480}),null);
 entry.scroll.y=100;assert.equal(listScrollAtPointer(k,{x:150,y:480}),null);
});
test('card drags include source-list scroll and discard stale measurements when their card unmounts',()=>{
 const s=setup();s.k.scroll.y=20;s.k.lists.L={scroll:{y:75}};
 const t=s.props.cards[0];s.h.render(s.mod.__test.TaskCard,{t,board:s.props.board,fromIndex:0,total:1,step:294,features:[],labelColors:{},openTask(){},setDrag(){},setLock(){},k:s.k});
 assert.equal(s.gestures.at(-1).getScroll().y,95);assert.equal(s.k.cards[t.id].listId,'L');s.k.win[t.id]={};s.k.local[t.id]={};s.h.unmount();assert.equal(s.k.win[t.id],undefined);assert.equal(s.k.cards[t.id],undefined);
});
