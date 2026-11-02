// /src/screens/delivery/Sprints.js
import { useState } from 'react';
import { localDay } from '../../utils/localDay.cjs';
import { Pressable, ScrollView, View } from 'react-native';
import { Bar, Button, Card, Cell, Chip, Input, Sheet, Grid, Page, Pill, SectionTitle, Stat, T, useWide } from '../../ui/ui';
import { useStore } from '../../store/store';
import { useTheme, PRIORITY_COLOR, STATUS_COLOR } from '../../ui/theme/theme';
import { addDays, fmt } from '../../store/data';
import { BurnChart } from '../../components/charts/charts';

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
              <T size={11} muted>{t.status}</T>
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
              <T size={11} muted>{t.priority} · {t.status}</T>
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
