// /src/screens/delivery/Delivery.js
import { useMemo, useRef, useState } from 'react';
import {Fold,EditRow,Labeled,DangerConfirm} from '../../components/inline/CompactTools';
import { Pressable, ScrollView, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Avatar, Bar, Button, Card, Cell, Chip, Empty, Input, Sheet, Grid, Page, Pill, SectionTitle, Segmented, Stat, T, useWide } from '../../ui/ui';
import { useStore } from '../../store/store';
import { useTheme, PRIORITY_COLOR, STATUS_COLOR } from '../../ui/theme/theme';
import { CHECK_STATES, STAGES, addDays, fmt, gatesFor } from '../../store/data';
import { BurnChart } from '../../components/charts/charts';
import { localDay } from '../../utils/localDay.cjs';

// ---- Sprints: original agile lifecycle, modern visual language -----------------

const isoDay = localDay;
const sprintDraft = (s) => ({ name: s?.name || '', goal: s?.goal || '', start: s?.start || isoDay(), end: s?.end || addDays(isoDay(), 13) });

function SprintField({ label, value, onChange, multiline = false, placeholder }) {
  return <View style={{ gap: 5 }}>
    <T muted size={12}>{label}</T>
    <Input value={value} onChangeText={onChange} multiline={multiline} placeholder={placeholder} />
  </View>;
}

