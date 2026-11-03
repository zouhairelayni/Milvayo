// /src/store/latestWriter.cjs
'use strict';
// One write in flight, one newest immutable snapshot waiting. No unbounded JSON queue.
// A failed latest value remains retryable; flush reports false rather than hiding failure.
function createLatestWriter(write,{onError=()=>{},onSuccess=()=>{}}={}){
 let latest=null,running=null,serial=0;
 function start(){
  if(running)return running;
  let failed=false;
  running=Promise.resolve().then(async()=>{
   while(latest){
    const item=latest;latest=null;
    try{await write(item.value);onSuccess();}
    catch(error){
     onError(error);
     if(!latest){latest=item;failed=true;return false;}
    }
   }
   return true;
  }).finally(()=>{running=null;if(latest&&!failed)return start();});
  return running;
 }
 return {enqueue(value){latest={value,serial:++serial};return start();},flush(){return running|| (latest?start():Promise.resolve(true));}};
}
module.exports={createLatestWriter};
