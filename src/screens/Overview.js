import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Avatar, Bar, Button, Card, Cell, Grid, Page, Pill, SectionTitle, Stat, T, useWide } from '../ui';
import { useStore } from '../store';
import { useTheme, PRIORITY_COLOR, STATUS_COLOR } from '../theme';
import { STAGES, STATUS, fmt, gatesFor, isOverdue, progressOf } from '../data';

export default function Overview({ openTask, go }) {
  const { c } = useTheme();
  const wide = useWide();
  const { s } = useStore();

  const counts = STATUS.map((st) => ({ st, n: s.tasks.filter((t) => t.status === st).length }));
  const progress = progressOf(s.tasks);
  const passed = s.checks.filter((k) => k.status === 'passed').length;
  const overdue = s.tasks.filter(isOverdue).length;
  const release = s.releases.find((r) => r.stage !== 'Released');
  const gates = release ? gatesFor(release, s) : [];
  const upcoming = s.tasks
    .filter((t) => t.status !== 'Done')
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 5);
  const stages = STAGES.map((st) => ({ st, n: s.tasks.filter((t) => t.stage === st).length }));
  const maxStage = Math.max(1, ...stages.map((x) => x.n));

  return (
    <Page title="Overview" subtitle={`${s.project.name} · release ${s.project.release} · freeze ${fmt(s.project.due)}`}>
      <Grid>
        {counts.map(({ st, n }) => (
          <Cell key={st} wide="23%" mobile="48%">
            <Stat label={st} value={n} accent={STATUS_COLOR[st]} hint={`${Math.round((n / Math.max(1, s.tasks.length)) * 100)}% of tasks`} />
          </Cell>
        ))}
      </Grid>

      <Grid>
        <Cell wide="58%">
          <Card style={{ gap: 16 }}>
            <SectionTitle>Weighted progress</SectionTitle>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14 }}>
              <T size={wide ? 64 : 52} weight="600" serifFace style={{ letterSpacing: -2 }}>{Math.round(progress * 100)}%</T>
              <T muted size={13} style={{ marginBottom: 12 }}>{passed} of {s.checks.length} acceptance checks passed</T>
            </View>
            <Bar value={progress} height={8} />
            <View style={{ flexDirection: 'row', gap: 22, flexWrap: 'wrap' }}>
              <Mini label="Overdue" value={overdue} color={overdue ? PRIORITY_COLOR.Critical : c.ink} />
              <Mini label="Milestones" value={s.tasks.filter((t) => t.milestone).length} />
              <Mini label="In sprint" value={s.tasks.filter((t) => t.sprint).length} />
            </View>
          </Card>
        </Cell>

        <Cell wide="38%">
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
            <Button label="Open testing" icon="arrow-right" small variant="ghost" onPress={() => go('testing')} />
          </Card>
        </Cell>
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

        <Cell wide="48%">
          <Card style={{ gap: 4 }}>
            <SectionTitle right={<Button label="All tasks" small variant="ghost" onPress={() => go('tasks')} />}>Next due</SectionTitle>
            {upcoming.map((t, i) => (
              <View key={t.id}>
                {i > 0 ? <View style={{ height: 1, backgroundColor: c.line, marginVertical: 10 }} /> : null}
                <Card pad={0} onPress={() => openTask(t.id)} style={{ borderWidth: 0, backgroundColor: 'transparent', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Avatar name={t.owner} size={30} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <T size={14} weight="500" numberOfLines={1}>{t.title}</T>
                    <T size={12} muted>{t.owner}</T>
                  </View>
                  <T size={12} weight="600" color={isOverdue(t) ? PRIORITY_COLOR.Critical : c.muted}>{fmt(t.due)}</T>
                </Card>
              </View>
            ))}
          </Card>
        </Cell>
      </Grid>
    </Page>
  );
}

function Mini({ label, value, color }) {
  return (
    <View style={{ gap: 2 }}>
      <T size={20} weight="600" color={color}>{value}</T>
      <T size={12} muted>{label}</T>
    </View>
  );
}
