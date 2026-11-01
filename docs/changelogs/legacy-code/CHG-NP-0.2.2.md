# CHG-NP-0.2.2 — Full-card Kanban drag and independent Gantt planner

**Project:** Niyarvo Projects only (not Niyarvo Control Center, not RIVNA)
**Base:** User-provided `NiyarvoProjects-v0.2.1-LOCAL-QA.zip`
**Target branch:** `work`
**Status:** Source patch / **local QA candidate**, NOT device-verified and NOT a production release
**Date:** 2026-10-30
**Persistence:** `niyarvo-projects-v1` AsyncStorage key unchanged
**Architecture:** React Native + Expo SDK 58 + Expo Metro (`npx expo start`)

## 0. Read first

This release responds to the 2026-10-30 user screenshots and testing: v0.2.1 board drag used a small handle, left a faded card and displayed a detached purple drag ghost; its Timeline showed date bars but did not behave like the reference Asana-style Gantt screen. The user specifically requires independent architecture informed by—not copied from—OpenProject source and Gantt reference screenshots.

**Source inspection, unit tests and JSX syntax parse are complete. Android touch, browser pointer events, landscape/portrait rendering and iOS have not been run here. No Firebase deployment or Git operations were performed.**

## 1. Implemented changes

### Kanban card interactions
- Removed the purple handle, old translucent moving-card design and globally positioned drag-ghost box.
- Entire task card accepts a **340 ms press-and-hold** followed by PanResponder movement; a normal tap still opens the task editor.
- A full-size rendering of the original card is positioned over the board, using the original card's measured screen position and the finger's original page coordinates. The position is updated from pointer displacement, not a fixed `-115px`/`-45px` offset.
- The original card's location is left empty during dragging; the full-size card is the only moving representation. No artificial shadow/elevation is added.
- Retained board edge auto-scroll and lane/ordering calculations. As with v0.2.1, touch behavior **requires device QA**.

### New independently implemented Gantt
- `src/gantt.cjs`: UTC-day scheduling/geometry, grouping, a bounded/pannable calendar domain, milestone geometry, predecessor connectors, overlap/conflict reporting, align-after-predecessors scheduling, and demo-only date filling.
- `src/GanttView.js`: a task column that stays visible beside the horizontally scrolling date grid; month/day/week-scale rulers; status/stage groups; task status colors; draggable task bars; end-date resize grips; milestone diamonds; finish-to-start dependency connectors; error and conflict indicators; predecessor selection dialog; optional align-after-predecessors action; explicit scheduling of previously undated tasks.
- All tasks, including unscheduled ones, have a row in the Gantt view. The new view also supports a 90-day window shift in both directions and a Today jump.
- The installed sample project previously had no dates. The **opt-in** Populate example Gantt action adds demo dates *only* if `sample-workspace` has no scheduled tasks; a workspace recovery snapshot is saved first. This action reopens the example tasks' verification status due to schedule changes.
- `milestone` is an optional boolean in normalized tasks and in the project JSON schema. A task editor checkbox controls it. The import format remains `niyarvo.project.v1`.
- Dependence and schedule changes now invalidate stale task `verified`/`merged` metadata (existing release readiness is not silently left valid).
- Task date normalization rejects impossible calendar dates (such as 2026-02-31). Reversed but syntactically valid dates remain visible as warnings in the Gantt instead of being silently drawn as valid bars.

### Architectural guardrails
- Gantt domain logic, dependency validation, scheduling and geometry are independent pure modules with Node tests.
- Existing project CRUD, status lanes, local JSON import/export, snapshots, release gates, and Niyarvo icons are retained.
- No source from OpenProject, Asana or other third-party project-management applications was copied. Their architecture and screenshots informed independent design decisions only.

## 2. Source changes

| File | Change |
|---|---|
| `App.js` | Whole-card gesture, in-place drag overlay, Gantt integration, milestone editor, sample-date snapshot action |
| `src/GanttView.js` | New independent RN Gantt component |
| `src/gantt.cjs` | New pure UTC date/geometry/dependency helper module |
| `src/model.cjs` | Milestone normalization, date validation, expose pure Gantt module, invalidation after dependency/date edits |
| `schemas/niyarvo.project.v1.schema.json` | Optional `milestone: boolean` |
| `tests/gantt.test.cjs` | Gantt scheduling, date correctness, dependencies, milestone, input preservation and conflict regression tests |
| `package.json` | `0.2.2`, no new dependencies |
| `README.md`, `docs/CHG-NP-0.2.2.md` | User instructions and handoff |

