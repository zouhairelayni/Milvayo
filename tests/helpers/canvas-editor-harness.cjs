// /tests/helpers/canvas-editor-harness.cjs
'use strict';
const assert=require('node:assert/strict');
const {load}=require('../helpers/diagram-harness.cjs'),{lifecycleHarness}=require('../helpers/lifecycle-harness.cjs'),{nodes,control}=require('../helpers/screen-harness.cjs');
const model=require('../../src/domain/model.cjs'),canvas=require('../../src/domain/canvas.cjs');
const now='2026-11-07T04:00:00.000Z',pm=load('src/governance/pm.js',{'./data':{labourCosts:()=>[],money:String}});
function setup({initialBoard}={}){
 const h=lifecycleHarness();let project=model.makeProject({id:'p',tasks:[{id:'t',title:'Canonical task',start:'2026-11-07',due:'2026-11-09'}]}),board=initialBoard||canvas.createBoard({id:'b',projectId:'p',title:'Workshop',now});project=model.makeProject({...project,canvases:[board]});let io=true,closed=0,header=null,clipboard='',readClipboard=async()=>clipboard;
 const ui=new Proxy({},{get:(_,k)=>k}),store={saveCanvas(b,rev){try{project=canvas.saveBoard(project,b,rev);return true;}catch{return false;}},saveCanvasViewport(id,pose,rev){project=canvas.saveViewport(project,id,pose,rev);return true;},flush:async()=>io,error:''};
 const children=Object.fromEntries(['CanvasSvgButton','CanvasCommentBubble','CanvasPanButtons','CanvasItemList','CanvasHeader','CanvasPopover','CanvasBrushPalette','CanvasExports','CanvasToolbar','CanvasContextToolbar','CanvasAddMenu','CanvasSources','CanvasSwatches','CanvasInlineEditor','CanvasMenuRow'].map(name=>['./'+name,{__esModule:true,default:name}]));
 children['./CanvasPopover'].CanvasPopoverHost='PopoverHost';
 children['./CanvasToolbar'].CanvasTool='CanvasTool';
 const mod=load('src/screens/canvas/CanvasEditor.js',{
  ...children,'../../cloud/useCloudPresence':{useCloudPresence:()=>({viewers:0,editing:false})},'react-native-safe-area-context':{useSafeAreaInsets:()=>({bottom:0})},'../../canvas/useCanvasCamera':{useCanvasCamera:initial=>{const pose=h.hooks.useRef(initial),drag=h.hooks.useRef(null);return {pose,drag};}},react:h.hooks,'react-native':{Platform:{OS:'android'},View:'View',useWindowDimensions:()=>({width:390,height:844})},'../../ui/ui':ui,'../../ui/theme/theme':{useTheme:()=>({c:{bg:'#111',surface:'#222',ink:'#fff',line:'#444',danger:'#f88'}})},'../../components/inline/CompactTools':{Fold:'Fold'},'../../store/store':{useStore:()=>store},'../../app/navigation/useBackNavigation':{useBackDismiss(){}},'../../diagnostics/useRenderMetric':{useRenderMetric(){}},'../../diagnostics/monitor':{diagnosticMonitor:{recordAction(){}}},'../../governance/pm':pm,'../../canvas/CanvasSurface':{__esModule:true,default:'Surface'},'../../components/shell/HeaderActions':{useHeaderActions:(_screen,controls)=>{header=controls;}},'../../canvas/scene':{objectScene:o=>({scene:{width:o.type==='diagram'?o.diagramType==='fishbone'?1000:400:800,height:o.type==='diagram'?o.diagramType==='fishbone'?200:320:480,items:[]},scale:1})},'expo-clipboard':{setStringAsync:async value=>{clipboard=value;},getStringAsync:()=>readClipboard()},
 },[],{setTimeout,clearTimeout});
 const props={board,project,scope:'test',onClose:()=>closed++,go(){},openTask(){},openProject(){}};
 let tree;
 const s={render:()=>tree=h.render(mod.default,{...props,project}),part:type=>nodes(tree).find(n=>n.type===type)?.props,press:label=>{const n=control(tree,label);assert.ok(n,label);return n.props.onPress();},tool:tool=>s.part('CanvasToolbar').onTool(tool),add:(type='note',kind)=>{s.tool('add');s.render();s.part('CanvasAddMenu').onAdd(type,kind);s.render();},closePanel:()=>{nodes(tree).find(n=>n.type==='Sheet'||n.type==='CanvasPopover').props.onClose();s.render();},get project(){return project;},get board(){return project.canvases[0];},setIO:value=>{io=value;},get closed(){return closed;},get header(){return header;},deferPaste:fn=>{readClipboard=fn;},h};s.render();return s;
}
module.exports={setup};
