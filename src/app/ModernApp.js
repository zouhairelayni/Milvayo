// /src/app/ModernApp.js
import { Profiler, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, StatusBar as NativeStatusBar, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../ui/theme/theme';
import { StoreProvider, StoreFreeze, useStore } from '../store/store';
import { Button, IconBtn, LayoutProvider, T, useLayoutPreference, useWide } from '../ui/ui';
import { Sidebar, SideMenu } from '../components/shell/Menus';
import { TopBar, TabBar, HeaderControls } from '../components/shell/Bars';
import MenuToggle from '../components/shell/MenuToggle';
import BoardMorph from '../components/brand/BoardMorph';
import { HeaderActionsContext } from '../components/shell/HeaderActions';
import ScreenErrorBoundary from '../components/shell/ScreenErrorBoundary';
import Overview from '../screens/overview/Overview';
import Board from '../screens/board/Board';
import Timeline from '../screens/timeline/Timeline';
import Tasks from '../screens/tasks/Tasks';
import TaskSheet, { NewTaskSheet } from '../screens/tasks/TaskSheet';
import { Sprints, Releases, Testing } from '../screens/delivery/Delivery';
import { Resources, Costs, Automations, Reports, Activity, Settings } from '../screens/workspace/Workspace';
import { MAIN } from '../store/data';
import { Scheduling, TaskConfiguration, Collaboration, Specifications } from '../screens/management/Management';
import { Projects } from '../screens/governance/Projects';
import Portfolios from '../screens/governance/Portfolios';
import { Programs } from '../screens/governance/Programs';
import { diagnosticMonitor } from '../diagnostics/monitor';
import IslandNotice from '../components/notice/IslandNotice';
import { backupJobs } from '../store/backupJobs';
import { noticeTopOffset } from '../components/notice/noticePlacement.cjs';
import { shouldRenderPage, retainsHiddenTabs } from './navigation/pageRetention.cjs';
import { resolveVisited, addVisited } from './navigation/visitedTabs.cjs';

// Text can't be selected anywhere except in input fields (web, including phone browsers).
if (Platform.OS === 'web' && typeof document !== 'undefined' && !document.getElementById('no-select-style')) {
  const style = document.createElement('style');
  style.id = 'no-select-style';
  style.textContent =
    '*{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}' +
    'input,textarea{-webkit-user-select:text;user-select:text}' +
    '[role=button]:focus-visible,[role=tab]:focus-visible,input:focus-visible,textarea:focus-visible{outline:2px solid currentColor;outline-offset:2px}' +
    '@media(prefers-reduced-motion:reduce){*,*:before,*:after{scroll-behavior:auto!important;transition-duration:0.01ms!important}}';
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
      ['automations', 'Automations', 'cpu'],
      ['reports', 'Reports', 'pie-chart'],
      ['activity', 'Activity', 'activity'],
      ['specifications', 'Specifications', 'book-open'],
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


// Only the active page subscribes to the workspace. Hidden screens otherwise
// recalculate charts and reconcile rows on every keystroke.
const CACHED_TABS = TABS.map(([id]) => id);
// Tripwire, not a workaround: Shell must mount exactly once per JS run. A second mount means something above it
// remounted the app (v0.5.12 root cause, see TimelineGestureHost). Fast Refresh also trips it in development.
let shellMounts = 0;
const DEFERRED_NATIVE_TABS = ['timeline', 'board', 'tasks', 'sprints'];
// Native retains visited primary tabs (a tab switch is a visibility toggle, not a rebuild). Hidden pages sit behind
// StoreFreeze, so they no longer re-render on every edit. Web keeps unmounting heavy hidden screens.
const retainHiddenTab = () => retainsHiddenTabs(Platform.OS);
const CachedPage = memo(function CachedPage({ pageId, active, openTask, onNewTask, go, query, openStatus, statusRequest }) {
  // Heavy native screens (Timeline SVG/gestures, Board cards, Tasks, Sprints): commit the tab change first so the
  // bar, title and press feedback respond at once, then mount the screen two frames later. Only the first visit pays;
  // afterwards the page stays mounted and hidden.
  const [ready, setReady] = useState(Platform.OS==='web' || !DEFERRED_NATIVE_TABS.includes(pageId));
  useEffect(() => {
    if (!active || ready) return undefined;
    let nextFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      nextFrame = requestAnimationFrame(() => setReady(true));
    });
    return () => { cancelAnimationFrame(firstFrame); cancelAnimationFrame(nextFrame); };
  }, [active, ready]);
  const shown = useRef(false);
  useEffect(() => {
    if (active && ready) {
      if (shown.current) diagnosticMonitor.recordAction(`tab shown from retained page: ${pageId}`);
      shown.current = true;
    }
  }, [active, ready, pageId]);
  const ScreenComponent = SCREENS[pageId];
  // The screen element keeps its identity when only `active` flips, so showing a retained page re-renders nothing
  // unless the store or its query really changed while it was hidden.
  const content = useMemo(() => ready
    ? <Profiler id={pageId} onRender={(_, __, duration) => diagnosticMonitor.recordRender(pageId, duration)}>
        <ScreenComponent openTask={openTask} onNewTask={onNewTask} go={go} query={query} openStatus={openStatus} statusRequest={statusRequest} />
      </Profiler>
    : <View accessible accessibilityLabel={`Opening ${pageId}`} style={{ flex:1,justifyContent:'center',alignItems:'center' }}><T size={13} muted>{`Preparing ${pageId}…`}</T></View>,
  [ready, pageId, ScreenComponent, openTask, onNewTask, go, query, openStatus, statusRequest]);
  return <View style={{ flex: 1, display: active ? 'flex' : 'none' }}>
    <StoreFreeze frozen={!active}>
      <ScreenErrorBoundary screenId={pageId} go={go}>{content}</ScreenErrorBoundary>
    </StoreFreeze>
  </View>;
}, (prev, next) => !shouldRenderPage(prev, next)); // memo's comparator answers "equal, skip?"

