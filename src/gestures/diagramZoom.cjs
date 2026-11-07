// /src/gestures/diagramZoom.cjs
'use strict';

function clampScale(value, minimum = 0.25) {
  'worklet';
  return Number.isFinite(value) ? Math.max(minimum, Math.min(4, value)) : 1;
}

function fitScale(bounds) {
  return clampScale(Math.min(1.6, Math.max(1, bounds.width - 4) / bounds.contentWidth, bounds.height / bounds.contentHeight), bounds.minScale ?? 0.25);
}

// Coordinates use a top-left transform origin; small diagrams stay at the start.
function constrainPose(pose, bounds) {
  'worklet';
  const scale = clampScale(pose.scale, bounds.minScale ?? 0.25);
  return {
    scale,
    x: bounds.center && bounds.contentWidth * scale <= bounds.width ? (bounds.width - bounds.contentWidth * scale) / 2 : Math.min(0, Math.max(Math.min(0, bounds.width - bounds.contentWidth * scale), pose.x)),
    y: bounds.center && bounds.contentHeight * scale <= bounds.height ? (bounds.height - bounds.contentHeight * scale) / 2 : Math.min(0, Math.max(Math.min(0, bounds.height - bounds.contentHeight * scale), pose.y)),
  };
}

function pinchPose(start, factor, anchor, focal, bounds) {
  'worklet';
  const scale = clampScale(start.scale * factor, bounds.minScale ?? 0.25);
  const ratio = scale / start.scale;
  return constrainPose({ scale, x: focal.x - (anchor.x - start.x) * ratio, y: focal.y - (anchor.y - start.y) * ratio }, bounds);
}

module.exports = { clampScale, fitScale, constrainPose, pinchPose };
