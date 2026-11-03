# CHG-NP-0.5.27 — Task Sheet merged into the wire-engines release

## Baseline
- Primary: `NiyarvoProjects_v0_5_26.zip` (incremental: 13 files = 0.5.25 + "wire engines"; no package.json, no full tree).
- Merged: `NiyarvoProjects-v0.5.26-TASK-SHEET-UX.zip` (full tree = 0.5.25 + Task Sheet).
- Full tree rebuilt from the Task Sheet tree, then the primary baseline's changes applied on top. Both archives call themselves 0.5.26; this merge is 0.5.27.
- Commit status: Not committed. No APK, no deploy.

## How the merge was done (file level)
| File | Result |
|---|---|
| `Timeline.js`, `Workspace.js`, `kanbanUX.cjs`, 3 board/app tests, wiring-0526 test, 0.5.26 wire-engines changelog | Taken from the primary baseline (Task Sheet never touched them) |
| `store.js` | Primary baseline + the Task Sheet's `setLabelColor` action |
| `Board.js` | Primary baseline (filters, `dropBefore`, `initialCount`) + Task Sheet card (colored labels, compact due/checklist/attachment/comment marks, no ID) |
| `Tasks.js` | Primary baseline (search, layouts, tree, bulk edit, progress) + colored labels, no ID in the row |
| `TaskSheet.js` | Task Sheet (Standard/Advanced, Markdown, 24-color labels) + primary baseline's `setLabels` and subtask-safe parent picker |
| everything else | Task Sheet tree (identical to 0.5.25 where it was not touched) |

## Behaviour after the merge
- Standard mode by default, Advanced keeps every old control, same task record, switching never resets data.
- Task ID stays stable; shown only as small text at the bottom of the sheet. Search by ID still works.
- All label changes (add, assign, remove) now go through `setLabels`: trims, removes duplicates, caps count, clears verified/merged. Colors are per project (`labelColors`), plain-string labels still load.
- Board keeps filters and the "drop in front of hidden card" rule. Tasks keeps layouts, tree, bulk edit.

## Tests
- `node tests/run-all.cjs`: **542 tests, 541 pass, 0 fail, 1 skipped** (same skipped case as before: needs `node_modules`).
- New `tests/app/merge-tasksheet-0527.test.cjs` (6 tests) proves both feature sets coexist.
- JSX parse (TypeScript) of 68 `.js` files: 0 errors.
- Expo Go / web / Android device: **Not run**.

## Version lines for you to change (I never edit these)
- `app.json` → `"version": "0.5.27"` (inside `"expo"`)
- `package.json` → `"version": "0.5.27"`
- `package-lock.json` → top two `"version"` fields (both say 0.5.26 now).

## Known limits
- Markdown read mode is a safe subset: no tables, remote images or clickable links (the audit asked for links; see QA list).
- Per-project label colors. Native drag, keyboard and visuals untested on a device.

## Android acceptance (5 minutes)
1. Board: card shows colored labels, no ID. Drag within and across columns; open Filters > Overdue, drag to the end of a column.
2. Tasks: Layout > Tree; Filters; hold two tasks and set Priority.
3. Open a task: Standard mode, description in read mode, edit with `**bold**`, save, reopen. Switch to Advanced and back: nothing lost.
4. Add label "Bug" with a color; recolor it; it matches on Board and Tasks.
5. Parent task picker does not offer the task's own subtasks.
6. Timeline > Critical path still works.
