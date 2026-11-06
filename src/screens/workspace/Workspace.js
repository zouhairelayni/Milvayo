// /src/screens/workspace/Workspace.js
import {Feather} from '@expo/vector-icons';
import { Platform, Image, Pressable, ScrollView, Switch, View } from 'react-native';
import {Fold,EditRow,Labeled,Pick,Dropdown,DangerConfirm} from '../../components/inline/CompactTools';
import {useState,useEffect,useMemo} from 'react';
import { InlineDateField, ActionRow, ActionMenu, AppearanceChoices, ConfirmSheet, EmptyState, Feedback, FormSection, MetricStrip, Input, ScreenIntro, Avatar, Bar, Button, Card, Cell, Empty, Grid, Page, Pill, Chip, Sheet, SectionTitle, Segmented, Stat, T, useWide, downloadText } from '../../ui/ui';
import { useStore, useStoreActions } from '../../store/store';
import { useTheme, ACCENTS, PRIORITY_COLOR, STATUS_COLOR } from '../../ui/theme/theme';
import { money, openHours } from '../../store/data';
import DiagnosticsPanel from '../../diagnostics/DiagnosticsPanel';
import Backup from './Backup';
import { syncLauncherIcon } from '../../ui/theme/launcherIcon';
const iconPreview = require('../../ui/theme/iconPreview.cjs');
const operations = require('../../domain/operations.cjs');
import {StatusOrbit,HistoryArea,BudgetComparison,CompletionArc,ScheduleColumns} from '../../components/charts/StudioCharts';
const{statusSeries,scheduleSeries}=require('../../domain/dashboard.cjs');
import { localDay } from '../../utils/localDay.cjs';

// ---- Resources --------------------------------------------------------------

