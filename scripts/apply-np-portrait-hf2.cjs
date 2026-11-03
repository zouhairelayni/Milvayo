'use strict';
// Niyarvo Projects v0.5.31-DESKTOP-HF1: narrow Web viewports should use the desktop shell.
// This deliberately patches the installed sources in place, rather than replacing newer versions.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const layoutPath = path.join(root, 'src/ui/layoutMode.cjs');
const storePath = path.join(root, 'src/store/store.js');

try {
  if (!fs.existsSync(layoutPath) || !fs.existsSync(storePath)) {
    throw Error('Requires Niyarvo Projects v0.5.31-DESKTOP-HF1 with src/ui/layoutMode.cjs and src/store/store.js. No files changed.');
  }
  const previousLayout = fs.readFileSync(layoutPath, 'utf8');
  const previousStore = fs.readFileSync(storePath, 'utf8');
  if (!previousLayout.includes('isDesktopLayout')) throw Error('Desktop layout selector not found. No files changed.');
  const oldStoreImport = "import { T } from '../ui/ui';";
  const newStoreImport = "import { T } from '../ui/uiBase';";
  if (!previousStore.includes(oldStoreImport) && !previousStore.includes(newStoreImport)) {
    throw Error('Store UI import does not match supported versions. No files changed.');
  }
  const thresholdMatches = previousLayout.match(/\b700\b/g) || [];
  if (thresholdMatches.length > 2) throw Error('Unexpected desktop breakpoint format. No files changed.');
  if (!thresholdMatches.length && !/\b320\b/.test(previousLayout)) {
    throw Error('Web breakpoint 700 not found. No files changed.');
  }
  const nextLayout = previousLayout.replace(/\b700\b/g, '320');
  const nextStore = previousStore.replace(oldStoreImport, newStoreImport);
  if (nextLayout === previousLayout && nextStore === previousStore) {
    console.log('Already applied: portrait desktop and circular-import fix.');
    process.exit(0);
  }
  // Nothing touches project data, app preferences, dependencies, or Git state.
  fs.writeFileSync(layoutPath, nextLayout);
  fs.writeFileSync(storePath, nextStore);
  try {
    delete require.cache[require.resolve(layoutPath)];
    const { isDesktopLayout } = require(layoutPath);
    if (typeof isDesktopLayout !== 'function'
      || !isDesktopLayout(390, 'web', 'auto')
      || !isDesktopLayout(768, 'web', 'auto')
      || isDesktopLayout(390, 'android', 'auto')) {
      throw Error('Responsive selection did not pass portrait/native checks.');
    }
  } catch (err) {
    fs.writeFileSync(layoutPath, previousLayout);
    fs.writeFileSync(storePath, previousStore);
    throw Error(`Validation failed; source restored. ${err.message}`);
  }
  console.log('Applied NP portrait hotfix: Web desktop at >=320 CSS px; Android native breakpoint unchanged.');
  console.log('Broke the store -> ui -> uiLayout -> InlineNotice -> store require cycle.');
  console.log('Restart Metro: npx expo start --clear');
} catch (err) {
  console.error(`NP portrait hotfix not applied: ${err.message}`);
  process.exitCode = 1;
}
