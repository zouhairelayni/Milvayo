// /src/cloud/presenceCore.cjs
'use strict';
// Pure presence logic shared by the client and its tests: per-resource room keys, an incrementally updated room, and the heartbeat policy.
const {sha256}=require('js-sha256');
// A heartbeat only has to outlive a crash that the database's own disconnect hook missed, so it is slow; leaving, hiding or closing a screen removes the entry at once.
const HEARTBEAT_MS=120000,TTL_MS=300000,SWEEP_MS=30000,MAX_TTL_MS=330000;
const ALPHABET='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
// Database keys cannot hold . $ # [ ] / and must be short, so a resource is addressed by 22 URL-safe characters derived from a SHA-256 of its ID.
function resourceKey(resource){
 const bytes=sha256.array(String(resource??'')).slice(0,16);let out='',bits=0,acc=0;
 for(const b of bytes){acc=(acc<<8)|b;bits+=8;while(bits>=6){bits-=6;out+=ALPHABET[(acc>>bits)&63];}}
 if(bits>0)out+=ALPHABET[(acc<<(6-bits))&63];
 return out;
}
const payload=(state,resource,now,offset=0)=>({state,resource,expiresAt:now+offset+TTL_MS});
// One room = the people on ONE resource. `apply` takes a child event for a user's node ({sessionId:{state,resource,expiresAt}}); nothing else is ever downloaded.
function createRoom({uid,resource}){
 const users=new Map();
 return {
  apply(type,user,value){if(type==='removed'||value==null)users.delete(user);else users.set(user,value);},
  peers(now){const out=[];for(const [user,sessions] of users){if(user===uid)continue;for(const v of Object.values(sessions||{}))if(v&&v.expiresAt>now&&v.resource===resource)out.push({uid:user,state:v.state});}return out;},
  get size(){return users.size;},
 };
}
// Heartbeat policy: write when the state changed, on (re)connect, when the screen becomes visible again, and otherwise only when the entry is half way to expiry.
const heartbeatDue=(lastWriteAt,now)=>now-lastWriteAt>=HEARTBEAT_MS;
module.exports={HEARTBEAT_MS,TTL_MS,SWEEP_MS,MAX_TTL_MS,resourceKey,payload,createRoom,heartbeatDue};
