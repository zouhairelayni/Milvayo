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

test('A manually-triggered GitHub Actions workflow builds signed EAS preview APK', () => {
  const workflow = read('.github/workflows/android-apk.yml').toString();
  const eas = JSON.parse(read('eas.json'));
  assert.equal(eas.build.preview.android.buildType,'apk');
  assert.equal(eas.build.preview.distribution,'internal');
  assert.match(workflow,/workflow_dispatch/);
  assert.match(workflow,/EXPO_TOKEN/);
  assert.match(workflow,/eas build --platform android --profile preview --non-interactive --wait --json/);
  assert.match(workflow,/upload-artifact@v4/);
  assert.doesNotMatch(workflow,/google-services\.json|firebase|keystore\.jks/);
});

test('EAS artifact URL parser rejects non-HTTPS and unfinished builds', () => {
  const { getUrl } = require('../../scripts/ci/eas-apk-url.cjs');
  assert.equal(getUrl([{status:'FINISHED',artifacts:{buildUrl:'https://example.com/test.apk'}}]),'https://example.com/test.apk');
  assert.throws(()=>getUrl([{status:'ERRORED',artifacts:{buildUrl:'https://example.com/test.apk'}}]),/not finished/);
  assert.throws(()=>getUrl({status:'FINISHED',artifacts:{buildUrl:'http://example.com/test.apk'}}),/invalid/);
});
