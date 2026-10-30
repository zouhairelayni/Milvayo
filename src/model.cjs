'use strict';
const FORMAT='niyarvo.project.v1';
const STATUSES=['Backlog','In progress','Validation','Done'];
const PRIORITIES=['Low','Medium','High','Critical'];
const STAGES=['Development','Testing','Production'];
const iso=()=>new Date().toISOString();
const id=(prefix='id')=>`${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;
const str=(x,max=1000)=>typeof x==='string'?x.slice(0,max):'';
const arr=(x,max=5000)=>Array.isArray(x)?x.slice(0,max):[];
function defaultTask(o={}){
  const now=iso();return {
    id:str(o.id,120)||id('task'), title:str(o.title,240)||'Untitled task', description:str(o.description,12000),
    status:STATUSES.includes(o.status)?o.status:'Backlog', priority:PRIORITIES.includes(o.priority)?o.priority:'Medium',
    stage:STAGES.includes(o.stage)?o.stage:'Development', owner:str(o.owner,120)||'Solo operator',
    phaseId:str(o.phaseId,120), releaseId:str(o.releaseId,120), repo:str(o.repo,120), branch:str(o.branch,200),
    commit:str(o.commit,120), mainSha:str(o.mainSha,120), due:str(o.due,20),
    tests:arr(o.tests,250).map((t,i)=>({id:str(t.id,100)||`check-${i}`, title:str(t.title||t,500), result:['pending','passed','failed','blocked'].includes(t.result)?t.result:'pending', evidence:str(t.evidence,2000)})),
    evidence:str(o.evidence,4000), expected:str(o.expected,4000), actual:str(o.actual,4000), rollback:str(o.rollback,4000),
    verified:!!o.verified, merged:!!o.merged, createdAt:str(o.createdAt,50)||now, updatedAt:str(o.updatedAt,50)||now
  };
}
function makeProject(o={}){
 return {format:FORMAT,id:str(o.id,100)||id('project'),name:str(o.name,180)||'Untitled project',code:str(o.code,30)||'PRJ',
  description:str(o.description,2000),version:str(o.version,50)||'0.1.0',color:str(o.color,24)||'#9972ea',
  importedAt:str(o.importedAt,60)||iso(), phases:arr(o.phases,200).map(p=>({id:str(p.id,120)||id('phase'),name:str(p.name,180),stage:STAGES.includes(p.stage)?p.stage:'Development',description:str(p.description,4000),goal:str(p.goal,4000),exit:str(p.exit,4000)})),
  releases:arr(o.releases,500).map(r=>({id:str(r.id,120)||id('release'),name:str(r.name,180),status:['Planned','Testing','Ready','Released'].includes(r.status)?r.status:'Planned',repo:str(r.repo,120),version:str(r.version,40),mainSha:str(r.mainSha,120),notes:str(r.notes,3000)})),
  tasks:arr(o.tasks,10000).map(defaultTask),schemas:arr(o.schemas,200).map(s=>({id:str(s.id,120)||id('schema'),name:str(s.name,180),description:str(s.description,12000),content:str(s.content,20000)})),
  apiContracts:arr(o.apiContracts,400).map(s=>({id:str(s.id,120)||id('api'),name:str(s.name,180),description:str(s.description,12000)})),
  playbooks:arr(o.playbooks,200).map(s=>({id:str(s.id,120)||id('playbook'),name:str(s.name,180),description:str(s.description,12000)})),
  changelog:arr(o.changelog,1000).map(s=>({id:str(s.id,120)||id('changelog'),at:str(s.at,50),message:str(s.message,3000)}))};
}
function blankProject(){return makeProject({name:'My first project',code:'NEW',description:'Ready for your single-file roadmap import.'});}
function demoProject(){return makeProject({id:'sample-workspace',name:'Northstar Studio',code:'NST',description:'Illustrative project only. Import your own roadmap whenever ready.',version:'0.1.0',
  phases:[{id:'d0',name:'Foundation',stage:'Development'},{id:'t0',name:'Test gates',stage:'Testing'},{id:'p0',name:'Production launch',stage:'Production'}],
  releases:[{id:'rel0',name:'Foundation v0.1',status:'Testing',repo:'Northstar Studio',version:'0.1.0'},{id:'rel1',name:'Private beta',status:'Planned',repo:'Northstar Studio',version:'0.2.0'}],
  tasks:[
    {id:'NST-001',title:'Establish repository baseline',status:'Done',priority:'Low',stage:'Development',repo:'Northstar Studio',releaseId:'rel0',tests:[{id:'t1',title:'Clean working tree',result:'passed',evidence:'Sample evidence'}],evidence:'Sample evidence',verified:true,merged:true,mainSha:'demo-sha-123'},
    {id:'NST-002',title:'Create shared project schema',status:'Done',priority:'Medium',stage:'Development',repo:'Northstar Studio',releaseId:'rel0',tests:[{id:'t2',title:'Import roundtrip validated',result:'passed',evidence:'Sample evidence'}],evidence:'Sample evidence',verified:true,merged:true,mainSha:'demo-sha-456'},
    {id:'NST-003',title:'Implement workspace snapshots',status:'In progress',priority:'High',stage:'Development',repo:'Northstar Studio',releaseId:'rel0',tests:[{id:'t3',title:'Snapshot restores exact state',result:'pending'}]},
    {id:'NST-004',title:'Check document permissions and data integrity',status:'Validation',priority:'Critical',stage:'Testing',repo:'Northstar Studio',releaseId:'rel0',tests:[{id:'t4',title:'Unauthorized writes denied in fixture',result:'passed',evidence:'Sample fixture'},{id:'t5',title:'Sample records unchanged',result:'pending'}]},
    {id:'NST-005',title:'Add testing evidence timeline',status:'Backlog',priority:'Medium',stage:'Development',repo:'Northstar Studio',releaseId:'rel1'},
    {id:'NST-006',title:'Document integration test gates',status:'Backlog',priority:'High',stage:'Testing',repo:'Northstar Studio',releaseId:'rel1'},
    {id:'NST-007',title:'Implement restore rehearsal',status:'Validation',priority:'High',stage:'Testing',repo:'Northstar Studio',releaseId:'rel1'},
    {id:'NST-008',title:'Remove debug UI from production bundle',status:'Backlog',priority:'Critical',stage:'Production',repo:'Northstar Studio',releaseId:'rel1'},
    {id:'NST-009',title:'Release sign-off checklist',status:'In progress',priority:'Medium',stage:'Testing',repo:'Northstar Studio',releaseId:'rel1'}
  ]});}
function createWorkspace(){const p=demoProject();return {schemaVersion:1,selectedId:p.id,projects:[p],backups:[],activity:[{id:id('activity'),at:iso(),action:'Demo workspace initialized'}],revision:1};}
function normalizeWorkspace(input){if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid workspace');const projects=arr(input.projects,30).map(makeProject);if(!projects.length)throw Error('Workspace must contain a project');const valid=new Set(projects.map(p=>p.id));return {schemaVersion:1,selectedId:valid.has(input.selectedId)?input.selectedId:projects[0].id,projects,backups:arr(input.backups,15),activity:arr(input.activity,100).map(a=>({id:str(a.id,120),at:str(a.at,60),action:str(a.action,1200)})),revision:Number.isInteger(input.revision)&&input.revision>=0?input.revision:0};}
function importProject(raw){if(typeof raw!=='object'||raw===null||Array.isArray(raw))throw Error('Invalid JSON object');if(raw.format!==FORMAT)throw Error('Unsupported project file. Expected '+FORMAT);if(!Array.isArray(raw.tasks))throw Error('Project must contain a tasks array');const p=makeProject(raw);const ids=new Set();for(const t of p.tasks){if(ids.has(t.id))throw Error('Duplicate task ID: '+t.id);ids.add(t.id);}return p;}
function canVerify(task){return !!task.tests.length && task.tests.every(t=>t.result==='passed'&&t.evidence.trim()) && !!task.evidence.trim() && !!task.actual.trim();}
function canMerge(task){return task.verified && canVerify(task) && !!task.mainSha.trim();}
function verifyTask(t){if(!canVerify(t))throw Error('Pass all checks and record test evidence and actual result first.');return {...t,verified:true,status:'Done',updatedAt:iso()};}
function mergeTask(t){if(!canMerge(t))throw Error('Verified status, passing checks and main branch SHA required.');return {...t,merged:true,updatedAt:iso()};}
function stats(project){const tasks=project.tasks;const passed=tasks.flatMap(t=>t.tests).filter(t=>t.result==='passed').length;const checks=tasks.reduce((a,t)=>a+t.tests.length,0);const done=tasks.filter(t=>t.status==='Done').length;return {total:tasks.length,done,active:tasks.filter(t=>t.status==='In progress').length,validation:tasks.filter(t=>t.status==='Validation').length,backlog:tasks.filter(t=>t.status==='Backlog').length,passed,checks,verified:tasks.filter(t=>t.verified).length,merged:tasks.filter(t=>t.merged).length};}

function workspaceSnapshot(workspace,label='Workspace recovery snapshot'){
  return {id:id('snapshot'),kind:'workspace',at:iso(),label,
    workspace:JSON.parse(JSON.stringify({selectedId:workspace.selectedId,projects:workspace.projects}))};
}
function projectSnapshot(workspace,label='Project recovery snapshot'){
  const p=workspace.projects.find(p=>p.id===workspace.selectedId);
  if(!p)throw Error('No project selected');
  return {id:id('snapshot'),kind:'project',at:iso(),label,projectId:p.id,project:JSON.parse(JSON.stringify(p))};
}
function restoreSnapshot(workspace,snapshot){
  if(!snapshot||typeof snapshot!=='object')throw Error('Invalid snapshot');
  if(snapshot.kind==='workspace'){
    const recovered=normalizeWorkspace({...workspace,...snapshot.workspace,backups:workspace.backups});
    return {...workspace,selectedId:recovered.selectedId,projects:recovered.projects};
  }
  if(!snapshot.project)throw Error('Snapshot contains no project');
  const p=makeProject(snapshot.project);
  return {...workspace,selectedId:p.id,projects:[...workspace.projects.filter(x=>x.id!==p.id),p]};
}
function canRelease(release,project){
  const linked=project.tasks.filter(t=>t.releaseId===release.id);
  return linked.length>0 && !!release.mainSha.trim() && linked.every(t=>canMerge(t)&&t.merged);
}
module.exports={FORMAT,STATUSES,PRIORITIES,STAGES,id,iso,defaultTask,makeProject,blankProject,demoProject,createWorkspace,normalizeWorkspace,importProject,canVerify,canMerge,verifyTask,mergeTask,stats,workspaceSnapshot,projectSnapshot,restoreSnapshot,canRelease};