function Shell({}) {
  const { c, mode, setPref } = useTheme();
  const { addTask, switchProject, workspace, workspaceId, notice, dismissNotice } = useStore();
  const wide = useWide();
  const { preference, setPreference } = useLayoutPreference();
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState('overview');
  const [backupRequest, setBackupRequest] = useState(0);
  const [backupNotice, setBackupNotice] = useState(null);
  const lastBackupEvent = useRef(null);
  const queuedBackupEvent = useRef(null);
  useEffect(() => {
    const subscription = backupJobs.subscribe(({event}) => {
      if (!event || event.id === lastBackupEvent.current) return;
      lastBackupEvent.current = event.id;
      if (AppState.currentState !== 'active') queuedBackupEvent.current = event;
      else setBackupNotice(event);
    });
    const app = AppState.addEventListener('change', status => {
      if (status === 'active' && queuedBackupEvent.current) {
        setBackupNotice(queuedBackupEvent.current);
        queuedBackupEvent.current = null;
      }
    });
    return () => { subscription(); app.remove(); };
  }, []);
  const projectId = `${workspaceId}/${workspace.selectedId}`; // project ids repeat when a backup is imported as a second workspace
  const projectIdRef = useRef(projectId);
  projectIdRef.current = projectId;
  const [visitedState, setVisitedState] = useState({ projectId, list: ['overview'] });
  // After a project switch only the visible tab is rebuilt; other tabs mount lazily on their next visit.
  const visited = resolveVisited(visitedState, projectId, screen, CACHED_TABS);
  const [taskId, setTaskId] = useState(null);
  const [creatingTask, setCreatingTask] = useState(false);
  const [menu, setMenu] = useState(false);
  const [headerActions, setHeaderActions] = useState(null);
  const registerHeaderActions = useCallback((value) => setHeaderActions(value), []);
  const [query, setQuery] = useState('');
  useEffect(() => {
    diagnosticMonitor.start();
    diagnosticMonitor.recordAction('shell mounted');
    shellMounts += 1;
    if (shellMounts > 1) diagnosticMonitor.recordAction(`UNEXPECTED SHELL REMOUNT #${shellMounts}`);
    diagnosticMonitor.recordScreen('overview');
    return () => diagnosticMonitor.recordAction('shell unmounted');
  }, []);
  const navigationRef = useRef({ screen: 'overview', at: Date.now() });
  const intentRef = useRef(null);
  if (!intentRef.current) intentRef.current = require('./navigation/navigationIntent.cjs').createNavigationIntent();
  useEffect(() => {
    const pending = navigationRef.current;
    // Two frames after committing the new tab approximates JS navigation paint latency.
    const first = requestAnimationFrame(() => {
      const second = requestAnimationFrame(() => diagnosticMonitor.recordTransition(pending.screen, Date.now()-pending.at));
      navigationRef.current.cancel = second;
    });
    return () => { cancelAnimationFrame(first); if(navigationRef.current.cancel) cancelAnimationFrame(navigationRef.current.cancel); };
  }, [screen]);

  const tabQueue = useRef(null);
  const go = useCallback((k, source = 'screen or menu') => {
    tabQueue.current?.clear();
    if (!SCREENS[k] || navigationRef.current.screen === k) return;
    const fromScreen = navigationRef.current.screen;
    diagnosticMonitor.recordAction(`navigation request: ${navigationRef.current.screen} -> ${k}; source=${source}`);
    intentRef.current.advance();
    navigationRef.current = { screen:k, at:Date.now() };
    diagnosticMonitor.recordScreen(k);
    setVisitedState(v => addVisited(v, projectIdRef.current, fromScreen, k, CACHED_TABS));
    setScreen(k);
    setMenu(false);
  }, []);
  if (!tabQueue.current) tabQueue.current = require('./navigation/navigationQueue.cjs').createNavigationQueue(
    requestAnimationFrame, cancelAnimationFrame, k => go(k, 'bottom tab'));
  const requestTab = useCallback(k => tabQueue.current.request(k), []);
  useEffect(() => () => tabQueue.current.clear(), []);
  const openTask = useCallback((id) => setTaskId(id), []);
  // Overview tiles: open Tasks already filtered to one status.
  const [statusRequest, setStatusRequest] = useState(null);
  const openStatus = useCallback((status) => { setStatusRequest({ status }); go('tasks'); }, [go]);
  // Picking a project opens it; a brand-new one starts on the Board so there is something to add to.
  const pickProject = useCallback((id, isNew) => {
    switchProject(id);
    setTaskId(null);
    setMenu(false);
    if (isNew) go('board');
  }, [switchProject, go]);
  // "Open project" from Portfolios / Programs: select the project, then show its governance detail in Projects.
  const [projectRequest, setProjectRequest] = useState(null);
  const openProject = useCallback((id) => {
    if (!switchProject(id)) return;
    setTaskId(null);
    setProjectRequest(id);
    go('projects');
  }, [switchProject, go]);
  const clearProjectRequest = useCallback(() => setProjectRequest(null), []);
  // A different workspace: close the open task and drop filters and requests that pointed into the old one.
  useEffect(() => { setTaskId(null); setCreatingTask(false); setQuery(''); setStatusRequest(null); setProjectRequest(null); setMenu(false); }, [workspaceId]);
  const toggleMode = () => setPref(mode === 'light' ? 'dark' : mode === 'dark' ? 'amoled' : 'light');
  const newTask = useCallback(() => setCreatingTask(true), []);
  const saveNewTask = ({title, description, status, priority}) => {
    const id = addTask(title, status, MAIN, {description, priority});
    if (id) { setCreatingTask(false); setTaskId(id); }
  };
  const onQuery = (q) => {
    setQuery(q);
    if (q && screen !== 'tasks') go('tasks');
  };

  
  const page = <HeaderActionsContext.Provider value={registerHeaderActions}>
    {CACHED_TABS.filter(id => visited.includes(id) && (retainHiddenTab(id) || id === screen)).map(id =>
      <CachedPage key={`${projectId}:${id}`} pageId={id} active={screen === id} openTask={openTask} onNewTask={newTask} go={go} query={query} openStatus={openStatus} statusRequest={statusRequest} />
    )}
    {!CACHED_TABS.includes(screen) ? (() => { const Current = SCREENS[screen]; return <ScreenErrorBoundary key={screen === 'projects' ? `${workspaceId}:${screen}` : `${projectId}:${screen}`} screenId={screen} go={go}><Profiler id={screen} onRender={(_, __, duration) => diagnosticMonitor.recordRender(screen, duration)}><Current openTask={openTask} onNewTask={newTask} go={go} query={query} openStatus={openStatus} statusRequest={statusRequest} openProject={openProject} projectRequest={projectRequest} onProjectRequestHandled={clearProjectRequest} backupRequest={backupRequest} /></Profiler></ScreenErrorBoundary>; })() : null}
  </HeaderActionsContext.Provider>;
  const sheet = <>{taskId ? <TaskSheet key={`${projectId}:${taskId}`} taskId={taskId} onClose={() => setTaskId(null)} /> : null}{creatingTask ? <NewTaskSheet onClose={()=>setCreatingTask(false)} onSave={saveNewTask} /> : null}</>;
  const barStyle = mode !== 'light' ? 'light' : 'dark';
  const controls = headerActions?.screen === screen ? headerActions.controls : null;

  return (
    <View style={{ flex: 1, position: 'relative', backgroundColor: c.bg }}>
      <StatusBar style={barStyle} translucent={false} />
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, flexDirection: 'row', backgroundColor: c.bg }}>
        {wide ? <Sidebar nav={NAV} current={screen} go={go} onPickProject={pickProject}
          onAutoLayout={preference === 'desktop' ? () => setPreference('auto') : undefined} /> : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          {wide ? <TopBar query={query} onQuery={onQuery} onNew={newTask} controls={controls}
            onPickProject={pickProject} /> :
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              paddingHorizontal: 12, paddingVertical: 10, minHeight: 64, gap: 8 }}>
              {menu ? <View style={{ width: 40, height: 40 }} /> : <MenuToggle open={false} onPress={() => setMenu(true)} />}
              <HeaderControls controls={controls} />
              <Button label="New task" icon="plus" small onPress={newTask} />
            </View>}
          <View style={{ flex: 1, minHeight: 0 }}>{page}</View>
          {!wide ? <TabBar tabs={TABS} current={screen} go={requestTab} intent={intentRef.current} /> : null}
          {!wide ? <SideMenu nav={NAV} visible={menu} current={screen} go={go} onClose={() => setMenu(false)} onPickProject={pickProject}
            onDesktopLayout={() => { setMenu(false); setPreference('desktop'); }} onToggleMode={toggleMode} /> : null}
        </View>
        {sheet}
      </SafeAreaView>
      <IslandNotice notice={backupNotice || notice} onDismiss={() => { if (backupNotice) setBackupNotice(null); else dismissNotice(); }}
        onAction={action => { if (action === 'backup') { setBackupRequest(n => n + 1); go('settings', 'backup notice'); } }} wide={wide}
        topOffset={wide ? Math.max(20, insets.top + 16) : noticeTopOffset(insets, Platform.OS, NativeStatusBar.currentHeight)} />
    </View>
  );
}

// The intro belongs to a cold app mount, not navigation or resuming from the background.
function ColdStartGate() {
  const { c, restored } = useTheme();
  const [complete, setComplete] = useState(false);
  const finish = useCallback(() => setComplete(true), []);
  if (complete) return <StoreProvider><Shell /></StoreProvider>;
  return <View style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
    <StatusBar hidden />
    {restored ? <BoardMorph size={200} active speed={1} onFinish={finish} /> : null}
  </View>;
}

export default function ModernApp({}) {
  return <SafeAreaProvider>
    <LayoutProvider><ThemeProvider><ColdStartGate /></ThemeProvider></LayoutProvider>
  </SafeAreaProvider>;
}
