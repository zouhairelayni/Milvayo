// /src/domain/licensing.cjs
'use strict';
function allocate(current,uid,scope,enabled){
 if(!current||!Number.isInteger(current.capacity)||current.capacity<0)throw Error('Invalid license pool');
 const seats=new Set(current.seats||[]),allocations={...(current.allocations||{})},cap=current.allocationCaps?.[scope],members=new Set(allocations[scope]||[]);
 if(enabled){if(!seats.has(uid)&&seats.size>=current.capacity)throw Error('Seat capacity exhausted');if(!members.has(uid)&&Number.isInteger(cap)&&members.size>=cap)throw Error('Resource allocation cap exhausted');seats.add(uid);members.add(uid);}else members.delete(uid);
 allocations[scope]=[...members].sort();return {...current,seats:[...seats].sort(),allocations};
}
function setCap(current,scope,capacity){if(!Number.isInteger(capacity)||capacity<0||capacity>100000)throw Error('Invalid allocation cap');if((current.allocations?.[scope]||[]).length>capacity)throw Error('Allocated seats exceed the new cap');return {...current,allocationCaps:{...(current.allocationCaps||{}),[scope]:capacity}};}
module.exports={allocate,setCap};
