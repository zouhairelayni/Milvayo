// /src/app/navigation/screenHistory.cjs
'use strict';
function createScreenHistory(scope,screen='overview',limit=64){
 let serial=0,items=[],index=0,currentScope;
 const reset=(nextScope,nextScreen='overview')=>{
  currentScope=nextScope;items=[{id:++serial,screen:'overview'}];index=0;
  if(nextScreen!=='overview'){items.push({id:++serial,screen:nextScreen});index=1;}
 };
 reset(scope,screen);
 const previous=allowed=>{for(let i=index-1;i>=0;i--)if(allowed(items[i].screen))return i;return -1;};
 return {
  get scope(){return currentScope;},get current(){return items[index];},get home(){return items[0];},
  reset,
  has:id=>items.some(item=>item.id===id),
  push(screen){
   if(items[index].screen===screen)return items[index];
   items=items.slice(0,index+1);items.push({id:++serial,screen});
   if(items.length>limit)items.splice(1,items.length-limit);
   index=items.length-1;return items[index];
  },
  canBack(allowed=()=>true){return previous(allowed)>=0;},
  back(allowed=()=>true){const i=previous(allowed);if(i<0)return null;index=i;return items[index];},
  restore(id,allowed=()=>true){
   const found=items.findIndex(item=>item.id===id);if(found<0)return null;
   for(let i=found;i>=0;i--)if(allowed(items[i].screen)){index=i;return items[index];}
   return null;
  },
 };
}
module.exports={createScreenHistory};
