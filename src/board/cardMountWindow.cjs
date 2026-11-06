// /src/board/cardMountWindow.cjs
'use strict';
const INITIAL_CARDS = 5;
function nextCardCount(shown, total, {active, userScroll, offset, viewport, content}) {
  if (!active || !userScroll || ![offset, viewport, content].every(Number.isFinite) || offset <= 0 || viewport <= 0) return shown;
  if (offset + viewport < content - 160) return shown;
  return Math.max(shown, Math.min(total, shown + INITIAL_CARDS));
}
module.exports = {INITIAL_CARDS, nextCardCount};
