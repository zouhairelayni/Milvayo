// /src/app/navigation/backEvents.cjs
'use strict';
function createBackEvents(){
 let root=null,serial=0;const layers=new Map(),listeners=new Set();
 const emit=(type,layer)=>listeners.forEach(fn=>fn(type,layer));
 const top=()=>[...layers.values()].sort((a,b)=>b.priority-a.priority||b.id-a.id)[0];
 return {
  top,
  layers:()=>[...layers.values()].sort((a,b)=>a.priority-b.priority||a.id-b.id),
  dispatch(){const layer=top();if(layer){layer.back();return true;}return !!root?.();},
  setRoot(back){root=back;return()=>{if(root===back)root=null;};},
  add(back,priority=20){
   const layer={id:++serial,back,priority};layers.set(layer.id,layer);emit('add',layer);
   return()=>{if(layers.delete(layer.id))emit('remove',layer);};
  },
  subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
 };
}
const backEvents=createBackEvents();
module.exports={createBackEvents,backEvents};