export function Resources() {
  const { c } = useTheme();
  const {s,addResource,deleteResource,logTime,removeTime,workspace}=useStore();
  const p=workspace.projects.find(x=>x.id===workspace.selectedId);
  const capacity=useMemo(()=>new Map(operations.capacitySummary(p).map(r=>[r.name,r])),[p]);
  const [panel,setPanel]=useState(null);
  const [name,setName]=useState(''),[weekly,setWeekly]=useState('40'),[rate,setRate]=useState('0');
  const [taskId,setTaskId]=useState(''),[owner,setOwner]=useState(''),[date,setDate]=useState(localDay()),[hours,setHours]=useState('1'),[note,setNote]=useState('');
  return (
    <Page title="Team capacity" subtitle="Understand the work people can take on this week." actions={<ActionRow primary={<Button label="Add contributor" icon="user-plus" onPress={()=>setPanel('people')}/>}><Button label="Log time" icon="clock" variant="secondary" onPress={()=>setPanel('time')}/></ActionRow>}>
      <MetricStrip items={[{label:'Contributors',value:s.contributors.length},{label:'Weekly capacity',value:s.contributors.reduce((n,r)=>n+r.weekly,0)+'h'},{label:'Work sessions',value:(p.timeEntries||[]).length}]}/>
      {!s.contributors.length?<EmptyState kind="people" title="Make room for your team" description="Add contributors and their weekly hours to see capacity alongside project work."/>:null}
      <Sheet visible={panel==='people'} onClose={()=>setPanel(null)} title="Manage contributors" footer={<Button label="Done" onPress={()=>setPanel(null)}/>} >
        <Labeled title="Name" value={name} onChange={setName}/><Labeled title="Weekly hours" value={weekly} onChange={setWeekly} keyboardType="numeric"/><Labeled title="Hourly rate" value={rate} onChange={setRate} keyboardType="numeric"/>
        <Button label="Add contributor" small onPress={()=>{if(addResource({name,weeklyHours:Number(weekly),hourlyRate:Number(rate)})){setName('');setRate('0')}}}/>
        {s.contributors.map(r=><EditRow key={r.id} title={r.name} summary={`${r.weekly} hours/week · ${r.rate}/hour`}><DangerConfirm label="Remove contributor" onConfirm={()=>deleteResource(r.id)}/></EditRow>)}
      </Sheet>
      <Sheet visible={panel==='time'} onClose={()=>setPanel(null)} title="Time entries" footer={<Button label="Done" onPress={()=>setPanel(null)}/>} >
        <View style={{gap:6}}><T muted size={12} weight="500">Task</T><Dropdown options={s.tasks.map(t=>({value:t.id,label:t.title}))} value={taskId} onChange={setTaskId}/></View>{s.contributors.length?<><T size={12} muted>Contributor</T><Pick values={s.contributors.map(r=>r.name)} value={owner||s.contributors[0].name} onChange={setOwner}/></>:<Labeled title="Contributor" value={owner} onChange={setOwner}/>}<InlineDateField label="Work date" value={date} onChange={setDate} allowEmpty={false}/><Labeled title="Hours" value={hours} onChange={setHours} keyboardType="numeric"/><Labeled title="Note" value={note} onChange={setNote}/>
        <Button label="Log time" small disabled={!taskId} onPress={()=>{if(logTime({taskId,owner:owner||s.contributors[0]?.name||'',date,hours:Number(hours),note})){setNote('');setTaskId('')}}}/>
        {(p.timeEntries||[]).slice(-50).reverse().map(e=><EditRow key={e.id} title={`${e.owner} · ${e.hours}h`} summary={`${e.date} · ${s.tasks.find(t=>t.id===e.taskId)?.title||e.taskId}`}><T size={12} muted>{e.note||'No note'}</T><DangerConfirm label="Remove time entry" onConfirm={()=>removeTime(e.id)}/></EditRow>)}
      </Sheet>
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:12}}>
      {s.contributors.map((p) => {
        const open = openHours(s, p.name);
        const load = p.weekly>0?open/p.weekly:open>0?2:0;
        return (
          <View key={p.id} style={{flexBasis:'46%',flexGrow:1,minWidth:260,padding:20,borderRadius:16,backgroundColor:c.surface,gap:20}}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar name={p.name} size={36} />
              <View style={{ flex: 1, gap: 2 }}>
                <T weight="600">{p.name}</T>
                <T size={12} muted>{p.role} · ${p.rate}/h</T>
              </View>
              <Pill label={load > 1 ? 'Over capacity' : 'Within capacity'} color={load > 1 ? PRIORITY_COLOR.High : STATUS_COLOR.Done} />
            </View>
            <View style={{flexDirection:'row',alignItems:'center',gap:16}}><CompletionArc value={load} label="capacity" size={88} color={load>1?c.warning:c.accent}/><View style={{gap:5}}><T size={26} weight="500">{Math.round(open)}<T muted size={13}> h</T></T><T size={12} muted>of {p.weekly}h available</T></View></View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T size={12} muted>{Math.round(open)}h open</T>
              <T size={12} muted>{p.weekly}h weekly capacity</T>
            </View>
            {capacity.get(p.name) ? <T size={12} muted>{capacity.get(p.name).assignedTasks} open task{capacity.get(p.name).assignedTasks === 1 ? '' : 's'} · {Math.round(capacity.get(p.name).logged * 100) / 100}h logged</T> : null}
          </View>
        );
      })}
      </View>
    </Page>
  );
}

// ---- Costs ------------------------------------------------------------------

export function Costs() {
  const {c}=useTheme();
  const { s, costSummary, setBudget } = useStore();
  const summary=costSummary();
  const [amount,setAmount]=useState(String(summary?.budget||0)),[currency,setCurrency]=useState(summary?.currency||'USD');
  const [budgetOpen,setBudgetOpen]=useState(false);
  const planned = summary?.plannedCost || 0, actual = summary?.cost || 0;
  const budget = Math.max(1, summary?.budget || 0),remaining=(summary?.budget||0)-actual;
  return (
    <Page title="Cost overview" subtitle={`${s.project.name} · ${summary?.currency||'USD'} labour costs. Invoice and payment processing are not connected.`} actions={<Button label="Edit budget" icon="edit-2" onPress={()=>setBudgetOpen(true)}/>} >
      <Sheet visible={budgetOpen} title="Budget settings" onClose={()=>setBudgetOpen(false)}>
        <Labeled title="Amount" value={amount} onChange={setAmount} keyboardType="numeric"/><Labeled title="Currency (3 letters)" value={currency} onChange={v=>setCurrency(v.toUpperCase())}/>
        <Button label="Save budget" small onPress={()=>{if(setBudget(Number(amount),currency))setBudgetOpen(false);}}/>
      </Sheet>
      <MetricStrip items={[
        {label:'Budget',value:money(summary?.budget||0)},
        {label:'Planned labour',value:money(planned)},
        {label:'Logged labour',value:money(actual)},
        {label:'Remaining',value:money(remaining),color:remaining<0?c.danger:STATUS_COLOR.Done},
      ]}/>

      <View style={{padding:24,borderRadius:16,backgroundColor:c.surface,gap:24}}>
        <View style={{gap:4}}><T size={18} weight="600">The cost of your plan</T><T size={13} muted>Approved, planned and spent on one scale.</T></View>
        <BudgetComparison budget={summary?.budget||0} planned={planned} actual={actual} format={money}/>
      </View>

    </Page>
  );
}

