// /src/cloud/diagnostics.cjs
'use strict';
// Read-only measuring for the "Sync status" and "Compare with cloud" screens (0.8.28).
// Nothing in here changes what is sent, received or stored. It only counts and times what the session already does.
const S=require('./schema.cjs');
const BOARD_LOCAL=['revision','updatedAt','viewport'];// local-only bookkeeping of a Canvas board in a v4 workspace (see v4Writes.cjs)
const copy=x=>JSON.parse(JSON.stringify(x));
const fnv=text=>{let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h.toString(16).padStart(8,'0');};
const shortId=id=>{const s=String(id);return s.length>24?s.slice(0,10)+'..'+s.slice(-6):s;};
const message=e=>String(e&&e.message||e||'').slice(0,160);

function createDiagnostics({now=Date.now}={}){
 const d={
  signal:{missedCount:0,missedStreak:0,live:false,connected:null,unreadable:[],values:0,moved:0,lastValueAt:0,lastMovedAt:0,lastMovedProject:'',liveChangedAt:0},
  send:{quick:0,tries:0,ok:0,failed:0,lastTryAt:0,lastOkAt:0,lastError:'',lastErrorAt:0},
  receive:{requests:0,skipped:0,lastAt:0,lastFull:false,lastProjects:[],lastRecords:0,lastChangedAt:0,lastFullAt:0,lastError:'',lastErrorAt:0},
  tick:{count:0,lastAt:0}
 };
 return {
  snapshot:()=>copy(d),
  // The listener state: `live` is true only when the connection is up and every project signal can be read.
  signalState(live,detail){const was=d.signal.live;d.signal.live=!!live;if(detail){d.signal.connected=detail.connected===undefined?null:!!detail.connected;d.signal.unreadable=Array.isArray(detail.unreadable)?detail.unreadable.map(u=>({id:String(u.id),code:String(u.code||'')})):[];}if(was!==d.signal.live)d.signal.liveChangedAt=now();},
  // Every value the signal delivers; `moved` is true when it differs from the one seen before (the first value of a project is not a move).
  signalMissed(streak){d.signal.missedCount++;d.signal.missedStreak=streak;},
  signalValue(projectId,moved){d.signal.values++;d.signal.lastValueAt=now();if(moved){d.signal.moved++;d.signal.lastMovedAt=now();d.signal.lastMovedProject=String(projectId);}},
  quickSend(){d.send.quick++;},
  sendTried(){d.send.tries++;d.send.lastTryAt=now();},
  sendOk(){d.send.ok++;d.send.lastOkAt=now();},
  sendFailed(e){d.send.failed++;d.send.lastError=message(e);d.send.lastErrorAt=now();},
  receiveSkipped(){d.receive.skipped++;},
  receiveDone({full,projects,records}){d.receive.requests++;d.receive.lastAt=now();d.receive.lastFull=!!full;d.receive.lastProjects=[...projects].map(String);d.receive.lastRecords=records|0;d.receive.lastError='';if(full)d.receive.lastFullAt=now();if(records>0)d.receive.lastChangedAt=now();},
  receiveFailed(e){d.receive.lastError=message(e);d.receive.lastErrorAt=now();},
  tickRan(){d.tick.count++;d.tick.lastAt=now();}
 };
}

const ago=(at,now)=>{if(!at)return 'never';const s=Math.max(0,Math.round((now-at)/1000));return s<2?'just now':s<120?s+' s ago':Math.round(s/60)+' min ago';};
const inSeconds=ms=>{const s=Math.max(0,Math.round(ms/1000));return s<120?s+' s':Math.round(s/60)+' min';};

