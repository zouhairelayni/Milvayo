import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { T, Button } from './ui';
const model=require('./model.cjs');
const bridge=require('./modernBridge.cjs');
const programs=require('./programs.cjs');
const projectRelations=require('./projectRelations.cjs');
const KEY='niyarvo-projects-v1'; // IMPORTANT: same original workspace; do not migrate into a competing store.
const StoreContext=createContext(null);
const activity=(w,label)=>({...w,revision:(w.revision||0)+1,activity:[{id:model.id('activity'),at:model.iso(),action:label},...(w.activity||[])].slice(0,90)});
const current=w=>w.projects.find(p=>p.id===w.selectedId);

export function StoreProvider({children}){
 const [ws,setWs]=useState(null),[fault,setFault]=useState(''),[ready,setReady]=useState(false);
 const [notice,setNotice]=useState(null);
 const notify=(text,type='info')=>setNotice({id:`notice-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,text:String(text).slice(0,300),type});
 const currentRef=useRef(null),pending=useRef(Promise.resolve()),loaded=useRef(false);
 useEffect(()=>{let active=true;AsyncStorage.getItem(KEY).then(raw=>{
   if(!active)return;
   const loadedWorkspace=raw?model.normalizeWorkspace(JSON.parse(raw)):model.createWorkspace();
   currentRef.current=loadedWorkspace;loaded.current=true;setWs(loadedWorkspace);setReady(true);
   // On a new install the sample is established, but on an existing install there is no migration write until an actual edit.
   if(!raw)pending.current=pending.current.then(()=>AsyncStorage.setItem(KEY,JSON.stringify(loadedWorkspace))).catch(e=>{setFault(`Initial local save failed: ${e.message}`);notify('Could not save the initial workspace. Check Settings diagnostics.','error')});
 }).catch(e=>{if(active){setFault(`Unable to load the existing workspace: ${e.message}. Existing data has NOT been overwritten. Export it from the previous release before attempting recovery.`);notify('Unable to load the local workspace. Your data was not overwritten.','error');setReady(true)}});return()=>{active=false}},[]);
 const put=(next)=>{
  // Validate before mutating any in-memory or persistent state.
  const safe=model.normalizeWorkspace(next);
  currentRef.current=safe;setWs(safe);
  const text=JSON.stringify(safe);
  pending.current=pending.current.catch(()=>{}).then(()=>AsyncStorage.setItem(KEY,text)).catch(e=>{setFault(`Saving failed: ${e.message}. Do not uninstall or clear app data; export a backup.`);notify('Local save failed. Do not clear app data; export a backup.','error')});
 };
 const trans=(fn,label)=>{
  if(!loaded.current||!currentRef.current)return false;
  try{const prev=currentRef.current;const next=fn(prev);if(next===prev)return true;put(activity(next,label));setFault('');if(/(?:Moved .+ to (?:Done|Validation)|Bulk moved|Created automation|Saved automation|Created task|Created sprint)/i.test(label))notify(label,'success');return true}
  catch(e){setFault(e.message||String(e));notify(e.message||String(e),'error');return false}
 };
 const projectChange=(fn,label)=>trans(w=>{
  const p=current(w),next=fn(p);if(next===p)return w;
  let reconciled=bridge.reconcile(p,next);
  if((reconciled.automationCommands||[]).length && (reconciled.automationHistory||[]).length === (p.automationHistory||[]).length){
   const old=new Map(p.tasks.map(t=>[t.id,t.status]));
   for(const t of reconciled.tasks){
    const from=old.get(t.id);
    if(from!==undefined&&from!==t.status)reconciled=model.automation.run(reconciled,{type:'status',taskId:t.id,from,to:t.status}).project;
   }
  }
  model.validateProject(reconciled);
  return {...w,projects:w.projects.map(x=>x.id===p.id?reconciled:x)};
 },label);
 const safeMutation=(fn,label)=>projectChange(fn,label);
 const snapshotChange=(fn,label)=>trans(w=>{const p=current(w),next=fn(p);const safe=bridge.reconcile(p,next);model.validateProject(safe);return {...w,backups:[model.workspaceSnapshot(w,'Before '+label),...w.backups].slice(0,12),projects:w.projects.map(x=>x.id===p.id?safe:x)}},label);
 const api=useMemo(()=>({
  flush:()=>pending.current.catch(()=>{}),
  switchProject:id=>trans(w=>model.selectWorkspaceProject(w,id),`Opened project ${id}`),
  createProject:name=>{const clean=String(name||'').trim();if(!clean){setFault('Project name required');return null;}
    const p=model.makeProject({id:model.id('project'),name:clean,code:clean.replace(/[^a-z0-9]/gi,'').slice(0,7).toUpperCase()||'NEW'});
    if(!trans(w=>({...w,selectedId:p.id,projects:[...w.projects,p]}),`Created project ${p.name}`))return null;return p.id;},
  archiveProject:id=>{const w=currentRef.current;if((w?.projects||[]).filter(p=>!p.archived).length<2)return 'last';return trans(w=>model.archiveProject(w,id,true),`Archived project ${id}`)},
  recoverProject:id=>trans(w=>model.archiveProject(w,id,false),`Recovered project ${id}`),
  importProject:text=>{try{
    const value=JSON.parse(text);let items=[];
    if(value.format===model.FORMAT)items=[value];
    else if(value.schemaVersion===1&&Array.isArray(value.projects))items=value.projects;
    else if(value.format==='niyarvo.workspace.v1'&&value.workspace?.schemaVersion===1)items=value.workspace.projects;
    else throw Error('Expected a compatible Niyarvo Projects project or workspace backup');
    if(!items.length||items.length>30)throw Error('Invalid project count');
    const created=items.map(raw=>model.importProject(raw));
    const names=[];
    const ok=trans(w=>{
      if(w.projects.length+created.length>30)throw Error('Workspace project limit (30)');
      const seen=new Set(w.projects.map(p=>p.id));const imported=created.map(p=>{let id=p.id;if(seen.has(id))id=model.id('project');seen.add(id);names.push(p.name);return {...p,id,archived:false}});
      return {...w,selectedId:imported.at(-1).id,projects:[...w.projects,...imported],backups:[model.workspaceSnapshot(w,'Before importing projects'),...w.backups].slice(0,12)};
    },`Imported ${created.length} project(s)`);
    return ok?{ok:true,names}:{ok:false,error:'Import failed; no projects were replaced.'};
  }catch(e){return {ok:false,error:e.message}}},
  backupText:all=>{const w=currentRef.current;if(!w)return '';return JSON.stringify(all?{format:'niyarvo.workspace.v1',exportedAt:model.iso(),workspace:w}:current(w),null,2)},
  tasksCsv:()=>currentRef.current?model.operations.tasksCsv(current(currentRef.current)):'',
  addBoard:name=>{let id=null;projectChange(p=>{const next=bridge.addBoard(p,name);id=next.boards.at(-1).id;return next},`Created board ${name}`);return id},
  renameBoard:(id,name)=>projectChange(p=>model.boards.renameBoard(p,id,name),`Renamed board ${name}`),
  archiveBoard:(id,archived)=>projectChange(p=>bridge.archiveBoard(p,id,archived),`${archived?'Archived':'Restored'} board ${id}`),
  deleteBoard:id=>trans(w=>{const p=current(w);return {...w,backups:[model.workspaceSnapshot(w,'Before deleting board'),...w.backups].slice(0,12),projects:w.projects.map(x=>x.id===p.id?bridge.deleteBoard(p,id):x)}},`Deleted board ${id}; tasks returned to Main`),
  addList:(bid,name,status)=>projectChange(p=>bridge.addList(p,bid,name,status),`Created list ${name}`),
  renameList:(bid,lid,name)=>projectChange(p=>bridge.renameList(p,bid,lid,name),`Renamed list ${name}`),
  moveList:(bid,lid,dir)=>projectChange(p=>{const b=p.boards.find(x=>x.id===bid);const i=bridge.listSafe(b).findIndex(l=>l.id===lid);return bridge.moveListTo(p,bid,lid,i+dir)},`Reordered list ${lid}`),
  moveListTo:(bid,lid,to)=>projectChange(p=>bridge.moveListTo(p,bid,lid,to),`Reordered list ${lid}`),
  deleteList:(bid,lid)=>projectChange(p=>bridge.deleteList(p,bid,lid),`Deleted list ${lid} and moved its cards`),
  updateTask:(id,patch,label)=>projectChange(p=>{
    let q=p;const changes={...patch};
    if(Object.prototype.hasOwnProperty.call(changes,'progress')||Object.prototype.hasOwnProperty.call(changes,'effort')){
      const edits={};if('progress' in changes)edits.progress=changes.progress;if('effort' in changes)edits.estimateHours=changes.effort;
      q=model.planning.updateTaskPlanning(q,id,edits);delete changes.progress;delete changes.effort;
    }
    if('parentId' in changes){q=model.taskWorkflows.setParent(q,id,changes.parentId||'');delete changes.parentId;}
    if('taskTypeId' in changes){q=model.taskSchema.updateTaskType(q,id,changes.taskTypeId);delete changes.taskTypeId;}
    if('customValues' in changes){const previous=q.tasks.find(x=>x.id===id)?.customValues||{};for(const [field,v] of Object.entries(changes.customValues||{}))if(previous[field]!==v)q=model.taskSchema.updateValue(q,id,field,v);delete changes.customValues;}
    return Object.keys(changes).length?bridge.patchTask(q,id,changes):q;
  },label||`Edited task ${id}`),
  moveTask:(id,status)=>projectChange(p=>{const t=p.tasks.find(x=>x.id===id);const b=p.boards.find(b=>b.id===model.boards.effectiveBoard(t));const target=bridge.listSafe(b).find(l=>l.status===status);if(!target)throw Error(`No ${status} list on this board`);return bridge.changeStatus(p,id,status,target.id)},`Moved ${id} to ${status}`),
  moveTaskToList:(id,lid)=>projectChange(p=>bridge.placeTask(p,id,lid,null),`Moved ${id} to list ${lid}`),
  placeTask:(id,lid,beforeId)=>projectChange(p=>bridge.placeTask(p,id,lid,beforeId),`Reordered task ${id}`),
  addTask:(title,status,bid,extra)=>{let id=null;projectChange(p=>{const next=bridge.addTask(p,title,status,bid,extra);id=next.id;return next.project},`Created task ${title}`);return id},
  verifyTask:id=>projectChange(p=>{
    const t=p.tasks.find(t=>t.id===id);if(!t)throw Error('Task missing');
    model.taskSchema.checkTransition(p,t,'Done');
    if(model.blockers(p,t).length)throw Error('Complete predecessors before verifying');
    return {...p,tasks:p.tasks.map(x=>x.id===id?{...model.verifyTask(x),listId:''}:x)};
  },`Recorded verified completion for ${id}`),
  mergeTask:id=>projectChange(p=>({...p,tasks:p.tasks.map(x=>x.id===id?model.mergeTask(x):x)}),`Recorded merge checkpoint for ${id}`),
  addComment:(id,text)=>projectChange(p=>model.operations.postComment(p,{taskId:id,author:'Local operator',body:text}),`Commented on ${id}`),
  bulkStatus:(ids,status)=>projectChange(p=>ids.reduce((next,id)=>{const t=next.tasks.find(t=>t.id===id);if(!t)return next;const board=next.boards.find(b=>b.id===model.boards.effectiveBoard(t));const lane=bridge.listSafe(board).find(l=>l.status===status);if(!lane)throw Error('Target status list is missing');return bridge.changeStatus(next,id,status,lane.id)},p),`Bulk moved ${ids.length} tasks to ${status}`),
  createSprint:data=>{let id=null;const ok=projectChange(p=>{id=model.id('sprint');return model.agile.createSprint(p,{id,...data})},`Created sprint ${data.name}`);return ok?id:null},
  updateSprint:(id,data)=>projectChange(p=>model.agile.updatePlannedSprint(p,id,data),`Updated sprint ${id}`),
  deleteSprint:id=>trans(w=>{const p=current(w);const updated=bridge.reconcile(p,model.agile.deleteSprint(p,id));model.validateProject(updated);return {...w,backups:[model.workspaceSnapshot(w,'Before deleting sprint'),...w.backups].slice(0,12),projects:w.projects.map(x=>x.id===p.id?updated:x)}},`Deleted planned sprint ${id}`),
  assignSprintTask:(taskId,sprintId)=>projectChange(p=>model.agile.assign(p,taskId,sprintId||''),`Updated sprint scope for ${taskId}`),
  toggleSprintTask:id=>projectChange(p=>{const s=p.sprints.find(s=>s.state==='active');if(!s)throw Error('No active sprint');const t=p.tasks.find(t=>t.id===id);return model.agile.assign(p,id,t.sprintId===s.id?'':s.id)},`Updated sprint assignment for ${id}`),
  startSprint:id=>projectChange(p=>{const s=p.sprints.find(s=>s.id===(id||p.sprints.find(x=>x.state==='planned')?.id));if(!s)throw Error('No planned sprint');return model.agile.startSprint(p,s.id)},'Started sprint'),
  finishSprint:id=>trans(w=>{const p=current(w),s=p.sprints.find(s=>s.id===(id||p.sprints.find(x=>x.state==='active')?.id));if(!s)throw Error('No active sprint');const updated=bridge.reconcile(p,model.agile.finishSprint(p,s.id));model.validateProject(updated);return {...w,backups:[model.workspaceSnapshot(w,'Before finishing sprint'),...w.backups].slice(0,12),projects:w.projects.map(x=>x.id===p.id?updated:x)}},'Finished sprint'),
  setCheck:(id,status)=>projectChange(p=>{
    if(!['pending','passed','failed','blocked'].includes(status))throw Error('Invalid test result');
    const match=p.tasks.find(t=>t.tests.some(k=>`${t.id}::${k.id}`===id));
    if(!match)throw Error('Check missing');
    return {...p,tasks:p.tasks.map(t=>t.id===match.id?{...t,verified:false,merged:false,tests:t.tests.map(k=>`${t.id}::${k.id}`===id?{...k,result:status}:k)}:t)};
  },`Updated check ${id} to ${status}`),
  setStage:(id,stage)=>projectChange(p=>{if(!['Planned','Testing','Ready','Released'].includes(stage))throw Error('Unknown release stage');const r=p.releases.find(r=>r.id===id);if(!r)throw Error('Release missing');if(['Ready','Released'].includes(stage)&&!model.canRelease({...r,status:stage},p))throw Error('Release gates are not satisfied; verify and merge every linked task with evidence first');return {...p,releases:p.releases.map(r=>r.id===id?{...r,status:stage}:r)}},`Updated release ${id} to ${stage}`),
  toggleRule:id=>projectChange(p=>({...p,automations:p.automations.map(x=>x.id===id?{...x,enabled:!x.enabled}:x)}),`Toggled automation ${id}`),
  sweepDue:()=>projectChange(p=>({...p,tasks:p.tasks.map(t=>t.status!=='Done'&&t.due&&t.due<model.iso().slice(0,10)&&!t.labels.includes('Overdue')?{...t,labels:[...t.labels,'Overdue']}:t)}),'Flagged overdue tasks'),
  // One modern application, one canonical legacy engine and one storage key.
  updateProject:(id,patch)=>trans(w=>{const p=w.projects.find(x=>x.id===id);if(!p)throw Error('Project missing');const name=String(patch.name??p.name).trim().slice(0,180),code=String(patch.code??p.code).trim().slice(0,30);if(!name||!code)throw Error('Project name and code are required');const updated=model.makeProject({...p,name,code,description:patch.description??p.description});return {...w,projects:w.projects.map(x=>x.id===id?updated:x)}},`Updated project ${id}`),
  deleteProject:id=>trans(w=>{if(w.projects.length<2||w.projects.filter(p=>!p.archived).length<2&&!w.projects.find(p=>p.id===id)?.archived)throw Error('Keep one project accessible');if(!w.projects.some(p=>p.id===id))throw Error('Project missing');const projects=w.projects.filter(p=>p.id!==id);return {...projectRelations.removeProjectLinks(w,id),projects,selectedId:w.selectedId===id?projects.find(p=>!p.archived)?.id||projects[0].id:w.selectedId,backups:[model.workspaceSnapshot(w,'Before deleting project'),...w.backups].slice(0,12)}},`Deleted project ${id}`),
  duplicateProject:(id,name)=>{let output=null;const ok=trans(w=>{const src=w.projects.find(x=>x.id===id);if(!src)throw Error('Project missing');if(w.projects.length>=30)throw Error('Project limit');const newid=model.id('project');const copy=model.operations.templateProject(src,{name,code:src.code.slice(0,20)+'COPY',id:newid});model.validateProject(copy);output=newid;return {...w,projects:[...w.projects,copy],selectedId:newid}},`Created template from ${id}`);return ok?output:null},
  deleteTask:id=>snapshotChange(p=>model.deleteTaskWithLinks(p,id),`deleting task ${id}`),
  duplicateTask:id=>{let copyId=null;projectChange(p=>{copyId=model.id('task');return model.kanbanUX.duplicateCard(p,id,copyId)},`Duplicated task ${id}`);return copyId},
  addSubtask:(id,title)=>{let created=null;projectChange(p=>{const parent=p.tasks.find(x=>x.id===id);if(!parent)throw Error('Parent not found');const result=bridge.addTask(p,title,'Backlog',model.boards.effectiveBoard(parent),{});created=result.id;return model.taskWorkflows.setParent(result.project,created,id)},`Added subtask to ${id}`);return created},
  togglePowerUp:(boardId,powerId)=>safeMutation(p=>model.powerUps.toggle(p,boardId,powerId),`Toggled board Power-Up ${powerId}`),
  addGithubLink:(taskId,url)=>safeMutation(p=>model.powerUps.addLink(p,taskId,url),'Attached GitHub reference'),
  removeGithubLink:(taskId,url)=>safeMutation(p=>model.powerUps.removeLink(p,taskId,url),'Removed GitHub reference'),
  setBoardView:(boardId,patch)=>safeMutation(p=>model.kanbanUX.setBoardView(p,boardId,patch),'Saved board display preference'),
  saveTaskView:raw=>safeMutation(p=>model.planning.saveView(p,raw),'Saved task view'),
  deleteTaskView:id=>safeMutation(p=>model.planning.removeView(p,id),'Deleted task view'),
  saveTaskSchema:config=>safeMutation(p=>model.taskSchema.updateSchema(p,config),'Updated task configuration'),
  removeTaskField:id=>safeMutation(p=>model.taskSchema.removeField(p,id),'Deleted custom field'),
  removeTaskType:id=>safeMutation(p=>model.taskSchema.removeType(p,id),'Deleted task type'),
  setCustomValue:(taskId,fieldId,value)=>safeMutation(p=>model.taskSchema.updateValue(p,taskId,fieldId,value),'Updated custom field value'),
  updateCalendar:cal=>snapshotChange(p=>model.projectScheduling.updateCalendar(p,cal),'updating calendar'),
  updateDependency:(from,to,type,lagDays)=>safeMutation(p=>model.projectScheduling.updateTypedLink(p,from,to,type,lagDays),'Updated dependency relationship'),
  previewSchedule:ids=>{try{return {ok:true,proposal:model.projectScheduling.preview(current(currentRef.current),ids)}}catch(e){return {ok:false,error:e.message}}},
  applySchedule:proposal=>snapshotChange(p=>model.projectScheduling.apply(p,proposal),'applying schedule'),
  createRelease:raw=>safeMutation(p=>{const name=String(raw.name||'').trim();if(!name||name.length>180)throw Error('Release name required');const r={id:model.id('release'),name,status:'Planned',version:String(raw.version||'').slice(0,40),repo:String(raw.repo||'').slice(0,120),notes:String(raw.notes||'').slice(0,3000),mainSha:''};return {...p,releases:[...p.releases,r]}},'Created release'),
  editRelease:(id,patch)=>safeMutation(p=>{const r=p.releases.find(x=>x.id===id);if(!r)throw Error('Release missing');const next={...r,...patch,id:r.id};if(!String(next.name||'').trim())throw Error('Release name required');return {...p,releases:p.releases.map(x=>x.id===id?next:x)}},`Edited release ${id}`),
  deleteRelease:id=>snapshotChange(p=>{if(!p.releases.some(r=>r.id===id))throw Error('Release missing');return {...p,releases:p.releases.filter(r=>r.id!==id),tasks:p.tasks.map(t=>t.releaseId===id?{...t,releaseId:'',verified:false,merged:false}:t)}},`deleting release ${id}`),
  addResource:data=>safeMutation(p=>model.operations.addResource(p,data),'Added contributor'),
  deleteResource:id=>safeMutation(p=>model.operations.deleteResource(p,id),'Removed contributor'),
  logTime:data=>safeMutation(p=>model.operations.logTime(p,data),'Logged work time'),
  removeTime:id=>safeMutation(p=>model.operations.removeTime(p,id),'Removed time entry'),
  setGovernance:(key,value,label)=>projectChange(p=>({...p,governance:{...p.governance,[key]:value}}),label||`Updated governance ${key}`),
  setGovernanceDoc:(key,doc)=>projectChange(p=>({...p,governance:{...p.governance,docs:{...p.governance.docs,[key]:doc}}}),`Updated ${key} document`),
  setBudget:(amount,currency)=>safeMutation(p=>model.operations.setBudget(p,amount,currency),'Updated project budget'),
  timeCsv:()=>currentRef.current?model.operations.timeCsv(current(currentRef.current)):'',
  costSummary:()=>currentRef.current?model.operations.costSummary(current(currentRef.current)):null,
  saveProgram:raw=>trans(w=>programs.save(w,raw),'Saved program'),
  deleteProgram:id=>trans(w=>programs.remove(w,id),'Deleted program'),
  savePortfolio:raw=>trans(w=>model.operations.savePortfolio(w,raw),'Saved portfolio'),
  deletePortfolio:id=>trans(w=>{if(!(w.portfolios||[]).some(p=>p.id===id))throw Error('Portfolio missing');return projectRelations.removePortfolioLinks(model.operations.deletePortfolio(w,id),id)},'Deleted portfolio'),
  addReminder:data=>safeMutation(p=>model.operations.addReminder(p,data),'Added reminder'),
  finishReminder:id=>safeMutation(p=>model.operations.finishReminder(p,id),'Completed reminder'),
  deleteReminder:id=>safeMutation(p=>model.operations.deleteReminder(p,id),'Deleted reminder'),
  deleteComment:id=>safeMutation(p=>model.operations.deleteComment(p,id),'Deleted comment'),
  saveCommand:raw=>safeMutation(p=>model.automation.saveCommand(p,raw),'Saved automation command'),
  deleteCommand:id=>safeMutation(p=>model.automation.deleteCommand(p,id),'Deleted automation command'),
  runCommand:(id,taskId='',boardId='')=>safeMutation(p=>model.automation.run(p,{type:boardId?'boardButton':'cardButton',ruleId:id,taskId:taskId||undefined,boardId:boardId||undefined}).project,'Ran automation'),
  runDueCommands:()=>safeMutation(p=>{const r=model.automation.run(p,{type:'due'});return r.applied.length?r.project:p},'Ran due automation checks'),
  runAgingCommands:()=>safeMutation(p=>{const r=model.automation.run(p,{type:'aging'});return r.applied.length?r.project:p},'Ran aging automation checks'),
  createSnapshot:()=>trans(w=>({...w,backups:[model.workspaceSnapshot(w,'Manual recovery snapshot'),...w.backups].slice(0,12)}),'Created recovery snapshot'),
  restoreWorkspace:text=>{try{const payload=JSON.parse(text);const candidate=payload.format==='niyarvo.workspace.v1'?payload.workspace:payload;const incoming=model.normalizeWorkspace(candidate);const ok=trans(w=>({...incoming,backups:[model.workspaceSnapshot(w,'Before whole-workspace restore'),...incoming.backups].slice(0,12)}),'Restored whole workspace');return {ok,error:ok?'':'Workspace restore failed'}}catch(e){return {ok:false,error:e.message}}},
  restoreSnapshot:id=>trans(w=>{const snapshot=w.backups.find(x=>x.id===id);if(!snapshot)throw Error('Recovery snapshot missing');return {...model.restoreSnapshot(w,snapshot),backups:[model.workspaceSnapshot(w,'Before restoring snapshot'),...w.backups].slice(0,12)}},`Restored snapshot ${id}`),
 }),[]);
 const view=useMemo(()=>ws?bridge.projectView(ws):null,[ws]);
 const projects=useMemo(()=>ws?ws.projects.map(p=>({id:p.id,name:p.name,release:p.version,tasks:p.tasks.length,current:p.id===ws.selectedId,archived:p.archived})):[],[ws]);
 if(!ready)return <View style={{flex:1,alignItems:'center',justifyContent:'center',gap:10}}><ActivityIndicator/><T>Opening local workspace…</T></View>;
 if(!ws)return <View style={{flex:1,justifyContent:'center',padding:28,gap:12}}><T weight="600">Workspace data could not be opened safely</T><T>{fault}</T><T>Return to your last working release. Do not clear application storage.</T></View>;
 return <StoreContext.Provider value={{s:view,projects,workspace:ws,error:fault,notice,dismissNotice:()=>setNotice(null),...api}}><View style={{flex:1}}>{children}</View></StoreContext.Provider>;
}
export const useStore=()=>useContext(StoreContext);
