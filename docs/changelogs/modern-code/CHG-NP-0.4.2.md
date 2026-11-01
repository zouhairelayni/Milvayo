# CHG-NP-0.4.2 — MockDesign migration and model handoff

> Product: **Niyarvo Projects** (standalone project-management app; NOT RIVNA or the Control Center).
> Date: **2026-10-31**. Input source: `NiyarvoProjects-v0.4.1-FINAL.zip`; UI reference: `MockDesign.zip`.
> Delivery: **v0.4.2 source QA candidate**, not a production release or a claim of device acceptance.

## 0. READ FIRST — handoff

| Field | Result |
|---|---|
| Baseline | v0.4.1 FINAL; preserved as `ClassicApp.js` |
| New entry point | `App.js` → `ModernApp.js` (default); Settings → Advanced workspace opens original UI |
| Storage | Same AsyncStorage key **`niyarvo-projects-v1`**; no remote sync or new DB |
| Project export | Original `niyarvo.project.v1` format; original workspace wrapper export supported |
| User data migration | **In-place, non-destructive**. The first read normalizes existing workspace; no mock data injected into existing installs. All edits write canonical original schema. |
| UI features | Redesigned workspace, new Kanban boards/lists, card and list drag/reorder, task sheet, timeline bar move/resize, dependency linking, and overview/secondary screens |
| Original advanced functionality | Available unchanged in `ClassicApp.js`; not fully recreated in the new shell |
| Automated test result | **PASS: 327/327** tests (`npm test` / `node --test tests/*.test.cjs`) |
| JS/JSX syntax | **PASS:** TypeScript JSX parser over 27 JS files; 0 errors |
| Expo Web bundling, Android/iOS launch, drag gestures on device | **NOT RUN / NOT VERIFIED** in this environment |
| Git status / deployment | No commits, merges, remote deployments or APK builds performed |

## 1. Implementation inventory

### Canonical persistence and business logic

- `src/modernBridge.cjs` projects the original model to `MockDesign` view data, and routes mutations through the original domain operations.
- `src/store.js` replaces prototype-only in-memory state. Reads the existing local key and validates the entire updated workspace before persisting. Save/load failure is visible; corrupt data is **not** overwritten with sample data.
- `src/boards.cjs` persists board-level lists (`id`, `name`, `status`) and archived state in the original `niyarvo.project.v1` schema, keeping old boards without lists compatible via non-mutating default lane projection.
- `src/model.cjs` preserves `listId` on normalization and clears association when a task changes status.
- Existing domain modules for task dependencies, schedule validation, automations, releases, sprint history, time ledger, portfolio, custom fields, and backup recovery remain the authoritative source.
- No additions to package dependencies. The baseline Expo SDK and Metro architecture remain in place.

### MockDesign presentation and behavior

- New default `ModernApp.js` with redesigned responsive navigation, project switching and modern visual language.
- New `src/screens/Board.js`: create/rename/archive/delete boards, create/rename/reorder/delete lists, touch-hold card movement, list reordering, and lane-specific card creation. Delete-list moves tasks rather than deleting them. Destroying a board returns its tasks to Main; an automatic workspace snapshot precedes board deletion.
- New `src/screens/Timeline.js`: Days/Weeks/Months, horizontally page-able 56-day window, 120 scheduled rows per page, timeline bar move/start/due resize, curved dependencies, dependency creation/removal, and explicit unscheduled-task list. Date edits are validated and routed through existing scheduler.
- New `src/screens/TaskSheet.js`: edit status, priority, stage, owner, dates, effort, task type, dependencies, parent/release/sprint associations, labels, custom fields, URL attachments, comments, acceptance checks **with evidence**, verification and recorded merge information.
- New modern secondary screens display persisted sprints, releases, testing, resources, costs, portfolios, automation and audit data. CSV and JSON exports use the original model and real browser download/native sharing, rather than fake prototype confirmation.
- `ClassicApp.js` stays available as **Advanced tools** for detailed scheduling, imports, field definitions, reports, task flows and other 0.4.1 workflows not yet brought into the modern design.
- Existing UI-specific regression tests that intentionally verify the original shell now load `ClassicApp.js` rather than treating it as removed functionality.

## 2. Preservation and data safety

