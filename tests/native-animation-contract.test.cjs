const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');

test('SDK 58 native animation versions and shared gesture root are declared', () => {
  // A user's locally fixed package manifest is deliberately excluded from source ZIPs.
  const manifest = require('node:path').join(__dirname,'../package.json');
  // The local Termux manifest is preserved outside this ZIP; if present it must
  // still declare the platform animation modules and be compatible with Expo.
  if(require('node:fs').existsSync(manifest)){
    const deps=JSON.parse(require('node:fs').readFileSync(manifest,'utf8')).dependencies||{};
    for(const name of ['react-native-reanimated','react-native-worklets','react-native-gesture-handler'])assert.ok(deps[name],name);
  }
  assert.match(read('src/AppGestureRoot.native.js'), /GestureHandlerRootView/);
});
test('Android and iOS use worklet gestures and UI-thread shared translation', () => {
  const g = read('src/gesture.native.js');
  const s = read('src/gestureSurface.native.js');
  assert.match(g, /usePanGesture\(/);
  assert.match(g, /useCompetingGestures\(/);
  assert.match(g, /activateAfterLongPress/);
  assert.match(g, /scheduleOnRN\(finish/);
  assert.doesNotMatch(g, /PanResponder|setInterval/);
  assert.match(s, /VirtualGestureDetector/);
  assert.match(read('src/AppGestureRoot.native.js'), /InterceptingGestureDetector/);
  assert.match(s, /useAnimatedStyle/);
  assert.match(s, /withTiming/);
});
test('web retains original mock drag behavior, task sheet is inline', () => {
  assert.match(read('src/gesture.js'), /PanResponder/);
  assert.match(read('src/gestureSurface.web.js'), /drag\.offset\.getTranslateTransform/);
  assert.match(read('src/screens/TaskSheet.js'), /InlineEditor expanded=\{expanded\}/);
  assert.match(read('src/InlineEditor.native.js'), /LinearTransition/);
  assert.match(read('src/DrawerMotion.native.js'), /useSharedValue/);
});
test('native drag and timeline reuse original card and grid spacing', () => {
  const board = read('src/screens/Board.js');
  const time = read('src/screens/Timeline.js');
  assert.match(board, /COL_WIDE = 290/);
  assert.match(board, /COL_NARROW = 272/);
  assert.match(board, /GAP = 12/);
  assert.match(board, /BoardMotion/);
  assert.match(board, /from '\.\.\/boardGesture'/);
  assert.doesNotMatch(board, /DragMotion|GestureArea|gestureSurface/);
  assert.match(time, /const ROW = 54/);
  assert.match(time, /const BAR_H = 26/);
  assert.match(time, /const SPAN = display\.BASE_DAYS/);
  assert.match(time, /display\.paintedRange/);
  assert.match(time, /paintedRows\.map/);
});
