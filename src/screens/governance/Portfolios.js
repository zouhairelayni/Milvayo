// /src/screens/governance/Portfolios.js
import { View } from 'react-native';
import { useState } from 'react';
import { ScreenIntro, Bar, Button, Card, Chip, Page, Pill, Sheet, T } from '../../ui/ui';
import { EditRow, Labeled, DangerConfirm } from '../../components/inline/CompactTools';
import { useStore } from '../../store/store';
import { useTheme } from '../../ui/theme/theme';
import TaskMarkdown from '../../components/inline/TaskMarkdown';
const {portfolioSummary, projectSummary}=require('../../domain/projectRelations.cjs');
const {portfolioMetric}=require('../../domain/governanceSummary.cjs');

// Independent portfolio CRUD. Membership is by project ID; no task data is duplicated.
export default function Portfolios({embedded=false,openProject}) {
 const {c}=useTheme();
 const {projects,workspace,savePortfolio,deletePortfolio,switchProject}=useStore();
 const [editing,setEditing]=useState(null),[name,setName]=useState(''),[description,setDescription]=useState(''),[members,setMembers]=useState([]),[objective,setObjective]=useState(''),[manager,setManager]=useState(''),[status,setStatus]=useState('Active');
 const select=p=>{setEditing(p?.id||'new');setName(p?.name||'');setDescription(p?.description||'');setMembers(p?.projectIds||[]);setObjective(p?.objective||'');setManager(p?.manager||'');setStatus(p?.status||'Active')};
 const open=id=>openProject?openProject(id):switchProject(id);
 const save=()=>{if(savePortfolio({id:editing==='new'?'':editing,name,description,projectIds:members,objective,manager,status})){setEditing(null)}};
 const editor=(<View style={{gap:14}}>
    <Labeled title="Name" value={name} onChange={setName}/><Labeled title="Description" value={description} onChange={setDescription} markdown/><Labeled title="Objective" value={objective} onChange={setObjective} multiline/><Labeled title="Manager" value={manager} onChange={setManager}/><T muted size={12}>Status</T><View style={{flexDirection:'row',gap:7,flexWrap:'wrap'}}>{['Planned','Active','Completed'].map(k=><Chip key={k} label={k} active={status===k} onPress={()=>setStatus(k)}/>)}</View>
    <T size={12} muted>Projects in this portfolio</T>
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:7}}>{projects.map(p=><Chip key={p.id} label={p.name} active={members.includes(p.id)} onPress={()=>setMembers(old=>old.includes(p.id)?old.filter(x=>x!==p.id):[...old,p.id])}/>)}</View>
   </View>);
 const content=<>
  <Sheet visible={!!editing} onClose={()=>setEditing(null)} title={editing==='new'?'Create portfolio':'Edit portfolio'} showNotice={false}
   footer={<><Button label="Cancel" small variant="ghost" onPress={()=>setEditing(null)}/><Button label="Save portfolio" small disabled={!name.trim()} onPress={save}/></>}>{editor}</Sheet>
  <ScreenIntro title="Portfolios" description={`${(workspace.portfolios||[]).length} portfolios · group projects and inspect delivery health.`} action={<Button small label="Create portfolio" icon="plus" onPress={()=>select(null)}/>}/>
  {!(workspace.portfolios||[]).length?<T muted size={13}>No portfolios yet. Create one to group projects, then include it in a program.</T>:null}
  {(workspace.portfolios||[]).map(p=>{

   const linked=portfolioSummary(workspace,p).linked; const totals=portfolioMetric(workspace,p);
   const total=linked.reduce((n,project)=>n+projectSummary(project).taskCount,0);
   const done=linked.reduce((n,project)=>n+projectSummary(project).doneCount,0);
   return <Card key={p.id} style={{gap:12}}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8}}>
     <T size={16} weight="600" style={{flex:1,minWidth:0}} numberOfLines={2}>{p.name}</T>
     <Pill label={`${linked.length} projects`} color={c.accent}/>
    </View>
    {p.description?<TaskMarkdown source={p.description}/>:null}
    <Bar value={total?done/total:0} height={6}/>
    <T size={12} muted>{done} of {total} tasks done · ${Math.round(totals.spent).toLocaleString()} spent of ${Math.round(totals.budget).toLocaleString()} approved · {totals.health}</T>
    <EditRow title="Projects in portfolio" summary={`${linked.length} projects · tap to inspect`}>
     {linked.length?linked.map(project=><View key={project.id} style={{flexDirection:'row',alignItems:'center',gap:8,paddingVertical:3}}><T size={12} numberOfLines={2} style={{flex:1,minWidth:0}}>{project.name}</T>{!project.archived?<Button small variant="ghost" label="Open" onPress={()=>open(project.id)}/>:<T size={11} muted>Archived</T>}</View>):<T size={12} muted>No projects assigned yet.</T>}
    </EditRow>
    <EditRow title="Manage portfolio" summary="Edit membership or delete without deleting projects">
     <Button label="Edit portfolio" small variant="secondary" onPress={()=>select(p)}/>
     <DangerConfirm label="Delete portfolio" onConfirm={()=>deletePortfolio(p.id)}/>
     <T muted size={12}>Deleting a portfolio removes it from programs, but does not delete its projects.</T>
    </EditRow>
   </Card>;
  })}
 </>;
 return embedded?content:<Page title="Portfolios" subtitle="Group independent projects and manage program membership.">{content}</Page>;
}
