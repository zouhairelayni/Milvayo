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
function cardTop(k, card) {
  const column = k.lists?.[card.listId]?.scroll?.y || 0;
  return card.y - (k.scroll.y - card.sy) - (column - (card.cy || 0));
}
function listScrollAtPointer(k, pointer, edge = 56, speed = 14) {
  for (const entry of Object.values(k.lists)) {
    const box = entry.scroll?.box;
    if (!box) continue;
    const top = box.y - (k.scroll.y - box.sy), left = box.x - (k.scroll.x - box.sx);
    if (pointer.x < left || pointer.x > left + box.w || pointer.y < top || pointer.y > top + box.h) continue;
    const dy = pointer.y < top + edge ? -speed : pointer.y > top + box.h - edge ? speed : 0;
    const y = Math.max(0, Math.min(entry.scroll.max, entry.scroll.y + dy));
    if (dy && y !== entry.scroll.y) return {entry, y};
  }
  return null;
}
function slotFor(k, listId, py, excludeId) {
  const ids = (k.order[listId] || []).filter((id) => id !== excludeId);
  let lastMeasured = -1;
  for (let i = 0; i < ids.length; i++) {
    const w = k.win[ids[i]];
    if (!w) continue;
    lastMeasured = i;
    const top = cardTop(k, w);
    if (py < top + w.h / 2) return { index: i, before: ids[i] };
  }
  // Below the mounted window means before the next unseen card, never past an
  // unmounted tail. Keep indices in the full filtered order for dropBefore.
  const index = lastMeasured + 1;
  return { index, before: ids[index] || null };
}

module.exports = { newCtx, refreshMax, slotFor, cardTop, listScrollAtPointer };
