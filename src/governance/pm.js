// Project management layer: PMI-style document templates, seed content and the pure helpers behind
// Projects, Programs and Portfolios. Everything here is plain data and functions (no React).

import { D, TODAY, labourCosts, money, progressOf } from './data';

let counter = 5000;
export const pid = (prefix) => `${prefix}${++counter}`;

// ---- vocabularies -------------------------------------------------------------------------------

// PMI process groups double as the project phase.
export const PHASES = ['Initiating', 'Planning', 'Executing', 'Monitoring and controlling', 'Closing'];
export const PROGRAM_PHASES = ['Definition', 'Delivery', 'Closure'];
export const HEALTH = ['On track', 'At risk', 'Off track'];
export const HEALTH_COLOR = { 'On track': '#2F9E6B', 'At risk': '#D89614', 'Off track': '#E0512D' };
export const DOC_STATUS = ['Not started', 'Draft', 'In review', 'Approved'];
export const DOC_COLOR = { 'Not started': '#8C8577', Draft: '#3B6FE0', 'In review': '#D89614', Approved: '#2F9E6B' };
export const BENEFIT_STATUS = ['Planned', 'Realising', 'Realised'];
const LMH = ['Low', 'Medium', 'High'];

const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

// ---- document templates (PMI headings, generic editor) -----------------------------------------
// Section kinds: text, list (strings), table (rows of typed columns), finance (cost-benefit inputs),
// derived (read-only line computed from the project).

const text = (key, label, hint) => ({ key, label, kind: 'text', hint });
const list = (key, label, hint) => ({ key, label, kind: 'list', hint });
const table = (key, label, cols, hint) => ({ key, label, kind: 'table', cols, hint });
const col = (key, label, kind = 'text', options) => ({ key, label, kind, options });

