// /src/ui/commitBuffer.cjs
'use strict';
// Holds the newest typed value and hands it over once typing pauses (or on flush), so a text field
// that saves into the store does not run a full save and re-render for every key.
function createCommitBuffer(commit, wait = 300, timers = { set: setTimeout, clear: clearTimeout }) {
  let pending = false, value, timer = null;
  const flush = () => {
    if (timer) { timers.clear(timer); timer = null; }
    if (!pending) return;
    pending = false;
    const v = value; value = undefined;
    commit(v);
  };
  return {
    push(v) { value = v; pending = true; if (timer) timers.clear(timer); timer = timers.set(flush, wait); },
    flush,
    hasPending: () => pending,
  };
}
module.exports = { createCommitBuffer };
