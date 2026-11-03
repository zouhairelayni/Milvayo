# CHG-NP-0.5.15 — Root cause of the first-open Timeline→Overview bounce removed (replaces the 0.5.13 mitigations)

## Root cause (verified in source, react-native-gesture-handler 3.3.0)
`src/v3/detectors/VirtualDetector/InterceptingGestureDetector.tsx`:
1. The detector keeps a `mode` state. It starts `DEFAULT` unless its own `gesture` prop says otherwise (`useState(gesture?.config.shouldUseReanimatedDetector ? REANIMATED : …)`).
2. The mode chooses the wrapper component: `HostGestureDetector` (DEFAULT) vs `ReanimatedNativeDetector` (REANIMATED).
3. `VirtualDetector.tsx` calls `setMode(REANIMATED)` in an effect when its gesture has worklet callbacks (`hasWorkletEventHandlers`: a callback carrying `__workletHash`).

So the first Timeline bar mounted under a detector with no gesture flipped the mode, changed the wrapper's element type, and React remounted everything under it. The detector wrapped the entire app, hence: StoreProvider remounted ("Opening local workspace…"), Shell state reset, Overview. Once per launch because the mode never flips back. Web has no such detector. This matches the 0.5.12 trace (`shell unmounted/mounted` with no navigation request, same run ID) and the screen recording.

## Fix
- **`src/TimelineGestureHost.native.js`** (new): an `InterceptingGestureDetector` seeded with an inert gesture (`useTapGesture({ enabled: false, onActivate: () => { 'worklet'; } })`). The seed makes the detector start in REANIMATED mode, so the wrapper type never changes. The seed is disabled and does nothing.
- The detector is scoped to **Timeline** (the only screen using RNGH virtual detectors; Board uses PanResponder) instead of wrapping the app. `TimelineGestureHost.js` is a plain fragment for web/fallback. Detector host views are `display: contents`: no layout change.
- `src/AppGestureRoot.native.js` is now only `GestureHandlerRootView`.
- **Removed**, because they only existed to hide the remount: the root gesture warm-up and its three-frame gate, the navigation memory module, and the in-memory workspace copy in the store.
- **Tripwire added**: Shell must mount once per JS run; a second mount records `UNEXPECTED SHELL REMOUNT #n` in diagnostics (Fast Refresh in development also trips it).
- Version 0.5.15. No dependency, data or visual changes. Retained tabs (0.5.14), progressive Board cards and deferred first mounts (0.5.13) are unchanged.

## Verification
- 446 tests pass with `node_modules` present (445 + 1 skipped without it). With your real `package.json`: 446/446.
- New library guard test (runs when `node_modules` exists): fails loudly if a gesture-handler upgrade changes how the detector derives its mode, the wrapper selection, the `setMode` call, or what counts as a worklet callback.
- Both symbols (`InterceptingGestureDetector`, `useTapGesture`) confirmed as public exports of 3.3.0.
- Not run: any device.

## Risk and rollback
This removes the safety nets added in 0.5.13, on purpose, so a regression is visible instead of hidden. If the bounce returns, diagnostics will show `UNEXPECTED SHELL REMOUNT`; restore v0.5.14 (still has the warm-up and memory layers) and send the trace. The one thing I could not exercise is the seeded disabled gesture on Android. If it threw at startup the app would fail on first Timeline mount, with a red screen naming the gesture.

## Acceptance sequence
1. Fully close Expo Go, reopen, tap Timeline once: it stays on Timeline.
2. Export diagnostics: expect no `UNEXPECTED SHELL REMOUNT` and no `shell unmounted`.
3. On Timeline: hold-drag a bar, drag its left and right edges, drag a dependency link handle; scroll the timeline both ways.
4. Switch away and back (retained page); repeat step 3.

Review direction: no UI change. Unslop standard by Damir Sokolovsky, CC BY 4.0.
