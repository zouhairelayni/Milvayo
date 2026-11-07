// /tests/gestures/canvas-visibility.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{visibleBox,visibleRoute,visibilityKey}=require('../../src/canvas/visibility.cjs'),{connectionGeometry,routingObjects}=require('../../src/canvas/connectionGeometry.cjs');
test('overscan culls distant scene content, retains crossing connectors and changes windows only at coarse boundaries',()=>{
 const pose={scale:1,x:0,y:0},view={width:390,height:700};assert.ok(visibleBox({x:10,y:20,width:100,height:80},pose,view));assert.equal(visibleBox({x:9000,y:9000,width:100,height:80},pose,view),false);assert.ok(visibleRoute({left:-1000,right:1000,top:100,bottom:100},pose,view));assert.equal(visibilityKey(pose,view),visibilityKey({...pose,x:-50,y:-50},view));assert.notEqual(visibilityKey(pose,view),visibilityKey({...pose,x:-800},view));
 for(const scale of [.18,.4,1,2.5]){const p={scale,x:-100,y:50};for(const dx of [0,100,200]){const next={...p,x:p.x-dx};if(visibilityKey(p,view)===visibilityKey(next,view))assert.ok(visibleBox({x:(view.width-next.x)/scale,y:-next.y/scale,width:1,height:1},p,view),'buffer includes visible content until next coarse window');}}
});
test('route caching and geometric projections retain unrelated identities after one object moves',()=>{
 const a=Object.freeze({id:'a',type:'note',x:0,y:0,width:100,height:80}),b=Object.freeze({...a,id:'b',x:300}),far=Object.freeze({...a,id:'far',x:8000}),edges=[{id:'e',from:'a',to:'b',style:'curve'}],before=routingObjects([a,b,far]),after=routingObjects([a,b,{...far,x:9000}]);assert.equal(before[0],after[0]);assert.equal(before[1],after[1]);assert.equal(connectionGeometry(before,edges)[0],connectionGeometry(after,edges)[0]);
});
