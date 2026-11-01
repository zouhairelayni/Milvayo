# CHG-NP-0.5.1 — One modern app, legacy business-domain parity

**Project:** Niyarvo Projects (not RIVNA, not Niyarvo Control Center)
**Baseline:** `NiyarvoProjects-v0.5.0-TIMELINE-SVG-TOUCH-QA.zip`; legacy reference `v0.4.1-FINAL`
**Release type:** Source-level QA candidate, *not Android/iOS runtime accepted*
**Date:** 2026-10-31
**Package:** `NiyarvoProjects-v0.5.1-SINGLE-APP-MIGRATION.zip`
**Git commit/deploy:** Not performed

## Read first

- The single entry `App.js` now mounts `ModernApp` only. `ClassicApp.js`, the Settings → Advanced workspace route, and unused legacy UI panels are absent. Original domain modules remain intentionally active as business-rule authority.
- Previously legacy-only workflows now have modern access via the normal drawer, compact expandable settings, and task-sheet inline editors. The five mobile primary tabs remain Overview, Board, Timeline, Tasks and Sprints.
- One workspace / one AsyncStorage key: `niyarvo-projects-v1`; no incompatible project-JSON migration.
- `package.json`, `package-lock.json`, and `node_modules` are **deliberately omitted** (user preserved locally fixed `expo-font`). Extraction into a clean folder retaining those three items is supported; this is not a from-scratch dependency install package.
- Historical changelogs are under `docs/changelogs/legacy-code/`, modern merge history under `docs/changelogs/modern-code/`; duplicate root changelogs and redundant older QA file copies are gone.

## Integrated business workflows

| Area | v0.5.1 interface/behavior | Business rules and safety |
|---|---|---|
| Project administration | Create, edit, switch, archive/restore, duplicate as template, delete | Original workspace/project model, last-accessible-project guard, snapshot before destructive delete |
| Board | Boards/lists/tasks, card reorder, rename, board view preferences, Power-Ups, GitHub reference links | Original boards/kanbanUX/powerUps functions; normalized data/IDs preserved |
| Tasks | Inline task details, safe duplicate/delete, subtasks, parent relations, progress/effort, typed custom values, saved views, bulk status | Original planning/taskSchema/taskWorkflows logic for guarded fields, relation cycles and verification invalidation |
| Schedule | Project calendar, typed dependencies, lag, schedule preview and guarded apply | Original scheduleProject module and recovery snapshot for calendar and schedule apply |
| Agile | Sprint create/edit/assign/start/finish/delete/history/burndown | Original agile module; pre-finish and pre-delete recovery snapshots |
| Release/testing | Create/edit/delete releases; release gate status; check evidence, verification/merge | Release-gate checks, snapshot before release delete |
| Resources/cost | Contributor management, time logs, budget/currency, time CSV, cost/remaining | Original operations.costSummary leaf-task accounting (avoids parent/child estimate double count) |
| Portfolios | Create/edit/delete/membership/health | Original operations portfolio model |
| Collaboration | Local comments and local reminders | Original operations model; no push-notification promise |
| Automation | Command editor, status/card/board/due triggers, history/manual runs | Original automation model; status transitions invoke engine after validated mutations |
| Specifications | Phases, schemas, API contracts, playbooks from project import | Data displayed from imported project, no destructive schema rewrite |
| Recovery | Project import/export, whole-workspace backup/restore, snapshots, restore controls | Explicit whole-workspace operation plus snapshot of prior workspace; original storage key |
| Diagnostics | Local crash/performance reports | Local-only reporting, not native FPS profiler |

## Design and branding

- Preserves dark/light MockDesign visual language and compact inline disclosure pattern; avoids a secondary application shell.
- In-app brand mark and wordmark, 1024px launcher icon, Android adaptive foreground, splash artwork, iOS icon, PWA manifest icons and favicon use the supplied centered Niyarvo brand kit.
- Timeline continues as a **single scrollable task list** with viewport-clipped SVG paths; no segmented rows or Previous/Next paging.
- Removed the automatic initial Today jump (which could make bars appear, then disappear following first layout); Today remains a user-initiated action.

## Correctness and risk controls

- Restored domain-authoritative progress validation; Done task progress and parent rollups no longer rely solely on unrestricted object patches.
- Restored legacy cost calculation; blank due dates excluded from overdue classification.
- Destructive project, task, release, sprint, board actions retain or create recovery snapshots where implemented.
- Source imports and navigation audited: no `ClassicApp.js` or second Settings entry; no duplicate `package.json` shipped.

## Tests and observed limitations

- Node source/domain tests: **369/369 passed** (`node --test tests/*.test.cjs`). TypeScript parser syntax check: **59 source JS/JSX files, 0 parse errors**. **Expo Go/Web runtime QA: Not run here.**
- Final syntax audit caught and corrected malformed whole-workspace-backup JSX in `src/screens/Backup.js` before packaging.
- Android user previously reported that v0.5.0 Timeline stayed open but dependency SVGs flickered, and Board navigation/drag was slow. Source changes specifically target the Timeline initial automatic scroll; **flicker and performance are not device-verified fixed**.
- iOS hardware gestures, Android memory/ANR, real native chart drawing and drag feel: Not verified.
- Future connected services (remote sync, push notifications, real GitHub automation, multi-user permissions) were not implemented by v0.4.1 and are not falsely represented as migrated.

## Device acceptance gate

1. Back up the entire workspace in the current build, retain source ZIP and local dependency files.
2. Extract v0.5.1 at `~/NiyarvoProjects` and confirm `package.json` and lockfile hashes are unchanged.
3. Run `npm test`, `npx expo-doctor`, `npx expo start --clear`. Check all five tabs and every drawer screen.
4. In Android Expo Go, verify Timeline task bars/dependency curves persist after 1 second, scroll all scheduled tasks, edit dates and dependencies. Test Board horizontal/vertical scroll, tap/double-tap/long press/drag and 30-second stability.
5. Verify project and full-workspace backup→import/restore round trips, Sprint finish/delete snapshots, release gate checks, task progress validation, time/cost results, and saved automation triggers.
6. Do not merge to `main` until all runtime blockers are resolved and accepted.

**Handoff:** domain logic is under `src/*.cjs`; modern adapter/store `src/modernBridge.cjs`, `src/store.js`; single UI `App.js`, `ModernApp.js`, `src/screens/*.js`. Archive history under `docs/legacy-code/` and `docs/changelogs/` is documentation only, not executable UI.
