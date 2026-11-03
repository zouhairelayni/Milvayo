// /src/timeline/timelineEdit.cjs
'use strict';
// Pure Timeline edit rules (no React, no dates library: date helpers are passed in).
//
// RULE (owner, 0.5.15): a RESIZE of a task in the Timeline, dragging the left or the right edge of its bar,
// is a DURATION MODIFICATION. A MOVE shifts both dates and never changes the duration.
// Duration is counted in whole calendar days, both ends included, and is never less than 1 day.

const isResize = (mode) => mode === 'start' || mode === 'due';

// Whole days a task spans, both ends included.
const durationDays = (start, due, daysBetween) => daysBetween(start, due) + 1;

// New start/due for a move or an edge resize, given the whole days the finger has travelled.
function apply(mode, base, days, addDays) {
  let s = base.start;
  let d = base.due;
  if (mode === 'move') {
    s = addDays(base.start, days);
    d = addDays(base.due, days);
  } else if (mode === 'start') {
    s = addDays(base.start, days);
    if (s > base.due) s = base.due;
  } else {
    d = addDays(base.due, days);
    if (d < base.start) d = base.start;
  }
  return { start: s, due: d };
}

// History text for a committed edit. A resize is always described as a duration change.
function commitLabel(mode, title, before, after, helpers) {
  const { fmt, daysBetween } = helpers;
  if (mode === 'move') return `Moved "${title}" to ${fmt(after.start)}`;
  const from = durationDays(before.start, before.due, daysBetween);
  const to = durationDays(after.start, after.due, daysBetween);
  const unit = (n) => `${n} day${n === 1 ? '' : 's'}`;
  return `Changed duration of "${title}" from ${unit(from)} to ${unit(to)} (${fmt(after.start)} to ${fmt(after.due)})`;
}

module.exports = { isResize, durationDays, apply, commitLabel };
