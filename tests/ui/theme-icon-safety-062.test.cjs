// /tests/ui/theme-icon-safety-062.test.cjs
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load } = require('../helpers/diagram-harness.cjs');
function controller(plugin, os = 'android') {
  return load('src/ui/theme/launcherIcon.native.js', {
    'react-native': { Platform: { OS: os } },
    'expo-alternate-app-icons': plugin,
  }).syncLauncherIcon;
}
test('explicit Android icon apply reconciles aliases even when the selected icon already matches', async () => {
  const calls = [];
  const apply = controller({ supportsAlternateIcons: true, getAppIconName: () => 'CoralLight', setAlternateAppIcon: async name => calls.push(name) });
  assert.equal(await apply('Coral', 'light'), true);
  assert.deepEqual(calls, ['CoralLight']);
});
test('rapid icon requests coalesce and primary restoration uses null', async () => {
  const calls = [];
  const apply = controller({ supportsAlternateIcons: true, getAppIconName: () => 'CoralLight', setAlternateAppIcon: async name => calls.push(name) });
  await Promise.all([apply('Aqua', 'light'), apply('Coral', 'dark')]);
  assert.deepEqual(calls, [null]);
});
test('unsupported native icon switching leaves the app usable', async () => {
  assert.equal(await controller({ supportsAlternateIcons: false })('Coral', 'light'), false);
  assert.equal(await controller({ supportsAlternateIcons: true, getAppIconName() { throw Error('native unavailable'); } })('Coral', 'light'), false);
});
test('native theme changes do not toggle launcher components automatically', () => {
  const theme = fs.readFileSync('src/ui/theme/theme.js', 'utf8');
  assert.doesNotMatch(theme, /setTimeout\(\(\) => \{ syncLauncherIcon/);
  assert.match(theme, /Platform.OS === 'web'[\s\S]*syncLauncherIcon/);
  const settings = fs.readFileSync('src/screens/workspace/Workspace.js', 'utf8');
  assert.match(settings, /Alert.alert\('Apply launcher icon\?'/);
  assert.equal(require('../../package.json').dependencies['expo-system-ui'], '~58.0.7');
  assert.ok(require('../../app.json').expo.plugins.includes('./src/platform/plugins/withSafeAlternateIcons.cjs'));
});

test('launcher changes await durable data and fail closed when saving fails', async () => {
  const calls = [];
  const apply = controller({ supportsAlternateIcons: true, getAppIconName: () => null, setAlternateAppIcon: async () => calls.push('icon') });
  assert.equal(await apply('Coral', 'light', async () => false), false);
  assert.equal(await apply('Coral', 'light', async () => { throw Error('disk full'); }), false);
  assert.deepEqual(calls, []);
  assert.equal(await apply('Coral', 'light', async () => { calls.push('save'); return true; }), true);
  assert.deepEqual(calls, ['save', 'icon']);
});
