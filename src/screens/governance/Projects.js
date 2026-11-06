// /src/screens/governance/Projects.js
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { FlatList, Platform, View, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ActionMenu, EmptyState, ScreenIntro, Bar, Card, Button, Page, Pill, Segmented, Input, T, useWide } from '../../ui/ui';
import { EditRow, Labeled, Dropdown } from '../../components/inline/CompactTools';
import { useStore, useStoreActions } from '../../store/store';
const { projectMetric } = require('../../domain/governanceSummary.cjs');
import { useRenderMetric } from '../../diagnostics/useRenderMetric';
import { useTheme } from '../../ui/theme/theme';
import { useStore as useGovernance } from '../../governance/store';
import { PM_DOCS, DOC_GROUPS, DOC_COLOR, DOC_BY_KEY, docOf, docProgress, PHASES, HEALTH, HEALTH_COLOR } from '../../governance/pm';
import { DocView, BudgetView } from './pm/PmDocs';
import PmRisks from './pm/PmRisks';
import PmWbs from './pm/PmWbs';
import CreateProjectSheet from './CreateProjectSheet';
import TaskMarkdown from '../../components/inline/TaskMarkdown';
import {CompletionArc,BudgetComparison} from '../../components/charts/StudioCharts';
import { Field, Choice, DateInput } from './pm/pmui';

// Project lifecycle lives here; Backup contains files and recovery, not editing.
export function Projects({embedded=false,projectRequest=null,onProjectRequestHandled}){
 useRenderMetric('projects');
 const wide=useWide();
 const {projects,workspace,workspaceId}=useStore();
 const open=useMemo(()=>workspace.projects.filter(p=>!p.archived),[workspace.projects]);
 const [detail,setDetail]=useState(projectRequest),[tab,setTab]=useState('overview');
 // Opened from a portfolio or program: show that project's governance detail.
 useEffect(()=>{if(!projectRequest)return;setDetail(projectRequest);setTab('overview');onProjectRequestHandled?.()},[projectRequest]);
 const [creating,setCreating]=useState(false);
 const [query,setQuery]=useState(''),[limit,setLimit]=useState(20);
 const deferredQuery=useDeferredValue(query),needle=deferredQuery.trim().toLowerCase();
 const matching=useMemo(()=>open.filter(p=>`${p.name} ${p.code}`.toLowerCase().includes(needle)),[open,needle]);
 // A virtualized row can unmount. Keep unsaved editor state scoped to this workspace.
 const drafts=useMemo(()=>new Map(),[workspaceId]);
 useEffect(()=>{const ids=new Set(workspace.projects.map(p=>p.id));for(const id of drafts.keys())if(!ids.has(id))drafts.delete(id);},[workspace.projects,drafts]);
 const openDetail=useCallback(id=>{setDetail(id);setTab('overview')},[]);
 const renderProject=useCallback(({item:p})=><ProjectCard key={p.id} p={p} drafts={drafts} canArchive={open.length>1} canDelete={projects.length>1} onOpen={openDetail}/>,[drafts,open.length,projects.length,openDetail]);
 const header=<View style={{gap:20}}>
  <ScreenIntro title="Your projects" description={`${open.length} active projects · ${projects.length-open.length} archived. Open a project to inspect its delivery and governance.`} action={<Button label="Create project" small icon="plus" onPress={()=>setCreating(true)}/>}/>

  <CreateProjectSheet visible={creating} onClose={()=>setCreating(false)} onCreated={openDetail}/>
  <Input value={query} onChangeText={value=>{setQuery(value);setLimit(20)}} placeholder="Find a project by name or code" accessibilityLabel="Find a project"/>
 </View>;
 const empty=<EmptyState title="No matching projects" description="Try another project name or code." action={<Button label="Clear search" variant="secondary" onPress={()=>setQuery('')}/>}/>;
 const footer=<T size={12} muted>Archived projects can be restored from Settings → Backup → Recover archived projects.</T>;
 const content=<>
  {header}
  {matching.slice(0,limit).map(p=>renderProject({item:p}))}
  {matching.length>limit?<Button label={`Show more projects (${matching.length-limit} remaining)`} variant="secondary" onPress={()=>setLimit(n=>n+20)}/>:null}
  {!matching.length?empty:null}
  {footer}
 </>;
 const selected=workspace.projects.find(p=>p.id===detail&&p.id===workspace.selectedId);
 if(!embedded&&!selected&&Platform.OS!=='web')return <FlatList accessibilityLabel="Projects" data={matching} keyExtractor={p=>p.id} renderItem={renderProject}
  initialNumToRender={2} maxToRenderPerBatch={2} windowSize={5} removeClippedSubviews={false} keyboardShouldPersistTaps="handled"
  ListHeaderComponent={header} ListEmptyComponent={empty} ListFooterComponent={footer}
  contentContainerStyle={{width:'100%',maxWidth:1440,alignSelf:'center',paddingHorizontal:wide?32:16,paddingTop:wide?24:16,paddingBottom:96,gap:wide?24:20}}/>;
 const body=selected?<ProjectGovernance key={detail} back={()=>setDetail(null)} tab={tab} setTab={setTab}/>:content;
 return embedded?body:<Page title={selected?selected.name:undefined} subtitle={selected?'Project governance · PMI documents, health, risks and work breakdown':undefined}>{body}</Page>;
}


