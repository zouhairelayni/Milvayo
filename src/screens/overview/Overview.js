// /src/screens/overview/Overview.js
import { useRenderMetric } from '../../diagnostics/useRenderMetric';
import {useMemo,useState} from 'react';
import {Pressable,View} from 'react-native';
import {Feather} from '@expo/vector-icons';
import { EmptyState, ScreenIntro, Button, Page, Sheet, T, useWide } from '../../ui/ui';
import {WorkloadBalance,ScheduleColumns,StageTrack} from '../../components/charts/StudioCharts';
import DateRail from '../../ui/DateRail';
import Reveal from '../../ui/Reveal';
import {useStore} from '../../store/store';
import {useTheme,STATUS_COLOR} from '../../ui/theme/theme';
import {STAGES,fmt,gatesFor,progressOf} from '../../store/data';
import {useProjectTools} from '../../store/useProjectTools';
import {localDay} from '../../utils/localDay.cjs';
import {todayTasks} from './today.cjs';
const{scheduleSeries,statusSeries}=require('../../domain/dashboard.cjs');

export default function Overview({openTask,go,openStatus,onNewTask,onOpenBackup}){
 useRenderMetric('overview');
 const{c}=useTheme(),wide=useWide(),{s}=useStore(),tools=useProjectTools();
 const[alert,setAlert]=useState(null),[attentionLimit,setAttentionLimit]=useState(8),[date,setDate]=useState(null);
 const today=localDay();
 const [week,setWeek]=useState(0),[focusDate,setFocusDate]=useState(null);
 const anchor=new Date(Date.parse(today+'T12:00:00Z')+week*7*86400000).toISOString().slice(0,10);
 const status=useMemo(()=>statusSeries(s.tasks),[s.tasks]),schedule=useMemo(()=>scheduleSeries(s.tasks,anchor),[s.tasks,anchor]);
 const progress=progressOf(s.tasks),{attention,upcoming}=useMemo(()=>todayTasks(s.tasks,today),[s.tasks,today]);
 const current=s.tasks.filter(t=>focusDate?t.due===focusDate:t.status!=='Done').slice(0,5),release=s.releases.find(r=>r.stage!=='Released'),gates=release?gatesFor(release,s):[];
 const stages=STAGES.map(label=>({label,value:s.tasks.filter(t=>t.stage===label).length}));
 const passed=s.checks.filter(k=>k.status==='passed').length;
 const work=<View style={{gap:20}}>
  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><T size={20} weight="600">{focusDate?`Due ${fmt(focusDate)}`:'Your focus'}</T><Button label="All tasks" variant="ghost" icon="arrow-up-right" onPress={()=>go('tasks')}/></View>
  {current.length?<View>{current.map((t,i)=><Pressable key={t.id} accessibilityRole="button" accessibilityLabel={`Continue task ${t.title}`} onPress={()=>openTask(t.id)}
    style={({pressed})=>({minHeight:92,paddingVertical:16,flexDirection:'row',gap:14,alignItems:'flex-start',borderTopWidth:i?1:0,borderColor:c.line,opacity:pressed?.6:1})}>
    <View style={{width:28,height:28,borderRadius:9,borderWidth:1,borderColor:c.line,alignItems:'center',justifyContent:'center',marginTop:1}}><Feather name="arrow-up-right" size={14} color={c.accent}/></View>
    <View style={{flex:1,gap:9}}><T size={15} weight="500" numberOfLines={2}>{t.title}</T><View style={{flexDirection:'row',alignItems:'center',gap:6,flexWrap:'wrap'}}><View style={{width:5,height:5,borderRadius:3,backgroundColor:STATUS_COLOR[t.status]}}/><T size={11} muted>{t.status}</T>{t.due?<T size={11} muted> · {fmt(t.due)}</T>:null}{t.owner?<T size={11} muted> · {t.owner}</T>:null}</View></View>
   </Pressable>)}</View>:<EmptyState title={focusDate?'A clear day ahead':s.tasks.length?'All tasks complete':'A clear space to begin'} description={focusDate?'No tasks are due on this date. Choose another day or clear the date to see all work.':s.tasks.length?'All current tasks are done. Create new work when you are ready.':'Create your first task. Your plan, progress and schedule will grow from it.'} action={<Button label={focusDate?'Show all work':s.tasks.length?'Create next task':'Add your first task'} icon={focusDate?'arrow-left':'plus'} onPress={focusDate?()=>setFocusDate(null):onNewTask}/>}/>}
  <View style={{paddingVertical:16,borderTopWidth:1,borderColor:c.line,gap:12}}><T size={16} weight="600">Delivery stages</T><StageTrack items={stages}/></View>
  {tools.testing?<Pressable onPress={()=>go('testing')} accessibilityRole="button" accessibilityLabel="Open testing" style={{padding:16,borderRadius:12,backgroundColor:c.surface,flexDirection:'row',alignItems:'center',gap:12}}><Feather name="shield" size={22} color={c.success}/><View style={{flex:1,gap:3}}><T size={14} weight="500">Evidence matters</T><T size={12} muted>{passed} of {s.checks.length} acceptance checks passed</T></View><Feather name="arrow-up-right" size={16} color={c.muted}/></Pressable>:null}
 </View>;
 return <Page title="Overview" intro={false}>
  <ScreenIntro title={s.project.name} description={`${new Date().toLocaleDateString('en',{weekday:'long',month:'short',day:'numeric'})} · Workspace overview`} action={wide?<Button label="New task" icon="plus" onPress={onNewTask}/>:null}/>
  <View style={{gap:12}}><T size={15} weight="500">{week===0?'Next seven days':`${fmt(schedule[0]?.date)} — ${fmt(schedule.at(-1)?.date)}`}</T>
   <DateRail days={schedule} tasks={s.tasks} value={focusDate} onChange={setFocusDate} onShift={delta=>{
    const next=Math.max(-52,Math.min(52,week+delta));if(next===week)return false;
    setWeek(next);setFocusDate(null);return true;
   }}/>
  </View>
  <View style={{flexDirection:wide?'row':'column',gap:wide?28:24,alignItems:'stretch'}}>
   <View style={{flex:wide?1.8:undefined,minWidth:0,gap:16}}>
    <View style={{backgroundColor:c.surface,borderRadius:16,padding:20,gap:18}}>
     <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><T size={17} weight="600">Project pulse</T><T size={12} muted>{s.tasks.length} tasks</T></View>
     <WorkloadBalance series={status} progress={progress} onStatus={openStatus}/>
     <View style={{flexDirection:'row',paddingTop:16,borderTopWidth:1,borderColor:c.line,gap:12}}>
      {[['Needs attention',attention.length,'alert-circle','attention'],['Next due',upcoming.length,'calendar','due']].map(([label,n,icon,id])=><Pressable key={id} accessibilityRole="button" accessibilityLabel={`${label} (${n})`} onPress={()=>{setAlert(id);setAttentionLimit(8)}} style={{flex:1,minHeight:44,flexDirection:'row',gap:10,alignItems:'center'}}><Feather name={icon} size={16} color={id==='attention'&&n?c.warning:c.muted}/><View style={{flex:1,gap:2}}><T size={11} muted>{label}</T><T size={18} weight="500">{n}</T></View><Feather name="chevron-right" size={14} color={c.faint}/></Pressable>)}
     </View>
    </View>
    {!wide?<Reveal key={focusDate||'all'} duration={180} distance={4}>{work}</Reveal>:null}
    <Reveal delay={80} duration={320} style={{backgroundColor:c.surface,borderRadius:16,padding:20}}><ScheduleColumns series={schedule} onOpenDate={d=>{setDate(d.date);setAlert('date')}}/></Reveal>
    {tools.releases?<View style={{gap:16,padding:20,borderRadius:16,borderWidth:1,borderColor:c.line}}>
     <View style={{flexDirection:'row',gap:12,alignItems:'center'}}><View style={{flex:1,gap:4}}><T size={17} weight="600">Release readiness</T><T size={12} muted>{release?.name||'No active release'}</T></View><Button label="Open releases" variant="ghost" icon="arrow-up-right" onPress={()=>go('releases')}/></View>
     {gates.length?<View style={{gap:12}}>{gates.map(g=><View key={g.label} style={{flexDirection:'row',alignItems:'center',gap:10}}><Feather name={g.ok?'check-circle':'circle'} size={16} color={g.ok?c.success:c.faint}/><T size={12} muted style={{flex:1}}>{g.label}</T></View>)}</View>:<EmptyState compact kind="schedule" title="Give delivery a destination" description="Create a release to collect its tasks and evidence."/>}
    </View>:null}
   </View>
   {wide?<Reveal key={focusDate||'all'} duration={180} distance={4} style={{flex:1,minWidth:0,borderLeftWidth:1,borderColor:c.line,paddingLeft:28}}>{work}</Reveal>:null}
  </View>
  {s.project.id==='sample-workspace'||!s.tasks.length?<View style={{paddingTop:20,borderTopWidth:1,borderColor:c.line,gap:12}}><T size={16} weight="500">Make room for your own work</T><View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}><Button label="Import a project" variant="secondary" onPress={onOpenBackup}/><Button label="Open projects" variant="ghost" onPress={()=>go('projects')}/></View></View>:null}
  <Sheet visible={!!alert} title={alert==='attention'?'Needs attention':alert==='date'?`Due ${fmt(date)}`:'Next due'} onClose={()=>setAlert(null)} footer={<Button label="Done" onPress={()=>setAlert(null)}/> }>
   {(()=>{const tasks=alert==='attention'?attention.map(x=>x.task):alert==='date'?s.tasks.filter(t=>t.due===date):upcoming;return tasks.length?<View>{tasks.slice(0,attentionLimit).map(t=><Pressable key={t.id} accessibilityRole="button" accessibilityLabel={`Open task ${t.title}`} onPress={()=>{setAlert(null);openTask(t.id)}} style={{minHeight:68,gap:6,paddingVertical:14,borderBottomWidth:1,borderColor:c.line}}><T weight="500">{t.title}</T><T size={12} muted>{t.status} · {t.due?fmt(t.due):'No date'}</T></Pressable>)}{tasks.length>attentionLimit?<Button label="Show more" variant="ghost" onPress={()=>setAttentionLimit(n=>n+10)}/>:null}</View>:<EmptyState compact kind="schedule" title={alert==='attention'?'Nothing needs attention':'No tasks due here'} description="Your dates and dependencies will surface the work that needs you."/>})()}
  </Sheet>
 </Page>;
}
