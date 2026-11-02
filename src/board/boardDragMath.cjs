// /src/board/boardDragMath.cjs
'use strict';
// MockDesign's content-space drag calculations, kept explicit for native QA.
// Scroll deltas are included so the held item stays beneath the pointer while
// the page or the horizontal board auto-scrolls.
function dragOffset(finger, liftedAt, scroll, scrollAtLift, axis = 'xy') {
  const x = finger.x - liftedAt.x + scroll.x - scrollAtLift.x;
  const y = axis === 'x' ? 0 : finger.y - liftedAt.y + scroll.y - scrollAtLift.y;
  return { x, y };
}
// A directional swipe should cancel the pending long press instead of lifting.
function hasScrolledBeforeHold(dx, dy, slop = 8) {
  return Math.abs(dx) > slop || Math.abs(dy) > slop;
}
module.exports = { dragOffset, hasScrolledBeforeHold };
