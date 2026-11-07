// /src/cloud/iam.cjs
'use strict';
const ROLES=Object.freeze({viewer:['read'],commenter:['read','comment'],contributor:['read','create','edit','comment'],manager:['read','create','edit','comment','manage','approve','export','delete','restore']});
function can(member,grant,projectId,action){
 if(!member||member.active!==true||!grant)return false;
 const role=grant.projects?.[projectId]||grant.workspaceRole;
 return !!ROLES[role]?.includes(action);
}
const administer=m=>!!m&&m.active===true&&['owner','admin'].includes(m.role);
function validGrant(grant){
 if(!grant||!['none',...Object.keys(ROLES)].includes(grant.workspaceRole)||!grant.projects||Array.isArray(grant.projects)||Object.keys(grant.projects).length>30||Object.values(grant.projects).some(r=>!['none',...Object.keys(ROLES)].includes(r)))throw Error('Invalid scoped role grant');
 if(Object.keys(grant.projects).some(id=>!id||id.length>160||/[.#$\[\]/\x00-\x1f]/.test(id)))throw Error('Invalid project grant ID');
 return {workspaceRole:grant.workspaceRole,projects:{...grant.projects}};
}
function license(subscription,seats,uid,allocate){
 if(!subscription||!Number.isInteger(subscription.capacity)||subscription.capacity<0)throw Error('Invalid subscription');
 const next=new Set(seats);if(allocate){if(!next.has(uid)&&next.size>=subscription.capacity)throw Error('Seat capacity exhausted');next.add(uid);}else next.delete(uid);
 return [...next].sort();
}
module.exports={ROLES,can,administer,validGrant,license};
