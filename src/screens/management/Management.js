// /src/screens/management/Management.js
import {useState} from 'react';
import {View} from 'react-native';
import {Page,T,Button,Chip} from '../../ui/ui';
import {useStore} from '../../store/store';
import {Fold,EditRow,Labeled,Pick,Dropdown,DangerConfirm} from '../../components/inline/CompactTools';
import { localDay } from '../../utils/localDay.cjs';
const model=require('../../domain/model.cjs');
const today=localDay;
const useProject=()=>{const {workspace}=useStore();return workspace.projects.find(p=>p.id===workspace.selectedId)};

export function Scheduling(){
 const p=useProject();const {updateCalendar,updateDependency,previewSchedule,applySchedule,s}=useStore();
 const cal=p.scheduling?.calendar||model.projectScheduling.DEFAULT_CALENDAR;
 const [mode,setMode]=useState(cal.mode||'calendar'),[weekdays,setWeekdays]=useState(cal.weekdays||[1,2,3,4,5]);
 const [closed,setClosed]=useState((cal.closed||[]).join(', ')),[opened,setOpened]=useState((cal.opened||[]).join(', '));
 const [pre,setPre]=useState(''),[succ,setSucc]=useState(''),[kind,setKind]=useState('FS'),[lag,setLag]=useState('0');
 const [anchors,setAnchors]=useState([]),[proposal,setProposal]=useState(null),[notice,setNotice]=useState('');
 const link=p.scheduling?.links||[];
 const submitCal=()=>{const a={mode,weekdays,closed:closed.split(',').map(x=>x.trim()).filter(Boolean),opened:opened.split(',').map(x=>x.trim()).filter(Boolean)};if(updateCalendar(a))setNotice('Calendar saved with recovery snapshot.');};
 return <Page title="Scheduling" subtitle="Working calendar, typed dependencies and safe schedule previews.">
 <Fold title="Working calendar" subtitle={`${mode} · ${weekdays.length} working days`} initial>
  <Pick value={mode} values={['calendar','business']} onChange={setMode}/>
  <T size={12} muted>Working days (Mon–Sun)</T>
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:7}}>{['M','T','W','T','F','S','S'].map((x,i)=><Chip key={i} label={x} active={weekdays.includes(i+1)} onPress={()=>setWeekdays(d=>d.includes(i+1)?d.filter(n=>n!==i+1):[...d,i+1].sort())}/>)}</View>
  <Labeled title="Closed dates" value={closed} onChange={setClosed} placeholder="2026-12-25, 2027-01-01"/>
  <Labeled title="Exceptionally open dates" value={opened} onChange={setOpened} placeholder="YYYY-MM-DD, ..."/>
  <Button label="Save calendar" small onPress={submitCal}/>
 </Fold>
 <Fold title="Dependency types & lag" subtitle="Finish/start links with signed day offsets">
  <T size={12} muted>First create a dependency in the Task sheet. Then change its relationship here.</T>
  <View style={{gap:6}}><T size={12} muted weight="500">Predecessor task</T><Dropdown options={s.tasks.map(t=>({value:t.id,label:t.title}))} value={pre} onChange={setPre}/></View>
  <View style={{gap:6}}><T size={12} muted weight="500">Successor task</T><Dropdown options={s.tasks.filter(t=>t.id!==pre).map(t=>({value:t.id,label:t.title}))} value={succ} onChange={setSucc}/></View>
  <Pick values={['FS','SS','FF','SF']} value={kind} onChange={setKind}/>
  <Labeled title="Lag (days, −365 to 365)" value={lag} onChange={setLag} keyboardType="numeric"/>
  <Button label="Update relationship" small disabled={!pre||!succ||pre===succ} onPress={()=>{if(updateDependency(pre.trim(),succ.trim(),kind,Number(lag)))setNotice('Relationship updated.')}}/>
  {link.slice(0,100).map((x,i)=><T key={`${x.predecessorId}-${x.successorId}-${i}`} size={12} muted>{x.predecessorId} → {x.successorId}: {x.type||'FS'} {x.lagDays||0}d</T>)}
 </Fold>
 <Fold title="Propagation preview" subtitle="Preview before applying; recoverable and validated">
  <T muted size={12}>Select changed task IDs to calculate proposed downstream changes.</T>
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:7}}>{s.tasks.slice(0,120).map(t=><Chip key={t.id} label={t.title.slice(0,27)} active={anchors.includes(t.id)} onPress={()=>setAnchors(a=>a.includes(t.id)?a.filter(x=>x!==t.id):[...a,t.id])}/>)}</View>
  <Button label="Preview changes" small onPress={()=>{const r=previewSchedule(anchors);setProposal(r.ok?r.proposal:null);setNotice(r.ok?'Review proposed changes before applying':r.error)}}/>
  {proposal?<View accessibilityLiveRegion="polite" style={{gap:10}}>
    <T size={13} weight="600">{proposal.changes.length} proposed date change{proposal.changes.length===1?'':'s'} · {proposal.issues.length} issue{proposal.issues.length===1?'':'s'}</T>
    <T muted size={12}>{proposal.assumptions}</T>
    {proposal.changes.slice(0,20).map(change=><View key={change.taskId} style={{gap:3}}>
      <T size={13} weight="500">{s.tasks.find(task=>task.id===change.taskId)?.title || change.taskId}</T>
      <T size={12} muted>{change.oldStart||'No start'} – {change.oldDue||'No due'} → {change.newStart||'No start'} – {change.newDue||'No due'}</T>
    </View>)}
    {proposal.changes.length>20?<T size={12} muted>Showing the first 20 proposed changes of {proposal.changes.length}.</T>:null}
    {proposal.issues.slice(0,10).map((issue,i)=><T key={i} size={12}>{`${issue.code.replace(/_/g,' ')}: ${s.tasks.find(task=>task.id===issue.taskId)?.title||issue.taskId}`}</T>)}
    {proposal.issues.length>10?<T size={12} muted>{proposal.issues.length-10} more issues. Resolve the reported dependencies before applying.</T>:null}
    {!proposal.canApply?<T size={12} muted>Resolve the issues, then preview again before applying.</T>:proposal.changes.length?
      <DangerConfirm label="Apply schedule" onConfirm={()=>{if(applySchedule(proposal))setProposal(null)}}/>:
      <T muted size={12}>All downstream dates already satisfy the selected dependencies.</T>}
  </View>:null}
 </Fold>
 {notice?<T size={12} muted>{notice}</T>:null}
 </Page>;
}
export function TaskConfiguration({embedded=false}){
 const p=useProject();const {saveTaskSchema,removeTaskField,removeTaskType}=useStore();
 const [name,setName]=useState(''),[id,setId]=useState(''),[kind,setKind]=useState('text'),[options,setOptions]=useState(''),[required,setRequired]=useState(false),[mode,setMode]=useState('field');
 const [from,setFrom]=useState('Backlog'),[to,setTo]=useState('In progress'),[enforced,setEnforced]=useState(p.workflow.enabled);
 const add=()=>{const itemId=id.trim();if(!itemId||!name.trim())return;const config=mode==='field'?{customFields:[...p.customFields,{id:itemId,name:name.trim(),type:kind,required,options:kind==='select'?options.split(',').map(x=>x.trim()).filter(Boolean):[]}]}:{taskTypes:[...p.taskTypes,{id:itemId,name:name.trim(),description:''}]};if(saveTaskSchema(config)){setName('');setId('');}};
 const content = <>
 <Fold title="Task types" subtitle={`${p.taskTypes.length} types · managed locally`} initial>
  {p.taskTypes.map(tp=><EditRow key={tp.id} title={tp.name} summary={tp.id}><T muted size={12}>{tp.description||'No description'}</T>{tp.id!=='task'?<DangerConfirm label="Remove type" onConfirm={()=>removeTaskType(tp.id)}/>:null}</EditRow>)}
 </Fold>
 <Fold title="Custom fields" subtitle={`${p.customFields.length} fields · typed values`}>
  {p.customFields.map(f=><EditRow key={f.id} title={f.name} summary={`${f.type}${f.required?' · required':''}`}><T size={12} muted>{(f.options||[]).join(', ')}</T><DangerConfirm label="Remove field" onConfirm={()=>removeTaskField(f.id)}/></EditRow>)}
 </Fold>
 <Fold title="Add type or field" subtitle="New properties appear in each task's inline editor">
  <Pick values={['field','type']} value={mode} onChange={setMode}/><Labeled title="Machine ID (letters, numbers, hyphen)" value={id} onChange={setId}/><Labeled title="Display name" value={name} onChange={setName}/>
  {mode==='field'?<><Pick values={['text','number','boolean','date','select']} value={kind} onChange={setKind}/>{kind==='select'?<Labeled title="Options, comma separated" value={options} onChange={setOptions}/>:null}<Chip label="Required" active={required} onPress={()=>setRequired(!required)}/></>:null}
  <Button label="Add" small onPress={add}/>
 </Fold>
 <Fold title="Workflow restrictions" subtitle={enforced?'Restricted transitions are enabled':'Open transitions'}>
  <Chip label="Enforce allowed transitions" active={enforced} onPress={()=>{const v=!enforced;if(saveTaskSchema({workflow:{...p.workflow,enabled:v}}))setEnforced(v)}}/>
  <T muted size={12}>Add an allowed transition. Turning restrictions on with no transitions will block status changes.</T>
  <Pick values={model.STATUSES} value={from} onChange={setFrom}/><Pick values={model.STATUSES} value={to} onChange={setTo}/>
  <Button small label="Allow transition" onPress={()=>saveTaskSchema({workflow:{...p.workflow,transitions:[...p.workflow.transitions,{from,to,typeId:''}]}})}/>
  {(p.workflow.transitions||[]).map((tr,i)=><EditRow key={i} title={`${tr.from} → ${tr.to}`} summary={tr.typeId||'All types'}><Button small variant="ghost" label="Remove" onPress={()=>saveTaskSchema({workflow:{...p.workflow,transitions:p.workflow.transitions.filter((_,j)=>i!==j)}})}/></EditRow>)}
 </Fold>
 </>;
 return embedded ? content : <Page title="Task configuration">{content}</Page>;
}
export function Collaboration({openTask}){
 const p=useProject();const {s,addReminder,finishReminder,deleteReminder,deleteComment}=useStore();
 const [taskId,setTaskId]=useState(''),[date,setDate]=useState(today()),[note,setNote]=useState('');
 return <Page title="Collaboration" subtitle="Local comments and reminders. No cloud messaging or notifications.">
  <Fold title="Reminders" subtitle={`${(p.reminders||[]).filter(r=>!r.done).length} open reminders`} initial>
   <View style={{gap:6}}><T muted size={12} weight="500">Task</T>
     <Dropdown options={s.tasks.map(t=>({value:t.id,label:t.title}))} value={taskId} onChange={setTaskId}/>
   </View>
   <Labeled title="Reminder date" value={date} onChange={setDate}/><Labeled title="Note" value={note} onChange={setNote}/>
   <Button label="Create reminder" small disabled={!taskId} onPress={()=>{if(addReminder({taskId,date,note})){setNote('');setTaskId('')}}}/>
   {(p.reminders||[]).map(r=><EditRow key={r.id} title={r.note||'Reminder'} summary={`${r.date}${r.done?' · done':''}`}><Button small label="Open task" variant="secondary" onPress={()=>openTask?.(r.taskId)}/>{!r.done?<Button small label="Mark done" onPress={()=>finishReminder(r.id)}/>:null}<DangerConfirm label="Delete reminder" onConfirm={()=>deleteReminder(r.id)}/></EditRow>)}
  </Fold>
  <Fold title="Comment history" subtitle={`${(p.comments||[]).length} local records`}>
   {(p.comments||[]).slice(-100).reverse().map(cm=><EditRow key={cm.id} title={s.tasks.find(t=>t.id===cm.taskId)?.title||cm.taskId} summary={cm.body.slice(0,90)}><T size={12}>{cm.author} · {cm.at}</T><T size={13}>{cm.body}</T><DangerConfirm label="Delete comment" onConfirm={()=>deleteComment(cm.id)}/></EditRow>)}
  </Fold>
 </Page>;
}
const SPEC_LABEL={name:'Name',description:'Description',goal:'Goal',exit:'Exit criteria',content:'Content'};
const SPEC_LONG=['description','goal','exit','content'];
function SpecForm({kind,entry,onDone}){
 const {saveSpec,deleteSpec}=useStore();const spec=model.specifications;
 const [d,setD]=useState(()=>Object.fromEntries(spec.KINDS[kind].fields.map(f=>[f,entry?.[f]??(f==='stage'?'Development':'')])));
 const set=(f,v)=>setD(x=>({...x,[f]:v}));
 return <View style={{gap:10}}>
  {spec.KINDS[kind].fields.map(f=>f==='stage'
   ?<View key={f} style={{gap:6}}><T muted size={12} weight="500">Stage</T><Pick values={spec.STAGES} value={d.stage} onChange={v=>set('stage',v)}/></View>
   :<Labeled key={f} title={SPEC_LABEL[f]} value={d[f]} onChange={v=>set(f,v)} markdown={SPEC_LONG.includes(f)}/>)}
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
   <Button label={entry?'Save changes':`Add ${spec.KINDS[kind].label}`} small disabled={!d.name.trim()} onPress={()=>{if(saveSpec(kind,{...d,id:entry?.id}))onDone&&onDone()}}/>
   {entry?null:<Button label="Cancel" small variant="ghost" onPress={onDone}/>}
  </View>
  {entry?<DangerConfirm label="Delete" onConfirm={()=>deleteSpec(kind,entry.id)}/>:null}
 </View>;
}
function SpecGroup({kind,title,items,initial}){
 const [adding,setAdding]=useState(false);
 return <Fold title={title} subtitle={`${items.length} entries`} initial={initial}>
  {items.map((item,i)=><EditRow key={item.id||i} title={item.name||'Untitled'} summary={item.description?.slice(0,100)||item.stage||''}><SpecForm kind={kind} entry={item}/></EditRow>)}
  {!items.length&&!adding?<T size={13} muted>No entries yet.</T>:null}
  {adding?<SpecForm kind={kind} onDone={()=>setAdding(false)}/>:<Button label={`Add ${model.specifications.KINDS[kind].label}`} icon="plus" small variant="secondary" onPress={()=>setAdding(true)}/>}
 </Fold>;
}
export function Specifications(){
 const p=useProject();return <Page title="Specifications" subtitle="Phases, data schemas, API contracts and playbooks of this project. Add, edit or delete entries.">
 {[['phases','Phases'],['schemas','Data schemas'],['apiContracts','API contracts'],['playbooks','Playbooks']].map(([kind,title])=><SpecGroup key={kind} kind={kind} title={title} items={p[kind]||[]} initial={kind==='phases'}/>)}
 </Page>;
}
