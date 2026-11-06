// /src/app/ModernApp.js
import { Profiler, memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, StatusBar as NativeStatusBar, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../ui/theme/theme';
import { StoreProvider, StoreFreeze, useStore } from '../store/store';
import { LayoutProvider, T, useLayoutPreference, useWide } from '../ui/ui';
import { Sidebar } from '../components/shell/Menus';
import { TopBar, TabBar, PhoneHeader, ViewPill } from '../components/shell/Bars';
import CreateMore from '../components/shell/CreateMore';
import BoardMorph from '../components/brand/BoardMorph';
import { HeaderActionsContext } from '../components/shell/HeaderActions';
import ScreenErrorBoundary from '../components/shell/ScreenErrorBoundary';
import Overview from '../screens/overview/Overview';
import Board from '../screens/board/Board';
import Timeline from '../screens/timeline/Timeline';
import Tasks from '../screens/tasks/Tasks';
import More from '../screens/more/More';
import CreateProjectSheet from '../screens/governance/CreateProjectSheet';
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
import { SECTIONS, sectionOf, labelOf, viewsOf, navFor } from './navigation/sections.cjs';
import { useProjectTools } from '../store/useProjectTools';
import { screenOn } from '../domain/projectTools.cjs';

// Text can't be selected anywhere except in input fields (web, including phone browsers).
if (Platform.OS === 'web' && typeof document !== 'undefined' && !document.getElementById('no-select-style')) {
  const style = document.createElement('style');
  style.id = 'no-select-style';
  style.textContent =
    '*{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}' +
    'input,textarea{-webkit-user-select:text;user-select:text}' +
    '[role=button],[role=tab],[role=radio]{touch-action:manipulation}' +
    '[role=button]:focus-visible,[role=tab]:focus-visible,[role=radio]:focus-visible,input:focus-visible,textarea:focus-visible{outline:2px solid currentColor;outline-offset:2px}' +
    '@media(prefers-reduced-motion:reduce){*,*:before,*:after{scroll-behavior:auto!important;transition-duration:0.01ms!important}}';
  document.head.appendChild(style);
}

// The 19 menu entries (NAV) and the phone sections live in navigation/sections.cjs.
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
  more: More,
};

// Phone bottom bar: Home, Work, Projects, More (plus the centre Create button). Each section's views sit in the pill under the header.
const TABS = SECTIONS.map(({ id, label, icon }) => [id, label, icon]);
// Retained pages are the primary views: Home's Overview and Work's four views.
const CACHED_TABS = ['overview', 'board', 'timeline', 'tasks', 'sprints'];


// Only the active page subscribes to the workspace. Hidden screens otherwise
// recalculate charts and reconcile rows on every keystroke.
// Tripwire, not a workaround: Shell must mount exactly once per JS run. A second mount means something above it
// remounted the app (v0.5.12 root cause, see TimelineGestureHost). Fast Refresh also trips it in development.
let shellMounts = 0;
const DEFERRED_NATIVE_TABS = ['timeline', 'board', 'tasks', 'sprints'];
// Native retains visited primary tabs (a tab switch is a visibility toggle, not a rebuild). Hidden pages sit behind
// StoreFreeze, so they no longer re-render on every edit. Web keeps unmounting heavy hidden screens.
const retainHiddenTab = () => retainsHiddenTabs(Platform.OS);
const CachedPage = memo(function CachedPage({ pageId, active, openTask, onNewTask, onOpenBackup, go, query, openStatus, statusRequest }) {
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
        <ScreenComponent openTask={openTask} onNewTask={onNewTask} onOpenBackup={onOpenBackup} go={go} query={query} openStatus={openStatus} statusRequest={statusRequest} />
      </Profiler>
    : <View accessible accessibilityLabel={`Opening ${pageId}`} style={{ flex:1,justifyContent:'center',alignItems:'center' }}><T size={13} muted>{`Preparing ${pageId}…`}</T></View>,
  [ready, pageId, ScreenComponent, openTask, onNewTask, onOpenBackup, go, query, openStatus, statusRequest]);
  return <View style={{ flex: 1, display: active ? 'flex' : 'none' }}>
    <StoreFreeze frozen={!active}>
      <ScreenErrorBoundary screenId={pageId} go={go}>{content}</ScreenErrorBoundary>
    </StoreFreeze>
  </View>;
}, (prev, next) => !shouldRenderPage(prev, next)); // memo's comparator answers "equal, skip?"

