// /tests/gestures/native-worklets-hotfix.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', '..', file), 'utf8');

// The v0.4.3 regression was caught on Expo Go: Timeline's Platform reference
// threw during render, and capturing a whole gesture controller inside a
// worklet made Reanimated try to serialize WorkletEventHandler instances.
test('Timeline imports Platform used by TaskBar; no mock geometry changed', () => {
  const src = read('src/screens/timeline/Timeline.js');
  assert.match(src, /import\s*\{[^}]*\bPlatform\b[^}]*\}\s*from\s*['"]react-native['"]/);
  // 0.5.15: bars no longer slide on the UI thread; every drag previews dates so dependency lines stay attached (as on web).
  assert.doesNotMatch(src, /animate=\{Platform\.OS !== 'web'\}/);
  assert.match(src, /L\.onPreview\(L\.t\.id, p\.start, p\.due\);/);
  assert.match(src, /const ROW = 54;/);
  assert.match(src, /const BAR_H = 26;/);
});

test('native animated styles close over shared values, never a gesture controller', () => {
  const src = read('src/gestures/gestureSurface.native.js');
  assert.match(src, /const translateX = drag\.x;/);
  assert.match(src, /const translateY = drag\.y;/);
  assert.match(src, /const gesture = drag\.gesture;/);
  const styles = [...src.matchAll(/useAnimatedStyle\(\(\) => \(\{([\s\S]*?)\}\)\)/g)];
  assert.equal(styles.length, 2);
  for (const [, worklet] of styles) {
    assert.doesNotMatch(worklet, /\bdrag\b|\bgesture\b/);
    assert.match(worklet, /translateX\.value/);
    assert.match(worklet, /translateY\.value/);
  }
  assert.match(src, /<VirtualGestureDetector gesture=\{gesture\}>/);
  assert.match(read('src/gestures/TimelineGestureHost.native.js'), /InterceptingGestureDetector/); // 0.5.15: scoped to Timeline, not the app root
  assert.match(src, /withTiming\(shift, \{ duration: 140 \}\)/);
});

test('Android/iOS retain native UI-thread movement; original web implementation unaffected', () => {
  const native = read('src/gestures/gesture.native.js');
  assert.match(native, /usePanGesture\(/);
  assert.match(native, /scheduleOnRN\(finish/);
  assert.doesNotMatch(native, /PanResponder/);
  assert.match(read('src/gestures/gestureSurface.web.js'), /drag\.offset\.getTranslateTransform/);
  const manifest = require('node:path').join(__dirname,'../../package.json');
  // The local Termux manifest is preserved outside this ZIP; if present it must
  // still declare the platform animation modules and be compatible with Expo.
  if(require('node:fs').existsSync(manifest)){
    const deps=JSON.parse(require('node:fs').readFileSync(manifest,'utf8')).dependencies||{};
    for(const name of ['react-native-reanimated','react-native-worklets','react-native-gesture-handler'])assert.ok(deps[name],name);
  }
});
