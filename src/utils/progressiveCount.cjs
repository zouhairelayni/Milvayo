// /src/utils/progressiveCount.cjs
// Progressive mounting: show the first screenful at once, then reveal the rest in small chunks
// so one tab press never has to build every card in a single JS commit.
// The count only grows while the list stays mounted, so a drag in progress never loses a card.
function initialCount(total, first) { return Math.max(0, Math.min(total, first)); }
function nextCount(shown, total, step) {
 if (!(total > 0)) return 0;
 if (shown >= total) return total;
 return Math.min(total, shown + Math.max(1, step));
}
module.exports = { initialCount, nextCount };
