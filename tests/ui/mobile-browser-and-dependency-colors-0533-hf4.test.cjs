// /tests/ui/mobile-browser-and-dependency-colors-0533-hf4.test.cjs
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const layoutSource = fs.readFileSync(path.join(root, 'src/ui/layoutMode.cjs'), 'utf8');
const timelineSource = fs.readFileSync(path.join(root, 'src/screens/timeline/Timeline.js'), 'utf8');
function loadLayout(navigator, window) {
  const module = { exports: {} };
  vm.runInNewContext(layoutSource, {module, exports: module.exports, navigator, window}, {filename:'layoutMode.cjs'});
  return module.exports.isDesktopLayout;
}
test('Android browser mobile UI is default in portrait and landscape', () => {
  const mode = loadLayout({userAgentData:{mobile:true},userAgent:'Mozilla/5.0 (Linux; Android 15; Mobile)'});
  for(const w of [320,360,390,430,700,800]) assert.equal(mode(w, 'web', 'auto'), false, `mobile at ${w}px`);
  assert.equal(mode(390,'android','auto'),false);
});
test('request desktop site and browser desktop UA select desktop Web even at narrow widths', () => {
  const hinted = loadLayout({userAgentData:{mobile:false},userAgent:'Mozilla/5.0 (Linux; Android 15; Mobile)'});
  const desktop = loadLayout({userAgent:'Mozilla/5.0 (X11; Linux x86_64) Chrome/130'});
  for(const mode of [hinted, desktop]) {
    assert.equal(mode(390,'web','auto'),true);
    assert.equal(mode(768,'web','auto'),true);
    assert.equal(mode(390,'android','auto'),false);
  }
});
test('Desktop site with a widened CSS viewport works even when the mobile UA persists', () => {
  const mode = loadLayout({userAgentData:{mobile:true},userAgent:'Mozilla/5.0 (Linux; Android 15; Mobile)'},{screen:{width:390},innerWidth:980});
  assert.equal(mode(980,'web','auto'),true);
});
test('Android mobile UA fallback works when UA Client Hints are not supported', () => {
  const mode = loadLayout({userAgent:'Mozilla/5.0 (Linux; Android 15; SM-G998B) AppleWebKit/537.36 Mobile Safari/537.36'});
  assert.equal(mode(390,'web','auto'),false);
  assert.equal(mode(390,'web','desktop'),true);
});
test('critical path and original link routing are retained while dependency links regain stable colors', () => {
  assert.match(timelineSource,/NP533_COLORED_DEPENDENCIES/);
  assert.match(timelineSource,/NP533_DEP_COLORS/);
  assert.match(timelineSource,/np533DependencyColor\(l\)/);
  assert.match(timelineSource,/PRIORITY_COLOR\.Critical/);
  assert.match(timelineSource,/roundPath\(pts\)/);
  assert.match(timelineSource,/viewport\.svgViewBox/);
});
