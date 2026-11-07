// /src/canvas/connectionGeometry.cjs
'use strict';
const {connectorPath}=require('./interaction.cjs'),{pathBounds,pathLabel}=require('./routing.cjs');
// Shared by drawing, picking and previews for one immutable board revision.
function connectionGeometry(objects,edges){const index=new Map(objects.map(o=>[o.id,o]));return edges.map(edge=>{const a=index.get(edge.from),b=index.get(edge.to),d=a&&b?connectorPath(a,b,null,edge.style,objects):'';return {id:edge.id,d,bounds:pathBounds(d),at:edge.label?pathLabel(d):{x:0,y:0}};});}
function routingObjects(objects){return objects.map(o=>({id:o.id,type:o.type,x:o.x,y:o.y,width:o.width,height:o.height,zIndex:o.zIndex,locked:o.locked,groupId:o.groupId,...(o.sourceLink?{sourceLink:{sourceType:o.sourceLink.sourceType}}:{})}));}
module.exports={connectionGeometry,routingObjects};
