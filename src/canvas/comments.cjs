// /src/canvas/comments.cjs
'use strict';
const {previewBox}=require('./interaction.cjs');
const COLORS=['#E98B7E','#83D8B4','#80A7EF','#F0CC77'];
const markers=new Map();
function commentColor(id){let hash=0;for(let i=0;i<id.length;i++)hash=(hash*31+id.charCodeAt(i))>>>0;return COLORS[hash%COLORS.length];}
function commentPosition(anchor,box,drag){'worklet';if(box){const o=previewBox(box,drag);return {x:o.x+o.width+12,y:o.y+12};}return {x:anchor.x,y:anchor.y};}
function commentGeometry(threads,objects){const byId=new Map(objects.map(o=>[o.id,o]));return (threads||[]).map(t=>{const box=t.objectId?byId.get(t.objectId)||null:null,key=JSON.stringify([t.id,t.x,t.y,box?.id,box?.x,box?.y,box?.width,box?.height]);if(markers.has(key))return markers.get(key);const light=box?{id:box.id,type:box.type,x:box.x,y:box.y,width:box.width,height:box.height,...(box.sourceLink?{sourceLink:{sourceType:box.sourceLink.sourceType}}:{})}:null,value={anchor:{id:t.id,x:t.x,y:t.y},box:light,color:commentColor(t.id)};markers.set(key,value);if(markers.size>1024)markers.delete(markers.keys().next().value);return value;});}
function hitComment(markers,x,y,pose,drag){'worklet';for(let i=markers.length-1;i>=0;i--){const m=markers[i],p=commentPosition(m.anchor,m.box,drag);if(Math.hypot(x-(p.x*pose.scale+pose.x),y-(p.y*pose.scale+pose.y))<=24)return m.anchor.id;}return '';}
function commentBubbleAnchor(anchor,box,pose,drag,viewport,height=240){'worklet';const p=commentPosition(anchor,box,drag),width=Math.min(300,viewport.width-24),x=Math.max(12,Math.min(viewport.width-width-12,p.x*pose.scale+pose.x+14)),y=Math.max(12,Math.min(viewport.height-height-12,p.y*pose.scale+pose.y+12));return {x,y,width};}
module.exports={commentColor,commentPosition,commentGeometry,hitComment,commentBubbleAnchor};
