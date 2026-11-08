// /src/cloud/localWriterCore.cjs
'use strict';
async function acquireLocalWriter(locks,localId){
 if(!locks?.request)throw Object.assign(Error('This browser cannot coordinate workspace writes safely. Open Milvayo in a browser with Web Locks support.'),{code:'workspace-coordination-unavailable'});
 let release,accepted;
 const ready=new Promise((resolve,reject)=>{accepted={resolve,reject};}),held=new Promise(resolve=>{release=resolve;});
 const lifetime=locks.request('milvayo-local-workspace-v1:'+encodeURIComponent(localId),{mode:'exclusive',ifAvailable:true},async lock=>{
  if(!lock){accepted.reject(Object.assign(Error('This workspace is already open in another tab. Close that tab before editing here.'),{code:'workspace-in-use'}));return;}
  accepted.resolve();await held;
 });
 lifetime.catch(accepted.reject);await ready;let released=false;return async()=>{if(released)return;released=true;release();await lifetime;};
}
module.exports={acquireLocalWriter};
