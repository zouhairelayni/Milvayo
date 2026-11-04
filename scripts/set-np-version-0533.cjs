// /scripts/set-np-version-0533.cjs
'use strict';
// Synchronize application and npm manifest versions without reinstalling or changing dependency resolutions.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const targets = ['package.json', 'package-lock.json', 'app.json'];
try {
  const data = Object.fromEntries(targets.map(file => [file, JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))]));
  if (!data['app.json'].expo || !data['package-lock.json'].packages?.['']) {
    throw Error('Missing app.json expo object or package-lock.json root package; versions not changed.');
  }
  const version = '0.5.33';
  data['app.json'].expo.version = version;
  data['package.json'].version = version;
  data['package-lock.json'].version = version;
  data['package-lock.json'].packages[''].version = version;
  // Validate everything in memory first. No dependencies or npm scripts are executed.
  const original = Object.fromEntries(targets.map(file => [file, fs.readFileSync(path.join(root, file), 'utf8')]));
  const changed = targets.filter(file => JSON.stringify(data[file]) !== JSON.stringify(JSON.parse(original[file])));
  const written = [];
  try {
    for (const file of changed) {
      const p = path.join(root, file);
      fs.writeFileSync(p + '.np533tmp', JSON.stringify(data[file], null, 2) + '\n');
      fs.renameSync(p + '.np533tmp', p);
      written.push(file);
    }
  } catch (err) {
    for (const file of written) fs.writeFileSync(path.join(root, file), original[file]);
    for (const file of changed) { try { fs.unlinkSync(path.join(root, file) + '.np533tmp'); } catch {} }
    throw err;
  }
  console.log('Version synchronized to 0.5.33: package.json, package-lock.json (including root package), app.json.');
} catch (e) { console.error(`Version update aborted: ${e.message}`); process.exitCode = 1; }
