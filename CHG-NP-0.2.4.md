# CHG-NP-0.2.4 — Gantt routing, dependency management and Unslop UI

## 0. READ FIRST — handoff

| Field | Observed / planned value |
|---|---|
| Project | Niyarvo Projects (independent from RIVNA / Niyarvo Control Center) |
| Source base | v0.2.3 local-QA source ZIP |
| Patch | v0.2.4-LOCAL-QA |
| Git destination | Existing `work` branch; **no commit/push/merge performed here** |
| Runtime | React Native 0.88.1 + Expo SDK 58; Metro / Fast Refresh |
| Cloud deployment | **Not performed**; Firebase configuration remains isolated / inactive |
| Local persistence | Same AsyncStorage key, JSON data models and schema; no migration |
| Status | **Source-checked QA candidate**; not accepted or production-ready |
| Source model/UI-contract tests | **58/58 passed** |
| JSX parse | **Passed** with TypeScript JSX parser, App.js and GanttView.js |
| Web runtime | **Not run** |
| Android Expo Go touch | **Not run** — requires user test |
| iOS | **Not run** |
| Expo dependency validation | **Not run** — run in Termux after `npm install` |

## 1. User findings addressed

- A one-off Gantt connector preview line appeared several rows below the finger.
- Existing dependency lines could not be individually selected and removed directly from the chart.
- Right-angle dependency paths intersected and were hard to distinguish from one another.
- The Android Gantt toolbar, repeated instructions and warnings appeared cramped and visually noisy. User explicitly required actual Unslop application, not simply bundling the skill.
- **Preserved the already accepted behaviors:** whole-card Kanban drag, horizontal edge scrolling, Gantt move and end resize, project persistence.

## 2. Implemented changes

### Gesture coordinate correction

In `src/GanttView.js`, connector movement now forwards `gesture.dx` and `gesture.dy` rather than absolute `moveX` and `moveY`. The pure `gantt.linkGesturePoint()` function anchors both the preview and release hit test in the Gantt chart's own coordinate space; removed asynchronous `measureInWindow`/`canvasOrigin` dependency. The source-port anchor is mathematically inferred from existing chart bar geometry. Further device verification is required for short/narrow bars and scrolling while linking.

### Curved, distinguishable relationships

In `src/gantt.cjs`, `dependencyGeometry()` assigns deterministic separated elbows when vertical row spans overlap; `dependencyCurve()` returns smooth SVG paths. `GanttView` renders curves with `react-native-svg`, small source dots, arrowheads, a wider invisible touch stroke, and dashed red conflict links. These visual affordances do not change the task dependency model. Lines can still geometrically cross; they are not guaranteed edge-disjoint for all DAGs.

### Dependency removal, two methods

- Tap a curved link to open a dialog showing its predecessor and successor, then choose **Remove link**. This requires confirmation through the dialog.
- If individual SVG touches are difficult on a given device, tap **Links N** to browse every relation by task name, open a relation and remove it. The original task-row dependency selector remains intact.
- Removal calls the existing authoritative `model.setTaskDependencies` callback and invalidates affected task verification through the existing app model; it does not remove tasks or reschedule dates.

### Actual Unslop pass

The screenshot-based nine-pass redline is in `docs/UNSLOP-NP-0.2.4.md`. Notable code changes include compact/collapsible Gantt controls, a quieter neutral group background, 60px task rows, improved text hierarchy, a wider fixed task rail, shorter shared mobile header copy, consistent control sizes and task-oriented navigation wording. Existing Niyarvo logo and restrained violet accent remain. The main Kanban gesture code is deliberately untouched.

### Dependencies and version

- Added `react-native-svg@15.16.0`. The Expo SDK 58 documentation lists 15.16.0 as compatible/included in Expo Go. **New dependency requires `npm install`**.
- Updated `package.json` and `app.json` to `0.2.4`.

## 3. Files changed

- `src/GanttView.js` — gesture path, curved render, selectable links and remove dialogs, controls and typography.
- `src/gantt.cjs` — route separation, SVG path geometry, deterministic relative gesture positioning, 60px task rows.
- `App.js` — shared header, sidebar/board copy, minor control sizing and type redlines.
- `package.json`, `app.json` — version and SVG dependency.
- `tests/curved-dependencies.test.cjs` — geometry, collision, relative gesture and removal tests.
- `tests/gantt-ui-contract.test.cjs` — regression source checks for mobile touches, SVG removal, UI pass and Expo dependency.
- `docs/UNSLOP-NP-0.2.4.md`, `docs/NP-QA-0.2.4.md`, this changelog, README.

## 4. Verification

- Node tests: **58 passed, 0 failed**, including prior 47 and 11 added tests.
- JSX syntax: **0 diagnostics** via TypeScript parser (`App.js`, `src/GanttView.js`).
- JSON syntax: checked `package.json` and `app.json`.
- Expo Metro Android / Expo Web: **Not run** (dependencies/interactive device environment unavailable).
- Real touch alignment, SVG taps and layout: **Not verified**. Screen captures supplied by user are from v0.2.3, not v0.2.4.
- Tests do **not** imply Android, iOS or Web runtime acceptance.

## 5. Installation on the existing `work` branch

1. Export workspace JSON from the running app. Confirm `git status --short` and stash/commit any unsaved edits safely.
2. `git switch work` from `~/NiyarvoProjects`, then unzip the v0.2.4 project-root ZIP over the repo (`unzip -o ... -d .`). Do not overwrite `.git` (ZIP contains none).
3. Run `npm install` (new SVG package), `npm test`, `npx expo install --check`, and `npx expo start`.
4. Run `docs/NP-QA-0.2.4.md` on Android and Web.
5. Only after verified QA, commit on `work` and merge to `main` using your usual review/checkpoint process.

## 6. Known limitations and next planning items

- SVG curve touch-event reliability varies by platform; `Links N` is an always-available fallback.
- Complex graphs can have line crossings even when parallel trunks are separated.
- The app still uses simple calendar-day finish-to-start scheduling, not auto-rescheduled dependency types/lag, working calendars, resource leveling, nested work breakdown, or optimized path routing.
- Native file attachments and multi-user Firebase sync are separate unfinished capabilities. No cloud connections were added.
- Full-app visual acceptance requires a systematic review of other screens; this patch prioritizes the user's Gantt screenshots and shared chrome.

## 7. Handoff checklist

- Preserve accepted Kanban/resize/move workflows, AsyncStorage format and project branch policy.
- Read `AGENTS.md`, `.opencode/skills/unslop/SKILL.md`, and latest Unslop audit before UI changes.
- Never transplant OpenProject/Asana source; architectural concepts only, independent code.
- Do not import the user's engineering roadmaps or connect unrelated Firebase projects.
