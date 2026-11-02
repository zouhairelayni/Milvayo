// /src/timeline/timelineViewport.cjs
'use strict';
// Pixel-space viewport selectors. These reduce native drawing surfaces, NOT task data:
// every scheduled task stays in one continuous vertical scroll (no pagination).
const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));
function horizontalWindow(canvasWidth, viewportWidth, offsetX, overscan = 200) {
  const canvas = Math.max(0, Number.isFinite(canvasWidth) ? canvasWidth : 0);
  const viewport = Math.max(1, Number.isFinite(viewportWidth) && viewportWidth > 0 ? viewportWidth : 400);
  const scroll = clamp(Number.isFinite(offsetX) ? offsetX : 0, 0, Math.max(0, canvas - viewport));
  const left = clamp(Math.floor(scroll - overscan), 0, canvas);
  const right = clamp(Math.ceil(scroll + viewport + overscan), left, canvas);
  return { left, width: right - left, right };
}
function intersects(left, right, windowLeft, windowWidth, extra = 0) {
  return Number.isFinite(left) && Number.isFinite(right) &&
    right >= windowLeft - extra && left <= windowLeft + windowWidth + extra;
}
// A chart is virtualized by VIEW, not by deleting model rows. A long dependency
// is drawn whenever any part of its vertical span crosses the painted rows.
function intersectsRows(fromIndex, toIndex, first, last) {
  return Number.isInteger(fromIndex) && Number.isInteger(toIndex) && last > first &&
    Math.max(fromIndex, toIndex) >= first && Math.min(fromIndex, toIndex) < last;
}
// SVG viewBox uses absolute data coordinates within a small native viewport.
// This is more reliable than translating a large G subtree with negative offsets.
function svgViewBox(left, top, width, height) {
  if (![left, top, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return '0 0 1 1';
  return `${left} ${top} ${width} ${height}`;
}
function routingLane(extents,lo,hi,start){
 const intervals=[];
 for(let r=lo;r<=hi;r++){const e=extents[r];if(e)intervals.push([e[0]-4,e[1]+4]);}
 intervals.sort((a,b)=>b[1]-a[1]);
 let candidate=start;
 for(const [left,right] of intervals){
  if(candidate>=left&&candidate<=right)candidate-= (Math.floor((candidate-left)/6)+1)*6;
 }
 // Preserve the original fallback when every scanned lane is occupied.
 return Math.max(6,candidate>=8?candidate:start);
}
module.exports = { routingLane, horizontalWindow, intersects, intersectsRows, svgViewBox };

