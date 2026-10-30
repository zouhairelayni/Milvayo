# CHG-NP-0.2.1 — Project navigation, Kanban auto-scroll and Gantt interactions

**Application:** Niyarvo Projects (independent).  
**Source base:** `NiyarvoProjects-v0.2.0-LOCAL-QA.zip` (not the user's unshared subsequent Termux changes).  
**Patch classification:** Local QA candidate, **not** a stable release.  
**Target Git branch:** `work`. Do not commit or merge into `main` before runtime acceptance.  
**Date:** 2026-10-30.

## 0. Read first

This patch preserves the existing Expo SDK 58 + React Native architecture and the local AsyncStorage key `niyarvo-projects-v1`. No project data was imported, no unrelated repositories/credentials were used, and no Firebase account/project was connected. It is intended to be extracted into the already-existing `~/NiyarvoProjects` working directory while on `work`.

**Important evidence distinction:** 25 pure Node/model tests pass and App.js parses as JSX with TypeScript's parser. Web browser gesture behavior, Android touch interactions, portrait/landscape UI, and iOS have **not** been executed in this container. Source-level validation must not be called end-to-end testing.

## 1. User-reported results and fixes

| Report | Code change | Status |
|---|---|---|
| Sidebar dropdown opens workspace Settings instead of switching project | Replaced dropdown handler with a dedicated project-picker modal containing active project rows | Implemented, runtime QA pending |
| Create/manage mixed together; no archive | New-project form has name/code/description + JSON import. Separate manage form has save changes, export, archive, delete. Archived projects appear under Restore in picker | Implemented; unit-tested archive state |
| Top controls too close to top | Increased header/top content spacing | Implemented, device QA pending |
| Desktop web shows bottom nav in smaller windows | Desktop layout activates at web width >= 860 px; no bottom navigation in that layout | Implemented, viewport QA pending |
| Drag cannot auto-scroll from first to last lane | Auto-scroll interval while finger is near board viewport edges; scroll offset used for destination lane detection; drag ghost overlay; dynamic card heights used for insertion order | Implemented; edge/lane calculation unit-tested, gestures pending |
| Portrait timeline scrambled; landscape lacks Gantt interaction | Reworked horizontal timeline table with responsive task column, 7/14/30/90-day zoom, bars that move by dragging, right-end resize handle, date nudge, link dialog, and rendered predecessor connectors | Implemented; resize/dependency model tests, rendering/gestures pending |
| Deleted task recovered | Previous local snapshot flow retained | No change; user reports tested |

## 2. Files changed

- `App.js`: project picker, create/edit dialogs, top spacing, responsive desktop breakpoint, board auto-scroll/ghost, improved Gantt and dependency picker.
- `src/model.cjs`: archived project state, project switch/archive/restore safeguards, timeline resize, board drag-scroll calculation helpers; workspace import rejects all-archived workspace.
- `schemas/niyarvo.project.v1.schema.json`: optional boolean `archived` field.
- `tests/project-navigation-timeline.test.cjs`: 9 regression tests for navigation, archive/restore, resizing, edge scrolling and lane calculation.
- `package.json`: v0.2.1 package version, no new dependencies.
- `README.md`, `docs/CHG-NP-0.2.1.md`: usage and handoff.

## 3. OpenProject reference review

Reviewed the user-provided `openproject-17.9.6.zip`, including its `LICENSE`, relations contract/service tree, and Gantt modules. The project includes GPL-3.0 licensed code. **No OpenProject source code was copied into this patch.** Concepts (work item dependencies, predecessor connectors, and schedule manipulation) were reimplemented independently in React Native/JavaScript. Do not merge copied OpenProject code without deliberate license review.

## 4. Verification actually run

- `node --test tests/*.cjs`: **25 passed / 0 failed**.
- TypeScript JSX source parser: **0 parse diagnostics** for `App.js` and `src/model.cjs`.
- `npx expo start`: **Not run here** (dependencies were not present in the package checkout).
- Expo Go/Android touch: **Not run**.
- Expo Web desktop/mobile: **Not run**.
- iOS: **Not run**.
- Cloud Firebase/Hosting: **Not connected, not run**.

## 5. Targeted manual QA in Termux (gate before commit)

1. `git switch work` and verify a clean working tree; export a workspace JSON backup under **Backups**.
2. Extract v0.2.1 ZIP at project root; run `npm install`, `npm test`, `npx expo install --check`, `npx expo start`.
3. **Sidebar desktop:** open dropdown, switch among at least 2 projects, confirm each project has its own tasks; use New project form, Edit/Manage form, Export; archive a nonfinal active project and restore it; verify changes persist after reload.
4. **Mobile sidebar:** repeat project selection through menu and header shortcut; confirm create/manage form options are separate and top buttons are not obstructed by status bar.
5. **Board:** move a card across all four lanes in a single gesture; keep the pointer at an edge without releasing; verify scroll continues; test within-lane ordering and center no-scrolling; test touch + mouse; tap card and use status fallback; verify blocked-to-Done guard.
6. **Timeline:** portrait and landscape; open 7/14/30/90-day zoom; pan horizontally to day columns; drag a bar to reschedule, resize the right edge, link/unlink predecessors and inspect the connector lines; close and reopen and check dates/dependencies remain.
7. **Regression:** delete and restore a task from a snapshot; project import/export/backup roundtrip; restart Expo Go, check persisted projects; verify workspace JSON exported before archive/restore can be imported.
8. **Web desktop:** with browser viewport >=860 px, confirm sidebar and no bottom navigation. Test narrower mobile web separately.
9. Save evidence and log failures **before** committing this QA candidate. Merge into main only after acceptance.

## 6. Known limitations / follow-up scope

- Auto-scroll and gesture handling use PanResponder + timers; cross-platform touch and browser pointer interaction must be observed. Ghost preview and Gantt link connector placement may require device-specific tuning.
- Timeline supports finish-to-start prerequisite relationships (`dependsOn`), rather than configurable dependency types/lag, critical path calculations, baseline comparisons, milestones, task groups, or resource leveling.
- Attachment support still consists of URL references. Binary files require separate Firebase Storage integration and access control.
- No OAuth, team roles, real-time sync, cloud backups, file uploads, scheduled server automations, notifications or GitHub API integration in this patch.
- The user's *newly mentioned* separate desktop `.png` attachment could not be found in the accessible source resources; the existing v0.2.0 dark desktop layout/reference is retained. No unverified new screenshot design was applied.

## 7. Checkpoint protocol

```bash
cd ~/NiyarvoProjects
git switch work
git status --short
# Export your workspace backup before replacing files
unzip -o ~/storage/downloads/NiyarvoProjects-v0.2.1-LOCAL-QA.zip -d .
npm install
npm test
npx expo install --check
npx expo start
```

After the user has manually accepted the patch on Web and Android, commit to `work`, push `work`, then merge using a verified Git checkpoint. Do not create a release tag while the runtime QA gate is open.