## 3. Verified checks

- `node --test tests/*.test.cjs`: **40 passed, 0 failed**.
- TypeScript parser check, `App.js` and `src/GanttView.js` as JSX: **0 syntax diagnostics**.
- JSON schema parse: **valid**.
- ZIP file structure: project-root files, no enclosing folder; no `node_modules`, build artifacts, `.git`, or environment secrets.

### Not run / not verified

- Expo Metro/Expo Web actual bundling in this container: **Not run** (node_modules not installed).
- Android Expo Go touch interactions: **Not run**.
- Browser drag pointer interaction: **Not run**.
- Real rendering in portrait/landscape: **Not run**.
- iOS: **Not run**.
- Firebase/Hosting: **Not connected or deployed**.
- Git checkpoint or GitHub push: **Not performed**.

## 4. Manual acceptance gates, on `work`

1. **Backup and branch**: export workspace JSON externally, confirm `git branch --show-current` returns `work`, and verify `git status --short` before extracting. If `work` is dirty, preserve local modifications first; do not blindly overwrite them.
2. **Metro**: `npm install`, `npm test`, `npx expo install --check`, then `npx expo start` in Termux; test both Android Expo Go and browser.
3. **Kanban**: Tap a card to edit. Long press any point of the card (no handle), then drag. Confirm card remains anchored to the point touched, no detached ghost or dark moving shadow appears. Drag across multiple columns while the edge auto-scroll operates, then release. Verify lane and within-lane position survive reopening the app. Also verify a regular scroll gesture without a long press does not drag cards.
4. **Gantt**: Open Timeline in mobile portrait, mobile landscape and desktop. Confirm a fixed task-name column and horizontally scrolling dated grid. Toggle Days/Weeks/Months and Status/Stage grouping. For an unscheduled task, tap Schedule; for the bundled demo only, choose Populate example Gantt (saves a backup). Drag a bar and its right resize grip. Mark a task milestone in the editor and check its diamond sits at the due date.
5. **Dependencies**: Open the link button on a task; link a scheduled predecessor; check the connector and the conflict warning if successor starts too soon. Choose Align after predecessors and verify the successor moves without changing duration. Try a circular dependency and verify an error in the dialog.
6. **Persistence**: Restart Expo Go/web. Confirm changed dates, dependencies, milestone flags and ordered Kanban states survive. Export/import project JSON and check `milestone` and predecessors are still there. Restore a saved snapshot.
7. **Regression**: Verify project switch/archive/restore, delete and recover, JSON native import/export and production guardrails unaffected by this patch.

**Do not merge into `main` until these runtime checks pass.** If anything fails, report the observed error, platform, and steps to reproduce. A source-level test pass is not an assertion of end-to-end functionality.

## 5. Known deliberate limitations

- The dependency graph currently models only *finish-to-start* predecessors (`dependsOn`) without working-day calendars, lags, lead times, task hierarchy, critical path or automatic propagation of changes to all descendants.
- `Align after predecessors` is explicit rather than automatically moving linked tasks. It protects users from silent schedule changes.
- Project tasks are rendered in one timeline list. Large (thousands of tasks) workspaces need virtualization and performance testing before production acceptance.
- Gantt connector creation uses a controlled predecessor-picker, not drawing a new dependency by dragging from one bar onto another.
- Native/browser press-and-hold and scroll interactions require device verification. The implementation deliberately adds no third-party gesture package before that validation.
- Collaboration, actual binary attachment uploads, notification delivery, and cloud synchronization are not in this patch. They require a separate Firebase project, authentication, rules and security tests.

## 6. Git checkpoint when verified

```bash
cd ~/NiyarvoProjects
git switch work
# Export a workspace JSON backup first
unzip -o ~/storage/downloads/NiyarvoProjects-v0.2.2-LOCAL-QA.zip -d .
npm install
npm test
npx expo install --check
npx expo start
# After Web + Android QA passes, create a checkpoint:
git add .
git commit -m "Niyarvo Projects v0.2.2: full-card drag and Gantt planning"
git push origin work
# Main merge only after explicit acceptance.
```
