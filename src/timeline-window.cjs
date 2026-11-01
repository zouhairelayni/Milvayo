'use strict';

// Only render the visible portion of a scheduled bar. ISO dates and persisted
// duration remain unchanged; this is deliberately a view-only transform.
function clipBar(rawLeft, rawRight, viewportWidth) {
  if (![rawLeft, rawRight, viewportWidth].every(Number.isFinite) || viewportWidth <= 0 || rawRight < rawLeft) return null;
  if (rawRight < 0 || rawLeft > viewportWidth) return null;
  const left = Math.max(0, rawLeft);
  const right = Math.min(viewportWidth, rawRight);
  return {
    left,
    width: Math.max(2, right - left),
    startVisible: rawLeft >= 0,
    dueVisible: rawRight <= viewportWidth,
  };
}

module.exports = { clipBar };
