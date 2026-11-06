// /src/timeline/zoomQueue.cjs
'use strict';
// Preview immediately; perform one final geometry commit per frame, discarding superseded inputs.
function createZoomQueue(schedule, cancel, commit) {
  let frame = null, pending = null;
  return {
    get pending() { return pending; },
    push(value) {
      pending = value;
      if (frame !== null) return;
      frame = schedule(() => { frame = null; const next = pending; pending = null; if (next) commit(next); });
    },
    clear() { if (frame !== null) cancel(frame); frame = null; pending = null; },
  };
}
module.exports = { createZoomQueue };
