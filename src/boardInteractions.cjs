'use strict';
// Shared, testable touch geometry and draft-name policies for the original mock UI.
// React Native can flatten ref-only Views; callers must mark title hit areas collapsable=false.
function hitTitle(rect, point) {
  if (!rect || !point || !Number.isFinite(rect.x) || !Number.isFinite(rect.y) ||
      !Number.isFinite(rect.width) || !Number.isFinite(rect.height) ||
      rect.width <= 0 || rect.height <= 0 || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return false;
  return point.x >= rect.x && point.x <= rect.x + rect.width &&
         point.y >= rect.y && point.y <= rect.y + rect.height;
}
function isDoubleTap(now, previous, duration = 350) {
  return Number.isFinite(now) && Number.isFinite(previous) && previous > 0 &&
         now >= previous && now - previous <= duration;
}
function committedName(draft, saved, maxLength) {
  const name = String(draft ?? '').trim();
  return name.length > 0 && name.length <= maxLength ? name : saved;
}
module.exports = { hitTitle, isDoubleTap, committedName };