// Plain-words text for the Sync status panel. `info` is what session.getDiagnostics() returns.
function formatStatus(info,now=info.at||Date.now()){
 const L=[],sg=info.signal,sd=info.send,rc=info.receive,q=info.queue;
 L.push('Sync status at '+new Date(now).toISOString().slice(11,19)+' UTC');
 L.push('Connection: '+(info.connected?'connected (protocol '+info.protocol+')':'not connected')+' · window '+(info.visible?'visible':'hidden'));
 L.push('Live signal: '+(sg.live?'YES':'NO')+' (since '+ago(sg.liveChangedAt,now)+')');
 if(!sg.live){L.push('  Why: '+(sg.connected===false?'the live database connection is down':sg.unreadable.length?'cannot read '+sg.unreadable.length+' project signal(s): '+sg.unreadable.map(u=>shortId(u.id)+(u.code?' ['+u.code+']':'')).join(', '):sg.values===0&&sg.liveChangedAt===0?'no answer from the live database yet':'not reported'));}
 L.push('Mode: '+(sg.live&&info.signalDistrusted?'polling (the live signal missed changes '+sg.missedCount+' time(s) so it is not trusted; a check runs every '+inSeconds(info.checkEveryMs)+')':sg.live?'live signal (a check also runs every '+inSeconds(info.checkEveryMs)+' as a safety net)':'polling (a check runs every '+inSeconds(info.checkEveryMs)+')'));
 L.push('Safety checks that found changes the signal never announced: '+(sg.missedCount||0));
 L.push('Signal values heard: '+sg.values+' · changes heard: '+sg.moved+' · last change '+ago(sg.lastMovedAt,now)+(sg.lastMovedProject?' (project '+shortId(sg.lastMovedProject)+')':''));
 L.push('Next check in: '+inSeconds(info.nextCheckInMs)+' · rounds run: '+info.tick.count+' · last round '+ago(info.tick.lastAt,now));
 L.push('Last send: '+ago(sd.lastOkAt,now)+' · sent ok '+sd.ok+' · failed '+sd.failed+(sd.lastError?' · last error: '+sd.lastError+' ('+ago(sd.lastErrorAt,now)+')':''));
 L.push('Last queue drain: '+ago(info.lastDrainAt,now)+' · quick sends (about 2 s after an edit): '+(sd.quick||0)+' · safety round every '+inSeconds(info.syncIntervalMs));
 L.push('Last receive: '+ago(rc.lastAt,now)+' · requests '+rc.requests+' · skipped (nothing marked) '+rc.skipped+' · last got '+rc.lastRecords+' record(s)'+(rc.lastFull?' (full check)':' (projects: '+(rc.lastProjects.map(shortId).join(', ')||'none')+')')+' · last full check '+ago(rc.lastFullAt,now)+' · last news '+ago(rc.lastChangedAt,now)+(rc.lastError?' · last error: '+rc.lastError:''));
 if(q){
  L.push('Queue: '+q.length+' in the queue · '+q.conflicts+' need review · '+(q.local||0)+' kept on this device (not shared yet)');
  if(q.head)L.push('Queue head: '+q.head.status+(q.head.error?' – '+q.head.error:'')+' · attempts '+q.head.attempts+(q.head.nextAttemptIn>0?' · retry in '+inSeconds(q.head.nextAttemptIn):'')+' · touches '+(q.head.touches.join(', ')||'(message)')+' · queued '+ago(q.head.createdAt,now));
  if(q.held>0)L.push('HELD: '+q.held+' later edit(s) wait for an earlier stuck edit they depend on (same record, or a record it creates or deletes). Other edits are still being sent.');
  else if(q.conflicts>0)L.push('A conflict is waiting for your decision. It does not hold back edits to other records.');
  if(q.firstConflict&&q.firstConflict.index>0)L.push('First conflict is item '+(q.firstConflict.index+1)+': '+q.firstConflict.error+' · touches '+(q.firstConflict.touches.join(', ')||'(message)'));
 }
 return L.join('\n');
}

// Each record becomes a short fingerprint of its content and position. Canvas boards ignore their local-only bookkeeping.
function fingerprint(r){const data=r.kind==='canvases'?Object.fromEntries(Object.entries(r.data).filter(([k])=>!BOARD_LOCAL.includes(k))):r.data;return fnv(S.stable(data)+'|'+r.order);}
const LISTED=new Set(['canvases','canvas.objects','canvas.connectors','canvas.threads','boards']);// kinds that are small enough to list in full
const LIMIT=40;
const cut=ids=>ids.length>LIMIT?ids.slice(0,LIMIT).join(' ')+' (+'+(ids.length-LIMIT)+' more)':ids.join(' ');
// device / cloud: arrays of records ({key,kind,id,data,order}). Returns counts and differences per kind.
// 0.8.36: the device renumbers positions 0,1,2… when it packs its data, while the cloud keeps gaps and fractions left by deletes, moves and two people adding at once. Only the ORDER of the items counts, not the number, so positions are turned into ranks (1st, 2nd, 3rd…) inside each list before comparing.
function ranked(records){
 const lists=new Map();for(const r of records){const g=r.kind+'|'+(r.projectId||'')+'|'+(r.boardId||'');if(!lists.has(g))lists.set(g,[]);lists.get(g).push(r);}
 const out=[];for(const list of lists.values()){list.sort((a,b)=>a.order-b.order||(a.key<b.key?-1:a.key>b.key?1:0));list.forEach((r,i)=>out.push({...r,order:i}));}
 return out;}
