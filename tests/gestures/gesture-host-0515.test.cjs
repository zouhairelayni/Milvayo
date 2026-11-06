// /tests/gestures/gesture-host-0515.test.cjs
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..', '..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');

test('the app root is only the gesture-handler root: nothing there can change identity and remount the app',()=>{
 const src=read('src/app/AppGestureRoot.native.js');
 assert.match(src,/GestureHandlerRootView/);
 assert.equal(/InterceptingGestureDetector|VirtualGestureDetector|useHoldDrag|Warmup|warm/.test(src),false);
});

test('no recovery layers mask a remount; a tripwire reports it instead',()=>{
 const app=read('src/app/ModernApp.js'),store=read('src/store/store.js');
 assert.equal(fs.existsSync(path.join(root,'src/navigationMemory.cjs')),false);
 assert.equal(/navigationMemory|restored\.current/.test(app),false);
 assert.equal(/memoryWorkspace/.test(store),false);
 assert.match(app,/UNEXPECTED SHELL REMOUNT/);
 assert.match(app,/useState\('overview'\)/,'a cold start opens Overview');
});
test('library guard: RNGH still derives the intercepting detector mode from its gesture prop',{skip:!fs.existsSync(path.join(root,'node_modules/react-native-gesture-handler/src/v3/detectors/VirtualDetector/InterceptingGestureDetector.tsx'))},()=>{
 const lib=path.join(root,'node_modules/react-native-gesture-handler/src/v3/detectors/VirtualDetector/');
 const det=fs.readFileSync(path.join(lib,'InterceptingGestureDetector.tsx'),'utf8');
 // If an upgrade changes either line, the seed no longer prevents the remount and this fails loudly.
 assert.match(det,/useState<InterceptingDetectorMode>\(\s*gesture\?\.config\.shouldUseReanimatedDetector\s*\?\s*InterceptingDetectorMode\.REANIMATED/);
 assert.match(det,/dispatchesAnimatedEvents\s*\?\s*AnimatedNativeDetector\s*:\s*shouldUseReanimatedDetector\s*\?\s*ReanimatedNativeDetector\s*:\s*HostGestureDetector/);
 const virt=fs.readFileSync(path.join(lib,'VirtualDetector.tsx'),'utf8');
 assert.match(virt,/setMode\(InterceptingDetectorMode\.REANIMATED\)/);
 const cfg=fs.readFileSync(path.join(root,'node_modules/react-native-gesture-handler/src/v3/hooks/utils/reanimatedUtils.ts'),'utf8');
 assert.match(cfg,/typeof value === 'function' && '__workletHash' in value/,'a worklet callback is what flips the mode');
});
