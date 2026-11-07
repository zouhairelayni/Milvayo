// /src/canvas/localEditing.cjs
'use strict';
function localEditTarget(object,value,point,nodeId){
 if(object.locked||!['note','text','card','shape','frame','diagram'].includes(object.type))return null;
 if(object.type!=='diagram')return {id:object.id,nodeId:'',value:object.text,box:{x:object.x+12,y:object.y+8,width:Math.max(120,object.width-24),height:object.type==='frame'?32:Math.max(32,object.height-16)},fill:object.type==='text'||object.type==='frame'?'bg':object.color||'surface',ink:value.scene.items.find(i=>i.t==='text')?.fill||'ink'};
 const items=value.scene.items.filter(item=>item.nodeId),scale=value.scale;
 const boxes=items.map(item=>{const width=item.t==='rect'?item.w:Math.max(60,String(item.s).length*(item.size||12)*.62),height=item.t==='rect'?item.h:(item.size||12)*1.8;const at=value.scene.items.indexOf(item);return {nodeId:item.nodeId,fill:item.t==='rect'?item.fill:'bg',ink:item.t==='text'?item.fill:value.scene.items[at+1]?.fill||'ink',x:object.x+(item.x-(item.t==='text'?(item.anchor==='end'?width:item.anchor==='start'?0:width/2):0))*scale,y:object.y+(item.y-(item.t==='text'?height*.75:0))*scale,width:width*scale,height:height*scale};});
 const box=nodeId?boxes.find(box=>box.nodeId===nodeId):point?boxes.slice().reverse().find(box=>point.x>=box.x&&point.x<=box.x+box.width&&point.y>=box.y&&point.y<=box.y+box.height):boxes[0];
 if(!box)return null;const node=object.nodes.find(n=>n.id===box.nodeId);return node?{id:object.id,nodeId:node.id,value:node.id==='w0'?object.text||node.name:node.name,fill:box.fill,ink:box.ink,box}:null;
}
module.exports={localEditTarget};
