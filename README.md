# Niyarvo Projects — v0.2.5 local QA candidate

Independent Expo SDK 58 / React Native project management app for Web, Android (Expo Go) and iOS source. All project data remains local-first in AsyncStorage; no Firebase or GitHub runtime integration. Niyarvo Control Center and RIVNA are **separate applications**.

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

**Gate for v0.2.5:** 66 Node tests passed and JSX parser reported no syntax errors in the preparation environment. Android/Web interactive behavior is **not yet verified**. Do not merge into `main` until the `CHG-NP-0.2.1.md` manual QA checklist passes.

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
