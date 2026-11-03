# CHG-NP-0.5.20 fix: one local "today" (no version bump)

Audit finding 1. "Today" came from the UTC clock in the domain rules and from the device clock in the UI, so overdue badges, automations, health, burndown and new-task dates disagreed for part of every day (for example Auckland at 08:00 on 2 Nov: UTC said 1 Nov). No dependency, app.json, package.json or saved-data change.

## Change
- New `src/utils/localDay.cjs`: `localDay()` returns the device-local date as `YYYY-MM-DD`.
- Every `new Date().toISOString().slice(0,10)` used as "today" now calls it: `kanbanUX`, `powerUps`, `agile` (burndown default), `operations` (health), `automation`, `model` (dueDays), `taskWorkflows` (dueDays), `modernBridge` (`day()`), `store.js` (`sweepDue`), `Sprints` (new sprint dates), `TaskSheet` (log time), `Workspace` (time log default), `Programs` (today marker), `Management`, `governance/data.js` (`TODAY`).
- `store/data.js`: `isOverdue` reads the date when it is called. `TODAY` there is still read once at start (marked `shortcut:`), so the Timeline "today" line needs an app restart after midnight.

## Not changed
- Sprint history events and `completedAt` are still bucketed by their UTC date in `agile.burndown` (same rule on both sides, and sprint history semantics are frozen in AGENTS.md).
- Aging automation compares `updatedAt` days in UTC; the error is at most one day.

## Tests
- New `tests/domain/local-day.test.cjs` (2 tests): local date in Auckland and Los Angeles, and a scan that no source file takes "today" from `toISOString()` any more.
- `node tests/run-all.cjs`: 494 tests, 493 pass, 0 fail, 1 skipped, in each of UTC, Pacific/Auckland, America/Los_Angeles and Asia/Kolkata.
- JSX syntax and undefined-name check on all changed files: Pass. Expo Go / device run: **Not run**.

## Reversible install
Copy the files over the project. To undo: delete `src/utils/localDay.cjs` and the new test, and restore the changed files from the batch 03 files.
