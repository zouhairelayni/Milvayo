// /src/screens/workspace/Workspace.js
import { Pressable, ScrollView, Switch, View } from 'react-native';
import {Fold,EditRow,Labeled,Pick,Dropdown,DangerConfirm} from '../../components/inline/CompactTools';
import {useState,useEffect} from 'react';
import { Avatar, Bar, Button, Card, Cell, Empty, Grid, Page, Pill, Chip, SectionTitle, Segmented, Stat, T, useWide, downloadText } from '../../ui/ui';
import { useStore } from '../../store/store';
import { useTheme, ACCENTS, PRIORITY_COLOR, STATUS_COLOR } from '../../ui/theme/theme';
import { money, openHours } from '../../store/data';
import DiagnosticsPanel from '../../diagnostics/DiagnosticsPanel';
import Backup from './Backup';
import ProjectToolsSheet from '../more/ProjectToolsSheet';
const operations = require('../../domain/operations.cjs');
import { localDay } from '../../utils/localDay.cjs';

// ---- Resources --------------------------------------------------------------

export function Resources() {
  const { c } = useTheme();
  const {s,addResource,deleteResource,logTime,removeTime,workspace}=useStore();
  const p=workspace.projects.find(x=>x.id===workspace.selectedId);
  const capacity=new Map(operations.capacitySummary(p).map(r=>[r.name,r]));
  const [name,setName]=useState(''),[weekly,setWeekly]=useState('40'),[rate,setRate]=useState('0');
  const [taskId,setTaskId]=useState(''),[owner,setOwner]=useState(''),[date,setDate]=useState(localDay()),[hours,setHours]=useState('1'),[note,setNote]=useState('');
  return (
    <Page title="Resources" subtitle="Weekly capacity against open estimated hours. A simple one-week load view.">
      <Fold title="Manage contributors" subtitle="Add people and manage hourly rates">
        <Labeled title="Name" value={name} onChange={setName}/><Labeled title="Weekly hours" value={weekly} onChange={setWeekly} keyboardType="numeric"/><Labeled title="Hourly rate" value={rate} onChange={setRate} keyboardType="numeric"/>
        <Button label="Add contributor" small onPress={()=>{if(addResource({name,weeklyHours:Number(weekly),hourlyRate:Number(rate)})){setName('');setRate('0')}}}/>
        {s.contributors.map(r=><EditRow key={r.id} title={r.name} summary={`${r.weekly} hours/week · ${r.rate}/hour`}><DangerConfirm label="Remove contributor" onConfirm={()=>deleteResource(r.id)}/></EditRow>)}
      </Fold>
      <Fold title="Time entries" subtitle={`${(p.timeEntries||[]).length} logged work sessions`}>
        <View style={{gap:6}}><T muted size={12} weight="500">Task</T><Dropdown options={s.tasks.map(t=>({value:t.id,label:t.title}))} value={taskId} onChange={setTaskId}/></View>{s.contributors.length?<><T size={12} muted>Contributor</T><Pick values={s.contributors.map(r=>r.name)} value={owner||s.contributors[0].name} onChange={setOwner}/></>:<Labeled title="Contributor" value={owner} onChange={setOwner}/>}<Labeled title="Date YYYY-MM-DD" value={date} onChange={setDate}/><Labeled title="Hours" value={hours} onChange={setHours} keyboardType="numeric"/><Labeled title="Note" value={note} onChange={setNote}/>
        <Button label="Log time" small disabled={!taskId} onPress={()=>{if(logTime({taskId,owner:owner||s.contributors[0]?.name||'',date,hours:Number(hours),note})){setNote('');setTaskId('')}}}/>
        {(p.timeEntries||[]).slice(-50).reverse().map(e=><EditRow key={e.id} title={`${e.owner} · ${e.hours}h`} summary={`${e.date} · ${s.tasks.find(t=>t.id===e.taskId)?.title||e.taskId}`}><T size={12} muted>{e.note||'No note'}</T><DangerConfirm label="Remove time entry" onConfirm={()=>removeTime(e.id)}/></EditRow>)}
      </Fold>
      {s.contributors.map((p) => {
        const open = openHours(s, p.name);
        const load = open / p.weekly;
        return (
          <Card key={p.id} style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar name={p.name} size={36} />
              <View style={{ flex: 1, gap: 2 }}>
                <T weight="600">{p.name}</T>
                <T size={12} muted>{p.role} · ${p.rate}/h</T>
              </View>
              <Pill label={load > 1 ? 'Over capacity' : 'Within capacity'} color={load > 1 ? PRIORITY_COLOR.High : STATUS_COLOR.Done} />
            </View>
            <Bar value={load} height={8} color={load > 1 ? PRIORITY_COLOR.High : c.ink} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T size={12} muted>{Math.round(open)}h open</T>
              <T size={12} muted>{p.weekly}h weekly capacity</T>
            </View>
            {capacity.get(p.name) ? <T size={12} muted>{capacity.get(p.name).assignedTasks} open task{capacity.get(p.name).assignedTasks === 1 ? '' : 's'} · {Math.round(capacity.get(p.name).logged * 100) / 100}h logged</T> : null}
          </Card>
        );
      })}
    </Page>
  );
}

