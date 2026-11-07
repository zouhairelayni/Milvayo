// /src/canvas/editorTools.cjs
'use strict';
const {fitPose,objectBounds}=require('./interaction.cjs');
const COLORS=[{label:'Theme',value:''},{label:'Clay',value:'#E98B7E'},{label:'Sage',value:'#83D8B4'},{label:'Blue',value:'#80A7EF'},{label:'Paper',value:'#F0CC77'}];
function selectObject(ids,id,multiple=false){return !id?[]:multiple?(ids.includes(id)?ids.filter(value=>value!==id):[...ids,id]):[id];}
function changeTool(mode,tool){return {mode:['select','pan','draw','erase','connect','multi'].includes(tool)?tool:mode,panel:tool==='add'?'add':tool==='more'?'tools':''};}
// Opening a large diagram favors readable nodes; explicit Fit still shows every object.
function readablePose(objects,viewport,value){
 const fit=fitPose(objects,viewport),root=value?.scene.items.find(item=>item.nodeId==='w0'&&item.t==='rect'),scale=root?Math.min(4,.85/value.scale):.6;
 if(fit.scale>=scale)return fit;
 if(root&&objects.length===1){const o=objects[0],x=o.x+root.x*value.scale,y=o.y+root.y*value.scale;return {scale,x:(viewport.width-root.w*value.scale*scale)/2-x*scale,y:80-y*scale};}
 const b=objectBounds(objects);return {scale,x:24-b.x*scale,y:24-b.y*scale};
}
function sourceKey(option){return JSON.stringify([option.sourceType,option.sourceId,option.scopeType||'project',option.scopeId||'']);}
module.exports={COLORS,selectObject,changeTool,readablePose,sourceKey};
