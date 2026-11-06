// /src/app/navigation/browserBack.cjs
'use strict';
// Keep browser history aligned with the existing screen controller, including modal dismissal.
function createBrowserBack(win,{history,events,restore}){
 const key='milvayoNavigation',session=Date.now().toString(36)+Math.random().toString(36).slice(2);
 let serial=0,position=0,suppressed=0,alive=true,usable=true;
 const data=()=>win.history.state?.[key];
 const write=(method,route,layer=null,step=++serial)=>{
  if(!alive||!usable)return;
  position=step;
  try{win.history[method]({...win.history.state,[key]:{session,step,route:route.id,layer}},'',win.location.href);}
  catch{usable=false;}
 };
 write('replaceState',history.home,null,0);
 if(history.current.id!==history.home.id)write('pushState',history.current);
 const onLayer=(type,layer)=>{
  if(!alive||!usable)return;
  if(type==='add')write('pushState',history.current,layer.id);
  else if(data()?.session===session&&data()?.layer===layer.id&&history.has(data()?.route)){suppressed++;win.history.back();}
 };
 const unsubscribe=events.subscribe(onLayer);
 events.layers().forEach(layer=>onLayer('add',layer));
 const pop=e=>{
  if(!alive||!usable)return;
  const previous=position,target=e.state?.[key];
  if(target?.session===session)position=target.step;
  if(suppressed){suppressed--;return;}
  const layer=events.top();
  if(layer){
   // Re-arm first: a blocked/busy sheet must consume Back without exposing its page.
   write('pushState',history.current,layer.id);events.dispatch();return;
  }
  if(target?.session!==session)return;
  if(target.route===history.current.id){
   if(target.step!==previous)win.history.go(target.step<previous?-1:1);
   return;
  }
  if(!restore(target.route)){win.history.go(target.step<previous?-1:1);return;}
  if(history.current.id!==target.route)write('replaceState',history.current,null,target.step);
 };
 win.addEventListener('popstate',pop);
 return {
  get usable(){return usable;},
  visit:route=>write('pushState',route),
  back:()=>win.history.back(),
  reset(){write('replaceState',history.home);if(history.current.id!==history.home.id)write('pushState',history.current);events.layers().forEach(layer=>onLayer('add',layer));},
  stop(){alive=false;unsubscribe();win.removeEventListener('popstate',pop);},
 };
}
module.exports={createBrowserBack};
