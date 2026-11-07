// /src/store/latestWriter.cjs
'use strict';
// One write in flight; immediate latest and deferred Canvas snapshots stay bounded.
// A failed latest value remains retryable; flush reports false rather than hiding failure.
function createLatestWriter(write,{onError=()=>{},onSuccess=()=>{}}={}){
 let latest=null,running=null,serial=0,delay=null,deferred=null;
 const cancelDelay=()=>{if(delay!==null)clearTimeout(delay);delay=null;};
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
 const enqueue=value=>{cancelDelay();deferred=null;latest={value,serial:++serial};return start();};
 return {enqueue,defer(value,ms=160){cancelDelay();deferred={value};delay=setTimeout(()=>{const item=deferred;deferred=null;delay=null;if(item)void enqueue(item.value);},ms);},flush(){if(deferred){const item=deferred;return enqueue(item.value);}return running|| (latest?start():Promise.resolve(true));}};
}
module.exports={createLatestWriter};
