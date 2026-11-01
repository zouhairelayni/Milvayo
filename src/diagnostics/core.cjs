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
const bounded = (a, max) => a.length > max ? a.slice(-max) : a;
const fresh = (runId, now, meta = {}) => ({
  schema: 1, runId, startedAt: now, updatedAt: now, active: true, screen: 'overview',
  platform: meta.platform || 'unknown', os: meta.os || 'unknown', version: meta.version || 'unknown',
  events: [], crashes: [], slow: [], warnings: 0, errors: 0, screenOpens: {}, render: {}, freezeMs: 0,
  previous: null,
});
const addEvent = (state, type, detail, at = Date.now()) => {
  state.events = bounded([...state.events, {at, type: clean(type, 30), detail: clean(detail, 170)}], MAX_EVENTS);
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
const reportCrash = (s) => [
  '=== NIYARVO PROJECTS CRASH REPORT ===',
  `app version: ${s.version} | platform: ${s.platform} | OS: ${s.os} | run: ${s.runId}`,
  `run started: ${fmtTime(s.startedAt)} | last recorded activity: ${fmtTime(s.updatedAt)}`,
  `screen: ${s.screen} | recorded JS exceptions: ${s.crashes.length}`,
  `last safe step: ${s.events.filter(e=>e.type==='screen opened' || e.type==='navigation').at(-1)?.detail || 'not recorded'}`,
  s.previous ? `previous session: ${s.previous.active ? 'No clean exit recorded (NOT proof of crash)' : 'backgrounded/ended'} at ${fmtTime(s.previous.updatedAt)}` : 'previous session: unavailable',
  '', ...s.crashes.slice().reverse().flatMap(c => [
    `--- ${fmtTime(c.at)} | ${c.source} | ${c.screen} | count ${c.count} ---`,
    `reason: ${c.name}: ${c.message}`, `fatal handler: ${c.fatal ? 'reported fatal JS exception' : 'no'}`,
    `stack: ${c.stack || 'not captured'}`, `component: ${c.componentStack || 'not captured'}`, '',
  ]), '--- recent steps ---', ...s.events.slice(-32).map(e => `${fmtTime(e.at)} | ${e.type} | ${e.detail}`),
  '', 'LIMITS: JS error boundaries do not capture native process terminations, OOM or ANR. A missing clean exit is not proof of a crash.',
].join('\n');
const reportPerf = (s, now = Date.now()) => [
  '=== NIYARVO PROJECTS PERFORMANCE REPORT ===',
  `app version: ${s.version} | platform: ${s.platform} | OS: ${s.os} | run: ${s.runId}`,
  `run started: ${fmtTime(s.startedAt)} | uptime: ${Math.max(0, Math.round((now - s.startedAt)/1000))}s`,
  `current screen: ${s.screen} | longest observed JS timer delay: ${s.freezeMs}ms`,
  `Console errors and JS exceptions: ${s.errors} | console warnings: ${s.warnings}`,
  'navigation counts: ' + Object.entries(s.screenOpens).map(([k,v])=>`${k} ${v}`).join(' · '),
  'React renders (JS profiler, not native FPS):',
  ...Object.entries(s.render).map(([k, v]) => `${k}: ${v.count} renders, avg ${Math.round(v.sum / Math.max(1,v.count))}ms, max ${Math.round(v.max)}ms`),
  '--- slow events / transitions ---',
  ...s.slow.slice(-40).map(x => `${fmtTime(x.at)} | ${x.type} ${x.name} | ${x.ms}ms`),
  '--- recent steps ---', ...s.events.slice(-25).map(e => `${fmtTime(e.at)} | ${e.type} | ${e.detail}`),
  '', 'LIMITS: JS timers and React render costs are estimates, not a native FPS, memory, ANR or device CPU profiler.',
].join('\n');
module.exports = {clean, fresh, addEvent, addCrash, addSlow, reportCrash, reportPerf};
