// /src/timeline/timelineDisplay.cjs
'use strict';

// Model-independent timeline display selectors. This is viewport rendering,
// not task pagination: all scheduled tasks remain on the same continuous chart.
const BASE_DAYS = 56;
const MAX_CANVAS_WIDTH = 8192;
const INITIAL_ROWS = 12;
const OVERSCAN_ROWS = 3;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function rangeForTasks(tasks, today, addDays, daysBetween) {
  let first = addDays(today, -14);
  let last = addDays(today, BASE_DAYS - 15);
  for (const t of tasks || []) {
    if (t.start && t.start < first) first = t.start;
    if (t.due && t.due > last) last = t.due;
  }
  // Even projects with no dated tasks have the standard 56-day overview.
  return { start: first, end: last, span: Math.max(BASE_DAYS, daysBetween(first, last) + 1) };
}

function dayWidth(baseWidth, span) {
  return Math.min(baseWidth, MAX_CANVAS_WIDTH / Math.max(BASE_DAYS, span));
}

function paintedRange(count, chartY, windowHeight, rowHeight, buffer = OVERSCAN_ROWS) {
  if (count <= 0) return { first: 0, last: 0 };
  if (!Number.isFinite(chartY) || !windowHeight) return { first: 0, last: Math.min(count, INITIAL_ROWS) };
  const first = clamp(Math.floor(Math.max(0, -chartY) / rowHeight) - buffer, 0, count);
  const last = clamp(Math.ceil(Math.max(0, windowHeight - chartY) / rowHeight) + buffer, first, count);
  return { first, last };
}

function ticks(span, zoom, width) {
  const minGap = zoom === 'Days' ? 28 : zoom === 'Weeks' ? 70 : 78;
  const nominal = zoom === 'Days' ? 1 : zoom === 'Weeks' ? 7 : 14;
  const step = Math.max(nominal, Math.ceil(minGap / Math.max(0.1, width)));
  const result = [];
  for (let i = 0; i < span; i += step) result.push(i);
  return result;
}

function calendarLabels(start, indices) {
  const origin = Date.parse(start + 'T00:00:00Z');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return indices.map(i => {
    const date = new Date(origin + i * 86400000);
    return { index: i, day: date.getUTCDate(), weekday: ['S','M','T','W','T','F','S'][date.getUTCDay()], month: months[date.getUTCMonth()], iso: date.toISOString().slice(0, 10) };
  });
}
module.exports = { calendarLabels, BASE_DAYS, MAX_CANVAS_WIDTH, INITIAL_ROWS, OVERSCAN_ROWS, rangeForTasks, dayWidth, paintedRange, ticks };