- Existing task IDs, dependencies, release/sprint links, checked evidence, comments, custom values, saved views, time entries and historical reports remain in the normalized workspace model.
- All changes pass `model.normalizeWorkspace()`; dependency cycles, invalid dates, impossible task transitions and release gates are enforced.
- Model gate semantics **do not execute external test suites or Git merges**. Verification and merge flags are evidence/record-keeping, not GitHub actions.
- `ModernApp` and the classic workspace **use the same persistent key**. The settings switch awaits pending modern writes before remounting the original shell.
- A snapshot is taken automatically before board deletion, project import and manual snapshot recovery. **Export a manual workspace backup before first upgrade**, since data is still local-first.
- Neither the RIVNA repository nor any unrelated Firebase environment was touched.

## 3. Verification performed

| Validation | Status | Evidence |
|---|---|---|
| Existing model regression tests | PASS | Node suite |
| 17 newly added bridge tests | PASS | `tests/modern-bridge.test.cjs` |
| Total suite | **PASS — 327/327** | `node --test tests/*.test.cjs` |
| Modern JS/JSX parse | PASS — 0 parse errors across 27 files | TypeScript JSX source parser |
| Real 73-task Atlas import/round trip | PASS | Bridge fixture test |
| Migration persistence and list ordering | PASS | Bridge round-trip tests |
| Blocked Done/drop, dependency cycles, invalid dates | PASS | Bridge + original model tests |
| Acceptance evidence, verification/merge flag invalidation | PASS | Bridge tests |
| Sprint historical reconcile and logged cost snapshot | PASS | Bridge tests |
| `npm ci` / Expo dependency install | **NOT VERIFIED** | Install stalled in this environment; no confirmed complete Expo install |
| `npx expo install --check` | NOT RUN | Requires working Expo installation |
| Expo Web bundling/browser interaction | NOT RUN | No runtime evidence provided |
| Physical Android/iOS: hold drag, auto-scroll, keyboard, file share | NOT RUN | Device acceptance required |

Note: The original v0.4.1 browser/device evidence does **not** carry over to v0.4.2's new shell. The source-level suite is not a substitute for runtime checks.

## 4. Known differences, limitations and acceptance risks

1. **Runtime gate:** Expo SDK 58 app bundle and device behavior are unverified; do not deploy before your Termux and Expo Go/Web smoke tests.
2. **Large timelines:** The new shell renders a paged 56-day time window and 120 scheduled rows per page; tasks outside the visible time window remain stored and become visible via paging. Unscheduled tasks are listed separately.
3. **Large boards/tasks:** The new shell uses progressive “Show more” groups for large lanes and task lists. Review drag/drop placement after filtering/loading additional cards on your real data.
4. **Parity:** The modern shell is not yet a full replacement for every advanced v0.4.1 planner, schema editor or data-management surface. The preserved ClassicApp provides those workflows.
5. **Native files:** Browser downloads and native share sheets are implemented, but real OS permissions, save destinations, and round-trip imports must be verified on devices.
6. **Local-only:** No multi-user sync, server-side security rules, GitHub actions or production hosting changes are claimed.

## 5. Termux installation (keep rollback available)

**Before modifying your working folder:** In v0.4.1 export a full **workspace JSON backup**. Keep a copy outside the app folder; copy the existing source directory as a rollback point.

```bash
# From the existing ~/NiyarvoProjects directory, after making a copy/backup:
# Extract the v0.4.2 ZIP CONTENTS directly into the project root.
# Do not remove .git or Android local storage.
npm install
npm test
npx expo install --check
npx expo start --clear
```

Use Expo Go on Android and the Expo Web entry point. Test board creation, card drag, list reorder and deletion, timeline resize/dependency link, task edits, project switching, JSON backup import/export and restoring advanced mode. Review runtime errors before accepting.

**Rollback:** Stop Metro, restore the backed-up **v0.4.1 source** (no `git push --force`). Preserve device app storage, and if necessary restore your exported workspace JSON via the previous working UI. Do not clear AsyncStorage or uninstall to troubleshoot.

## 6. Next model instructions

1. Start with this changelog, `AGENTS.md`, `.opencode/skills/unslop/SKILL.md`, and the entire v0.4.2 source ZIP.
2. Get real Web + Expo Go Android acceptance evidence, particularly gestures and export; fix observed issues without refactoring canonical domain semantics.
3. Use the modern shell's design language as the UI authority while preserving ClassicApp as a fallback until advanced workflow parity is proven.
4. Expand bridge/interaction tests for any fixed bug; log observed facts and tested statuses in the next `CHG-NP-[VERSION].md`.
5. Do not commit or merge to `main` until the user has tested and explicitly approved.
