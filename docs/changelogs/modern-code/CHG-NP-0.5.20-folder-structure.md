# CHG-NP-0.5.20 folder structure (no version bump)

Moves code into folders and subfolders. No behavior, dependency, app.json, package-lock.json or saved-data change. package.json: only the `test` script changes, and clean.py does that on your machine (the zip does not contain package.json).

## New layout
- `App.js` (root): 3-line Expo entry shim. The app root is now `src/app/App.js`; `ModernApp.js` is `src/app/ModernApp.js`.
- `src/app/navigation/`: navigationIntent, navigationQueue, pageRetention, visitedTabs, freezeCell.
- `src/screens/`: overview, board (Board, BoardManagement), timeline, tasks (Tasks, TaskSheet), delivery, workspace (Workspace, Backup), management, governance (Projects, Portfolios, Programs, EnterprisePM, `pm/` for PmDocs, PmRisks, PmWbs, pmui).
- `src/components/`: `shell` (Menus, Bars, ScreenErrorBoundary, DrawerMotion), `notice` (IslandNotice, NoticeMotion, noticePlacement), `inline` (InlineEditor, DisclosureGlyph, CompactTools), `charts`.
- `src/ui/`: ui, uiBase, uiControls, uiLayout, downloadText; `src/ui/theme/`: theme, design.
- `src/domain/`: model, modernBridge, operations, planning, programs, projectRelations, governanceCore, governanceSummary, taskSchema, taskWorkflows, powerUps, automation, agile, boards, scheduling, scheduleProject.
- `src/timeline/`: gantt, gantt-window, timeline-window, timelineWindow, timelineDisplay, timelineEdit, timelineGeometry, timelineViewport.
- `src/board/`: boardColumns, boardDragContext, boardDragMath, boardInteractions, kanbanUX, boardGesture, boardMotion.
- `src/gestures/`: gesture, gestureSurface, TimelineGestureHost, dragFollow, scrollLimits, viewport.
- `src/store/`: store, data, latestWriter, backupBudget, importFiles. `src/utils/`: progressiveCount.
- `src/governance/` and `src/diagnostics/` keep their place (their `screens/` and DiagnosticsPanel moves: governance/screens -> screens/governance/pm).
- `tests/<group>/*.test.cjs` (app, board, diagnostics, domain, gestures, governance, store, timeline, ui), helpers in `tests/helpers/`, runner `tests/run-all.cjs`.

## Other changes
- First line of every code file is a comment with its own path.
- Removed the 6 empty root files `board`, `overview`, `sprints`, `tasks`, `timeline`, `settings`.
- Relative imports and requires rewritten in all moved files, scripts/performance-benchmark.cjs and scripts/schedule-smoke.cjs. Code bodies are untouched.
- Tests: paths and `__dirname` depth updated; 17 source-text assertions that matched an import path now match the new path. Their checks are unchanged.
- New `tests/app/folder-structure.test.cjs` (5 tests): no stray root code, src has folders only, tests in groups, path comment on every file, every relative import resolves.
- AGENTS.md has a new Folder structure section; README.md and AGENTS.md source paths updated.

## Checks
- `node tests/run-all.cjs`: see summary.md for the final count.
- Same number of tests as before plus the 5 new ones; every old test passes.
- Expo / Metro / web / device run: **Not run** (no node_modules or device in the build environment).

## Reversible install
`clean.py` removes only the old paths of moved files, then unzips over the project. To undo: restore the previous zip (or `git checkout` the previous commit) after deleting `src/` and `tests/`. Keep `package.json.backup` to restore the old `test` script.