// One project card. Its edit fields live here, so typing in one card never re-renders the other cards.
const ProjectCard=memo(function ProjectCard({p,drafts,canArchive,canDelete,onOpen}){
 useRenderMetric('projects/card');
 const {switchProject,updateProject,duplicateProject,archiveProject,deleteProject}=useStoreActions();
 const{c}=useTheme();
 const m=projectMetric(p);
 const [draft,setDraft]=useState(()=>drafts.get(p.id)||null);
 const editing=!!draft,name=draft?.name||'',code=draft?.code||'',description=draft?.description||'';
 const change=next=>{if(next)drafts.set(p.id,next);else drafts.delete(p.id);setDraft(next);};
 const start=()=>change({name:p.name,code:p.code,description:p.description||''});
 const save=()=>{if(updateProject(p.id,{name,code,description}))change(null)};
 return <View style={{padding:20,borderRadius:16,backgroundColor:c.surface,gap:20}}>
   <View style={{flexDirection:'row',alignItems:'center',gap:16}}><CompletionArc value={m.progress} label="complete" size={88}/>
    <View style={{flex:1,gap:6}}><T weight="600" size={19} numberOfLines={2}>{p.name}</T><T muted size={12}>{p.code} · {m.phase}</T><T size={12} color={HEALTH_COLOR[m.health]||c.muted}>{m.health}</T></View>
   </View>
   <View style={{flexDirection:'row',borderTopWidth:1,borderBottomWidth:1,borderColor:c.line,paddingVertical:16,gap:20}}>
    {[['Tasks',m.tasks],['Docs approved',`${m.approvedDocs}/10`],['Open threats',m.risks.length]].map(([label,value])=><View key={label} style={{flex:1,gap:6}}><T size={11} muted style={{minHeight:32}}>{label}</T><T size={22} weight="500">{value}</T></View>)}
   </View>
   <View style={{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:12}}><View style={{flex:1,minWidth:120,gap:4}}><T size={11} muted>Budget used</T><T size={14} weight="500">${Math.round(m.spent).toLocaleString()} <T size={12} muted>/ ${Math.round(m.budget).toLocaleString()}</T></T></View><Button label="Open project" icon="arrow-up-right" onPress={()=>{if(switchProject(p.id)!==false)onOpen(p.id)}}/></View>
   <EditRow title="Project settings" summary="Name, code, description and management" initial={editing}>
    {editing?<View style={{gap:10}}>
     <Labeled title="Name" value={name} onChange={name=>change({...draft,name})}/><Labeled title="Code" value={code} onChange={code=>change({...draft,code})}/>
     <Labeled title="Description" value={description} onChange={description=>change({...draft,description})} markdown/>
     <View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}><Button small label="Save changes" disabled={!name.trim()||!code.trim()} onPress={save}/><Button small label="Cancel" variant="ghost" onPress={()=>change(null)}/></View>
    </View>:p.description?<TaskMarkdown source={p.description}/>:null}
    <ActionMenu label="Project actions" items={[
      {label:'Edit project',icon:'edit-2',onPress:start},
      {label:'Duplicate as template',icon:'copy',confirmation:{title:'Duplicate project as template?',description:'Create an independent project template and stay here.',confirmLabel:'Duplicate',successMessage:'Project template created.'},onPress:()=>duplicateProject(p.id,`${p.name} template`)||false},
      {label:'Archive project',icon:'archive',disabled:!canArchive,description:canArchive?'Hide this project while keeping its data.':'The last active project cannot be archived.',confirmation:{title:'Archive project?',description:'Hide this project without deleting its data.',confirmLabel:'Archive project'},onPress:()=>archiveProject(p.id)},
      {label:'Delete project',icon:'trash-2',danger:true,disabled:!canDelete,description:canDelete?'Removes memberships and creates a recovery snapshot.':'At least one project must remain.',confirmation:{title:'Delete project?',description:'This removes the project and its memberships. A recovery snapshot is created first.',confirmLabel:'Delete project'},onPress:()=>deleteProject(p.id)},
    ]}/>

   </EditRow>
  </View>;
});

