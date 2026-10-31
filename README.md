> **v0.3.2-HOTFIX3 local QA:** Android/large-workspace rendering optimization and removal of Overview Kanban. See `CHG-NP-0.3.2-HOTFIX3.md`; device confirmation pending.

# 0.3.2-HOTFIX2 — Android JSON import (QA candidate)

Android now imports JSON through Expo SDK 58 `File.pickFileAsync` (direct Android system-picker file access) instead of trying to read the inaccessible `expo-document-picker` cache file in Expo Go. Web/iOS import paths are unchanged. Source tests: 216/216 passed; Android runtime is **not yet verified**. See `CHG-NP-0.3.2-HOTFIX2.md` and `docs/NP-0.3.2-HOTFIX2-QA.md`. Keep on `work` pending verification; no Firebase connection or deployment.

---

# Niyarvo Projects — v0.3.2 local QA candidate

Built independently on v0.3.1. This batch adds a **per-project Agile sprint planner**: create planned sprints, define a goal and 1–90-day window, assign/unassign tasks, start exactly one sprint at a time, record remaining-work events as task statuses change, view observed (not fabricated) calendar-day burndown, and explicitly finish a sprint while retaining final scope and history. Unfinished work returns to the unassigned backlog without being marked Done. Planned sprint deletion is reversible through a workspace snapshot, and running/completed sprint deletion is blocked.

Open **Sprints** in the sidebar or mobile bottom navigation. Automations remains available in the navigation menu. **Do not assume cloud collaboration**: sprint changes are local only, using AsyncStorage under the unchanged `niyarvo-projects-v1` key. This is not a substitute for a secure Firebase permissions model.

**Data:** project JSON format `niyarvo.project.v1` unchanged; new optional `sprints` array per project and `sprintId` per task. Old projects load with empty sprints; no migration that rewrites task statuses or dates. Project exports, workspace backups and import retain the new metadata. Completed sprint history intentionally retains deleted task IDs as historical references. No automated roadmap imports.

**QA:** automated tests and syntax checks recorded in `CHG-NP-0.3.2.md`. Android/Expo Go, Web Metro and iOS UI interactions must still be tested locally. Use `npm test`, `npx expo install --check`, `npx expo start` in Termux. No new package dependencies are required.

**Next:** separate portfolio reporting, more configurable workflow/action rules, and improved retrospective metrics. Continue using OpenProject only for architectural study; do not copy its source or UI assets. Firebase is not connected or deployed.

---

# Niyarvo Projects — v0.2.8 local QA candidate

Built from v0.2.7, with original task hierarchy, parent/subtask editing, bounded 40-row Tasks and 60-card-per-lane Board rendering, query filters and reversible bulk status/priority updates. Task `parentId` is optional; the `niyarvo.project.v1` import format and `niyarvo-projects-v1` storage key are unchanged. Saved v0.2.7 projects load without migration.

**Validation:** 133/133 Node tests passed in the delivery environment. JSX parse checks passed; real Web/Expo Go/iOS runtime and Firebase deployment were **not run**. See `CHG-NP-0.2.8.md`, `docs/NP-QA-0.2.8.md`, and `docs/UNSLOP-NP-0.2.8.md`.

**Firebase:** User has created a separate project named `niyarvoprojects`, and `app.json` already uses Android `com.niyarvo.projects`. No cloud backend has been connected yet. Confirm actual project ID before configuring/deploying. `docs/NP-FIREBASE-READINESS.md` tracks the boundary.

---

# Niyarvo Projects — v0.2.7 local QA candidate

Independent Expo SDK 58 / React Native project management app for Web, Android (Expo Go) and iOS source. All project data remains local-first in AsyncStorage; no Firebase or GitHub runtime integration. Niyarvo Control Center and RIVNA are **separate applications**.

## Current development state (v0.2.7)

