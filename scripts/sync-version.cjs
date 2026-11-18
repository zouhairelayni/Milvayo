// /scripts/sync-version.cjs
'use strict';
// Single source: package.json version. Sync dependent metadata before tests/builds.
// No network, npm invocation, dependency changes, or native build-number changes.
const fs = require('node:fs');
const path = require('node:path');

const relativeFiles = {
  package: 'package.json',
  lock: 'package-lock.json',
  expo: 'app.json',
  server: 'src/cloud/server/package.json',
  changelog: 'docs/changelog/CHANGELOG.md',
};

function synchronize(root = path.resolve(__dirname, '..'), log = () => {}) {
  const originals = {};
  const data = {};
  for (const [key, file] of Object.entries(relativeFiles)) {
    const absolute = path.join(root, file);
    originals[key] = fs.readFileSync(absolute, 'utf8');
    if (key !== 'changelog') {
      try { data[key] = JSON.parse(originals[key]); }
      catch (error) { throw new Error(`Invalid JSON in ${file}: ${error.message}`); }
    }
  }

  const version = data.package.version;
  if (typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error('package.json version must be a simple major.minor.patch string, e.g. 0.8.20');
  }
  if (!data.package.name || data.lock.name !== data.package.name ||
      data.lock.packages?.['']?.name !== data.package.name) {
    throw new Error('Root package name differs from package-lock.json; refusing to edit');
  }
  if (!data.expo?.expo || typeof data.expo.expo.version !== 'string') {
    throw new Error('Missing expo.version in app.json');
  }
  if (typeof data.server.version !== 'string') {
    throw new Error('Missing version in src/cloud/server/package.json');
  }
  if (!Number.isInteger(data.expo.expo.android?.versionCode) ||
      !/^\d+$/.test(String(data.expo.expo.ios?.buildNumber ?? ''))) {
    throw new Error('Android versionCode or iOS buildNumber invalid; no file written');
  }

  const heading = new RegExp('^## v' + version.replace(/\./g, '\\.') + '(?=\\s|$)', 'gm');
  const count = [...originals.changelog.matchAll(heading)].length;
  if (count > 1) throw new Error(`Duplicate changelog headings for v${version}; no file written`);

  // Only the root package and app's displayed version follow package.json.
  // Platform build identifiers are independent monotonic counters.
  data.lock.version = version;
  data.lock.packages[''].version = version;
  data.expo.expo.version = version;
  data.server.version = version;

  let changelog = originals.changelog;
  if (count === 0) {
    changelog = `## v${version} — Draft (version synchronized automatically)\n\n` +
      '- Release notes pending. This draft does not certify or deploy a release.\n\n' +
      changelog;
  }

  const output = {
    lock: JSON.stringify(data.lock, null, 2) + '\n',
    expo: JSON.stringify(data.expo, null, 2) + '\n',
    server: JSON.stringify(data.server, null, 2) + '\n',
    changelog,
  };

  const updates = Object.keys(output).filter(key => output[key] !== originals[key]);
  // All validation happens before writes; restore prior contents if a write fails.
  const written = [];
  try {
    for (const key of updates) {
      fs.writeFileSync(path.join(root, relativeFiles[key]), output[key]);
      written.push(key);
    }
  } catch (error) {
    for (const key of written.reverse()) {
      fs.writeFileSync(path.join(root, relativeFiles[key]), originals[key]);
    }
    throw error;
  }

  if (updates.length) log(`[version-sync] ${version}: updated ${updates.map(k => relativeFiles[k]).join(', ')}`);
  else log(`[version-sync] ${version}: already synchronized`);
  return { version, updated: updates.map(key => relativeFiles[key]) };
}

if (require.main === module) {
  try { synchronize(path.resolve(__dirname, '..'), console.log); }
  catch (error) { console.error('[version-sync]', error.message); process.exitCode = 1; }
}

module.exports = { synchronize };
