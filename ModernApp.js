import { Component, Profiler, memo, useCallback, useEffect, useRef, useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, StatusBar as NativeStatusBar, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import DrawerMotion from './src/DrawerMotion';
import { Feather } from '@expo/vector-icons';
import { ThemeProvider, radius, useTheme } from './src/theme';
import { StoreProvider, useStore } from './src/store';
import { Button, IconBtn, Input, T, useWide } from './src/ui';
import Backup from './src/screens/Backup';
import Overview from './src/screens/Overview';
import Board from './src/screens/Board';
import Timeline from './src/screens/Timeline';
import Tasks from './src/screens/Tasks';
import TaskSheet from './src/screens/TaskSheet';
import { Sprints, Releases, Testing } from './src/screens/Delivery';
import { Resources, Costs, Automations, Reports, Activity, Settings } from './src/screens/Workspace';
import { MAIN } from './src/data';
import { Scheduling, TaskConfiguration, Collaboration, Specifications } from './src/screens/Management';
import { Projects } from './src/screens/Projects';
import Portfolios from './src/screens/Portfolios';
import { Programs } from './src/screens/Programs';
import { diagnosticMonitor } from './src/diagnostics/monitor';
import IslandNotice from './src/IslandNotice';
import { noticeTopOffset } from './src/noticePlacement.cjs';

// Text can't be selected anywhere except in input fields (web, including phone browsers).
if (Platform.OS === 'web' && typeof document !== 'undefined' && !document.getElementById('no-select-style')) {
  const style = document.createElement('style');
  style.id = 'no-select-style';
  style.textContent =
    '*{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}' +
    'input,textarea{-webkit-user-select:text;user-select:text}';
  document.head.appendChild(style);
}

// Navigation mirrors the source app's 17 screens, grouped instead of one flat list.
const NAV = [
  {
    group: 'Plan',
    items: [
      ['overview', 'Overview', 'grid'],
      ['board', 'Board', 'columns'],
      ['timeline', 'Timeline', 'bar-chart-2'],
      ['scheduling', 'Scheduling', 'calendar'],
      ['tasks', 'Tasks', 'check-square'],
    ],
  },
  {
    group: 'Deliver',
    items: [
      ['sprints', 'Sprints', 'zap'],
      ['releases', 'Releases', 'tag'],
      ['testing', 'Testing', 'shield'],
    ],
  },
  {
    group: 'Team and money',
    items: [
      ['resources', 'Resources', 'users'],
      ['collaboration', 'Collaboration', 'message-circle'],
      ['costs', 'Costs', 'dollar-sign'],
    ],
  },
  {
    group: 'Governance',
    items: [
      ['projects', 'Projects', 'folder'],
      ['portfolios', 'Portfolios', 'layers'],
      ['programs', 'Programs', 'git-merge'],
    ],
  },
  {
    group: 'Operate',
    items: [
      ['taskconfig', 'Task configuration', 'sliders'],
      ['automations', 'Automations', 'cpu'],
      ['reports', 'Reports', 'pie-chart'],
      ['activity', 'Activity', 'activity'],
      ['specifications', 'Specifications', 'book-open'],
      ['backup', 'Backup', 'hard-drive'],
      ['settings', 'Settings', 'settings'],
    ],
  },
];

const SCREENS = {
  overview: Overview,
  board: Board,
  timeline: Timeline,
  scheduling: Scheduling,
  taskconfig: TaskConfiguration,
  collaboration: Collaboration,
  specifications: Specifications,
  tasks: Tasks,
  sprints: Sprints,
  releases: Releases,
  testing: Testing,
  resources: Resources,
  costs: Costs,
  projects: Projects,
  portfolios: Portfolios,
  programs: Programs,
  automations: Automations,
  reports: Reports,
  activity: Activity,
  backup: Backup,
  settings: Settings,
};

// Phone bottom bar: five primary screens. Everything else lives in the side menu.
const TABS = [
  ['overview', 'Overview', 'grid'],
  ['board', 'Board', 'columns'],
  ['timeline', 'Timeline', 'bar-chart-2'],
  ['tasks', 'Tasks', 'check-square'],
  ['sprints', 'Sprints', 'zap'],
];

function Brand() {
  const { mode } = useTheme();
  return (
    <Image source={mode==='dark'?require('./assets/niyarvo-projects-white.png'):require('./assets/niyarvo-projects-dark.png')}
      style={{width:205,height:56}} resizeMode="contain" accessibilityLabel="Niyarvo Projects" />
  );
}

function NavItem({ k, label, icon, current, go }) {
  const { c } = useTheme();
  const on = current === k;
  return (
    <Pressable
      onPress={() => go(k)}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 10,
        borderRadius: radius.sm, backgroundColor: on ? c.bg : 'transparent', borderWidth: on ? 1 : 0, borderColor: c.line,
      }}
    >
      <View style={k === 'timeline' ? { transform: [{ rotate: '90deg' }] } : undefined}><Feather name={icon} size={16} color={on ? c.ink : c.muted} /></View>
      <T size={14} weight={on ? '600' : '500'} color={on ? c.ink : c.muted}>{label}</T>
    </Pressable>
  );
}

