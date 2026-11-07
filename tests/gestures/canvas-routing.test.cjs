// /tests/gestures/canvas-routing.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {routeConnector}=require('../../src/canvas/routing.cjs'),{routedPoints,connectorPath,hitConnector}=require('../../src/canvas/interaction.cjs');
const a={id:'a',type:'note',x:0,y:0,width:100,height:80};
function clear(points,objects){for(let i=1;i<points.length;i++){const p=points[i-1],q=points[i];for(const o of objects){const overlap=p.x===q.x?p.x>o.x&&p.x<o.x+o.width&&Math.max(p.y,q.y)>o.y&&Math.min(p.y,q.y)<o.y+o.height:p.y>o.y&&p.y<o.y+o.height&&Math.max(p.x,q.x)>o.x&&Math.min(p.x,q.x)<o.x+o.width;assert.equal(overlap,false,`segment ${i} crosses ${o.id}`);}}}
test('connectors choose closest facing left, top, right and bottom edges',()=>{
 for(const [x,y,start,end]of [[300,0,{x:100,y:40},{x:300,y:40}],[-300,0,{x:0,y:40},{x:-200,y:40}],[0,-300,{x:50,y:0},{x:50,y:-220}],[0,300,{x:50,y:80},{x:50,y:300}]]){const b={...a,id:'b',x,y},points=routeConnector(a,b,[a,b]);assert.deepEqual(points[0],start);assert.deepEqual(points.at(-1),end);clear(points,[a,b]);}
});
test('routes avoid intervening boxes, follow live moves/resizes and remain editable on detours',()=>{
 const b={...a,id:'b',x:300},block={...a,id:'block',x:140,y:-80,width:120,height:240},objects=[a,b,block],points=routedPoints(a,b,null,objects);assert.ok(points.length>2);clear(points,objects);assert.ok(points.some(p=>p.y<block.y||p.y>block.y+block.height));
 const edge={id:'e',from:'a',to:'b',style:'elbow'},p=points[1],q=points[2];assert.equal(hitConnector([edge],objects,(p.x+q.x)/2,(p.y+q.y)/2,{scale:1,x:0,y:0}).id,'e');
 const drag={kind:'move',ids:['block'],dx:0,dy:400};assert.equal(connectorPath(a,b,null,'curve',objects),connectorPath(a,b,drag,'curve',objects),'unrelated obstacles cannot change a custom S-curve');
 const next=routedPoints(a,b,{kind:'resize',id:'a',ids:['a'],dx:20,dy:10},objects);clear(next,[{...a,width:120,height:90},b,block]);
 assert.deepEqual(routeConnector(a,{...a,id:'overlap',x:10,y:10,width:20,height:20},[a,{...a,id:'overlap',x:10,y:10,width:20,height:20}]),[],'contained endpoints must not draw through their interiors');
});
test('cached routes only invalidate for moved endpoints or obstacles near the existing route',()=>{
 const {pathBounds,routeAffected}=require('../../src/canvas/routing.cjs'),b={...a,id:'b',x:300},bounds=pathBounds(connectorPath(a,b,null,'curve',[a,b]));assert.equal(routeAffected('a','b',null,bounds),false);
 const far={kind:'move',ids:['far'],boxes:[{x:500,y:500,width:100,height:80}],dx:10,dy:0};assert.equal(routeAffected('a','b',far,bounds),false);assert.equal(routeAffected('far','b',far,bounds),true);
 assert.equal(routeAffected('a','b',{...far,dx:-350,dy:-500},bounds),true,'swept obstacles invalidate even if the original position is far away');assert.equal(routeAffected('a','b',{...far,kind:'resize',boxes:[{x:150,y:60,width:20,height:20}],dy:-30},bounds),true);
});
test('gesture geometry excludes document, snapshot, drawing and text payloads while keeping editing constraints',()=>{
 const {routingObjects,connectionGeometry}=require('../../src/canvas/connectionGeometry.cjs'),full=[{...a,text:'private text'.repeat(1000),nodes:[{name:'Large tree'}],sourceLink:{sourceType:'wbs',snapshot:{title:'Document text'}}},{...a,id:'b',x:300}],geometry=routingObjects(full),routes=connectionGeometry(geometry,[{id:'edge',from:'a',to:'b',style:'curve',label:'Connection'}]);assert.ok(JSON.stringify(geometry).length<500);assert.equal(geometry[0].sourceLink.sourceType,'wbs');assert.equal(geometry[0].text,undefined);assert.equal(geometry[0].nodes,undefined);assert.equal(geometry[0].sourceLink.snapshot,undefined);assert.equal(hitConnector([{id:'edge',from:'a',to:'b',style:'curve'}],geometry,200,40,{scale:1,x:0,y:0},12,routes).id,'edge');
});
