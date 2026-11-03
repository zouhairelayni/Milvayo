// /src/board/boardDragContext.cjs
'use strict';
const { refreshMax } = require('../gestures/scrollLimits.cjs');
// ---- drag context -------------------------------------------------------------
// Shared, mutable, not rendered. Holds scroll positions, the pointer, and where each card sat
// when the drag began, so a drop can be worked out without re-rendering on every move.
function newCtx() {
  return {
    scroll: { x: 0, y: 0 },              // strip (x) and page (y) scroll, kept by onScroll
    max: { x: 0, y: 0 },                 // furthest each can scroll, so auto-scroll never overshoots
    size: { cw: 0, vw: 0, ch: 0, vh: 0 }, // strip content/visible width, page content/visible height
    pointer: { x: 0, y: 0, valid: false },
    stripBox: null,                       // { x, w } of the visible strip, measured at the lift
    lists: {},                            // listId -> { ref }
    listTop: {},                          // listId -> window y of the list's top at the lift
    cards: {},                            // taskId -> { ref }
    win: {},                              // taskId -> { y, h, sy }: window y at the lift, page scroll then
    local: {},                            // taskId -> { y, h }: position inside its list, from onLayout
    order: {},                            // listId -> [taskId] in display order
    lastKey: null,
    measure: () => {},
  };
}

// Which slot a card would take in a list if dropped at window height py.
function slotFor(k, listId, py, excludeId) {
  const ids = (k.order[listId] || []).filter((id) => id !== excludeId);
  for (let i = 0; i < ids.length; i++) {
    const w = k.win[ids[i]];
    if (!w) continue;
    const top = w.y - (k.scroll.y - w.sy); // page scroll since the lift moves everything up
    if (py < top + w.h / 2) return { index: i, before: ids[i] };
  }
  return { index: ids.length, before: null };
}

module.exports = { newCtx, refreshMax, slotFor };
