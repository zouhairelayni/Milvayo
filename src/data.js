// Seed data for the Niyarvo Projects prototype. Every date is relative to TODAY.

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

export const TODAY = toISO(new Date());
export const D = (n) => addDays(TODAY, n);

export const STATUS = ['Backlog', 'In progress', 'Validation', 'Done'];
export const STAGES = ['Development', 'Testing', 'Production'];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
export const CHECK_STATES = ['pending', 'passed', 'failed', 'blocked'];

const rawTasks = [
  { id: 't1', title: 'Onboarding flow redesign', type: 'Feature', status: 'Done', priority: 'High', stage: 'Production', owner: 'Mira Chen', board: 'Main', start: D(-6), due: D(-1), effort: 16, logged: 17, progress: 100, labels: ['UX'], sprint: 'S3', dependsOn: [], milestone: false, comments: [{ id: 'c1', by: 'Mira Chen', text: 'Shipped to 10% cohort. Completion time down to 74s.', at: 'Oct 30' }] },
  { id: 't2', title: 'Offline sync queue', type: 'Feature', status: 'In progress', priority: 'Critical', stage: 'Development', owner: 'Idris Okafor', board: 'Main', start: D(-3), due: D(3), effort: 32, logged: 19, progress: 60, labels: ['Core', 'Backend'], sprint: 'S3', dependsOn: ['t5'], milestone: false, comments: [] },
  { id: 't3', title: 'Push opt-in copy', type: 'Chore', status: 'Validation', priority: 'Medium', stage: 'Testing', owner: 'Lena Duarte', board: 'Mobile', start: D(-4), due: D(0), effort: 4, logged: 3, progress: 90, labels: ['Copy'], sprint: 'S3', dependsOn: [], milestone: false, comments: [] },
  { id: 't4', title: 'Payment webhook retries', type: 'Feature', status: 'Backlog', priority: 'High', stage: 'Development', owner: 'Sam Ortiz', board: 'Main', start: D(4), due: D(9), effort: 12, logged: 0, progress: 0, labels: ['Backend'], sprint: null, dependsOn: ['t2'], milestone: false, comments: [] },
  { id: 't5', title: 'Local database migration v7', type: 'Chore', status: 'Done', priority: 'High', stage: 'Production', owner: 'Idris Okafor', board: 'Main', start: D(-10), due: D(-4), effort: 20, logged: 22, progress: 100, labels: ['Core'], sprint: 'S2', dependsOn: [], milestone: false, comments: [] },
  { id: 't6', title: 'Dark mode token audit', type: 'Chore', status: 'In progress', priority: 'Low', stage: 'Development', owner: 'Mira Chen', board: 'Web', start: D(-9), due: D(-2), effort: 10, logged: 4, progress: 40, labels: ['Design'], sprint: 'S3', dependsOn: [], milestone: false, comments: [] },
  { id: 't7', title: 'Tablet split layout', type: 'Feature', status: 'Backlog', priority: 'Medium', stage: 'Development', owner: 'Yusuf Nour', board: 'Web', start: D(6), due: D(12), effort: 18, logged: 0, progress: 0, labels: ['UX'], sprint: null, dependsOn: [], milestone: false, comments: [] },
  { id: 't8', title: 'Crash reporting integration', type: 'Feature', status: 'Validation', priority: 'Critical', stage: 'Testing', owner: 'Priya Raman', board: 'Main', start: D(-5), due: D(1), effort: 14, logged: 13, progress: 85, labels: ['Ops'], sprint: 'S3', dependsOn: [], milestone: false, comments: [{ id: 'c2', by: 'Priya Raman', text: 'Test event reaches the dashboard, but Android symbol upload still fails.', at: 'Oct 31' }] },
  { id: 't9', title: 'Accessibility pass: contrast and labels', type: 'Chore', status: 'In progress', priority: 'High', stage: 'Development', owner: 'Lena Duarte', board: 'Web', start: D(0), due: D(7), effort: 12, logged: 4, progress: 30, labels: ['A11y'], sprint: 'S3', dependsOn: [], milestone: false, comments: [] },
  { id: 't10', title: 'Release notes for 2.4', type: 'Chore', status: 'Backlog', priority: 'Low', stage: 'Production', owner: 'Sam Ortiz', board: 'Main', start: D(8), due: D(14), effort: 3, logged: 0, progress: 0, labels: ['Docs'], sprint: null, dependsOn: [], milestone: false, comments: [] },
  { id: 't11', title: 'Store submission freeze', type: 'Milestone', status: 'Backlog', priority: 'High', stage: 'Production', owner: 'Priya Raman', board: 'Main', start: D(14), due: D(14), effort: 0, logged: 0, progress: 0, labels: [], sprint: null, dependsOn: ['t2', 't8'], milestone: true, comments: [] },
  { id: 't12', title: 'Analytics event schema v3', type: 'Chore', status: 'Done', priority: 'Medium', stage: 'Production', owner: 'Yusuf Nour', board: 'Web', start: D(-14), due: D(-8), effort: 8, logged: 9, progress: 100, labels: ['Data'], sprint: 'S1', dependsOn: [], milestone: false, comments: [] },
  { id: 't13', title: 'Search index rebuild', type: 'Feature', status: 'Backlog', priority: 'Medium', stage: 'Development', owner: 'Idris Okafor', board: 'Main', start: D(10), due: D(16), effort: 22, logged: 0, progress: 0, labels: ['Core'], sprint: null, dependsOn: [], milestone: false, comments: [] },
  { id: 't14', title: 'Empty states for projects', type: 'Feature', status: 'Validation', priority: 'Low', stage: 'Testing', owner: 'Mira Chen', board: 'Mobile', start: D(-2), due: D(2), effort: 5, logged: 4, progress: 80, labels: ['UX'], sprint: 'S3', dependsOn: [], milestone: false, comments: [] },
  { id: 't15', title: 'Biometric unlock', type: 'Feature', status: 'In progress', priority: 'High', stage: 'Development', owner: 'Yusuf Nour', board: 'Mobile', start: D(1), due: D(8), effort: 20, logged: 5, progress: 25, labels: ['Security'], sprint: 'S3', dependsOn: [], milestone: false, comments: [] },
  { id: 't16', title: 'Invoice export as CSV', type: 'Feature', status: 'Backlog', priority: 'Low', stage: 'Development', owner: 'Sam Ortiz', board: 'Web', start: D(12), due: D(18), effort: 6, logged: 0, progress: 0, labels: ['Reports'], sprint: null, dependsOn: [], milestone: false, comments: [] },
];

