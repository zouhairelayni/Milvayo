import { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Bar, Card, Button, Chip, Page, Pill, Grid, Cell, Stat, Segmented, Input, T } from '../ui';
import { Fold, EditRow, Labeled, DangerConfirm } from './CompactTools';
import { useStore } from '../store';
const { projectSummary } = require('../projectRelations.cjs');
const { projectMetric } = require('../governanceSummary.cjs');
import { useTheme } from '../theme';
import { useStore as useGovernance } from '../governance/store';
import { PM_DOCS, DOC_GROUPS, DOC_COLOR, DOC_BY_KEY, docOf, docProgress, PHASES, HEALTH, HEALTH_COLOR } from '../governance/pm';
import { DocView, BudgetView } from '../governance/screens/PmDocs';
import PmRisks from '../governance/screens/PmRisks';
import PmWbs from '../governance/screens/PmWbs';
import { Field, Choice, DateInput } from '../governance/screens/pmui';

// Project lifecycle lives here; Backup contains files and recovery, not editing.
export function Projects({embedded=false}){
 const {projects,workspace,switchProject,createProject,updateProject,duplicateProject,archiveProject,deleteProject}=useStore();
 const open=workspace.projects.filter(p=>!p.archived);
 const [detail,setDetail]=useState(null),[tab,setTab]=useState('overview');
 const [draft,setDraft]=useState('');
 const [editing,setEditing]=useState(''),[name,setName]=useState(''),[code,setCode]=useState(''),[description,setDescription]=useState('');
 const start=p=>{setEditing(p.id);setName(p.name);setCode(p.code);setDescription(p.description||'')};
 const save=()=>{if(updateProject(editing,{name,code,description}))setEditing('')};
 const content=<>
  <Fold title="Create project" subtitle="A new project starts with an empty board" initial={false}>
   <Labeled title="Project name" value={draft} onChange={setDraft} placeholder="Project name"/>
   <Button label="Create project" small disabled={!draft.trim()} onPress={()=>{if(createProject(draft)){setDraft('')}}}/>
  </Fold>
  {open.map(p=>{const m=projectMetric(p);return <Card key={p.id} style={{gap:12}}>
   <View style={{flexDirection:'row',alignItems:'center',gap:12}}>
    <View style={{flex:1,gap:3}}><T weight="600" size={16} numberOfLines={2}>{p.name}</T><T muted size={12}>{p.code} · {m.tasks} tasks · {m.phase}</T></View>
    <Button label="Details" small variant="secondary" onPress={()=>{switchProject(p.id);setDetail(p.id);setTab('overview')}}/>
   </View>
   <View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}><Pill label={m.health} color={HEALTH_COLOR[m.health]||'#8C8577'}/><T size={12} muted>{Math.round(m.progress*100)}% progress · {m.approvedDocs}/10 approved documents</T></View>
   <Bar value={m.progress} height={5}/><T size={12} muted>Spent ${Math.round(m.spent).toLocaleString()} of ${Math.round(m.budget).toLocaleString()} approved · {m.risks.length} open threats</T>
   <EditRow title="Project settings" summary="Name, code, description and management">
    {editing===p.id?<View style={{gap:10}}>
     <Labeled title="Name" value={name} onChange={setName}/><Labeled title="Code" value={code} onChange={setCode}/>
     <Labeled title="Description" value={description} onChange={setDescription} multiline/>
     <View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}><Button small label="Save changes" disabled={!name.trim()||!code.trim()} onPress={save}/><Button small label="Cancel" variant="ghost" onPress={()=>setEditing('')}/></View>
    </View>:<Button label="Edit project" small variant="secondary" onPress={()=>start(p)}/>}
    <Button label="Duplicate as template" small variant="secondary" onPress={()=>duplicateProject(p.id,`${p.name} template`)}/>
    <T muted size={12}>Archiving hides this project without deleting data. Deleting removes it from portfolios and programs and creates a recovery snapshot.</T>
    {open.length>1?<DangerConfirm label="Archive project" onConfirm={()=>archiveProject(p.id)}/>:<T size={12} muted>Last active project cannot be archived.</T>}
    {projects.length>1?<DangerConfirm label="Delete project" onConfirm={()=>{deleteProject(p.id);if(editing===p.id)setEditing('')}}/>:<T size={12} muted>At least one project must remain.</T>}
   </EditRow>
  </Card>})}
  <T size={12} muted>Archived projects can be restored from Backup → Recover archived projects.</T>
 </>;
 const selected=workspace.projects.find(p=>p.id===detail);
 const body=detail&&selected?<ProjectGovernance key={detail} back={()=>setDetail(null)} tab={tab} setTab={setTab}/>:content;
 return embedded?body:<Page title={detail&&selected?selected.name:'Projects'} subtitle={detail?'Project governance · PMI documents, health, risks and work breakdown':`${open.length} active · ${projects.length-open.length} archived · Manage each project in one workspace.`}>{body}</Page>;
}