// Project switcher: slides in over the menu, lists the open projects and ends with a + Create new row.
function ProjectDrawer({ onClose, onPick }) {
  const { c } = useTheme();
  const { projects, createProject } = useStore();
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const create = () => {
    const id = createProject(name);
    setName('');
    setNaming(false);
    onPick(id, true);
  };

  return (
    <DrawerMotion
      style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20, backgroundColor: c.surface,
        paddingTop: Platform.OS === 'ios' ? 64 : 52, paddingHorizontal: 14, paddingBottom: 24,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, marginBottom: 16 }}>
        <T serifFace size={20} weight="600">Projects</T>
        <IconBtn icon="x" label="Close projects" onPress={onClose} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {projects.filter((p) => !p.archived).map((p) => (
          <Pressable
            key={p.id}
            onPress={() => onPick(p.id, false)}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.md,
              backgroundColor: p.current ? c.surfaceAlt : 'transparent', borderWidth: 1, borderColor: p.current ? c.line : 'transparent',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <T weight="600" numberOfLines={1}>{p.name}</T>
              <T size={12} muted>Release {p.release} · {p.tasks} task{p.tasks === 1 ? '' : 's'}</T>
            </View>
            {p.current ? <Feather name="check" size={16} color={c.ink} /> : null}
          </Pressable>
        ))}

        {naming ? (
          <View style={{ gap: 10, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: c.line }}>
            <Input value={name} onChangeText={setName} placeholder="Project name" autoFocus onSubmitEditing={create} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button label="Create" small onPress={create} disabled={!name.trim()} />
              <Button label="Cancel" small variant="ghost" onPress={() => { setNaming(false); setName(''); }} />
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => setNaming(true)}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.md,
              borderWidth: 1, borderStyle: 'dashed', borderColor: c.faint, opacity: pressed ? 0.7 : 1,
            })}
          >
            <Feather name="plus" size={16} color={c.ink} />
            <T weight="600">Create new</T>
          </Pressable>
        )}
      </ScrollView>
    </DrawerMotion>
  );
}

// The project card at the top of the menu: tap it to open the project drawer.
function ProjectCard({ onPress }) {
  const { c } = useTheme();
  const { s } = useStore();
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel="Switch project"
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: radius.md,
        backgroundColor: c.surfaceAlt, marginBottom: 18, opacity: pressed ? 0.8 : 1,
      })}
    >
      <View style={{ flex: 1, gap: 3 }}>
        <T weight="600" numberOfLines={1}>{s.project.name}</T>
        <T size={12} muted>Release {s.project.release} · {s.tasks.length} tasks</T>
      </View>
      <Feather name="chevrons-right" size={16} color={c.muted} />
    </Pressable>
  );
}