// ---- Costs ------------------------------------------------------------------

export function Costs() {
  const { s, costSummary, setBudget } = useStore();
  const [amount,setAmount]=useState(String(costSummary()?.budget||0)),[currency,setCurrency]=useState(costSummary()?.currency||'USD');
  const summary = costSummary();
  const planned = summary?.plannedCost || 0, actual = summary?.cost || 0;
  const budget = Math.max(1, summary?.budget || 0);
  return (
    <Page title="Costs" subtitle={`${s.project.name} · ${summary?.currency||'USD'} · labour only. Not invoices or purchase orders.`}>
      <Fold title="Budget settings" subtitle={`${summary?.currency||'USD'} · ${summary?.budget||0} budgeted`}>
        <Labeled title="Amount" value={amount} onChange={setAmount} keyboardType="numeric"/><Labeled title="Currency (3 letters)" value={currency} onChange={v=>setCurrency(v.toUpperCase())}/>
        <Button label="Save budget" small onPress={()=>setBudget(Number(amount),currency)}/>
      </Fold>
      <Grid>
        <Cell wide="23%" mobile="48%"><Stat label="Budget" value={money(summary?.budget||0)} /></Cell>
        <Cell wide="23%" mobile="48%"><Stat label="Planned labour" value={money(planned)} hint={`${Math.round((planned / budget) * 100)}% of budget`} /></Cell>
        <Cell wide="23%" mobile="48%"><Stat label="Logged labour" value={money(actual)} hint={`${Math.round((actual / budget) * 100)}% of budget`} /></Cell>
        <Cell wide="23%" mobile="48%"><Stat label="Remaining" value={money(budget - actual)} accent={budget-actual<0?PRIORITY_COLOR.Critical:STATUS_COLOR.Done} /></Cell>
      </Grid>
      <Card style={{ gap: 16 }}>
        <SectionTitle>Against budget</SectionTitle>
        <View style={{ gap: 6 }}>
          <T size={13}>Planned labour</T>
          <Bar value={planned / budget} height={8} color={STATUS_COLOR['In progress']} />
        </View>
        <View style={{ gap: 6 }}>
          <T size={13}>Logged labour</T>
          <Bar value={actual / budget} height={8} color={STATUS_COLOR.Done} />
        </View>
      </Card>
    </Page>
  );
}

// ---- Automations ------------------------------------------------------------