function ProjectGovernance({back,tab,setTab}){
 const {c}=useTheme();const {s,setPm,setDocStatus}=useGovernance();const {workspace}=useStore();
 const p=workspace.projects.find(x=>x.id===workspace.selectedId); const m=projectMetric(p);
 const info=s.pm.info;const patch=x=>setPm('info',{...info,...x},'Updated project governance');
 const special=tab==='overview'?null:DOC_BY_KEY[tab]?.special;
 return <View style={{gap:14}}>
  <Button label="All projects" icon="arrow-left" small variant="secondary" onPress={back}/>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:7,paddingVertical:3}}>
   {[{key:'overview',title:'Overview'},...PM_DOCS].map(item=><Chip key={item.key} active={tab===item.key} label={item.title} onPress={()=>setTab(item.key)}/>)}
  </ScrollView>
  {tab==='overview'?<>
   <Grid><Cell mobile="48%" wide="23%"><Stat label="Progress" value={`${Math.round(m.progress*100)}%`}/></Cell><Cell mobile="48%" wide="23%"><Stat label="Spent" value={`$${Math.round(m.spent).toLocaleString()}`}/></Cell><Cell mobile="48%" wide="23%"><Stat label="Budget" value={`$${Math.round(m.budget).toLocaleString()}`}/></Cell><Cell mobile="48%" wide="23%"><Stat label="Approved docs" value={`${m.approvedDocs}/10`}/></Cell></Grid>
   <Card style={{gap:12}}><T size={17} weight="600">Project governance</T>
    <Field label="PMI process group"><Choice options={PHASES} value={info.phase} onChange={v=>patch({phase:v})}/></Field>
    <Field label="Health"><Segmented options={HEALTH} fill value={info.health} onChange={v=>patch({health:v})}/></Field>
    <Field label="Project manager"><Input value={info.manager} onChangeText={v=>patch({manager:v})}/></Field>
    <Field label="Sponsor"><Input value={info.sponsor} onChangeText={v=>patch({sponsor:v})}/></Field>
    <Field label="Customer"><Input value={info.customer} onChangeText={v=>patch({customer:v})}/></Field>
    <Field label="Objective"><Input multiline value={info.objective} onChangeText={v=>patch({objective:v})}/></Field>
    <Field label="Start date"><DateInput allowEmpty value={info.start} onChange={v=>patch({start:v})}/></Field>
    <Field label="End date"><DateInput allowEmpty value={info.end} onChange={v=>patch({end:v})}/></Field>
   </Card>
   {DOC_GROUPS.map(group=><Card key={group} style={{gap:10}}><T size={13} weight="700">{group}</T>{PM_DOCS.filter(d=>d.group===group).map(d=>{
    const status=docOf(s.pm,d.key).status;
    return <Pressable key={d.key} onPress={()=>setTab(d.key)} style={{gap:6,paddingVertical:7,borderBottomWidth:1,borderColor:c.line}}><View style={{flexDirection:'row',alignItems:'center',gap:8}}><View style={{flex:1,gap:3}}><T weight="600">{d.title}</T><T size={11} muted>{Math.round(docProgress(s.pm,d.key)*100)}% complete</T></View><Pill label={status} color={DOC_COLOR[status]}/><Feather name="chevron-right" size={16} color={c.muted}/></View><Bar height={4} value={docProgress(s.pm,d.key)} color={DOC_COLOR[status]}/></Pressable>})}</Card>)}
  </>:null}
  {tab!=='overview'&&!special?<DocView docKey={tab}/>:null}
  {special==='budget'?<BudgetView/>:null}
  {special==='wbs'?<PmWbs/>:null}
  {special==='risks'?<PmRisks/>:null}
 </View>
}
