// /tests/cloud/change-feed-client.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {database,generate}=require('../helpers/cloud-fake.cjs'),{createChangeFeed}=require('../../src/cloud/changeFeed.cjs');
// The v4 change-feed reader (src/cloud/changeFeed.cjs) against the real server code on the in-memory database.
const T0=Date.parse('2026-11-19T12:00:00.000Z');
const world=({tasks=20,projects=3,protocol=4}={})=>{const x=database(generate({tasks,objects:3,projects}),{protocol});x.projects=[...new Set([...x.rows.values()].filter(r=>r.kind==='projects').map(r=>r.projectId))].sort();return x;};
const feed=(x,who='alice')=>{const log=[];const request=async body=>{log.push(body);return x.service.execute(who,JSON.parse(JSON.stringify({...x.scope,...body})));};return {log,reader:createChangeFeed({request}),actions:()=>log.map(b=>b.action+(b.projectId?':'+b.projectId:''))};};
const live=(x,p)=>[...x.rows.entries()].filter(([k,v])=>k.startsWith(x.root+'/records/')&&v.projectId===p&&!v.deleted).map(([,v])=>v);
const task=(x,p,i=0)=>live(x,p).filter(r=>r.kind==='tasks').sort((a,b)=>a.id<b.id?-1:1)[i];
const edit=(x,t,set)=>x.service.execute('alice',{...x.scope,action:'patch',projectId:t.projectId,taskId:t.id,opId:'op-'+Math.random().toString(36).slice(2),baseRevision:t.revision,set});