export function Sprints({ openTask }) {
  const { c } = useTheme();
  const wide = useWide();
  const { s, createSprint, updateSprint, deleteSprint, assignSprintTask, startSprint, finishSprint } = useStore();
  const [selectedId, setSelectedId] = useState('');
  const [formMode, setFormMode] = useState('');
  const [draft, setDraft] = useState(() => sprintDraft());
  const [validation, setValidation] = useState('');
  const [confirm, setConfirm] = useState('');
  const [search, setSearch] = useState('');
  const [backlogLimit, setBacklogLimit] = useState(25);
  const active = s.sprints.find(x => x.state === 'active');
  const selected = s.sprints.find(x => x.id === selectedId) || active || s.sprints.find(x => x.state === 'planned') || s.sprints.at(-1);
  const completed = s.sprints.filter(x => x.state === 'completed');
  const assigned = selected && selected.state !== 'completed' ? s.tasks.filter(t => t.sprint === selected.id) : [];
  const finished = assigned.filter(t => t.status === 'Done').length;
  const historyDone = selected?.state === 'completed' ? (selected.velocity || 0) : finished;
  const selectedCount = selected?.state === 'completed' ? (selected.taskIds || []).length : assigned.length;
  const burn = selected?.burn;
  const backlog = s.tasks.filter(t => !t.sprint && t.status !== 'Done' &&
    `${t.id} ${t.title} ${t.owner}`.toLowerCase().includes(search.trim().toLowerCase()));
  const canManage = !!selected && selected.state === 'planned';
  const canAssign = !!selected && selected.state !== 'completed';

  const startForm = (mode) => {
    setDraft(sprintDraft(mode === 'edit' ? selected : null));
    setValidation('');
    setFormMode(mode);
  };
  const updateDraft = (key, value) => setDraft(d => ({ ...d, [key]: value }));
  const saveForm = () => {
    if (!draft.name.trim()) { setValidation('Enter a sprint name.'); return; }
    if (draft.name.trim().length > 100) { setValidation('Sprint name must be 100 characters or less.'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.start) || !/^\d{4}-\d{2}-\d{2}$/.test(draft.end)) {
      setValidation('Use YYYY-MM-DD dates.'); return;
    }
    if (formMode === 'edit') {
      if (updateSprint(selected.id, draft)) { setFormMode(''); setValidation(''); }
    } else {
      const id = createSprint(draft);
      if (id) { setSelectedId(id); setFormMode(''); setValidation(''); }
    }
    // Domain validation failures also appear in the persistent store's error strip.
  };
  const commitAction = () => {
    if (!selected) return;
    const ok = confirm === 'delete' ? deleteSprint(selected.id) : finishSprint(selected.id);
    if (ok) { if (confirm === 'delete') setSelectedId(''); setConfirm(''); }
  };

  return <Page
    title="Sprints"
    subtitle={active ? `${active.name} · ${fmt(active.start)} to ${fmt(active.end)}` : 'Plan iterations, track delivery and manage the backlog'}
    actions={<Button label="New sprint" icon="plus" small onPress={() => startForm('create')} />}
  >
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
      {s.sprints.map(sp => <Chip key={sp.id} label={`${sp.name} · ${sp.state}`} active={sp.id === selected?.id}
        onPress={() => { setSelectedId(sp.id); setConfirm(''); setBacklogLimit(25); }} />)}
    </ScrollView>
    {!selected ? <Card style={{ gap: 10 }}>
      <T size={15} weight="600">No sprints yet</T>
      <T size={13} muted>Create a planned sprint, then assign tasks from the backlog.</T>
      <Button label="Create first sprint" icon="plus" small onPress={() => startForm('create')} />
    </Card> : <>
      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <View style={{ flex: 1, gap: 5 }}>
            <T size={17} weight="600">{selected.name}</T>
            <T size={12} muted>{fmt(selected.start)} – {fmt(selected.end)} · {selected.state}</T>
          </View>
          <Pill label={selected.state} color={selected.state === 'completed' ? STATUS_COLOR.Done : selected.state === 'active' ? c.accent : c.muted} />
        </View>
        {selected.goal ? <View style={{ gap: 5 }}>
          <T size={11} upper muted weight="600">Sprint goal</T>
          <T size={14} style={{ lineHeight: 22, letterSpacing: 0 }}>{selected.goal}</T>
        </View> : <T size={13} muted>No goal specified for this sprint.</T>}
        <Bar value={selectedCount ? historyDone / selectedCount : 0} height={6} />
        <T size={12} muted>{historyDone} of {selectedCount} completed · {Math.max(0, selectedCount - historyDone)} unfinished</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {canManage ? <>
            <Button label="Start sprint" icon="play" small onPress={() => startSprint(selected.id)} disabled={!!active} />
            <Button label="Edit" icon="edit-2" small variant="secondary" onPress={() => startForm('edit')} />
            <Button label="Delete" icon="trash-2" small variant="ghost" onPress={() => setConfirm('delete')} />
          </> : null}
          {selected.state === 'active' ? <Button label="Finish sprint" icon="flag" small onPress={() => setConfirm('finish')} /> : null}
        </View>
        {selected.state === 'planned' && !!active ? <T size={12} muted>Finish the active sprint before starting this one.</T> : null}
        {confirm ? <View style={{ gap: 10, padding: 12, borderWidth: 1, borderColor: c.line, borderRadius: 12 }}>
          <T size={13}>{confirm === 'delete' ? 'Delete this planned sprint? Assigned tasks will return to the backlog. This cannot be undone.' : 'Finish this sprint? Its history and final scope will be retained; unfinished tasks return to the backlog.'}</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Button label={confirm === 'delete' ? 'Delete sprint' : 'Confirm finish'} small variant={confirm === 'delete' ? 'danger' : 'primary'} onPress={commitAction} />
            <Button label="Cancel" small variant="ghost" onPress={() => setConfirm('')} />
          </View>
        </View> : null}
      </Card>
      <Grid>
        <Cell wide="48%" mobile="48%"><Stat label="Completion" value={`${selectedCount ? Math.round(100 * historyDone / selectedCount) : 0}%`} hint={`${historyDone} of ${selectedCount} tasks`} /></Cell>
        <Cell wide="48%" mobile="48%"><Stat label="Velocity" value={historyDone} hint={completed.length ? `Previous: ${completed.map(x => x.velocity || 0).join(', ')}` : 'No previous sprint'} /></Cell>
      </Grid>
      <Card style={{ gap: 12 }}>
        <SectionTitle>Burndown</SectionTitle>
        {burn ? <BurnChart burn={burn} height={wide ? 240 : 200} /> : <T size={13} muted>Burndown appears after the sprint starts and progress is recorded.</T>}
      </Card>
      {selected.state !== 'completed' ? <>
        <Card style={{ gap: 10 }}>
          <SectionTitle>Assigned tasks · {assigned.length}</SectionTitle>
          {assigned.length === 0 ? <T size={13} muted>No tasks assigned yet.</T> : null}
          {assigned.slice(0, 60).map(t => <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, borderBottomWidth: 1, borderColor: c.line }}>
            <Pressable style={{ flex: 1, gap: 3 }} onPress={() => openTask?.(t.id)}>
              <T size={13} weight="500" numberOfLines={2}>{t.title}</T>
              <T size={11} muted>{t.id} · {t.status}</T>
            </Pressable>
            <Button label="Remove" small variant="ghost" onPress={() => assignSprintTask(t.id, '')} />
          </View>)}
          {assigned.length > 60 ? <T muted size={12}>First 60 shown. Manage remaining assignments in Tasks.</T> : null}
        </Card>
        <Card style={{ gap: 10 }}>
          <SectionTitle>Unscheduled backlog · {backlog.length}</SectionTitle>
          <Input value={search} onChangeText={v => { setSearch(v); setBacklogLimit(25); }} placeholder="Find tasks by title, ID or owner" />
          {backlog.slice(0, backlogLimit).map(t => <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, borderBottomWidth: 1, borderColor: c.line }}>
            <Pressable style={{ flex: 1, gap: 3 }} onPress={() => openTask?.(t.id)}>
              <T size={13} weight="500" numberOfLines={2}>{t.title}</T>
              <T size={11} muted>{t.id} · {t.priority} · {t.status}</T>
            </Pressable>
            <Button label="Add" small variant="secondary" disabled={!canAssign} onPress={() => assignSprintTask(t.id, selected.id)} />
          </View>)}
          {backlog.length > backlogLimit ? <Button label="Show more" small variant="ghost" onPress={() => setBacklogLimit(n => n + 25)} /> : null}
          {backlog.length === 0 ? <T size={13} muted>No matching unassigned tasks.</T> : null}
        </Card>
      </> : <Card style={{ gap: 10 }}>
        <SectionTitle>Final sprint scope · {(selected.taskIds || []).length}</SectionTitle>
        <T size={12} muted>Completed {selected.completedAt?.slice(0, 10) || '—'} · archived scope is read-only. Task names below reflect their current records, not historical status.</T>
        {(selected.taskIds || []).slice(0, 60).map(id => {
          const task = s.tasks.find(t => t.id === id);
          return <Pressable key={id} disabled={!task} onPress={() => task && openTask?.(id)} style={{ paddingVertical: 6, borderBottomWidth: 1, borderColor: c.line }}>
            <T size={13} weight="500">{task?.title || `Deleted task (${id})`}</T>
            <T size={11} muted>{id}</T>
          </Pressable>;
        })}
        {(selected.taskIds || []).length > 60 ? <T size={12} muted>First 60 scope records shown.</T> : null}
      </Card>}
    </>}
    <Sheet visible={!!formMode} onClose={() => setFormMode('')} title={formMode === 'edit' ? 'Edit planned sprint' : 'Create sprint'}
      footer={<>
        <Button label="Cancel" small variant="ghost" onPress={() => setFormMode('')} />
        <Button label="Save sprint" small onPress={saveForm} />
      </>}>
      <SprintField label="Name" value={draft.name} onChange={v => updateDraft('name', v)} placeholder="Sprint 03" />
      <SprintField label="Goal" multiline value={draft.goal} onChange={v => updateDraft('goal', v)} placeholder="What should this iteration deliver?" />
      <SprintField label="Start (YYYY-MM-DD)" value={draft.start} onChange={v => updateDraft('start', v)} />
      <SprintField label="End (YYYY-MM-DD)" value={draft.end} onChange={v => updateDraft('end', v)} />
      {validation ? <T size={12} color={PRIORITY_COLOR.Critical}>{validation}</T> : null}
    </Sheet>
  </Page>;
}

