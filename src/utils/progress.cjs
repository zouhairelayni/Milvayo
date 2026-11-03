// /src/utils/progress.cjs
'use strict';
// The one "progress" formula (0..1): Done counts 100, others count their own %, milestones are skipped.
// shortcut: parent tasks count as well as their children, switch to leaf tasks only if parents stop mirroring their children.
const progressOf = (list) => {
  const real = (list || []).filter((t) => !t.milestone);
  if (!real.length) return 0;
  return real.reduce((sum, t) => sum + (t.status === 'Done' ? 100 : Number(t.progress) || 0), 0) / real.length / 100;
};
module.exports = { progressOf };