function compareRecords(rawDevice,rawCloud,meta={}){
 const device=ranked(rawDevice),cloud=ranked(rawCloud);
 const kinds=new Map(),slot=kind=>{if(!kinds.has(kind))kinds.set(kind,{kind,device:new Map(),cloud:new Map()});return kinds.get(kind);};
 for(const r of device)slot(r.kind).device.set(r.key,r);for(const r of cloud)slot(r.kind).cloud.set(r.key,r);
 const rows=[...kinds.values()].sort((a,b)=>a.kind<b.kind?-1:1).map(({kind,device:a,cloud:b})=>{
  const onlyDevice=[],onlyCloud=[],different=[];
  for(const [key,r] of a){const o=b.get(key);if(!o)onlyDevice.push(r.id);else if(fingerprint(r)!==fingerprint(o))different.push(r.id);}
  for(const [key,r] of b)if(!a.has(key))onlyCloud.push(r.id);
  const keys=m=>[...m.keys()].sort(),fp=m=>fnv(keys(m).map(k=>k+':'+fingerprint(m.get(k))).join(';'));
  return {kind,device:a.size,cloud:b.size,same:!onlyDevice.length&&!onlyCloud.length&&!different.length,deviceHash:fp(a),cloudHash:fp(b),onlyDevice:onlyDevice.sort(),onlyCloud:onlyCloud.sort(),different:different.sort(),
   deviceIds:LISTED.has(kind)?[...a.values()].map(r=>r.id).sort():null,cloudIds:LISTED.has(kind)?[...b.values()].map(r=>r.id).sort():null};
 });
 return {...meta,rows,allSame:rows.every(r=>r.same)};
}

function formatCompare(result){
 const L=[];
 L.push('Compare with cloud at '+new Date(result.at||Date.now()).toISOString().slice(11,19)+' UTC'+(result.label?' · '+result.label:''));
 L.push('Account '+(result.uid?shortId(result.uid):'?')+' · queue '+(result.queued??'?')+' waiting, '+(result.conflicts??'?')+' need review');
 L.push(result.allSame?'RESULT: this device and the cloud hold the same records.':'RESULT: DIFFERENT. This device and the cloud do not hold the same records.');
 if(result.queued>0)L.push('Note: '+result.queued+' edit(s) are still queued on this device, so a difference may only be unsent work.');
 L.push('');
 L.push('kind | device | cloud | same | device fingerprint | cloud fingerprint');
 for(const r of result.rows)L.push(r.kind+' | '+r.device+' | '+r.cloud+' | '+(r.same?'yes':'NO')+' | '+r.deviceHash+' | '+r.cloudHash);
 for(const r of result.rows){
  const lines=[];
  if(r.deviceIds)lines.push('  device ids: '+(cut(r.deviceIds.map(shortId))||'(none)'),'  cloud ids: '+(cut(r.cloudIds.map(shortId))||'(none)'));
  if(r.onlyDevice.length)lines.push('  only on this device: '+cut(r.onlyDevice.map(shortId)));
  if(r.onlyCloud.length)lines.push('  only in the cloud: '+cut(r.onlyCloud.map(shortId)));
  if(r.different.length)lines.push('  same id, different content: '+cut(r.different.map(shortId)));
  if(lines.length)L.push('',r.kind,...lines);
 }
 return L.join('\n');
}
module.exports={createDiagnostics,formatStatus,compareRecords,formatCompare,fingerprint,fnv,shortId};
