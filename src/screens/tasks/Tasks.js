// /src/screens/tasks/Tasks.js
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, View, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ActionMenu, IconBtn, EmptyState, ScreenIntro, Avatar, Button, Card, Chip, Empty, Input, Page, Pill, Sheet, T, useWide } from '../../ui/ui';
import { useStore, useScreenActive } from '../../store/store';
import { useHeaderActions } from '../../components/shell/HeaderActions';
import {Fold,EditRow,DangerConfirm,Dropdown} from '../../components/inline/CompactTools';
import TaskLabels from '../../components/inline/TaskLabels';
import { TaskConfiguration } from '../management/Management';
import { useTheme, PRIORITY_COLOR, STATUS_COLOR } from '../../ui/theme/theme';
import { MAIN, PRIORITIES, STATUS, fmt } from '../../store/data';
import DueSoon from './DueSoon';
import { dueSoonForList } from './dueSoon.cjs';
import { localDay } from '../../utils/localDay.cjs';

const planning = require('../../domain/planning.cjs');
const workflows = require('../../domain/taskWorkflows.cjs');
const gantt = require('../../timeline/gantt.cjs');

const PAGE_SIZE = Platform.OS === 'web' ? 80 : 20;
const SORTS = { Due: { sort: 'due', descending: false }, Priority: { sort: 'priority', descending: true }, Progress: { sort: 'progress', descending: false }, Title: { sort: 'title', descending: false }, Manual: { sort: 'position', descending: false } };
const LAYOUTS = ['List', 'Tree', 'By status', 'By stage'];

