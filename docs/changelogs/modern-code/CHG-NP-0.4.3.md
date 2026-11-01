# CHG-NP-0.4.3 — Mock design fidelity, native motion, and timeline hardening

**Product:** Niyarvo Projects (independent application)
**Baseline:** `NiyarvoProjects-v0.4.2-MOCK-DESIGN-INTEGRATED.zip`
**Target:** `v0.4.3` QA candidate (not runtime-accepted)
**Date:** 2026-10-31
**Scope:** Android/iOS gestures, visual fidelity, compact task sheet, timeline resource safety.
**Persistence:** Existing v0.4.1/v0.4.2 workspace format, no migration or automatic deletion.

## 0. Read first

- **Android/iOS:** Reanimated 4.7.1, Worklets 0.13.0 and Gesture Handler ~3.3.0 added as explicit dependencies, matching Expo SDK 58. The gestures use RNGH 3 hooks (`usePanGesture`, `useTapGesture`, `useCompetingGestures`) plus `VirtualGestureDetector` inside `InterceptingGestureDetector` so gesture recognition does not introduce extra card/row layout wrappers.
- **Web:** The mock's existing JS/DOM PanResponder behavior remains intact using platform-specific `.web.js` modules.
- **Task sheet:** Inline property dropdowns (visible label and selected-value summary), instead of displaying all advanced editors at once. Editing expands in the same sheet. Native open/close uses Reanimated layout transitions.
- **Board:** Native card/list long-press drag translation is driven by Reanimated shared values, rather than `Animated.ValueXY`/JS timers. Original column widths, gaps, touch zones, card padding and visual hierarchy remain. Existing guarded persistence (`placeTask`, `moveListTo`, etc.) is kept.
- **Timeline:** Range-based filtering plus row paging (10 on mobile, 22 on wide screens), 56-day painted window, date navigation and clipped task bars. It still persists full ISO dates, task IDs and dependency relations; no date is silently invented for undated tasks. Native bar motion uses UI-thread translation; resizes commit through the existing domain method.
- **Shell:** Native project drawer uses Reanimated opacity/translation instead of JS-frame animation. Root gesture context is native-only, so web does not gain an extra native gesture wrapper.
- **Insets:** Modern task sheet preserves original content spacing (20pt horizontal content padding, 18pt item gap) while applying only the bottom system safe area inside its modal.

## 1. Root cause and findings

1. `SafeAreaView` deprecation warning is informational. It is not sufficient evidence of the Expo Go process exit. Safe-area wrappers in the modern shell are imported from `react-native-safe-area-context`.
2. Earlier timeline migration created significant memory/render pressure through too many rows/gesture handlers and offscreen geometry. This candidate bounds both rows and visible date geometry.
3. v0.4.2 task sheet placed every editor in the full vertical stack. Inline property editors restore the mock's concise rhythm while keeping fields accessible.
4. The proposed native gesture stack MUST use RNGH **3** hooks, not RNGH 2 `Gesture.Pan()` builders. The implementation follows its changed API and virtual detector requirement.

## 2. Modified/added files

- `package.json`, `app.json`, `App.js`, `ModernApp.js`
- `src/gesture.native.js` **new** — native worklet-based gesture recognizer and target callbacks
- `src/gestureSurface.native.js`, `src/gestureSurface.web.js` **new** — layout-neutral drag targets
- `src/AppGestureRoot.native.js`, `src/AppGestureRoot.web.js` **new** — platform-specific root gesture context
- `src/DrawerMotion.native.js`, `src/DrawerMotion.web.js` **new**
- `src/InlineEditor.native.js`, `src/InlineEditor.web.js` **new**
- `src/screens/Board.js`, `src/screens/Timeline.js`, `src/screens/TaskSheet.js`, `src/ui.js`
- `src/timelineWindow.cjs` **new**, range-aware rendering helpers
- `tests/native-animation-contract.test.cjs` **new**
- `tests/modern-design-regression.test.cjs` updated for range paging

Unchanged: the original business/domain modules (`model`, operations, boards, scheduling, history, backup, verification, stored schema), and the original Classic workspace implementation.

## 3. Verification matrix (observed only)

| Gate | Result | Detail |
|---|---|---|
| Node source/domain regression suite | **Passed (336/336)** | Includes workspace/bridge, Kanban, scheduling, release, backup, windowing, native module contracts |
| JavaScript/JSX syntax via TypeScript parser | **Passed** | 37 JS/JSX application files; 0 parser diagnostics |
| ZIP integrity | **Passed** | 228 files; `ZipFile.testzip()` returned no errors |
| Expo npm dependency install | **Not verified** | npm registry DNS inaccessible in this execution environment; run `npm install` in Termux |
| Web/Android Metro bundle | **Not verified** | Package install unavailable here |
| Expo Go Android launch / timeline tab | **Not verified** | Must be tested on the target Android phone |
| iOS runtime / gestures | **Not verified** | Requires a physical device or simulator |
| Native FPS / memory pressure | **Not measured** | Needs in-app profiling; range limiting is a mitigation, not proof of resolution |
| Data persistence across restart | **Not re-verified on device** | Original domain round-trip tests passed; manual device test mandatory |

**Caveats:** Native edge auto-scroll and target selection continue to use the existing JS coordinator; the **animated drag translation** runs on the UI runtime. The source uses the correct RNGH 3 APIs but has not been exercised inside Expo Go in this environment. Do not describe the native crash as definitively fixed until device acceptance.

## 4. Install / QA instructions (Termux)

Back up your existing workspace and Git checkpoint before extraction. Because this ZIP is a root-overlay package, old files that are no longer in the new ZIP may remain in an existing directory.

```bash
cd ~/NiyarvoProjects
unzip -o ~/storage/downloads/NiyarvoProjects-v0.4.3-NATIVE-MOTION-QA.zip -d .
npm install
npx expo install --check
npm test
npx expo start --clear
```

`npm install` is required, not `npm ci`: the baseline lockfile predates the additional native animation packages and must be reconciled when network access is available. Do not install chart packages: the modern chart is hand-drawn with `react-native-svg`.

## 5. Device acceptance checklist

- Open Overview, Board, Timeline, Tasks, and Task Sheet from a freshly started Expo Go session.
- Verify board/list creation, list drag ordering, card drag across lists, scroll during drag and persistence after force-close/reopen.
- Verify timeline date navigation, Days/Weeks/Months zoom, drag task, resize handles, dependency linking/deletion, large projects, undated tasks and 56-day page boundaries.
- Verify task sheet labels/current values, expanded inline editors, keyboard and safe-area spacing, comments, acceptance evidence, attachments and verification records.
- Verify both light/dark themes, orientation changes and narrow phone widths against the supplied `MockDesign.zip`.
- Test Web separately: no regressions to original drag/drop behaviors or sidebar spacing.

## 6. Handoff and rollback

- **Accepted baseline until device acceptance:** v0.4.1 (stable logic) and v0.4.2 (original mock integration). Keep ZIP backups and previous Git commit.
- **Do not push to main until device acceptance.** If Expo Go still exits, send full red-screen or Android logcat; a standalone SafeAreaView warning is not a crash stack.
- **No Git commit or hosting deployment performed.**