function Sidebar({ current, go, onPickProject }) {
  const { c } = useTheme();
  const [drawer, setDrawer] = useState(false);
  return (
    <View style={{ width: 248, borderRightWidth: 1, borderRightColor: c.line, backgroundColor: c.surface, paddingVertical: 22, paddingHorizontal: 14, overflow: 'hidden' }}>
      <View style={{ paddingHorizontal: 8, marginBottom: 22 }}>
        <Brand />
      </View>
      <ProjectCard onPress={() => setDrawer(true)} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {NAV.map((g) => (
          <View key={g.group} style={{ marginBottom: 14, gap: 2 }}>
            <T upper size={10} weight="600" muted style={{ paddingHorizontal: 10, marginBottom: 6 }}>{g.group}</T>
            {g.items.map(([k, l, i]) => (
              <NavItem key={k} k={k} label={l} icon={i} current={current} go={go} />
            ))}
          </View>
        ))}
      </ScrollView>
      {drawer ? <ProjectDrawer onClose={() => setDrawer(false)} onPick={(id, isNew) => { setDrawer(false); onPickProject(id, isNew); }} /> : null}
    </View>
  );
}

// Phone side menu: slides in from the left, opened by the menu button in the header.
function SideMenu({ visible, current, go, onClose, onPickProject }) {
  const { c, mode } = useTheme();
  const [drawer, setDrawer] = useState(false);
  useEffect(() => {
    if (!visible) setDrawer(false);
  }, [visible]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(27,25,21,0.35)' }}>
        <View
          style={{
            width: 300,
            maxWidth: '85%',
            backgroundColor: c.surface,
            borderRightWidth: 1,
            borderColor: c.line,
            paddingTop: Platform.OS === 'ios' ? 64 : 52,
            paddingHorizontal: 14,
            paddingBottom: 24,
            overflow: 'hidden',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, marginBottom: 20 }}>
            <Brand />
            <IconBtn icon="x" label="Close menu" onPress={onClose} />
          </View>
          <ProjectCard onPress={() => setDrawer(true)} />
          <ScrollView showsVerticalScrollIndicator={false}>
            {NAV.map((g) => (
              <View key={g.group} style={{ marginBottom: 14, gap: 2 }}>
                <T upper size={10} weight="600" muted style={{ paddingHorizontal: 10, marginBottom: 6 }}>{g.group}</T>
                {g.items.map(([k, l, i]) => (
                  <NavItem key={k} k={k} label={l} icon={i} current={current} go={go} />
                ))}
              </View>
            ))}
          </ScrollView>
          {drawer ? <ProjectDrawer onClose={() => setDrawer(false)} onPick={(id, isNew) => { setDrawer(false); onPickProject(id, isNew); }} /> : null}
        </View>
        <Pressable onPress={onClose} style={{ flex: 1 }} accessibilityLabel="Dismiss menu" />
      </View>
    </Modal>
  );
}

function TopBar({ query, onQuery, onNew, mode, onToggleMode }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 32, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.line, backgroundColor: c.bg }}>
      <View style={{ flex: 1, maxWidth: 420, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: 14 }}>
        <Feather name="search" size={16} color={c.muted} />
        <Input value={query} onChangeText={onQuery} placeholder="Search tasks" style={{ flex: 1, backgroundColor: 'transparent', paddingHorizontal: 0 }} />
      </View>
      <View style={{ flex: 1 }} />
      <IconBtn icon={mode === 'dark' ? 'sun' : 'moon'} label="Toggle theme" onPress={onToggleMode} />
      <Button label="New task" icon="plus" small onPress={onNew} />
    </View>
  );
}

function TabBar({ current, go }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection:'row', backgroundColor:c.surface, borderTopColor:c.line, borderTopWidth:1, paddingHorizontal:8, paddingTop:7, paddingBottom:Platform.OS==='ios'?12:7 }}>
      {TABS.map(([k,l,i]) => {
        const on=current===k;
        return <Pressable key={k} accessibilityRole="tab" accessibilityLabel={l} accessibilityState={{selected:on}} onPress={()=>go(k)}
          style={({pressed})=>({flex:1, minHeight:55, borderRadius:15, alignItems:'center', justifyContent:'center', gap:3, backgroundColor:on?c.surfaceAlt:'transparent', opacity:pressed?0.65:1})}>
          <View style={k === 'timeline' ? { transform: [{ rotate: '90deg' }] } : undefined}><Feather name={i} size={19} color={on?c.accent:c.muted}/></View>
          <T size={11} weight={on?'700':'500'} color={on?c.ink:c.muted} numberOfLines={1}>{l}</T>
        </Pressable>;
      })}
    </View>
  );
}

