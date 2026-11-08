// /src/cloud/polling.cjs
'use strict';
// Delay policy only: callers own lifecycle, authorization, requests and cancellation.
function createPollingPolicy({activeMs=5000,idleMs=60000,hiddenMs=120000}={}){
 if(![activeMs,idleMs,hiddenMs].every(n=>Number.isFinite(n)&&n>0)||idleMs<activeMs||hiddenMs<idleMs)throw Error('Invalid polling intervals');
 let delay=activeMs;
 return {observe({changed=false,pending=false,failed=false}={}){delay=changed||pending?activeMs:Math.min(idleMs,delay*2);if(failed)delay=Math.max(delay,Math.min(idleMs,activeMs*2));return delay;},reset(){delay=activeMs;return delay;},next({visible=true}={}){return visible?delay:hiddenMs;}};
}
function simulatePolling({durationMs=1200000,activeMs=5000,idleMs=60000,hiddenMs=120000,visible=true,changeAt=[]}={}){
 const policy=createPollingPolicy({activeMs,idleMs,hiddenMs}),requests=[];let at=0,change=0;
 while(at<durationMs){requests.push(at);const changed=change<changeAt.length&&changeAt[change]<=at;while(change<changeAt.length&&changeAt[change]<=at)change++;policy.observe({changed});at+=policy.next({visible});}
 return {requests:requests.length,times:requests,worstVisibilityLatencyMs:visible?idleMs:hiddenMs};
}
module.exports={createPollingPolicy,simulatePolling};
