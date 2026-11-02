// /src/store/backupBudget.cjs
'use strict';
// Recovery snapshots hold whole copies of earlier workspaces, so a few big restores or imports can push the single
// saved workspace past what Android storage reads back reliably (single rows of about 2 MB fail to load).
// Keep the newest snapshots that fit a budget; the live workspace is never touched.
const SOFT_LIMIT = 1.5 * 1024 * 1024; // drop oldest snapshots above this, but always keep the newest one
const HARD_LIMIT = 1.9 * 1024 * 1024; // above this even the newest snapshot goes: a workspace that cannot be loaded helps nobody

const sizeOf = (value) => JSON.stringify(value).length;
// Snapshots are never edited, so measure each one once instead of on every save.
const sizeCache = new WeakMap();
const snapshotSize = (snap) => { let n = sizeCache.get(snap); if (n === undefined) { n = sizeOf(snap); sizeCache.set(snap, n); } return n; };

// Returns { workspace, trimmed }. `trimmed` is true when snapshots were dropped because of the budget.
function fitBackups(workspace, soft = SOFT_LIMIT, hard = HARD_LIMIT) {
  const list = Array.isArray(workspace && workspace.backups) ? workspace.backups : [];
  if (!list.length) return { workspace, trimmed: false };
  const base = sizeOf({ ...workspace, backups: [] });
  const sizes = list.map((x) => (x && typeof x === 'object' ? snapshotSize(x) : sizeOf(x)));
  // Snapshots are stored newest first, so the oldest are at the end.
  let keep = list.length;
  let total = base + sizes.reduce((a, b) => a + b + 1, 0);
  while (total > soft && keep > 1) { keep -= 1; total -= sizes[keep] + 1; }
  if (total > hard && keep === 1) { keep = 0; }
  if (keep === list.length) return { workspace, trimmed: false };
  return { workspace: { ...workspace, backups: list.slice(0, keep) }, trimmed: true };
}

module.exports = { fitBackups, SOFT_LIMIT, HARD_LIMIT };
