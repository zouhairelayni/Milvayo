// /tests/app/version-sync.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { synchronize } = require('../../scripts/sync-version.cjs');

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'milvayo-version-'));
  const create = (file, value) => {
    const out = path.join(root, file);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n');
  };
  create('package.json', { name: 'milvayo', version: '0.8.21' });
  create('package-lock.json', { name: 'milvayo', version: '0.8.20', lockfileVersion: 3, packages: { '': { name: 'milvayo', version: '0.8.10', dependencies: { a: '^1' } }, 'node_modules/a': { version: '1.2.3' } } });
  create('app.json', { expo: { version: '0.8.10', android: { versionCode: 100 }, ios: { buildNumber: '100' }, extra: { untouched: true } } });
  create('src/cloud/server/package.json', { name: 'milvayo-local-functions', version: '0.8.10', dependencies: { 'firebase-admin': '14.5.0' } });
  create('docs/changelog/CHANGELOG.md', '## v0.8.20 — Existing release\n\n- Preserved.\n');
  return { root, create, read: file => fs.readFileSync(path.join(root, file), 'utf8'), cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}

test('updating only package.json synchronizes lock, Expo, Functions manifest and draft release heading', () => {
  const f = fixture();
  try {
    const result = synchronize(f.root);
    assert.equal(result.version, '0.8.21');
    const lock = JSON.parse(f.read('package-lock.json'));
    assert.equal(lock.version, '0.8.21');
    assert.equal(lock.packages[''].version, '0.8.21');
    assert.equal(lock.packages['node_modules/a'].version, '1.2.3');
    const expo = JSON.parse(f.read('app.json')).expo;
    assert.equal(expo.version, '0.8.21');
    assert.equal(expo.android.versionCode, 100);
    assert.equal(expo.ios.buildNumber, '100');
    assert.equal(expo.extra.untouched, true);
    const server = JSON.parse(f.read('src/cloud/server/package.json'));
    assert.equal(server.version, '0.8.21');
    assert.deepEqual(server.dependencies, { 'firebase-admin': '14.5.0' });
    assert.match(f.read('docs/changelog/CHANGELOG.md'), /^## v0\.8\.21 — Draft/);
    assert.match(f.read('docs/changelog/CHANGELOG.md'), /## v0\.8\.20 — Existing release/);
  } finally { f.cleanup(); }
});

test('repeat runs change zero bytes and do not duplicate changelog headings', () => {
  const f = fixture();
  try {
    synchronize(f.root);
    const files = ['package-lock.json', 'app.json', 'src/cloud/server/package.json', 'docs/changelog/CHANGELOG.md'];
    const before = files.map(f.read);
    assert.deepEqual(synchronize(f.root).updated, []);
    assert.deepEqual(files.map(f.read), before);
    assert.equal(f.read('docs/changelog/CHANGELOG.md').match(/^## v0\.8\.21\b/gm).length, 1);
  } finally { f.cleanup(); }
});

test('invalid package version and malformed manifests fail without partially editing anything', () => {
  const f = fixture();
  try {
    const originals = ['package-lock.json', 'app.json', 'src/cloud/server/package.json', 'docs/changelog/CHANGELOG.md'];
    const before = originals.map(f.read);
    f.create('package.json', { name: 'milvayo', version: '0.8.21-invalid' });
    assert.throws(() => synchronize(f.root), /simple major\.minor\.patch/);
    assert.deepEqual(originals.map(f.read), before);
    f.create('package.json', { name: 'milvayo', version: '0.8.21' });
    f.create('app.json', '{ invalid JSON');
    assert.throws(() => synchronize(f.root), /Invalid JSON in app\.json/);
    assert.deepEqual(['package-lock.json', 'src/cloud/server/package.json', 'docs/changelog/CHANGELOG.md'].map(f.read), [before[0], before[2], before[3]]);
  } finally { f.cleanup(); }
});

test('changing only package.json again moves forward without rewriting historical notes', () => {
  const f = fixture();
  try {
    synchronize(f.root);
    const first = f.read('docs/changelog/CHANGELOG.md');
    f.create('package.json', { name: 'milvayo', version: '0.8.22' });
    synchronize(f.root);
    assert.match(f.read('docs/changelog/CHANGELOG.md'), /^## v0\.8\.22 — Draft/);
    assert.ok(f.read('docs/changelog/CHANGELOG.md').endsWith(first));
  } finally { f.cleanup(); }
});

test('normal npm lifecycle hooks synchronize versions before tests and builds', () => {
  const pkg = require('../../package.json');
  for (const key of ['postinstall', 'pretest', 'prestart', 'preweb', 'prebuild:web', 'pretest:cloud', 'pretest:cloud:running', 'predeploy:hosting']) {
    assert.equal(pkg.scripts[key], 'node scripts/sync-version.cjs', key);
  }
});
