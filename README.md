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