// Boards own ordered lists. Each list maps to one status, which drives progress and reports.
export const MAIN = 'board-default';
const LIST_KEY = { Backlog: 'backlog', 'In progress': 'progress', Validation: 'validation', Done: 'done' };
export const defaultLists = (boardId) =>
  STATUS.map((st) => ({ id: `${boardId}-${LIST_KEY[st]}`, name: st, status: st }));

const tasks = rawTasks.map((t) => {
  const board = t.board.toLowerCase();
  return { ...t, board, list: `${board}-${LIST_KEY[t.status]}` };
});

const BOARD_NAMES = { main: 'Main', mobile: 'Mobile', web: 'Web' };
const BOARDS = Object.keys(BOARD_NAMES).map((id) => ({
  id, name: BOARD_NAMES[id], archived: false, lists: defaultLists(id),
}));

export const seed = {
  project: { name: 'Atlas Mobile v2', release: '2.4.0', due: D(14), budget: 48000 },
  boards: BOARDS,
  tasks,
  sprints: [
    { id: 'S1', name: 'Sprint 1', goal: 'Analytics foundations', state: 'completed', start: D(-21), end: D(-14), velocity: 21 },
    { id: 'S2', name: 'Sprint 2', goal: 'Sync core', state: 'completed', start: D(-14), end: D(-7), velocity: 26 },
    {
      id: 'S3', name: 'Sprint 3', goal: 'Offline mode and onboarding polish', state: 'active', start: D(-4), end: D(3), velocity: null,
      burn: { days: ['Oct 27', 'Oct 28', 'Oct 29', 'Oct 30', 'Oct 31'], ideal: [8, 6, 5, 3, 1], recorded: [8, 7, 7, 6, 7] },
    },
    { id: 'S4', name: 'Sprint 4', goal: 'Store launch hardening', state: 'planned', start: D(4), end: D(11), velocity: null },
  ],
  releases: [
    { id: 'R1', name: '2.3.0', stage: 'Released', version: 'v2.3.0', repo: 'niyarvo/atlas-mobile', tasks: ['t5', 't12'] },
    { id: 'R2', name: '2.4.0', stage: 'Testing', version: 'v2.4.0-rc.1', repo: 'niyarvo/atlas-mobile', tasks: ['t1', 't2', 't3', 't8', 't11', 't14', 't15'] },
  ],
  checks: [
    { id: 'k1', title: 'Offline queue drains after airplane mode', taskId: 't2', status: 'pending', evidence: true },
    { id: 'k2', title: 'Onboarding finishes under 90s on Pixel 6a', taskId: 't1', status: 'passed', evidence: true },
    { id: 'k3', title: 'Opt-in copy matches legal review', taskId: 't3', status: 'passed', evidence: false },
    { id: 'k4', title: 'Crash reporter receives a test event', taskId: 't8', status: 'failed', evidence: true },
    { id: 'k5', title: 'Biometric falls back to PIN', taskId: 't15', status: 'blocked', evidence: true },
    { id: 'k6', title: 'VoiceOver labels on board cards', taskId: 't9', status: 'pending', evidence: false },
  ],
  contributors: [
    { id: 'u1', name: 'Mira Chen', role: 'Product designer', weekly: 32, rate: 85 },
    { id: 'u2', name: 'Idris Okafor', role: 'Backend engineer', weekly: 40, rate: 110 },
    { id: 'u3', name: 'Lena Duarte', role: 'QA and content', weekly: 30, rate: 70 },
    { id: 'u4', name: 'Sam Ortiz', role: 'Full-stack engineer', weekly: 36, rate: 95 },
    { id: 'u5', name: 'Priya Raman', role: 'Site reliability', weekly: 24, rate: 120 },
    { id: 'u6', name: 'Yusuf Nour', role: 'Mobile engineer', weekly: 40, rate: 105 },
  ],
  automations: [
    { id: 'a1', name: 'Close task when checks pass', trigger: 'Acceptance check passes', action: 'Set status to Done', on: true },
    { id: 'a2', name: 'Flag overdue work', trigger: 'Due date passes', action: 'Add label "Overdue"', on: true },
    { id: 'a3', name: 'Escalate critical bugs', trigger: 'Priority set to Critical', action: 'Add to current sprint', on: false },
  ],
  portfolios: [
    { id: 'p1', name: 'Mobile 2026', projects: ['Atlas Mobile v2', 'Atlas Web'], health: 'On track', progress: 0.62 },
    { id: 'p2', name: 'Platform reliability', projects: ['Ops Core', 'Crash pipeline'], health: 'At risk', progress: 0.41 },
  ],
  snapshots: [
    { id: 'sn1', label: 'Before Sprint 3 start', at: 'Oct 27 · 09:12' },
    { id: 'sn2', label: 'Auto · release 2.3.0', at: 'Oct 19 · 17:40' },
  ],
  taskTypes: ['Feature', 'Chore', 'Bug', 'Milestone'],
  customFields: [
    { name: 'Customer impact', kind: 'Select', values: 'Low, Medium, High' },
    { name: 'Needs legal review', kind: 'Boolean' },
    { name: 'Story points', kind: 'Number' },
  ],
  activity: [
    { id: 'g1', text: 'Priya Raman commented on "Crash reporting integration"', at: '16:40' },
    { id: 'g2', text: 'Lena Duarte moved "Push opt-in copy" to Validation', at: '15:02' },
    { id: 'g3', text: 'Idris Okafor moved "Offline sync queue" to In progress', at: '11:18' },
    { id: 'g4', text: 'Automation "Close task when checks pass" ran on 1 task', at: '09:30' },
    { id: 'g5', text: 'Mira Chen completed "Onboarding flow redesign"', at: 'Yesterday' },
  ],
};

// ---- selectors -------------------------------------------------------------

export const isOverdue = (t) => t.status !== 'Done' && /^\d{4}-\d{2}-\d{2}$/.test(t.due || '') && t.due < TODAY;

export function progressOf(list) {
  const real = list.filter((t) => !t.milestone);
  if (!real.length) return 0;
  return real.reduce((sum, t) => sum + (t.status === 'Done' ? 100 : t.progress), 0) / real.length / 100;
}

export const rateFor = (s, name) => (s.contributors.find((c) => c.name === name) || {}).rate || 0;

export const openHours = (s, name) =>
  s.tasks
    .filter((t) => t.owner === name && t.status !== 'Done')
    .reduce((sum, t) => sum + t.effort * (1 - t.progress / 100), 0);

export function labourCosts(s) {
  return {
    planned: s.tasks.reduce((sum, t) => sum + t.effort * rateFor(s, t.owner), 0),
    actual: s.actualLabour || 0,
  };
}

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