export function Automations(){
 const {s,workspace,toggleRule,sweepDue,saveCommand,deleteCommand,runDueCommands,runAgingCommands,runCommand}=useStore();
 const project=workspace.projects.find(x=>x.id===workspace.selectedId);
 const [name,setName]=useState(''),[trigger,setTrigger]=useState('status'),[status,setStatus]=useState('Done');
 const [action,setAction]=useState('priority'),[value,setValue]=useState('High'),[boardId,setBoardId]=useState('');
 const [edit,setEdit]=useState('');
 const [agingDays,setAgingDays]=useState('7');
 const route=project.automationCommands?.find(x=>x.id==='np-task-checkbox-route');
 const [routeTarget,setRouteTarget]=useState(route?.actions?.find(a=>a.type==='moveStatus')?.value||'Done');
 useEffect(()=>setRouteTarget(route?.actions?.find(a=>a.type==='moveStatus')?.value||'Done'),[project.id,route?.actions?.[0]?.value]);
 const persistRoute=target=>{setRouteTarget(target);saveCommand({id:'np-task-checkbox-route',name:'Task checkmark → '+target,trigger:'status',status:'Done',enabled:true,boardId:'',priorityFilter:'Any',daysBefore:0,actions:[{type:'moveStatus',value:target}]})};
 const [actions,setActions]=useState([]);
 const save=()=>{const d={id:edit||`cmd-${Date.now()}`,name,trigger,status,boardId,enabled:true,priorityFilter:'Any',daysBefore:trigger==='aging'?Math.max(1,Math.min(365,Number(agingDays)||7)):0,actions:actions.length?actions:[{type:action,value}]};if(saveCommand(d)){setEdit('');setName('');setActions([])}};
 return <Page title="Automations" subtitle="Local commands: status, card button, board button and due-date triggers. No background execution."
 actions={<View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}><Button label="Due checks" small variant="secondary" icon="calendar" onPress={runDueCommands}/><Button label="Card aging" small icon="clock" onPress={runAgingCommands}/><Button label="Flag overdue" small variant="secondary" icon="flag" onPress={sweepDue}/></View>}>
  <Fold title="Completion routing" subtitle={`Checked tasks move to ${routeTarget === 'Done' ? 'Done' : 'Validation'}`}>
    <T size={12} muted>Choose what happens after a task is checked. A Validation destination keeps the task uncompleted until approved.</T>
    <Pick values={[{value:'Done',label:'Done'},{value:'Validation',label:'Validation'}]} value={routeTarget} onChange={persistRoute}/>
  </Fold>
  <Fold title="Create automation command" subtitle="One or more validated actions per command">
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
  </Fold>
  <Fold title="Automation commands" subtitle={`${(project.automationCommands||[]).length} commands · recorded execution history`} initial>
   {(project.automationCommands||[]).filter(x=>x.id!=='np-task-checkbox-route').map(x=><EditRow key={x.id} title={x.name} summary={`${x.trigger} → ${x.actions.map(a=>a.type).join(', ')} · ${x.enabled?'enabled':'paused'}`}>
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
     <Button label="Edit" small variant="secondary" onPress={()=>{setEdit(x.id);setName(x.name);setTrigger(x.trigger);setStatus(x.status);setAction(x.actions[0].type);setValue(x.actions[0].value);setActions(x.actions);setBoardId(x.boardId);setAgingDays(String(x.daysBefore||7))}}/>
     <Button label={x.enabled?'Pause':'Enable'} small variant="ghost" onPress={()=>saveCommand({...x,enabled:!x.enabled})}/>
     {x.trigger==='boardButton'?<Button small label="Run" variant="secondary" onPress={()=>runCommand(x.id,'',x.boardId||s.boards[0]?.id)}/>:null}
     <DangerConfirm label="Delete command" onConfirm={()=>deleteCommand(x.id)}/>
    </View>
   </EditRow>)}
  </Fold>
  <Fold title="Rule templates" subtitle="Add a common task workflow without configuring every field">
    <Button label="7-day inactivity → Aging tag" small variant="secondary" onPress={()=>saveCommand({id:'aging-label-7d',name:'Label stale cards after 7 days',trigger:'aging',status:'Any',daysBefore:7,boardId:'',priorityFilter:'Any',enabled:true,actions:[{type:'addLabel',value:'Aging'}]})}/>
    <Button label="Due today → High priority" small variant="secondary" onPress={()=>saveCommand({id:'due-high-priority',name:'Escalate tasks due today',trigger:'due',status:'Done',daysBefore:0,boardId:'',priorityFilter:'Any',enabled:true,actions:[{type:'priority',value:'High'}]})}/>
    <T size={12} muted>Templates are editable and can be paused or deleted in Automation commands.</T>
  </Fold>
  <Fold title="Card aging" subtitle="Local-only rules · no background network service">
    <T size={12} muted>Card age uses the time since the task was last updated. Aging and due-date rules run when you press their check button; you can safely run them again because matching tasks are tracked once per day.</T>
    <Button label="Run card aging rules" small variant="secondary" onPress={runAgingCommands}/>
  </Fold>
  <Fold title="Automation execution history" subtitle={`${(project.automationHistory||[]).length} recorded results`}>
   {(project.automationHistory||[]).slice(0,50).map(h=><View key={h.id} style={{gap:3}}><T size={13}>{h.summary}</T><T size={11} muted>{h.at} · {h.taskId}</T></View>)}
  </Fold>
  <Fold title="Simple status rules" subtitle="Original status-to-action rules">
   {s.automations.map(r=><View key={r.id} style={{flexDirection:'row',alignItems:'center',gap:10}}><T size={13} style={{flex:1}}>{r.name}</T><Switch value={r.on} onValueChange={()=>toggleRule(r.id)}/></View>)}
  </Fold>
 </Page>;
}

