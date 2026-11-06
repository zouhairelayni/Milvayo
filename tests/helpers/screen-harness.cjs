// /tests/helpers/screen-harness.cjs
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');
const { palette } = require('../../src/ui/theme/themePalette.cjs');

// Executes screen render functions and handlers with deterministic hooks, not a device renderer.
function screenHarness(file, store, extra = {}) {
  const stateByComponent = new Map();
  let slots = [];
  const effects = [], frames = new Map();
  let frameSerial = 0;
  const headers = {};
  let cursor = 0;
  const hooks = {
    memo: fn => fn,
    Children: require('react').Children, Fragment: require('react').Fragment, isValidElement: require('react').isValidElement,
    useCallback: fn => fn, useDeferredValue: value => value,
    useId() { return hooks.useRef('chart-id-' + cursor).current; },
    useState(initial) {
      const i = cursor++;
      const values = slots;
      if (!(i in values)) values[i] = typeof initial === 'function' ? initial() : initial;
      return [values[i], value => { values[i] = typeof value === 'function' ? value(values[i]) : value; }];
    },
    useRef(initial) { const [ref] = hooks.useState(() => ({ current: initial })); return ref; },
    useMemo: fn => fn(),
    useEffect(fn, deps) {
      const i = cursor++;
      if (!slots[i] || deps.some((d, n) => !Object.is(d, slots[i][n]))) { slots[i] = deps; effects.push(fn); }
    },
  };
  hooks.useLayoutEffect = hooks.useEffect;
  const c = palette('Coral', 'dark');
  const theme = { useTheme: () => ({ c }), radius: { sm: 9, md: 14, lg: 20 }, STATUS_COLOR: { Backlog: '#888888', Done: '#228844' }, PRIORITY_COLOR: { Critical: '#cc3311', High: '#aa8800', Medium: '#3366cc' } };
  const data = {
    CHECK_STATES: ['pending', 'passed', 'failed', 'blocked'], STATUS: ['Backlog', 'In progress', 'Validation', 'Done'], PRIORITIES: ['Low', 'Medium', 'High', 'Critical'], STAGES: ['Plan', 'Build'],
    fmt: day => day, addDays: (day, n) => new Date(Date.parse(day + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10),
    gatesFor: r => r.gates || [], isOverdue: t => t.status !== 'Done' && t.due && t.due < '2026-11-05', progressOf: () => 0.5,
  };
  const fullPath = path.resolve(__dirname, '../..', file);
  const code = babel.transformSync(fs.readFileSync(fullPath, 'utf8'), {
    filename: fullPath, babelrc: false, configFile: false,
    plugins: [[require.resolve('@babel/plugin-transform-react-jsx'), { runtime: 'automatic' }], require.resolve('@babel/plugin-transform-modules-commonjs')],
  }).code;
  const m = { exports: {} };
  const req = id => {
    if (extra.mocks && Object.hasOwn(extra.mocks, id)) return extra.mocks[id];
    if(id.endsWith('/BackSurface'))return {__esModule:true,default:'BackSurface'};
    if(id.endsWith('/useBackNavigation'))return {useBackDismiss(){}};
    if(id.endsWith('/useRenderMetric'))return {useRenderMetric(){}};
    if (id === 'react') return hooks;
    if (id === 'react/jsx-runtime') return require(id);
    if (id === 'react-native') return { Dimensions:{get:()=>({width:extra.width||390,height:844})}, FlatList: 'FlatList', Pressable: 'Pressable', View: 'View', ScrollView: 'ScrollView', KeyboardAvoidingView:'KeyboardAvoidingView', Image: 'Image', Modal: 'Modal', Switch: 'Switch', Platform: { OS: extra.platform || 'web' }, PanResponder: { create: handlers => ({ panHandlers: handlers }) }, useWindowDimensions: () => ({ width: extra.width || 390 }) };
    if (id === 'react-native-svg') return { __esModule: true, default: 'Svg', Circle: 'Circle', Defs: 'Defs', LinearGradient:'LinearGradient', Stop:'Stop', Line: 'Line', Path: 'Path', Rect: 'Rect', Text: 'SvgText' };
    if (id === 'react-native-safe-area-context') return { SafeAreaProvider: 'SafeAreaProvider', SafeAreaView: 'SafeAreaView' };
    if (id === '@expo/vector-icons') return { Feather: 'Feather' };
    if (id.endsWith('/ui/ui')) return new Proxy({ useWide: () => !!extra.wide }, { get: (o, k) => o[k] || k });
    if (id === './uiControls') return {Button:'Button',IconBtn:'IconBtn',Input:'Input'};
    if (id === './TracePath') return {__esModule:true,default:'TracePath'};
    if (id==='./FillMotion')return {__esModule:true,default:'FillMotion'};
    if (id==='./PressSurface'||id.endsWith('/PressSurface')||id.endsWith('/DateRail')||id.endsWith('/Reveal'))return {__esModule:true,default:id.split('/').at(-1)};
    if (id.endsWith('/StudioCharts'))return new Proxy({}, {get:(_,k)=>k});
    if (id === './uiLayout') return {Sheet:'Sheet'};
    if (id === './Reveal' || id.endsWith('/EmptyArtwork')) return {__esModule:true,default:'Reveal'};
    if (id === './uiBase') return { T: 'T', Card: 'Card', useWide: () => !!extra.wide };
    if (id === './commitBuffer.cjs') return require('../../src/ui/commitBuffer.cjs');
    if (id.endsWith('/theme/theme')) return theme;
    if (id.endsWith('/store/store')) return { useStore: () => store, useStoreActions:()=>store, useScreenActive: () => true };
    if (id.endsWith('/useProjectTools')) return { useProjectTools: () => extra.tools || { sprints: true, releases: true, testing: true } };
    if (id.endsWith('/HeaderActions')) return { useHeaderActions: (key, value) => { headers[key] = value; } };
    if (id.endsWith('/CompactTools')) return { Fold: 'Fold', EditRow: 'EditRow', Labeled: 'Labeled', DangerConfirm: 'DangerConfirm', Dropdown:'Dropdown' };
    if (id.endsWith('/charts')) return { BurnChart: 'BurnChart' };
    if (id === './DrawerMotion' || id.endsWith('/BoardMorph') || id.endsWith('/InlineNotice') || id.endsWith('/CreateProjectSheet')) return id.split('/').at(-1);
    if (id === './NavIcon')return {__esModule:true,default:'NavIcon'};
    if (id === './Menus') return { ProjectSwitcher: 'ProjectSwitcher' };
    if (id.endsWith('/diagnostics/monitor')) return { diagnosticMonitor: { recordAction() {} } };
    if (id.endsWith('/navigation/sections.cjs')) return require('../../src/app/navigation/sections.cjs');
    if (id.endsWith('/labelPalette.cjs')) return require('../../src/ui/labelPalette.cjs');
    if (id.endsWith('/taskWorkflows.cjs')) return require('../../src/domain/taskWorkflows.cjs');
    if (id.endsWith('/planning.cjs')) return require('../../src/domain/planning.cjs');
    if (id.endsWith('/zoomQueue.cjs')) return require('../../src/timeline/zoomQueue.cjs');
    if (id.endsWith('/gantt.cjs')) return require('../../src/timeline/gantt.cjs');
    if (id === './dueSoon.cjs') return require('../../src/screens/tasks/dueSoon.cjs');
    if (id === './TimelineZoomControls') return { __esModule: true, default: 'TimelineZoomControls' };
    if (id === './DueSoon') return 'DueSoon';
    if (id.endsWith('/management/Management')) return { TaskConfiguration: 'TaskConfiguration' };
    if (id.endsWith('/TaskFields')) return { Field: 'Field', InlineDrop: 'InlineDrop', DateField: 'DateField', CustomValueInput: 'CustomValueInput' };
    if (/\/(TaskMarkdown|MarkdownField|TaskLabels)$/.test(id)) return id.split('/').at(-1);
    if (id.endsWith('/projectTools.cjs')) return require('../../src/domain/projectTools.cjs');
    if (id.endsWith('/cardMountWindow.cjs'))return require('../../src/board/cardMountWindow.cjs');
    if (id.endsWith('/dashboard.cjs'))return require('../../src/domain/dashboard.cjs');
    if (id.endsWith('/calendar.cjs'))return require('../../src/domain/calendar.cjs');
    if (id.endsWith('/localDay.cjs')) return { localDay: () => '2026-11-05' };
    if (id.endsWith('/store/data')) return data;
    if (id === './today.cjs') return require('../../src/screens/overview/today.cjs');
    throw Error('Unmocked screen import: ' + id);
  };
  vm.runInNewContext('(function(require,module,exports){' + code + '\n})', {setTimeout,clearTimeout,...extra.globals,requestAnimationFrame: fn => { frames.set(++frameSerial, fn); return frameSerial; }, cancelAnimationFrame: id => frames.delete(id) })(req, m, m.exports);
  return {
    headers,
    flushFrames() { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn()); },
    render(name = 'default', props = {}) {
      const component = typeof name === 'function' ? name : m.exports[name];
      if (!stateByComponent.has(component)) stateByComponent.set(component, []);
      slots = stateByComponent.get(component); cursor = 0;
      const tree = component(props); effects.splice(0).forEach(fn => fn()); return tree;
    },
  };
}

function nodes(tree, all = false) {
  if (Array.isArray(tree)) return tree.flatMap(t => nodes(t, all));
  if (!tree || typeof tree !== 'object' || !tree.props) return [];
  if (!all && tree.type === 'Sheet' && !tree.props.visible) return [];
  return [tree, ...nodes(tree.props.children, all), ...nodes(tree.props.footer, all), ...nodes(tree.props.right, all), ...nodes(tree.props.action,all), ...nodes(tree.props.primary,all)];
}
const control = (tree, label) => nodes(tree).find(n => (n.props.onPress || n.props.onConfirm) && (n.props.label === label || n.props.accessibilityLabel === label));
const text = tree => nodes(tree).flatMap(n => [n.props.children].flat(Infinity).filter(x => typeof x === 'string' || typeof x === 'number')).join(' ');

module.exports = { screenHarness, nodes, control, text };
