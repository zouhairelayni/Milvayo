// /tests/helpers/shell-source.cjs
// Source text of the app shell: ModernApp.js plus the files split out of it in refactor batch 02
// (src/shell/*.js). Source-level tests that look for shell code read this instead of ModernApp.js alone.
const fs = require('fs');
const path = require('path');
module.exports = function shellSource() {
  const root = path.join(__dirname, '..', '..');
  const parts = [path.join(root, 'src/app/ModernApp.js')];
  const dir = path.join(root, 'src', 'components', 'shell');
  for (const f of ['Bars.js', 'Menus.js', 'ScreenErrorBoundary.js']) parts.push(path.join(dir, f));
  return parts.map((p) => fs.readFileSync(p, 'utf8')).join('\n');
};