NP-SCHED1 is recognized as **v0.2.6** (standalone engine patch). This v0.2.7 archive contains the **complete v0.2.5 source + v0.2.6 engine + integrated scheduling UI/persistence**, so it can be extracted on the existing `work` branch. No Firebase project or remote Git repository is modified by this archive.

- Open **Timeline → Scheduling** to configure an independent per-project working calendar, weekdays, holiday closures and extra working dates.
- Change any existing predecessor edge between **FS / SS / FF / SF** with signed integer lag (−365 through +365). New and legacy relationships default to FS with zero lag.
- Pick a task that was changed on the Gantt chart or in its editor, then **Preview successor dates**. You must explicitly confirm before affected tasks are moved. Changes are push-only; explicit anchors never shift silently.
- Applying dates creates a local workspace recovery snapshot, checks for stale previews, clears verification/merge evidence of moved tasks, and returns affected Ready/Released release cards to Testing.
- Link edits also reopen downstream verification and reconcile metadata on unlink or deletion.
- JSON project and workspace exports/backups preserve calendar and dependency settings. Old `niyarvo.project.v1` files without these fields remain importable. Imported project dates are never automatically shifted.
- Gantt connectors now honor FS/SS/FF/SF endpoint choice. The legacy critical-path control is disabled when the project uses working-day calendars or non-FS/0 links, because that estimate would be misleading.

**QA status:** Node regression and JSX syntax checks pass in the delivery environment. The app was not interactively run on Expo Go, Web or iOS here, and its scheduling modal is not yet device-verified. Use Metro `npx expo start` in Termux. See `docs/NP-QA-0.2.7.md` and `CHG-NP-0.2.7.md` before acceptance.

## Changes since v0.2.0

- Select active projects from the sidebar workspace dropdown (or the mobile header project shortcut). No trip through Settings.
- **Create project:** separate form for project name/code/description and project JSON import.
- **Manage project:** separate form for edit, export, archive, delete. Archived projects are retained and may be restored from the project picker. Last active project cannot be archived.
- Added extra top spacing on mobile and desktop. Browser width >=860 px uses the desktop sidebar and **does not** show the bottom tab bar.
- Kanban: full-card press-and-hold drag, horizontal edge auto-scroll while dragging, card-position preview, drop-lane detection that includes current scroll offset, and measured card-height ordering. Status edit remains a fallback.
- Timeline: scrollable Gantt chart, task name rail, continuous/preset zoom (see v0.2.5), predecessor lines, task dependency selection, draggable bars to move dates, end handles to resize, date nudge controls and unscheduled task scheduling.
- Note: v0.2.4 introduced `react-native-svg` 15.16.0; run `npm install` before Metro. The `niyarvo-projects-v1` local storage key is unchanged, and `archived` is an optional backward-compatible project field.

## Run in Termux

```bash
cd ~/NiyarvoProjects
git switch work
# Export a backup first, then unzip the candidate at this repository root
npm install
npm test
npx expo install --check
npx expo start
```

Use Expo Go for Android and Metro for Web; avoid static export + Python HTTP server for development.

**Release gate:** v0.2.7 must pass the `docs/NP-QA-0.2.7.md` checklist on Android and Web. The historical v0.2.5 QA claims below describe that older build only.

## Not yet implemented

Cloud Firebase Auth/Firestore sync, permissions, hosted binary attachments, notifications, schedule-triggered automation, comments, team collaboration, offline conflict resolution, resource leveling, critical path for typed constraints, and production iOS tests. The attached OpenProject GPL-3.0 source archive was inspected for conceptual guidance; no source snippets were imported.

## v0.2.2 — Full-card Kanban drag and independent Gantt planner (local QA)

This source is a **local QA candidate**, not an Android/iOS/Web-verified release. Existing workspace data remains in AsyncStorage under `niyarvo-projects-v1`.