test('first sync reads the directory and every project once; records carry sequence = revision and no server bookkeeping',async t=>{
 t.mock.timers.enable({apis:['Date'],now:T0});const x=world(),f=feed(x);
 const out=await f.reader.sync(null);
 assert.equal(out.protocol,4);assert.equal(out.reset,false);assert.deepEqual(out.feed.projects,x.projects);
 const keys=out.records.map(r=>r.key),expected=[...x.rows.entries()].filter(([k,v])=>k.startsWith(x.root+'/records/')&&!v.deleted&&(v.projectId||x.projects.includes(v.projectId))).map(([,v])=>v.key);
 assert.deepEqual([...new Set(keys)].sort(),[...new Set(expected)].sort());assert.equal(keys.length,new Set(keys).size);
 for(const r of out.records){assert.equal(r.sequence,r.revision);for(const k of ['lastOpId','lastOpHash','schema'])assert.equal(k in r,false);}
 assert.equal(f.actions()[0],'directoryV4');assert.equal(f.log.filter(b=>b.action==='pullV4').length,x.projects.length);
 assert.ok(out.grant&&out.membershipRole);assert.deepEqual(Object.keys(out.feed.cursors).sort(),x.projects);
});
test('a project signal pulls only that project, with no directory call; an idle round with nothing marked is not asked for here',async t=>{
 t.mock.timers.enable({apis:['Date'],now:T0});const x=world(),f=feed(x),first=await f.reader.sync(null);
 t.mock.timers.tick(60000);const [p0,p1]=x.projects,edited=task(x,p1);await edit(x,edited,{title:'Changed by signal'});f.log.length=0;
 const out=await f.reader.sync(first.feed,{only:new Set([p1]),directory:false});
 assert.deepEqual(f.actions(),['pullV4:'+p1]);assert.deepEqual(out.records.map(r=>r.key),[edited.key]);assert.equal(out.records[0].data.title,'Changed by signal');assert.equal(out.records[0].sequence,2);
 assert.deepEqual(out.pulled,[p1]);assert.equal(out.feed.cursors[p0],first.feed.cursors[p0],'untouched projects keep their cursor');assert.ok(out.feed.cursors[p1]>first.feed.cursors[p1]);
 assert.equal(out.grant,undefined,'no directory, so no grant in this answer');
});
test('a directory round reads every project again and sends shared records on only when they changed',async t=>{
 t.mock.timers.enable({apis:['Date'],now:T0});const x=world(),f=feed(x),first=await f.reader.sync(null);
 const shared=[...x.rows.entries()].filter(([k,v])=>k.startsWith(x.root+'/records/')&&v.projectId==='');const sharedCount=first.records.filter(r=>r.projectId==='').length;assert.equal(sharedCount,shared.length);
 t.mock.timers.tick(5000);f.log.length=0;const again=await f.reader.sync(first.feed);
 assert.equal(f.actions().filter(a=>a==='directoryV4').length,1);assert.equal(f.actions().filter(a=>a.startsWith('pullV4')).length,x.projects.length);
 assert.equal(again.records.filter(r=>r.projectId==='').length,0,'unchanged shared records are not repeated');
 if(shared.length){const [key,row]=shared[0];x.rows.set(key,{...row,revision:row.revision+1,data:{...row.data,name:'Renamed'}});const changed=await f.reader.sync(again.feed);assert.deepEqual(changed.records.filter(r=>r.projectId==='').map(r=>r.key),[row.key]);}
});
test('an access change resets: the whole workspace is read again and the answer says reset',async t=>{
 t.mock.timers.enable({apis:['Date'],now:T0});const x=world(),f=feed(x,'bob');x.grant('bob',{workspaceRole:'viewer',projects:{}});
 const first=await f.reader.sync(null);t.mock.timers.tick(1000);
 x.rows.set(x.root+'/grants/bob',{workspaceRole:'viewer',projects:{[x.projects[0]]:'none'},version:2});f.log.length=0;
 const out=await f.reader.sync(first.feed,{only:new Set([x.projects[1]]),directory:false});
 assert.equal(out.reset,true);assert.ok(!out.feed.projects.includes(x.projects[0]),'the denied project is gone from the directory');
 assert.ok(!out.records.some(r=>r.projectId===x.projects[0]),'and none of its records come back');assert.notEqual(out.accessVersion,first.accessVersion);
 assert.ok(f.actions().some(a=>a==='directoryV4'),'a reset needs a fresh directory');
});
test('a project that leaves the directory is reported as dropped and loses its cursor',async t=>{
 t.mock.timers.enable({apis:['Date'],now:T0});const x=world(),f=feed(x),first=await f.reader.sync(null),gone=x.projects[2];
 for(const [k,v] of x.rows)if(k.startsWith(x.root+'/records/')&&v.kind==='projects'&&v.projectId===gone)x.rows.set(k,{...v,deleted:true,deletedAt:T0});
 t.mock.timers.tick(1000);const out=await f.reader.sync(first.feed);
 assert.deepEqual(out.dropped,[gone]);assert.equal(gone in out.feed.cursors,false);assert.deepEqual(out.feed.projects,x.projects.filter(p=>p!==gone));
});
test('a failed round changes nothing: the old state is untouched and the next round starts from it',async t=>{
 t.mock.timers.enable({apis:['Date'],now:T0});const x=world(),f=feed(x),first=await f.reader.sync(null),snapshot=JSON.stringify(first.feed);
 t.mock.timers.tick(60000);await edit(x,task(x,x.projects[0]),{title:'Edited'});
 const broken=createChangeFeed({request:async body=>{if(body.action==='pullV4'&&body.projectId===x.projects[1])throw Object.assign(Error('network'),{code:'unavailable'});return x.service.execute('alice',JSON.parse(JSON.stringify({...x.scope,...body})));}});
 await assert.rejects(broken.sync(first.feed),/network/);assert.equal(JSON.stringify(first.feed),snapshot);
 const ok=await f.reader.sync(first.feed);assert.ok(ok.records.some(r=>r.data?.title==='Edited'));
});
test('a workspace that does not use v4 is reported, and two resets in a row stop with an error instead of looping',async t=>{
 t.mock.timers.enable({apis:['Date'],now:T0});const old=world({protocol:null});
 await assert.rejects(feed(old).reader.sync(null),e=>e.code==='failed-precondition'&&/v4 change feed/.test(e.message));
 let n=0;const stubborn=createChangeFeed({request:async body=>body.action==='directoryV4'?{ok:true,protocol:4,accessVersion:'a'+(n++),projects:[{projectId:'p'}],shared:[]}:{ok:true,reset:'access',records:[],more:false}});
 await assert.rejects(stubborn.sync({accessVersion:'zzz',cursors:{},projects:['p'],shared:{}}),/reset twice/);
});
test('paging: a project larger than one page is read completely in order',async t=>{
 t.mock.timers.enable({apis:['Date'],now:T0});const x=world({tasks:30,projects:1}),pages=[],request=async body=>{if(body.action==='pullV4')pages.push(body);return x.service.execute('alice',JSON.parse(JSON.stringify({...x.scope,...body,...(body.limit?{limit:Math.min(body.limit,5)}:{})})));};
 const out=await createChangeFeed({request}).sync(null),p=x.projects[0];
 assert.ok(pages.length>3,'several pages were needed');assert.equal(out.records.filter(r=>r.projectId===p).length,live(x,p).length);
 assert.ok(pages.slice(1).every(b=>b.page&&b.roundStartedAt),'later pages carry the page token and the round start');
});
test('an access change is also noticed by the directory alone, before any project is read',async t=>{
 t.mock.timers.enable({apis:['Date'],now:T0});const x=world(),f=feed(x,'bob');x.grant('bob',{workspaceRole:'viewer',projects:{}});
 const first=await f.reader.sync(null);x.rows.set(x.root+'/grants/bob',{workspaceRole:'viewer',projects:{[x.projects[0]]:'none'},version:2});
 const out=await f.reader.sync(first.feed);assert.equal(out.reset,true);assert.ok(!out.records.some(r=>r.projectId===x.projects[0]));
});
