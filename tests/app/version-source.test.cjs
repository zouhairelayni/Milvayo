// /tests/app/version-source.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const root = path.join(__dirname, '..', '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const { stamp } = require('../../scripts/stamp-sw.cjs');

test('the app version is read from app.json, not typed into diagnostics', () => {
  const src = read('src/diagnostics/monitor.js');
  assert.match(src, /app\.expo\.version/);
  assert.doesNotMatch(src, /VERSION = '\d/);
});
test('service worker cache name gets the app.json version at build time', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-'));
  fs.copyFileSync(path.join(root, 'public/service-worker.js'), path.join(dir, 'service-worker.js'));
  const version = JSON.parse(read('app.json')).expo.version;
  assert.equal(stamp(dir), version);
  const out = fs.readFileSync(path.join(dir, 'service-worker.js'), 'utf8');
  assert.match(out, new RegExp(`milvayo-assets-${version.replace(/\./g, '\\.')}'`));
  assert.doesNotMatch(out, /__APP_VERSION__/);
  assert.throws(() => stamp(dir), /placeholder/); // stamping twice is refused, not silently wrong
  assert.match(read('package.json'), /expo export[^"]*&& node scripts\/stamp-sw\.cjs dist/);
});