export const PM_DOCS = [
  {
    key: 'businessCase', title: 'Business case', icon: 'briefcase', group: 'Initiating',
    blurb: 'Why the project is worth doing. Follows the PMI business case template.',
    sections: [
      text('summary', 'Executive summary', 'One paragraph a sponsor can decide from.'),
      text('problem', 'Business problem or opportunity', 'What is wrong or missing today, and for whom.'),
      list('objectives', 'Business objectives', 'Measurable outcomes the organisation wants.'),
      table('options', 'Options analysis', [
        col('name', 'Option'), col('description', 'Description'), col('cost', 'Cost', 'number'), col('benefit', 'Benefit', 'number'),
        col('verdict', 'Verdict', 'choice', ['Considered', 'Rejected', 'Recommended']),
      ], 'Include do nothing as the baseline.'),
      text('recommendation', 'Recommended option and rationale'),
      table('benefits', 'Expected benefits', [col('benefit', 'Benefit'), col('measure', 'How measured'), col('target', 'Target'), col('owner', 'Owner')]),
      { key: 'finance', label: 'Cost-benefit summary', kind: 'finance' },
      list('assumptions', 'Assumptions'),
      list('constraints', 'Constraints'),
      list('risks', 'Key risks', 'Headlines only. The full register lives under Risk management.'),
      list('criteria', 'Success criteria'),
      text('approval', 'Sponsor decision and approvals'),
    ],
  },
  {
    key: 'charter', title: 'Project charter', icon: 'file-text', group: 'Initiating',
    blurb: 'Authorises the project and names the project manager. Follows the PMI charter template.',
    sections: [
      text('purpose', 'Project purpose or justification'),
      text('description', 'Project description'),
      table('objectives', 'Measurable objectives and success criteria', [col('objective', 'Objective'), col('criterion', 'Success criterion'), col('approver', 'Approved by')]),
      list('requirements', 'High-level requirements'),
      list('deliverables', 'Key deliverables'),
      list('boundaries', 'Out of scope'),
      table('milestones', 'Summary milestones', [col('milestone', 'Milestone'), col('date', 'Target date', 'date')]),
      { key: 'budgetNote', label: 'Summary budget', kind: 'derived', get: (s) => `Approved budget ${money(s.project.budget)}. Detail under Budget.` },
      text('riskSummary', 'Overall project risk'),
      text('stakeholderSummary', 'Key stakeholders'),
      list('assumptions', 'Assumptions'),
      list('constraints', 'Constraints'),
      text('approvalReqs', 'Project approval requirements'),
      text('exit', 'Project exit criteria'),
      text('authority', 'Project manager, responsibility and authority level'),
      text('sponsor', 'Authorised by (sponsor)'),
    ],
  },
  {
    key: 'stakeholders', title: 'Stakeholder register', icon: 'users', group: 'Initiating',
    blurb: 'Who is affected, how much power they hold, and how to engage them.',
    extra: 'grid',
    sections: [
      table('register', 'Stakeholders', [
        col('name', 'Name'), col('role', 'Role'), col('influence', 'Influence', 'choice', LMH), col('interest', 'Interest', 'choice', LMH),
        col('attitude', 'Attitude', 'choice', ['Supportive', 'Neutral', 'Resistant']), col('strategy', 'Engagement approach'),
      ]),
    ],
  },
  {
    key: 'scope', title: 'Scope statement', icon: 'crosshair', group: 'Planning',
    blurb: 'What is in, what is out, and how acceptance works.',
    sections: [
      text('description', 'Product scope description'),
      list('deliverables', 'Deliverables'),
      list('acceptance', 'Acceptance criteria'),
      list('exclusions', 'Exclusions'),
      list('assumptions', 'Assumptions'),
      list('constraints', 'Constraints'),
    ],
  },
  { key: 'wbs', title: 'Work breakdown structure', icon: 'share-2', group: 'Planning', special: 'wbs', blurb: 'Decompose the scope into work packages. View it as an outline, tree, fishbone or mind map.', sections: [] },
  { key: 'budget', title: 'Budget', icon: 'dollar-sign', group: 'Planning', special: 'budget', blurb: 'Approved budget, cost lines, contingency and spend. Labour comes from the task estimates.', sections: [] },
  {
    key: 'risks', title: 'Risk management', icon: 'alert-triangle', group: 'Planning', special: 'risks',
    blurb: 'Risk management plan, register and probability and impact matrix.',
    sections: [
      text('method', 'Methodology and tools'),
      text('roles', 'Roles and responsibilities'),
      list('categories', 'Risk categories'),
      text('scales', 'Probability and impact scales', 'Define what 1 to 5 means for this project.'),
      text('appetite', 'Risk appetite and thresholds'),
      text('reporting', 'Reporting and tracking'),
    ],
  },
  {
    key: 'comms', title: 'Communications plan', icon: 'message-square', group: 'Planning',
    blurb: 'Who needs what information, how often, and from whom.',
    sections: [
      table('plan', 'Communication matrix', [
        col('audience', 'Audience'), col('info', 'Information'), col('method', 'Channel'),
        col('frequency', 'Frequency', 'choice', ['Daily', 'Weekly', 'Fortnightly', 'Monthly', 'On event']), col('owner', 'Owner'),
      ]),
    ],
  },
  {
    key: 'changes', title: 'Change log', icon: 'repeat', group: 'Monitoring and controlling',
    blurb: 'Change requests with their impact and decision.',
    sections: [
      table('log', 'Change requests', [
        col('change', 'Change'), col('requester', 'Requested by'), col('impact', 'Main impact', 'choice', ['Scope', 'Schedule', 'Cost', 'Quality']),
        col('status', 'Status', 'choice', ['Submitted', 'Approved', 'Rejected', 'Deferred']), col('date', 'Date', 'date'),
      ]),
    ],
  },
  {
    key: 'lessons', title: 'Lessons learned', icon: 'book-open', group: 'Closing',
    blurb: 'What to repeat, what to change. Feeds the closure report.',
    sections: [
      table('log', 'Lessons', [
        col('category', 'Category', 'choice', ['Scope', 'Schedule', 'Cost', 'Quality', 'Team', 'Process', 'Risk']),
        col('what', 'What happened'), col('advice', 'Recommendation'),
      ]),
      text('closure', 'Closure summary'),
    ],
  },
];
export const DOC_BY_KEY = Object.fromEntries(PM_DOCS.map((d) => [d.key, d]));
export const DOC_GROUPS = ['Initiating', 'Planning', 'Monitoring and controlling', 'Closing'];

export const docOf = (pm, key) => ({ status: 'Not started', values: {}, ...(pm.docs[key] || {}) });

const filled = (sec, v) => {
  if (sec.kind === 'text') return typeof v === 'string' && v.trim().length > 0;
  if (sec.kind === 'list') return Array.isArray(v) && v.some((x) => String(x).trim());
  if (sec.kind === 'table') return Array.isArray(v) && v.length > 0;
  if (sec.kind === 'finance') return !!v && Number(v.cost) > 0;
  return false;
};

// 0..1: how much of a document's template has content.
export function docProgress(pm, key) {
  const def = DOC_BY_KEY[key];
  if (key === 'wbs') return Math.min(1, (pm.wbs.length - 1) / 6);
  if (key === 'budget') return pm.budget.lines.length ? 1 : 0;
  const vals = docOf(pm, key).values;
  const parts = def.sections.filter((x) => x.kind !== 'derived').map((x) => (filled(x, vals[x.key]) ? 1 : 0));
  if (key === 'risks') parts.push(pm.risks.length ? 1 : 0);
  return avg(parts);
}

