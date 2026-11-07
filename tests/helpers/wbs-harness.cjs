// /tests/helpers/wbs-harness.cjs
'use strict';
const {load}=require('./diagram-harness.cjs');
const {lifecycleHarness}=require('./lifecycle-harness.cjs');
const geometry=require('../../src/governance/diagramScene.cjs');
const caching=require('../../src/governance/diagramCache.cjs');
const pm=load('src/governance/pm.js',{'./data':{labourCosts:()=>[],money:String}});
let serial=0;
const fixture=()=>[{id:'w0',parent:null,name:'',hours:0},{id:'w1',parent:'w0',name:'Design',hours:8},{id:'w2',parent:'w0',name:'Build',hours:12}];
function wbsHarness({nodes=fixture(),cache=caching.createDiagramCache(),scope='test-'+(++serial),workspace='local'}={}){
 const h=lifecycleHarness(),calculations={tree:0,fishbone:0,mind:0},actions=[],work=[];let renders=0,serializations=0;
 const store={currentId:scope,workspaceId:workspace,s:{project:{name:'Studio'},pm:{wbs:nodes}},setPm(key,value){store.s.pm[key]=value;return true;}};
 const views={...geometry,Scene:'Scene',sceneFor:(...args)=>{calculations[args[0]]++;return geometry.sceneFor(...args);},sceneToSvg:(...args)=>{serializations++;return geometry.sceneToSvg(...args);}};
 const mod=load('src/screens/governance/pm/PmWbs.js',{
  react:h.hooks,'react-native':{View:'View',Pressable:'Pressable',ScrollView:'ScrollView'},
  '../../../ui/ui':new Proxy({useWide:()=>false},{get:(o,k)=>o[k]||k}),
  '../../../ui/theme/theme':{useTheme:()=>({c:{ink:'#ffffff',bg:'#000000',danger:'#ff4444'}})},
  '../../../governance/store':{useStore:()=>store},'../../../governance/pm':pm,'../../../governance/wbsviews':views,
  '../../../governance/diagramCache.cjs':{...caching,diagramCache:cache},
  '../../../governance/DiagramPreview':{__esModule:true,default:'DiagramPreview'},'../../../governance/DiagramExports':{__esModule:true,default:'DiagramExports'},
  './PmDocs':{DocHeader:'DocHeader'},'./pmui':{Field:'Field',NumInput:'NumInput',OwnerPick:'OwnerPick'},
  '../../../components/inline/MarkdownField':{__esModule:true,default:'MarkdownField'},
  '../../../gestures/DiagramViewport':{__esModule:true,default:'DiagramViewport'},
  '../../../diagnostics/useRenderMetric':{useRenderMetric:()=>renders++},
  '../../../diagnostics/monitor':{diagnosticMonitor:{measureWork:(name,fn)=>{work.push(name);return fn();},recordAction:x=>actions.push(x)}},
 });
 return {h,store,cache,calculations,actions,work,render:()=>h.render(mod.default),get renders(){return renders;},get serializations(){return serializations;}};
}
module.exports={wbsHarness,fixture,pm};
