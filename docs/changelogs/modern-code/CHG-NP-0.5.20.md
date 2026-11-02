# CHG-NP-0.5.20 — Dead-code audit, Batch 3 (model functions the UI never calls)

## 0. Release handoff

| Field | Value |
|---|---|
| Baseline | niyarvo_0_5_19.zip |
| Release | 0.5.20 patch. `app.json` and `package.json` not touched |
| Scope | Remove 7 superseded functions; wire `ageInDays` into Board; no data or UI change |
| Dependencies | No new packages |
| Source status | 472 tests: 471 pass, 1 skipped (needs `node_modules`), 0 fail. JSX syntax clean (TypeScript parser) |
| Runtime status | Web, Android, iOS, Expo Go: **Not run** |

## 1. Method
"No caller in the app" was not accepted as "dead". Every Batch 3 function was compared with what the screen does instead, and was removed only where the replacement was found and the same behaviour confirmed. Everything else was kept.

## 2. Removed (function and its tests)
| Function | Replaced by |
|---|---|
| `model.shiftTask`, `model.resizeTask` | `timelineEdit.apply` + `modernBridge.patchTask` (clears verified/merged, reconciles scheduling, rejects inverted dates) |
| `model.boardLaneAt`, `model.boardAutoScrollDelta` | Board's own edge-scroll and drop code (`EDGE_X`, `SPEED`, `placeTask`) |
| `model.stats`, `model.blankProject` | nothing used them |
| `operations.portfolioStats` | `modernBridge.projectView` (health and progress via `operations.health`) and the Portfolios screen's own task counts |

## 3. Kept on purpose (tested logic for features the UI does not expose)
- `kanbanUX.filterCards`, `dateBucket`: due-date (overdue/today/tomorrow/week/month), owner, priority and tag filters. Board has only a text filter.
- `kanbanUX.resolveDropIndex`: drop position under an active filter (Board's current approach not run on a device).
- `kanbanUX.updateLabels`: trim, dedupe, cap; the live label path does not clear verified/merged.
- `taskWorkflows.bulkUpdate`: bulk priority, stage and owner; blockers checked against proposed statuses.
- `taskWorkflows.descendants`, `hierarchyOrder`: subtasks show only as a flat list in the task sheet; there is no tree view.
- `operations.capacitySummary`: counts logged hours; the Resources screen ignores them.
Decision for you: wire these into screens (for example due-date filters on Board, a Subtasks tree) or delete them later.

## 4. Wired
- `powerUps.ageInDays` replaces the inline age maths in the Board card ("Updated Nd ago"). Same result for valid dates; an unreadable date now shows 0d instead of "NaNd".

## 5. Tests
- Removed with their functions: the stats test, the edge-scroll and lane tests.
- Ported to the live path (coverage kept): date edit clears `verified`/`merged` (gantt, scheduling-integration), resize clamps and rejects inverted dates (project-navigation-timeline), the shiftDate test (board), the `portfolioStats` assertion dropped from the portfolio test.
- New: `tests/batch3-dead-model-0520.test.cjs` (7 tests): removed names are gone, kept names are still exported, live date-edit and resize paths, `operations.health`, `ageInDays` wiring.
- Count: 468 -> 472.

## 6. Still open from the audit (not changed)
- GitHub preview refresh: `powerUps` fetchPublicPreview, setPreview, endpoint have no Refresh button.
- iOS import still copies through DocumentPicker and reads with `new File(uri).text()`, the shape that failed on Android before 0.5.19; the hardened reader (`importFiles.readPickedJsonAsset`) is unused.
- `planning` filterSort/progressRollups/projectProgress, and the Timeline helpers: need a keep/delete decision.
- Not on the audit: `taskWorkflows.query` and `page` have no app caller (still tested).

## 7. Finding (not changed)
Bulk status to Done depends on selection order. Tested on the live path: with B depending on A, selecting A then B completes both; B then A fails with "Complete dependency tasks first: A". `bulkUpdate` (kept) does not have this problem but does not place cards in board lanes, so it is not a drop-in fix.

## 8. Acceptance (device)
1. Board > Board tools > Card age on: open cards show "Updated Nd ago"; Done cards show none.
2. Timeline: drag and resize a bar: dates and history text as before.
3. Portfolios and Resources screens open normally.

## 9. Rollback
Restore `src/model.cjs`, `src/operations.cjs`, `src/screens/Board.js` and the six edited test files (board, gantt, model, operations-boards, project-navigation-timeline, scheduling-integration) from niyarvo_0_5_19.zip; delete `tests/batch3-dead-model-0520.test.cjs`.
