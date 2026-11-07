// /tests/helpers/release-082-review.cjs
'use strict';
// Actual JSX, static RN Web projection only. No Metro, native build or Playwright.
const fs=require('node:fs'),vm=require('node:vm');
let source=fs.readFileSync(require.resolve('./render-redesign-review.cjs'),'utf8');
source=source.replace('docs/qa/redesign-063/source-review','docs/qa/release-082/source-review');
source=source.replace("let width=390,mode='dark';", "let width=390,mode='dark',reviewHeight=844,canvasHeader=null,reviewPanel='',editorState=0,reviewSelected=[],reviewInline=null,reviewFontScale=1,reviewMode='select';");
source=source.replace('diagnosticMonitor:{recordAction:noop,recordRender:noop}', 'diagnosticMonitor:{recordAction:noop,recordRender:noop,measureWork:(_name,fn)=>fn()}');
source=source.replace("if(cache.has(file))return cache.get(file).exports;", "if(file.endsWith('/importBoardFile.js'))return {importBoardFile:async()=>null}; if(cache.has(file))return cache.get(file).exports;");
source=source.replace("if(id==='react'||id==='react/jsx-runtime')return require(id);", "if(id==='react')return file.endsWith('/CanvasEditor.js')?{...React,useState:value=>{const index=editorState++;if(index===3)value=reviewSelected;if(index===4)value=reviewMode;if(index===5)value=reviewPanel;if(index===24)value=reviewInline;return React.useState(value&&typeof value==='object'&&'width' in value&&'height' in value?{...value,height:reviewHeight-57}:value);}}:React;if(id==='react/jsx-runtime')return require(id);if(id.endsWith('/useBackNavigation'))return {useBackDismiss:noop};");
source=source.replace("return {...RN,Dimensions:","return {...RN,Modal:({visible,children})=>visible?React.createElement(RN.View,{style:{position:'absolute',inset:0,zIndex:100}},children):null,Dimensions:");
source=source.replace("'Ellipse']","'Ellipse','Pattern']");
source=source.replace("if(/HeaderActions$/.test(id))return {useHeaderActions:noop};","if(/HeaderActions$/.test(id))return {useHeaderActions:(_screen,controls)=>{canvasHeader=controls;}};");
source=source.replace('scale:1,fontScale:1','scale:1,fontScale:reviewFontScale');
source=source.slice(0,source.indexOf("capture('overview-mobile'"));
source+=`
api.error='';
const core=require('../../src/domain/canvas.cjs'),now='2026-11-07T04:00:00.000Z';
project.governance.wbs=[{id:'w0',parent:null,name:'',hours:0},{id:'w1',parent:'w0',name:'Scope',hours:8},{id:'w2',parent:'w0',name:'Delivery',hours:12}];
project.tasks=project.tasks.map((t,i)=>({...t,start:'2026-11-07',due:'2026-11-'+String(9+i).padStart(2,'0')}));
let b=core.createBoard({id:'canvas-review',projectId:project.id,title:'Delivery workshop',now});
const make=(id,type,text,x,y,extra={})=>core.createObject({id,boardId:b.id,type,text,x,y,now,...extra});
b=core.changeBoard(b,{type:'add',objects:[make('note','note','Keep the launch focused',0,0,{width:280,height:144,color:'#F0CC77'}),make('task','linked','',24,220,{width:280,height:200,sourceLink:{projectId:project.id,sourceType:'task',sourceId:project.tasks[0].id,mode:'live'}})]},now);
b=core.changeBoard(b,{type:'connect',edge:{id:'line',from:'note',to:'task',label:'',style:'curve'}},now);
const Library=read('src/screens/canvas/CanvasLibrary.js').default,Editor=read('src/screens/canvas/CanvasEditor.js').default;
const props={project,scope:JSON.stringify(['local',project.id]),onClose:noop,go:noop,openTask:noop,openProject:noop};
function HeaderBridge(){const Bars=read('src/components/shell/Bars.js');return e(RN.View,{style:{position:'absolute',left:0,right:0,top:0}},e(width>=900?Bars.TopBar:Bars.PhoneHeader,{controls:canvasHeader}));}
function screen(board){return ()=>{editorState=0;return e(RN.View,{style:{height:reviewHeight,width,paddingTop:57,backgroundColor:tokens.palette('Coral',mode).bg}},e(Editor,{...props,board}),e(HeaderBridge));};}
for(const m of ['dark','light']){
 mode=m;project.canvases=[b];reviewHeight=844;capture('library-'+m,Library,{},390,844,false);capture('blank-'+m,screen(core.createBoard({id:'blank',projectId:project.id,title:'Strategy canvas',now})),{},390,844,false);capture('editor-'+m,screen(b),{},390,844,false);
}
mode='dark';
for(const [w,h] of [[360,800],[390,844],[430,932],[844,390],[1440,900]]){reviewHeight=h;reviewSelected=[];capture('workspace-'+w+'-dark',screen(b),{},w,h,false);reviewSelected=['note'];capture('selected-'+w+'-dark',screen(b),{},w,h,false);reviewPanel='add';capture('add-'+w+'-dark',screen(b),{},w,h,false);reviewPanel='';}
reviewSelected=['note'];reviewHeight=844;mode='light';capture('selected-390-light',screen(b),{},390,844,false);reviewPanel='add';capture('add-390-light',screen(b),{},390,844,false);reviewPanel='';mode='dark';reviewHeight=800;reviewFontScale=2;capture('selected-large-font',screen(b),{},360,800,false);reviewFontScale=1,reviewMode='select';reviewSelected=[];reviewHeight=844;
let diagram=core.changeBoard(core.createBoard({id:'wbs-board',projectId:project.id,title:'Linked work structure',now}),{type:'add',objects:[{...make('wbs','linked','',0,0,{width:326,height:200,sourceLink:{projectId:project.id,sourceType:'wbs',sourceId:'w0',view:'tree',direction:'down',mode:'live'}}),boardId:'wbs-board'}]},now);
reviewSelected=['wbs'];capture('linked-wbs-dark',screen(diagram),{},390,844,false);reviewSelected=[];
let roadmap=core.changeBoard(core.createBoard({id:'roadmap-board',projectId:project.id,title:'Delivery roadmap',now}),{type:'add',objects:[{...make('roadmap','linked','',0,0,{width:800,height:480,sourceLink:{projectId:project.id,sourceType:'roadmap',sourceId:project.id,mode:'live'}}),boardId:'roadmap-board'}]},now);
reviewHeight=900;capture('roadmap-desktop',screen(roadmap),{},1440,900,false);
reviewHeight=390;capture('editor-landscape',screen(b),{},844,390,false);
reviewHeight=640;capture('editor-small-phone',screen(b),{},320,640,false);
reviewHeight=844;reviewSelected=['note'];capture('context-note',screen(b),{},390,844,false);
for(const panel of ['tools','add','inspect','arrange','appearance','source','selection','color','board','view']){reviewPanel=panel;reviewSelected=panel==='inspect'||panel==='arrange'||panel==='appearance'||panel==='selection'||panel==='color'?['note']:[];capture('menu-'+panel,screen(b),{},390,844,false);}
reviewPanel='';reviewSelected=[];reviewInline=require('../../src/canvas/localEditing.cjs').localEditTarget(b.objects[0],{scene:{items:[{t:'text',fill:'#172331'}]}});capture('inline-note',screen(b),{},390,844,false);reviewInline=null;
reviewSelected=[];reviewMode='draw';reviewPanel='';capture('drawing-dark',screen(b),{},390,844,false);mode='light';capture('drawing-light',screen(b),{},390,844,false);mode='dark';reviewMode='select';
for(const item of manifest)item.note='Static actual JSX; inert effects, simulated measured Canvas viewport. Not live Expo, Android or gesture acceptance.';
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
const files=['library-dark','editor-small-phone','editor-dark','context-note','menu-tools','menu-add','drawing-dark','menu-inspect','menu-arrange','inline-note','editor-light'];
fs.writeFileSync(path.join(out,'overview.html'),'<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#111;display:grid;grid-template-columns:repeat(4,390px)}iframe{border:0;display:block}</style>'+files.map(name=>'<iframe title="'+name+'" width="390" height="844" src="'+name+'.html"></iframe>').join(''));
console.log('Rendered',manifest.length,'static Canvas source fixtures');
`;
vm.runInThisContext('(function(require,module,exports,__dirname){'+source+'\n})',{filename:__filename})(require,module,module.exports,__dirname);
