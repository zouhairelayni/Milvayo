# QA — Redesign batch 03

Scope: Timeline action ribbon, pinned calendar, view selector and task bars; Home (Today and first-run starters); Releases, Testing and Sprints. Later batches retain the requested order: Resources/Costs/Reports; Automations; Scheduling/Collaboration/Specifications; Settings/Backup; Projects/Portfolios/Programs.

Review standard: Unslop by Damir Sokolovsky ([@heydamir](https://x.com/heydamir)), CC BY 4.0, restored from the local Milvayo checkout into `.opencode/skills/unslop`. MemoryRelay returned frontend-design, emil-design-eng, ponytail and animation guidance. Existing Milvayo palette and architecture take precedence.

## Five-line direction

- Product: a precise workspace for independent projects, tasks, schedules and release gates.
- Character: calm, exact, dependable.
- World: planning instruments and quiet technical workbenches.
- Moments: the Gantt schedule, today's work and verified delivery progress.
- Signature: the selected accent and meaningful task/dependency colors.

## Before audit, in review order

| Pass | Before | After / controlled scope |
| --- | --- | --- |
| Spacing | Boxed timeline actions and metric-heavy Home | 4px rhythm, quiet ribbon controls; Today before retained metrics |
| Color | Established selectable accent and semantic dependencies | Preserve palette and dependency colors; neutral selected surfaces |
| Icons | Consistent Feather icons | Preserve set; no new icon library |
| Copy | Home is an overview rather than a daily starting point; title-case ribbon labels | Today, actionable empty state and sentence-case ribbon labels |
| Typography | Single-line calendar repeats full dates; delivery summaries compete with details | Weekday/date hierarchy; quiet metadata; existing fonts |
| Layout | Home starts with statistics; delivery details occupy equal weight | Attention and next due first; summary before existing delivery controls |
| Details | Selector radius 9 with 7px inset differs from mock's 14/9 shapes | 14px outer selector, 4px inset, 9px selected shape; 8px task-bar corners |
| Visuals | Gantt and burndown already provide meaningful visuals | Preserve dependency rendering, milestones, grid, weekends and critical-path semantics |
| Motion | Native-driven calendar and disclosures explain interaction | Direct scroll/drag feedback; press surfaces; existing 185ms disclosure rotation now uses the Unslop ease-out and explicit system reduced motion |

## Safety and installation

No data/schema/storage migration. No new packages. Work on local `work`; no commit, push, merge or deployment. The working folder lacked Git metadata; copying the original local checkout's `.git` restored branch/history without changing that checkout. Earlier batch changes remain uncommitted.

Before replacing source on Termux, export a backup through Settings → Backup and keep the previous project folder/ZIP. Extract the new project-root ZIP into a separate folder, retain local configuration, use the existing compatible dependencies, run `npm test`, then `npx expo start --clear`. Validate first, then switch folders. Roll back by reopening the previous source folder and restarting Metro; saved data format is unchanged.

## Results

| Check | Result | Evidence / limit |
| --- | --- | --- |
| `npm test` | **Pass** | 718 tests, 718 passed, 0 failed, 0 skipped in both the working folder and extracted deliverable; `redesign03-tests.txt` |
| New screen/control and presentation checks | **Pass** | 10 tests across Home, Releases, Testing, Sprints and Timeline; deterministic render/handler harness, not a device renderer |
| JSX/source parsing | **Pass** | All 144 `App.js`/`src` JS and CJS files parsed with Babel |
| `npx expo install --check` | **Pass** | Dependencies are up to date; no package installation or version changes |
| Version synchronization | **Pass** | `package.json`, lockfile top level/root package and `app.json` remain 0.5.59 |
| `git diff --check` | **Pass** | No whitespace errors |
| Changed UI identifier check | **Pass** | Babel scope traversal found no unresolved JavaScript identifiers in seven changed UI modules |
| `npx expo start --offline --port 8085` | **Pass** | Metro starts. Host DevTools auto-install reports `Cannot read properties of undefined (reading 'arm64')`; bundling still succeeds |
| Current Web / Android bundles | **Pass** | Both returned HTTP 200. Android's initial cold request timed out at 50 seconds; a subsequent request and final rebuild succeeded |
| Web browser rendering and keyboard navigation | **Not run** | No browser automation/runtime available |
| Expo Go / physical touch / Fast Refresh | **Not run** | No connected Expo Go client; source and bundle checks are not runtime acceptance |
| iOS runtime | **Not run** | No iOS device or simulator |
| ZIP structure/integrity | **Pass** | Flat project root; synchronized metadata; one cumulative changelog; required source/tests/assets/skill present; no nested ZIP, dependency tree, private credentials, or patch installer scripts |

The default host `node` executable is a recursive shell wrapper. Checks used the working installed Termux Node v24.18.0 through a temporary `/tmp` PATH shim; no machine or project Node configuration was overwritten.

Baseline verification found 708 tests: 706 passed and 2 failed. The missing Android CI workflow was restored from `/mnt/Milvayo/.github/workflows/android-apk.yml`. The folder structure test now excludes the separate app mock and bundled skill from application path-header checks. Existing regressions were retargeted for sentence-case labels and the taller bar's unchanged 27px dependency centre; their behavioral safeguards remain.

## Control inventory and acceptance

| Screen | Controls retained / added | Test |
| --- | --- | --- |
| Timeline | Items toggle, First task, Today, Critical path, parent/schedule sheets, zoom, task open, move/resize, link creation/removal/Keep, hierarchy expansion, conflict repair, sample schedule, dismissal | `tests/ui/redesign03-timeline-controls.test.cjs` |
| Home / Today | Status tiles, Overdue, Milestones, In sprint, release/testing navigation, task rows and All tasks; adds attention pagination, overview disclosure and explicit empty/sample starters | `tests/ui/redesign03-home-controls.test.cjs` |
| Releases | Header New release, all four metadata fields including Markdown notes, Cancel/Create/Save, four stages, verification gates, edit and confirmed deletion | `tests/ui/redesign03-releases-controls.test.cjs` |
| Testing | All four counts, check rows, pagination, all four result choices, Done and dismissal | `tests/ui/redesign03-testing-controls.test.cjs` |
| Sprints | Selector, New/first sprint, Start/Edit/Delete, Finish/confirm/Cancel, four form fields/Save, task open/remove/add, backlog search/pagination, historical scope, burndown selection and legends | `tests/ui/redesign03-sprints-controls.test.cjs`; existing chart and agile suites |

The new handler harness checks screen output and callbacks with deterministic hooks and stubbed shared controls. Source inventory and existing tests supplement it for disclosures, gestures and confirmation components. These checks do not prove hit testing, visual fit, hardware animation performance, focus behavior, or persistence on an actual device.

Run these acceptance gates on Termux/Expo Go before a checkpoint:

1. Home: open attention and due rows, expand Project overview and use every retained shortcut. On the sample or an empty project, use Add a task, Import a project (opens Settings → Backup; import remains explicit), and Open projects.
2. Timeline: swipe the view pill and scroll both axes. The ribbon/calendar stay pinned. Check daily dates, month boundaries, all zoom levels, weekends and the dashed today marker. Toggle Items/Critical path and open both task sheets.
3. Hold and move a bar: both dates move together and duration stays fixed. Resize each edge: the opposite date stays fixed, duration is at least one inclusive day, and history says “Changed duration of …”. Dependency lines must stay attached throughout each drag. Create and remove a link; Keep cancels removal.
4. Releases: disclose gates and Manage release, edit every field, cancel without saving, change each stage and test the delete confirmation on a disposable record.
5. Testing: open a check, choose each result, close/reopen and paginate beyond 25 checks. Reopen the app and verify the saved result.
6. Sprints: disclose Manage sprint, create/edit/start/finish a disposable sprint, assign/remove/search tasks, scrub the burndown and toggle each legend. Completed history stays read-only after changing current tasks and after export/import.
7. Exercise light/dark/AMOLED, selected accents, narrow portrait and wide layouts, large text, keyboard focus on Web, system reduced motion, and Fast Refresh during a harmless text edit.

Do not merge or mark device acceptance passed until these gates pass. Reopen the previous project folder/ZIP to roll back.