export const emptyRow = (cols) => {
  const row = { id: pid('row') };
  cols.forEach((c) => {
    row[c.key] = c.kind === 'choice' ? c.options[0] : '';
  });
  return row;
};

// ---- finance, risk and budget maths -------------------------------------------------------------

export function financeOf(f = {}) {
  const cost = Number(f.cost) || 0;
  const yearly = Number(f.annualBenefit) || 0;
  const years = Math.max(0, Math.round(Number(f.years) || 0));
  const rate = (Number(f.rate) || 0) / 100;
  let npv = -cost;
  for (let t = 1; t <= years; t++) npv += yearly / Math.pow(1 + rate, t);
  const total = yearly * years;
  return { npv, roi: cost ? (total - cost) / cost : 0, payback: yearly > 0 ? cost / yearly : null, total };
}

export const RISK_LEVELS = [
  { max: 4, label: 'Low', color: '#2F9E6B' },
  { max: 9, label: 'Medium', color: '#D89614' },
  { max: 14, label: 'High', color: '#E0512D' },
  { max: 25, label: 'Critical', color: '#A3261C' },
];
export const OPP_COLOR = '#3B6FE0';
export const riskScore = (r) => r.prob * r.impact;
export const riskLevel = (score) => RISK_LEVELS.find((l) => score <= l.max) || RISK_LEVELS[3];
export const riskColor = (r) => (r.type === 'Opportunity' ? OPP_COLOR : riskLevel(riskScore(r)).color);
export const RISK_CATEGORIES = ['Technical', 'Schedule', 'Cost', 'Resource', 'Quality', 'External', 'Organisational'];
export const RISK_RESPONSES = {
  Threat: ['Avoid', 'Transfer', 'Mitigate', 'Accept', 'Escalate'],
  Opportunity: ['Exploit', 'Enhance', 'Share', 'Accept', 'Escalate'],
};
export const RISK_STATUS = ['Open', 'In response', 'Occurred', 'Closed'];
export const isLive = (r) => r.status !== 'Closed';

export function budgetOf(s) {
  const lab = labourCosts(s);
  const lines = s.pm.budget.lines;
  const sum = (k) => lines.reduce((a, l) => a + (Number(l[k]) || 0), 0);
  const planned = lab.planned + sum('planned');
  const committed = lab.actual + sum('committed');
  const actual = lab.actual + sum('actual');
  const contingency = Math.round((planned * (Number(s.pm.budget.contingencyPct) || 0)) / 100);
  const baseline = planned + contingency;
  const approved = Number(s.project.budget) || 0;
  return { labour: lab, planned, committed, actual, contingency, baseline, approved, unallocated: approved - baseline, remaining: approved - actual };
}

// One row of numbers per project, used by the Projects hub, Programs and Portfolios.
export function summaryOf(d) {
  const pm = d.pm;
  const b = budgetOf(d);
  const live = pm.risks.filter((r) => isLive(r) && r.type === 'Threat');
  return {
    name: d.project.name,
    progress: progressOf(d.tasks),
    budget: b.approved,
    actual: b.actual,
    planned: b.baseline,
    health: pm.info.health,
    phase: pm.info.phase,
    manager: pm.info.manager,
    code: pm.info.code,
    start: pm.info.start,
    end: pm.info.end,
    docPct: avg(PM_DOCS.map((x) => docProgress(pm, x.key))),
    approvedDocs: PM_DOCS.filter((x) => docOf(pm, x.key).status === 'Approved').length,
    openRisks: live.length,
    topRisks: live.filter((r) => riskScore(r) >= 10).length,
    tasks: d.tasks.length,
  };
}

// Worst health wins when rolling up.
export const worstHealth = (list) => HEALTH[Math.max(0, ...list.map((h) => HEALTH.indexOf(h)))] || 'On track';

// ---- WBS ----------------------------------------------------------------------------------------
// Stored flat: { id, parent, name, owner, hours, note }. The first node (w0) is the project itself.
// Sibling order is the order in the array. Codes (1, 1.2, 1.2.3) are derived, never stored.

export const WBS_ROOT = 'w0';
const wn = (id, parent, name, hours = 0, owner = '', note = '') => ({ id, parent, name, owner, hours, note });

export function buildTree(nodes, rootName) {
  const kids = {};
  nodes.forEach((n) => {
    if (n.parent) (kids[n.parent] = kids[n.parent] || []).push(n);
  });
  const make = (n, code, level, branch) => {
    const children = (kids[n.id] || []).map((ch, i) => make(ch, level === 0 ? String(i + 1) : `${code}.${i + 1}`, level + 1, level === 0 ? i : branch));
    const own = Number(n.hours) || 0;
    const hours = children.length ? children.reduce((a, ch) => a + ch.hours, 0) : own;
    return { id: n.id, name: level === 0 ? rootName || n.name || 'Project' : n.name || 'Untitled', owner: n.owner, note: n.note, own, code, level, branch, children, hours };
  };
  return make(nodes.find((n) => n.id === WBS_ROOT) || nodes[0], '', 0, -1);
}