- **Board:** Press and hold anywhere on a task card for about 340 ms, then drag. A tap opens the editor. Holding near a viewport edge should auto-scroll the Kanban lanes; this needs touch/mouse QA.
- **Timeline:** A genuine task-row Gantt layout with fixed task labels, horizontally scrollable calendar, Days/Weeks/Months scale, status/stage groups, drag-to-move bars, end resizing, explicit predecessor linking, conflict indicators and milestone diamonds.
- **Unscheduled tasks** remain visible. Use `+ Schedule` on a row. For the bundled Northstar sample only, `Populate example Gantt` creates illustrative dates after taking a recovery snapshot. No real user roadmaps are imported or modified by that sample action.
- **Dependencies:** Existing finish-to-start predecessors can be set in a dialog; use `Align after predecessors` for explicit rescheduling. No background cascading reschedule is performed.
- **Task editor:** The `Milestone` toggle marks a task as a diamond at its due date on the chart.
- **Data integrity:** Edits to predecessor links or scheduling invalidate existing release verification flags for the edited task; project JSON remains backward-compatible.

Run with `npm install`, `npm test`, `npx expo install --check`, `npx expo start`. See `CHG-NP-0.2.2.md` for the complete test checklist, current limitations and exact evidence status.

## v0.2.3 — Gantt linkage and planning QA

- **Timeline:** Tap a task bar's connector port and then a successor task bar, or drag the connector onto another scheduled bar. The existing link icon in task rows remains a predecessor editor. Invalid/cyclic links are rejected by the project model.
- **Critical path:** Switch on `Critical path` to emphasize the longest *scheduled dependency-duration chain*. The result is a calendar-day, finish-to-start estimate; it is not a working-day, constrained or resource-leveled forecast.
- **Development discipline:** Read `AGENTS.md` and the bundled original Unslop skill under `.opencode/skills/unslop/SKILL.md` before changes. Its original author is Damir Sokolovsky (CC BY 4.0). The repo includes an explicit UI redline audit (`docs/UNSLOP-NP-0.2.3.md`). OpenCode-compatible files are guidance only; OpenCode itself is not installed or run by this ZIP.
- **Status:** v0.2.3 is a QA candidate; browser and Expo Go gestures require actual local tests. Continue with `npx expo start` in Termux on the `work` branch. Do not merge or deploy until accepted.

## v0.2.4 — Curved Gantt links, deletion and actual Unslop pass

- Connector motion uses relative gesture deltas to reduce finger/preview offset.
- Dependency routes are independently drawn as curved SVG with separated overlapping trunks, endpoint/arrow markers and dashed conflicts.
- Tap a link to inspect/remove, or use the `Links N` listing if SVG hits are difficult.
- Gantt toolbar has on-demand Help and warning detail; task rail is wider and the mobile header/board copy are simplified.
- The source includes a screenshot-driven nine-pass Unslop audit at `docs/UNSLOP-NP-0.2.4.md` and manual QA at `docs/NP-QA-0.2.4.md`.
- **New dependency:** `react-native-svg@15.16.0`, Expo SDK 58 compatible. Run `npm install`, `npm test`, `npx expo install --check`, then `npx expo start`.
- **Unverified:** native & Web gestures and actual rendered screenshots, until the local runtime tests. No Git push, merge, or Firebase deployment.

## v0.2.5 — Mobile Gantt viewport and shared design system (LOCAL QA)

