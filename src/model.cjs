'use strict';
const FORMAT='niyarvo.project.v1';
const gantt=require('./gantt.cjs');
const projectScheduling=require('./scheduleProject.cjs');
const taskWorkflows=require('./taskWorkflows.cjs');
const planning=require('./planning.cjs');
const taskSchema=require('./taskSchema.cjs');
const agile=require('./agile.cjs');
const operations=require('./operations.cjs');
const programs=require('./programs.cjs');
const boards=require('./boards.cjs');
const powerUps=require('./powerUps.cjs');
const automation=require('./automation.cjs');
const kanbanUX=require('./kanbanUX.cjs');
const STATUSES=['Backlog','In progress','Validation','Done'];
const PRIORITIES=['Low','Medium','High','Critical'];
const STAGES=['Development','Testing','Production'];
const iso=()=>new Date().toISOString();
const id=(prefix='id')=>`${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;
const str=(x,max=1000)=>typeof x==='string'?x.slice(0,max):'';
const arr=(x,max=5000)=>Array.isArray(x)?x.slice(0,max):[];
const unique=(items)=>[...new Set(items)];
const dateOnly=(x)=>gantt.dayNumber(x)!==null?x:'';
const safeUrl=(x)=>{const u=str(x,3000).trim();return /^https?:\/\//i.test(u)?u:'';};
const safeArray=(x,max,label)=>{if(!Array.isArray(x))return [];if(x.length>max)throw Error(`${label} exceeds ${max} item limit`);return x;};
function validateUnique(items,label){const ids=new Set();for(const item of items){if(ids.has(item.id))throw Error(`Duplicate ${label} ID: ${item.id}`);ids.add(item.id);}}
function normalizeRule(rule={}){return {id:str(rule.id,120)||id('rule'),name:str(rule.name,140)||'Automation',enabled:rule.enabled!==false,triggerStatus:STATUSES.includes(rule.triggerStatus)?rule.triggerStatus:'Done',action:['priority','stage','owner','dueDays'].includes(rule.action)?rule.action:'priority',value:str(rule.value,180)};}

function defaultTask(o={}){
  const now=iso();return {
    id:str(o.id,120)||id('task'), title:str(o.title,240)||'Untitled task', description:str(o.description,12000), parentId:str(o.parentId,120), boardId:str(o.boardId,120)||boards.DEFAULT_BOARD_ID, listId:str(o.listId,120),
    status:STATUSES.includes(o.status)?o.status:'Backlog', priority:PRIORITIES.includes(o.priority)?o.priority:'Medium',
    stage:STAGES.includes(o.stage)?o.stage:'Development', owner:str(o.owner,120)||'Solo operator',
    phaseId:str(o.phaseId,120), releaseId:str(o.releaseId,120), repo:str(o.repo,120), branch:str(o.branch,200),
    commit:str(o.commit,120), mainSha:str(o.mainSha,120), start:dateOnly(o.start), due:dateOnly(o.due), milestone:o.milestone===true,
    position:Number.isFinite(o.position)&&o.position>=0?o.position:0,
    progress:planning.percent(o.progress),estimateHours:planning.hours(o.estimateHours),
    taskTypeId:str(o.taskTypeId,60)||'task', sprintId:str(o.sprintId,100), customValues:o.customValues&&typeof o.customValues==='object'&&!Array.isArray(o.customValues)?{...o.customValues}:{},
    dependsOn:unique(arr(o.dependsOn,100).map(x=>str(x,120)).filter(Boolean)),
    labels:unique(arr(o.labels,30).map(x=>str(x,40)).filter(Boolean)),
    githubLinks:powerUps.normalizeTaskLinks(o.githubLinks),
    attachments:arr(o.attachments,100).map(a=>({id:str(a.id,120)||id('attachment'),name:str(a.name,220)||'Link',url:safeUrl(a.url)})).filter(a=>a.url),
    tests:arr(o.tests,250).map((t,i)=>({id:str(t.id,100)||`check-${i}`, title:str(t.title||t,500), result:['pending','passed','failed','blocked'].includes(t.result)?t.result:'pending', evidence:str(t.evidence,2000)})),
    evidence:str(o.evidence,4000), expected:str(o.expected,4000), actual:str(o.actual,4000), rollback:str(o.rollback,4000),
    verified:!!o.verified, merged:!!o.merged, createdAt:str(o.createdAt,50)||now, updatedAt:str(o.updatedAt,50)||now
  };
}
function makeProject(o={}){
 const meta=taskSchema.normalizeSchema(o);
 const project={governance:require('./governanceCore.cjs').normalizeGovernance(o.governance),...operations.normalizeProjectExtras(o),boards:boards.normalizedBoards(o),kanbanViews:o.kanbanViews||{},powerUps:powerUps.normalizedPowerUps(o),...meta,format:FORMAT,id:str(o.id,100)||id('project'),name:str(o.name,180)||'Untitled project',code:str(o.code,30)||'PRJ',
  description:str(o.description,2000),archived:o.archived===true,version:str(o.version,50)||'0.1.0',color:str(o.color,24)||'#9972ea',
  importedAt:str(o.importedAt,60)||iso(),
  sprints:agile.normalizeAgile(o).sprints,
  savedViews:safeArray(o.savedViews,50,'Saved views').map(planning.normalizeView),
  automationCommands:automation.normalizeCommands(o.automationCommands||[]),automationHistory:automation.normalizeHistory(o.automationHistory||[]),
  automations:safeArray(o.automations,50,'Automations').map(normalizeRule), phases:safeArray(o.phases,200,'Phases').map(p=>({id:str(p.id,120)||id('phase'),name:str(p.name,180),stage:STAGES.includes(p.stage)?p.stage:'Development',description:str(p.description,4000),goal:str(p.goal,4000),exit:str(p.exit,4000)})),
  releases:safeArray(o.releases,500,'Releases').map(r=>({id:str(r.id,120)||id('release'),name:str(r.name,180),status:['Planned','Testing','Ready','Released'].includes(r.status)?r.status:'Planned',repo:str(r.repo,120),version:str(r.version,40),mainSha:str(r.mainSha,120),notes:str(r.notes,3000)})),
  tasks:safeArray(o.tasks,10000,'Tasks').map((t,i)=>defaultTask({...t,position:Number.isFinite(t.position)?t.position:i})),schemas:safeArray(o.schemas,200,'Schemas').map(s=>({id:str(s.id,120)||id('schema'),name:str(s.name,180),description:str(s.description,12000),content:str(s.content,20000)})),
  apiContracts:safeArray(o.apiContracts,400,'API contracts').map(s=>({id:str(s.id,120)||id('api'),name:str(s.name,180),description:str(s.description,12000)})),
  playbooks:safeArray(o.playbooks,200,'Playbooks').map(s=>({id:str(s.id,120)||id('playbook'),name:str(s.name,180),description:str(s.description,12000)})),
  changelog:safeArray(o.changelog,1000,'Changelog').map(s=>({id:str(s.id,120)||id('changelog'),at:str(s.at,50),message:str(s.message,3000)}))};
 return projectScheduling.normalizeProjectScheduling({...project,kanbanViews:kanbanUX.normalizeViews(project),scheduling:o.scheduling});
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
function createWorkspace(){const p=demoProject();return {schemaVersion:1,selectedId:p.id,projects:[p],portfolios:[],programs:[],backups:[],activity:[{id:id('activity'),at:iso(),action:'Demo workspace initialized'}],revision:1};}
function normalizeWorkspace(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid workspace');
 const projects=safeArray(input.projects,30,'Workspace projects').map(makeProject);
 if(!projects.length)throw Error('Workspace must contain a project');
 if(projects.every(p=>p.archived))throw Error('Workspace must contain at least one active project');
 validateUnique(projects,'project');projects.forEach(validateProject);
 const valid=new Set(projects.map(p=>p.id));
 const portfolios=operations.normalizePortfolios(input.portfolios||[],projects);
 return {schemaVersion:1,portfolios,programs:programs.normalized(input.programs||[],projects,portfolios),selectedId:projects.some(p=>p.id===input.selectedId&&!p.archived)?input.selectedId:(projects.find(p=>!p.archived)||projects[0]).id,projects,
 backups:arr(input.backups,15).filter(s=>s&&typeof s==='object'&&['project','workspace'].includes(s.kind)),
 activity:arr(input.activity,100).map(a=>({id:str(a.id,120),at:str(a.at,60),action:str(a.action,1200)})),
 revision:Number.isInteger(input.revision)&&input.revision>=0?input.revision:0};
}
function validateProject(project){
 projectScheduling.normalizeProjectScheduling(project);
 operations.validateExtras(project);
 boards.validateBoards(project);
 kanbanUX.normalizeViews(project);
 powerUps.normalizedPowerUps(project);
 for(const task of project.tasks)powerUps.normalizeTaskLinks(task.githubLinks);
 automation.validate(project);
 taskSchema.validateProject(project);
 planning.validateViews(project.savedViews||[]);
 agile.validateAgile(project);
 taskWorkflows.hierarchy(project.tasks);
 validateUnique(project.tasks,'task');validateUnique(project.releases,'release');
 const ids=new Set(project.tasks.map(t=>t.id));
 for(const task of project.tasks)for(const dep of task.dependsOn){if(dep===task.id)throw Error('Task cannot depend on itself: '+task.id);if(!ids.has(dep))throw Error('Missing dependency '+dep+' for '+task.id);}
 const visiting=new Set(),visited=new Set(),byId=new Map(project.tasks.map(t=>[t.id,t]));
 function visit(taskId){if(visiting.has(taskId))throw Error('Circular task dependency: '+taskId);if(visited.has(taskId))return;visiting.add(taskId);for(const dep of byId.get(taskId).dependsOn)visit(dep);visiting.delete(taskId);visited.add(taskId);}
 for(const id of ids)visit(id);
 return project;
}
function setTaskDependencies(project,taskId,dependsOn){
 const next={...project,tasks:project.tasks.map(t=>t.id===taskId?{...t,dependsOn:unique(dependsOn),verified:false,merged:false,updatedAt:iso()}:t)};
 if(!project.tasks.some(t=>t.id===taskId))throw Error('Task not found');
 const reconciled=projectScheduling.reconcileProjectScheduling(next);validateProject(reconciled);
 const old=project.tasks.find(t=>t.id===taskId).dependsOn;
 if(old.length===dependsOn.length&&old.every(dep=>dependsOn.includes(dep)))return project;
 return projectScheduling.invalidateDependents(reconciled,[taskId]);
}
function deleteTaskWithLinks(project,taskId){
 const deleted=project.tasks.find(t=>t.id===taskId);if(!deleted)throw Error('Task not found');
 const dependents=project.tasks.filter(t=>t.dependsOn.includes(taskId)||t.parentId===taskId).map(t=>t.id);
 const next={...project,tasks:project.tasks.filter(t=>t.id!==taskId).map(t=>t.dependsOn.includes(taskId)||t.parentId===taskId?{...t,parentId:t.parentId===taskId?'':t.parentId,dependsOn:t.dependsOn.filter(dep=>dep!==taskId),verified:false,merged:false,updatedAt:iso()}:t)};
 const reconciled=projectScheduling.reconcileProjectScheduling({...next,timeEntries:(next.timeEntries||[]).filter(x=>x.taskId!==taskId),comments:(next.comments||[]).filter(x=>x.taskId!==taskId),reminders:(next.reminders||[]).filter(x=>x.taskId!==taskId)});validateProject(reconciled);
 return projectScheduling.invalidateDependents(reconciled,dependents,deleted.releaseId?[deleted.releaseId]:[]);
}
function blockers(project,task){return task.dependsOn.filter(id=>project.tasks.find(t=>t.id===id)?.status!=='Done');}
function moveTask(project,taskId,status,toIndex=99999){
 if(!STATUSES.includes(status))throw Error('Invalid board lane');
 const task=project.tasks.find(t=>t.id===taskId);if(!task)throw Error('Task not found');
 taskSchema.checkTransition(project,task,status);
 if(status==='Done'&&blockers(project,task).length)throw Error('Complete dependency tasks first: '+blockers(project,task).join(', '));
 const remaining=project.tasks.filter(t=>t.id!==taskId);
 let changed={...task,status,listId:status!==task.status?'':task.listId,updatedAt:iso(),verified:status==='Done'?task.verified:false,merged:status==='Done'?task.merged:false};
 const applied=[];
 if(status!==task.status){for(const rule of project.automations||[]){if(!rule.enabled||rule.triggerStatus!==status)continue;
  if(rule.action==='priority'&&PRIORITIES.includes(rule.value)){changed.priority=rule.value;applied.push(rule.name);}
  if(rule.action==='stage'&&STAGES.includes(rule.value)){changed.stage=rule.value;applied.push(rule.name);}
  if(rule.action==='owner'&&rule.value.trim()){changed.owner=rule.value.trim();applied.push(rule.name);}
  if(rule.action==='dueDays'&&/^\d+$/.test(rule.value)&&Number(rule.value)<=365){changed.due=shiftDate(new Date().toISOString().slice(0,10),Number(rule.value));applied.push(rule.name);}
 }}
 const current=remaining.filter(t=>t.status===status).sort((a,b)=>a.position-b.position);
 current.splice(Math.max(0,Math.min(current.length,Math.floor(toIndex))),0,changed);
 const positions=new Map(current.map((t,i)=>[t.id,i]));
 const result={...project,tasks:remaining.concat(changed).map(t=>positions.has(t.id)?{...t,position:positions.get(t.id)}:t),lastAutomationActions:applied};
 if(status!==task.status&&result.automationCommands?.length){const executed=automation.run(result,{type:'status',from:task.status,to:status,taskId});return {...executed.project,lastAutomationActions:[...applied,...executed.applied.map(x=>x.ruleId)]};}
 return result;
}
function shiftDate(day,amount){const value=dateOnly(day);if(!value)throw Error('Invalid date');const d=new Date(value+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+amount);return d.toISOString().slice(0,10);}
function shiftTask(project,taskId,days){const task=project.tasks.find(t=>t.id===taskId);if(!task)throw Error('Task not found');if(!task.start&&!task.due)throw Error('Set a start or due date first');if(!Number.isInteger(days)||Math.abs(days)>365)throw Error('Invalid date change');return {...project,tasks:project.tasks.map(t=>t.id===taskId?{...t,start:t.start?shiftDate(t.start,days):'',due:t.due?shiftDate(t.due,days):'',verified:false,merged:false,updatedAt:iso()}:t)};}

function resizeTask(project,taskId,days){
 const task=project.tasks.find(t=>t.id===taskId);
 if(!task)throw Error('Task not found');
 if(!task.start&&!task.due)throw Error('Schedule the task first');
 if(!Number.isInteger(days)||Math.abs(days)>365)throw Error('Invalid duration change');
 const start=task.start||task.due,end=task.due||task.start;
 const due=shiftDate(end,days);
 if(due<start)throw Error('End date cannot precede start date');
 return {...project,tasks:project.tasks.map(t=>t.id===taskId?{...t,start,due,verified:false,merged:false,updatedAt:iso()}:t)};
}
function importProject(raw){if(typeof raw!=='object'||raw===null||Array.isArray(raw))throw Error('Invalid JSON object');if(raw.format!==FORMAT)throw Error('Unsupported project file. Expected '+FORMAT);if(!Array.isArray(raw.tasks))throw Error('Project must contain a tasks array');const p=makeProject(raw);return validateProject(p);}
function canVerify(task){return !!task.tests.length && task.tests.every(t=>t.result==='passed'&&t.evidence.trim()) && !!task.evidence.trim() && !!task.actual.trim();}
function canMerge(task){return task.verified && canVerify(task) && !!task.mainSha.trim();}
function verifyTask(t){if(!canVerify(t))throw Error('Pass all checks and record test evidence and actual result first.');return {...t,verified:true,status:'Done',updatedAt:iso()};}
function mergeTask(t){if(!canMerge(t))throw Error('Verified status, passing checks and main branch SHA required.');return {...t,merged:true,updatedAt:iso()};}
function stats(project){const tasks=project.tasks;const passed=tasks.flatMap(t=>t.tests).filter(t=>t.result==='passed').length;const checks=tasks.reduce((a,t)=>a+t.tests.length,0);const done=tasks.filter(t=>t.status==='Done').length;return {total:tasks.length,done,active:tasks.filter(t=>t.status==='In progress').length,validation:tasks.filter(t=>t.status==='Validation').length,backlog:tasks.filter(t=>t.status==='Backlog').length,passed,checks,verified:tasks.filter(t=>t.verified).length,merged:tasks.filter(t=>t.merged).length};}

function workspaceSnapshot(workspace,label='Workspace recovery snapshot'){
  return {id:id('snapshot'),kind:'workspace',at:iso(),label,
    workspace:JSON.parse(JSON.stringify({selectedId:workspace.selectedId,projects:workspace.projects,portfolios:workspace.portfolios||[],programs:workspace.programs||[],activity:workspace.activity||[]}))};
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
    return {...workspace,selectedId:recovered.selectedId,projects:recovered.projects,portfolios:recovered.portfolios,programs:recovered.programs,activity:recovered.activity};
  }
  if(!snapshot.project)throw Error('Snapshot contains no project');
  const p={...makeProject(snapshot.project),archived:false};
  return {...workspace,selectedId:p.id,projects:[...workspace.projects.filter(x=>x.id!==p.id),p]};
}

function boardAutoScrollDelta(pointerX,left,width,threshold=66){
 if(!Number.isFinite(pointerX)||!Number.isFinite(left)||!Number.isFinite(width)||width<=0)return 0;
 const relative=pointerX-left;
 if(relative<threshold)return -18;
 if(relative>width-threshold)return 18;
 return 0;
}
function boardLaneAt(pointerX,left,scrollOffset,laneWidth,gap=12){
 if(![pointerX,left,scrollOffset,laneWidth,gap].every(Number.isFinite)||laneWidth<=0)return -1;
 return Math.floor((pointerX-left+scrollOffset)/(laneWidth+gap));
}
function archiveProject(workspace,projectId,archived=true){
 if(!workspace.projects.some(p=>p.id===projectId))throw Error('Project not found');
 const projects=workspace.projects.map(p=>p.id===projectId?{...p,archived}:p);
 if(projects.every(p=>p.archived))throw Error('Cannot archive the last active project. Create another project first.');
 const active=projects.find(p=>!p.archived);
 return {...workspace,projects,selectedId:projects.find(p=>p.id===workspace.selectedId&&!p.archived)?workspace.selectedId:active.id};
}
function selectWorkspaceProject(workspace,projectId){
 const selected=workspace.projects.find(p=>p.id===projectId&&!p.archived);
 if(!selected)throw Error('Project is archived or missing');
 return {...workspace,selectedId:projectId};
}

function canRelease(release,project){
  const linked=project.tasks.filter(t=>t.releaseId===release.id);
  return linked.length>0 && !!release.mainSha.trim() && linked.every(t=>t.status==='Done'&&!blockers(project,t).length&&canMerge(t)&&t.merged);
}
module.exports={kanbanUX,powerUps,boards,automation,operations,projectScheduling,taskWorkflows,planning,taskSchema,agile,gantt,boardAutoScrollDelta,boardLaneAt,deleteTaskWithLinks,archiveProject,selectWorkspaceProject,resizeTask,validateProject,setTaskDependencies,blockers,moveTask,shiftDate,shiftTask,FORMAT,STATUSES,PRIORITIES,STAGES,id,iso,defaultTask,makeProject,blankProject,demoProject,createWorkspace,normalizeWorkspace,importProject,canVerify,canMerge,verifyTask,mergeTask,stats,workspaceSnapshot,projectSnapshot,restoreSnapshot,canRelease};
