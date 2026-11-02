# Niyarvo Projects — summary.md

**Batch:** 0.5.27 (feature 1 of 3: Task Sheet merge). Set version 0.5.27 in app.json, package.json and package-lock.json yourself.

## Done
- Merged the Task Sheet (Standard/Advanced, Markdown, 24-color labels, Trello-style Board cards) into the v0.5.26 wire-engines release. Nothing from either side dropped.
- Tests: 542 run, 541 pass, 0 fail, 1 skipped. JSX parse clean. Device: not run.

## In progress
- Nothing.

## Next tasks
- 0.5.28: AES backup presets Low 200k / Medium 400k (default) / High 600k, iteration count stored in file, legacy 600k still opens.
- 0.5.29: Multiple workspaces (needs your OK on the migration design first).
- Then: import modes, Atlas fixtures, audit findings, Ponytail audit.

## Files changed
- Board.js, Tasks.js, TaskSheet.js, store.js (merged); Timeline.js, Workspace.js, kanbanUX.cjs + 4 tests (from the 0.5.26 baseline)
- NEW: tests/app/merge-tasksheet-0527.test.cjs, docs/changelogs/modern-code/CHG-NP-0.5.27.md

## Open issues
- Markdown links are not clickable (audit asked to verify links).
- Primary 0.5.26 zip was incremental; full tree rebuilt from the Task Sheet tree.
