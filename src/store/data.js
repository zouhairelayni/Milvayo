// /src/store/data.js
// Seed data for the Milvayo prototype. Every date is relative to TODAY.

const pad = (n) => String(n).padStart(2, '0');
const parseISO = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const toISO = (dt) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
export const addDays = (iso, n) => {
  const dt = parseISO(iso);
  dt.setDate(dt.getDate() + n);
  return toISO(dt);
};
export const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000);

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const fmt = (iso) => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return 'Unscheduled';
  const [, m, d] = iso.split('-').map(Number);
  return `${MON[m - 1]} ${d}`;
};
export const money = (n) => '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// shortcut: read once at app start, so the Timeline "today" line is stale after midnight until restart; make it a hook if that matters.
export const TODAY = toISO(new Date());

export const STATUS = ['Backlog', 'In progress', 'Validation', 'Done'];
export const STAGES = ['Development', 'Testing', 'Production'];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
export const CHECK_STATES = ['pending', 'passed', 'failed', 'blocked'];

// The id of the default board.
export const MAIN = 'board-default';

// ---- selectors -------------------------------------------------------------

export const isOverdue = (t) => t.status !== 'Done' && /^\d{4}-\d{2}-\d{2}$/.test(t.due || '') && t.due < toISO(new Date()); // read at call time, so it stays right after midnight

export { progressOf } from '../utils/progress.cjs';

export const openHours = (s, name) =>
  s.tasks
    .filter((t) => t.owner === name && t.status !== 'Done')
    .reduce((sum, t) => sum + t.effort * (1 - t.progress / 100), 0);

// Release gates, mirroring the source app's "release readiness" checks.
export function gatesFor(release, s) {
  const linked = s.tasks.filter(t => release.tasks.includes(t.id));
  const checks = s.checks.filter(k => release.tasks.includes(k.taskId));
  return [
    {label:'Release main SHA recorded', ok:!!release.mainSha?.trim()},
    {label:'Linked tasks completed and verified', ok:linked.length>0 && linked.every(t=>t.status==='Done'&&t.verified)},
    {label:'All linked tasks have merge checkpoints', ok:linked.length>0 && linked.every(t=>t.merged&&t.mainSha?.trim())},
    {label:'Acceptance checks passed with evidence', ok:checks.length>0&&checks.every(k=>k.status==='passed'&&k.evidence)},
    {label:'No incomplete dependency prerequisites', ok:linked.every(t=>t.dependsOn.every(id=>s.tasks.find(x=>x.id===id)?.status==='Done'))},
  ];
}

export const toCSV = (list) =>
  [
    'id,title,status,priority,owner,start,due,progress',
    ...list.map((t) =>
      [t.id, `"${t.title.replace(/"/g, '""')}"`, t.status, t.priority, t.owner, t.start, t.due, t.progress].join(',')
    ),
  ].join('\n');
