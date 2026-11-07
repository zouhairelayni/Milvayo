// /tests/helpers/diagram-harness.cjs
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');

function load(file, mocks, expose = [], globals = {}, moduleOptions = {}) {
  const filename = path.resolve(__dirname, '../..', file);
  const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), { filename, babelrc: false, configFile: false, plugins: [[require.resolve('@babel/plugin-transform-react-jsx'), { runtime: 'automatic' }], require.resolve('@babel/plugin-transform-modules-commonjs')] }).code;
  const module = { exports: {}, ...moduleOptions };
  const exposed = expose.length ? '\nexports.__test = {' + expose.join(',') + '};' : '';
  vm.runInNewContext('(function(require,module,exports){' + code + exposed + '\n})', globals)(id => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id === 'react/jsx-runtime') return require(id);
    if (id.endsWith('.cjs')) return require(path.resolve(path.dirname(filename), id));
    throw Error('Unmocked diagram import: ' + id);
  }, module, module.exports);
  return module.exports;
}

function gestureHarness(file, host, drawing, exportName = 'default') {
  let cursor = 0, pending = [];
  const slots = [], effects = [], gestures = {}, frames = new Map(), appListeners = new Set();
  let frameId = 0;
  const hooks = {
    useRef(value) { const i = cursor++; return slots[i] || (slots[i] = { current: value }); },
    useState(initial) { const i=cursor++; if(!slots[i]) slots[i]={value:typeof initial==='function'?initial():initial};return [slots[i].value,value=>{slots[i].value=typeof value==='function'?value(slots[i].value):value;}]; },
    useMemo(fn,deps) { const i=cursor++;if(!slots[i]||!deps||deps.some((v,n)=>!Object.is(v,slots[i].deps[n])))slots[i]={value:fn(),deps};return slots[i].value; },
    useCallback: (fn,deps) => hooks.useMemo(()=>fn,deps),
    useEffect(fn, deps) {
      const i = cursor++;
      if (!effects[i] || deps.some((v, n) => !Object.is(v, effects[i].deps[n]))) {
        pending.push(() => { effects[i]?.cleanup?.(); effects[i] = { deps, cleanup: fn() }; });
      }
    },
  };
  const component = load(file, {
    react: hooks,
    'react-native': { View: 'View', AppState: {addEventListener(_name,fn){appListeners.add(fn);return {remove(){appListeners.delete(fn);}};}} },
    'react-native-gesture-handler': {
      GestureDetector: 'Detector',
      VirtualGestureDetector: 'VirtualDetector',
      usePinchGesture(config) { gestures.pinch = config; return config; },
      usePanGesture(config) { gestures.pan = config; return config; },
      useSimultaneousGestures: (...args) => args,
    },
    'react-native-reanimated': {
      __esModule: true, default: { View: 'AnimatedView' },
      useSharedValue: value => {
        const ref = hooks.useRef(null);
        if (!ref.current) ref.current = { value, get() { return this.value; }, set(next) { this.value = typeof next === 'function' ? next(this.value) : next; } };
        return ref.current;
      },
      useDerivedValue: fn => ({ get value() { return fn(); } }),
      useAnimatedStyle: fn => fn,
      useFrameCallback: () => {},
    },
    '../diagnostics/monitor':{diagnosticMonitor:{recordAction(){}}},
    'react-native-worklets': { scheduleOnRN: (fn, ...args) => fn(...args) },
  }, [], {requestAnimationFrame:fn=>{frames.set(++frameId,fn);return frameId;},cancelAnimationFrame:id=>frames.delete(id)})[exportName];
  const bindRefs = tree => {
    if (!tree?.props) return;
    if (tree.props.ref) tree.props.ref.current = host;
    const children = [tree.props.children].flat();
    for (const child of children) {
      if (child?.props?.ref) child.props.ref.current = drawing;
    }
  };
  return {
    gestures,
    frame() { const batch=[...frames.values()];frames.clear();batch.forEach(fn=>fn()); },
    flushFrames() { for(let i=0;i<4&&frames.size;i++)this.frame(); },
    appState(state) { appListeners.forEach(fn=>fn(state)); },
    render(props) {
      cursor = 0; pending = [];
      const tree = component(props); if (host) bindRefs(tree);
      pending.forEach(fn => fn()); return tree;
    },
    cleanup() { effects.forEach(e => e.cleanup?.()); },
  };
}
module.exports = { load, gestureHarness };
