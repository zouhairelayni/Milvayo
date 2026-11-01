# CHG-NP-0.4.7 — Sprint management, Board scroll arbitration, navigation performance

## 0. READ FIRST — handoff

| Field | Value |
|---|---|
| Application | Niyarvo Projects — independent PM app |
| Baseline | `NiyarvoProjects-v0.4.6-MOCK-KANBAN-INTERACTIONS.zip` |
| Candidate | `NiyarvoProjects-v0.4.7-SPRINT-KANBAN-NAV-QA.zip` |
| Status | QA candidate; Android Expo Go, iOS and browser runtime tests **not performed** |
| Workspace / schema | Existing `niyarvo-projects-v1` AsyncStorage workspace and canonical v0.4.1 model **unchanged** |
| Tests | 353/353 source tests passed, including 4 new tests; 0 source syntax diagnostics (see verification) |
| Dependencies | No added packages; Expo SDK 58 / existing Reanimated and Gesture Handler retained |
| Timeline | No changes to `src/screens/Timeline.js` or its gesture logic; previously reported to render successfully |
| Deploy/commit | Not done |

## 1. Fixed Sprint presentation and restored original domain lifecycle

- The generic `Stat` block forced the full sprint goal to a bold, 30-point statistic. The goal now lives in a separate, restrained description with a small section label, regular 14-point body type and 22-point line height. Completion and velocity remain statistics.
- New Sprint action opens a compact form for name, goal, start and end. Planned sprints can be selected and edited. All form changes are committed once on save, not per keystroke.
- Added `createSprint`, `updateSprint`, `deleteSprint`, `assignSprintTask`, and explicit-ID `startSprint` / `finishSprint` to the modern store. All call existing `model.agile` domain operations through the canonical project transaction and persistence path. The legacy SprintPanel remains available in Advanced workspace.
- Added `updatePlannedSprint` to the original `src/agile.cjs`; only planned sprint name, goal and dates may be changed. Sprint identity, state, assignments and progress history are preserved. Active/completed sprint edits are rejected.
- Planned sprint deletion requires confirmation and unassigns tasks as in the legacy model. Starting a sprint is blocked when another is active. Finishing requires confirmation and retains historical scope; unfinished tasks return to backlog without changing their status.
- Task assignment, removal, backlog search, scope pagination, completed-sprint final task IDs and recorded burndown are accessible in the modern Sprint view. Completed scope is explicitly read-only and displays current titles without pretending they're historical task status snapshots.

## 2. Board scroll versus hold arbitration

- Root cause of blocked swipes in source: both the card `PanResponder` and the nested `ScrollView` competed to own touch input; the ScrollViews had `disableScrollViewPanResponder` enabled on Android. React Native explicitly cautions against this for ordinary scrolling.
- `src/boardGesture.native.js` now *observes* touch start/move/end without taking responder ownership. It only claims subsequent move events after a stationary 350-ms hold. Crossing the mock's 8-pixel threshold cancels the hold and lets the native scroll views process ordinary vertical and horizontal swipes. Native scrolling also cancels all pending holds.
- `src/screens/Board.js` enables Android `nestedScrollEnabled` and retains the mock's column widths, padding, visual cards, edge auto-scroll, finger/scroll offset math and canonical drop actions. Native Reanimated still owns visual transforms; the gesture decision remains JS-driven to preserve mock behavior.
- The web mock's drag system and stylesheet are not changed. No other screens' drag logic was modified.
- **Limitation:** Native responder arbitration, scroll momentum, finger offset accuracy and rendering smoothness require Android/iOS manual tests. Source tests cannot prove exact touch feel.

## 3. Navigation performance mitigation

- `ModernApp.js` now keeps primary tabs (Overview, Board, Timeline, Tasks and Sprints) mounted **after their first visit** and hides inactive screens without destroying/recreating their gesture/SVG trees. Startup only mounts Overview; other screens remain lazy until visited.
- Previously selected scroll/gesture state should persist across tab switches, reducing repeated setup costs. This is not proof of a particular FPS or sub-second switch time.
- **Tradeoff:** retaining visited screens increases memory use. Test repeated switching and Android memory stability. If memory pressure appears, selectively disable caching for Timeline while retaining the Board optimization; do not clear app data.

## 4. Verification performed

- `node --test tests/*.test.cjs`: **353 passed, 0 failed**. Includes tests for existing canonical agile lifecycle, planned-sprint editing validation, current UI/domain bindings, scroll ownership, and tab caching.
- TypeScript syntax parser: zero diagnostics in touched files and full JSX/JS pass (see QA checklist).
- Archive contains project-root content, not an enclosing folder; `node_modules` and stale lockfiles are not included.
- **Not verified:** Expo Go startup, touch gestures/scroll, actual navigation latency, native frame times, iOS behavior, APK builds, Web rendering, persistence after relaunch and visual comparison on device.

## 5. Termux install and acceptance

1. Export a complete workspace backup from the last working release; commit the current `work` checkpoint and keep v0.4.6 ZIP.
2. Extract the delivered ZIP at `~/NiyarvoProjects` (not inside a nested folder).
3. Run `npm install` only if dependencies are absent or outdated, then `npm test` and `npx expo start --clear`.
4. Verify horizontal and vertical swipes from on top of task cards first. Then stationary long-press card and list dragging, task sheet taps and title double taps, edge auto-scroll, persistence after relaunch and previously working Timeline.
5. Create/edit/start/finish/delete planned sprints with real task assignments, including a completion after halfway progress and project reload.
6. Compare Sprint goal typography with the user's screenshot and test repeated tab switching for both latency and memory.

**Do not merge to `main` until real-device acceptance passes.** Preserve canonical project imports, task IDs, schema, activity history and independent Niyarvo Projects separation from RIVNA / Control Center.
