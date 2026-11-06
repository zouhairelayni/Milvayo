// /src/app/navigation/sections.cjs
// Phone navigation map. NAV is the one list of the 19 menu entries (the wide sidebar still renders it unchanged).
// Optional tools (Sprints, Releases...) can be switched off per project (domain/projectTools.cjs): viewsOf, navFor and moreGroups
// hide those, and with every tool on (the default for existing projects) all 19 entries are reachable.
// SECTIONS are the bottom-bar destinations; `views` is what the pill under the header switches between.
// Every NAV entry that is not a section view is listed under More (moreGroups derives it), so no entry can become
// unreachable by editing one list. tests/app/phone-shell-parity-060.test.cjs checks this.
const projectTools = require('../../domain/projectTools.cjs');
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

// `first` is where the bar button lands the first time; afterwards it returns to the last view used in that section.
const SECTIONS = [
  { id: 'home', label: 'Home', icon: 'home', first: 'overview', views: [['overview', 'Overview']] },
  { id: 'work', label: 'Work', icon: 'columns', first: 'board',
    views: [['board', 'Board'], ['timeline', 'Timeline'], ['tasks', 'List'], ['sprints', 'Sprints']] },
  { id: 'projects', label: 'Projects', icon: 'folder', first: 'projects',
    views: [['projects', 'Projects'], ['portfolios', 'Portfolios'], ['programs', 'Programs']] },
  { id: 'more', label: 'More', icon: 'more-horizontal', first: 'more', views: [] },
];

const sectionOf = screen => (SECTIONS.find(s => s.views.some(([k]) => k === screen)) || SECTIONS[3]).id;

const labelOf = screen => {
  for (const g of NAV) for (const [k, label] of g.items) if (k === screen) return label;
  return screen === 'more' ? 'More' : screen;
};

// The views of one section that are switched on for this project.
const viewsOf = (section, tools) => section.views.filter(([k]) => projectTools.screenOn(tools, k));

// The menu entries for the wide sidebar, without the tools switched off.
const navFor = tools => NAV.map(g => ({ group: g.group, items: g.items.filter(([k]) => projectTools.screenOn(tools, k)) })).filter(g => g.items.length);

// What the More screen lists. 'Project tools' always exists (it holds Manage tools); the other groups are dropped when empty.
function moreGroups(tools) {
  const inSection = new Set(SECTIONS.flatMap(s => s.views.map(([k]) => k)));
  const flat = NAV.flatMap(g => g.items).filter(([k]) => !inSection.has(k));
  const tool = projectTools.IDS.map(id => flat.find(([k]) => k === id)).filter(Boolean).filter(([k]) => projectTools.screenOn(tools, k));
  const named = new Set([...projectTools.IDS, 'scheduling', 'settings']);
  return [
    { group: 'Project tools', items: [...flat.filter(([k]) => k === 'scheduling'), ...tool] },
    { group: 'App', items: flat.filter(([k]) => k === 'settings') },
    { group: 'More', items: flat.filter(([k]) => !named.has(k)) },
  ].filter(g => g.items.length || g.group === 'Project tools');
}

// Horizontal swipe on the bar or the pill: the id one step left/right of `current`, or null (too short, mostly
// vertical, or already at the end). Same thresholds the bottom bar has always used.
function swipeStep(ids, current, dx, dy) {
  if (Math.abs(dx) < 65 || Math.abs(dx) < Math.abs(dy) * 1.4) return null;
  const at = ids.indexOf(current);
  if (at < 0) return null;
  const next = at + (dx < 0 ? 1 : -1);
  return next < 0 || next >= ids.length ? null : ids[next];
}

module.exports = { NAV, SECTIONS, sectionOf, labelOf, viewsOf, navFor, moreGroups, swipeStep };
