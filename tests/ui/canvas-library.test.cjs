// /tests/ui/canvas-library.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {load}=require('../helpers/diagram-harness.cjs'),{lifecycleHarness}=require('../helpers/lifecycle-harness.cjs'),{nodes,control}=require('../helpers/screen-harness.cjs');
const model=require('../../src/domain/model.cjs'),canvas=require('../../src/domain/canvas.cjs');
function setup(){
 const h=lifecycleHarness(),workspace={selectedId:'p',projects:[model.makeProject({id:'p',name:'Project A'})]};let editorLoads=0,saveOK=true;
 const store={workspace,workspaceId:'local',saveCanvas(board,expected){if(!saveOK)return false;workspace.projects=[canvas.saveBoard(workspace.projects[0],board,expected)];return true;},flush:async()=>true,createSnapshot:()=>true,deleteCanvas(){}};
 const mocks={react:h.hooks,'react-native':{View:'View'},'../../ui/ui':new Proxy({},{get:(_,k)=>k}),'../../store/store':{useStore:()=>store},'../../ui/theme/theme':{useTheme:()=>({c:{danger:'#f88'}})},'../../canvas/importBoardFile':{importBoardFile:async()=>null}};
 Object.defineProperty(mocks,'./CanvasEditor',{get(){editorLoads++;return {__esModule:true,default:'Editor'};}});
 const mod=load('src/screens/canvas/CanvasLibrary.js',mocks,['template']);
 return {h,render:()=>h.render(mod.default,{}),workspace,get editorLoads(){return editorLoads;},fail:()=>{saveOK=false;},mod};
}
test('Canvas library stays lightweight, creates durable project boards and loads the editor only on entry',async()=>{
 const s=setup();let tree=s.render();assert.equal(s.editorLoads,0);control(tree,'New canvas').props.onPress();tree=s.render();nodes(tree).find(n=>n.props.accessibilityLabel==='Canvas name').props.onChangeText('Delivery map');tree=s.render();
 await control(tree,'Create canvas').props.onPress();tree=s.render();assert.equal(s.workspace.projects[0].canvases.length,1);assert.equal(tree.type,'Editor');assert.equal(tree.props.board.title,'Delivery map');assert.equal(s.editorLoads,1);assert.equal(s.workspace.projects[0].tasks.length,0);
});
test('rejected creation keeps its draft and error visible, and all templates normalize without canonical mutation',async()=>{
 const s=setup();s.fail();let tree=s.render();control(tree,'New canvas').props.onPress();tree=s.render();nodes(tree).find(n=>n.props.accessibilityLabel==='Canvas name').props.onChangeText('Keep this draft');tree=s.render();await control(tree,'Create canvas').props.onPress();tree=s.render();assert.equal(nodes(tree).find(n=>n.props.accessibilityLabel==='Canvas name').props.value,'Keep this draft');assert.equal(s.workspace.projects[0].canvases.length,0);assert.equal(s.editorLoads,0);
 const p=s.workspace.projects[0],before=JSON.stringify(p),now='2026-11-07T04:00:00.000Z';for(const kind of ['blank','brainstorm','strategy','risks','roadmap']){const b=canvas.createBoard({id:kind,projectId:p.id,now});const result=s.mod.__test.template(b,kind,p,now);assert.equal(result.schemaVersion,1);if(kind==='brainstorm')assert.equal(result.objects[1].groupId,result.objects[0].id);}assert.equal(JSON.stringify(p),before);
});
test('Add to Canvas inserts a live source reference into a chosen project board, preserving source tasks',async()=>{
 const h=lifecycleHarness(),p=model.makeProject({id:'p',tasks:[{id:'t',title:'Canonical'}]}),now='2026-11-07T04:00:00.000Z';p.canvases=[canvas.createBoard({id:'b',projectId:p.id,title:'Workshop',now})];const workspace={selectedId:p.id,projects:[p]},before=JSON.stringify(p.tasks);
 const store={workspace,saveCanvas:(b,rev)=>{workspace.projects=[canvas.saveBoard(workspace.projects[0],b,rev)];return true;},flush:async()=>true};
 const mod=load('src/screens/canvas/AddToCanvas.js',{react:h.hooks,'react-native':{View:'View'},'../../ui/ui':new Proxy({},{get:(_,k)=>k}),'../../store/store':{useStore:()=>store}});const render=()=>h.render(mod.default,{source:{sourceType:'task',sourceId:'t'}});
 let tree=render();control(tree,'Add to Canvas').props.onPress();tree=render();await control(tree,'Workshop').props.onPress();tree=render();assert.equal(workspace.projects[0].canvases[0].objects[0].sourceLink.sourceId,'t');assert.equal(JSON.stringify(workspace.projects[0].tasks),before);h.unmount();
});
test('Add to Canvas retries a failed durable save without inserting another linked object',async()=>{
 const h=lifecycleHarness(),now='2026-11-07T04:00:00.000Z',p=model.makeProject({id:'p',tasks:[{id:'t',title:'Canonical'}]});p.canvases=[canvas.createBoard({id:'b',projectId:p.id,title:'Workshop',now})];const workspace={selectedId:p.id,projects:[p]};let io=false;
 const store={workspace,saveCanvas:(b,rev)=>{workspace.projects=[canvas.saveBoard(workspace.projects[0],b,rev)];return true;},flush:async()=>io};const mod=load('src/screens/canvas/AddToCanvas.js',{react:h.hooks,'react-native':{View:'View'},'../../ui/ui':new Proxy({},{get:(_,k)=>k}),'../../store/store':{useStore:()=>store}}),render=()=>h.render(mod.default,{source:{sourceType:'task',sourceId:'t'}});
 let tree=render();control(tree,'Add to Canvas').props.onPress();tree=render();await control(tree,'Workshop').props.onPress();tree=render();assert.equal(workspace.projects[0].canvases[0].objects.length,1);io=true;await control(tree,'Workshop').props.onPress();assert.equal(workspace.projects[0].canvases[0].objects.length,1);h.unmount();
});
