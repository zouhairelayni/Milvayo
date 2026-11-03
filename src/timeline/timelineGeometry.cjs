// /src/timeline/timelineGeometry.cjs
'use strict';
// Pure drawing math for dependency lines on the timeline. No React, no storage.

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

// Polyline turned into a flowing S-curve: every corner is rounded as widely as the neighbouring segments allow.
function roundPath(pts, rMax = 40) {
  const n = pts.length;
  const len = (i) => Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < n - 1; i++) {
    const [px, py] = pts[i - 1];
    const [cx, cy] = pts[i];
    const [nx, ny] = pts[i + 1];
    const l1 = len(i - 1);
    const l2 = len(i);
    // The first and last segments give all their length to their one corner; the others share theirs.
    const a = Math.min(rMax, i === 1 ? l1 : l1 / 2);
    const b = Math.min(rMax, i === n - 2 ? l2 : l2 / 2);
    if (a < 0.5 || b < 0.5) {
      d += ` L${cx},${cy}`;
      continue;
    }
    d += ` L${cx - ((cx - px) / l1) * a},${cy - ((cy - py) / l1) * a} Q${cx},${cy} ${cx + ((nx - cx) / l2) * b},${cy + ((ny - cy) / l2) * b}`;
  }
  const last = pts[n - 1];
  return `${d} L${last[0]},${last[1]}`;
}

function distToPath(pts, qx, qy) {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 ? clamp(((qx - ax) * dx + (qy - ay) * dy) / len2, 0, 1) : 0;
    best = Math.min(best, Math.hypot(qx - (ax + t * dx), qy - (ay + t * dy)));
  }
  return best;
}

module.exports = { roundPath, distToPath };
