# CHG-NP-0.5.31 — Full UI/UX redesign (source level)

Based on the supplied v0.5.30 source. No data model, store, persistence, import or navigation-rule changes. Version numbers untouched; `package.json`, `package-lock.json` and `app.json` are not in the ZIP.

## Direction (Unslop, five lines)
- Product: a workspace for independent builders to plan tasks, boards, timelines, sprints and release gates.
- Character: calm, exact, dependable.
- World: planning instruments, a quiet technical workbench.
- Moments: the Kanban board and the Gantt chart.
- Signature: one user-chosen accent that marks selection and "today"; status and priority colours keep their meaning.

## Design system
- Cool graphite light and dark ramps, hairline borders, three text roles. The warm cream surfaces, serif titles and uppercase labels are gone. Critical priority is now red, no longer the same colour as the default accent.
- Radii 6/8/12/16, 4px spacing, one sans face, tabular numbers on counts and dates.
- Controls: 32/38 px on tablet and desktop, 40/44 px on phones, hover states, focus ring on inputs, buttons no longer pills.
- Single choke points: `T` (no `upper` / `serifFace`), `Card`, `Pill` (neutral text, colour dot), `Chip`, `Segmented`, `Button`, `IconBtn`, `Input`, `Page`, `Sheet`, `Stat`. All other screens inherit them.
- New pure rules in `src/ui/theme/layout.cjs`: breakpoints (phone < 720, tablet < 1100, desktop), sidebar state, grid basis, Kanban column width.

## Shell
- Desktop and tablet: persistent sidebar (248) that collapses to a 64 px icon rail; choice remembered (`niyarvo-projects-sidebar-v1`). Tablets start collapsed.
- Toolbar: sidebar button, workspace / project / screen path with project and workspace switchers, search, theme, New task.
- Phones: app bar (screen and project name), bottom navigation (5 tabs, accent bar), side menu for the rest.
- Page content grows up to 1680 px with a gutter per breakpoint; `ContentWidthProvider` gives screens the width left beside the sidebar.
- Web: `overscroll-behavior:none` (no bounce), `touch-action:manipulation` on buttons and tabs (no tap delay), thin scrollbars.

## Screens
- Overview: stat row, progress and release readiness, stage distribution, "Next due" as a table row list.
- Board: columns share the free width (290 to 380; phones stay 272), cards with flag priority, due date (red when overdue), icon meta row and avatar, count badge in the header. Drag, hold, scroll and drop-slot code is unchanged.
- Timeline: toolbar in the chart card (Items, zoom, Critical path, First task, Today), month band over aligned day ticks, weekend columns, today marker, task list open by default on tablet and desktop, neutral dependency lines (red on the critical path, accent when selected).
- Tasks: column header and aligned Owner / Due / Status / Priority columns on wide screens, hover and selection states.
- Sheets (task, new list, boards, dialogs): right panel on tablet/desktop, bottom sheet with grab handle on phones.
- Other screens (Sprints, Scheduling, Releases, Specifications, Testing, Collaboration, Resources, Costs, Automations, Reports, Activity, Settings, Governance) take the new look through the shared kit; no layout rewrite of their content.

## Tests
- `npm test` (run as `node tests/run-all.cjs`): **586 run, 585 pass, 0 fail, 1 skipped.** Baseline was 566 run with 3 failures caused only by missing `app.json` / `package.json`; with temporary stubs: 570 run, 569 pass.
- New: `tests/ui/layout-0531.test.cjs`, `tests/app/shell-redesign-0531.test.cjs`.
- Contracts updated: UI kit export list (3 new exports) and the dead-import rule for `isOverdue` in Board (now used).
- JSX/JS parse: 125 files, 0 errors.

## Audit fixes (Frontend Design and Ponytail pass)
- Fixed a crash: `ModernApp.js` used `<T>` after its import was dropped (loading-screen text). Syntax checks and the old suite could not see it; a new test now checks every file that renders `<T>` imports it.
- Contrast: accents are now derived per mode (`accentTokens` in `theme.cjs`). Marks keep 3:1, accent text 4.5:1, button labels 4.5:1 on every one of the 10 accents, light and dark. The default orange filled button was 3.9:1 and is now darker where needed (`accentFill`).
- Text no longer uses amber, red or the raw accent on white: overdue dates and errors use `danger` (4.5:1+), High and Critical labels are neutral next to a coloured flag. Status and priority colours are dots and icons only, darkened to reach 3:1 on white. Placeholder text raised to about 4:1.
- Touch: chips and the zoom control are 40 and 38 px on phones.
- Removed an unused `space` token. Palettes moved into `theme.cjs` so node tests cover them (2 new contrast tests).

## Not run (this environment has no Node modules, browser or device)
- Expo Web, Expo Go Android/iOS, Metro / Fast Refresh, `npx expo install --check`, visual checks at phone, tablet and desktop widths, touch drag on Board and Timeline, screen-reader checks.

## Unresolved / risks
- `src/ui/theme/design.cjs` is an older second palette used only by `tests/ui/theme.test.cjs`; it should be retired together with that test (not done, to keep this change reviewable).
- Everything visual is unverified on a screen. Please check first: sidebar collapse, Board drag on desktop and phone, Timeline bar drag and header alignment at Days / Weeks / Months, light and dark.
- Timeline "today" is still read once at app start (stale after midnight until restart).
- A button tapped <0.3 s after typing in a lazy field can act on unsaved text (existing issue).
- Remaining screens were restyled through shared components only; dense forms (Settings, Automations, Governance) keep a single-column layout.
- The new `Input` border (transparent until focused) adds 2 px to inline editors; look at card title editing on the Board.

## Install (reversible)
Keep a copy of `~/NiyarvoProjects`, unzip over it (`unzip -o`), keep your own `package.json`. No files were moved or deleted, so `clean.py` is not needed. Roll back by restoring the copy.
