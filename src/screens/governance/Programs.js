// /src/screens/governance/Programs.js
import { useState } from 'react';
import { View } from 'react-native';
import { Bar, Card, Button, Chip, Page, Sheet, T } from '../../ui/ui';
import { EditRow, Labeled, Pick, DangerConfirm } from '../../components/inline/CompactTools';
import { useTheme } from '../../ui/theme/theme';
import { useStore } from '../../store/store';
import TaskMarkdown from '../../components/inline/TaskMarkdown';
const { STATES } = require('../../domain/programs.cjs');
const { programSummary, portfolioSummary } = require('../../domain/projectRelations.cjs');
const { programMetric }=require('../../domain/governanceSummary.cjs');
import { DateInput } from './pm/pmui';
import { localDay } from '../../utils/localDay.cjs';

// Independent program management. Programs reference portfolios; portfolios own project memberships.
// Older direct project references remain readable and editable for lossless workspace migration.
export function Programs({embedded=false,openProject}){
 const {c}=useTheme();
 const {workspace,projects,saveProgram,deleteProgram,switchProject}=useStore();
 const programs=workspace.programs||[],portfolios=workspace.portfolios||[];
 const [editing,setEditing]=useState(''),[name,setName]=useState(''),[description,setDescription]=useState(''),[status,setStatus]=useState('Planned');
 const [members,setMembers]=useState([]),[legacyMembers,setLegacyMembers]=useState([]);
 const [manager,setManager]=useState(''),[sponsor,setSponsor]=useState(''),[objective,setObjective]=useState(''),[governance,setGovernance]=useState(''),[phase,setPhase]=useState('Definition'),[start,setStart]=useState(''),[end,setEnd]=useState(''),[benefits,setBenefits]=useState([]);
 const select=p=>{setEditing(p?.id||'new');setName(p?.name||'');setDescription(p?.description||'');setStatus(p?.status||'Planned');setMembers(p?.portfolioIds||[]);setLegacyMembers(p?.projectIds||[]);setManager(p?.manager||'');setSponsor(p?.sponsor||'');setObjective(p?.objective||'');setGovernance(p?.governance||'');setPhase(p?.phase||'Definition');setStart(p?.start||'');setEnd(p?.end||'');setBenefits(p?.benefits||[])};
 const open=id=>openProject?openProject(id):switchProject(id);
 const save=()=>{if(saveProgram({id:editing==='new'?'':editing,name,description,status,portfolioIds:members,projectIds:legacyMembers,manager,sponsor,objective,governance,phase,start,end,benefits}))setEditing('')};
 const editor=(<View style={{gap:14}}>
    <Labeled title="Program name" value={name} onChange={setName}/><Labeled title="Description" value={description} onChange={setDescription} markdown/>
    <T muted size={12}>Status</T><Pick values={STATES} value={status} onChange={setStatus}/>
    <Labeled title="Manager" value={manager} onChange={setManager}/><Labeled title="Sponsor" value={sponsor} onChange={setSponsor}/>
    <Labeled title="Objective" value={objective} onChange={setObjective} multiline/><Labeled title="Governance and review cadence" value={governance} onChange={setGovernance} multiline/>
    <T muted size={12}>Lifecycle</T><Pick values={['Definition','Delivery','Closure']} value={phase} onChange={setPhase}/>
    <View style={{gap:8}}><T muted size={12}>Start date</T><DateInput allowEmpty value={start} onChange={setStart}/><T muted size={12}>End date</T><DateInput allowEmpty value={end} onChange={setEnd}/></View>
    <T weight="600">Benefits register</T>{benefits.map((benefit,i)=><Card key={benefit.id} style={{gap:8}}>
     <Labeled title="Benefit" value={benefit.benefit} onChange={v=>setBenefits(arr=>arr.map((b,j)=>i===j?{...b,benefit:v}:b))}/>
     <Labeled title="Target" value={benefit.target} onChange={v=>setBenefits(arr=>arr.map((b,j)=>i===j?{...b,target:v}:b))}/>
     <Labeled title="Owner" value={benefit.owner} onChange={v=>setBenefits(arr=>arr.map((b,j)=>i===j?{...b,owner:v}:b))}/>
     <Pick values={['Planned','Realising','Realised']} value={benefit.status} onChange={v=>setBenefits(arr=>arr.map((b,j)=>i===j?{...b,status:v}:b))}/>
     <Button small variant="danger" label="Remove benefit" onPress={()=>setBenefits(arr=>arr.filter((_,j)=>i!==j))}/></Card>)}
    <Button small variant="secondary" label="Add benefit" onPress={()=>setBenefits(arr=>[...arr,{id:'benefit-'+Date.now(),benefit:'',target:'',owner:'',status:'Planned'}])}/>

    <T muted size={12}>Portfolios included in this program</T>
    {portfolios.length?<View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{portfolios.map(p=><Chip key={p.id} label={p.name} active={members.includes(p.id)} onPress={()=>setMembers(m=>m.includes(p.id)?m.filter(id=>id!==p.id):[...m,p.id])}/>)}</View>:<T muted size={12}>Create a portfolio in the Portfolios tab, then assign it here.</T>}
    {legacyMembers.length?<View style={{gap:7}}><T muted size={12}>Legacy directly linked projects (preserved until you remove them)</T><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{projects.filter(p=>legacyMembers.includes(p.id)).map(p=><Chip key={p.id} active label={p.name+' ×'} onPress={()=>setLegacyMembers(ids=>ids.filter(x=>x!==p.id))}/>)}</View></View>:null}
   </View>);
 const content=<>
  <Sheet visible={!!editing} onClose={()=>setEditing('')} title={editing==='new'?'Create program':'Edit program'} showNotice={false}
   footer={<><Button label="Cancel" small variant="ghost" onPress={()=>setEditing('')}/><Button label="Save program" small disabled={!name.trim()} onPress={save}/></>}>{editor}</Sheet>
  <Button label="Create program" icon="plus" small onPress={()=>select(null)}/>
  {programs.length===0?<T muted size={13}>No programs yet. Create one, then add portfolios to form a Program → Portfolio → Project hierarchy.</T>:null}
  {programs.map(p=>{

   const {portfolios:linkedPortfolios,linked,taskCount,doneCount}=programSummary(workspace,p);
   const nestedIds=new Set(linkedPortfolios.flatMap(x=>x.projectIds||[]));
   const oldDirect=linked.filter(project=>(p.projectIds||[]).includes(project.id)&&!nestedIds.has(project.id));
   const totals=programMetric(workspace,p);
   return <Card key={p.id} style={{gap:12}}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8}}><T size={16} weight="600" style={{flex:1,minWidth:0}} numberOfLines={2}>{p.name}</T><T size={12} color={c.accentText} weight="600">{p.status}</T></View>
    {p.description?<TaskMarkdown source={p.description}/>:null}
    <T size={12} muted>{linkedPortfolios.length} portfolios · {linked.length} unique projects · {doneCount}/{taskCount} tasks done · {totals.health}</T>
    <Bar value={totals.progress} height={6}/><T size={12} muted>{Math.round(totals.progress*100)}% progress · ${Math.round(totals.spent).toLocaleString()} spent of ${Math.round(totals.budget).toLocaleString()} approved</T>
    <EditRow title="Program roadmap" summary={`${totals.list.length} projects · today marker`}>
      {totals.list.filter(q=>q.start&&q.end).map(q=>{const dates=[p.start,...totals.list.map(x=>x.start),p.end,...totals.list.map(x=>x.end)].filter(Boolean).sort();const a=Date.parse(dates[0]),b=Date.parse(dates.at(-1));const span=Math.max(86400000,b-a);const offset=d=>Math.max(0,Math.min(100,100*(Date.parse(d)-a)/span));return <View key={q.id} style={{gap:5}}><T size={12}>{q.name}</T><View style={{height:15,backgroundColor:c.surfaceAlt,borderRadius:8,overflow:'hidden'}}><View style={{position:'absolute',left:`${offset(q.start)}%`,width:`${Math.max(1,offset(q.end)-offset(q.start))}%`,height:'100%',backgroundColor:c.accent,opacity:0.6}}/><View style={{position:'absolute',left:`${offset(localDay())}%`,width:2,height:'100%',backgroundColor:c.ink}}/></View></View>})}
    </EditRow>
    <EditRow title="Benefits register" summary={`${(p.benefits||[]).filter(b=>b.status==='Realised').length}/${(p.benefits||[]).length} realised`}>{(p.benefits||[]).map(b=><T key={b.id} size={12}>{b.benefit} · {b.target} · {b.status}</T>)}{!(p.benefits||[]).length?<T size={12} muted>No benefits yet. Add them when editing the program.</T>:null}</EditRow>
    <EditRow title="Top project risks" summary={`${totals.risks.length} open threats`}>{totals.risks.slice(0,10).map(r=><T key={`${r.projectId}-${r.id}`} size={12}>{r.prob*r.impact}/25 · {r.project} · {r.title}</T>)}</EditRow>

    {linkedPortfolios.map(portfolio=>{
     const projectsInPortfolio=portfolioSummary(workspace,portfolio).linked;
     return <EditRow key={portfolio.id} title={portfolio.name} summary={`${projectsInPortfolio.length} projects in portfolio`}>
      {projectsInPortfolio.length?projectsInPortfolio.map(project=><View key={project.id} style={{flexDirection:'row',gap:8,alignItems:'center',paddingVertical:3}}>
       <T size={12} style={{flex:1,minWidth:0}} numberOfLines={2}>{project.name}</T>
       {!project.archived?<Button small variant="ghost" label="Open project" onPress={()=>open(project.id)}/>:<T size={11} muted>Archived</T>}
      </View>):<T muted size={12}>No projects in this portfolio yet.</T>}
     </EditRow>;
    })}
    {oldDirect.length?<EditRow title="Legacy direct projects" summary={`${oldDirect.length} project links preserved from earlier releases`}>
     {oldDirect.map(project=><View key={project.id} style={{flexDirection:'row',alignItems:'center',gap:8}}><T style={{flex:1}} size={12}>{project.name}</T><Button small variant="ghost" label="Open" onPress={()=>open(project.id)}/></View>)}
     <T muted size={12}>To use the new hierarchy, add these projects to a portfolio and select that portfolio in the program editor.</T>
    </EditRow>:null}
    <EditRow title="Manage program" summary="Change portfolios, status, description or remove">
     <Button small variant="secondary" label="Edit program" onPress={()=>select(p)}/>
     <DangerConfirm label="Delete program" onConfirm={()=>deleteProgram(p.id)}/>
    </EditRow>
   </Card>;
  })}
 </>;
 return embedded?content:<Page title="Programs" subtitle="Coordinate portfolios and their projects without copying tasks or boards.">{content}</Page>;
}
