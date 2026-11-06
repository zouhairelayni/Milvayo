// /src/screens/overview/Overview.js
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ScreenIntro, MetricStrip, Bar, Button, Card, Cell, Grid, Page, Pill, SectionTitle, Sheet, Stat, T, useWide } from '../../ui/ui';
import { useStore } from '../../store/store';
import { useTheme, PRIORITY_COLOR, STATUS_COLOR } from '../../ui/theme/theme';
import { STAGES, STATUS, fmt, gatesFor, isOverdue, progressOf } from '../../store/data';
import { useProjectTools } from '../../store/useProjectTools';
import { localDay } from '../../utils/localDay.cjs';
import { todayTasks } from './today.cjs';

export default function Overview({ openTask, go, openStatus, onNewTask, onOpenBackup }) {
  const { c } = useTheme();
  const wide = useWide();
  const { s } = useStore();
  const tools = useProjectTools(); // switched-off tools drop their shortcuts here; their data is untouched
  const [attentionLimit, setAttentionLimit] = useState(5);
  const [alert, setAlert] = useState(null);
  const sample = s.project.id === 'sample-workspace';

  const counts = STATUS.map((st) => ({ st, n: s.tasks.filter((t) => t.status === st).length }));
  const progress = progressOf(s.tasks);
  const passed = s.checks.filter((k) => k.status === 'passed').length;
  const overdue = s.tasks.filter(isOverdue).length;
  const release = s.releases.find((r) => r.stage !== 'Released');
  const gates = release ? gatesFor(release, s) : [];
  const { attention, upcoming } = todayTasks(s.tasks, localDay());
  const stages = STAGES.map((st) => ({ st, n: s.tasks.filter((t) => t.stage === st).length }));
  const maxStage = Math.max(1, ...stages.map((x) => x.n));

  return (
    <Page title="Today">
      <ScreenIntro title="Today's work" description={`${s.project.name} · ${new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}`} action={!wide ? <Button label="Add task" icon="plus" onPress={onNewTask}/> : null} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Button label={`Needs attention (${attention.length})`} icon="alert-circle" variant="secondary" onPress={() => { setAttentionLimit(5); setAlert('attention'); }} />
        <Button label={`Next due (${upcoming.length})`} icon="calendar" variant="secondary" onPress={() => setAlert('due')} />
      </View>
      <SectionTitle right={<Button label="All tasks" variant="ghost" onPress={() => go('tasks')} />}>Project overview</SectionTitle>
      {sample || s.tasks.length === 0 ? <Card style={{ gap: 16 }}>
        <T size={18} weight="500">{sample ? 'Make this workspace yours' : 'Start with one task'}</T>
        <T size={14} muted>{sample ? 'Explore the sample, then open Projects to start your own work or import a project file.' : `Add work to ${s.project.name}, or bring in a project file you already have.`}</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Button label={sample ? 'Add a task' : 'Add your first task'} icon="plus" onPress={onNewTask} />
          <Button label="Import a project" variant="secondary" onPress={onOpenBackup} />
        </View>
        <Button label="Open projects" variant="ghost" onPress={() => go('projects')} />
      </Card> : null}
      <MetricStrip items={counts.map(({ st, n }) => ({ label: st, value: n, color: STATUS_COLOR[st], hint: `${Math.round(n / Math.max(1, s.tasks.length) * 100)}% of tasks`, onPress: () => openStatus(st) }))} />

      <Grid>
        <Cell wide={tools.releases ? '58%' : '100%'}>
          <Card style={{ gap: 16 }}>
            <SectionTitle>Weighted progress</SectionTitle>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12 }}>
              <T size={wide ? 44 : 36} weight="600" style={{ fontVariant: ['tabular-nums'] }}>{Math.round(progress * 100)}%</T>
              {tools.testing ? <T muted size={13} style={{ marginBottom: wide ? 12 : 0, flexShrink: 1, maxWidth: '100%' }}>{passed} of {s.checks.length} acceptance checks passed</T> : null}
            </View>
            <Bar value={progress} height={8} />
            <View style={{ flexDirection: 'row', gap: 22, flexWrap: 'wrap' }}>
              <Mini label="Overdue" value={overdue} color={overdue ? PRIORITY_COLOR.Critical : c.ink} onPress={() => go('tasks')} />
              <Mini label="Milestones" value={s.tasks.filter((t) => t.milestone).length} onPress={() => go('timeline')} />
              {tools.sprints ? <Mini label="In sprint" value={s.tasks.filter((t) => t.sprint).length} onPress={() => go('sprints')} /> : null}
            </View>
          </Card>
        </Cell>

        {tools.releases ? <Cell wide="38%">
          <Card style={{ gap: 12 }}>
            <SectionTitle right={<Pill label={release ? release.stage : 'None'} color={c.accent} />}>
              Release {release ? release.name : ''} readiness
            </SectionTitle>
            {gates.length === 0 ? <T muted>No release in progress.</T> : null}
            {gates.map((g) => (
              <View key={g.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Feather name={g.ok ? 'check-circle' : 'circle'} size={16} color={g.ok ? STATUS_COLOR.Done : c.faint} />
                <T size={13}>{g.label}</T>
              </View>
            ))}
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Button label="Open releases" small variant="secondary" onPress={() => go('releases')} />
              {tools.testing ? <Button label="Open testing" icon="arrow-right" small variant="ghost" onPress={() => go('testing')} /> : null}
            </View>
          </Card>
        </Cell> : null}
      </Grid>

      <Grid>
        <Cell wide="48%">
          <Card style={{ gap: 14 }}>
            <SectionTitle>Stage distribution</SectionTitle>
            {stages.map(({ st, n }) => (
              <View key={st} style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <T size={13} weight="500">{st}</T>
                  <T size={13} muted>{n}</T>
                </View>
                <Bar value={n / maxStage} height={6} color={c.ink} />
              </View>
            ))}
          </Card>
        </Cell>

      </Grid>
      <Sheet visible={alert !== null} compact title={alert === 'attention' ? 'Needs attention' : 'Next due'} onClose={() => setAlert(null)}
        footer={<Button label="Done" variant="secondary" onPress={() => setAlert(null)} />}>
        {alert === 'attention' ? <>
        <Card pad={0} style={{ overflow: 'hidden' }}>
          {attention.length === 0 ? <View style={{ padding: 16, gap: 4 }}><T size={14}>Nothing needs attention</T><T size={13} muted>Overdue tasks and unfinished dependencies appear here.</T></View> : null}
          {attention.slice(0, attentionLimit).map(({ task, overdue: late, blockers }, i) => <Pressable key={task.id} accessibilityRole="button" accessibilityLabel={`Open task ${task.title}`} onPress={() => { setAlert(null); openTask(task.id); }}
            style={({ pressed }) => ({ minHeight: 60, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: i ? 1 : 0, borderColor: c.line, backgroundColor: pressed ? c.surfaceAlt : 'transparent' })}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: late ? PRIORITY_COLOR.Critical : PRIORITY_COLOR[task.priority] }} />
            <View style={{ flex: 1, gap: 4 }}><T size={14} numberOfLines={2}>{task.title}</T><T size={12} color={late ? PRIORITY_COLOR.Critical : c.muted}>{late ? `Overdue since ${fmt(task.due)}` : `Waiting on ${blockers.length} ${blockers.length === 1 ? 'dependency' : 'dependencies'}`}</T></View>
            <Feather name="chevron-right" size={16} color={c.muted} />
          </Pressable>)}
          {attention.length > attentionLimit ? <View style={{ padding: 8 }}><Button label="Show more attention items" variant="ghost" onPress={() => setAttentionLimit(n => n + 10)} /></View> : null}
        </Card>
        </> : <>
        <Card pad={0} style={{ overflow: 'hidden' }}>
          {upcoming.length === 0 ? <View style={{ padding: 16 }}><T size={13} muted>No upcoming dated tasks. Open Tasks to schedule work.</T></View> : null}
          {upcoming.map((t, i) => <Pressable key={t.id} accessibilityRole="button" accessibilityLabel={`Open task ${t.title}`} onPress={() => { setAlert(null); openTask(t.id); }}
            style={({ pressed }) => ({ minHeight: 56, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderColor: c.line, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: pressed ? c.surfaceAlt : 'transparent' })}>
            <View style={{ flex: 1, gap: 4 }}><T size={14} numberOfLines={2}>{t.title}</T><T size={12} muted>{t.owner}</T></View>
            <T size={12} muted style={{ fontVariant: ['tabular-nums'] }}>{fmt(t.due)}</T>
          </Pressable>)}
          <View style={{ padding: 8, borderTopWidth: 1, borderColor: c.line }}><Button label="All tasks" variant="ghost" icon="arrow-right" onPress={() => { setAlert(null); go('tasks'); }} /></View>
        </Card>
        </>}
      </Sheet>
    </Page>
  );
}

function Mini({ label, value, color, onPress }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} style={({ pressed }) => ({ gap: 2, minHeight: 44, justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
      <T size={20} weight="600" color={color}>{value}</T>
      <T size={12} muted>{label}</T>
    </Pressable>
  );
}
