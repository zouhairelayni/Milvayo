// /src/board/boardColumns.cjs
// Columns begin at the strip origin; the compact Add list action follows them.
function visibleColumns(count, x, viewportWidth, columnWidth, gap = 12) {
 const step = columnWidth + gap;
 if (!(step > 0) || !(viewportWidth > 0) || count <= 0) return [];
 const left = Math.max(0, x), right = left + viewportWidth;
 const result = [];
 for (let i=0;i<count;i++) {
  const start = i*step;
  if (start < right + 48 && start + columnWidth > left - 48) result.push(i);
 }
 return result;
}
module.exports = {visibleColumns};
