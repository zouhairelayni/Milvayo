# RESUME — Milvayo

Read AGENTS.md and summary.md. Work directly in `/mnt/milvayo-rebrand` on Git `work`. No ZIP for local work unless explicitly requested. The user said no Web/Android bundles; do not run them without a new request. Never auto-commit, force-push, deploy or merge.

## Current state

Latest patch complete: Timeline supports focal date-axis pinch zoom, with chart/calendar previewing together and existing editing/dependency styles preserved. WBS Tree/Fishbone/Mind map retain focal pinch zoom and bounded panning; presets/direction share one toolbar row and summaries are equal compact tiles. Work and Projects headers hide project-name text along with Home, retaining the hamburger. Due soon remains in List with per-board switches in List → Tools; Add list is compact/vertical at Board's right end; standalone page titles are removed while actions, sections, record and popup titles remain.

All previous UI work remains: compact workspace popup; Today overview with alert sheets and wrapped progress text; line/bar burndown mode buttons; Advanced tasks project switch; timeline/calendar/pill updates with preserved dependencies; bottom navigation without outline/selected tiles and with larger selected icons.

Versions synchronized at 0.5.59. Tests **747/747 pass**, syntax **153 app source files pass**, native worklet compilation and Expo dependency check pass. Browser/Expo Go/hardware/Fast Refresh **Not run**. Latest QA/rollback: `docs/qa/NP-QA-timeline-pinch.md`; WBS QA: `docs/qa/NP-QA-wbs-pinch-zoom.md`; usage: `docs/instructions/ui-followup.md`.

## Important implementation details

- Timeline uses platform `TimelinePinch` hooks/areas/canvases and pure `timelineZoom.cjs` math. Native virtual pinch sits under the unchanged, seeded `TimelineGestureHost`. Chart/calendar preview only horizontal transforms, then commit density and focal scroll. `zoomFactor` is transient; named presets clear it. Pinch guards suppress TaskBar lift/move/drop/tap/link callbacks until safe. Native task dragging still retains its original scrolling ownership; only pinch locks scrolling. The existing dependency SVG hash checks still pass.

- Calendar settings remain `powerUps[boardId]` with id `calendar`. `src/screens/tasks/dueSoon.cjs` combines enabled non-archived boards using the existing date selector. `DueSoon.js` starts with one task and retains See more/less. The old `src/screens/board/UpcomingDates.js` was moved, not duplicated.
- `ProjectSwitcher` still names the shared header component; `showProjectName` is false on Overview/Home and all Work/Projects section views in phone and wide headers. The compact popup still shows/selects projects and workspaces.
- WBS uses `DiagramViewport` and platform `DiagramGesture` components, with pure `diagramZoom.cjs` math. Native uses a standalone RNGH `GestureDetector` under the existing root, UI-thread transforms and shared numeric offset tuples. Web uses local DOM listeners/transforms. The 440px maximum viewport owns pan while content overflows. Zoom is transient; original SVG export and stored WBS data are unchanged.
- Actual Sprints/Releases/Testing routes use `src/screens/delivery/Delivery.js`; separate Sprints.js is not the active route. Frozen history remains in `src/domain/agile.cjs`.
- `tools.advancedTasks` controls task detail only; core routes use SCREEN_IDS. Existing projects default on, new lean projects off. No other task/model fields change when toggled.
- Existing host node wrapper is recursive. Checks use `/data/data/com.termux/files/usr/bin/node` through `/tmp/milvayo-runtime/bin/node` in PATH. Do not overwrite system or project runtime configuration.

Next: address device feedback; then Resources/Costs/Reports, Automations, Scheduling/Collaboration/Specifications, Settings/Backup, Projects/Portfolios/Programs. Read Unslop and relevant references, audit in the prescribed order, retain the existing visual language, keep every control and add a control test per screen. No new data/business/security changes without authorization.