// ---- Releases ---------------------------------------------------------------

export function Releases() {
  const { c } = useTheme();
  const {s,setStage,createRelease,editRelease,deleteRelease}=useStore();
  const [name,setName]=useState(''),[version,setVersion]=useState(''),[repo,setRepo]=useState(''),[notes,setNotes]=useState(''),[editing,setEditing]=useState('');
  const [formOpen,setFormOpen]=useState(false),pageRef=useRef(null);
  const reset=r=>{setEditing(r?.id||'');setName(r?.name||'');setVersion(r?.version||'');setRepo(r?.repo||'');setNotes(r?.notes||'')};
  // The form is in a fold at the top of the page: open it and scroll to it, otherwise Edit looks like it did nothing.
  const edit=r=>{reset(r);setFormOpen(true);pageRef.current?.scrollTo({y:0,animated:true})};
  const save=()=>{const data={name,version,repo,notes};const ok=editing?editRelease(editing,data):createRelease(data);if(ok){reset(null);setFormOpen(false)}};
  return (
    <Page title="Releases" scrollRef={pageRef} subtitle="Records and gates only. Nothing is pushed to Git from here.">
      <Fold title={editing?"Edit release":"Create or edit release"} subtitle="Manage release metadata and verification gates" open={formOpen} onToggle={setFormOpen}>
       <Labeled title="Release name" value={name} onChange={setName}/><Labeled title="Version" value={version} onChange={setVersion}/><Labeled title="Repository reference" value={repo} onChange={setRepo}/><Labeled title="Notes" value={notes} onChange={setNotes} multiline/>
       <Button label={editing?'Save release':'Create release'} small onPress={save}/>{editing?<Button label="Cancel edit" small variant="ghost" onPress={()=>reset(null)}/>:null}
      </Fold>
      {s.releases.map((r) => {
        const gates = gatesFor(r, s);
        const ready = gates.every((g) => g.ok);
        return (
          <Card key={r.id} style={{ gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <View style={{ gap: 4, flexShrink: 1 }}>
                <T serifFace size={22}>Release {r.name}</T>
                <T size={12} muted>{r.version} · {r.repo} · {r.tasks.length} linked tasks</T>
              </View>
              <Pill label={r.stage} color={ready ? STATUS_COLOR.Done : c.accent} />
            </View>

            <View style={{ gap: 10 }}>
              {gates.map((g) => (
                <View key={g.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Feather name={g.ok ? 'check-circle' : 'x-circle'} size={16} color={g.ok ? STATUS_COLOR.Done : PRIORITY_COLOR.Critical} />
                  <T size={13}>{g.label}</T>
                </View>
              ))}
            </View>

            <Segmented options={['Planned','Testing','Ready','Released']} value={r.stage} onChange={v=>setStage(r.id,v)}/>
            <EditRow title="Manage release" summary="Edit metadata or remove a release record">
             <Button label="Edit metadata" small variant="secondary" onPress={()=>edit(r)}/>
             <DangerConfirm label="Delete release" onConfirm={()=>deleteRelease(r.id)}/>
            </EditRow>
            {!ready && r.stage === 'Ready' ? (
              <T size={12} color={PRIORITY_COLOR.High}>Some gates are still open. Moving to Ready is allowed but flagged.</T>
            ) : null}
          </Card>
        );
      })}
    </Page>
  );
}

// ---- Testing (acceptance checks) -------------------------------------------

const CHECK_PAGE = 25; // shortcut: checks past the first page wait behind Show more; raise it if lists stay under ~100
export function Testing() {
  const { c } = useTheme();
  const { s, setCheck } = useStore();
  const [limit, setLimit] = useState(CHECK_PAGE);
  // One pass for the four counts and one lookup table, instead of a scan of every check per tile and of every task per check.
  const counts = useMemo(() => { const n = {}; for (const k of s.checks) n[k.status] = (n[k.status] || 0) + 1; return n; }, [s.checks]);
  const titles = useMemo(() => new Map(s.tasks.map((t) => [t.id, t.title])), [s.tasks]);

  return (
    <Page title="Testing" subtitle="Acceptance checks with evidence. Results are entered by people, not run automatically.">
      <Grid>
        {CHECK_STATES.map((st) => (
          <Cell key={st} wide="23%" mobile="48%">
            <Stat label={st[0].toUpperCase() + st.slice(1)} value={counts[st] || 0} accent={st === 'passed' ? STATUS_COLOR.Done : st === 'failed' || st === 'blocked' ? PRIORITY_COLOR.Critical : c.faint} />
          </Cell>
        ))}
      </Grid>

      {s.checks.slice(0, limit).map((k) => {
        const taskTitle = titles.get(k.taskId);
        return (
          <Card key={k.id} style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <T size={14} weight="600">{k.title}</T>
                <T size={12} muted>
                  {taskTitle !== undefined ? `On ${taskTitle}` : 'No task'}{k.evidence ? ' · evidence required' : ''}
                </T>
              </View>
              <Pill label={k.status} color={k.status === 'passed' ? STATUS_COLOR.Done : k.status === 'pending' ? STATUS_COLOR.Backlog : PRIORITY_COLOR.Critical} />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {CHECK_STATES.map((st) => (
                <Chip key={st} label={st} active={k.status === st} onPress={() => setCheck(k.id, st)} />
              ))}
            </View>
          </Card>
        );
      })}
      {s.checks.length > limit ? <Button label={`Show more (${s.checks.length - limit} left)`} small variant="ghost" onPress={() => setLimit((n) => n + CHECK_PAGE)} /> : null}
      {s.checks.length === 0 ? <Empty>No acceptance checks yet.</Empty> : null}
    </Page>
  );
}
