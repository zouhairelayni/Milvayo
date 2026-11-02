// /src/app/navigation/navigationQueue.cjs
// Drain queued tab selections once per frame; only the latest destination mounts.
function createNavigationQueue(schedule, cancel, commit) {
 let handle = null, pending = null;
 const clear = () => { if (handle !== null) cancel(handle); handle = null; pending = null; };
 return {
  request(target) {
   pending = target;
   if (handle !== null) return;
   handle = schedule(() => { handle = null; const target = pending; pending = null; if (target !== null) commit(target); });
  },
  clear,
 };
}
module.exports = {createNavigationQueue};
