// /src/gestures/scrollLimits.cjs
'use strict';
// How far a scroll area can scroll, kept on the drag context so auto-scroll never overshoots.
// Shared by the Board and Timeline screens (both keep `k.size` and `k.max` the same way).

function refreshMax(k) {
  k.max.x = Math.max(0, k.size.cw - k.size.vw);
  k.max.y = Math.max(0, k.size.ch - k.size.vh);
}

module.exports = { refreshMax };
