// /src/ui/theme/layout.cjs
'use strict';
// Pure layout rules shared by the shell and the screens. No React, so they are unit-tested in node.
// phone: bottom navigation. tablet: icon rail. desktop: full sidebar (either can be changed by the user).
const PHONE_MAX = 719;
const DESKTOP_MIN = 1100;
const SIDEBAR_W = 248;
const RAIL_W = 64;
const PAGE_MAX = 1680;

const breakpoint = (width) => (width <= PHONE_MAX ? 'phone' : width < DESKTOP_MIN ? 'tablet' : 'desktop');

// pref is null (automatic), 'open' or 'collapsed'. Phones never show a sidebar.
const sidebarCollapsed = (bp, pref) => (bp === 'phone' ? false : pref === 'open' ? false : pref === 'collapsed' ? true : bp === 'tablet');
const sidebarWidth = (bp, collapsed) => (bp === 'phone' ? 0 : collapsed ? RAIL_W : SIDEBAR_W);
// The value to store when the user presses the sidebar button.
const toggledPref = (bp, pref) => (sidebarCollapsed(bp, pref) ? 'open' : 'collapsed');

const pageGutter = (bp) => (bp === 'phone' ? 16 : bp === 'tablet' ? 20 : 28);

const percent = (v) => (typeof v === 'string' && v.endsWith('%') ? parseFloat(v) : null);
// Width of one grid cell. `wide` is the desktop basis, `mobile` the phone basis; tablets get two columns.
function cellBasis(bp, wide, mobile) {
  if (bp === 'phone') return mobile;
  if (bp === 'desktop') return wide;
  const n = percent(wide);
  if (n === null) return wide;
  return n < 40 ? '48%' : n <= 50 ? wide : '100%';
}

// Kanban column width. Phones keep a fixed width so the next list peeks in; wider screens share the free width.
const COLUMNS = { narrow: 272, min: 290, max: 380, addTile: 52 };
function boardColumnWidth(bp, avail, count, gap = 12, opts = COLUMNS) {
  const o = { ...COLUMNS, ...opts };
  if (bp === 'phone' || !(avail > 0) || !(count > 0)) return o.narrow;
  const fit = Math.floor((avail - o.addTile - gap * count) / count);
  return Math.max(o.min, Math.min(o.max, fit));
}

module.exports = { PHONE_MAX, DESKTOP_MIN, SIDEBAR_W, RAIL_W, PAGE_MAX, breakpoint, sidebarCollapsed, sidebarWidth, toggledPref, pageGutter, cellBasis, boardColumnWidth };
