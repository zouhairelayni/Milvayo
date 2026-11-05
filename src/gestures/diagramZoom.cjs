// /src/gestures/diagramZoom.cjs
'use strict';

function clampScale(value) {
  'worklet';
  return Number.isFinite(value) ? Math.max(0.25, Math.min(4, value)) : 1;
}

function fitScale(bounds) {
  return clampScale(Math.min(1.6, Math.max(1, bounds.width - 4) / bounds.contentWidth, bounds.height / bounds.contentHeight));
}

// Coordinates use a top-left transform origin; small diagrams stay at the start.
function constrainPose(pose, bounds) {
  'worklet';
  const scale = clampScale(pose.scale);
  return {
    scale,
    x: Math.min(0, Math.max(Math.min(0, bounds.width - bounds.contentWidth * scale), pose.x)),
    y: Math.min(0, Math.max(Math.min(0, bounds.height - bounds.contentHeight * scale), pose.y)),
  };
}

function pinchPose(start, factor, anchor, focal, bounds) {
  'worklet';
  const scale = clampScale(start.scale * factor);
  const ratio = scale / start.scale;
  return constrainPose({ scale, x: focal.x - (anchor.x - start.x) * ratio, y: focal.y - (anchor.y - start.y) * ratio }, bounds);
}

module.exports = { clampScale, fitScale, constrainPose, pinchPose };
