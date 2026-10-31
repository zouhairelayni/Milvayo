'use strict';
// UI-independent viewport mathematics. Pure, bounded and tested.
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const zoomWidth=(width,multiplier)=>clamp(Math.round(width*multiplier*10)/10,6,96);
const touchDistance=touches=>touches?.length<2?0:Math.hypot(touches[0].pageX-touches[1].pageX,touches[0].pageY-touches[1].pageY);
const anchorScroll=(scrollX,centerX,oldWidth,newWidth)=>Math.max(0,(scrollX+centerX)*(newWidth/oldWidth)-centerX);
const dragDelta=(dx,dy,currentX,currentY,startX,startY,contactX=0,contactY=0)=>({x:dx+currentX-startX+contactX,y:dy+currentY-startY+contactY});
const fitWidth=(availableWidth,spanDays)=>clamp(Math.floor(availableWidth/Math.max(1,spanDays)),6,96);
// Returns pixels per 40ms frame, bounded to avoid jumping past drop targets.
const edgeVelocity=(position,start,length,threshold=48)=>{
 if(!Number.isFinite(position)||!Number.isFinite(start)||length<=0)return 0;
 const local=position-start;
 if(local<threshold)return -clamp(Math.ceil((threshold-local)/7),1,12);
 if(local>length-threshold)return clamp(Math.ceil((local-(length-threshold))/7),1,12);
 return 0;
};
module.exports={clamp,zoomWidth,touchDistance,anchorScroll,dragDelta,fitWidth,edgeVelocity};
