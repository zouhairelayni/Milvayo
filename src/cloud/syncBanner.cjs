// /src/cloud/syncBanner.cjs
'use strict';
// Plain words for the sync counter and the "needs review" banner (0.8.31, audit finding F6).
// Before: one number "pending" counted edits that were still going out AND edits stuck in a conflict, so it never reached 0.
// Now: "waiting" (will be sent by itself) and "need review" (a person must decide) are shown separately.
const plural=(n,one,many)=>n+' '+(n===1?one:many);
// Short, plain reason for the first conflict. The raw server text is kept for the detail screen.
function reasonOf(error){
 const e=String(error||'');
 if(/deleted/i.test(e))return 'someone deleted this record';
 if(/same field|compare|conflict/i.test(e))return 'someone else changed the same thing';
 if(/permission|revoked|access/i.test(e))return 'your access to it changed';
 if(/not supported|unsupported|cannot be applied|not available in v4/i.test(e))return 'the cloud cannot take this kind of change yet';
 return e?e.replace(/\s+/g,' ').trim().slice(0,100):'the cloud refused it';
}
// `state` is session.getState(). Returns the counter line and, when something needs review, the banner text.
function describe(state){
 const s=state||{},conflicts=Math.max(0,s.conflicts|0),local=Math.max(0,s.local|0),waiting=Math.max(0,(s.waiting!==undefined?s.waiting:(s.pending|0)-conflicts-local)|0);
 const parts=[waiting+' waiting',conflicts+' need review'];if(local>0)parts.push(local+' not shared yet');
 const line=parts.join(' · ');
 if(!s.connected)return {waiting,conflicts,local,line,banner:null,notice:null,idle:waiting===0&&conflicts===0&&local===0};
 const banner=conflicts>0?{text:plural(conflicts,'change needs','changes need')+' your review: '+reasonOf(s.reviewError)+'.',action:'Review'}:null;
 // Kept on this device because the cloud cannot take this kind of change yet (D1): shown, never blocking, nothing to decide.
 const notice=local>0?plural(local,'change stays','changes stay')+' on this device only: the cloud cannot take this kind of change yet.':null;
 return {waiting,conflicts,local,line,banner,notice,idle:waiting===0&&conflicts===0&&local===0};
}
// 0.8.38 (FIX-08): reloading the web page or restarting the app signs you out of the cloud on purpose. Real Google / Apple / email sign-in (at deploy time) will keep the session by itself.
const SIGN_IN_AGAIN='Reloading the page or restarting the app signs you out of the cloud. Nothing is lost: your changes stay on this device and are sent as soon as you sign in again.';
module.exports={describe,reasonOf,SIGN_IN_AGAIN};