// ---- Automations ------------------------------------------------------------

export function Automations(){
 const {s,workspace,toggleRule,sweepDue,saveCommand,deleteCommand,runDueCommands,runAgingCommands,runCommand}=useStore();
 const project=workspace.projects.find(x=>x.id===workspace.selectedId);
 const [name,setName]=useState(''),[trigger,setTrigger]=useState('status'),[status,setStatus]=useState('Done');
 const [action,setAction]=useState('priority'),[value,setValue]=useState('High'),[boardId,setBoardId]=useState('');
 const [edit,setEdit]=useState(''),[editorOpen,setEditorOpen]=useState(false);
 const [agingDays,setAgingDays]=useState('7');
 const [area,setArea]=useState('commands');
 const route=project.automationCommands?.find(x=>x.id==='np-task-checkbox-route');
 const [routeTarget,setRouteTarget]=useState(route?.actions?.find(a=>a.type==='moveStatus')?.value||'Done');
 useEffect(()=>setRouteTarget(route?.actions?.find(a=>a.type==='moveStatus')?.value||'Done'),[project.id,route?.actions?.[0]?.value]);
 const persistRoute=target=>{setRouteTarget(target);saveCommand({id:'np-task-checkbox-route',name:'Task checkmark → '+target,trigger:'status',status:'Done',enabled:true,boardId:'',priorityFilter:'Any',daysBefore:0,actions:[{type:'moveStatus',value:target}]})};
 const [actions,setActions]=useState([]);
 const save=()=>{const d={id:edit||`cmd-${Date.now()}`,name,trigger,status,boardId,enabled:true,priorityFilter:'Any',daysBefore:trigger==='aging'?Math.max(1,Math.min(365,Number(agingDays)||7)):0,actions:actions.length?actions:[{type:action,value}]};if(saveCommand(d)){setEdit('');setName('');setActions([]);setEditorOpen(false)}};
 return <Page title="Automations" subtitle="Local commands: status, card button, board button and due-date triggers. No background execution."
 actions={<ActionRow primary={<Button label="New command" icon="plus" onPress={()=>{setEdit('');setEditorOpen(true);}}/>} menuLabel="Run checks" items={[
  {label:'Due checks',icon:'calendar',onPress:runDueCommands},
  {label:'Card aging',icon:'clock',onPress:runAgingCommands},
  {label:'Flag overdue',icon:'flag',onPress:sweepDue},
 ]}/>}>
  <Segmented fill options={[{value:'commands',label:'Commands'},{value:'library',label:'Library'},{value:'history',label:'History'}]} value={area} onChange={setArea}/>
  <View style={{display:area==='library'?'flex':'none',gap:16}}>
  <Fold title="Completion routing" subtitle={`Checked tasks move to ${routeTarget === 'Done' ? 'Done' : 'Validation'}`}>
    <T size={12} muted>Choose what happens after a task is checked. A Validation destination keeps the task uncompleted until approved.</T>
    <Pick values={[{value:'Done',label:'Done'},{value:'Validation',label:'Validation'}]} value={routeTarget} onChange={persistRoute}/>
  </Fold>
  </View>
  <Sheet visible={editorOpen} title={edit?'Edit command':'Create automation command'} onClose={()=>setEditorOpen(false)}>
   <Labeled title="Rule name" value={name} onChange={setName}/>
   <Pick values={['status','cardButton','boardButton','due','aging']} value={trigger} onChange={v=>{setTrigger(v);setStatus(v==='aging'?'Any':'Done')}}/>
   {(trigger==='status'||trigger==='aging')?<Pick values={trigger==='aging'?['Any','Backlog','In progress','Validation']:['Backlog','In progress','Validation','Done']} value={status} onChange={setStatus}/>:null}
   {trigger==='aging'?<Labeled title="Inactive for at least (days)" value={agingDays} onChange={setAgingDays} keyboardType="numeric"/>:null}
   <T size={12} muted>Action</T><Pick values={['moveStatus','priority','owner','stage','addLabel','dueDays','comment']} value={action} onChange={v=>{setAction(v);if(v==='moveStatus')setValue('Validation')}}/>
   {action==='moveStatus'?<Pick values={['Backlog','In progress','Validation','Done']} value={value} onChange={setValue}/>:null}
   {action!=='moveStatus'?<Labeled title="Action value" value={value} onChange={setValue}/>:null}
   <Button label="Add action to command" small variant="secondary" onPress={()=>setActions(a=>a.length>=8?a:[...a,{type:action,value}])}/>
   {actions.map((a,i)=><EditRow key={i} title={`${i+1}. ${a.type}`} summary={a.value}><Button small label="Remove action" variant="ghost" onPress={()=>setActions(x=>x.filter((_,j)=>j!==i))}/></EditRow>)}
   <Button label={edit?'Update command':'Create command'} small onPress={save}/>
  </Sheet>
  <View style={{display:area==='commands'?'flex':'none',gap:16}}>
  <T size={16} weight="600">Automation commands · {(project.automationCommands||[]).length}</T>
   {!(project.automationCommands||[]).filter(x=>x.id!=='np-task-checkbox-route').length?<EmptyState title="Let repeatable work run simply" description="Create a local command or choose a rule template below. Nothing runs in the cloud." action={<Button label="Create command" onPress={()=>setEditorOpen(true)}/>}/>:null}
   {(project.automationCommands||[]).filter(x=>x.id!=='np-task-checkbox-route').map(x=><EditRow key={x.id} title={x.name} summary={`${x.trigger} → ${x.actions.map(a=>a.type).join(', ')} · ${x.enabled?'enabled':'paused'}`}>
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
     <Button label="Edit" small variant="secondary" onPress={()=>{setEdit(x.id);setName(x.name);setTrigger(x.trigger);setStatus(x.status);setAction(x.actions[0].type);setValue(x.actions[0].value);setActions(x.actions);setBoardId(x.boardId);setAgingDays(String(x.daysBefore||7));setEditorOpen(true)}}/>
     <Button label={x.enabled?'Pause':'Enable'} small variant="ghost" onPress={()=>saveCommand({...x,enabled:!x.enabled})}/>
     {x.trigger==='boardButton'?<Button small label="Run" variant="secondary" onPress={()=>runCommand(x.id,'',x.boardId||s.boards[0]?.id)}/>:null}
     <DangerConfirm label="Delete command" onConfirm={()=>deleteCommand(x.id)}/>
    </View>
   </EditRow>)}
  </View>
  <View style={{display:area==='library'?'flex':'none',gap:16}}>
  <Fold title="Rule templates" subtitle="Add a common task workflow without configuring every field">
    <Button label="7-day inactivity → Aging tag" small variant="secondary" onPress={()=>saveCommand({id:'aging-label-7d',name:'Label stale cards after 7 days',trigger:'aging',status:'Any',daysBefore:7,boardId:'',priorityFilter:'Any',enabled:true,actions:[{type:'addLabel',value:'Aging'}]})}/>
    <Button label="Due today → High priority" small variant="secondary" onPress={()=>saveCommand({id:'due-high-priority',name:'Escalate tasks due today',trigger:'due',status:'Done',daysBefore:0,boardId:'',priorityFilter:'Any',enabled:true,actions:[{type:'priority',value:'High'}]})}/>
    <T size={12} muted>Templates are editable and can be paused or deleted in Automation commands.</T>
  </Fold>
  <Fold title="Card aging" subtitle="Local-only rules · no background network service">
    <T size={12} muted>Card age uses the time since the task was last updated. Aging and due-date rules run when you press their check button; you can safely run them again because matching tasks are tracked once per day.</T>
    <Button label="Run card aging rules" small variant="secondary" onPress={runAgingCommands}/>
  </Fold>
  </View><View style={{display:area==='history'?'flex':'none',gap:16}}><T size={18} weight="600">Execution history</T>
   {!(project.automationHistory||[]).length?<EmptyState kind="schedule" title="Every run has a record" description="Run a command or check to see its result here. Your history stays local."/>:null}
   {(project.automationHistory||[]).slice(0,50).map(h=><View key={h.id} style={{gap:3}}><T size={13}>{h.summary}</T><T size={11} muted>{h.at} · {h.taskId}</T></View>)}
  </View>
  <View style={{display:area==='library'?'flex':'none'}}>
  <Fold title="Simple status rules" subtitle="Original status-to-action rules">
   {s.automations.map(r=><View key={r.id} style={{flexDirection:'row',alignItems:'center',gap:10}}><T size={13} style={{flex:1}}>{r.name}</T><Switch value={r.on} onValueChange={()=>toggleRule(r.id)}/></View>)}
  </Fold>
  </View>
 </Page>;
}