// ---- Reports ----------------------------------------------------------------

export function Reports() {
  const { c } = useTheme();
  const { s, tasksCsv, timeCsv } = useStore();
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
          onPress={() => downloadText('niyarvo-tasks.csv', tasksCsv(), 'text/csv')}
        />
      }
    >
      <Fold title="Export time entries" subtitle="Local CSV with captured hours and owners">
        <Button label="Export time CSV" small icon="download" onPress={()=>downloadText('niyarvo-time.csv',timeCsv(),'text/csv')}/>
      </Fold>
      <Card style={{ gap: 14 }}>
        <SectionTitle>Velocity</SectionTitle>
        {!velocity.length ? <T size={13} muted>No completed sprint data yet. Complete a sprint to see velocity.</T> :
          <ScrollView horizontal showsHorizontalScrollIndicator accessibilityLabel="Sprint velocity chart">
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 172, gap: 12, paddingVertical: 6 }}>
              {velocity.map((x) => (
                <View key={x.id} accessibilityLabel={`${x.name}, ${x.velocity} completed tasks`} style={{ width: 86, alignItems: 'center', gap: 7, height: '100%', justifyContent: 'flex-end' }}>
                  <T size={13} weight="600">{x.velocity}</T>
                  <View style={{ width: 36, height: `${Math.max(2, (x.velocity / max) * 70)}%`, borderRadius: 6, backgroundColor: c.ink }} />
                  <T size={12} muted numberOfLines={2} center>{x.name}</T>
                </View>
              ))}
            </View>
          </ScrollView>}
      </Card>
      <Card style={{ gap: 12 }}>
        <SectionTitle>Tasks by status</SectionTitle>
        {['Backlog', 'In progress', 'Validation', 'Done'].map((st) => {
          const n = s.tasks.filter((t) => t.status === st).length;
          return (
            <View key={st} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <T size={13}>{st}</T>
                <T size={13} muted>{n}</T>
              </View>
              <Bar value={n / Math.max(1, s.tasks.length)} height={6} color={STATUS_COLOR[st]} />
            </View>
          );
        })}
      </Card>
    </Page>
  );
}

// ---- Activity ---------------------------------------------------------------

export function Activity() {
  const { c } = useTheme();
  const wide = useWide();
  const { s } = useStore();
  const [visibleCount,setVisibleCount] = useState(50);
  return (
    <Page title="Activity" subtitle="Local history for this workspace. Not a shared audit log.">
      <Card pad={0} style={{ overflow: 'hidden' }}>
        {s.activity.length === 0 ? <Empty>Nothing yet.</Empty> : null}
        {s.activity.slice(0,visibleCount).map((a, i) => (
          <View key={a.id} style={{ flexDirection: wide ? 'row' : 'column', gap: wide ? 14 : 4, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderColor: c.line }}>
            <T size={12} muted style={wide ? { width: 170 } : undefined}>{a.at}</T>
            <T size={13} style={wide ? { flex: 1 } : undefined}>{a.action || a.text || 'Activity recorded'}</T>
          </View>
        ))}
      </Card>
      {s.activity.length > visibleCount ? <Button label={`Show more activity (${s.activity.length-visibleCount} remaining)`} small variant="secondary" onPress={()=>setVisibleCount(n=>n+50)} /> : null}
    </Page>
  );
}

