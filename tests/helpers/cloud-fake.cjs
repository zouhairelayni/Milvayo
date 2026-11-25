// /tests/helpers/cloud-fake.cjs
'use strict';
// In-memory transactional Firestore/RTDB fake for service-level tests. Counts nothing itself: the service's own `measured` fields are the instrumentation.
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const S=require('../../src/cloud/schema.cjs'),m=require('../../src/domain/model.cjs'),{generate}=require('../../src/cloud/tools/fixtures.cjs'),{createService}=require('../../src/cloud/server/service.cjs');
function fakeRtdb(){const nodes=new Map();let failures=0;return {nodes,failNext(n=1){failures=n;},ref:path=>({set:async value=>{if(failures>0){failures--;throw Error('RTDB unavailable');}nodes.set(path,structuredClone(value));},transaction:async fn=>{if(failures>0){failures--;throw Error('RTDB unavailable');}const next=fn(nodes.get(path)??null);if(next!==undefined)nodes.set(path,structuredClone(next));return {committed:next!==undefined};}})};}
function database(workspace,{protocol=4,extra={},users=['alice','bob','carol']}={}){
 const root='orgs/org/workspaces/main',rows=new Map(),writes=[],rtdb=fakeRtdb(),stats={reads:0,writes:0,deletes:0};
 for(const r of S.pack(workspace))rows.set(root+'/records/'+r.key,{...r,revision:1,sequence:1,deleted:false});
 rows.set('orgs/org/members/alice',{active:true,role:'owner'});rows.set(root+'/grants/alice',{workspaceRole:'manager',projects:{},version:1});
 rows.set(root,{state:'active',sequence:1,...(protocol?{protocol}:{}),...extra});rows.set('orgs/org/subscription/current',{capacity:5,seats:['alice',...users.filter(u=>u!=='alice')],allocations:{}});
 const snap=ref=>({ref,id:ref.path.split('/').at(-1),exists:rows.has(ref.path),data:()=>rows.has(ref.path)?structuredClone(rows.get(ref.path)):undefined});
 const cmp={'==':(a,b)=>S.equal(a,b),'>':(a,b)=>a>b,'>=':(a,b)=>a>=b,'array-contains':(a,b)=>(a||[]).includes(b),'in':(a,b)=>b.includes(a)};
 const get=(o,k)=>k.split('.').reduce((x,p)=>x?.[p],o);
 // Query objects keep their filters, ordering, cursor and limit; `run` applies them like Firestore (documents missing an ordered field are excluded).
 const cmpVal=(a,b)=>a<b?-1:a>b?1:0,field=(o,k)=>k==='__name__'?o.__id:get(o,k);
 const collection=(path,filters=[],opts={orders:[],after:null,max:null})=>{
  const self={path,filters,query:true,opts,doc:(id=crypto.randomUUID())=>doc(path+'/'+id),
   where:(...f)=>collection(path,[...filters,f],opts),limit:n=>collection(path,filters,{...opts,max:n}),orderBy:(f,dir='asc')=>collection(path,filters,{...opts,orders:[...opts.orders,[f,dir]]}),startAfter:(...v)=>collection(path,filters,{...opts,after:v}),select:()=>self};
  const run=()=>{let docs=[...rows.keys()].filter(k=>k.startsWith(path+'/')&&!k.slice(path.length+1).includes('/')).map(k=>snap(doc(k)));
   docs=docs.filter(sn=>filters.every(([k,op,v])=>cmp[op](get(sn.data(),k),v)));
   if(opts.orders.length){docs=docs.filter(sn=>opts.orders.every(([f])=>f==='__name__'||get(sn.data(),f)!==undefined));
    docs.sort((x,y)=>{for(const [f,dir] of opts.orders){const a=field({...x.data(),__id:x.id},f),b=field({...y.data(),__id:y.id},f),c=cmpVal(a,b);if(c)return dir==='desc'?-c:c;}return 0;});
    if(opts.after)docs=docs.filter(sn=>{for(let i=0;i<opts.orders.length;i++){const [f,dir]=opts.orders[i],c=cmpVal(field({...sn.data(),__id:sn.id},f),opts.after[i]);if(c)return dir==='desc'?c<0:c>0;}return false;});}
   return opts.max!=null?docs.slice(0,opts.max):docs;};
  self.get=async()=>{const docs=run();stats.reads+=Math.max(1,docs.length);return {docs,size:docs.length};};self.run=run;
  self.count=()=>({get:async()=>{if(collection.noAggregation)throw Error('UNIMPLEMENTED: aggregation queries are not supported');const n=run().length;stats.reads+=Math.max(1,Math.ceil(n/1000));return {data:()=>({count:n})};}});
  return self;};
 const doc=path=>({path,id:path.split('/').at(-1),get:async()=>snap(doc(path)),collection:name=>collection(path+'/'+name)});
 // 0.8.44: transactions run one after the other, like Firestore's serializable transactions (it retries a contended one); without this two simultaneous patches lost one update in the fake.
 let txChain=Promise.resolve();
 const db={doc,collection:name=>collection(name),runTransaction:fn=>{const run=txChain.then(()=>runOne(fn));txChain=run.then(()=>{},()=>{});return run;}};
 const runOne=async fn=>{const pending=[];const tx={get:async ref=>{if(!ref.query){stats.reads++;return snap(ref);}const docs=ref.run();stats.reads+=Math.max(1,docs.length);return {docs,size:docs.length,empty:!docs.length};},set:(r,d)=>pending.push(['set',r,d]),update:(r,d)=>pending.push(['update',r,d]),create:(r,d)=>{assert.ok(!rows.has(r.path)||pending.some(p=>p[1].path===r.path),'create on existing '+r.path);pending.push(['create',r,d]);},delete:r=>pending.push(['delete',r])};const result=await fn(tx);for(const [op,r,d] of pending){if(op==='delete'){stats.deletes++;rows.delete(r.path);}else{stats.writes++;}if(op==='delete'){}else rows.set(r.path,structuredClone(op==='update'?{...rows.get(r.path),...d}:d));writes.push(r.path);}return result;};
 const service=createService(db,rtdb),scope={orgId:'org',workspaceId:'main'};let n=0;
 const record=(kind,id)=>[...rows.entries()].find(([k,v])=>k.startsWith(root+'/records/')&&v.kind===kind&&v.id===id)?.[1];
 const task=id=>record('tasks',id);
 return {rows,writes,root,rtdb,service,scope,record,task,stats,aggregation:on=>{collection.noAggregation=!on;},measure:async fn=>{const before={...stats},result=await fn();return {result,reads:stats.reads-before.reads,writes:stats.writes-before.writes,deletes:stats.deletes-before.deletes};},tasks:()=>[...rows.values()].filter(v=>v.kind==='tasks'),
  grant:(uid,grant,member={active:true,role:'member'})=>{rows.set('orgs/org/members/'+uid,member);rows.set(root+'/grants/'+uid,{...grant,version:1});},
  run:(uid,body)=>service.execute(uid,{...scope,...body}),
  patch:(uid,id,set,over={})=>{const t=task(id);return service.execute(uid,{...scope,action:'patch',projectId:t.projectId,taskId:id,opId:'op-'+(++n),baseRevision:t.revision,set,...over});},
  commit:(uid,id,data)=>{const t=task(id);return service.execute(uid,{...scope,action:'commit',mutationId:'mutation-'+(++n),changes:[{key:t.key,baseRevision:t.revision,before:t,after:{...t,data:{...t.data,...data}}}]});},
  control:(uid,body)=>service.execute(uid,{...scope,action:'workspaceControl',...body})};
}
function workspace({workflow,dependency,from,tasks=6}={}){
 const w=generate({tasks,objects:0}),p=w.projects[0];p.tasks.forEach(t=>{t.status='Backlog';t.verified=false;t.merged=false;});
 p.tasks[0].dependsOn=[p.tasks[1].id];p.tasks[1].status=dependency||'Backlog';if(from)p.tasks[0].status=from;
 if(workflow)p.workflow={enabled:true,transitions:[{from:'Backlog',to:'In progress'},{from:'In progress',to:'Validation'},{from:'Validation',to:'Done'}]};
 return m.normalizeWorkspace(w);
}
module.exports={database,workspace,fakeRtdb,generate};