// ---- Reports ----------------------------------------------------------------

export function Reports({go}) {
  const { c } = useTheme();
  const { s, tasksCsv, timeCsv } = useStore();
  const [report,setReport]=useState('status');
  const velocity = s.sprints.filter((x) => x.velocity != null);
  const max = Math.max(1, ...velocity.map((x) => x.velocity));
  return (
    <Page
      title="Reports"
      subtitle="Sprint velocity and task exports."
      actions={
        <Button
          label="Export tasks CSV"
          icon="download"
          small
          onPress={() => downloadText('milvayo-tasks.csv', tasksCsv(), 'text/csv')}
        />
      }
    >
      <Segmented fill options={[{value:'status',label:'Work status'},{value:'velocity',label:'Velocity'},{value:'exports',label:'Exports'}]} value={report} onChange={setReport}/>
      {report==='exports'?<><Feedback text="Exports contain local records and evidence. No remote project or payment service is contacted."/>
      <Fold title="Export time entries" subtitle="Local CSV with captured hours and owners">
        <Button label="Export time CSV" small icon="download" onPress={()=>downloadText('milvayo-time.csv',timeCsv(),'text/csv')}/>
      </Fold>
      </>:null}
      {report==='velocity'?<View style={{backgroundColor:c.surface,borderRadius:16,padding:20,gap:16}}>
        <HistoryArea series={velocity.filter(x=>x.state==='completed').map(x=>({id:x.id,label:x.name,value:x.velocity||0}))}/>
        {!velocity.length&&go?<Button label="Open sprints" variant="secondary" onPress={()=>go('sprints')}/>:null}
      </View>:null}
      {report==='status'?<View style={{gap:16}}>
        <View style={{padding:20,borderRadius:16,backgroundColor:c.surface,gap:20}}><T size={18} weight="600">Work distribution</T><StatusOrbit caption="completed tasks" series={statusSeries(s.tasks)} progress={s.tasks.length?s.tasks.filter(t=>t.status==='Done').length/s.tasks.length:0}/></View>
        <View style={{padding:20,borderRadius:16,backgroundColor:c.surface}}><ScheduleColumns series={scheduleSeries(s.tasks,localDay())}/></View>
      </View>:null}
    </Page>
  );
}

