// /src/app/navigation/freezeCell.cjs
// A screen that stays mounted while hidden must not re-render for edits it cannot show.
// The cell remembers the last store value seen while the screen was visible and keeps handing out that
// exact object while hidden: React bails out of context updates for an unchanged identity. When the
// screen is shown again it receives the live value; if nothing changed meanwhile, identity is equal
// and nothing re-renders at all.
function createFreezeCell(initial) {
 let held = initial;
 return {
  resolve(live, frozen) { if (!frozen) held = live; return held; },
  peek() { return held; },
 };
}
module.exports = { createFreezeCell };