// ---- Settings (includes project, data and appearance) -----------------------

export function Settings({go, backupRequest}) {
  const { c, pref, setPref, accentPref, setAccent } = useTheme();
  const [colorsOpen,setColorsOpen]=useState(false);
  const [toolsOpen,setToolsOpen]=useState(false);
  const [tab,setTab]=useState(backupRequest ? 'backup' : 'general');
  useEffect(() => { if (backupRequest) setTab('backup'); }, [backupRequest]);
  return <Page title="Settings" subtitle={tab==='backup'?'Import, export and recover project data. Files stay on this device.':'Appearance and diagnostics stay on this device.'}>
    <Segmented options={[{value:'general',label:'General'},{value:'backup',label:'Backup'}]} value={tab} onChange={setTab}/>
    {tab==='backup'?<Backup/>:<>
    <Card style={{gap:12}}>
      <SectionTitle>Project tools</SectionTitle>
      <T size={13} muted>Switch the optional tools of this project on or off. Your data stays.</T>
      <Button label="Choose tools" icon="sliders" small variant="secondary" onPress={()=>setToolsOpen(true)}/>
    </Card>
    <ProjectToolsSheet visible={toolsOpen} onClose={()=>setToolsOpen(false)}/>
    <DiagnosticsPanel />
    <Card style={{gap:12}}>
      <SectionTitle>Appearance</SectionTitle>
      <View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}>
        <Chip label="System" active={pref==='system'} onPress={()=>setPref('system')}/>
        <Chip label="Daylight" active={pref==='light'} onPress={()=>setPref('light')}/>
        <Chip label="Dark" active={pref==='dark'} onPress={()=>setPref('dark')}/>
        <Chip label="AMOLED" active={pref==='amoled'} onPress={()=>setPref('amoled')}/>
      </View>
      <View style={{borderTopWidth:1,borderColor:c.line,paddingTop:12,gap:12}}>
        <Button label={`Accent · ${accentPref}`} small icon="droplet" variant="secondary" onPress={()=>setColorsOpen(!colorsOpen)}/>
        {colorsOpen?<View accessibilityRole="radiogroup" style={{flexDirection:'row',flexWrap:'wrap',gap:8,justifyContent:'space-between'}}>{ACCENTS.map(option=>{
          return <Pressable accessibilityRole="radio" accessibilityState={{checked:option.id===accentPref}} accessibilityLabel={`${option.id} accent`} key={option.id} onPress={()=>setAccent(option.id)} style={{width:'16%',flexGrow:1,alignItems:'center',gap:6,paddingVertical:6,minWidth:0}}>
            <View style={{width:46,height:46,borderRadius:12,overflow:'hidden',borderWidth:option.id===accentPref?2:1,borderColor:option.id===accentPref?c.ink:c.line,flexDirection:'row'}}>
              <View style={{backgroundColor:option.start,flex:1}} />
              <View style={{backgroundColor:c.mode==='light'?option.lightPrimary:option.end,flex:1}} />
              {option.id===accentPref?<View style={{position:'absolute',right:2,bottom:2,width:18,height:18,borderRadius:9,backgroundColor:c.ink,alignItems:'center',justifyContent:'center'}}><T size={12} color={c.bg} weight="700">✓</T></View>:null}
            </View><T size={10} numberOfLines={1} color={option.id===accentPref?c.ink:c.muted}>{option.id}</T>
          </Pressable>;
        })}</View>:null}
      </View>
    </Card>
    </>}
  </Page>;
}
