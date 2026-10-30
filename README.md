# Niyarvo Projects — v0.2.1 local QA candidate

Independent Expo SDK 58 / React Native project management app for Web, Android (Expo Go) and iOS source. All project data remains local-first in AsyncStorage; no Firebase or GitHub runtime integration. Niyarvo Control Center and RIVNA are **separate applications**.

## Changes since v0.2.0

- Select active projects from the sidebar workspace dropdown (or the mobile header project shortcut). No trip through Settings.
- **Create project:** separate form for project name/code/description and project JSON import.
- **Manage project:** separate form for edit, export, archive, delete. Archived projects are retained and may be restored from the project picker. Last active project cannot be archived.
- Added extra top spacing on mobile and desktop. Browser width >=860 px uses the desktop sidebar and **does not** show the bottom tab bar.
- Kanban: handle-based drag, horizontal edge auto-scroll while dragging, floating card preview, drop-lane detection that includes current scroll offset, and measured card-height ordering. Status edit remains a fallback.
- Timeline: scrollable Gantt table, task name rail, 7/14/30/90-day zoom, predecessor lines, task dependency selection, draggable bars to move dates, end handles to resize, date nudge controls and unscheduled task scheduling.
- No new npm dependencies. The `niyarvo-projects-v1` local storage key is unchanged, and `archived` is an optional backward-compatible project field.

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

**Gate:** 25 Node tests passed and JSX parser reported no syntax issues in the preparation environment. Android/Web interactive behavior is **not yet verified**. Do not merge into `main` until the `CHG-NP-0.2.1.md` manual QA checklist passes.

## Not yet implemented

Cloud Firebase Auth/Firestore sync, permissions, hosted binary attachments, notifications, schedule-based automation, comments, team collaboration, offline conflict resolution, advanced Gantt scheduling/critical path, and production iOS tests. The attached OpenProject GPL-3.0 source archive was inspected for conceptual guidance; no source snippets were imported.

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
