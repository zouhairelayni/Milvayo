// /tests/gestures/canvas-interaction.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {worldPoint,zoomAt,hitObject,movingIds,connectorPath,fitPose}=require('../../src/canvas/interaction.cjs');
test('Canvas zoom preserves focal world coordinates, hit testing follows layers, groups and connectors follow drag previews',()=>{
 const pose={scale:1,x:20,y:30},anchor={x:150,y:80},next=zoomAt(pose,2,anchor);assert.deepEqual(worldPoint(anchor.x,anchor.y,next),worldPoint(anchor.x,anchor.y,pose));
 const a={id:'a',x:0,y:0,width:100,height:80,zIndex:0},b={id:'b',x:200,y:100,width:100,height:80,zIndex:1,groupId:'a'};
 assert.equal(hitObject([a,b],40,50,pose).id,'a');assert.equal(hitObject([a,b],-50,-50,pose),null);
 assert.deepEqual(movingIds([a,b],['a']),['a','b']);assert.notEqual(connectorPath(a,b),connectorPath(a,b,{ids:['a'],dx:32,dy:16}));
 const fit=fitPose([a,b],{width:390,height:440});assert.ok(fit.scale<=1);assert.ok(Number.isFinite(fit.x));assert.equal(zoomAt(pose,100,anchor).scale,4);assert.equal(zoomAt(pose,.001,anchor).scale,.05);
});
test('S-curve, straight and elbow connectors have distinct paths and a generous zoom-aware editing hit area',()=>{
 const {hitConnector}=require('../../src/canvas/interaction.cjs');const a={id:'a',x:0,y:0,width:100,height:80},b={id:'b',x:300,y:200,width:100,height:80},pose={scale:1,x:0,y:0};
 const paths=['curve','straight','elbow'].map(style=>connectorPath(a,b,null,style));assert.equal(new Set(paths).size,3);assert.match(paths[0],/ C /);assert.match(paths[1],/ L /);assert.match(paths[2],/ H .* V /);
 for(const style of ['curve','straight','elbow'])assert.equal(hitConnector([{id:'e',from:'a',to:'b',style}],[a,b],200,140,pose).id,'e');
 assert.equal(hitConnector([{id:'e',from:'a',to:'b',style:'curve'}],[a,b],200,300,pose),null);
 assert.equal(hitConnector([{id:'e',from:'a',to:'b',style:'curve'}],[a,b],400,280,{scale:2,x:0,y:0}).id,'e');
});
test('selected resize and connector handles hit in screen space and previews attach to resized edges',()=>{
 const {hitResize,hitConnect,resizeBox,connectionPreview}=require('../../src/canvas/interaction.cjs');
 const a={id:'a',type:'note',x:10,y:20,width:100,height:80},b={id:'b',x:300,y:200,width:100,height:80},pose={scale:2,x:0,y:0};
 assert.equal(hitResize([a],['a'],220,200,pose).id,'a');assert.equal(hitConnect([a],['a'],260,120,pose).id,'a');assert.equal(hitResize([a],[],220,200,pose),null);
 const next=resizeBox(a,50,20);assert.equal(next.x,a.x);assert.equal(next.y,a.y);assert.equal(next.width,150);assert.equal(next.height,100);assert.equal(resizeBox(a,-999,-999).width,40);
 const diagram=resizeBox({...a,type:'diagram'},50,10);assert.equal(diagram.width/diagram.height,a.width/a.height);
 assert.notEqual(connectorPath(a,b),connectorPath(a,b,{kind:'resize',id:'a',ids:['a'],dx:50,dy:20}));assert.match(connectionPreview([a,b],{from:'a',target:'b',x:350,y:240}),/ C /);
});
