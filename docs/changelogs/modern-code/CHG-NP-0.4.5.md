# CHG-NP-0.4.5 — Mock Kanban drag restoration (QA candidate)

## 0. Read first — authoritative handoff

| Field | Observed status |
|---|---|
| Application | Niyarvo Projects; independent local-first PM app |
| Previous source baseline | v0.4.4-ANDROID-GESTURE-HOTFIX |
| New release candidate | v0.4.5-MOCK-BOARD-DRAG-RESTORED |
| Release status | QA candidate, **not accepted on Android** |
| Reported issues | Board snaps/appears to reload on entry; touch-scroll over cards starts an unintended drag; card loses finger during scrolling; Timeline now opens |
| Source-level tests | **343 passed, 0 failed** |
| JS/JSX parse check | All `src` JavaScript/JSX/CJS parsed successfully using TypeScript parser |
| Actual Android Expo Go UI | **Not run in this environment** |
| iOS & Expo Web UI | **Not run** |
| Persistent format | Unchanged; existing workspace remains in AsyncStorage |
| Dependencies | No new packages from v0.4.4; still Reanimated 4 / Worklets / RNGH 3 for Timeline |

## 1. Root cause and restoration decision

In v0.4.3/0.4.4 Kanban was altered from the supplied **MockDesign.zip**: `Board.js` switched from the mock's `PanResponder`-gated hold to RNGH 3 `useCompetingGestures` inside nested React Native ScrollViews; the card/list renderers also moved to `VirtualGestureDetector` wrappers and list cards were capped to 24 at once. The user reports that this blocks vertical/horizontal scrolling, starts unintended drags, loses finger offset and may cause a snap on the first Board open. Gesture Handler 3.3.0 also has a documented Android detector-vs-native-ScrollView cancellation issue (software-mansion/react-native-gesture-handler #4581, closed after subsequent fixes). That issue is consistent with the user's report but **not proof of the whole screen snap cause**.

The safer integration is to restore the **original supplied mock's board drag recognizer and screen structure** instead of attempting another uncertain native gesture rewrite. Timeline's currently working gesture screen was not changed.

## 2. Implementation details

- `src/screens/Board.js` — restored from `MockDesign.zip`. Retains original 290/272 px columns, 12 px column gap, 10 px list/card rhythms, measured-card placement, insertion indicators, tap/double-tap editing, all-list rendering, edge auto-scroll and scroll locks only after lifting. Replaced the original view's animation implementation with `BoardMotion` but **did not add layout wrappers** or change existing store actions (`placeTask`, `moveListTo`, `addTask`, etc.). The v0.4.4 card pagination limiter was removed to match the mock; test large boards for memory/performance.
- `src/boardGesture.native.js` — restores the mock's `PanResponder` hold policy: 350ms stationary long press, 8px pre-lift movement cancel, pointer-relative motion, 30ms scroll compensation during auto-scroll, title double-tap and drop. This is the **intentional, documented compromise**: the touch recognition and drop-target calculations run on the JS thread to recover observed working behavior; the native transform animations render through Reanimated shared values. Do not describe this as fully UI-thread-only gesture recognition.
- `src/boardGesture.web.js` — delegates unchanged to the existing original mock web responder/document listeners (`src/gesture.js`).
- `src/boardMotion.native.js` — Reanimated animated view with UI-thread transforms and `withTiming` list-shift animation. Does not embed RNGH detectors or introduce card hierarchy wrappers.
- `src/boardMotion.web.js` — preserves mock `Animated.ValueXY` layout/motion on web; no new web animation redesign.
- `src/boardDragMath.cjs` — scroll-aware finger-content coordinate calculation and pre-lift cancellation for native.
- `src/screens/Timeline.js`, `src/gesture.native.js`, `src/gestureSurface.native.js` — **unchanged** from v0.4.4; Timeline presently renders on the user's device.
- `tests/board-gesture-restoration.test.cjs` — new math and source-contract tests for scrolling vs hold, auto-scroll finger offset, persistence hooks and Timeline isolation.
- `tests/native-animation-contract.test.cjs` — adjusts prior expectation that Board must use `DragMotion`; tests original geometry and new adapter instead.
- `package.json`, `app.json` — release version 0.4.5 only. No dependency change.

## 3. Regression validation (observed)

- `npm test`: **343/343 pass** (original 339 + 4 new restoration tests).
- TypeScript parser: 0 syntax errors across all `src/**/*.js` and `.cjs`.
- Archive: ZIP integrity verified.
- **Not performed:** Expo Go Android/iOS runtime launch, Metro bundle, actual physical touch/scroll, FPS/memory measurements, Web runtime acceptance. Installation of dependencies not verified in this container.

## 4. Data safety and rollout

No Firestore configuration, Firebase integration, storage key, import/export format, business/domain code, task ID, scheduling rule, dependency policy or task-sheet inline dropdown was changed. In-progress local data should remain compatible, but **export a workspace backup and retain the v0.4.4 ZIP** before replacing your working source. Do not merge to `main` until device acceptance passes.

### Termux

```bash
cd ~/NiyarvoProjects
# On the work branch with a clean/recoverable source checkpoint:
unzip -o ~/storage/downloads/NiyarvoProjects-v0.4.5-MOCK-BOARD-DRAG-RESTORED.zip -d .
# No new packages are required if v0.4.4 dependencies already installed.
npm install
npm test
npx expo start --clear
```

## 5. Android acceptance priority

1. Launch Board repeatedly, switch tabs away/back. No snap, red screen or spontaneous reload.
2. Begin vertical scrolling from the middle of a card without pausing. Should scroll the page, not lift a card.
3. Begin horizontal scrolling from the middle of a card without pausing. Should scroll the columns, not lift a card.
4. Hold a card in place ~350ms then move: it should stay under the fingertip and update insertion line. Hold list **header** to reorder columns.
5. While dragging, move near left/right edge to auto-scroll; dragged card must maintain pointer-relative position as the strip moves. Test up/down at page edges too.
6. Drop between lists and within same list: check ordering and status survive switching screens and reloading.
7. Single-tap task to open sheet; title double-tap edits, no accidental open after scrolling.
8. Open Timeline: verify it still renders and move/resize/link remain usable.
9. Web/iOS acceptance remains needed independently. If Board still snaps, capture full Metro log **and** Android logcat rather than attributing it to animation without evidence.

**Do not claim the reported runtime defects are fixed until Android device QA confirms.**
