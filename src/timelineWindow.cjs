'use strict';
// Render budget for mobile Gantt. Pure helpers: no persisted workspace changes.
const DEFAULT_DAYS = 56;
const PHONE_ROWS = 10;
const DESKTOP_ROWS = 22;
const valid = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
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
// Truncate painted geometry to the current viewport. The model's start/due dates remain unchanged.
const clipBar = (start, due, origin, dayIndex, dayWidth, span = DEFAULT_DAYS) => {
  const rawL = dayIndex(origin, start) * dayWidth + 2;
  const rawR = (dayIndex(origin, due) + 1) * dayWidth - 2;
  const left = Math.max(2, rawL);
  const right = Math.min(span * dayWidth - 2, rawR);
  return { left, width: Math.max(0, right - left), clippedStart: rawL < 2, clippedDue: rawR > span * dayWidth - 2 };
};
module.exports = { DEFAULT_DAYS, PHONE_ROWS, DESKTOP_ROWS, scheduled, pageRows, clipBar };
