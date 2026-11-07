// /src/canvas/connectionGeometry.cjs
'use strict';
const {connectorPath}=require('./interaction.cjs'),{pathBounds,pathLabel}=require('./routing.cjs');
const projections=new WeakMap(),paths=new Map();
// Only custom elbow routes depend on obstacles; cubic/straight routes depend on endpoints.
function connectionGeometry(objects,edges){const index=new Map(objects.map(o=>[o.id,o]));return edges.map(edge=>{const a=index.get(edge.from),b=index.get(edge.to);if(!a||!b)return {id:edge.id,d:'',bounds:null,at:{x:0,y:0}};const key=edge.style==='elbow'?null:JSON.stringify([edge.id,a.x,a.y,a.width,a.height,b.x,b.y,b.width,b.height,edge.style,!!edge.label]);let value=key&&paths.get(key);if(!value){const d=connectorPath(a,b,null,edge.style,objects);value={id:edge.id,d,bounds:pathBounds(d),at:edge.label?pathLabel(d):{x:0,y:0}};if(key){paths.set(key,value);if(paths.size>2048)paths.delete(paths.keys().next().value);}}return value;});}
function routingObjects(objects){return objects.map(o=>{if(projections.has(o))return projections.get(o);const value={id:o.id,type:o.type,x:o.x,y:o.y,width:o.width,height:o.height,zIndex:o.zIndex,locked:o.locked,groupId:o.groupId,...(o.sourceLink?{sourceLink:{sourceType:o.sourceLink.sourceType}}:{})};projections.set(o,value);return value;});}
module.exports={connectionGeometry,routingObjects};
