// /src/cloud/lease.cjs
'use strict';
const model=require('../domain/model.cjs'),workspaces=require('../store/workspaces.cjs');
const leaseKey=id=>'milvayo-cloud-open-v1:'+encodeURIComponent(id);
async function recoverCloudLease(storage,id){const raw=await storage.getItem(leaseKey(id));if(!raw)return false;const lease=JSON.parse(raw);if(lease.schema!==1||lease.localId!==id)throw Error('Invalid cloud workspace recovery lease');const original=model.normalizeWorkspace(lease.original);await storage.setItem(workspaces.keyFor(id),JSON.stringify(original));await storage.removeItem(leaseKey(id));return true;}
module.exports={leaseKey,recoverCloudLease};
