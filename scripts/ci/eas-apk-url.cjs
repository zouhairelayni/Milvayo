// /scripts/ci/eas-apk-url.cjs
'use strict';
// Extract a successful EAS Android APK URL without printing it to GitHub Actions logs.
const fs = require('node:fs');

function getUrl(payload) {
  const builds = Array.isArray(payload) ? payload : [payload];
  const build = builds.find(item => item && typeof item === 'object' && (item.artifacts?.buildUrl || item.artifacts?.applicationArchiveUrl || item.applicationArchiveUrl));
  if (!build) throw new Error('EAS returned no downloadable build artifact.');
  if (build.status && !['FINISHED','finished'].includes(build.status)) throw new Error(`EAS build not finished: ${build.status}`);
  const url = build.artifacts?.buildUrl || build.artifacts?.applicationArchiveUrl || build.applicationArchiveUrl;
  if (!/^https:\/\//.test(url)) throw new Error('EAS returned an invalid APK URL.');
  return url;
}
if (require.main === module) {
  try { console.log(getUrl(JSON.parse(fs.readFileSync(process.argv[2], 'utf8')))); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { getUrl };
