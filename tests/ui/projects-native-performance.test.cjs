// /tests/ui/projects-native-performance.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {load}=require('../helpers/diagram-harness.cjs'),{lifecycleHarness}=require('../helpers/lifecycle-harness.cjs');
const {nodes,control}=require('../helpers/screen-harness.cjs');
const model=require('../../src/domain/model.cjs');
function setup(platform='android',count=100){
 const h=lifecycleHarness();let allowed=true;
 const sample=model.createWorkspace().projects[0],projects=Array.from({length:count},(_,i)=>({...sample,id:'p'+i,name:'Project '+i,code:'P'+i}));
 const store={workspaceId:'local',workspace:{projects,selectedId:'p0'},projects};
 const actions={switchProject:()=>allowed,updateProject:()=>allowed,duplicateProject(){},archiveProject(){},deleteProject(){}};
 const ui=new Proxy({useWide:()=>false},{get:(o,k)=>o[k]||k});
 const mod=load('src/screens/governance/Projects.js',{
  react:{...h.hooks,memo:fn=>fn,useDeferredValue:v=>v},'react-native':{Platform:{OS:platform},View:'View',Pressable:'Pressable',FlatList:'FlatList'},
  '@expo/vector-icons':{Feather:'Feather'},'../../ui/ui':ui,'../../components/inline/CompactTools':{EditRow:'EditRow',Labeled:'Labeled',Dropdown:'Dropdown'},
  '../../store/store':{useStore:()=>store,useStoreActions:()=>actions},'../../diagnostics/useRenderMetric':{useRenderMetric(){}},
  '../../ui/theme/theme':{useTheme:()=>({c:{surface:'#17191C',line:'#333333',muted:'#bbbbbb'}})},'../../governance/store':{useStore:()=>({})},
  '../../governance/pm':{HEALTH_COLOR:{}},'./pm/PmDocs':{},'./pm/PmRisks':{},'./pm/PmWbs':{},'./CreateProjectSheet':'CreateProjectSheet',
  '../../components/inline/TaskMarkdown':'TaskMarkdown','../../components/charts/StudioCharts':{CompletionArc:'CompletionArc',BudgetComparison:'BudgetComparison'},'./pm/pmui':{},
 },['ProjectCard']);
 return {h,store,actions,mod,allow:value=>{allowed=value;},render:props=>h.render(mod.Projects,props||{})};
}
test('native Projects bounds initial cards and batches while web and embedded management retain their existing pagination',()=>{
 const s=setup();let tree=s.render();assert.equal(tree.type,'FlatList');assert.equal(tree.props.data.length,100);assert.equal(tree.props.initialNumToRender,2);assert.equal(tree.props.maxToRenderPerBatch,2);assert.equal(tree.props.windowSize,5);assert.equal(tree.props.removeClippedSubviews,false);
 const card=tree.props.renderItem({item:tree.props.data[99]});assert.equal(card.props.p.id,'p99');assert.equal(card.props.canArchive,true);
 const search=nodes(tree.props.ListHeaderComponent).find(n=>n.type==='Input');search.props.onChangeText('Project 99');tree=s.render();assert.equal(tree.props.data.length,1);assert.equal(tree.props.data[0].id,'p99');
 search.props.onChangeText('missing');tree=s.render();assert.equal(tree.props.data.length,0);assert.equal(tree.props.ListEmptyComponent.props.title,'No matching projects');s.h.unmount();
 for(const [platform,embedded] of [['web',false],['android',true]]){const v=setup(platform);const list=v.render({embedded});assert.notEqual(list.type,'FlatList');if(!embedded)assert.equal(list.props.title,undefined,'the explicit Your projects intro is the only list heading');assert.equal(nodes(list).filter(n=>n.props.p).length,20);v.h.unmount();}
});
test('virtualized project editors retain rejected and unsaved drafts across row unmount; successful save and cancel clear them',()=>{
 const s=setup('android',1),drafts=new Map(),p=s.store.workspace.projects[0],props={p,drafts,canArchive:false,canDelete:false,onOpen(){}};
 let tree=s.h.render(s.mod.__test.ProjectCard,props);nodes(tree).find(n=>n.type==='ActionMenu').props.items.find(i=>i.label==='Edit project').onPress();
 tree=s.h.render(s.mod.__test.ProjectCard,props);nodes(tree).find(n=>n.type==='Labeled'&&n.props.title==='Name').props.onChange('Unsaved project name');
 tree=s.h.render(s.mod.__test.ProjectCard,props);s.allow(false);control(tree,'Save changes').props.onPress();assert.equal(drafts.get(p.id).name,'Unsaved project name');s.h.unmount();
 const resumed=setup('android',1);tree=resumed.h.render(resumed.mod.__test.ProjectCard,props);assert.equal(nodes(tree).find(n=>n.type==='EditRow').props.initial,true);assert.equal(nodes(tree).find(n=>n.type==='Labeled'&&n.props.title==='Name').props.value,'Unsaved project name');
 control(tree,'Save changes').props.onPress();assert.equal(drafts.has(p.id),false);tree=resumed.h.render(resumed.mod.__test.ProjectCard,props);nodes(tree).find(n=>n.type==='ActionMenu').props.items[0].onPress();tree=resumed.h.render(resumed.mod.__test.ProjectCard,props);control(tree,'Cancel').props.onPress();assert.equal(drafts.size,0);resumed.h.unmount();
});
test('failed project selection stays in the list; workspace changes do not reuse another workspace’s draft cache',()=>{
 const s=setup();let tree=s.render();const props=tree.props.renderItem({item:tree.props.data[0]}).props,first=props.drafts;
 first.set('p0',{name:'Local draft'});s.store.workspaceId='other';tree=s.render();assert.notEqual(tree.props.renderItem({item:tree.props.data[0]}).props.drafts,first);
 const c=setup('android',1);let opened=0;const card=c.h.render(c.mod.__test.ProjectCard,{...props,onOpen:()=>opened++});c.allow(false);control(card,'Open project').props.onPress();assert.equal(opened,0);c.allow(true);control(card,'Open project').props.onPress();assert.equal(opened,1);c.h.unmount();s.h.unmount();
});
test('shared Android actions and icon controls have 48-unit targets while web sizes remain stable',()=>{
 const {screenHarness}=require('../helpers/screen-harness.cjs');
 for(const platform of ['android','web']){const h=screenHarness('src/ui/uiControls.js',{}, {platform});const button=h.render('Button',{label:'Open project'}),icon=h.render('IconBtn',{label:'Project actions',icon:'more-horizontal'});assert.equal(button.props.style.minHeight,platform==='android'?48:46);assert.equal(icon.props.style.width,platform==='android'?48:44);}
});
