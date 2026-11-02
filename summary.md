# Niyarvo Projects — summary.md

**Batch:** 07 (Releases edit fix on top of the v0.5.21 performance batch). app.json / package.json untouched: set `"version": "0.5.21"` in BOTH yourself.

## Done
- Batch 07: Releases > Edit metadata now opens the form card and scrolls to it (it filled a closed card, so it looked dead). `Fold` got optional `open`/`onToggle`. Tests 483, 0 fail.
- Batches 01-05: file splits, localDay, one progress formula, task-view cache, import fixes, snapshot size check on every edit, dead code removal (see docs/changelogs/modern-code).
- Perf (from your v0.5.20 report: Projects 96 renders, 100-138 ms, timer stalls 1.3 s): typing no longer saves per key. New `lazy` option on `Input` saves 300 ms after a pause, on blur, Enter and close. Applied to project governance, documents, risks, WBS, row tables, task sheet text fields.
- Project totals (`projectMetric`) cached per project; snapshot sizes measured once.

## In progress
- Nothing.

## Next tasks
- v0.5.21 report: Board 14 renders of 170-190 ms in a row after opening it (23:11), Projects 117 renders max 173 ms. Needs a look (Board/Projects) after your OK.
- Re-test with a new performance report: Projects, Tasks (task sheet typing), Board, Timeline.
- Timeline (254 renders, max 166 ms) and Board (max 142 ms) not touched: need gesture code review, your OK first.
- File splits: TaskSheet.js, governance/pm.js, Delivery.js, Workspace.js.

## Files changed (batch 06)
- NEW: src/ui/commitBuffer.cjs, tests/ui/commit-buffer.test.cjs, docs/changelogs/modern-code/CHG-NP-0.5.21-performance.md
- Batch 07: src/screens/delivery/Delivery.js, src/components/inline/CompactTools.js, tests/ui/commit-buffer.test.cjs, tests/diagnostics/diagnostics-048.test.cjs, docs/changelogs/modern-code/CHG-NP-0.5.21-releases-edit-fix.md
- src/ui/uiControls.js, src/domain/governanceSummary.cjs, src/store/backupBudget.cjs
- lazy Input: src/screens/governance/Projects.js, pm/PmDocs.js, pm/PmRisks.js, pm/PmWbs.js, pm/pmui.js, src/screens/tasks/TaskSheet.js
- tests/domain/progress.test.cjs (metric cache test)

## Test results
- npm test: 483 tests, 482 pass, 0 fail, 1 skipped. JSX parse (TypeScript) of 63 files: 0 errors.
- Expo Go / web / device: **Not run**.

## Open issues
- Tapping a button less than 0.3 s after typing in a lazy field can act on text not yet saved (leaving the field saves it at once).
- Timeline "today" line stale after midnight until restart (shortcut). Web drag fix from an older batch unconfirmed.
