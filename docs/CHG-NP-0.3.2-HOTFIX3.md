# CHG-NP-0.3.2-HOTFIX3 — Android rendering / large-workspace QA

## 0. READ FIRST — handoff

| Field | Value |
|---|---|
| Project | Niyarvo Projects (independent of RIVNA and Niyarvo Control Center) |
| Baseline | `NiyarvoProjects-v0.3.2-HOTFIX2-LOCAL-QA.zip` |
| Patch | `v0.3.2-HOTFIX3` — **local-QA candidate only** |
| Git branch | `work` (no commit, push or merge performed) |
| Firebase | Not connected; project remains `niyarvoprojects` and Android app ID `com.niyarvo.projects` |
| User observation | Atlas mock import now succeeds. Android is slow and Timeline can terminate Expo Go; Web works. No Metro error. |
| Hypothesis | Gantt mounts a full-width/full-height SVG plus every task row and day column. Native drawing/memory pressure is a plausible cause, **not yet confirmed from Android crash logs**. |
| Data migration | None; project and workspace formats unchanged |

## 1. Actual changes

1. `App.js`: removed the duplicate interactive Kanban board, caption, and CTA from Overview. The dedicated Board tab remains unchanged in functionality.
2. `App.js`: mobile Kanban lanes now initially mount 12 cards per lane; desktop mounts 36. “Show more” increments by the same batch size. Existing task order and drag/drop callbacks are preserved.
3. `src/GanttView.js`: replaced full-canvas SVG dependency layers with **one viewport-sized SVG** which translates existing paths by the horizontal/vertical scroll offsets. The overlay uses the same connector, selection, and preview geometry.
4. `src/GanttView.js`: viewport-windowed task labels, Gantt bars, row backgrounds, grid columns, and date labels. Calendar and dependency geometry are still calculated for the entire project; only the visible slice is mounted. Focal pinch zoom, scrolling, task dragging, resizing, and link operations were not intentionally altered.
5. `src/GanttView.js`: resets vertical scroll on project switches and clamps vertical scroll after collapsing to shorter Gantt content, preventing blank viewport states.
6. `src/GanttView.js`: memoized dependency geometry and calendar-day array, preventing repeated full calculations on ordinary scroll redraws.
7. `src/gantt-window.cjs`: new pure helper for row/date/link visibility with bounded overscan.
8. New `tests/gantt-window.test.cjs`, `tests/gantt-render-contract.test.cjs`.

## 2. What was NOT changed

- No Task, Sprint, Release, scheduling, custom-field, workflow, import or backup schema changes.
- No change to HOTFIX2 Android SAF document picker.
- No new packages and no Firebase or Git operations.
- No behavioral change to PanResponder's task movement/resizing logic or dependency link validation.

## 3. Validation

| Check | Observed |
|---|---|
| Previous 216 tests | PASS |
| New helper/contract tests | 12 PASS |
| Total Node tests | **228 / 228 PASS** |
| App.js and GanttView.js JSX syntax (TypeScript parser) | PASS |
| Atlas 73-task Gantt rendering calculation | Original 77 rows / 104 days; initial selection 8 rows / 23 days at simulated 330px height, 260px chart width |
| Native SVG pixel surface calculation | Old 2496 × 4568; new approximately 260 × 330 at simulated dimensions |
| Android Expo Go UI | **NOT RUN — user device acceptance required** |
| Expo Web runtime | **NOT RUN** |
| Metro bundling | **NOT RUN** |
| Physical iOS | **NOT RUN** |

## 4. Required Android QA, in order

1. Before applying: export workspace JSON. Confirm `work` branch and clean or checkpointed changes.
2. Open Atlas Overview and confirm only performance cards/charts remain, with **no embedded Kanban**.
3. Open Board. Initial long backlog should show 12 cards and a **Show more** control. Long-press drag across lanes, including edge auto-scroll, then reload to verify persistence.
4. Open Timeline immediately after a fresh Expo Go start. Observe whether it opens without terminating the app. Repeat after switching project and after opening Board.
5. Pan the Gantt vertically and horizontally; look for blank strips, missing labels, lines moving incorrectly, offscreen hit targets and stale drawing.
6. Pinch-to-zoom, resize/move bars, link tasks and remove a dependency; test status/stage/tree modes and collapsed parent groups.
7. Visit Sprints, confirm burndown data unchanged. Restart Expo Go and verify Atlas project data is still present.
8. If the native app still disappears with no Metro error, capture Android crash logs (`FATAL EXCEPTION`, `OutOfMemoryError`, renderer/OOM messages) when accessible, and report device/Expo Go vs APK platform.

## 5. Risks and rollback

- The new SVG overlay sits above the Gantt scroll surface; Android may route some line or bar touches differently. Validate link selection and bar gestures on device before acceptance.
- Rapid kinetic scrolling can briefly delay drawing a buffer window. Window overscan and quantized offsets are tested, but physical frame pacing is not.
- Pure tests cannot prove the original crash is resolved; this is a **performance hotfix candidate**.
- To roll back, use your pre-patch `work` checkpoint or extract the prior HOTFIX2 source over the working copy. Workspace data format is unchanged.

## 6. Next model guidance

Do not declare Android crash fixed until the user confirms device QA. If it persists, inspect native memory/crash logging and reduce the remaining oversized timeline surfaces, including the horizontal scrolling canvas and `ScrollView` nesting. Keep OpenProject as an architectural reference only; do not copy source. Apply the Unslop checklist for further UI changes.
