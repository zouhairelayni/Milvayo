// /src/screens/tasks/TaskSheet.js
import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import AddToCanvas from '../canvas/AddToCanvas';
import PressSurface from '../../ui/PressSurface';
import TaskMarkdown from '../../components/inline/TaskMarkdown';
import MarkdownField from '../../components/inline/MarkdownField';
import TaskLabels from '../../components/inline/TaskLabels';
import { COLORS, textColor } from '../../ui/labelPalette.cjs';
import { InlineDateRange, ActionMenu, Button, Card, Chip, Input, Pill, Segmented, Sheet, T } from '../../ui/ui';
import { useStore } from '../../store/store';
import { useTheme, PRIORITY_COLOR, STATUS_COLOR } from '../../ui/theme/theme';
import { CHECK_STATES, PRIORITIES, STAGES, STATUS, isOverdue, fmt } from '../../store/data';
import InlineNotice from '../../components/notice/InlineNotice';
import { Field, InlineDrop, CustomValueInput } from './TaskFields';
import { Fold } from '../../components/inline/CompactTools';
import { localDay } from '../../utils/localDay.cjs';
import { descendants } from '../../domain/taskWorkflows.cjs';
import {useCloudPresence} from '../../cloud/useCloudPresence';
const NONE = new Set();

// A new task is only created on explicit Save. Dismissing this sheet discards its draft.
export function NewTaskSheet({ onClose, onSave, extra }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Backlog');
  const [priority, setPriority] = useState('Medium');
  const save = () => {
    const name = title.trim();
    if (!name || name.length > 240) return;
    onSave({ title: name, description, status, priority });
  };
  return <Sheet visible onClose={onClose} title="Create task" showNotice={false}
    footer={<><Button label="Cancel" small variant="ghost" onPress={onClose}/><Button label="Save task" small icon="check" disabled={!title.trim() || title.trim().length>240} onPress={save}/></>}>
    <View style={{gap:8}}><T weight="600">Task title</T><Input value={title} onChangeText={setTitle} autoFocus accessibilityLabel="New task title" placeholder="What needs to be done?"/></View>
    <Fold title="Add a description" initial={false}><MarkdownField label="Description" value={description} onChangeText={setDescription} placeholder="Details (optional)"/></Fold>
    <View style={{gap:8}}><T weight="600">Status</T><Segmented options={STATUS} value={status} onChange={setStatus}/></View>
    <View style={{gap:8}}><T weight="600">Priority</T><Segmented options={PRIORITIES} value={priority} onChange={setPriority}/></View>
    {extra}
  </Sheet>;
}

