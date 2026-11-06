// /src/platform/plugins/withSafeAlternateIcons.cjs
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { withDangerousMod } = require('@expo/config-plugins');
// Replace only the upstream Android runtime during prebuild; retain its generated assets/aliases and iOS code.
module.exports = config => withDangerousMod(config, ['android', async config => {
  const root = path.dirname(require.resolve('expo-alternate-app-icons/package.json'));
  const target = path.join(root, 'android/src/main/java/expo/modules/alternateappicons/ExpoAlternateAppIconsModule.kt');
  if (!fs.existsSync(target)) throw new Error('Alternate icon Android source moved; review the Milvayo adapter before building.');
  fs.copyFileSync(path.join(__dirname, '../android/AlternateIcons.kt'), target);
  return config;
}]);
