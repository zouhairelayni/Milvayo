# Niyarvo Projects v0.4.3 — Android/iOS and web acceptance

**Status:** Source QA only. Expo Go runtime has not been tested in the build environment.

## Before beginning

1. Export a full workspace backup from the previous working release; create a Git checkpoint.
2. In `~/NiyarvoProjects`, extract `NiyarvoProjects-v0.4.3-NATIVE-MOTION-QA.zip` over the project root.
3. Run `npm install`, `npx expo install --check`, `npm test`, then `npx expo start --clear`.
4. Keep `MockDesign.zip` open as the spacing, typography, proportions and rhythm reference.

## Mobile acceptance

- [ ] App starts and can switch tabs without freezing or Android closing Expo Go.
- [ ] Modern task sheet uses compact inline dropdowns, each label/current value visible.
- [ ] Expanded inline editor doesn't clip input fields or overlap the keyboard.
- [ ] Task sheet title/footer respect Android/iOS safe areas; no needless blank inset.
- [ ] Board/list creation, board switching, list rename and board management work.
- [ ] Long-press card → drag within or across lists → stored after app restart.
- [ ] Long-press list header → rearrange → stored after app restart.
- [ ] A quick tap opens the task; double-tapping the list/card title edits it.
- [ ] Swiping to scroll does **not** accidentally start a drag.
- [ ] Open Timeline repeatedly without memory spikes or native process exit.
- [ ] Navigate 28-day increments; only overlapping tasks show in date window.
- [ ] Page visible rows; unscheduled tasks remain accessible.
- [ ] Drag timeline bar to move, resize ends, create and remove dependencies.
- [ ] Dependency cycles remain blocked.
- [ ] Compare paddings/gaps/card heights/radii with `MockDesign.zip` (light and dark themes).
- [ ] Return to the project after force-close; no task IDs, comments, custom fields or acceptance evidence lost.

## Web acceptance

- [ ] Board/card/list drag-and-drop still works with mouse and touch input.
- [ ] Timeline horizontal scrolling and dependency drag still work.
- [ ] Task sheet inline editors fit narrow browser widths.
- [ ] Desktop sidebar and project drawer spacing match the reference design.

## If Expo Go exits

Keep the Termux Metro terminal open and capture messages. A deprecation warning by itself is not proof of an exception. For more context on Android (if `adb` is available):

```bash
adb logcat -c
# Reproduce the Timeline exit in Expo Go.
adb logcat -d -v time | grep -Ei 'FATAL EXCEPTION|AndroidRuntime|ReactNativeJS|libreanimated|libgesturehandler|SIGSEGV|OutOfMemoryError' | tail -100
```

If `adb` isn't available on the phone, capture the Expo Go crash report / Android bug report and the Termux Metro output instead. Do **not** infer a crash cause from `SafeAreaView` deprecation alone.

**Pass criterion:** All major interactions run without process exits and work is preserved after restart. A green Node test suite alone does not satisfy acceptance.
