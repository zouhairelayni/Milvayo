// /tests/helpers/ui-source.cjs
// Source text of the shared UI: src/ui/ui.js is now a re-export file; the code lives in the files below
// (refactor batch 02). Source-level tests that look for UI code read this instead of ui.js alone.
const fs = require('fs');
const path = require('path');
module.exports = function uiSource() {
  return ['ui.js', 'uiBase.js', 'uiControls.js', 'uiLayout.js', 'downloadText.js']
    .map((f) => fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'ui', f), 'utf8')).join('\n');
};
