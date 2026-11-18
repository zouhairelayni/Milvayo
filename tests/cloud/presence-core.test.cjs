// /tests/cloud/presence-core.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const P=require('../../src/cloud/presenceCore.cjs');
test('resource keys are 22 URL-safe characters, stable, and distinct for distinct resources (including IDs with forbidden database characters)',()=>{
 const ids=[...new Set(['task-1','task-2','canvas/odd.id#x','a[b]$c','',' ','x'.repeat(160),...Array.from({length:2000},(_,i)=>'task-'+i)])],keys=ids.map(P.resourceKey);
 for(const k of keys)assert.match(k,/^[A-Za-z0-9_-]{22}$/);assert.equal(new Set(keys).size,ids.length,'no collisions in the sample');assert.equal(P.resourceKey('task-1'),P.resourceKey('task-1'));
});
test('a room updated by child events equals the room derived from a full snapshot, and only shows live peers on the same resource',()=>{
 const now=1000000,live=n=>({s1:{state:'editing',resource:'task-1',expiresAt:now+n}});
 const room=P.createRoom({uid:'me',resource:'task-1'});
 room.apply('added','me',live(1000));room.apply('added','ann',live(60000));room.apply('added','bob',{s1:{state:'viewing',resource:'task-1',expiresAt:now+500},s2:{state:'typing',resource:'task-1',expiresAt:now+90000}});
 assert.deepEqual(room.peers(now).map(p=>p.uid).sort(),['ann','bob','bob'],'my own sessions are excluded; both sessions of bob count');
 room.apply('changed','ann',{s1:{state:'typing',resource:'task-1',expiresAt:now+60000}});assert.equal(room.peers(now).find(p=>p.uid==='ann').state,'typing');
 room.apply('removed','bob');assert.deepEqual(room.peers(now).map(p=>p.uid),['ann']);
 assert.deepEqual(room.peers(now+120000),[],'expired entries disappear without any network traffic');
 room.apply('added','eve',{s1:{state:'editing',resource:'task-2',expiresAt:now+60000}});assert.equal(room.peers(now).some(p=>p.uid==='eve'),false,'another resource never shows');
 assert.equal(room.size,3);
});
test('the heartbeat is slow and the entry lives long enough to miss one beat',()=>{
 assert.ok(P.HEARTBEAT_MS>=120000);assert.ok(P.TTL_MS>=2*P.HEARTBEAT_MS);assert.ok(P.MAX_TTL_MS>P.TTL_MS,'the database rule must allow the entry lifetime');
 assert.equal(P.heartbeatDue(0,P.HEARTBEAT_MS-1),false);assert.equal(P.heartbeatDue(0,P.HEARTBEAT_MS),true);
 const p=P.payload('editing','task-1',1000,50);assert.deepEqual(p,{state:'editing',resource:'task-1',expiresAt:1050+P.TTL_MS});
});
test('modeled traffic: per-resource rooms with child events and a slow heartbeat versus one whole-project room (events and bytes, assumptions stated)',()=>{
 // Assumptions: every person publishes one heartbeat per cycle; a whole-room listener receives the entire room each time (the 731-byte-per-event figure measured by the owner for 5 people grows with room size);
 // a child listener receives one user's node (about 150 bytes). `resourceShare` is the fraction of a project's viewers who are on the same resource.
 const HOUR=3600000,sessionBytes=146,cost=(people,onSameResource,heartbeatMs,whole)=>{const deliveries=people*(whole?people:onSameResource),beats=HOUR/heartbeatMs,bytesPer=whole?people*sessionBytes:sessionBytes;return {events:deliveries*beats,bytes:deliveries*beats*bytesPer};};
 for(const [people,same] of [[5,5],[10,3],[30,4]]){
  const before=cost(people,same,25000,true),after=cost(people,same,P.HEARTBEAT_MS,false);
  assert.ok(after.events<before.events&&after.bytes<before.bytes/10,`${people} people: ${Math.round(before.bytes/1e3)} KB/h -> ${Math.round(after.bytes/1e3)} KB/h`);
 }
});
