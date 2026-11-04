# NP-0.5.16 — Dead code / dead control audit

Method: static only (TypeScript AST + cross-reference of every store API key, export and `.cjs` function, JSX controls, unused state and props, undefined identifiers). Browser/Expo Go behaviour: **Not run**.

## Clean results (no action)
- No Button / IconBtn / Chip / MiniBtn / Pressable / Segmented without a handler. No empty `onPress`.
- No handler calls an undefined function; no screen destructures a store member that does not exist.
- Governance fixes from 0.5.16 (Open project, Edit portfolio/program, Duplicate) are not repeated here.

## Batch 1 — Controls that do nothing or only half work (fix first)
| # | Where | Problem | Fix |
|---|---|---|---|
| 1.1 | Board → Board tools → "Upcoming dates" (`calendar` Power-Up), `Board.js:229`; card render `Board.js:645-647` | The toggle saves, but TaskCard only renders `aging`, `checklist`, `github`. Nothing ever appears for `calendar`. | Render a due-date line on cards when `features.includes('calendar')` (reuse `powerUps.dueSoon`). |
| 1.2 | Tasks → Saved task views, `Tasks.js:74-75` | Saves `priority:'All'` and `owner:'All'` as constants (no such filters exist), and does not save or restore the tag filter. Applying a view can give a different list than the one saved. | Save/restore `labelFilter`; drop `priority`/`owner` or add those filters. |
| 1.3 | Costs → Budget settings, `Workspace.js:59` | `editingBudget` / `setEditingBudget` declared, never used. | Delete the state. |

## Batch 2 — Store API with no UI caller (`store.js`)
| API | Note |
|---|---|
| `moveList` (line 96) | Superseded by `moveListTo` (used by Board drag). Remove. |
| `moveTaskToList` (line 113) | No caller. Remove, or wire into a "Move to list" action on the task sheet. |
| `setGovernanceDoc` (line 172) | No caller (`setGovernanceDocValue/Status` are used). Remove. |

## Batch 3 — Tested model functions the UI never calls (screens re-implement inline)
These pass tests but are not referenced by any screen or store. Decide per module: delete with their tests, or switch the screen to use them.
- `kanbanUX`: filterCards, dateBucket, resolveDropIndex, updateLabels (Board uses `boardDragMath.cjs` and inline filtering).
- `planning`: filterSort, progressRollups, projectProgress (Tasks.js sorts/filters inline, lines 30-36).
- `taskWorkflows`: bulkUpdate, descendants, hierarchyOrder (store has its own `bulkStatus`).
- `powerUps`: fetchPublicPreview, setPreview, dueSoon, ageInDays, endpoint, normalizeLink, parseGithubUrl (GitHub reference previews cannot be refreshed; ageing is computed inline in TaskCard).
- `operations`: capacitySummary, portfolioStats.
- `importFiles`: readPickedJsonAsset, pickAndroidJsonText, validatePickedAsset, userReadableImportError (Backup.js only uses `MAX_IMPORT_BYTES` and does its own DocumentPicker flow).
- `model`: stats, demoProject, blankProject, shiftTask, resizeTask, boardLaneAt, boardAutoScrollDelta (Timeline uses `timelineEdit.cjs`, Board uses `boardDragMath.cjs`).
- `agile.normalizeSprint`; `scheduleProject.normalizeCalendar/KINDS`; `taskSchema` normalizeType/Field/Workflow/validateTask; `governanceCore.validateWbs`; `modernBridge.taskList`; `projectRelations` tasksOf/linkedProjects/programPortfolios (internal only).
- Timeline helpers with no app caller: `gantt-window` visibleRows/visibleDays/visibleLinks, `progressiveCount.initialCount`, `timelineWindow.pageRows`, `viewport` zoomWidth/touchDistance/anchorScroll/dragDelta/fitWidth/edgeVelocity/contactPoint/canvasPointer/viewportLocal, `gantt` buildRows/layoutRows/hierarchyRows/criticalPath/etc. (Timeline.js builds its scene another way). Confirm whether Timeline should use these before deleting.

## Batch 4 — Unused leftovers (low risk)
- Unused exports: `theme.js` LIGHT, DARK; `data.js` toISO, rateFor; `governance/pm.js` RISK_LEVELS, PROGRAM_PHASES, BENEFIT_STATUS, summaryOf, worstHealth, blankPm, normalizePm. `wbsviews.js` treeScene/fishboneScene/mindScene are only used through `sceneFor` (the `export` can go).
- `Timeline.js:21` `SPAN` never used.
- `IslandNotice` prop `wide` accepted and ignored (ModernApp passes it).
- `design.cjs`: only referenced by `tests/theme.test.cjs`; has a type error (`accentDim` does not exist, line 20). Legacy file — delete with its test or fix.

## Not covered
Runtime-only dead ends (state that never changes, conditionally hidden controls, gesture paths) need Expo Go / browser testing; static analysis cannot see them.

## Suggested order
Batch 1 (3 small fixes) → Batch 2 → Batch 4 → Batch 3 (largest; needs a keep/delete decision per module).

## Batch 3 status (0.5.20)
Re-checked against the 0.5.19 code. "No caller" was not treated as "dead": each function was compared with what the screen does instead.
- **Removed (superseded, verified):** `model` shiftTask, resizeTask (Timeline uses `timelineEdit` + `patchTask`), boardLaneAt, boardAutoScrollDelta (Board has its own edge-scroll), stats, blankProject (nothing used them); `operations.portfolioStats` (projectView and the Portfolios screen compute the same health and counts).
- **Kept: tested logic for features the UI does not expose yet:** `kanbanUX` filterCards, dateBucket (due-date, owner, priority, tag filters; Board only has a text filter), resolveDropIndex, updateLabels (trim, dedupe, cap; live path does not clear verified on label change); `taskWorkflows` bulkUpdate (bulk priority/stage/owner, blockers checked against proposed statuses), descendants, hierarchyOrder (no tree view; subtasks are a flat list in the task sheet); `operations.capacitySummary` (counts logged hours; Resources ignores them).
- **Wired:** `powerUps.ageInDays` drives the Board card age line.
- **Stale audit entries:** `dueSoon` (used since 0.5.17), `pickAndroidJsonText` / `userReadableImportError` (used since 0.5.19), `demoProject` (used by `createWorkspace`).
- **Kept, needs a product decision:** `powerUps` fetchPublicPreview/setPreview/endpoint (no Refresh button); `importFiles` readPickedJsonAsset/validatePickedAsset (not used by the iOS picker path); `planning` filterSort/progressRollups/projectProgress; all Timeline helpers (`gantt`, `gantt-window`, `viewport`, `progressiveCount.initialCount`, `timelineWindow.pageRows`).
- **Kept, internal use only:** `agile.normalizeSprint`, `scheduleProject` normalizeCalendar/KINDS, `taskSchema` normalizeType/Field/Workflow/validateTask, `governanceCore.validateWbs`, `modernBridge.taskList`, `projectRelations` tasksOf/linkedProjects/programPortfolios.