- **Pinch zoom:** pinch inside the Gantt viewport to adjust day width continuously (6–96 px/day), centered on the pinch midpoint. `+`, `−`, and `Fit` are accessible fallbacks; Days / Weeks / Months remain selectable presets. At overview-level zoom, bars become compact indicators; zoom in to move/resize/link them.
- **Two-axis chart navigation:** the Gantt now has its own vertically scrolling task/calendar viewport and independent horizontal date scroll. During a connector drag, holding near any chart edge auto-pans in that direction; offsets are applied to target hit-testing. Tap-to-link remains available.
- **First-touch alignment:** gesture source contact offset is measured when possible, constrained to the connector hit zone, with an async measurement refresh. This still needs device verification.
- **UI:** Unslop was applied to actual shared controls in `App.js`, a calmer shared theme `src/design.cjs`, a simpler mobile header/bottom navigation, and a shorter three-row Gantt toolbar with advanced actions under **More**. Full application-wide pixel review remains a separate acceptance requirement.
- **App version:** `0.2.5`; local AsyncStorage schema/key unchanged; no new dependencies.
- **QA:** `npm test`, JSX parser checks pass in the delivery environment. Expo Go, iOS and Web rendering/gesture testing **Not run** here. See `docs/NP-QA-0.2.5.md` and `docs/UNSLOP-NP-0.2.5.md`.

Do not merge `work` or deploy this QA candidate until device/browser runtime interactions pass. Back up your workspace JSON before extraction. No Firebase project is connected.

## v0.3.1 — Accent preferences and hierarchical Gantt

- Settings offers 10 RIVNA-inspired accent names (Aqua, Mint, Lime, Amber, Orange, Coral, Pink, Fuchsia, Violet, Indigo), with orange `#D97757` selected on clean installs.
- Theme selection is persisted in its own AsyncStorage key on this device; it does not change projects or JSON imports. Primary actions, navigation and the in-app user-supplied monochrome Niyarvo symbol are retinted live.
- Native launcher and PWA installed icons remain monochrome *orange*; iOS/Android launcher icons cannot switch automatically from an Expo JavaScript setting. On Web the browser tab favicon follows selection.
- Gantt adds Tree view, expand/collapse, rollup summary bars and progress. Aggregate summary bars are read-only: update child schedules to adjust them, so grouping never silently reschedules descendants.

**Status:** Local-QA candidate. Expo Go Android / Web / iOS gesture and visual checks are not verified.

## v0.3.0 — Planning and architecture inventory

The local-first task model supports leaf progress (0–100%), estimated effort in hours, calculated nested parent/project completion, and saved per-project task query views (status/priority/owner/text and sorting). Existing `niyarvo.project.v1` imports remain compatible; fields are optional and export as part of project JSON.

See `docs/NP-OPENPROJECT-CAPABILITY-MAP-v1.md` for 63 source-evidenced capabilities across 30 OpenProject modules and the implementation roadmap. OpenProject architecture was studied as a reference; no source code was copied.

**Status:** v0.3.0 is a local QA candidate. Test through Metro (`npx expo start`) before committing to `main`. Firebase `niyarvoprojects` remains unconnected.


## v0.3.0 — Local task configuration and Android safe areas

**Task setup:** Open **Tasks → Task setup** or **Settings → Configure tasks & workflow**. Each project has its own custom task types, validated fields (`text`, `number`, `date`, `boolean`, `select`), and optionally enforced workflow transitions. Existing projects retain the default `Task` type and unrestricted moves until you enable transition enforcement. Text, date and number inputs use an explicit Save value action; Boolean and select fields are direct choices. Custom field and type data survives workspace/project JSON export and backups. Removing a custom field deletes its saved values after an automatic workspace snapshot. In-use types cannot be removed.

**Task editor:** Task types and custom values can be edited in a task's detail drawer. Field changes invalidate verification for affected tasks and reopen linked release records when applicable. Kanban and bulk status changes honor configured transitions. A status may still be blocked by unfinished dependencies.

**Safe areas:** The screen shell and native full-screen dialogs use `react-native-safe-area-context`, including top status-bar clearance and bottom gesture-navigation clearance. Install the new dependency via `npm install` and check it using `npx expo install --check`. Android and iOS need runtime verification, including landscape and keyboard presentation. Web uses existing page spacing.

No Firebase initialization, cloud writes, account imports, Git operations, or roadmap imports are performed by this release. All metadata remains local until separately migrated.