export default function TaskSheet({ taskId, onClose }) {
  const { c } = useTheme();
  const api = useStore();
  const { s, workspace, setLabels, updateTask, moveTask, addComment, toggleSprintTask, setLabelColor, setCheck, verifyTask, mergeTask, deleteTask, duplicateTask, addSubtask, setCustomValue, logTime, addGithubLink, removeGithubLink, refreshGithubLink, runCommand } = useStore();
  const storedTask = s.tasks.find((x) => x.id === taskId);
  const [draftPatch,setDraftPatch]=useState({}),[draftReady,setDraftReady]=useState(!api.createTaskDraft),[saveState,setSaveState]=useState(''),[saving,setSaving]=useState(false);
  const draft=useRef(null),controllerIdentity=useRef(null),draftIdentity=JSON.stringify([workspace.selectedId,taskId]);
  const draftAvailable=!api.createTaskDraft||(draftReady&&controllerIdentity.current===draftIdentity);
  const shownSaveState=!api.createTaskDraft||controllerIdentity.current===draftIdentity?saveState:'';
  const t=storedTask?{...storedTask,...(controllerIdentity.current===draftIdentity?draftPatch:{})}:null;
  const session=api.cloudSession?.();
  useEffect(()=>{
    if(!api.createTaskDraft)return;
    setDraftReady(false);setDraftPatch({});setSaveState('');controllerIdentity.current=draftIdentity;
    let mounted=true;const controller=api.createTaskDraft(workspace.selectedId,taskId,next=>{if(mounted)setDraftPatch(next.patch);});draft.current=controller;
    controller.open().then(()=>{if(mounted)setDraftReady(true);}).catch(e=>{if(mounted)setSaveState(e.message);});
    return()=>{mounted=false;void controller.flush().catch(()=>{});};
  },[draftIdentity,api.createTaskDraft]);
  const stage=(patch)=>{
    if(!draft.current)return t&&updateTask(t.id,patch);
    if(!draftAvailable||saving)return false;
    try{void draft.current.stage(patch).then(()=>setSaveState('Draft saved on this device')).catch(e=>setSaveState(e.message));return true;}
    catch(e){setSaveState(e.message);return false;}
  };
  const commitDraft=async()=>{
    if(!draft.current||!draftAvailable)return;
    try{await draft.current.commit();setSaveState(session?.getState().connected?'Saved on this device · cloud synchronization pending':'Saved on this device');}
    catch(e){setSaveState(e.message);}
  };
  const saveTask=async(synchronize=true)=>{
    if(saving||!draftAvailable)return false;setSaving(true);
    try{
      if(draft.current)await draft.current.commit();
      else if(descriptionEditing&&t&&descriptionDraft!==(t.description||'')&&updateTask(t.id,{description:descriptionDraft})===false)return false;
      if(api.flush&&!(await api.flush()))throw Error('Local save failed; changes remain on this device');
      await session?.flush();
      if(synchronize&&session?.getState().connected)await (session.syncNow?session.syncNow():session.tick());
      const state=session?.getState();
      setSaveState(state?.conflicts?'Changes need conflict resolution':state?.pending?'Saved on this device · cloud synchronization pending':state?.connected?'Cloud acknowledged all queued changes':'Saved on this device');
      setDescriptionEditing(false);return true;
    }catch(e){setSaveState(e.message);return false;}finally{setSaving(false);}
  };
  useEffect(()=>{
    if(!api.createTaskDraft)return;
    const timer=setInterval(()=>{if(Object.keys(draft.current?.snapshot().patch||{}).length)void saveTask();},session?.getSyncInterval?.()||45000);
    return()=>clearInterval(timer);
  },[draftAvailable,saving,draftIdentity,session]);
  const [open, setOpen] = useState(null);
  const [detailTab,setDetailTab]=useState('activity');
  const [descriptionEditing, setDescriptionEditing] = useState(false);
  const presence=useCloudPresence(workspace.selectedId,'task:'+taskId,descriptionEditing);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [labelColorDraft, setLabelColorDraft] = useState(COLORS[0]);
  const [labelEditor, setLabelEditor] = useState(false);
  const [comment, setComment] = useState('');
  const [githubUrl,setGithubUrl]=useState('');
  const [subTitle,setSubTitle]=useState(''),[logHours,setLogHours]=useState('1');
  const [depDraft, setDepDraft] = useState('');
  const [parentDraft, setParentDraft] = useState('');
  const [labelDraft, setLabelDraft] = useState('');
  const [checkDraft, setCheckDraft] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  useEffect(() => {
    setOpen(null); setDetailTab('activity'); setDescriptionEditing(false); setDescriptionDraft(''); setLabelEditor(false);
    setGithubUrl(''); setSubTitle(''); setLogHours('1');
    setComment(''); setDepDraft(''); setParentDraft(''); setLabelDraft('');
    setCheckDraft(''); setAttachmentName(''); setAttachmentUrl('');
  }, [taskId]);

  const active = s.sprints.find((x) => x.state === 'active');
  const set = (patch, label) => t && updateTask(t.id, patch, label);
  const depTasks = t ? t.dependsOn.map((id) => s.tasks.find((x) => x.id === id)).filter(Boolean) : [];
  const blocked = depTasks.some((d) => d.status !== 'Done');
  const checks = t ? s.checks.filter((k) => k.taskId === t.id) : [];
  const canVerify = !!t && checks.length > 0 && checks.every((k) => k.status === 'passed' && k.evidence) &&
    !!t.evidence?.trim() && !!t.actual?.trim() && !blocked;
  const canMerge = !!t?.verified && canVerify && !!t?.mainSha?.trim();
  const patchCheck = (key, changes) => t && stage({ tests: t.tests.map((k) => k.id === key ? { ...k, ...changes } : k) }, `Updated acceptance evidence for ${t.id}`);
  const addLabel = () => {
    if (!t) return;
    const value = labelDraft.trim().slice(0, 40);
    if (value) {
      if (!t.labels.includes(value) && t.labels.length < 30) setLabels(t.id, [...t.labels, value]);
      setLabelColor(value, labelColorDraft);
    }
    setLabelDraft('');
  };
  const addCheck = () => {
    if (!t) return;
    const title = checkDraft.trim();
    if (title && t.tests.length < 250) set({ tests: [...t.tests, { id: `check-${Date.now()}`, title, result: 'pending', evidence: '' }] });
    setCheckDraft('');
  };
  const addAttachment = () => {
    if (!t) return;
    const url = attachmentUrl.trim();
    if (!/^https?:\/\//i.test(url)) return;
    set({ attachments: [...(t.attachments || []), { id: `link-${Date.now()}`, name: attachmentName.trim() || url, url }] });
    setAttachmentName(''); setAttachmentUrl('');
  };

  const closeTask = async () => {
    if(await saveTask())onClose();
  };

  const footer = t ? (
    <>
    <InlineNotice />
    <ActionMenu label="Task actions" items={[
      {label:'Duplicate task',icon:'copy',confirmation:{title:'Duplicate this task?',description:'Create a copy and keep this task open.',confirmLabel:'Duplicate',successMessage:'Task duplicated.'},onPress:async()=>{
        if(!(await saveTask(false)))return false;
        return duplicateTask(t.id)||false;
      }},
      {label:'Delete task',icon:'trash-2',danger:true,confirmation:{title:'Delete this task?',description:'This removes the task and cannot be undone here.',confirmLabel:'Delete'},onPress:()=>{
        const ok=deleteTask(t.id);if(ok)onClose();return !!ok;
      }},
    ]}/>
    <View style={{flex:1}}/><Button label="Save" small disabled={saving||!draftAvailable} onPress={()=>saveTask()}/><Button label="Done" small variant="ghost" disabled={saving} onPress={closeTask}/>
    </>
  ) : null;

  const row = (id, label, summary, children) => (
    <InlineDrop id={id} label={label} summary={summary} open={open} onToggle={setOpen}>{children}</InlineDrop>
  );

  return (
    <Sheet visible={!!t} onClose={closeTask} title={t ? 'Task details' : ''} footer={footer} showNotice={false}>
      {shownSaveState?<T muted size={12} accessibilityLiveRegion="polite">{shownSaveState}</T>:null}
      {shownSaveState.startsWith('Task changed while editing')?<Card pad={12} style={{gap:12}}>
        <T size={13}>Compare the retained draft with the current task</T>
        {Object.keys(draftPatch).map(field=><View key={field} style={{gap:4}}><T size={12}>{field}</T><T selectable size={12}>Your draft: {JSON.stringify(draftPatch[field])}</T><T selectable muted size={12}>Current task: {JSON.stringify(storedTask?.[field]??null)}</T></View>)}
        <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
          <Button label="Use my draft" disabled={saving} onPress={async()=>{try{await draft.current.rebase();await saveTask();}catch(e){setSaveState(e.message);}}}/>
          <Button label="Keep current task" variant="secondary" disabled={saving} onPress={async()=>{try{for(const field of Object.keys(draft.current.snapshot().patch))await draft.current.discard(field);setDescriptionEditing(false);setSaveState('Current task kept');}catch(e){setSaveState(e.message);}}}/>
        </View>
      </Card>:null}
      {presence.viewers?<T muted size={12}>{presence.editing?'Another member is currently editing this task':`${presence.viewers} other member(s) viewing`}</T>:null}
      {t ? (
        <>
          <Input value={t.title} editable={draftAvailable&&!saving} onBlur={commitDraft} onChangeText={v=>stage({title:v})} accessibilityLabel="Task title" style={{fontSize:24,fontWeight:'600',lineHeight:32,backgroundColor:'transparent',paddingHorizontal:0,paddingVertical:4,minHeight:56}} />
          <AddToCanvas source={{sourceType:'task',sourceId:t.id}}/>
          <View style={{gap:10}}>
            <T size={16} weight="700">Description</T>
            {descriptionEditing?<Card pad={12} style={{gap:10}}>
              <T size={12} muted>Markdown source · **bold**, *italic*, headings and lists</T>
              <Input value={descriptionDraft} editable={draftAvailable&&!saving} onChangeText={v=>{setDescriptionDraft(v);if(draft.current)stage({description:v});}} multiline placeholder="Add a description..." style={{minHeight:160,fontSize:14}}/>
              <View style={{flexDirection:'row',gap:8}}>
                <PressSurface accessibilityRole="button" accessibilityLabel="Save description" onPress={()=>saveTask()} style={{width:44,height:44,borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:c.elevated}}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={c.accentText} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" accessible={false}><Path d="M20 6 9 17 4 12"/></Svg>
                </PressSurface>
                <PressSurface accessibilityRole="button" accessibilityLabel="Cancel description editing" onPress={()=>{if(draft.current)void draft.current.discard('description').catch(e=>setSaveState(e.message));setDescriptionDraft(storedTask.description||'');setDescriptionEditing(false);}} style={{width:44,height:44,borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:c.elevated}}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={c.danger} strokeWidth={2} strokeLinecap="round" accessible={false}><Path d="m6 6 12 12M18 6 6 18"/></Svg>
                </PressSurface>
              </View>
            </Card>:<Pressable accessibilityRole="button" accessibilityLabel="Edit description" onPress={()=>{setDescriptionDraft(t.description||'');setDescriptionEditing(true);}} style={{padding:14,borderRadius:12,backgroundColor:c.surface,borderWidth:1,borderColor:c.line,minHeight:72}}>
              {t.description?<TaskMarkdown source={t.description}/>:<T muted size={13}>Add a description of the task, its purpose and next steps...</T>}
            </Pressable>}
          </View>
          <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,alignItems:'center'}}>
            <Pill label={s.boards.find(b=>b.id===t.board)?.name || 'Board'} color={c.muted} />
            <Pill label={t.status} color={STATUS_COLOR[t.status]} />
            {isOverdue(t)?<Pill label="Overdue" color={PRIORITY_COLOR.Critical}/>:null}
            {blocked?<Pill label="Blocked" color={PRIORITY_COLOR.High}/>:null}
          </View>
          <View style={{gap:4}}>
            <T size={16} weight="600" style={{marginBottom:4}}>Plan this task</T>
            {row('status', 'Status', t.status,
              <Segmented options={STATUS} value={t.status} onChange={(v) => { moveTask(t.id, v); setOpen(null); void saveTask(); }} />)}
            {row('schedule', 'Schedule', `${t.start ? fmt(t.start) : 'No start'} – ${t.due ? fmt(t.due) : 'No due'}`,
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  <InlineDateRange start={t.start} end={t.due} onStart={v=>set({start:v})} onEnd={v=>set({due:v})}/>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  <View style={{ flex: 1, minWidth: 135 }}><Field label="Effort (hours)">
                    <Input value={String(t.effort)} editable={draftAvailable&&!saving} onBlur={commitDraft} keyboardType="numeric" onChangeText={(v) => stage({ effort: Number(v) || 0 })} />
                  </Field></View>
                  <View style={{ flex: 1, minWidth: 135 }}><Field label="Logged hours">
                    <T size={13} muted style={{ paddingTop: 9 }}>{String(t.logged)}h · see Time tracking above</T>
                  </Field></View>
                </View>
              </View>)}
            {row('priority', 'Priority', t.priority,
              <Segmented options={PRIORITIES} value={t.priority} onChange={(v) => { set({ priority: v }, `Priority of "${t.title}" set to ${v}`); setOpen(null); }} />)}
            {row('owner', 'Owner', t.owner || 'Unassigned',
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {[...new Set([...s.contributors.map((p) => p.name), 'Unassigned'])].map((name) => (
                  <Chip key={name} label={name} active={t.owner === name} onPress={() => { set({ owner: name }, `Assigned "${t.title}" to ${name}`); setOpen(null); void saveTask(); }} />
                ))}
              </View>)}
          </View>
          <View style={{gap:10}}>
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
              <T size={15} weight="700">Labels</T>
              <Button label={labelEditor?'Close':'Edit labels'} small variant="ghost" onPress={()=>setLabelEditor(x=>!x)} />
            </View>
            <TaskLabels labels={t.labels} colors={workspace.projects.find(p=>p.id===workspace.selectedId)?.labelColors||{}} onPress={()=>setLabelEditor(true)}/>
            {labelEditor?<Card pad={12} style={{gap:12}}>
              <T size={12} muted>Use the × buttons to remove assigned labels, or choose from existing project labels.</T>
              <View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>
                {t.labels.map(name=><Button key={name} small variant="secondary" icon="x" label={name} onPress={()=>setLabels(t.id,t.labels.filter(x=>x!==name))}/>)}
              </View>
              <T size={12} weight="600">Existing labels</T>
              <View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>
                {[...new Set([...s.tasks.flatMap(x=>x.labels||[]),...Object.keys(workspace.projects.find(p=>p.id===workspace.selectedId)?.labelColors||{})])].filter(x=>!t.labels.includes(x)).sort().slice(0,100).map(name=><TaskLabels key={name} labels={[name]} colors={workspace.projects.find(p=>p.id===workspace.selectedId)?.labelColors||{}} onPress={()=>{if(t.labels.length<30)setLabels(t.id,[...t.labels,name]);}}/>)}
              </View>
              <Input value={labelDraft} onChangeText={setLabelDraft} placeholder="New label name" onSubmitEditing={addLabel}/>
              <T size={12} weight="600">Label color</T>
              <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
                {COLORS.map(color=><Pressable key={color} accessibilityRole="button" accessibilityLabel={`Set label color ${color}`} hitSlop={7} onPress={()=>setLabelColorDraft(color)} style={{width:32,height:32,borderRadius:7,backgroundColor:color,alignItems:'center',justifyContent:'center',borderWidth:labelColorDraft===color?2:0,borderColor:c.ink}}>{labelColorDraft===color?<Feather name="check" size={18} color={textColor(color)}/>:null}</Pressable>)}
              </View>
              <Button small label="Create & assign label" disabled={!labelDraft.trim()} onPress={addLabel}/>
              {t.labels.length?<><T size={12} weight="600">Recolor assigned labels</T><View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>{t.labels.map(name=><Button key={name} small variant="secondary" label={`Recolor ${name}`} onPress={()=>setLabelColor(name,labelColorDraft)}/>)}</View></>:null}
            </Card>:null}
          </View>

          <Segmented fill options={[{value:'activity',label:'Activity & files'},{value:'planning',label:'Planning & delivery'}]} value={detailTab} onChange={setDetailTab}/>
          <View style={{display:detailTab==='activity'?'flex':'none',gap:8}}>
            {row('checks', 'Acceptance checks', `${checks.filter((k) => k.status === 'passed').length}/${checks.length} passed`,
              <View style={{ gap: 10 }}>
                {checks.map((k) => (
                  <Card key={k.id} pad={12} style={{ gap: 10 }}>
                    <T size={13} weight="500">{k.title}</T>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {CHECK_STATES.map((st) => <Chip key={st} label={st} active={k.status === st} onPress={() => setCheck(k.id, st)} />)}
                    </View>
                    <Input
                      value={t.tests.find((raw) => `${t.id}::${raw.id}` === k.id)?.evidence || ''}
                      onChangeText={(v) => patchCheck(k.id.slice(t.id.length + 2), { evidence: v })}
                      placeholder="Test result / evidence reference" multiline
                    />
                  </Card>
                ))}
                <Input value={checkDraft} onChangeText={setCheckDraft} placeholder="New acceptance check" onSubmitEditing={addCheck} />
                <Button label="Add check" small variant="secondary" onPress={addCheck} />
              </View>)}
            {row('attachments', 'Attachments', `${(t.attachments || []).length} link${(t.attachments || []).length === 1 ? '' : 's'}`,
              <View style={{ gap: 8 }}>
                {(t.attachments || []).map((a) => (
                  <Card key={a.id} pad={10} style={{ gap: 6 }}>
                    <T size={12}>{a.name || a.url}</T><T size={11} muted>{a.url}</T>
                    <Button label="Remove link" small variant="ghost" onPress={() => set({ attachments: t.attachments.filter((x) => x.id !== a.id) })} />
                  </Card>
                ))}
                <Input value={attachmentName} onChangeText={setAttachmentName} placeholder="Link name" />
                <Input value={attachmentUrl} onChangeText={setAttachmentUrl} placeholder="https://..." />
                <Button label="Add link" small variant="secondary" disabled={!/^https?:\/\//i.test(attachmentUrl.trim())} onPress={addAttachment} />
              </View>)}
            <View style={{gap:10,marginTop:7}}>
              <T size={15} weight="700">Activity · {t.comments.length} comments</T>
                {t.comments.map((cm) => (
                  <Card key={cm.id} pad={12} style={{ gap: 4 }}>
                    <T size={12} weight="600">{cm.by} <T size={12} muted>· {cm.at}</T></T>
                    <T size={13}>{cm.text}</T>
                  </Card>
                ))}
                <Input value={comment} onChangeText={setComment} placeholder="Write a comment" multiline />
                <Button label="Post comment" small disabled={!comment.trim()} onPress={() => { addComment(t.id, comment); setComment(''); }} />
            </View>
          </View>
          <View style={{display:detailTab==='planning'?'flex':'none',gap:8}}>
            <T size={16} weight="700">Planning & delivery</T>
            <T size={12} muted>Detailed planning and delivery fields for this project.</T>
            {row('subtasks', 'Subtasks', `${s.tasks.filter(x=>x.parentId===t.id).length} child tasks`,
              <View style={{gap:10}}><Input value={subTitle} onChangeText={setSubTitle} placeholder="New subtask title"/><Button label="Add subtask" small onPress={()=>{if(subTitle.trim()&&addSubtask(t.id,subTitle.trim()))setSubTitle('')}}/>
               {s.tasks.filter(x=>x.parentId===t.id).map(x=><T key={x.id} size={13}>{x.title} · {x.status}</T>)}
              </View>)}
            {row('stage', 'Stage', t.stage,
              <Segmented options={STAGES} value={t.stage} onChange={(v) => { set({ stage: v }); setOpen(null); }} />)}
            {row('type', 'Task type', s.taskTypeOptions?.find((tp) => tp.id === t.taskTypeId)?.name || t.type,
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {(s.taskTypeOptions || []).map((tp) => (
                  <Chip key={tp.id} label={tp.name} active={t.taskTypeId === tp.id} onPress={() => { set({ taskTypeId: tp.id }); setOpen(null); }} />
                ))}
              </View>)}
            {row('progress', 'Progress', `${t.status === 'Done' ? 100 : t.progress}%`,
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {[0, 25, 50, 75, 100].map((p) => (
                  <Chip key={p} label={`${p}%`} active={t.progress === p} onPress={() => { set({ progress: p }, `Progress of "${t.title}" set to ${p}%`); setOpen(null); }} />
                ))}
              </View>)}
            {row('parent', 'Parent task', t.parentId ? s.tasks.find((p) => p.id === t.parentId)?.title || t.parentId : 'Top-level',
              <View style={{ gap: 8 }}>
                <Chip label="Top-level task" active={!t.parentId} onPress={() => { set({ parentId: '' }); setOpen(null); }} />
                <Input value={parentDraft} onChangeText={setParentDraft} placeholder="Find a parent task" />
                {(() => { const below = open === 'parent' ? descendants(s.tasks, t.id) : NONE; return s.tasks.filter((p) => p.id !== t.id && !below.has(p.id) && p.title.toLowerCase().includes(parentDraft.trim().toLowerCase())).slice(0, 8).map((p) => (
                  <Chip key={p.id} label={p.title.slice(0, 45)} active={t.parentId === p.id} onPress={() => { set({ parentId: p.id }); setOpen(null); setParentDraft(''); }} />
                )); })()}
              </View>)}
            {row('release', 'Release', s.releases.find((r) => r.id === t.releaseId)?.name || 'Unassigned',
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                <Chip label="Unassigned" active={!t.releaseId} onPress={() => { set({ releaseId: '' }); setOpen(null); }} />
                {s.releases.map((r) => (
                  <Chip key={r.id} label={r.name} active={t.releaseId === r.id} onPress={() => { set({ releaseId: r.id }); setOpen(null); }} />
                ))}
              </View>)}
            {row('sprint', 'Sprint', active && t.sprint === active.id ? active.name : 'Not in active sprint',
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                <Chip
                  label={active ? (t.sprint === active.id ? `Remove from ${active.name}` : `Add to ${active.name}`) : 'No active sprint'}
                  active={!!active && t.sprint === active.id}
                  onPress={() => { if (active) { toggleSprintTask(t.id); setOpen(null); } }}
                />
              </View>)}
            {row('dependencies', 'Dependencies', depTasks.length ? `${depTasks.length} predecessor${depTasks.length === 1 ? '' : 's'}${blocked ? ' · blocked' : ''}` : 'None',
              <View style={{ gap: 10 }}>
                {depTasks.map((d) => (
                  <Card key={d.id} pad={10} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <T size={13} weight="500" numberOfLines={1} style={{ flex: 1 }}>{d.title}</T>
                    <Pill label={d.status} color={STATUS_COLOR[d.status]} />
                    <Button label="Remove" small variant="ghost" onPress={() => set({ dependsOn: t.dependsOn.filter((x) => x !== d.id) })} />
                  </Card>
                ))}
                <Input value={depDraft} onChangeText={setDepDraft} placeholder="Find a predecessor" />
                {depDraft.trim() ? s.tasks.filter((x) => x.id !== t.id && !t.dependsOn.includes(x.id) && x.title.toLowerCase().includes(depDraft.trim().toLowerCase())).slice(0, 8).map((x) => (
                  <Chip key={x.id} label={`Add: ${x.title.slice(0, 45)}`} onPress={() => { set({ dependsOn: [...t.dependsOn, x.id] }); setDepDraft(''); }} />
                )) : null}
              </View>)}
            {row('time', 'Time tracking', `${t.logged} logged hours`,
             <View style={{gap:9}}><T size={12} muted>Track work from this task; contributor rate captured on entry.</T><Input value={logHours} onChangeText={setLogHours} keyboardType="numeric" placeholder="Hours"/><Button small label="Log hours" onPress={()=>logTime({taskId:t.id,owner:t.owner||'Local operator',date:localDay(),hours:Number(logHours),note:''})}/></View>)}
            {row('custom', 'Custom fields', `${s.customFields.length} properties`,
              <View style={{gap:12}}>{s.customFields.map(f=><View key={f.id} style={{gap:6}}><T size={12} weight="600">{f.name}{f.required?' *':''}</T>
                {f.type==='boolean'?<Segmented options={['false','true']} value={String(t.customValues?.[f.id]??false)} onChange={v=>setCustomValue(t.id,f.id,v==='true')}/>:
                 f.type==='select'?<View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>{(f.options||[]).map(v=><Chip key={v} label={v} active={t.customValues?.[f.id]===v} onPress={()=>setCustomValue(t.id,f.id,v)}/>)}</View>:
                 <CustomValueInput value={t.customValues?.[f.id]} type={f.type} onDraft={v=>stage({customValues:{...(draft.current?.snapshot().patch.customValues||t.customValues||{}),[f.id]:v}})} onSave={async v=>{stage({customValues:{...(draft.current?.snapshot().patch.customValues||t.customValues||{}),[f.id]:v}});await saveTask();}}/>}
               </View>)}</View>)}
            {row('integrations','GitHub references',`${(t.githubLinks||[]).length} links`,
              <View style={{gap:8}}><T size={12} muted>Enable the GitHub Power-Up in Board tools before attaching a link.</T>
                <Input value={githubUrl} onChangeText={setGithubUrl} placeholder="https://github.com/owner/repo/issues/1"/>
                <Button small label="Attach reference" onPress={()=>{if(addGithubLink(t.id,githubUrl)){setGithubUrl('')}}}/>
                {(t.githubLinks||[]).map(link=><View key={link.url} style={{gap:5}}><T size={12} numberOfLines={2}>{link.url}</T>{link.title?<T size={12} muted numberOfLines={2}>{link.state?`${link.state} · `:''}{link.title}{link.lastChecked?` · checked ${link.lastChecked.slice(0,10)}`:''}</T>:null}<View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}><Button small variant="secondary" label="Refresh preview" onPress={()=>refreshGithubLink(t.id,link.url)}/><Button small variant="ghost" label="Remove link" onPress={()=>removeGithubLink(t.id,link.url)}/></View></View>)}
                {(workspace.projects.find(p=>p.id===workspace.selectedId)?.automationCommands||[]).filter(c=>c.enabled&&c.trigger==='cardButton').map(c=><Button key={c.id} small variant="secondary" label={`Run automation: ${c.name}`} onPress={()=>runCommand(c.id,t.id)}/>)}
              </View>)}
            {row('verification', 'Verification & delivery', t.merged ? 'Merge recorded' : t.verified ? 'Verified' : 'Not verified',
              <View style={{ gap: 10 }}>
                <T size={12} muted>Evidence records only. These actions do not run tests or merge code.</T>
                <Field label="Expected result"><Input editable={draftAvailable&&!saving} onBlur={commitDraft} value={t.expected || ''} onChangeText={(v) => stage({ expected: v })} multiline /></Field>
                <Field label="Actual result"><Input editable={draftAvailable&&!saving} onBlur={commitDraft} value={t.actual || ''} onChangeText={(v) => stage({ actual: v })} multiline /></Field>
                <Field label="Verification evidence"><Input editable={draftAvailable&&!saving} onBlur={commitDraft} value={t.evidence || ''} onChangeText={(v) => stage({ evidence: v })} multiline /></Field>
                <Field label="Rollback steps"><Input editable={draftAvailable&&!saving} onBlur={commitDraft} value={t.rollback || ''} onChangeText={(v) => stage({ rollback: v })} multiline /></Field>
                <Field label="Repository"><Input editable={draftAvailable&&!saving} onBlur={commitDraft} value={t.repo || ''} onChangeText={(v) => stage({ repo: v })} /></Field>
                <Field label="Branch"><Input editable={draftAvailable&&!saving} onBlur={commitDraft} value={t.branch || ''} onChangeText={(v) => stage({ branch: v })} /></Field>
                <Field label="Working commit"><Input editable={draftAvailable&&!saving} onBlur={commitDraft} value={t.commit || ''} onChangeText={(v) => stage({ commit: v })} /></Field>
                <Field label="Main branch SHA"><Input editable={draftAvailable&&!saving} onBlur={commitDraft} value={t.mainSha || ''} onChangeText={(v) => stage({ mainSha: v })} /></Field>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <Button label="Verify evidence" small disabled={!canVerify || !!t.verified} onPress={async() => {if(await saveTask(false)){verifyTask(t.id);await session?.syncNow?.();}}} />
                  <Button label="Record merge" small variant="secondary" disabled={!canMerge || !!t.merged} onPress={async() => {if(await saveTask(false)){mergeTask(t.id);await session?.syncNow?.();}}} />
                </View>
              </View>)}

          </View>
          <T size={11} muted>Task {t.id} · Due {fmt(t.due)} · {t.progress}% · {t.effort}h estimated</T>
        </>
      ) : null}
    </Sheet>
  );
}
