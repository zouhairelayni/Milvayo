// /tests/helpers/cloud-scenarios.cjs
'use strict';
// Shared scenario builder and domain oracle for the delete and dependency tests (in-memory and emulator).
const S=require('../../src/cloud/schema.cjs'),m=require('../../src/domain/model.cjs'),{generate}=require('./cloud-fake.cjs');
const stamp=r=>{const d={...r.data};delete d.updatedAt;return d;};
const mapOf=records=>new Map(records.filter(r=>!r.deleted).map(r=>[r.key,r.kind==='tasks'?stamp(r):r.data]));
// Builds a project graph: edges [successor, predecessor], parents {child: parent}, verified [indexes], plus linked items and releases.
function scenario({tasks=8,edges=[],parents={},verified=[],comments=[],times=[],reminders=[],releaseOf={},releases=[],typed=[]}={}){
 const W=generate({tasks,objects:0}),p=W.projects[0],id=i=>p.tasks[i].id;
 p.tasks.forEach(t=>{t.status='Backlog';t.verified=false;t.merged=false;t.dependsOn=[];t.parentId='';t.releaseId='';});
 for(const [s,d] of edges)p.tasks[s].dependsOn.push(id(d));for(const [c,par] of Object.entries(parents))p.tasks[c].parentId=id(par);
 for(const i of verified){p.tasks[i].status='Done';p.tasks[i].verified=true;}
 for(const [i,r] of Object.entries(releaseOf))p.tasks[i].releaseId=r;p.releases=releases;
 p.comments=comments.map((c,i)=>({id:'comment-'+i,taskId:id(c),author:'Ann',body:'Note '+i,at:'2026-01-01T00:00:00.000Z'}));
 p.timeEntries=times.map((c,i)=>({id:'time-'+i,taskId:id(c),owner:'Ann',date:'2026-11-01',hours:2}));
 p.reminders=reminders.map((c,i)=>({id:'reminder-'+i,taskId:id(c),date:'2026-11-05',note:'Check',done:false}));
 p.scheduling={links:typed.map(([s,d,type,lagDays])=>({predecessorId:id(d),successorId:id(s),type,lagDays}))};
 return {workspace:m.normalizeWorkspace(W),id};
}

const RELEASES=[{id:'r1',name:'One',status:'Ready',repo:'',version:'1.0.0'},{id:'r2',name:'Two',status:'Released',repo:'',version:'2.0.0'},{id:'r3',name:'Three',status:'Planned',repo:'',version:'3.0.0'}];
function domain(w,fn){const ws=S.unpack(S.pack(w),w),p=ws.projects[0],next=fn(p);return mapOf(S.pack(m.normalizeWorkspace({...ws,projects:[next]})).map(r=>({...r,deleted:false})));}
module.exports={scenario,mapOf,domain,RELEASES,stamp};