export default function Tasks({ openTask, query = '', statusRequest = null }) {
  const { c } = useTheme();
  const wide = useWide();
  // NP533_COLUMNS: actual viewport width, not desktop shell preference. Avoid columns overflowing portrait Web.
  const roomForColumns = useWindowDimensions().width >= 1080;
  const { s, moveTask, bulkStatus, bulkSet, addTask, workspace, saveTaskView, deleteTaskView, togglePowerUp } = useStore();
  const project=workspace.projects.find(p=>p.id===workspace.selectedId);
  const today = localDay();
  const { boards: dateBoards, tasks: upcoming } = useMemo(() => dueSoonForList(project, today), [project, today]);
  const [viewName,setViewName]=useState('');
  const [toolsOpen,setToolsOpen]=useState(false);
  const screenActive = useScreenActive();
  const headerControls = useMemo(() => ({actions:[{label:'Tools',icon:'sliders',variant:'secondary',onPress:()=>setToolsOpen(true)}]}),[]);
  useHeaderActions('tasks', headerControls, screenActive);
  const [q, setQ] = useState(query);
  const [filter, setFilter] = useState('All');
  const [labelFilter,setLabelFilter]=useState('All');
  const [sort, setSort] = useState('Due');
  const [picked, setPicked] = useState([]);
  const heldRef=useRef(false);
  const [pages, setPages] = useState(1);
  const [layout, setLayout] = useState('By status');
  const [prioFilter, setPrioFilter] = useState('All');
  const [ownerFilter, setOwnerFilter] = useState('All');

  useEffect(() => setQ(query), [query]);
  useEffect(() => { if (statusRequest) { setFilter(statusRequest.status); setLabelFilter('All'); } }, [statusRequest]);
  useEffect(() => setPages(1), [q,filter,sort,labelFilter,prioFilter,ownerFilter,layout]);

  // Progress of every task, parents rolled up from their subtasks (null when the task tree is inconsistent).
  const rollups = useMemo(() => { try { return planning.progressRollups(s.tasks); } catch { return null; } }, [s.tasks]);
  const overall = useMemo(() => { try { return planning.projectProgress(s.tasks).progress; } catch { return null; } }, [s.tasks]);
  const list = useMemo(() => {
    const tagged = labelFilter === 'All' ? s.tasks : s.tasks.filter((t) => (t.labels || []).includes(labelFilter));
    const found = workflows.query(tagged, { text: q, status: filter, priority: prioFilter, owner: ownerFilter });
    return planning.filterSort(found, { id: 'tasks-screen', name: 'Tasks', filters: {}, ...SORTS[sort] }, rollups);
  }, [s.tasks, filter, labelFilter, prioFilter, ownerFilter, q, sort, rollups]);
  // One list of rows for every layout: a plain list, the parent and subtask tree, or groups by status or stage.
  const rows = useMemo(() => {
    const flat = list.map((task) => ({ kind: 'task', task, depth: 0 }));
    if (layout === 'Tree') {
      try { const keep = new Set(list.map((t) => t.id)); return workflows.hierarchyOrder(s.tasks).filter((x) => keep.has(x.task.id)).map((x) => ({ kind: 'task', task: x.task, depth: x.depth })); } catch { return flat; }
    }
    if (layout === 'By status' || layout === 'By stage') return gantt.buildRows(list, layout === 'By stage' ? 'stage' : 'status').map((r) => (r.kind === 'group' ? r : { kind: 'task', task: r.task, depth: 0 }));
    return flat;
  }, [list, layout, s.tasks]);
  const pageOf = useMemo(() => workflows.page(rows, PAGE_SIZE, pages), [rows, pages]);

  // Tag list and per-status counts: one pass, only when the tasks change (not on every search keystroke).
  const { allLabels, counts, owners } = useMemo(() => {
    const tags = new Set(), people = new Set(), n = {};
    for (const t of s.tasks) { n[t.status] = (n[t.status] || 0) + 1; if (t.owner) people.add(t.owner); for (const l of t.labels || []) tags.add(l); }
    return { allLabels: [...tags].sort((a, b) => a.localeCompare(b)), counts: n, owners: [...people].sort((a, b) => a.localeCompare(b)) };
  }, [s.tasks]);
  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const clearPicked = () => setPicked([]);
  const applyBulk = (status) => {
    if (bulkStatus(picked, status)) clearPicked();
  };
  const applyBulkField = (field, value) => { if (bulkSet(picked, field, value)) clearPicked(); };

  return (
    <Page
      title="Tasks"
      subtitle={`${list.length} of ${s.tasks.length} tasks${overall !== null ? ` · ${overall}% complete` : ''}`}
    >
      <ScreenIntro title="Task list" description={`${list.length} of ${s.tasks.length} tasks${overall !== null ? ` · ${overall}% complete` : ''}`} />
      {dateBoards.length ? <DueSoon key={project.id} tasks={upcoming} onOpenTask={openTask} /> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <View style={{ flex: 1, minWidth: 200 }}>
          <Input lazy value={q} onChangeText={setQ} placeholder="Search title or owner" accessibilityLabel="Search task list" />
        </View>
        <IconBtn icon="sliders" label="Filter and organize tasks" onPress={()=>setToolsOpen(true)}/>
      </View>
      <View style={{flexDirection:'row',alignItems:'center',gap:8}}><Chip label={layout} active onPress={()=>setToolsOpen(true)}/><T muted size={12}>{filter==='All'?'All statuses':filter} · {sort} order</T></View>

      <Sheet visible={toolsOpen} onClose={()=>setToolsOpen(false)} title="Organize tasks" showNotice={false} footer={<Button label="Done" onPress={()=>setToolsOpen(false)}/> }>
      <T size={16} weight="600">Filters & tags</T>
        <T size={12} muted weight="600">Status</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {['All', ...STATUS].map(st => <Chip key={st} label={st==='All'?`All ${s.tasks.length}`:`${st} ${counts[st]||0}`} active={filter===st} onPress={()=>setFilter(st)}/>)}
        </View>
        <T size={12} muted weight="600">Priority</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {['All', ...PRIORITIES].map((p) => <Chip key={p} label={p} active={prioFilter===p} onPress={()=>setPrioFilter(p)}/>)}
        </View>
        {owners.length ? <><T size={12} muted weight="600">Owner</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {['All', ...owners].map((o) => <Chip key={o} label={o} active={ownerFilter===o} onPress={()=>setOwnerFilter(o)}/>)}
        </View></> : null}
        <T size={12} muted weight="600">Sort by</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {Object.keys(SORTS).map((k) => <Chip key={k} label={k} active={sort===k} onPress={()=>setSort(k)}/>)}
        </View>
        <T size={12} muted weight="600">Layout</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {LAYOUTS.map((l) => <Chip key={l} label={l} active={layout===l} onPress={()=>setLayout(l)}/>)}
        </View>
        <T size={12} muted>Tree shows subtasks under their parent with the progress of all their subtasks. Grouped layouts keep the manual order inside each group.</T>
        <T size={12} muted weight="600">Tags</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Chip label="All tags" active={labelFilter==='All'} onPress={()=>setLabelFilter('All')}/>
          {allLabels.map(tag=><Chip key={tag} label={tag} active={labelFilter===tag} onPress={()=>setLabelFilter(tag)}/>)}
        </View>
        <T size={12} muted>Hold a task row to select it for bulk actions. Tap its square to update completion.</T>
      <Fold title="Saved task views" subtitle={`${(project.savedViews||[]).length} saved filters and sorting presets`}>
        <Input value={viewName} onChangeText={setViewName} placeholder="Name this view"/>
        <Button small label="Save current view" onPress={()=>{if(viewName.trim()&&saveTaskView({id:`view-${Date.now()}`,name:viewName.trim(),filters:{status:filter,priority:prioFilter,owner:ownerFilter,text:q,label:labelFilter},sort:SORTS[sort].sort,descending:SORTS[sort].descending}))setViewName('')}}/>
        {(project.savedViews||[]).map(v=><EditRow key={v.id} title={v.name} summary={`${v.filters.status}${v.filters.label&&v.filters.label!=='All'?' · '+v.filters.label:''} · ${v.sort}`}><Button small variant="secondary" label="Apply view" onPress={()=>{setFilter(v.filters.status);setQ(v.filters.text);setLabelFilter(v.filters.label||'All');setPrioFilter(v.filters.priority||'All');setOwnerFilter(v.filters.owner||'All');setSort(Object.keys(SORTS).find(k=>SORTS[k].sort===v.sort)||'Due')}}/><DangerConfirm label="Delete saved view" onConfirm={()=>deleteTaskView(v.id)}/></EditRow>)}
      </Fold>
      <View style={{ gap: 8 }}>
        <T size={14} weight="600">Due soon</T>
        <T size={12} muted>Choose the boards whose upcoming dates appear in List.</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {s.boards.filter(b => !b.archived).map(b => <Chip key={b.id} label={b.name} active={(project.powerUps?.[b.id] || []).includes('calendar')} onPress={() => togglePowerUp(b.id, 'calendar')} />)}
        </View>
      </View>
      <TaskConfiguration embedded />
      </Sheet>
      {picked.length > 0 ? (
        <Card style={{ gap: 12, backgroundColor: c.surfaceAlt, width: '100%' }}>
          <T weight="600" style={{ flexShrink: 0 }} numberOfLines={1}>{picked.length} selected</T>
          <View style={{flexDirection:'row',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            <Button label="Mark Done" icon="check" onPress={()=>applyBulk('Done')}/>
            <Button label="Clear" variant="ghost" onPress={clearPicked}/>
            <ActionMenu label="Change selected tasks" items={[
              {label:'Move to Validation',icon:'check-square',onPress:()=>applyBulk('Validation')},
              ...PRIORITIES.map(p=>({label:`Priority: ${p}`,icon:'flag',onPress:()=>applyBulkField('priority',p)})),
              ...['Development','Testing','Production'].map(stage=>({label:`Stage: ${stage}`,icon:'layers',onPress:()=>applyBulkField('stage',stage)})),
            ]}/>
          </View>
          {owners.length ? <><T size={12} muted weight="600">Assign selected to</T><Dropdown options={owners.map((o) => ({ value: o, label: o }))} value={null} onChange={(o) => applyBulkField('owner', o)} /></> : null}
        </Card>
      ) : null}

      <View style={{overflow:'hidden'}}>
        {roomForColumns && list.length ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, minHeight: 44, backgroundColor: c.surfaceAlt }}>
            <View style={{ width: 20 }} />
            <T size={12} weight="500" muted style={{ flex: 1 }}>Task</T>
            <T size={12} weight="500" muted style={{ width: 150 }}>Owner</T>
            <T size={12} weight="500" muted style={{ width: 62 }}>Due</T>
            <T size={12} weight="500" muted style={{ width: 104 }}>Status</T>
            <T size={12} weight="500" muted style={{ width: 80 }}>Priority</T>
          </View>
        ) : null}
        {list.length === 0 ? <Empty>No tasks match these filters.</Empty> : null}
        {pageOf.items.map((row, i) => {
          if (row.kind === 'group') return <View key={row.key} style={{ paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'transparent', borderTopWidth: i ? 1 : 0, borderColor: c.line }}><T size={12} weight="600" muted>{row.title} · {row.count}</T></View>;
          const t = row.task, roll = rollups?.get(t.id);
          const on = picked.includes(t.id);
          return (
            <Pressable
              key={t.id}
              accessibilityRole="button"
              accessibilityLabel={`${t.title}, ${t.status}, ${t.priority} priority`}
              accessibilityHint="Long press to select for bulk actions"
              accessibilityState={{selected:on}}
              onPressIn={() => {heldRef.current=false}}
              onPress={() => {if(heldRef.current)return;picked.length ? toggle(t.id) : openTask(t.id)}}
              onLongPress={() => {heldRef.current=true;toggle(t.id)}}
              delayLongPress={450}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 14 + row.depth * 18, paddingRight: 16, paddingVertical: 20,minHeight:88,
                borderTopWidth: i ? 1 : 0, borderColor: c.line, opacity: pressed ? 0.7 : 1, backgroundColor: on ? c.surfaceAlt : undefined,
              })}
            >
              <Pressable
                onPress={(e) => {e?.stopPropagation?.();moveTask(t.id,t.status==='Done'?'In progress':'Done')}}
                hitSlop={12}
                accessibilityRole="checkbox"
                accessibilityState={{checked:t.status==='Done'}}
                accessibilityLabel={t.status==='Done'?'Mark task in progress':'Mark task done'}
                style={{
                  width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
                  borderColor: t.status==='Done' ? c.accent : c.faint, backgroundColor: t.status==='Done' ? c.accent : 'transparent',
                }}
              >
                {t.status==='Done' ? <Feather name="check" size={13} color={c.accentInk} /> : null}
              </Pressable>

              <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                <T size={15} weight="500" numberOfLines={2}>{t.title}</T>
                <T size={12} muted numberOfLines={1}>
                  {t.type} · {t.stage}{roll && roll.rollup ? ` · ${roll.progress}% of ${roll.children} subtask${roll.children === 1 ? '' : 's'}` : ''}
                </T>
                {!!t.labels.length?<TaskLabels labels={t.labels.slice(0,roomForColumns?4:2)} colors={project?.labelColors||{}} compact/>:null}
              </View>

              {roomForColumns ? (
                <View style={{ width: 150, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Avatar name={t.owner} size={22} />
                  <T size={12} muted numberOfLines={1}>{t.owner}</T>
                </View>
              ) : null}
              {roomForColumns ? <T size={12} muted style={{ width: 62 }}>{fmt(t.due)}</T> : null}
              {roomForColumns ? <View style={{ width: 104 }}><Pill label={t.status} color={STATUS_COLOR[t.status]} /></View> : <View accessibilityLabel={t.status} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: STATUS_COLOR[t.status] }} />}
              <View style={roomForColumns ? { width: 80 } : undefined}><Pill label={t.priority} color={PRIORITY_COLOR[t.priority]} /></View>
            </Pressable>
          );
        })}
      </View>
      {pageOf.hasMore ? <Button label={`Show more tasks (${pageOf.total-pageOf.items.length} remaining)`} small variant="secondary" onPress={()=>setPages(n=>n+1)} /> : null}
    </Page>
  );
}
