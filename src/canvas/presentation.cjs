// /src/canvas/presentation.cjs
'use strict';
const {previewBox,worldPoint}=require('./interaction.cjs');
function selectionAnchor(boxes,pose,drag,viewport,extent=266,bottom=84){
 'worklet';const width=Math.max(48,Math.min(extent,viewport.width-24)),height=58,maxY=Math.max(12,viewport.height-bottom-height);
 let left=Infinity,right=-Infinity,top=Infinity,base=-Infinity;
 for(let i=0;i<boxes.length;i++){const o=previewBox(boxes[i],drag);left=Math.min(left,o.x*pose.scale+pose.x);right=Math.max(right,(o.x+o.width)*pose.scale+pose.x);top=Math.min(top,o.y*pose.scale+pose.y);base=Math.max(base,(o.y+o.height)*pose.scale+pose.y);}
 const visible=boxes.length&&right>0&&left<viewport.width&&base>0&&top<viewport.height-bottom;
 const x=visible?Math.max(12,Math.min(viewport.width-width-12,(left+right-width)/2)):Math.max(12,(viewport.width-width)/2);
 const y=visible&&top-height-12>=12?Math.min(maxY,top-height-12):visible&&base+12<=maxY?Math.max(12,base+12):maxY;
 return {x,y,width,height};
}
function insertionPoint(pose,viewport){const p=worldPoint(viewport.width/2,Math.max(48,Math.min(120,viewport.height/3)),pose);return {x:p.x-120,y:p.y};}
function inlineEditorBox(box,pose,viewport){const width=Math.min(Math.max(160,box.width*pose.scale),Math.max(48,viewport.width-24)),height=Math.min(Math.max(48,box.height*pose.scale),Math.max(48,viewport.height-96));return {x:Math.max(12,Math.min(viewport.width-width-12,box.x*pose.scale+pose.x)),y:Math.max(12,Math.min(viewport.height-height-72,box.y*pose.scale+pose.y)),width,height};}
module.exports={selectionAnchor,insertionPoint,inlineEditorBox};
