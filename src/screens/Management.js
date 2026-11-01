import {useState} from 'react';
import {Pressable,View} from 'react-native';
import {Page,Card,T,Button,Chip,SectionTitle} from '../ui';
import {useStore} from '../store';
import {useTheme} from '../theme';
import {Fold,EditRow,Labeled,Pick,DangerConfirm} from './CompactTools';
const model=require('../model.cjs');
const today=()=>new Date().toISOString().slice(0,10);
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
  <Labeled title="Predecessor task ID" value={pre} onChange={setPre}/><Labeled title="Successor task ID" value={succ} onChange={setSucc}/>
  <Pick values={['FS','SS','FF','SF']} value={kind} onChange={setKind}/>
  <Labeled title="Lag (days, −365 to 365)" value={lag} onChange={setLag} keyboardType="numeric"/>
  <Button label="Update relationship" small onPress={()=>{if(updateDependency(pre.trim(),succ.trim(),kind,Number(lag)))setNotice('Relationship updated.')}}/>
  {link.slice(0,100).map((x,i)=><T key={`${x.predecessorId}-${x.successorId}-${i}`} size={12} muted>{x.predecessorId} → {x.successorId}: {x.type||'FS'} {x.lagDays||0}d</T>)}
 </Fold>
 <Fold title="Propagation preview" subtitle="Preview before applying; recoverable and validated">
  <T muted size={12}>Select changed task IDs to calculate proposed downstream changes.</T>
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:7}}>{s.tasks.slice(0,120).map(t=><Chip key={t.id} label={t.title.slice(0,27)} active={anchors.includes(t.id)} onPress={()=>setAnchors(a=>a.includes(t.id)?a.filter(x=>x!==t.id):[...a,t.id])}/>)}</View>
  <Button label="Preview changes" small onPress={()=>{const r=previewSchedule(anchors);setProposal(r.ok?r.proposal:null);setNotice(r.ok?'Review proposed changes before applying':r.error)}}/>
  {proposal?<View style={{gap:8}}><T size={12} muted>{JSON.stringify(proposal).slice(0,800)}</T><DangerConfirm label="Apply schedule" onConfirm={()=>{if(applySchedule(proposal))setProposal(null)}}/></View>:null}
 </Fold>
 {notice?<T size={12} muted>{notice}</T>:null}
 </Page>;
}
export function TaskConfiguration(){
 const p=useProject();const {saveTaskSchema,removeTaskField,removeTaskType}=useStore();
 const [name,setName]=useState(''),[id,setId]=useState(''),[kind,setKind]=useState('text'),[options,setOptions]=useState(''),[required,setRequired]=useState(false),[mode,setMode]=useState('field');
 const [from,setFrom]=useState('Backlog'),[to,setTo]=useState('In progress'),[enforced,setEnforced]=useState(p.workflow.enabled);
 const add=()=>{const itemId=id.trim();if(!itemId||!name.trim())return;const config=mode==='field'?{customFields:[...p.customFields,{id:itemId,name:name.trim(),type:kind,required,options:kind==='select'?options.split(',').map(x=>x.trim()).filter(Boolean):[]}]}:{taskTypes:[...p.taskTypes,{id:itemId,name:name.trim(),description:''}]};if(saveTaskSchema(config)){setName('');setId('');}};
 return <Page title="Task configuration" subtitle="Types, custom fields and permitted workflow changes.">
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
 </Page>;
}
export function Collaboration({openTask}){
 const p=useProject();const {s,addReminder,finishReminder,deleteReminder,deleteComment}=useStore();
 const [taskId,setTaskId]=useState(''),[date,setDate]=useState(today()),[note,setNote]=useState('');
 return <Page title="Collaboration" subtitle="Local comments and reminders. No cloud messaging or notifications.">
  <Fold title="Reminders" subtitle={`${(p.reminders||[]).filter(r=>!r.done).length} open reminders`} initial>
   <Labeled title="Task ID" value={taskId} onChange={setTaskId}/><Labeled title="Reminder date" value={date} onChange={setDate}/><Labeled title="Note" value={note} onChange={setNote}/>
   <Button label="Create reminder" small onPress={()=>{if(addReminder({taskId,date,note})){setNote('');setTaskId('')}}}/>
   {(p.reminders||[]).map(r=><EditRow key={r.id} title={r.note||'Reminder'} summary={`${r.date}${r.done?' · done':''}`}><Button small label="Open task" variant="secondary" onPress={()=>openTask?.(r.taskId)}/>{!r.done?<Button small label="Mark done" onPress={()=>finishReminder(r.id)}/>:null}<DangerConfirm label="Delete reminder" onConfirm={()=>deleteReminder(r.id)}/></EditRow>)}
  </Fold>
  <Fold title="Comment history" subtitle={`${(p.comments||[]).length} local records`}>
   {(p.comments||[]).slice(-100).reverse().map(cm=><EditRow key={cm.id} title={s.tasks.find(t=>t.id===cm.taskId)?.title||cm.taskId} summary={cm.body.slice(0,90)}><T size={12}>{cm.author} · {cm.at}</T><T size={13}>{cm.body}</T><DangerConfirm label="Delete comment" onConfirm={()=>deleteComment(cm.id)}/></EditRow>)}
  </Fold>
 </Page>;
}
export function Specifications(){
 const p=useProject();return <Page title="Specifications" subtitle="Imported project references, retained without alteration.">
 {[["Phases",p.phases],["Data schemas",p.schemas],["API contracts",p.apiContracts],["Playbooks",p.playbooks]].map(([title,items])=><Fold key={title} title={title} subtitle={`${(items||[]).length} entries`} initial={title==='Phases'}>
 {(items||[]).map((item,i)=><EditRow key={item.id||i} title={item.name||'Untitled'} summary={item.description?.slice(0,100)||item.stage||''}>
  {Object.entries(item).filter(([key,val])=>typeof val==='string'&&val&&key!=='id'&&key!=='name').map(([key,val])=><View key={key} style={{gap:5}}><T weight="600" size={12}>{key}</T><T size={13}>{val}</T></View>)}
 </EditRow>)}{!(items||[]).length?<T size={13} muted>No imported entries.</T>:null}
 </Fold>)}
 </Page>;
}
