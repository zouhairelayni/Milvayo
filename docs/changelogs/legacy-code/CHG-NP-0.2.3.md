# CHG-NP-0.2.3 — Gantt Direct Linking + Critical Path (LOCAL QA)

## READ FIRST

| Item | Observed state |
|---|---|
| Project | Niyarvo Projects (standalone; unrelated to RIVNA or Control Center) |
| Parent | v0.2.2 LOCAL-QA source ZIP, as supplied in the conversation |
| Current patch | v0.2.3, local QA candidate |
| Git | No Git commands, commits or merges executed in user repository |
| Metro / devices | Not run in this environment |
| Firebase | Not connected, no deployment |
| Roadmap imports | Not performed |

## User-verified prior behavior

User confirmed v0.2.2 whole-card Kanban drag and Gantt bar move/resize, and located predecessor editor. Those interactions have not been changed by this patch.

## Changes

- `src/gantt.cjs`: pure calendar-day CPM (topological earliest/latest pass, float, critical tasks/edges). Excludes unscheduled tasks and rejects cycles; does not rewrite tasks.
- `src/gantt.cjs`: independent coordinate hit-testing for connecting from a source bar to a scheduled successor bar; excludes self and empty release points.
- `src/GanttView.js`: Gantt right-end connector affordances; drag connector onto another bar, or tap connector then a successor bar; cancel + feedback states. Existing list-based dependency editor retained. Critical-path overlay toggle highlights task outlines/edges and displays assumptions.
- `tests/critical-link.test.cjs`: seven new deterministic tests, including graph edges, milestones, empty and cyclic input, missing dates, gesture target detection, and import invariants.
- `AGENTS.md` and `.opencode/skills/unslop/`: repo-wide OpenCode-style rules and full original user-supplied Unslop skill, preserving CC-BY-4.0 attribution. Skill intended to be read on each future build.
- `docs/UNSLOP-NP-0.2.3.md`: before-audit, direction and scoped changes.
- `package.json`: version 0.2.3.

## Constraints / known limits

- Critical path uses nominal task duration in **calendar days** and finish-to-start predecessors; it does NOT apply working calendars, resource leveling, constraints, calendar dates, or actual progress. Its duration estimate is not the committed delivery date.
- Touch-release linking relies on React Native's layout measurement; Web and Expo Go still require QA. Tap-to-link and previous predecessor-selector are fallbacks.
- Native cross-platform gesture behavior and visual accessibility are not device-verified.
- There is no new database schema, dependency type or automatic schedule propagation.

## Test evidence

See `NP-v0.2.3-test-results.txt` and `docs/NP-QA-0.2.3.md`. Regression suite and syntax checks performed in the patch assembly environment; platform runtime checks remain Not run.

## Acceptance gates before merge

1. Back up the local workspace JSON; confirm `work` branch and clean/checkpointed tree.
2. Import v0.2.3. Run `npm test` and `npx expo install --check` in Termux.
3. Test Web and Expo Go Gantt: connector tap-link, drag-link, cancel, duplicate, cycle rejection, unscheduled fallback, zoom, moving/resizing existing bars.
4. Verify critical overlay highlights expected longest chain; task persistence after relaunch; verify Kanban drag unaffected.
5. Save logs/screenshots; fix any runtime issues; commit on `work`, merge into `main` only upon acceptance.

## Next backlog (not implemented)

Working calendars and dependency types (FS/SS/FF/SF + lag), explicit milestone constraints, auto-shift of descendants, scale/performance, Firebase only after local QA milestone.
