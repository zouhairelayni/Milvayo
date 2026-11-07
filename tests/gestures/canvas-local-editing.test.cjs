// /tests/gestures/canvas-local-editing.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{localEditTarget}=require('../../src/canvas/localEditing.cjs');
test('inline edits use existing note interiors and locate individual native diagram nodes in world space',()=>{
 const note={id:'note',type:'note',text:'Decision',x:40,y:60,width:240,height:144,color:'#F0CC77'},value={scene:{items:[{t:'text',fill:'#172331'}]}};const target=localEditTarget(note,value);assert.equal(target.box.x,52);assert.equal(target.box.y,68);assert.equal(target.fill,note.color);assert.equal(target.ink,'#172331');assert.equal(localEditTarget({...note,locked:true},value),null);assert.equal(localEditTarget({...note,type:'linked'},value),null);
 const diagram={...note,type:'diagram',text:'Root',nodes:[{id:'w0',name:'Root'},{id:'child',name:'Idea'}]},scene={scale:2,scene:{items:[{t:'rect',nodeId:'w0',x:10,y:20,w:140,h:58,fill:'ink'},{t:'text',fill:'bg'},{t:'rect',nodeId:'child',x:200,y:100,w:140,h:58,fill:'surface'},{t:'text',fill:'ink'}]}};
 assert.equal(localEditTarget(diagram,scene,{x:460,y:280}).nodeId,'child');assert.equal(localEditTarget(diagram,scene,null,'child').box.width,280);assert.equal(localEditTarget(diagram,scene,{x:9999,y:9999}),null);assert.equal(localEditTarget(diagram,scene).value,'Root');
});
