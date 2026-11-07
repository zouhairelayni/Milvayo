// /src/diagnostics/core.cjs
'use strict';
const MAX_EVENTS = 90;
const MAX_CRASHES = 12;
const MAX_SLOW = 60;
const clean = (value, length = 450) => {
  let v = typeof value === 'string' ? value : (value instanceof Error ? `${value.name}: ${value.message}` : String(value ?? ''));
  return v
    .replace(/(Bearer\s+)[^\s,;]+/gi, '$1[REDACTED]')
    .replace(/\b(sk[-_][A-Za-z0-9_-]{8,}|AIza[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9_-]{8,})\b/g, '[REDACTED KEY]')
    .replace(/((?:api[_-]?key|authorization|access[_-]?token|refresh[_-]?token|password|secret|client_secret)\s*[=:]\s*)[^\s,;]+/gi, '$1[REDACTED]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[EMAIL]')
    .replace(/https?:\/\/[^\s)]+/g, '[URL]')
    .replace(/\/data\/data\/[^/\s]+/g, '/[APP]')
    .replace(/\/home\/[^/\s]+/g, '/home/[USER]')
    .replace(/([\"'])([^\"'\n]{18,})\1/g, '[QUOTED TEXT]')
    .replace(/\b[A-Za-z0-9_-]{40,}\b/g, '[REDACTED TOKEN]')
    .slice(0, length);
};
const warningKind = args => {
  const message = args.filter(x => typeof x === 'string').join(' ');
  if (/Cannot record touch (?:move|end) without a touch start/.test(message)) return 'touch-history-mismatch';
  if (/Reanimated.*Reading from|Reading from.*component render/.test(message)) return 'reanimated-render-read';
  if (/non-boolean attribute.*accessible|accessible.*non-boolean attribute/.test(message)) return 'svg-accessibility-prop';
  if (/pointerEvents.*deprecated/.test(message)) return 'web-pointer-events-deprecation';
  return 'unclassified';
};
const bounded = (a, max) => a.length > max ? a.slice(-max) : a;
const fresh = (runId, now, meta = {}) => ({
  schema: 1, runId, startedAt: now, updatedAt: now, active: true, screen: 'overview',
  platform: meta.platform || 'unknown', os: meta.os || 'unknown', version: meta.version || 'unknown',
  runtime: meta.runtime || 'not reported',
  startupEvents: [], startup: [], events: [], crashes: [], slow: [], warnings: 0, warningKinds: {}, errors: 0, screenOpens: {}, render: {}, commits: {}, work: {}, freezeMs: 0,
  previous: null,
});
const addEvent = (state, type, detail, at = Date.now()) => {
  const event = {at, type: clean(type, 30), detail: clean(detail, 170)};
  if (state.startupEvents && state.startupEvents.length < 40) state.startupEvents.push(event);
  state.events = bounded([...state.events, event], MAX_EVENTS);
  state.updatedAt = at;
  return state;
};
const addCrash = (state, {source, name, message, stack, screen, componentStack, fatal = false}, at = Date.now()) => {
  const item = {at, source: clean(source, 40), name: clean(name, 60), message: clean(message, 450),
    stack: clean(stack, 2800), componentStack: clean(componentStack, 1300),
    screen: clean(screen || state.screen, 48), fatal: !!fatal};
  const last = state.crashes[state.crashes.length - 1];
  if (last && last.source === item.source && last.message === item.message && last.screen === item.screen && at - last.at < 3000) {
    last.count = (last.count || 1) + 1; last.at = at;
  } else state.crashes = bounded([...state.crashes, {...item, count: 1}], MAX_CRASHES);
  addEvent(state, 'JS exception', `${item.name}: ${item.message}`, at);
  state.errors += 1;
  return state;
};
const addSlow = (state, type, name, ms, at = Date.now()) => {
  if (!Number.isFinite(ms) || ms < 0) return state;
  state.slow = bounded([...state.slow, {at, type: clean(type, 26), name: clean(name, 48), ms: Math.round(ms)}], MAX_SLOW);
  return state;
};
const fmtTime = t => t ? new Date(t).toISOString() : 'unknown';
function addStartup(state, name, elapsed, detail = '') {
  if (!Number.isFinite(elapsed) || elapsed < 0 || state.startup.length >= 32 || state.startup.some(mark => mark.name === name)) return false;
  state.startup.push({name: clean(name, 64), elapsed: Math.round(elapsed), detail: clean(detail, 140)});
  return true;
}
function addSample(state, group, screen, duration) {
  if (!Number.isFinite(duration) || duration < 0) return false;
  const name = clean(screen, 48);
  if (name === '__proto__') return false;
  const samples = state[group];
  if (!Object.hasOwn(samples, name) && Object.keys(samples).length >= 32) return false;
  const metric = Object.hasOwn(samples, name) ? samples[name] : {count: 0, sum: 0, max: 0};
  metric.count++; metric.sum += duration; metric.max = Math.max(metric.max, duration);
  samples[name] = metric;
  return true;
}
const addCommit = (state, screen, duration) => addSample(state, 'commits', screen, duration);
const addWork = (state, name, duration) => addSample(state, 'work', name, duration);
const exitLabels = { 1:'self exit', 2:'OS signal (cause not inferred)', 3:'low memory', 4:'Java crash', 5:'native crash', 6:'ANR', 7:'initialization failure', 8:'permission change', 9:'excessive resource use', 10:'user requested', 11:'user stopped', 12:'dependency exited', 13:'other', 14:'app freezer', 15:'package state change', 16:'package updated' };
const reportCrash = (s) => [
  '=== MILVAYO CRASH REPORT ===',
  `app version: ${s.version} | platform: ${s.platform} | OS: ${s.os} | run: ${s.runId}`,
  `run started: ${fmtTime(s.startedAt)} | last recorded activity: ${fmtTime(s.updatedAt)}`,
  `screen: ${s.screen} | recorded JS exceptions: ${s.crashes.length}`,
  `last safe step: ${s.events.filter(e=>e.type==='screen opened' || e.type==='navigation').at(-1)?.detail || 'not recorded'}`,
  s.previous ? `previous session: ${s.previous.active ? 'No clean exit recorded (NOT proof of crash)' : 'backgrounded/ended'} at ${fmtTime(s.previous.updatedAt)}` : 'previous session: unavailable',
  ...(s.nativeExit ? [`latest Android-recorded process exit: ${exitLabels[s.nativeExit.reason] || 'unknown'} (reason ${s.nativeExit.reason}) at ${fmtTime(s.nativeExit.timestamp)}; OS history, may predate the previous JS run`] : []),
  '', ...s.crashes.slice().reverse().flatMap(c => [
    `--- ${fmtTime(c.at)} | ${c.source} | ${c.screen} | count ${c.count} ---`,
    `reason: ${c.name}: ${c.message}`, `fatal handler: ${c.fatal ? 'reported fatal JS exception' : 'no'}`,
    `stack: ${c.stack || 'not captured'}`, `component: ${c.componentStack || 'not captured'}`, '',
  ]), '--- startup steps (current run) ---', ...(s.startupEvents || []).map(e => `${fmtTime(e.at)} | ${e.type} | ${e.detail}`), '--- recent steps ---', ...s.events.slice(-32).map(e => `${fmtTime(e.at)} | ${e.type} | ${e.detail}`),
  ...(s.previous?.crashes?.length ? ['--- previous-run JS exceptions (not current-run counts) ---',
    ...s.previous.crashes.map(c => `${fmtTime(c.at)} | ${clean(c.source,40)} | ${clean(c.screen,48)} | ${clean(c.name,60)}: ${clean(c.message,450)}\n${clean(c.stack,2800)}`)] : []),
  ...(s.previous?.events?.length ? ['--- previous-run last steps ---', ...s.previous.events.map(e => `${fmtTime(e.at)} | ${clean(e.type,30)} | ${clean(e.detail,170)}`)] : []),
  '', 'LIMITS: JS error boundaries do not capture native process terminations, OOM or ANR. A missing clean exit is not proof of a crash.',
].join('\n');
const reportPerf = (s, now = Date.now()) => [
  '=== MILVAYO PERFORMANCE REPORT ===',
  `app version: ${s.version} | platform: ${s.platform} | OS: ${s.os} | run: ${s.runId}`,
  `JS runtime: ${s.runtime || 'not reported'}`,
  `run started: ${fmtTime(s.startedAt)} | uptime: ${Math.max(0, Math.round((now - s.startedAt)/1000))}s`,
  `current screen: ${s.screen} | longest observed JS timer delay: ${s.freezeMs}ms`,
  `Console errors and JS exceptions: ${s.errors} | console warnings: ${s.warnings}`,
  'warnings by kind (message text withheld): ' + Object.entries(s.warningKinds || {}).map(([k,v])=>`${k} ${v}`).join(' · '),
  'navigation counts: ' + Object.entries(s.screenOpens).map(([k,v])=>`${k} ${v}`).join(' · '),
  'React renders (JS profiler, not native FPS):',
  ...(!Object.keys(s.render).length ? ['No React Profiler callbacks received. Standard release React disables this profiler; this is not zero renders.'] : []),
  ...Object.entries(s.render).map(([k, v]) => `${k}: ${v.count} renders, avg ${Math.round(v.sum / Math.max(1,v.count))}ms, max ${Math.round(v.max)}ms`),
  'Screen render-to-commit samples (JS wall time, NOT React CPU duration or native FPS):',
  ...Object.entries(s.commits || {}).map(([k, v]) => `${k}: ${v.count} commits, avg ${Math.round(v.sum / Math.max(1,v.count))}ms, max ${Math.round(v.max)}ms`),
  'Startup milestones (since JS diagnostics initialization; NOT OS cold-launch time):',
  ...(s.startup || []).map(mark => `${mark.elapsed}ms | ${mark.name}${mark.detail ? ' | ' + mark.detail : ''}`),
  'Synchronous work samples (JS wall time):',
  ...Object.entries(s.work || {}).map(([k, v]) => `${k}: ${v.count} samples, avg ${Math.round(v.sum / Math.max(1,v.count))}ms, max ${Math.round(v.max)}ms`),
  '--- slow events / transitions ---',
  ...s.slow.slice(-40).map(x => `${fmtTime(x.at)} | ${x.type} ${x.name} | ${x.ms}ms`),
  '--- startup steps (current run) ---', ...(s.startupEvents || []).map(e => `${fmtTime(e.at)} | ${e.type} | ${e.detail}`), '--- recent steps ---', ...s.events.slice(-25).map(e => `${fmtTime(e.at)} | ${e.type} | ${e.detail}`),
  '', 'LIMITS: JS timers and React render costs are estimates, not a native FPS, memory, ANR or device CPU profiler.',
].join('\n');
module.exports = {warningKind, clean, fresh, addEvent, addCrash, addSlow, addStartup, addCommit, addWork, reportCrash, reportPerf};
