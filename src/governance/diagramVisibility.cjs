// /src/governance/diagramVisibility.cjs
'use strict';
function batchVisible(box, pose, viewport) {
  'worklet';
  // Overscan absorbs stroke widths and rounding without changing scene coordinates.
  const pad = 32 / pose.scale;
  const left = -pose.x / pose.scale - pad, top = -pose.y / pose.scale - pad;
  return box.x + box.width >= left && box.y + box.height >= top && box.x <= left + viewport.width / pose.scale + pad * 2 && box.y <= top + viewport.height / pose.scale + pad * 2;
}
module.exports = { batchVisible };