// ---- Activity ---------------------------------------------------------------

export function Activity() {
  const { c } = useTheme();
  const wide = useWide();
  const { s } = useStore();
  const [visibleCount,setVisibleCount] = useState(50),[query,setQuery]=useState('');
  const entries=s.activity.filter(a=>`${a.at} ${a.action||a.text||''}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <Page title="Workspace history" subtitle="A local record of project changes. This is not a shared audit log.">
      <Input value={query} lazy onChangeText={value=>{setQuery(value);setVisibleCount(50);}} placeholder="Find a change" accessibilityLabel="Search workspace history"/>
      <Card pad={0} style={{ overflow: 'hidden' }}>
        {entries.length === 0 ? <EmptyState title="Your work leaves a trail" description="Project changes appear here as you work. This history stays on this device."/> : null}
        {entries.slice(0,visibleCount).map((a, i) => (
          <View key={a.id} style={{ flexDirection: wide ? 'row' : 'column', gap: wide ? 14 : 4, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: i ? 1 : 0, borderColor: c.line }}>
            <T size={12} muted style={wide ? { width: 170 } : undefined}>{a.at}</T>
            <T size={13} style={wide ? { flex: 1 } : undefined}>{a.action || a.text || 'Activity recorded'}</T>
          </View>
        ))}
      </Card>
      {entries.length > visibleCount ? <Button label={`Show more activity (${entries.length-visibleCount} remaining)`} small variant="secondary" onPress={()=>setVisibleCount(n=>n+50)} /> : null}
    </Page>
  );
}

// ---- Settings (includes project, data and appearance) -----------------------

export function Settings({go, backupRequest}) {
  const { flush } = useStoreActions();
  const { c, pref, mode, setPref, accentPref, setAccent } = useTheme();
  const [colorsOpen,setColorsOpen]=useState(false),[iconConfirm,setIconConfirm]=useState(false);
  const [tab,setTab]=useState(backupRequest ? 'backup' : 'general');
  useEffect(() => { if (backupRequest) setTab('backup'); }, [backupRequest]);
  return <Page title="Settings" subtitle={tab==='backup'?'Import, export and recover project data. Files stay on this device.':'Appearance and diagnostics stay on this device.'}>
    <ScreenIntro title="Preferences & data" description="Appearance, local diagnostics and safe backup recovery."/>
    <Segmented options={[{value:'general',label:'General'},{value:'backup',label:'Backup'}]} value={tab} onChange={setTab}/>
    {tab==='backup'?<Backup/>:<>
    <Card style={{gap:12}}>
      <SectionTitle>Appearance</SectionTitle>
      <View style={{flexDirection:'row',alignItems:'center',gap:12}}>
        <Image source={iconPreview(accentPref, mode)} resizeMode="contain" style={{width:54,height:54,borderRadius:14}} accessibilityLabel={`${accentPref} ${mode} app icon preview`}/>
        <View style={{flex:1,gap:3}}>
          <T weight="600">App icon preview</T>
          <T muted size={12}>Theme changes apply immediately inside the app. Apply the launcher icon separately when ready: Android may close the app. Expo Go cannot change its icon.</T>
        </View>
      </View>
      {Platform.OS !== 'web'?<Button label="Apply launcher icon" variant="secondary" onPress={()=>setIconConfirm(true)}/>:null}
      {iconConfirm?<ConfirmSheet visible title="Apply launcher icon?" confirmLabel="Apply icon" description="Android may close Milvayo to refresh its launcher entry. Your work is saved first. Cancel to keep working; Expo Go cannot change its icon." onClose={()=>setIconConfirm(false)} onConfirm={()=>syncLauncherIcon(accentPref,mode,flush)}/>:null}
      <AppearanceChoices value={pref} onChange={setPref} accent={accentPref}/>
      <View style={{borderTopWidth:1,borderColor:c.line,paddingTop:12,gap:12}}>
        <Button label={`Accent · ${accentPref}`} small icon="droplet" variant="secondary" onPress={()=>setColorsOpen(!colorsOpen)}/>
        {colorsOpen?<View accessibilityRole="radiogroup" style={{flexDirection:'row',flexWrap:'wrap',gap:8,justifyContent:'space-between'}}>{ACCENTS.map(option=>{
          return <Pressable accessibilityRole="radio" accessibilityState={{checked:option.id===accentPref}} accessibilityLabel={`${option.id} accent`} key={option.id} onPress={()=>setAccent(option.id)} style={{width:'22%',flexGrow:1,alignItems:'center',gap:6,paddingVertical:6,minWidth:0}}>
            <View style={{width:46,height:46,borderRadius:12,overflow:'hidden',borderWidth:option.id===accentPref?2:1,borderColor:option.id===accentPref?c.ink:c.line,flexDirection:'row'}}>
              <View style={{backgroundColor:option.start,flex:1}} />
              <View style={{backgroundColor:c.mode==='light'?option.lightPrimary:option.end,flex:1}} />
              {option.id===accentPref?<View style={{position:'absolute',right:2,bottom:2,width:18,height:18,borderRadius:9,backgroundColor:c.ink,alignItems:'center',justifyContent:'center'}}><Feather name="check" size={12} color={c.bg}/></View>:null}
            </View><T size={12} numberOfLines={1} color={option.id===accentPref?c.ink:c.muted}>{option.id}</T>
          </Pressable>;
        })}</View>:null}
      </View>
    </Card>
    <Fold title="Local diagnostics" subtitle="Performance and crash evidence for this device"><DiagnosticsPanel /></Fold>

    </>}
  </Page>;
}
