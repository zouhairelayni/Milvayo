# CHG-NP-0.2.7 — Scheduling integration release candidate

**Project:** Niyarvo Projects (independent of RIVNA and Niyarvo Control Center)
**Branch:** `work` (expected on developer's Termux device; not changed here)
**Base:** complete source `v0.2.5` + engine patch `NP-SCHED1` (user designates it `v0.2.6`)
**Delivered:** `v0.2.7` complete source ZIP, not yet accepted
**Date:** 2026-10-31
**Firebase/GitHub:** no deployment, push, commit, merge, or remote operations

## 0. Read first — factual handoff

- The NP-SCHED1 `src/scheduling.cjs` engine supports FS/SS/FF/SF, lag, workday calendars and read-only preview/apply. It was previously engine-only.
- This batch wires the engine into **Timeline → Scheduling** and adds durable per-project calendar + typed link metadata, with JSON import/export and snapshot preservation.
- All changes are local. *User must export a workspace JSON before extraction.*
- **No existing project dates are changed during migration or import.** All old dependencies become FS/0 unless a typed link is stored.
- The project's v1 JSON format remains `niyarvo.project.v1` with an optional `scheduling` extension; backup/storage key remains `niyarvo-projects-v1`.
- `App.js` and `src/GanttView.js` changed to integrate the UI. Any downstream UI integrator should diff them instead of blindly replacing their redesign.

## 1. Changes by surface

| Surface | Changes |
|---|---|
| `src/scheduleProject.cjs` (new) | Validated per-project calendar and typed-link normalization, strict import checks, graph reconciliation, read-only audit/preview and safe apply wrapper, downstream verification invalidation |
| `src/model.cjs` | Adds persisted `scheduling` object during normalization, validates and synchronizes metadata, makes task deletion reconcile links and release evidence |
| `src/SchedulingPanel.js` (new) | Mobile-friendly local scheduling modal, workdays and holidays, relation type/lag editors, schedule health, anchor task selector, review/confirm changes |
| `App.js` | Timeline Scheduling action; link from task editor; calendar/link mutations, versioned preview/apply with workspace snapshot, release downgrade after moved tasks |
| `src/gantt.cjs`, `src/GanttView.js` | Draw connectors at anchors matching FS/SS/FF/SF, use typed relationship audit; prevent legacy critical-path / align calculations from being offered on unsupported modes |
| `schemas/niyarvo.project.v1.schema.json` | Optional strict `scheduling.calendar` and `scheduling.links` properties without changing v1 import discriminator |
| `tests/scheduling-integration.test.cjs` | Legacy migration, multi-project isolation, rollback, metadata rejection, edge deletion, evidence invalidation, Gantt anchor geometry |
| `tests/gantt-ui-contract.test.cjs` | Removes outdated v0.2.5-only version assertion |
| `package.json` | Version 0.2.7; no new dependencies |

## 2. Functional rules and limits

1. Calendar is explicit (`calendar` or `workdays`; ISO Mon–Sun weekdays plus `closed`/`opened` exceptions).
2. Task edges remain in `task.dependsOn` and typed metadata lives in `project.scheduling.links`. Every saved relationship is synchronized, with FS/0 default for legacy projects. Orphan/duplicate/malformed typed relationships reject import.
3. Editing a link's type/lag or changing dependencies reopens successor/downstream verification and downgrades affected Released/Ready releases to Testing.
4. Calendar edits do not automatically move dates. Audit flags non-working endpoints and dependency conflicts.
5. Preview never mutates project. Apply requires a current project/revision and a valid preview, creates a local workspace snapshot, moves only successors that need moving, and clears verification on moved tasks.
6. Critical-path estimate remains **calendar-day FS-only**. It is disabled when a project uses working days or any non-FS/0 relationship. Workday resource leveling and a typed-constraint critical path remain out of scope.
7. Project-level schedule controls remain local-first. No Firebase/cloud collaboration, notifications, actual file uploads, or external Git operations are claimed.

## 3. Checks performed

| Check | Result |
|---|---|
| `npm test` (original plus new integration cases) | **PASS — 118/118** |
| Scheduling smoke scenario | **PASS** |
| JSX parse/transpile diagnostics (`App.js`, `GanttView.js`, `SchedulingPanel.js`) | **PASS** |
| Syntax checks for `.cjs` files | **PASS** |
| JSON schema parse and ZIP structure | **PASS** |
| Metro Web bundle in Termux | **Not run** |
| Expo Go Android interaction tests | **Not run** |
| iOS native runtime | **Not run** |
| Git branch checkpoint and merge | **Not run** |
| Firebase deployment | **Not run** |

See `docs/NP-QA-0.2.7.md` and `docs/NP-v0.2.7-test-results.txt`.

## 4. Risks and next actions

- **Device QA required:** Scheduling modal touch targets, nested task picker scrolling, keyboard overlap and Gantt typed-link rendering on small portrait screens.
- **Correctness limitation:** `previewCascade` is push-only. It never pulls a task earlier or overrides explicitly edited anchors; blocked/unscheduled successors require manual correction.
- **Performance:** Current interface is not virtualized for thousands of tasks/links; load-testing large workspaces is still needed.
- **Historical caveat:** The bundled older Gantt critical-path model is not valid for typed non-FS relationships or workdays. The new UI disables that estimate in those modes.
- **Storage:** AsyncStorage snapshots are local device state, not off-device backups. Export project/workspace JSON externally before updating.
- **Next batch:** runtime QA findings; larger workspace performance; advanced task templates, comments and genuine file uploads only when the independent Firebase backend is deliberately configured.

## 5. Verification checkpoint procedure

On Termux, ensure a safe checkpoint of v0.2.6, then extract this complete archive only on `work`. Run `npm test`, `node scripts/schedule-smoke.cjs`, `npx expo install --check`, `npx expo start`. Verify feature acceptance before committing/tagging or merging. Never force-push. This ZIP has its contents at the project root, not under a nested directory.
