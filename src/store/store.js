// /src/store/store.js
import { diagnosticMonitor } from '../diagnostics/monitor';
import BoardMorph from '../components/brand/BoardMorph';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { View, ActivityIndicator, AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { T } from '../ui/uiBase';
const model=require('../domain/model.cjs');
const {localDay}=require('../utils/localDay.cjs');
const bridge=require('../domain/modernBridge.cjs');
const programs=require('../domain/programs.cjs');
const projectRelations=require('../domain/projectRelations.cjs');
const projectTools=require('../domain/projectTools.cjs');
const backupBudget=require('./backupBudget.cjs');
const {parseBackupJson}=require('./importFiles.cjs');
const workspaces=require('./workspaces.cjs'); // the first workspace keeps the original key 'milvayo-v1', so nothing is migrated
const StoreContext=createContext(null);
const ActionsContext=createContext(null); // stable actions only, so memoised children skip store-value changes
const ActiveContext=createContext(true); // false while a retained tab is hidden; deferred work (progressive mounting) waits
const activity=(w,label)=>({...w,revision:(w.revision||0)+1,activity:[{id:model.id('activity'),at:model.iso(),action:label},...(w.activity||[])].slice(0,90)});
// Selected tasks are moved predecessors first, so the order they were tapped in cannot make a valid bulk move fail.
const orderByDependency=(p,ids)=>{const chosen=new Set(ids),byId=new Map(p.tasks.map(t=>[t.id,t])),done=new Set(),out=[];
 const visit=(id,seen)=>{if(done.has(id)||seen.has(id)||!chosen.has(id))return;seen.add(id);for(const d of byId.get(id)?.dependsOn||[])visit(d,seen);done.add(id);out.push(id)};
 ids.forEach(id=>visit(id,new Set()));return out};
const current=w=>w.projects.find(p=>p.id===w.selectedId);

export function StoreProvider({children,onReady,loading}){
 const [ws,setWs]=useState(null),[fault,setFault]=useState(''),[ready,setReady]=useState(false);
 useEffect(()=>{if(ready)onReady?.();},[ready,onReady]);
 const [notice,setNotice]=useState(null);
 const notify=(text,type='info')=>setNotice({id:`notice-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,text:String(text).slice(0,300),type});
 const currentRef=useRef(null),loaded=useRef(false),lastError=useRef('');
 const normalizer=useRef(null),writer=useRef(null);
 const [idx,setIdx]=useState(null),indexRef=useRef(null),swapping=useRef(false),epochRef=useRef(0);
 if(!normalizer.current)normalizer.current=model.createWorkspaceNormalizer();
 // A writer is bound to one storage key for its whole life, so a late save can only ever reach the workspace it was made for.
 const makeWriter=key=>require('./latestWriter.cjs').createLatestWriter(
  value=>AsyncStorage.setItem(key,JSON.stringify(value)),
  {onError:e=>{setFault(`Saving failed: ${e.message}. Do not uninstall or clear app data; export a backup.`);notify('Local save failed. Do not clear app data; export a backup.','error');},
   onSuccess:()=>setFault(f=>f.startsWith('Saving failed:')?'':f)});
 useEffect(()=>{
  const save=()=>{void writer.current?.flush();}; // the writer does not exist until the first load finishes
  const sub=AppState.addEventListener('change',state=>{if(state!=='active')save();});
  if(Platform.OS==='web'&&typeof window!=='undefined')window.addEventListener('pagehide',save);
  return()=>{sub.remove();if(Platform.OS==='web'&&typeof window!=='undefined')window.removeEventListener('pagehide',save);save();};
 },[]);
 useEffect(()=>{let active=true;(async()=>{
   const started = Date.now();
   diagnosticMonitor.recordAction('startup storage read started');
   const rawIndex=await AsyncStorage.getItem(workspaces.INDEX_KEY);
   const parsed=workspaces.parseIndex(rawIndex),index=workspaces.reconcileIndex(parsed,await AsyncStorage.getAllKeys());
   const key=workspaces.keyFor(index.activeId),raw=await AsyncStorage.getItem(key);
   if(!active)return;
   diagnosticMonitor.recordAction(`startup storage read ${Date.now()-started}ms`);
   const normalizeStarted = Date.now();
   const loadedWorkspace=normalizer.current(raw?JSON.parse(raw):model.createWorkspace());
   diagnosticMonitor.recordAction(`startup normalize ${Date.now()-normalizeStarted}ms`);
   writer.current=makeWriter(key);indexRef.current=index;
   currentRef.current=loadedWorkspace;loaded.current=true;setWs(loadedWorkspace);setIdx(index);setReady(true);
   // On a new install the sample is established, but on an existing install there is no migration write until an actual edit.
   if(!raw)void writer.current.enqueue(loadedWorkspace);
   if(!rawIndex||index!==parsed)AsyncStorage.setItem(workspaces.INDEX_KEY,JSON.stringify(index)).catch(()=>{}); // the list is rebuilt from the saved keys if this write is lost
 })().catch(e=>{if(active){setFault(`Unable to load the existing workspace: ${e.message}. Existing data has NOT been overwritten. Export it from the previous release before attempting recovery.`);notify('Unable to load the local workspace. Your data was not overwritten.','error');setReady(true)}});return()=>{active=false}},[]);
 const put=(next)=>{
  // Validate before mutating any in-memory or persistent state.
  const safe=normalizer.current(next);
  currentRef.current=safe;setWs(safe);
  void writer.current.enqueue(safe);
 };
 const trans=(fn,label)=>{
  lastError.current='';
  if(!loaded.current||!currentRef.current){lastError.current='The workspace is still loading. Try again in a moment.';return false}
  try{const prev=currentRef.current;let next=fn(prev);if(next===prev)return true;
   // Snapshots are whole copies of earlier workspaces. Check on every edit, not only when snapshots change: ordinary edits grow the live data too.
   // shortcut: one extra JSON pass per edit, fine for a few MB; check only every Nth edit if edits start to lag.
   {const fitted=backupBudget.fitBackups(next);if(fitted.trimmed){next=fitted.workspace;notify('Older recovery snapshots were removed to keep the workspace within device storage limits.','info')}}
   put(activity(next,label));setFault('');if(/(?:Moved .+ to (?:Done|Validation)|Bulk moved|Created automation|Saved automation|Created task|Created sprint)/i.test(label))notify(label,'success');return true}
  catch(e){lastError.current=e.message||String(e);setFault(lastError.current);notify(lastError.current,'error');return false}
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
 // One workspace change at a time. Edits are refused while it runs, the open workspace is fully saved first, and the
 // epoch changes on every switch so work that started in the old workspace can tell it must not write into the new one.
 const exclusive=async fn=>{
  if(swapping.current){notify('Another workspace change is still running.','info');return false}
  swapping.current=true;
  try{return await fn()}catch(e){notify(e.message||String(e),'error');return false}finally{swapping.current=false}
 };
 const saveIndex=async next=>{await AsyncStorage.setItem(workspaces.INDEX_KEY,JSON.stringify(next));indexRef.current=next;setIdx(next)};
 // Order matters for interrupted runs: new data first, then the list; the list's active pointer moves last.
 const swapTo=(nextIndex,seed)=>exclusive(async()=>{
  const key=workspaces.keyFor(nextIndex.activeId);let wrote=false;loaded.current=false;
  try{
   if(!currentRef.current)throw Error('The workspace is still loading. Try again in a moment.');
   if(!(await writer.current.flush()))throw Error('The open workspace could not be saved. Export a backup before switching.');
   let next=seed;
   if(next){await AsyncStorage.setItem(key,JSON.stringify(next));wrote=true}
   else{const raw=await AsyncStorage.getItem(key);if(!raw)throw Error('That workspace has no saved data.');next=normalizer.current(JSON.parse(raw))}
   await saveIndex(nextIndex);
   epochRef.current+=1;writer.current=makeWriter(key);currentRef.current=next;
   setWs(next);setFault('');return true;
  }catch(e){if(wrote)AsyncStorage.removeItem(key).catch(()=>{});throw e}
  finally{loaded.current=true}
 });
 const api=useMemo(()=>({
  activeWorkspaceId:()=>indexRef.current?.activeId,
  switchWorkspace:async id=>{try{const cur=indexRef.current;return cur.activeId===id?true:await swapTo(workspaces.setActive(cur,id))}catch(e){notify(e.message,'error');return false}},
  createWorkspace:async name=>{try{
    const nextIndex=workspaces.addItem(indexRef.current,name,model.id('ws'));
    const p=model.makeProject({id:model.id('project'),name:'First project',code:'PROJ'});
    const seed=normalizer.current({schemaVersion:1,selectedId:p.id,projects:[p],portfolios:[],programs:[],backups:[],activity:[{id:model.id('activity'),at:model.iso(),action:'Workspace created'}],revision:1});
    return await swapTo(nextIndex,seed);
   }catch(e){notify(e.message,'error');return false}},
  renameWorkspace:(id,name)=>exclusive(async()=>{await saveIndex(workspaces.renameItem(indexRef.current,id,name));return true}),
  // Data first, list second: a crash in between leaves a listed workspace with no data, which the next start drops.
  deleteWorkspace:async id=>{try{
    const cur=indexRef.current;workspaces.removeItem(cur,id); // refuses the last workspace
    if(id===cur.activeId&&!(await swapTo(workspaces.setActive(cur,cur.items.find(x=>x.id!==id).id))))return false;
    return await exclusive(async()=>{await AsyncStorage.removeItem(workspaces.keyFor(id));await saveIndex(workspaces.removeItem(indexRef.current,id));return true});
   }catch(e){notify(e.message,'error');return false}},
  flush:()=>writer.current?.flush()??Promise.resolve(true), // no writer yet (startup): nothing to save
  switchProject:id=>trans(w=>model.selectWorkspaceProject(w,id),`Opened project ${id}`),
  createProject:input=>{const details=input&&typeof input==='object'?input:{name:input};
    const clean=String(details.name||'').trim();if(!clean){setFault('Project name required');return null;}
    const code=String(details.code||clean.replace(/[^a-z0-9]/gi,'').slice(0,7).toUpperCase()||'NEW').trim();
    const p=model.makeProject({id:model.id('project'),name:clean,code,description:details.description||'',tools:projectTools.initialTools(details.tools), // starter overrides apply atomically; ordinary new projects remain lean
      governance:{info:{manager:details.manager||'',sponsor:details.sponsor||'',objective:details.objective||''}}});
    if(!trans(w=>({...w,selectedId:p.id,projects:[...w.projects,p]}),`Created project ${p.name}`))return null;return p.id;},
  // Hides or shows one optional tool of the open project. Only the switch changes; the tool's data is untouched.
  setProjectTool:(toolId,on)=>trans(w=>({...w,projects:w.projects.map(p=>p.id===w.selectedId?model.makeProject({...p,tools:projectTools.setTool(p.tools,toolId,on)}):p)}),`${on?'Switched on':'Switched off'} the ${toolId} tool`),
  archiveProject:id=>{const w=currentRef.current;if((w?.projects||[]).filter(p=>!p.archived).length<2)return 'last';return trans(w=>model.archiveProject(w,id,true),`Archived project ${id}`)},
  recoverProject:id=>trans(w=>model.archiveProject(w,id,false),`Recovered project ${id}`),
  importProject:(text,expectWorkspaceId)=>{try{
    if(expectWorkspaceId&&expectWorkspaceId!==indexRef.current?.activeId){const error='The workspace changed while the file was opening. Nothing was imported; open the file again.';notify(error,'error');return {ok:false,error}}
    const value=parseBackupJson(text);let items=[];
    if(value.format===model.FORMAT)items=[value];
    else if(value.schemaVersion===1&&Array.isArray(value.projects))items=value.projects;
    else if(value.format==='niyarvo.workspace.v1'&&value.workspace?.schemaVersion===1)items=value.workspace.projects;
    else throw Error('Expected a compatible Milvayo project or workspace backup');
    if(!items.length||items.length>30)throw Error('Invalid project count');
    const created=items.map(raw=>model.importProject(raw));
    const names=[];
    const ok=trans(w=>{
      if(w.projects.length+created.length>30)throw Error('Workspace project limit (30)');
      const seen=new Set(w.projects.map(p=>p.id));const imported=created.map(p=>{let id=p.id;if(seen.has(id))id=model.id('project');seen.add(id);names.push(p.name);return {...p,id,archived:false}});
      return {...w,selectedId:imported.at(-1).id,projects:[...w.projects,...imported],backups:[model.workspaceSnapshot(w,'Before importing projects'),...w.backups].slice(0,12)};
    },`Imported ${created.length} project(s)`);
    return ok?{ok:true,names}:{ok:false,error:lastError.current||'Import failed; no projects were replaced.'};
  }catch(e){return {ok:false,error:e.message}}},
  // Compact JSON (no indentation: about 40% smaller). Recovery snapshots are whole copies of earlier workspaces, so they are
  // left out unless asked for: they dominate the file size and can hold data that was deliberately deleted since.
  backupText:(all,options)=>{const w=currentRef.current;if(!w)return '';const withSnapshots=!!(options&&options.snapshots);const one=options&&options.projectId?w.projects.find(x=>x.id===options.projectId):current(w);if(!all&&!one)throw Error('Project not found');return JSON.stringify(all?{format:'niyarvo.workspace.v1',exportedAt:model.iso(),workspace:withSnapshots?w:{...w,backups:[]}}:one)},
  tasksCsv:()=>currentRef.current?model.operations.tasksCsv(current(currentRef.current)):'',
  addBoard:name=>{let id=null;const ok=projectChange(p=>{const next=bridge.addBoard(p,name);id=next.boards.at(-1).id;return next},`Created board ${name}`);return ok?id:null},
  renameBoard:(id,name)=>projectChange(p=>model.boards.renameBoard(p,id,name),`Renamed board ${name}`),
  archiveBoard:(id,archived)=>projectChange(p=>bridge.archiveBoard(p,id,archived),`${archived?'Archived':'Restored'} board ${id}`),
  deleteBoard:id=>trans(w=>{const p=current(w);return {...w,backups:[model.workspaceSnapshot(w,'Before deleting board'),...w.backups].slice(0,12),projects:w.projects.map(x=>x.id===p.id?bridge.deleteBoard(p,id):x)}},`Deleted board ${id}; tasks returned to Main`),
  addList:(bid,name,status)=>projectChange(p=>bridge.addList(p,bid,name,status),`Created list ${name}`),
  renameList:(bid,lid,name)=>projectChange(p=>bridge.renameList(p,bid,lid,name),`Renamed list ${name}`),
  moveListTo:(bid,lid,to)=>projectChange(p=>bridge.moveListTo(p,bid,lid,to),`Reordered list ${lid}`),
  deleteList:(bid,lid)=>projectChange(p=>bridge.deleteList(p,bid,lid),`Deleted list ${lid} and moved its cards`),
  updateTask:(id,patch,label)=>projectChange(p=>{
    const existing=p.tasks.find(t=>t.id===id);
    if(existing&&Object.entries(patch).every(([key,value])=>existing[key]===value))return p;
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
  placeTask:(id,lid,beforeId)=>projectChange(p=>bridge.placeTask(p,id,lid,beforeId),`Reordered task ${id}`),
  addTask:(title,status,bid,extra)=>{let id=null;const ok=projectChange(p=>{const next=bridge.addTask(p,title,status,bid,extra);id=next.id;return next.project},`Created task ${title}`);return ok?id:null},
  verifyTask:id=>projectChange(p=>{
    const t=p.tasks.find(t=>t.id===id);if(!t)throw Error('Task missing');
    model.taskSchema.checkTransition(p,t,'Done');
    if(model.blockers(p,t).length)throw Error('Complete predecessors before verifying');
    return {...p,tasks:p.tasks.map(x=>x.id===id?{...model.verifyTask(x),listId:''}:x)};
  },`Recorded verified completion for ${id}`),
  mergeTask:id=>projectChange(p=>({...p,tasks:p.tasks.map(x=>x.id===id?model.mergeTask(x):x)}),`Recorded merge checkpoint for ${id}`),
  addComment:(id,text)=>projectChange(p=>model.operations.postComment(p,{taskId:id,author:'Local operator',body:text}),`Commented on ${id}`),
  bulkStatus:(ids,status)=>projectChange(p=>orderByDependency(p,ids).reduce((next,id)=>{const t=next.tasks.find(t=>t.id===id);if(!t)return next;const board=next.boards.find(b=>b.id===model.boards.effectiveBoard(t));const lane=bridge.listSafe(board).find(l=>l.status===status);if(!lane)throw Error('Target status list is missing');return bridge.changeStatus(next,id,status,lane.id)},p),`Bulk moved ${ids.length} tasks to ${status}`),
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
  sweepDue:()=>projectChange(p=>{const today=localDay(),late=t=>t.status!=='Done'&&t.due&&t.due<today&&!t.labels.includes('Overdue');if(!p.tasks.some(late)){notify('No overdue tasks.','info');return p}return {...p,tasks:p.tasks.map(t=>late(t)?{...t,labels:[...t.labels,'Overdue']}:t)}},'Flagged overdue tasks'),
  // One modern application, one canonical legacy engine and one storage key.
  updateProject:(id,patch)=>trans(w=>{const p=w.projects.find(x=>x.id===id);if(!p)throw Error('Project missing');const name=String(patch.name??p.name).trim().slice(0,180),code=String(patch.code??p.code).trim().slice(0,30);if(!name||!code)throw Error('Project name and code are required');const updated=model.makeProject({...p,name,code,description:patch.description??p.description});return {...w,projects:w.projects.map(x=>x.id===id?updated:x)}},`Updated project ${id}`),
  deleteProject:id=>trans(w=>{if(w.projects.length<2||w.projects.filter(p=>!p.archived).length<2&&!w.projects.find(p=>p.id===id)?.archived)throw Error('Keep one project accessible');if(!w.projects.some(p=>p.id===id))throw Error('Project missing');const projects=w.projects.filter(p=>p.id!==id);return {...projectRelations.removeProjectLinks(w,id),projects,selectedId:w.selectedId===id?projects.find(p=>!p.archived)?.id||projects[0].id:w.selectedId,backups:[model.workspaceSnapshot(w,'Before deleting project'),...w.backups].slice(0,12)}},`Deleted project ${id}`),
  duplicateProject:(id,name)=>{let output=null;const ok=trans(w=>{const src=w.projects.find(x=>x.id===id);if(!src)throw Error('Project missing');if(w.projects.length>=30)throw Error('Project limit');const newid=model.id('project');const copy=model.operations.templateProject(src,{name,code:src.code.slice(0,20)+'COPY',id:newid});model.validateProject(copy);output=newid;return {...w,projects:[...w.projects,copy]}},`Created template from ${id}`);return ok?output:null},
  deleteTask:id=>snapshotChange(p=>model.deleteTaskWithLinks(p,id),`deleting task ${id}`),
  duplicateTask:id=>{let copyId=null;const ok=projectChange(p=>{copyId=model.id('task');return model.kanbanUX.duplicateCard(p,id,copyId)},`Duplicated task ${id}`);return ok?copyId:null},
  addSubtask:(id,title)=>{let created=null;const ok=projectChange(p=>{const parent=p.tasks.find(x=>x.id===id);if(!parent)throw Error('Parent not found');const result=bridge.addTask(p,title,'Backlog',model.boards.effectiveBoard(parent),{});created=result.id;return model.taskWorkflows.setParent(result.project,created,id)},`Added subtask to ${id}`);return ok?created:null},
  togglePowerUp:(boardId,powerId)=>safeMutation(p=>model.powerUps.toggle(p,boardId,powerId),`Toggled board Power-Up ${powerId}`),
  addGithubLink:(taskId,url)=>safeMutation(p=>model.powerUps.addLink(p,taskId,url),'Attached GitHub reference'),
  removeGithubLink:(taskId,url)=>safeMutation(p=>model.powerUps.removeLink(p,taskId,url),'Removed GitHub reference'),
  // Reads the public GitHub API once and stores the result on the link; private repos and rate limits report a notice.
  refreshGithubLink:async(taskId,url)=>{try{const task=current(currentRef.current).tasks.find(t=>t.id===taskId);const link=model.powerUps.normalizeTaskLinks(task?.githubLinks).find(l=>l.url===url);if(!link)throw Error('GitHub link not found');
    const epoch=epochRef.current;const preview=await model.powerUps.fetchPublicPreview(link);if(epoch!==epochRef.current)return false;return safeMutation(p=>model.powerUps.setPreview(p,taskId,url,preview),'Refreshed GitHub reference')}catch(e){notify(e.message||'GitHub refresh failed','error');return false}},
  setBoardView:(boardId,patch)=>safeMutation(p=>model.kanbanUX.setBoardView(p,boardId,patch),'Saved board display preference'),
  saveTaskView:raw=>safeMutation(p=>model.planning.saveView(p,raw),'Saved task view'),
  deleteTaskView:id=>safeMutation(p=>model.planning.removeView(p,id),'Deleted task view'),
  setLabelColor:(name,color)=>projectChange(p=>{const {validColor}=require('../ui/labelPalette.cjs');const key=String(name||'').trim().slice(0,40);if(!key||!validColor(color))throw Error('Invalid label color');return {...p,labelColors:{...(p.labelColors||{}),[key]:color.toUpperCase()}}},`Changed color of label ${name}`),
  setLabels:(id,labels)=>safeMutation(p=>model.kanbanUX.updateLabels(p,id,labels),`Updated tags on ${id}`),
  bulkSet:(ids,field,value)=>safeMutation(p=>model.taskWorkflows.bulkUpdate(p,ids,field,value).project,`Bulk ${field} set to ${value} on ${ids.length} tasks`),
  scheduleAfter:id=>safeMutation(p=>model.gantt.afterPredecessors(p,id),`Moved ${id} after its predecessors`),
  scheduleSample:()=>safeMutation(p=>model.gantt.scheduleSample(p,localDay()),'Scheduled the sample tasks'),
  saveSpec:(kind,entry)=>safeMutation(p=>model.specifications.save(p,kind,entry),`Saved ${model.specifications.KINDS[kind]?.label||'specification'} "${String(entry.name||'').trim()}"`),
  deleteSpec:(kind,id)=>safeMutation(p=>model.specifications.remove(p,kind,id),`Deleted ${model.specifications.KINDS[kind]?.label||'specification'}`),
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
  setGovernanceDocValue:(key,field,value)=>projectChange(p=>{const doc=p.governance.docs[key]||{status:'Not started',values:{}};return {...p,governance:{...p.governance,docs:{...p.governance.docs,[key]:{...doc,values:{...doc.values,[field]:value}}}}}},`Updated ${key} document`),
  setGovernanceDocStatus:(key,status)=>projectChange(p=>{const doc=p.governance.docs[key]||{values:{}};return {...p,governance:{...p.governance,docs:{...p.governance.docs,[key]:{...doc,status}}}}},`Updated ${key} status`),
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
  runDueCommands:()=>safeMutation(p=>{const r=model.automation.run(p,{type:'due'});if(!r.applied.length){notify('No tasks matched.','info');return p}return r.project},'Ran due automation checks'),
  runAgingCommands:()=>safeMutation(p=>{const r=model.automation.run(p,{type:'aging'});if(!r.applied.length){notify('No tasks matched.','info');return p}return r.project},'Ran aging automation checks'),
  createSnapshot:()=>trans(w=>({...w,backups:[model.workspaceSnapshot(w,'Manual recovery snapshot'),...w.backups].slice(0,12)}),'Created recovery snapshot'),
  restoreWorkspace:text=>{try{const payload=parseBackupJson(text);const candidate=payload.format==='niyarvo.workspace.v1'?payload.workspace:payload;const incoming=model.normalizeWorkspace(candidate);const ok=trans(w=>({...incoming,backups:[model.workspaceSnapshot(w,'Before whole-workspace restore'),...incoming.backups].slice(0,12)}),'Restored whole workspace');return {ok,error:ok?'':(lastError.current||'Workspace restore failed')}}catch(e){return {ok:false,error:e.message}}},
  restoreSnapshot:id=>trans(w=>{const snapshot=w.backups.find(x=>x.id===id);if(!snapshot)throw Error('Recovery snapshot missing');return {...model.restoreSnapshot(w,snapshot),backups:[model.workspaceSnapshot(w,'Before restoring snapshot'),...w.backups].slice(0,12)}},`Restored snapshot ${id}`),
 }),[]);
 const dismissNotice=useMemo(()=>()=>setNotice(null),[]);
 const view=useMemo(()=>ws?bridge.projectView(ws):null,[ws]);
 const projects=useMemo(()=>ws?ws.projects.map(p=>({id:p.id,name:p.name,release:p.version,tasks:p.tasks.length,current:p.id===ws.selectedId,archived:p.archived})):[],[ws]);
 const workspaceList=useMemo(()=>idx?{activeId:idx.activeId,items:idx.items}:null,[idx]);
 const context=useMemo(()=>({s:view,projects,workspace:ws,workspaceList,workspaceId:idx?.activeId,error:fault,notice,dismissNotice,...api}),[view,projects,ws,workspaceList,idx,fault,notice,dismissNotice,api]);
 if(!ready)return loading!==undefined?loading:<View style={{flex:1,alignItems:'center',justifyContent:'center',gap:10}}><BoardMorph size={64}/><T weight="600">Opening your workspace</T><T muted size={13}>Projects and tasks stay on this device.</T></View>;
 if(!ws)return <View style={{flex:1,justifyContent:'center',padding:28,gap:12}}><T weight="600">Workspace data could not be opened safely</T><T>{fault}</T><T>Return to your last working release. Do not clear application storage.</T></View>;
 return <ActionsContext.Provider value={api}><StoreContext.Provider value={context}><View style={{flex:1}}>{children}</View></StoreContext.Provider></ActionsContext.Provider>;
}
export const useStore=()=>useContext(StoreContext);
export const useStoreActions=()=>useContext(ActionsContext);
export const useScreenActive=()=>useContext(ActiveContext);
// Wraps a retained-but-hidden screen: while `frozen` it keeps seeing the last visible store value (see freezeCell.cjs).
export function StoreFreeze({frozen,children}){
 const live=useContext(StoreContext);
 const cell=useRef(null);
 if(!cell.current)cell.current=require('../app/navigation/freezeCell.cjs').createFreezeCell(live);
 return <ActiveContext.Provider value={!frozen}><StoreContext.Provider value={cell.current.resolve(live,!!frozen)}>{children}</StoreContext.Provider></ActiveContext.Provider>;
}
