# CHG-NP-0.5.26 — Wire the tested engines into the screens (nothing deleted)

## 0. Release handoff

| Field | Value |
|---|---|
| Baseline | 0.5.25 (NiyarvoProjects_v0_5_25.zip applied) |
| Release | 0.5.26. `app.json` version bumped; `package.json` and `package-lock.json` not included (bump `package.json` to 0.5.26 yourself) |
| Dependencies | None added |
| Source status | 532 tests: 531 pass, 1 skipped (needs `node_modules`), 0 fail. JSX syntax clean (TypeScript parser) |
| Runtime status | Web, Android, iOS, Expo Go: **Not run**. These are screen changes; please check section 7 on a device |

Nothing was deleted. Every function from the 0.5.24 audit list now has a caller, except the groups in section 4.

## 1. Board
- **Filters** (`kanbanUX.filterCards`, `dateBucket`): a Filters section with Due (any date, overdue, today, tomorrow, next 7 days, next 30 days, no date), Priority, Owner and Tag. The text box now also searches id, description and repository. "High and above" still works with them.
- **Drop position** (`kanbanUX.resolveDropIndex` through the new `dropBefore`): with a filter on, a card dropped at the end of the visible cards lands in front of the hidden card that followed, not at the very end of the list. Without a filter nothing changes.
- **First cards** (`progressiveCount.initialCount`): sets how many cards of a list mount first. Same behaviour as before.

## 2. Tasks and task sheet
- **Search and paging** (`taskWorkflows.query`, `page`): search now covers id, description, repository, owner and tags; Priority and Owner filters added; "Show more" pages with `page`.
- **Sorting** (`planning.filterSort`): Due, Priority, Progress, Title, Manual. Saved views now keep priority, owner and sort direction.
- **Layouts**: List, Tree (`taskWorkflows.hierarchyOrder`, subtasks indented under their parent), By status and By stage (`gantt.buildRows`).
- **Progress** (`planning.progressRollups`, `projectProgress`): a parent row shows the progress of all its subtasks, and the header shows the whole project's progress.
- **Bulk edit** (`taskWorkflows.bulkUpdate`, new store action `bulkSet`): with tasks selected you can set Priority, Stage or Owner for all of them in one step. Bulk status still uses `bulkStatus` (it also places cards in board lanes).
- **Tags** (`kanbanUX.updateLabels`, new action `setLabels`): trims, removes duplicates, caps length and count, and clears verified/merged like every other edit.
- **Parent picker** (`taskWorkflows.descendants`): a task's own subtasks are no longer offered as its parent.

## 3. Resources and Timeline
- **Resources** (`operations.capacitySummary`): each person shows open tasks and logged hours.
- **Timeline** (`gantt.cjs`):
  - **Critical path** chip: critical bars get a red border, critical dependency lines turn red and thicker, and a card gives the number of critical tasks and the days end to end. A circular dependency shows a clear message instead.
  - **Schedule problems**: a card lists dependencies that start before the predecessor ends, each with **Move after predecessors** (`afterPredecessors`, new action `scheduleAfter`); another card lists reversed or unreadable date ranges (`invalidSchedules`).
  - **Parent tasks and subtasks** section (`hierarchyRows`, `hierarchySummaries`): the tree with fold buttons, combined dates, progress and subtask count of each parent.
  - **Schedule the sample tasks** button on the empty sample project (`scheduleSample`, new action `scheduleSample`).
  - **First task** chip (`calendarDomain`): jumps to where the schedule begins.

## 4. Still not wired, and why
- **Old Timeline renderer in `gantt.cjs`**: `LAYOUT`, `STUB_OUT`, `STUB_IN`, `ARROW`, `LANE`, `barBox`, `layoutRows`, `barGeometry`, `dependencyGeometry`, `dependencyCurve`, `roundedPath`, `connectorPoint`, `linkGesturePoint`, `linkPreviewPath`, `linkTargetAt`. They draw, route and hit-test the chart with 60 px rows. The Timeline screen does the same with its own code (54 px rows, drag follow, edge resize). Using both means replacing the working drawing code, which I will not do without a device test. Say so and I will do it as its own release.
- **`timelineWindow.pageRows`** (and `PHONE_ROWS`, `DESKTOP_ROWS`): a row pager. The Timeline has none on purpose, because it hid tasks outside the window.
- **`importFiles.pickAndroidJsonText`, `pickDocumentJsonText`**: text readers replaced by the byte readers, which also open `.niyav` files.
`tests/app/wiring-0526.test.cjs` keeps this list: any other export of the audited modules that nothing uses now fails the test.

## 5. Tests
- New `tests/app/wiring-0526.test.cjs` (8 tests): drop position, due-date filters, Tasks pipeline, bulk edit, tags and parent picker, capacity, critical path, conflicts, invalid dates, `afterPredecessors`, parent summaries, `calendarDomain`, plus the wiring ledger.
- Updated three source-pattern tests for the new Board code (root-remount-0513, board-gesture-restoration, mock-board-interactions).

## 6. Not verified
- Speed of the Tasks Tree and grouped layouts on a project with thousands of tasks (they paginate; the tree walks all tasks once per change).
- Critical path assumptions: calendar days, finish-to-start, no resource limits (shown on screen).

## 7. Acceptance (device)
1. Board > Filters: pick Overdue, then drag a card to the end of a column: it lands after the last visible card, hidden cards stay in order.
2. Tasks > Filters & tags: Layout Tree shows subtasks indented with a parent progress percentage; By status shows group headers.
3. Hold two tasks: set Priority High and Stage Testing for both; assign to an owner.
4. Task sheet > Labels: add `Bug ` and `bug`; Parent task: a subtask of the task is not offered.
5. Timeline > Critical path: red bars and lines, summary card. Make a task start before its predecessor ends: the warning appears and "Move after predecessors" fixes it.
6. Resources: each person shows open tasks and logged hours.

## 8. Rollback
Restore the eight changed source files and three updated tests from 0.5.25 and delete `tests/app/wiring-0526.test.cjs`.
