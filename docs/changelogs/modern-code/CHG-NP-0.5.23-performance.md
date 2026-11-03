# CHG-NP-0.5.23 — performance patches (from the v0.5.22 report, run mvyh4x0e)

app.json / package.json untouched. Bump the version yourself when you accept the batch.

## Patch 1 — hidden Board does no deferred work
- Evidence: 8 Board renders of 168-239 ms in a row at 23:43:28-32 while Overview was on screen; Overview timer delays 495 and 652 ms at the same time.
- Cause (from code, not measured): retained Board kept mounting cards (6 per frame) and extra columns after the tab was hidden.
- Change: `useScreenActive()` in `src/store/store.js` (set by `StoreFreeze`). `ListColumn` pauses its card reveal and `Board.ensureColumns` pauses column mounting while hidden; both catch up when the tab is shown.
- Files: src/store/store.js, src/screens/board/Board.js.

## Patch 2 — Testing screen
- Evidence: Testing first render 361 ms (avg 307 ms), navigation 617 ms.
- Cause: every check drew a card with 4 chips at once, `tasks.find` per check, `checks.filter` per status tile.
- Change: first 25 checks, "Show more" for the rest, one Map for task titles, one pass for the four counts.
- Files: src/screens/delivery/Delivery.js. Test regex in tests/diagnostics/diagnostics-048.test.cjs now allows `useMemo`.

## Patch 3 — Projects
- Evidence: Projects 65 renders, 100-142 ms, repeated every few seconds; timer delay 1250 ms (23:45:10).
- Cause (from code, not measured): the edit fields (name, code, description) lived in `Projects`, so each keystroke re-rendered every project card; in project governance the 10-document list rebuilt on every field commit.
- Change: `ProjectCard` (memo, own edit state) and `DocGroups` (memo on docs / wbs / budget / risks only). `docProgress` is computed once per document row, not twice.
- File: src/screens/governance/Projects.js.

## Patch 4 — Timeline bars
- Evidence: Timeline 114 renders, max 179 ms (23:42:58).
- Cause (from code, not measured): `TaskBar` was not memoised, so every drag step and scroll window change re-rendered every drawn bar (four gesture recognizers each).
- Change: `TaskBar` is `memo`. Timeline passes stable wrapper callbacks (`bar.onPreview / onCommit / onLink`) that call the latest closures. Gesture code itself is unchanged: `TaskBar` already read its callbacks from `live.current` at event time.
- File: src/screens/timeline/Timeline.js. **Needs a drag / resize / link test on the phone.**

## Patch 5 — search boxes and Tasks counts
- Evidence: Tasks 29 renders avg 40 ms, max 123 ms; Board filter box.
- Change: Tasks search and Board "Filter cards" use `lazy` Input (filter applies 300 ms after typing pauses, or on blur / Enter). Tasks tag list and per-status counts computed in one pass.
- Files: src/screens/tasks/Tasks.js, src/screens/board/Board.js.

## Tests
- tests/app/hidden-work-0523.test.cjs (3), tests/app/render-scope-0523.test.cjs (5), source checks plus one real run of the stable-callback pattern. npm test: 492 run, 491 pass, 0 fail, 1 skipped.
- JSX parse (TypeScript) of 64 src files: 0 errors.
- Timeline drag, Board scroll, Projects typing on device: **Not run**.
- Device / Expo Go / web: **Not run**. Render times after the patches: **not measured**.

## Reversible install
Replace the touched files with the ones from the previous zip. No data or storage change.