// The document list only depends on the document data, so typing in the governance fields above does not rebuild it.
const DocGroups=memo(function DocGroups({pm,setTab}){
 const {c}=useTheme();
 return <>{DOC_GROUPS.map(group=><Card key={group} style={{gap:10}}><T size={13} weight="700">{group}</T>{PM_DOCS.filter(d=>d.group===group).map(d=>{
    const status=docOf(pm,d.key).status,done=docProgress(pm,d.key);
    return <Pressable key={d.key} accessibilityRole="button" accessibilityLabel={`Open ${d.title}`} onPress={()=>setTab(d.key)} style={{gap:6,paddingVertical:7,borderBottomWidth:1,borderColor:c.line}}><View style={{flexDirection:'row',alignItems:'center',gap:8}}><View style={{flex:1,gap:3}}><T weight="600">{d.title}</T><T size={11} muted>{Math.round(done*100)}% complete</T></View><Pill label={status} color={DOC_COLOR[status]}/><Feather name="chevron-right" size={16} color={c.muted}/></View><Bar height={4} value={done} color={DOC_COLOR[status]}/></Pressable>})}</Card>)}</>;
},(a,b)=>a.setTab===b.setTab&&a.pm.docs===b.pm.docs&&a.pm.wbs===b.pm.wbs&&a.pm.budget===b.pm.budget&&a.pm.risks===b.pm.risks);

function ProjectGovernance({back,tab,setTab}){
 useRenderMetric('projects/detail');
 const {s,setPm}=useGovernance();const {workspace}=useStore();const{c}=useTheme();
 const p=workspace.projects.find(x=>x.id===workspace.selectedId); const m=projectMetric(p);
 const info=s.pm.info;const patch=x=>setPm('info',{...info,...x},'Updated project governance');
 const special=tab==='overview'?null:DOC_BY_KEY[tab]?.special;
 return <View style={{gap:14}}>
  <Button label="All projects" icon="arrow-left" small variant="secondary" onPress={back}/>
  <Dropdown options={[{value:'overview',label:'Project overview'},...PM_DOCS.map(d=>({value:d.key,label:d.title}))]} value={tab} onChange={setTab}/>

  {tab==='overview'?<>
   <View style={{flexDirection:'row',alignItems:'center',gap:20}}><CompletionArc value={m.progress} size={112}/><View style={{flex:1,gap:8}}><T size={24} weight="600">{s.project.name}</T><T size={13} muted>{m.approvedDocs}/10 documents approved · {m.risks.length} open threats</T></View></View>
   <View style={{padding:20,backgroundColor:c.surface,borderRadius:16}}><BudgetComparison budget={m.budget} planned={m.planned||0} actual={m.spent} format={n=>'$'+Math.round(n).toLocaleString()}/></View>

   <Card style={{gap:12}}><T size={17} weight="600">Project governance</T>
    <Field label="PMI process group"><Choice options={PHASES} value={info.phase} onChange={v=>patch({phase:v})}/></Field>
    <Field label="Health"><Segmented options={HEALTH} fill value={info.health} onChange={v=>patch({health:v})}/></Field>
    <Field label="Project manager"><Input lazy value={info.manager} onChangeText={v=>patch({manager:v})}/></Field>
    <Field label="Sponsor"><Input lazy value={info.sponsor} onChangeText={v=>patch({sponsor:v})}/></Field>
    <Field label="Customer"><Input lazy value={info.customer} onChangeText={v=>patch({customer:v})}/></Field>
    <Field label="Objective"><Input lazy multiline value={info.objective} onChangeText={v=>patch({objective:v})}/></Field>
    <Field label="Start date"><DateInput allowEmpty value={info.start} onChange={v=>patch({start:v})}/></Field>
    <Field label="End date"><DateInput allowEmpty value={info.end} onChange={v=>patch({end:v})}/></Field>
   </Card>
   <DocGroups pm={s.pm} setTab={setTab}/>
  </>:null}
  {tab!=='overview'&&!special?<DocView docKey={tab}/>:null}
  {special==='budget'?<BudgetView/>:null}
  {special==='wbs'?<PmWbs/>:null}
  {special==='risks'?<PmRisks/>:null}
 </View>
}
