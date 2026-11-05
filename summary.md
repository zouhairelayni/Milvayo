# Milvayo — current handoff

Direct changes in `/mnt/milvayo-rebrand`, on Git `work`, still uncommitted. No ZIP unless explicitly requested. No Web/Android bundles unless requested. Package/lock/Expo versions remain synchronized at 0.5.59; no new dependencies.

## Latest completed changes

- Timeline now supports focal pinch zoom on its date axis. Native shared transforms preview the chart and pinned calendar together; density/scroll commit at completion. Presets reset custom zoom, overscan/canvas limits remain bounded, and accidental task edits are suppressed. Row heights, final labels/handles, dependency SVG styling and inclusive move/resize rules remain.

- WBS Tree (both directions), Fishbone and Mind map now have focal pinch zoom (25–400%) and bounded panning. Presets reset panning, Fit considers width/height, SVG/CSV export and Outline edits remain. Direction and zoom controls share one horizontal toolbar; summaries are equal compact 88px tiles.
- Home, Work and Projects phone/wide headers hide project-name text while retaining the hamburger/popup/search/actions. Project names remain in records and the popup.

- Board Upcoming dates moved to List as **Due soon**. Its per-board calendar switches moved to List → Tools, preserving saved choices. Open tasks from enabled non-archived boards are merged/sorted with the existing next-30-days/30-item limit; one row initially, See more/less and task-open links retained.
- Add list is vertical, compact and at the right end of Board. Creation/order rules and zero-origin/measured drag geometry remain.
- Standalone visible page titles are removed; back/header controls, section headings, record names and modal titles remain.

## Earlier completed work retained

Phone Home/Work/Create/Projects/More shell; per-project tool switches; compact project/workspace popup; bottom navigation without selected tiles/top border and with larger selected icons; timeline/calendar ribbons and softer bars/tabs with unchanged dependency styling; Today project overview with attention/due alert sheets and wrapped progress text; Releases/Testing/Sprints layouts and line/bar burndown SVG controls.

Advanced tasks is a per-project, non-screen switch replacing task-sheet Standard/Advanced buttons. Legacy missing setting defaults on; new LEAN projects default off. Disabling it never changes task data or hides core routes. Calendar settings and backup formats are unchanged in the latest patch. Sprint history remains in `src/domain/agile.cjs`.

## Verification and next work

**747/747 tests pass**; syntax **153 app source files pass**; native worklet compilation, Expo dependency, metadata and whitespace checks pass. Browser/Expo Go/hardware/Fast Refresh: **Not run**. Bundles omitted at the user's request. Latest QA/rollback: `docs/qa/NP-QA-timeline-pinch.md`; WBS QA: `docs/qa/NP-QA-wbs-pinch-zoom.md`; usage: `docs/instructions/ui-followup.md`.

Remaining batches, in order: Resources/Costs/Reports; Automations (all eight sections/controls); Scheduling/Collaboration/Specifications; Settings/Backup; Projects/Portfolios/Programs. Preserve every control with a test per screen. Validate on Termux before any checkpoint; never auto-commit, push, deploy or merge.