export function flattenTree(tree) {
  const out = [];
  const walk = (n) => {
    out.push(n);
    n.children.forEach(walk);
  };
  walk(tree);
  return out;
}

const siblingsOf = (nodes, id) => {
  const n = nodes.find((x) => x.id === id);
  return n ? nodes.filter((x) => x.parent === n.parent) : [];
};

export const wbsAddChild = (nodes, parent, name = 'New element') => {
  const node = wn(pid('w'), parent, name);
  return { nodes: [...nodes, node], id: node.id };
};
export const wbsAddSibling = (nodes, id, name = 'New element') => {
  const at = nodes.findIndex((x) => x.id === id);
  if (at < 0 || nodes[at].parent === null) return { nodes, id: null };
  const node = wn(pid('w'), nodes[at].parent, name);
  return { nodes: [...nodes.slice(0, at + 1), node, ...nodes.slice(at + 1)], id: node.id };
};
export const wbsUpdate = (nodes, id, patch) => nodes.map((n) => (n.id === id ? { ...n, ...patch } : n));
export const wbsMove = (nodes, id, dir) => {
  const sib = siblingsOf(nodes, id);
  const i = sib.findIndex((x) => x.id === id);
  const other = sib[i + dir];
  if (!other || nodes.find((x) => x.id === id).parent === null) return nodes;
  const a = nodes.findIndex((x) => x.id === id);
  const b = nodes.findIndex((x) => x.id === other.id);
  const out = [...nodes];
  [out[a], out[b]] = [out[b], out[a]];
  return out;
};
export const canIndent = (nodes, id) => {
  const n = nodes.find((x) => x.id === id);
  return !!n && n.parent !== null && siblingsOf(nodes, id).findIndex((x) => x.id === id) > 0;
};
export const wbsIndent = (nodes, id) => {
  if (!canIndent(nodes, id)) return nodes;
  const sib = siblingsOf(nodes, id);
  const prev = sib[sib.findIndex((x) => x.id === id) - 1];
  const moved = { ...nodes.find((x) => x.id === id), parent: prev.id };
  return [...nodes.filter((x) => x.id !== id), moved];
};
export const canOutdent = (nodes, id) => {
  const n = nodes.find((x) => x.id === id);
  const p = n && nodes.find((x) => x.id === n.parent);
  return !!p && p.parent !== null;
};
export const wbsOutdent = (nodes, id) => {
  if (!canOutdent(nodes, id)) return nodes;
  const n = nodes.find((x) => x.id === id);
  const p = nodes.find((x) => x.id === n.parent);
  const rest = nodes.filter((x) => x.id !== id);
  const at = rest.findIndex((x) => x.id === p.id);
  return [...rest.slice(0, at + 1), { ...n, parent: p.parent }, ...rest.slice(at + 1)];
};
export const wbsDelete = (nodes, id) => {
  if (id === WBS_ROOT) return nodes;
  const gone = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    nodes.forEach((n) => {
      if (!gone.has(n.id) && gone.has(n.parent)) {
        gone.add(n.id);
        grew = true;
      }
    });
  }
  return nodes.filter((n) => !gone.has(n.id));
};

export function wbsCSV(tree) {
  const q = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
  return [
    'code,level,name,owner,hours,note',
    ...flattenTree(tree).map((n) => [q(n.code || '0'), n.level, q(n.name), q(n.owner), n.hours, q(n.note)].join(',')),
  ].join('\n');
}


export const blankPm=()=>({info:{code:'',sponsor:'',manager:'',customer:'',phase:'Initiating',health:'On track',objective:'',start:'',end:''},budget:{contingencyPct:10,lines:[]},risks:[],wbs:[{id:'w0',parent:null,name:'',owner:'',hours:0,note:''}],docs:{}});
export const normalizePm=raw=>{const b=blankPm(),p=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};return {...b,...p,info:{...b.info,...(p.info||{})},budget:{...b.budget,...(p.budget||{}),lines:Array.isArray(p.budget?.lines)?p.budget.lines:[]},risks:Array.isArray(p.risks)?p.risks:[],wbs:Array.isArray(p.wbs)&&p.wbs.length?p.wbs:b.wbs,docs:p.docs&&typeof p.docs==='object'&&!Array.isArray(p.docs)?p.docs:{}}};