// Catch JavaScript screen-render failures locally. In Expo Go an uncaught render
// exception can reset the entire shell to its default Overview tab, masking the
// actual screen that failed. Native process exits still require device logs.
class ScreenErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) {
    diagnosticMonitor.captureError(error, 'React render boundary', this.props.screenId, info?.componentStack || '');
    console.error(`[Niyarvo screen: ${this.props.screenId}]`, error, info?.componentStack || '');
  }
  render() {
    if (!this.state.error) return this.props.children;
    return <View style={{ flex: 1, padding: 22, gap: 14 }}>
      <T size={19} weight="600">{this.props.screenId} couldn't open</T>
      <T size={13} muted>{String(this.state.error.message || this.state.error)}</T>
      <T size={12} muted>The rest of your workspace is unchanged. See the Metro log for the component stack.</T>
      <Button label="Retry screen" small variant="secondary" onPress={() => { diagnosticMonitor.recordAction('retry screen'); this.setState({ error: null }); }} />
      {this.props.go ? <Button label="Open Settings diagnostics" small variant="ghost" onPress={() => this.props.go('settings')} /> : null}
    </View>;
  }
}

// Keep primary screens alive after their first visit. Re-mounting the entire
// Kanban gesture tree and Timeline SVGs every tab press caused lengthy pauses
// on Android. No hidden screen is mounted at startup (important for memory).
const CACHED_TABS = TABS.map(([id]) => id);
// Heavy Board and Timeline trees must unmount when hidden on every platform.
// Web previously retained both and continued expensive renders while offscreen.
// Keep lighter primary tabs cached for responsive switching.
const retainHiddenTab = (id) => id !== 'board' && id !== 'timeline';
const CachedPage = memo(function CachedPage({ pageId, active, openTask, go, query }) {
  // The large native Timeline creates SVGs/gestures. Commit navigation first,
  // then mount chart after the first interaction frames to avoid simultaneous
  // expensive tab-transition and chart reconciliation on Android.
  const [ready, setReady] = useState(Platform.OS==='web' || pageId!=='timeline');
  useEffect(() => {
    if (!active || ready) return undefined;
    let nextFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      nextFrame = requestAnimationFrame(() => setReady(true));
    });
    return () => { cancelAnimationFrame(firstFrame); cancelAnimationFrame(nextFrame); };
  }, [active, ready]);
  const ScreenComponent = SCREENS[pageId];
  return <View style={{ flex: 1, display: active ? 'flex' : 'none' }}>
    <ScreenErrorBoundary screenId={pageId} go={go}>
      {ready ? <Profiler id={pageId} onRender={(_, __, duration) => diagnosticMonitor.recordRender(pageId, duration)}>
        <ScreenComponent openTask={openTask} go={go} query={query} />
      </Profiler> : <View accessible accessibilityLabel="Opening timeline" style={{ flex:1,justifyContent:'center',alignItems:'center' }}><T size={13} muted>Preparing timeline…</T></View>}
    </ScreenErrorBoundary>
  </View>;
});

