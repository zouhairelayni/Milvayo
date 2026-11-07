// /src/canvas/history.cjs
'use strict';
const {utf8Bytes}=require('../store/importFiles.cjs');
const costs=new WeakMap(),MAX_HISTORY_BYTES=4*1024*1024;
function cost(value){if(!costs.has(value))costs.set(value,utf8Bytes(JSON.stringify(value)));return costs.get(value);}
function pushHistory(stack,entry){const out=[...stack,entry].slice(-30);let bytes=out.reduce((sum,value)=>sum+cost(value),0);while(out.length>1&&bytes>MAX_HISTORY_BYTES)bytes-=cost(out.shift());return out;}
module.exports={pushHistory,MAX_HISTORY_BYTES};
