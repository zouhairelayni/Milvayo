# Niyarvo Projects — CHG-NP-0.2.9

## 0. READ FIRST — technical handoff

| Field | Observed status |
|---|---|
| Project | Niyarvo Projects (independent application) |
| Version | v0.2.9 — OpenProject architecture survey + planning foundation |
| Previous baseline | v0.2.8 source archive provided in project |
| Git branch | User's `work` branch recommended; no Git operations performed here |
| Target framework | React Native + Expo SDK 58, Metro via `npx expo start` |
| Auth/cloud | Local only. Firebase `niyarvoprojects`, Android `com.niyarvo.projects` not connected/deployed |
| Automated tests | 163/163 passing (133 existing, 30 new) |
| JSX parse | `App.js`, `GanttView.js`, `SchedulingPanel.js`: clean using TypeScript JSX parser |
| Actual Android/Web runtime | Not run in this environment; must verify via Metro and Expo Go |
| Source of external concepts | OpenProject 17.9.6 archived source; **no code copied** |
| UI design discipline | User-provided Unslop guidelines applied to modified Tasks controls, separate audit below |

## 1. What was implemented

- Added `src/planning.cjs`, a standalone side-effect-free planning/query engine.
- Per-task `progress` (integer 0–100) and `estimateHours` (numeric 0–100000) persisted in existing `niyarvo.project.v1` format, no format-version bump.
- Calculated parent and project progress from *leaf tasks* only. Weight = leaf estimated hours if positive, otherwise one unit. Completed (`Done`) leaf tasks contribute 100%; uncompleted leaves use manual percentage. Intermediate nodes do not contribute additional weight.
- `updateTaskPlanning` command validates input, makes no changes on no-op/invalid commands, invalidates verification/merged evidence of affected ancestors and scheduling-dependent tasks, and reopens affected Ready/Released records to Testing.
- Per-project saved task views with name, status/priority/owner/text filters and sort key. Sorted query results do not mutate the stored task order. Maximum 50 saved views.
- Tasks UI: saved view picker, save/update/delete named view, collapsible filter/sort controls, read-only rollup percentage on parents and editable leaf progress & estimated hours. Existing Kanban and Gantt components are untouched.
- Dashboard: additional Work progress tile.
- Project JSON schema extended with optional progress, effort and saved view properties. Legacy files with none of these still normalize safely.
- Source-based 63-capability inventory covering all 30 OpenProject top-level modules and core services in `docs/NP-OPENPROJECT-CAPABILITY-MAP-v1.md`.

## 2. Files changed/added

| Path | Change |
|---|---|
| `src/planning.cjs` | New rollup/query/mutation engine |
| `src/model.cjs` | Backward-compatible fields, saved view normalization, export |
| `App.js` | Tasks views, progress editing, project progress UI |
| `schemas/niyarvo.project.v1.schema.json` | Optional persisted fields and saved views |
| `tests/planning.test.cjs` | 30 additional tests |
| `package.json` | Version 0.2.9 |
| `docs/NP-OPENPROJECT-CAPABILITY-MAP-v1.md` | 63-domain-entity/capability audit with paths |
| `scripts/build-openproject-inventory.py` | Reproducible source path index from user-supplied ZIP (not runtime-dependent) |
| `docs/NP-QA-0.2.9.md` | Runtime acceptance plan |
| `docs/UNSLOP-NP-0.2.9.md` | UI design redline record |
| `docs/CHG-NP-0.2.9.md` | This handoff |

## 3. Business rules and limits

- No implicit task status transition when progress is set to 100%. Setting Done marks its **effective** progress as 100% but does not verify or merge it.
- Parent progress is derived, not stored; users edit leaf tasks. Parent percentages are not reified into child status.
- A leaf with zero/unspecified estimated effort has weight 1; otherwise its numeric estimated hours are used as weight. This is a **Niyarvo convention**, not a claim about OpenProject's exact aggregation algorithm.
- Saved queries are project-scoped and local, with up to 50 per project. Saved views do not change task IDs, positions or statuses. UI saves the current filter and sort; descending sort is supported by engine/storage but not exposed in UI in this batch.
- This version does not implement timesheets, actual worked hours, custom fields, roles, external storage or server synchronization. Those are independently mapped for future work.
- The source ZIP is a **local QA candidate**. Do not call it device-accepted or production ready based only on model tests.

## 4. Verification evidence

- `node --test tests/*.test.cjs`: 163 passing, 0 failed.
- `node scripts/schedule-smoke.cjs`: **passed** in the authoring environment, 2 planned successor movements, zero conflicts, source project unchanged.
- JSX parser: no diagnostics for the three JavaScript/JSX entry components.
- App bundling, actual drag gestures, form interactions, Android and iOS runtime: Not run / not verified here.
- Firebase: not configured, not deployed, rules not deployed. No connections to RIVNA or Niyarvo Control Center.
- OpenProject source inventory scanned locally from supplied ZIP. Paths verified as existing in the archived tree, but not every upstream feature's runtime logic was executed.

## 5. Known limitations / next batch

- Saved views and progress controls require Android/Web runtime QA. Top-level task query is progressively loaded but not virtualized.
- Rich OpenProject-style task types, custom fields and allowed workflow transitions are not yet implemented; these are a recommended v0.3.0 domain layer.
- Progress per project assumes additive, non-overlapping leaf task work; historical time logs, currency and resource utilization are not yet modeled.
- Future Firebase permissions must be server-authoritative. No client-only role restriction should be misrepresented as security.
- If another model has redesigned `App.js`, merge our new hooks and Tasks UI deliberately, rather than overwriting the redesigned file; `src/planning.cjs` and `src/model.cjs` are the canonical business changes.

## 6. Safe Termux release workflow

1. Export your current workspace JSON, then check `git switch work` and `git status --short`. Do not overwrite uncommitted changes.
2. Extract the full ZIP at the project root. It contains no enclosing project folder or `.git` directory.
3. Run `npm test`, `npx expo install --check`, `npx expo start`.
4. In Expo Go and web, verify creating/editing/saving task views, progress rollups, source changes, project switching, import/export and restore.
5. Verify Gantt move/resize/connectors and Kanban drag still work. Create a stable checkpoint only after tests pass.
6. No GitHub merge or Firebase deployment until runtime acceptance.