function Shell({}) {
  const { c, mode, setPref } = useTheme();
  const { addTask, switchProject, flush, notice, dismissNotice } = useStore();
  const wide = useWide();
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState('overview');
  const [visited, setVisited] = useState(['overview']);
  const [taskId, setTaskId] = useState(null);
  const [menu, setMenu] = useState(false);
  const [query, setQuery] = useState('');
  useEffect(() => { diagnosticMonitor.start(); diagnosticMonitor.recordScreen('overview'); }, []);
  const navigationRef = useRef({ screen: 'overview', at: Date.now() });
  useEffect(() => {
    const pending = navigationRef.current;
    // Two frames after committing the new tab approximates JS navigation paint latency.
    const first = requestAnimationFrame(() => {
      const second = requestAnimationFrame(() => diagnosticMonitor.recordTransition(pending.screen, Date.now()-pending.at));
      navigationRef.current.cancel = second;
    });
    return () => { cancelAnimationFrame(first); if(navigationRef.current.cancel) cancelAnimationFrame(navigationRef.current.cancel); };
  }, [screen]);

  const go = useCallback((k) => {
    navigationRef.current = { screen:k, at:Date.now() };
    diagnosticMonitor.recordScreen(k);
    setVisited(v => CACHED_TABS.includes(k) && !v.includes(k) ? [...v, k] : v);
    setScreen(k);
    setMenu(false);
  }, []);
  const openTask = useCallback((id) => setTaskId(id), []);
  // Picking a project opens it; a brand-new one starts on the Board so there is something to add to.
  const pickProject = useCallback((id, isNew) => {
    switchProject(id);
    setTaskId(null);
    setMenu(false);
    if (isNew) go('board');
  }, [switchProject, go]);
  const toggleMode = () => setPref(mode === 'dark' ? 'light' : 'dark');
  const newTask = () => { const id=addTask('Untitled task', 'Backlog', MAIN); if(id)setTaskId(id); };
  const onQuery = (q) => {
    setQuery(q);
    if (q && screen !== 'tasks') go('tasks');
  };


  const page = <>
    {CACHED_TABS.filter(id => visited.includes(id) && (retainHiddenTab(id) || id === screen)).map(id =>
      <CachedPage key={id} pageId={id} active={screen === id} openTask={openTask} go={go} query={query} />
    )}
    {!CACHED_TABS.includes(screen) ? (() => { const Current = SCREENS[screen]; return <ScreenErrorBoundary key={screen} screenId={screen} go={go}><Profiler id={screen} onRender={(_, __, duration) => diagnosticMonitor.recordRender(screen, duration)}><Current openTask={openTask} go={go} query={query} /></Profiler></ScreenErrorBoundary>; })() : null}
  </>;
  const sheet = <TaskSheet taskId={taskId} onClose={() => setTaskId(null)} />;
  const barStyle = mode === 'dark' ? 'light' : 'dark';
  const screenTitle = NAV.flatMap(group=>group.items).find(([id])=>id===screen)?.[1] || 'Overview';

  if (wide) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: c.bg }}>
        <StatusBar style={barStyle} translucent={false} />
        <Sidebar current={screen} go={go} onPickProject={pickProject} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <TopBar query={query} onQuery={onQuery} onNew={newTask} mode={mode} onToggleMode={toggleMode} />
          <View style={{ flex: 1 }}>{page}</View>
        </View>
        {sheet}
        <IslandNotice notice={notice} onDismiss={dismissNotice} wide topOffset={Math.max(20, insets.top + 16)} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, position: 'relative', backgroundColor: c.bg }}>
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: c.bg }}>
        <StatusBar style={barStyle} translucent={false} />
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:18, paddingTop:17, paddingBottom:16, minHeight:83, gap:12 }}>
          <View style={{ flex:1, minWidth:0, flexDirection:'row', alignItems:'center', gap:12 }}>
            <IconBtn icon="menu" label="Open menu" onPress={() => setMenu(true)} />
            <T weight="700" size={19} color={c.ink} numberOfLines={1} style={{flexShrink:1, letterSpacing:-0.25}}>{screenTitle}</T>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <IconBtn icon={mode === 'dark' ? 'sun' : 'moon'} label="Toggle theme" onPress={toggleMode} />
            <IconBtn icon="plus" label="New task" solid onPress={newTask} />
          </View>
        </View>
        <View style={{ flex: 1, minHeight: 0 }}>
          {page}
        </View>
        <TabBar current={screen} go={go} />
        {sheet}
        <SideMenu visible={menu} current={screen} go={go} onClose={() => setMenu(false)} onPickProject={pickProject} />
      </SafeAreaView>
      {/* Place the island at the top of the app, below the device status bar/cutout.
          Do not anchor it to the scrolling page or under the header. */}
      <IslandNotice
        notice={notice}
        onDismiss={dismissNotice}
        topOffset={noticeTopOffset(insets, Platform.OS, NativeStatusBar.currentHeight)}
      />
    </View>
  );
}

export default function ModernApp({}) {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StoreProvider>
          <Shell />
        </StoreProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
