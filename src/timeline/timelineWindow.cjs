// /src/timeline/timelineWindow.cjs
'use strict';
// Render budget for mobile Gantt. Pure helpers: no persisted workspace changes.
const PHONE_ROWS = 10;
const DESKTOP_ROWS = 22;
const valid = (d) => require('./gantt.cjs').dayNumber(d) !== null;
const scheduled = (tasks) => (tasks || [])
  .filter(t => valid(t.start) || valid(t.due))
  .map(t => ({ ...t, start: valid(t.start) ? t.start : t.due, due: valid(t.due) ? t.due : t.start }))
  .sort((a,b) => a.start.localeCompare(b.start) || String(a.id).localeCompare(String(b.id)));
const inRange = (t, start, end) => t.start <= end && t.due >= start;
const pageRows = (tasks, start, end, page, wide) => {
  const visible = tasks.filter(t => inRange(t, start, end));
  const size = wide ? DESKTOP_ROWS : PHONE_ROWS;
  const maxPage = Math.max(0, Math.ceil(visible.length / size) - 1);
  const current = Math.min(Math.max(0, page), maxPage);
  return { visible, rows: visible.slice(current * size, (current + 1) * size),
    current, size, maxPage, outside: tasks.length - visible.length };
};
// Only render the visible portion of a scheduled bar. ISO dates and persisted
// duration remain unchanged; this is deliberately a view-only transform.
const clipBar = (rawLeft, rawRight, viewportWidth) => {
  if (![rawLeft, rawRight, viewportWidth].every(Number.isFinite) || viewportWidth <= 0 || rawRight < rawLeft) return null;
  if (rawRight < 0 || rawLeft > viewportWidth) return null;
  const left = Math.max(0, rawLeft);
  const right = Math.min(viewportWidth, rawRight);
  return { left, width: Math.max(2, right - left), startVisible: rawLeft >= 0, dueVisible: rawRight <= viewportWidth };
};
module.exports = { PHONE_ROWS, DESKTOP_ROWS, scheduled, pageRows, clipBar };
