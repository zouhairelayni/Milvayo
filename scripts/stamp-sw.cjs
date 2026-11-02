// /scripts/stamp-sw.cjs
'use strict';
// Puts the app.json version into the built service worker's cache name. Usage: node scripts/stamp-sw.cjs dist
const fs = require('node:fs');
const path = require('node:path');

function stamp(dir, version = require('../app.json').expo.version) {
  const file = path.join(dir, 'service-worker.js');
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes('__APP_VERSION__')) throw new Error(`No __APP_VERSION__ placeholder in ${file}`);
  fs.writeFileSync(file, text.split('__APP_VERSION__').join(version));
  return version;
}

if (require.main === module) console.log(`Service worker cache stamped with ${stamp(process.argv[2] || 'dist')}`);
module.exports = { stamp };