function Shell({}) {
  const { c, mode } = useTheme();
  const { addTask, switchProject, workspace, workspaceId, notice, dismissNotice } = useStore();
  const wide = useWide();
  const tools = useProjectTools();
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
  const [creatingProject, setCreatingProject] = useState(false);
  const [releaseRequest, setReleaseRequest] = useState(false);
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
  const lastView = useRef({}); // section id -> last view opened there, so the bar button returns to it
  const go = useCallback((k, source = 'screen or menu') => {
    tabQueue.current?.clear();
    if (!SCREENS[k] || navigationRef.current.screen === k) return;
    const fromScreen = navigationRef.current.screen;
    diagnosticMonitor.recordAction(`navigation request: ${navigationRef.current.screen} -> ${k}; source=${source}`);
    intentRef.current.advance();
    navigationRef.current = { screen:k, at:Date.now() };
    diagnosticMonitor.recordScreen(k);
    setVisitedState(v => addVisited(v, projectIdRef.current, fromScreen, k, CACHED_TABS));
    const section = SECTIONS.find(x => x.id === sectionOf(k));
    if (section.views.length) lastView.current[section.id] = k;
    setScreen(k);
  }, []);
  if (!tabQueue.current) tabQueue.current = require('./navigation/navigationQueue.cjs').createNavigationQueue(
    requestAnimationFrame, cancelAnimationFrame, k => go(k, 'bottom tab'));
  const requestTab = useCallback(k => tabQueue.current.request(k), []);
  const requestSection = useCallback(id => tabQueue.current.request(lastView.current[id] || SECTIONS.find(x => x.id === id).first), []);
  useEffect(() => () => tabQueue.current.clear(), []);
  const openTask = useCallback((id) => setTaskId(id), []);
  // Overview tiles: open Tasks already filtered to one status.
  const [statusRequest, setStatusRequest] = useState(null);
  const openStatus = useCallback((status) => { setStatusRequest({ status }); go('tasks'); }, [go]);
  // Picking a project opens it; a brand-new one starts on the Board so there is something to add to.
  const pickProject = useCallback((id, isNew) => {
    switchProject(id);
    setTaskId(null);
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
  const clearReleaseRequest = useCallback(() => setReleaseRequest(false), []);
  // A different workspace: close the open task and drop filters and requests that pointed into the old one.
  useEffect(() => { setTaskId(null); setCreatingTask(false); setQuery(''); setStatusRequest(null); setProjectRequest(null); setCreatingProject(false); setReleaseRequest(false); }, [workspaceId]);
  // A tool switched off while its screen is open (or in the project just opened): leave the screen, keep the data.
  useEffect(() => { if (!screenOn(tools, screen)) go(sectionOf(screen) === 'work' ? 'board' : 'more', 'tool switched off'); }, [tools, screen, go]);
  const newTask = useCallback(() => setCreatingTask(true), []);
  const openBackup = useCallback(() => { setBackupRequest(n => n + 1); go('settings', 'Home import starter'); }, [go]);
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
      <CachedPage key={`${projectId}:${id}`} pageId={id} active={screen === id} openTask={openTask} onNewTask={newTask} onOpenBackup={openBackup} go={go} query={query} openStatus={openStatus} statusRequest={statusRequest} />
    )}
    {!CACHED_TABS.includes(screen) ? (() => { const Current = SCREENS[screen]; return <ScreenErrorBoundary key={screen === 'projects' ? `${workspaceId}:${screen}` : `${projectId}:${screen}`} screenId={screen} go={go}><Profiler id={screen} onRender={(_, __, duration) => diagnosticMonitor.recordRender(screen, duration)}><Current openTask={openTask} onNewTask={newTask} go={go} query={query} openStatus={openStatus} statusRequest={statusRequest} openProject={openProject} projectRequest={projectRequest} onProjectRequestHandled={clearProjectRequest} backupRequest={backupRequest} releaseRequest={releaseRequest} onReleaseRequestHandled={clearReleaseRequest} /></Profiler></ScreenErrorBoundary>; })() : null}
  </HeaderActionsContext.Provider>;
  const sheet = <>{taskId ? <TaskSheet key={`${projectId}:${taskId}`} taskId={taskId} onClose={() => setTaskId(null)} /> : null}{creatingTask ? <NewTaskSheet onClose={()=>setCreatingTask(false)} onSave={saveNewTask}
    extra={<CreateMore onProject={() => { setCreatingTask(false); setCreatingProject(true); }} onRelease={tools.releases ? () => { setCreatingTask(false); setReleaseRequest(true); go('releases', 'create sheet'); } : undefined} />} /> : null}
    <CreateProjectSheet visible={creatingProject} onClose={() => setCreatingProject(false)} onCreated={id => pickProject(id, true)} /></>;
  const barStyle = mode !== 'light' ? 'light' : 'dark';
  const controls = headerActions?.screen === screen ? headerActions.controls : null;
  const section = SECTIONS.find(x => x.id === sectionOf(screen));
  const views = viewsOf(section, tools);

  return (
    <View style={{ flex: 1, position: 'relative', backgroundColor: c.bg }}>
      <StatusBar style={barStyle} translucent={false} />
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, flexDirection: 'row', backgroundColor: c.bg }}>
        {wide ? <Sidebar nav={navFor(tools)} current={screen} go={go} onPickProject={pickProject}
          onAutoLayout={preference === 'desktop' ? () => setPreference('auto') : undefined} /> : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          {wide ? <TopBar query={query} onQuery={onQuery} onNew={newTask} controls={controls}
            onPickProject={pickProject} showProjectName={screen !== 'overview' && section.id !== 'work' && section.id !== 'projects'} /> :
            <PhoneHeader kind={section.id !== 'more' ? 'main' : screen === 'more' ? 'hub' : 'sub'} title={labelOf(screen)}
              query={query} onQuery={onQuery} controls={controls} onPickProject={pickProject} onBack={() => go('more', 'back to More')} showProjectName={screen !== 'overview' && section.id !== 'work' && section.id !== 'projects'} />}
          {!wide && views.length > 1 ? <ViewPill views={views} current={screen} go={requestTab} /> : null}
          <View style={{ flex: 1, minHeight: 0 }}>{page}</View>
          {!wide ? <TabBar tabs={TABS} current={section.id} go={requestSection} intent={intentRef.current} onCreate={newTask} /> : null}
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
  // Theme and workspace restore concurrently. Branding never gates hydration or interaction.
  return <StoreProvider>{restored ? <Shell /> : <View style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
    <BoardMorph size={64} />
    <T muted>Restoring appearance…</T>
  </View>}</StoreProvider>;
}

export default function ModernApp({}) {
  useLayoutEffect(() => { void diagnosticMonitor.start(); }, []);
  return <SafeAreaProvider>
    <LayoutProvider><ThemeProvider><ColdStartGate /></ThemeProvider></LayoutProvider>
  </SafeAreaProvider>;
}
