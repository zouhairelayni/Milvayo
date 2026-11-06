// /src/timeline/nativeZoomHandoff.cjs
'use strict';
const {MAX_CANVAS_WIDTH,BASE_DAYS}=require('./timelineDisplay.cjs');

function validZoomCommit(width,scroll,span,viewportWidth){
 if(![width,scroll,span,viewportWidth].every(Number.isFinite)||width<=0||span<=0||viewportWidth<=0)return null;
 const cap=Math.min(136,MAX_CANVAS_WIDTH/Math.max(BASE_DAYS,span));
 const floor=Math.min(cap,Math.max(3,viewportWidth/span));
 const next=Math.max(floor,Math.min(width,cap));
 return {width:next,scroll:Math.max(0,Math.min(scroll,Math.max(0,next*span-viewportWidth)))};
}

// Let Android finish the native recognizer/touch dispatch before replacing chart geometry.
function createNativeZoomHandoff(schedule,cancel,apply){
 let active=null,frame=null;
 const clearFrame=()=>{if(frame!==null)cancel(frame);frame=null;};
 return {
  begin(ticket){clearFrame();active=ticket;},
  finish(ticket,result){
   if(active!==ticket)return;
   clearFrame();
   frame=schedule(()=>{frame=schedule(()=>{frame=null;if(active!==ticket)return;active=null;apply(result);});});
  },
  cancel(){clearFrame();active=null;},
 };
}
module.exports={validZoomCommit,createNativeZoomHandoff};
