// /tests/app/board-launcher-apk-059.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', '..');
const read = p => fs.readFileSync(path.join(root, p));
const app = JSON.parse(read('app.json'));
const manifest = JSON.parse(read('public/manifest.json'));
const colors = ['aqua','mint','lime','amber','orange','coral','pink','fuchsia','violet','indigo'];

function dimensions(file) {
  const png = read(file);
  assert.equal(png.subarray(1, 4).toString(), 'PNG', file);
  return [png.readUInt32BE(16),png.readUInt32BE(20)];
}

test('Coral Board with six actual card windows is the launcher default across platforms', () => {
  assert.equal(app.expo.icon, './assets/icon.png');
  assert.equal(app.expo.ios.icon,'./assets/icon.png');
  assert.equal(app.expo.android.adaptiveIcon.backgroundColor,'#071328');
  assert.deepEqual(dimensions('assets/icon.png'),[1024,1024]);
  assert.deepEqual(dimensions('assets/adaptive-icon.png'),[1024,1024]);
  assert.deepEqual(dimensions('assets/adaptive-monochrome.png'),[1024,1024]);
  assert.deepEqual(dimensions('public/icons/icon-192.png'),[192,192]);
  assert.deepEqual(dimensions('public/icons/icon-512.png'),[512,512]);
  assert.deepEqual(dimensions('public/icons/icon-maskable-512.png'),[512,512]);
  assert.deepEqual(manifest.icons.map(i=>i.purpose),['any','any','maskable']);
  assert.equal(require('../../src/ui/theme/themePalette.cjs').DEFAULT_ACCENT,'Coral');
});

test('All ten Board colorway resources exist and browser favicon follows selected accent', () => {
  for (const name of colors) {
    assert.deepEqual(dimensions(`assets/app-icons/${name}.png`),[1024,1024]);
    assert.deepEqual(dimensions(`public/icons/colorways/${name}-64.png`),[64,64]);
  }
  const theme = read('src/ui/theme/theme.js').toString();
  assert.match(theme,/\[accentPref\]/);
  assert.match(theme,/icons\/colorways\/\$\{accentPref\.toLowerCase\(\)\}-64\.png/);
});

test('GitHub workflow builds signed ARM64 APK locally, without EAS cloud', () => {
  const workflow = read('.github/workflows/android-apk.yml').toString();
  assert.match(workflow,/workflow_dispatch/);
  assert.match(workflow,/npm ci --legacy-peer-deps/);
  assert.match(workflow,/expo prebuild --platform android --clean --no-install/);
  assert.match(workflow,/:app:assembleRelease -PreactNativeArchitectures=arm64-v8a/);
  assert.match(workflow,/MILVAYO_ANDROID_KEYSTORE_BASE64/);
  assert.match(workflow,/MILVAYO_ANDROID_KEYSTORE_PASSWORD/);
  assert.match(workflow,/apksigner/);
  assert.match(workflow,/upload-artifact@v4/);
  assert.doesNotMatch(workflow,/eas build|EXPO_TOKEN|expo-github-action@/);
  assert.match(read('.gitignore').toString(),/^credentials\.json$/m);
});

test('One-time signing import validates local EAS credential file without uploading when required data is missing', () => {
  const { loadSigningCredentials } = require('../../scripts/ci/upload-android-signing-secrets.cjs');
  const os = require('node:os');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'niyarvo-signing-'));
  try {
    const file = path.join(temp, 'credentials.json');
    fs.writeFileSync(file, JSON.stringify({android:{keystore:{keystorePath:'release.jks',keystorePassword:'test-store-pass',keyAlias:'test-key',keyPassword:'test-key-pass'}}}));
    assert.throws(() => loadSigningCredentials(file),/ENOENT/);
    fs.writeFileSync(path.join(temp,'release.jks'),Buffer.alloc(1200,1));
    const values = loadSigningCredentials(file);
    assert.equal(values.MILVAYO_ANDROID_KEYSTORE_PASSWORD, 'test-store-pass');
    assert.equal(values.MILVAYO_ANDROID_KEY_ALIAS, 'test-key');
    assert.equal(Buffer.from(values.MILVAYO_ANDROID_KEYSTORE_BASE64,'base64').length,1200);
    assert.equal(Object.keys(values).length,4);
  } finally { fs.rmSync(temp, {recursive:true, force:true}); }
});
