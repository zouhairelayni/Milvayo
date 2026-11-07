// /tests/gestures/canvas-transform.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{beginTransform,reconcileGeometry,acknowledgeTransform,cancelTransform}=require('../../src/canvas/transform.cjs'),{previewBox,connectorPath}=require('../../src/canvas/interaction.cjs');
test('drag ledger never adds a delta twice or flashes old coordinates through delayed React commits',()=>{
 for(const type of ['note','shape','card','frame','diagram','linked'])for(const scale of [.18,.4,1,2.5]){
  const a={id:'a',type,x:20,y:40,width:200,height:100},b={...a,id:'b',x:500},objects=[a,b];let state=beginTransform(null,objects,0,'move',['a']);state={...state,dx:80/scale,dy:30/scale};const target=previewBox(a,state),path=connectorPath(a,b,state);
  state=reconcileGeometry(state,[{...a,text:'Unrelated'},b],1);assert.equal(previewBox(a,state).x,target.x);
  state={...state,pending:true};state=acknowledgeTransform(state,state.operation,2,true);assert.equal(previewBox(target,state).x,target.x,'new props with old gesture must not double-apply');
  state=reconcileGeometry(state,[target,b],2);assert.equal(state.kind,'settled');assert.equal(previewBox(a,state).x,target.x,'old native closure reads committed authoritative geometry');assert.equal(connectorPath(a,b,state),path);assert.equal(previewBox(target,state).x,target.x);
  assert.equal(reconcileGeometry(state,objects,0),state,'late revisions cannot overwrite committed positions');
 }
});
test('consecutive release operations, cancellations and an external undo reconcile by operation and revision',()=>{
 const a={id:'a',type:'note',x:0,y:0,width:100,height:80};let first={...beginTransform(null,[a],0,'move',['a']),dx:80,dy:40,pending:true};
 const next=beginTransform(first,[a],0,'move',['a']);assert.equal(next.base['$a'].x,80);assert.equal(next.boxes.length,1);assert.equal(acknowledgeTransform(next,first.operation,1,false),next,'old failure cannot cancel the next drag');
 assert.equal(previewBox(a,cancelTransform(first)).x,80,'starting pinch after release keeps the final position');assert.equal(previewBox(a,cancelTransform(first,true)).x,0,'rejected transform rolls back');
 first=acknowledgeTransform(first,first.operation,1,true);assert.equal(reconcileGeometry(first,[a],2).kind,'settled','newer canonical undo supersedes an accepted pending transform');
});
test('resize preview and commit use identical absolute coordinates for group children and connectors',()=>{
 const frame={id:'f',type:'frame',x:100,y:80,width:200,height:100},note={id:'n',type:'note',groupId:'f',x:120,y:90,width:80,height:40},other={...note,id:'o',x:600,groupId:''};let state={...beginTransform(null,[frame,note,other],0,'resize',['f','n'],'f'),dx:200,dy:100,pending:true};
 const target=previewBox(note,state);assert.deepEqual([target.x,target.y,target.width,target.height],[140,100,160,80]);const path=connectorPath(note,other,state);state=reconcileGeometry(state,[previewBox(frame,state),target,other],1);assert.equal(connectorPath(note,other,state),path);assert.deepEqual(previewBox(note,state),target);
});

test('arbitrary imported IDs are safe geometry keys and release packets contain only affected objects',()=>{
 const {transformCommand}=require('../../src/canvas/transform.cjs'),{movingIds}=require('../../src/canvas/interaction.cjs'),objects=['__proto__','constructor','other'].map((id,i)=>({id,type:'note',x:i*100,y:0,width:80,height:64}));const state=beginTransform(null,objects,0,'move',['__proto__']);assert.deepEqual(movingIds(objects,['constructor']),['constructor']);assert.equal(Object.keys(transformCommand(state).base).length,1);assert.equal(previewBox(objects[0],{...state,dx:10,dy:20}).x,10);
});
