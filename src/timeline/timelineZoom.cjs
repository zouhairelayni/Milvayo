// /src/timeline/timelineZoom.cjs
'use strict';
const { MAX_CANVAS_WIDTH, BASE_DAYS } = require('./timelineDisplay.cjs');

// Display-only density. Keep the established native canvas width budget.
function pinchZoom(width, factor, anchor, focal, scroll, span, viewportWidth, initialWidth = width) {
  'worklet';
  const cap = MAX_CANVAS_WIDTH / Math.max(BASE_DAYS, span);
  const floor = Math.min(3, Math.max(1, viewportWidth) / Math.max(BASE_DAYS, span));
  const min = Math.min(cap, Math.max(floor, initialWidth * 0.25)), max = Math.min(136, cap, initialWidth * 4);
  const next = Math.max(min, Math.min(max, width * (Number.isFinite(factor) && factor > 0 ? factor : 1)));
  const offset = Math.max(0, Math.min(Math.max(0, next * span - viewportWidth), (scroll + anchor) * next / width - focal));
  return { width: next, scroll: offset };
}

// The smallest preview factor is 1/4 per gesture, bounding temporary draw cost.
function previewWindow(width, scroll, viewportWidth) {
  return { left: Math.max(0, scroll - viewportWidth * 4), right: Math.min(width, scroll + viewportWidth * 5) };
}

// Rebase every density change, including presets which may exceed a pinch's 4x limit.
function rebaseZoom(width, nextWidth, scroll, span, viewportWidth) {
  const canvas = nextWidth * span;
  const previous = Math.max(0, Math.min(Math.max(0, width * span - viewportWidth), scroll));
  const focal = viewportWidth / 2;
  return Math.max(0, Math.min(Math.max(0, canvas - viewportWidth), (previous + focal) * nextWidth / width - focal));
}
module.exports = { pinchZoom, previewWindow, rebaseZoom };
