// /src/gestures/dragFollow.cjs
'use strict';
// Pure helpers for dragging inside a scrolling container (Timeline bars while the chart auto-scrolls).
// No React, no native modules: deterministic and unit-tested.

// How far the container scrolled since the drag was lifted. A bar lives INSIDE the scrolled content,
// so the bar has to be moved by this amount on top of the finger travel to stay under the finger.
const scrollSince = (scroll, base, axis = 'xy') => ({
  x: (scroll && Number.isFinite(scroll.x) ? scroll.x : 0) - (base && Number.isFinite(base.x) ? base.x : 0),
  y: axis === 'x' ? 0 : (scroll && Number.isFinite(scroll.y) ? scroll.y : 0) - (base && Number.isFinite(base.y) ? base.y : 0),
});

// True when a heartbeat is older than `limit` ms. The active drag beats once per frame; a missing beat means
// the gesture is gone (its view unmounted or the release was lost) and anything it started must be stopped.
const isStale = (now, beat, limit = 1500) => !Number.isFinite(beat) || beat <= 0 || now - beat > limit;

// A bar that is being dragged must stay mounted and unclipped, however far the visible window moves away from it.
const keepWhole = (isDragged, isLifted) => !!(isDragged || isLifted);

module.exports = { scrollSince, isStale, keepWhole };
