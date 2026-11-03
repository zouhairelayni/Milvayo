// /src/screens/tasks/TaskSheet.js
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import TaskMarkdown from '../../components/inline/TaskMarkdown';
import TaskLabels from '../../components/inline/TaskLabels';
import { COLORS, textColor } from '../../ui/labelPalette.cjs';
import { Button, Card, Chip, Input, Pill, Segmented, Sheet, T } from '../../ui/ui';
import { useStore } from '../../store/store';
import { useTheme, PRIORITY_COLOR, STATUS_COLOR, serif } from '../../ui/theme/theme';
import { CHECK_STATES, PRIORITIES, STAGES, STATUS, isOverdue, fmt } from '../../store/data';
import InlineNotice from '../../components/notice/InlineNotice';
import { Field, InlineDrop, DateField, CustomValueInput } from './TaskFields';
import { localDay } from '../../utils/localDay.cjs';
import { descendants } from '../../domain/taskWorkflows.cjs';
const NONE = new Set();

export default function TaskSheet({ taskId, onClose }) {
  const { c } = useTheme();
  const { s, workspace, setLabels, updateTask, moveTask, addComment, toggleSprintTask, setLabelColor, setCheck, verifyTask, mergeTask, deleteTask, duplicateTask, addSubtask, setCustomValue, logTime, addGithubLink, removeGithubLink, refreshGithubLink, runCommand } = useStore();
  const t = s.tasks.find((x) => x.id === taskId);
  const [open, setOpen] = useState(null);
  const [mode, setMode] = useState('Standard');
  const [descriptionEditing, setDescriptionEditing] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [labelColorDraft, setLabelColorDraft] = useState(COLORS[0]);
  const [labelEditor, setLabelEditor] = useState(false);
  const [comment, setComment] = useState('');
  const [githubUrl,setGithubUrl]=useState('');
  const [confirmDelete,setConfirmDelete]=useState(false),[subTitle,setSubTitle]=useState(''),[logHours,setLogHours]=useState('1');
  const [depDraft, setDepDraft] = useState('');
  const [parentDraft, setParentDraft] = useState('');
  const [labelDraft, setLabelDraft] = useState('');
  const [checkDraft, setCheckDraft] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  useEffect(() => {
    setOpen(null); setMode('Standard'); setDescriptionEditing(false); setDescriptionDraft(''); setLabelEditor(false);
    setConfirmDelete(false); setGithubUrl(''); setSubTitle(''); setLogHours('1');
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
  const patchCheck = (key, changes) => t && set({ tests: t.tests.map((k) => k.id === key ? { ...k, ...changes } : k) }, `Updated acceptance evidence for ${t.id}`);
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

  const closeTask = () => {
    if (descriptionEditing && t && descriptionDraft !== (t.description || '')) set({ description: descriptionDraft });
    onClose();
  };

  const footer = t ? (
    <>
      <InlineNotice />
      <Button
        label="Duplicate" icon="copy" small variant="secondary"
        onPress={() => {duplicateTask(t.id);onClose();}}
      />
      <View style={{ flex: 1 }} />
      <Button label="Done" small onPress={closeTask} />
    </>
  ) : null;

  const row = (id, label, summary, children) => (
    <InlineDrop id={id} label={label} summary={summary} open={open} onToggle={setOpen}>{children}</InlineDrop>
  );

  return (
    <Sheet visible={!!t} onClose={closeTask} title={t ? 'Task details' : ''} footer={footer}>
      {t ? (
        <>
          <Input lazy value={t.title} onChangeText={v=>set({title:v})} accessibilityLabel="Task title" style={{fontFamily:serif,fontSize:23,fontWeight:'600',backgroundColor:'transparent',paddingHorizontal:0,paddingVertical:2,minHeight:48}} />
          <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,alignItems:'center'}}>
            <Pill label={s.boards.find(b=>b.id===t.board)?.name || 'Board'} color={c.muted} />
            <Pill label={t.status} color={STATUS_COLOR[t.status]} />
            {isOverdue(t)?<Pill label="Overdue" color={PRIORITY_COLOR.Critical}/>:null}
            {blocked?<Pill label="Blocked" color={PRIORITY_COLOR.High}/>:null}
          </View>
          <Segmented fill options={['Standard','Advanced']} value={mode} onChange={v=>{setMode(v);setOpen(null);}} />
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
                {COLORS.map(color=><Pressable key={color} accessibilityRole="button" accessibilityLabel={`Set label color ${color}`} onPress={()=>setLabelColorDraft(color)} style={{width:32,height:32,borderRadius:7,backgroundColor:color,alignItems:'center',justifyContent:'center',borderWidth:labelColorDraft===color?2:0,borderColor:c.ink}}>{labelColorDraft===color?<Feather name="check" size={18} color={textColor(color)}/>:null}</Pressable>)}
              </View>
              <Button small label="Create & assign label" disabled={!labelDraft.trim()} onPress={addLabel}/>
              {t.labels.length?<><T size={12} weight="600">Recolor assigned labels</T><View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>{t.labels.map(name=><Button key={name} small variant="secondary" label={`Recolor ${name}`} onPress={()=>setLabelColor(name,labelColorDraft)}/>)}</View></>:null}
            </Card>:null}
          </View>
          <View style={{gap:10}}>
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
              <T size={16} weight="700">Description</T>
              <Button small variant="secondary" icon={descriptionEditing?'check':'edit-2'} label={descriptionEditing?'Save':'Edit'} onPress={()=>{if(descriptionEditing){if(descriptionDraft!==t.description)set({description:descriptionDraft});setDescriptionEditing(false);}else{setDescriptionDraft(t.description||'');setDescriptionEditing(true);}}}/>
            </View>
            {descriptionEditing?<Card pad={12} style={{gap:10}}>
              <T size={12} muted>Markdown source · **bold**, *italic*, headings and lists</T>
              <Input value={descriptionDraft} onChangeText={setDescriptionDraft} multiline placeholder="Add a description..." style={{minHeight:160,fontSize:14}}/>
              <View style={{flexDirection:'row',gap:8}}>
                <Button small label="Save & preview" onPress={()=>{if(descriptionDraft!==t.description)set({description:descriptionDraft});setDescriptionEditing(false);}}/>
                <Button small variant="ghost" label="Cancel" onPress={()=>setDescriptionEditing(false)}/>
              </View>
            </Card>:<Pressable accessibilityRole="button" accessibilityLabel="Edit description" onPress={()=>{setDescriptionDraft(t.description||'');setDescriptionEditing(true);}} style={{padding:14,borderRadius:12,backgroundColor:c.surface,borderWidth:1,borderColor:c.line,minHeight:72}}>
              {t.description?<TaskMarkdown source={t.description}/>:<T muted size={13}>Add a description of the task, its purpose and next steps...</T>}
            </Pressable>}
          </View>
          <View style={{gap:4}}>
            <T size={15} weight="700" style={{marginTop:4,marginBottom:4}}>Essentials</T>
            {row('status', 'Status', t.status,
              <Segmented options={STATUS} value={t.status} onChange={(v) => { moveTask(t.id, v); setOpen(null); }} />)}
            {row('schedule', 'Schedule', `${t.start ? fmt(t.start) : 'No start'} – ${t.due ? fmt(t.due) : 'No due'}`,
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  <DateField label="Start" value={t.start} onValid={(v) => set({ start: v })} />
                  <DateField label="Due" value={t.due} onValid={(v) => set({ due: v })} />
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  <View style={{ flex: 1, minWidth: 135 }}><Field label="Effort (hours)">
                    <Input value={String(t.effort)} keyboardType="numeric" onChangeText={(v) => set({ effort: Number(v) || 0 })} />
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
                  <Chip key={name} label={name} active={t.owner === name} onPress={() => { set({ owner: name }, `Assigned "${t.title}" to ${name}`); setOpen(null); }} />
                ))}
              </View>)}
          </View>
          <View style={{gap:4}}>
            <T size={15} weight="700" style={{marginBottom:4}}>Activity & files</T>
            {row('checks', 'Acceptance checks', `${checks.filter((k) => k.status === 'passed').length}/${checks.length} passed`,
              <View style={{ gap: 10 }}>
                {checks.map((k) => (
                  <Card key={k.id} pad={12} style={{ gap: 10 }}>
                    <T size={13} weight="500">{k.title}</T>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {CHECK_STATES.map((st) => <Chip key={st} label={st} active={k.status === st} onPress={() => setCheck(k.id, st)} />)}
                    </View>
                    <Input lazy
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
          {mode==='Advanced'?<View style={{gap:4}}>
            <T size={16} weight="700">Advanced planning & delivery</T>
            <T size={12} muted>Detailed fields remain available without crowding standard tasks.</T>
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
                 <CustomValueInput value={t.customValues?.[f.id]} type={f.type} onSave={v=>setCustomValue(t.id,f.id,v)}/>}
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
                <Field label="Expected result"><Input lazy value={t.expected || ''} onChangeText={(v) => set({ expected: v })} multiline /></Field>
                <Field label="Actual result"><Input lazy value={t.actual || ''} onChangeText={(v) => set({ actual: v })} multiline /></Field>
                <Field label="Verification evidence"><Input lazy value={t.evidence || ''} onChangeText={(v) => set({ evidence: v })} multiline /></Field>
                <Field label="Rollback steps"><Input lazy value={t.rollback || ''} onChangeText={(v) => set({ rollback: v })} multiline /></Field>
                <Field label="Repository"><Input lazy value={t.repo || ''} onChangeText={(v) => set({ repo: v })} /></Field>
                <Field label="Branch"><Input lazy value={t.branch || ''} onChangeText={(v) => set({ branch: v })} /></Field>
                <Field label="Working commit"><Input lazy value={t.commit || ''} onChangeText={(v) => set({ commit: v })} /></Field>
                <Field label="Main branch SHA"><Input lazy value={t.mainSha || ''} onChangeText={(v) => set({ mainSha: v })} /></Field>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <Button label="Verify evidence" small disabled={!canVerify || !!t.verified} onPress={() => verifyTask(t.id)} />
                  <Button label="Record merge" small variant="secondary" disabled={!canMerge || !!t.merged} onPress={() => mergeTask(t.id)} />
                </View>
              </View>)}
            {row('delete', 'Delete task', 'Requires confirmation · creates recovery snapshot',
             <View style={{gap:10}}><T muted size={12}>Deletes the task and cleans dependencies. Saved recovery snapshot first.</T>{confirmDelete?<><Button small label="Confirm delete" variant="danger" onPress={()=>{if(deleteTask(t.id))onClose();setConfirmDelete(false)}}/><Button small label="Cancel" variant="ghost" onPress={()=>setConfirmDelete(false)}/></>:<Button label="Delete task" small variant="ghost" onPress={()=>setConfirmDelete(true)}/>}</View>)}
          </View>:null}
          <T size={11} muted>Task {t.id} · Due {fmt(t.due)} · {t.progress}% · {t.effort}h estimated</T>
        </>
      ) : null}
    </Sheet>
  );
}
