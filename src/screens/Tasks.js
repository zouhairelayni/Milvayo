import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Avatar, Button, Card, Chip, Empty, Input, Page, Pill, Segmented, T, useWide } from '../ui';
import { useStore } from '../store';
import {Fold,EditRow,DangerConfirm} from './CompactTools';
import { useTheme, PRIORITY_COLOR, STATUS_COLOR } from '../theme';
import { MAIN, PRIORITIES, STATUS, fmt } from '../data';

export default function Tasks({ openTask, query = '' }) {
  const { c } = useTheme();
  const wide = useWide();
  const { s, moveTask, bulkStatus, addTask, workspace, saveTaskView, deleteTaskView } = useStore();
  const project=workspace.projects.find(p=>p.id===workspace.selectedId);
  const [viewName,setViewName]=useState('');
  const [q, setQ] = useState(query);
  const [filter, setFilter] = useState('All');
  const [labelFilter,setLabelFilter]=useState('All');
  const [sort, setSort] = useState('Due');
  const [picked, setPicked] = useState([]);
  const heldRef=useRef(false);
  const [visibleLimit, setVisibleLimit] = useState(80);

  useEffect(() => setQ(query), [query]);
  useEffect(() => setVisibleLimit(80), [q,filter,sort,labelFilter]);

  const needle = q.trim().toLowerCase();
  const list = s.tasks
    .filter((t) => (filter === 'All' || t.status === filter))
    .filter((t) => labelFilter === 'All' || t.labels.includes(labelFilter))
    .filter((t) => !needle || t.title.toLowerCase().includes(needle) || t.owner.toLowerCase().includes(needle))
    .sort((a, b) =>
      sort === 'Due' ? a.due.localeCompare(b.due) : PRIORITIES.indexOf(b.priority) - PRIORITIES.indexOf(a.priority)
    );

  const allLabels=[...new Set(s.tasks.flatMap(t=>t.labels||[]))].sort((a,b)=>a.localeCompare(b));
  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const clearPicked = () => setPicked([]);
  const applyBulk = (status) => {
    bulkStatus(picked, status);
    clearPicked();
  };

  return (
    <Page
      title="Tasks"
      subtitle={`${list.length} of ${s.tasks.length} tasks`}
      actions={<Button label="New task" icon="plus" small onPress={() => openTask(addTask('Untitled task', 'Backlog', MAIN))} />}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <View style={{ flex: 1, minWidth: 200 }}>
          <Input value={q} onChangeText={setQ} placeholder="Search title or owner" />
        </View>
        <Segmented options={['Due', 'Priority']} value={sort} onChange={setSort} />
      </View>

      <Fold title="Filters & tags" subtitle={`${filter === 'All' ? 'All statuses' : filter} · ${labelFilter === 'All' ? 'All tags' : labelFilter} · ${list.length} tasks`}>
        <T size={12} muted weight="600">Status</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {['All', ...STATUS].map(st => <Chip key={st} label={st==='All'?`All ${s.tasks.length}`:`${st} ${s.tasks.filter(t=>t.status===st).length}`} active={filter===st} onPress={()=>setFilter(st)}/>)}
        </View>
        <T size={12} muted weight="600">Tags</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Chip label="All tags" active={labelFilter==='All'} onPress={()=>setLabelFilter('All')}/>
          {allLabels.map(tag=><Chip key={tag} label={tag} active={labelFilter===tag} onPress={()=>setLabelFilter(tag)}/>)}
        </View>
        <T size={12} muted>Hold a task row to select it for bulk actions. Tap its square to update completion.</T>
      </Fold>

      <Fold title="Saved task views" subtitle={`${(project.savedViews||[]).length} saved filters and sorting presets`}>
        <Input value={viewName} onChangeText={setViewName} placeholder="Name this view"/>
        <Button small label="Save current view" onPress={()=>{if(viewName.trim()&&saveTaskView({id:`view-${Date.now()}`,name:viewName.trim(),filters:{status:filter,priority:'All',text:q,owner:'All'},sort:sort==='Due'?'due':'priority'}))setViewName('')}}/>
        {(project.savedViews||[]).map(v=><EditRow key={v.id} title={v.name} summary={`${v.filters.status} · ${v.sort}`}><Button small variant="secondary" label="Apply view" onPress={()=>{setFilter(v.filters.status);setQ(v.filters.text);setSort(v.sort==='due'?'Due':'Priority')}}/><DangerConfirm label="Delete saved view" onConfirm={()=>deleteTaskView(v.id)}/></EditRow>)}
      </Fold>
      {picked.length > 0 ? (
        <Card style={{ gap: 12, backgroundColor: c.surfaceAlt, width: '100%' }}>
          <T weight="600" style={{ flexShrink: 0 }} numberOfLines={1}>{picked.length} selected</T>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button label="Mark Done" icon="check" small onPress={() => applyBulk('Done')} />
          <Button label="To Validation" small variant="ghost" onPress={() => applyBulk('Validation')} />
          <Button label="Clear" small variant="ghost" onPress={clearPicked} />
          </View>
        </Card>
      ) : null}

      <Card pad={0} style={{ overflow: 'hidden' }}>
        {list.length === 0 ? <Empty>No tasks match these filters.</Empty> : null}
        {list.slice(0,visibleLimit).map((t, i) => {
          const on = picked.includes(t.id);
          return (
            <Pressable
              key={t.id}
              onPressIn={() => {heldRef.current=false}}
              onPress={() => {if(heldRef.current)return;picked.length ? toggle(t.id) : openTask(t.id)}}
              onLongPress={() => {heldRef.current=true;toggle(t.id)}}
              delayLongPress={450}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12,
                borderTopWidth: i ? 1 : 0, borderColor: c.line, opacity: pressed ? 0.7 : 1, backgroundColor: on ? c.surfaceAlt : undefined,
              })}
            >
              <Pressable
                onPress={(e) => {e?.stopPropagation?.();moveTask(t.id,t.status==='Done'?'In progress':'Done')}}
                hitSlop={8}
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
                <T size={14} weight="500" numberOfLines={1}>{t.title}</T>
                <T size={12} muted numberOfLines={1}>
                  {t.id.toUpperCase()} · {t.type} · {t.stage}
                </T>
                {!!t.labels.length ? <View style={{flexDirection:'row',flexWrap:'wrap',gap:5,alignItems:'center'}}>
                  {t.labels.slice(0,wide?4:2).map(tag=><View key={tag} style={{backgroundColor:c.surfaceAlt,paddingHorizontal:7,paddingVertical:2,borderRadius:9}}><T size={10} muted numberOfLines={1}>{tag}</T></View>)}
                  {t.labels.length>(wide?4:2)?<T size={10} muted>+{t.labels.length-(wide?4:2)}</T>:null}
                </View>:null}
              </View>

              {wide ? (
                <View style={{ width: 150, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Avatar name={t.owner} size={22} />
                  <T size={12} muted numberOfLines={1}>{t.owner}</T>
                </View>
              ) : null}
              {wide ? <T size={12} muted style={{ width: 62 }}>{fmt(t.due)}</T> : null}
              {wide ? <Pill label={t.status} color={STATUS_COLOR[t.status]} /> : <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: STATUS_COLOR[t.status] }} />}
              <Pill label={wide ? t.priority : t.priority.slice(0, 1)} color={PRIORITY_COLOR[t.priority]} />
            </Pressable>
          );
        })}
      </Card>
      {list.length > visibleLimit ? <Button label={`Show more tasks (${list.length-visibleLimit} remaining)`} small variant="secondary" onPress={()=>setVisibleLimit(n=>n+80)} /> : null}
    </Page>
  );
}
