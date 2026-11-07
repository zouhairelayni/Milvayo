## v0.7.12 — Cached project diagrams, full-screen preview and image export (2026-11-07)

- Generate only the selected WBS diagram. Reuse bounded semantic-revision hierarchy, scene and primitive caches across Tree/Fishbone/Mind map switches and remounts, isolated by workspace/project and layout. Invalidate on displayed data; owner/note/task/budget changes do not rebuild vectors. Retain per-view zoom/pose without persisting UI state to backups.
- Replace native full-scene SVG bitmaps with viewport-sized, UI-thread viewBox cameras. Preserve embedded page-scroll handoff and all Timeline gesture code. Add bounded layout/cache/primitive diagnostics and render probes.
- Add compact Expand controls and full-screen inspection: pinch, wheel/trackpad zoom, drag, Fit, Reset, zoom buttons and menu pan alternatives. Keep safe-area chrome, semantic colors and reduced-motion-aware controls; close restores embedded context. Inspect WBS work elements without inventing task associations.
- Export complete SVG, PNG and CSV on demand. SVG keeps vector paths/text and full-name metadata; PNG offers 2×/4×, theme/transparent background, explicit dimensions and platform pixel budgets. Web downloads; native shares a validated PNG with bounded temporary-file retention. Report dimension reduction on large diagrams and recommend SVG for unrestricted vector detail.
- Synchronize package/lock/Expo 0.7.12, Android versionCode 82 / iOS buildNumber 82. No new packages, data migration or agent builds. Owner subsequently authorized main source and commit/push only to work. QA and limits: `docs/qa/release-0712/ENGINEERING-REPORT.md`.

## v0.7.11 — Focused creation, planning and navigation controls (2026-11-06)

- Board’s left-hand plus opens one sheet for a new board or a list in the current board. Remove the vertical Add list control. Board tools exposes confirmed deletion; tasks move safely to Main and Main remains protected.
- Planning & delivery is always available in task details. Retire Advanced tasks from Manage tools while preserving legacy preferences and task data through import/export.
- Remove Timeline’s duplicate header preset control; keep its existing tools pills and zoom/pinch behavior. List uses header search/Tools only, with saved-view search synchronized to the header.
- Due soon shows three rows, then loads additional rows through nested scrolling instead of See more. Remove its descriptive paragraph and show the scroll hint. Sprint creation is an accessible icon-only plus at the left of its selector row.
- Synchronize package/lock/Expo 0.7.11, Android versionCode 81 and iOS buildNumber 81. No new packages, builds, commits or pushes. QA: `docs/qa/release-0711/ENGINEERING-REPORT.md`.

## v0.7.10 — Startup, Projects and Board performance repair (2026-11-06)

- Replace the 3.7-second cold animation plus forced one-second hold with 1.1-second playback and a final rendered frame. Prepare the shell concurrently, defer tour/notices until reveal, start native motion after layout and reject stale completion callbacks. Keep selected accents, original geometry and reduced motion.
- Add bounded startup milestones, runtime identification, production screen render-to-commit estimates and synchronous-work timings alongside the real React Profiler. Distinguish wall time, JS frame estimates and native layout callbacks from CPU/FPS/OS launch measurements.
- Native Projects initially mounts two cards and batches two using FlatList. Retain unsaved/rejected drafts through recycling, preserve web/embedded pagination, align facts and wrap narrow budget/actions. Android shared action/icon and project-settings touch targets reach 48 units.
- Board lists initially mount five cards and load additional five-card batches only on user scroll. Replace Show more with bounded list scrolling; preserve loaded editors/responders, full-order/filter-aware drops, nested-scroll offsets and held-card target auto-scroll.
- No dependency additions or workspace migration. Designated version 0.7.10, Android/iOS 80, before the 0.7.11 work. Main source is authorized by the owner’s subsequent workspace correction. No builds, commits or pushes. Evidence: `docs/qa/startup-repair/ENGINEERING-REPORT.md`.

## v0.7.9 — Return to island notifications (2026-11-06)

- Android CI packaging correction: restrict native-project ignore rules to root `/android/` and `/ios/`, and include the authored Kotlin icon adapter consumed by the prebuild plugin. Add a clean Git-package/plugin-copy regression so locally present but unshipped adapters fail tests. No version, dependency, storage or icon behavior change; no agent build.

- Restored a top-aligned island: expanded for three seconds, shrink, hold compact for three seconds after the motion settles, then dismiss. Explicit sticky work remains visible; reading/reopening, Backup actions, replacement timers, cleanup and reduced motion remain supported.
- Implementation, validation and device limits: `docs/qa/release-079/ENGINEERING-REPORT.md`.

## v0.7.8 — Create sprints from the selector row (2026-11-06)

- Moved the plus-labelled New sprint control into the horizontal sprint list and removed its top-header action. Existing create/edit validation and frozen history remain.
- Implementation, validation and device limits: `docs/qa/release-079/ENGINEERING-REPORT.md`.

## v0.7.7 — One task-creation entry in mobile List (2026-11-06)

- Removed List’s duplicate Add task action; the bottom navigation Create control remains. Filtering and task editing are unchanged.
- Implementation, validation and device limits: `docs/qa/release-079/ENGINEERING-REPORT.md`.

## v0.7.6 — Quiet top navigation headers (2026-11-06)

- Removed screen-name text beside the hamburger and from top back headers. Owner clarified that in-screen headings must remain: restored ScreenIntro, Timeline schedule and onboarding headings; preserved section and popup titles.
- Implementation, validation and device limits: `docs/qa/release-079/ENGINEERING-REPORT.md`.

## v0.7.5 — Timeline preset pills (2026-11-06)

- Added Days, Weeks and Months in one pill row at the top of Timeline options. It uses the shared preset handler and keeps the options popup open.
- Implementation, validation and device limits: `docs/qa/release-079/ENGINEERING-REPORT.md`.

## v0.7.4 — Focus Today when changing Timeline presets (2026-11-06)

- Preset changes now center Today using the new density, including Weeks/Months back to Days. Rebase drawing, calendar and native scroll together; recompute the focus after layout. Preserve pinch focal anchoring, bounded canvas, task duration and dependency behavior.
- Implementation, validation and device limits: `docs/qa/release-079/ENGINEERING-REPORT.md`.

## v0.7.3 — Back navigation across platforms (2026-11-06)

- Added bounded, project/workspace-scoped screen history with Android system Back, iOS single-finger edge Back and web browser Back/Forward. Active sheets/tours dismiss first; history skips unavailable tools and old project scopes. Preserve diagram, chart and horizontal-list gestures.
- Implementation, validation and device limits: `docs/qa/release-079/ENGINEERING-REPORT.md`.

## v0.7.2 — Palette-based icon backgrounds (2026-11-06)

- Generated all 30 accent/appearance icon variants with substitute-palette background gradients and solid primary-color Board marks. Updated adaptive foreground/background layers, primary/legacy/PWA artwork and cache versions; preserve the 29-alias identity map and confirmed save-before-apply behavior. Use platform-neutral Milvayo restart copy without the Expo Go message. Native launcher assets require a future compatible installed binary; no build was run.
- Implementation, validation and device limits: `docs/qa/release-079/ENGINEERING-REPORT.md`.

## v0.7.1 — One themed cold-start logo (2026-11-06)

- Play the existing Board morph once in the selected resolved accent while workspace storage restores concurrently. Native paths animate on the UI thread; hold the finished mark one second, then reveal the hydrated workspace or its existing safe error screen. Do not replay on navigation, theme changes or resume; preserve reduced motion and cancel stale completion/timer callbacks.
- Implementation, validation and device limits: `docs/qa/release-079/ENGINEERING-REPORT.md`.

## v0.7.0 — Premium redesign promoted to the main workspace (2026-11-06)

- Promoted the approved redesign, first-run tour, interaction and stability fixes into the main Milvayo workspace. Replace source, tests and installed Expo/React Native dependencies together; delete obsolete application files and package remnants.
- Synchronize package, lockfile and Expo versions at 0.7.0, Android versionCode 70 and iOS buildNumber 70. Preserve local data/import formats, signing credentials and main Git history.
- Remove superseded patch installers, obsolete manifest backup and stale generated native/cache files. Reconcile historical UI tests with the current experience while retaining functional regressions.
- Verified 799/799 tests from the promoted main folder, 193 source parses, 23 native source transforms, clean source reachability and offline Expo compatibility. Restored executable npm CLI links inherited from the candidate. Device/runtime acceptance remains pending.
- Owner reported a successful Expo build and authorized the 0.7.0 checkpoint/push to `work`. Removed the superseded redesign checkout and temporary promotion/scratch copies; preserve signing files and use Git history for source rollback. No additional agent build or deployment. Verification and rollback: `docs/qa/release-070/PROMOTION-REPORT.md`.

## v0.6.3 — Isolated premium workspace redesign (2026-11-06)

### Candidate redesign (owner acceptance pending)

- Replaced the initial visual pass after owner feedback: neutral Dark/AMOLED canvases, asymmetric analytical dashboard, date-focused agenda, workload/status/due/history/cost/capacity charts, white capsule controls, contextual actions and original SVG empty artwork. `Home _ X` is excluded as inspiration.
- Added visible reduced-motion-aware chart, press, numeric, fill, page-presence, sheet, notice and illustration transitions. Kanban adds lift/tilt, neighbour movement, insertion feedback and drop settlement while preserving placement rules and scroll arbitration.
- Added inline month/range calendars for scheduling, task/sprint dates, reminders, time entries and governance. Dates remain validated ISO strings; calendar exceptions require explicit save.
- Repaired native zoom finalization and render-time shared endpoint configuration. The owner subsequently reported pinch-to-zoom fixed; an independent zero-warning/native performance matrix remains unverified.
- This work stays exclusively in the existing `redesign` copy on `work`. No package additions, build, commit, push, parent integration or data migration. Current focused checks, source-rendered visual evidence, limits and manual acceptance: `docs/qa/redesign-063/ENGINEERING-REPORT.md`.

### Interaction follow-up (2026-11-06)

- Moved Edit project into each card’s Project actions menu, preserving its inline editor. More now groups Scheduling with Project tools, retaining its always-available route and existing optional-tool switches. Removed More’s duplicate header Manage tools action; the Manage tools card remains. More’s workspace row now opens the existing compact Projects/Workspaces manager directly, replacing its separate side modal.

- Task description editing now uses a theme-accent SVG checkmark to save and a red SVG X to cancel, with named 44px controls and existing press feedback. A rejected save retains the draft.

- Reduced Board list levitation by 40% on native/web, including scale/tilt and shadow height/elevation; card lift and drag/drop displacement remain unchanged.
- Kept the native Kanban arrival fade and drag opacity under one animated owner, removing the competing entering animation that produced the Reanimated opacity warning. Kept lift/tilt, measured refs and drop behavior. Held lists now use an elevated, unclipped strip above the board-name ribbon, with compensated top room and restored clipping/scroll on release.
- Moved task description immediately below its title. Delete/copy confirmations stay in the same action popup, including cancel, errors, retries and successful copies. Applied the same confirmation pattern to project, board and WBS actions; project copies keep the current selection.
- Removed bottom-tab selection tiles; selected icons grow from 20px to 24px over 150ms with reduced-motion support. Removed duplicate Settings tools and large Board filter controls; More → Manage tools and Board header Tools remain.
- Home dates now slide between weeks without chevrons. Day selection still filters work, changing weeks clears the filter, and the existing ±52-week bound remains. Paging uses native scrolling, bounded pages and no per-frame React state; screen-reader week actions are available.
- Focused results and honest device/runtime limits: `docs/qa/redesign-063/popup-nav-warning-followup.md`. No new dependencies, schema migration, builds, commit or push; parent app remains untouched.

### Focused performance / UX audit (2026-11-06)

- Removed repeated per-portfolio project health calculations with immutable project/day caching, and derive sprint velocity once per view projection. Preserve domain formulas, history and import compatibility.
- Replaced repeated per-day task scans/Intl weekday formatting with one-pass schedule aggregation. DateRail retains adjacent pages through day-selection/callback changes.
- Coalesced ordinary diagnostics writes within 200ms; exceptions, clear and background transitions request an immediate save. Preserve retries, bounded evidence and strict console logging.
- Keep bulk task selection after a rejected status edit; cancel pending native Reveal work on unmount while preserving approved motion.
- 106 focused tests and source/worklet checks passed. Isolated selector CPU timings and mock write counts improved; these are not Android FPS/latency claims. Detailed results, persistence tradeoff and phone gates: `docs/qa/redesign-063/FOCUSED-PERFORMANCE-AUDIT.md`. No builds, package changes, pushes, migration or parent integration.

### Error/background lifecycle follow-up (2026-11-06)

- Attach diagnostics error/console/lifecycle hooks before awaiting previous-report storage. Console errors and background evidence now bypass foreground save batching; original handlers/privacy remain.
- Respect initial/background state, preserve it on clear, reset resume timer accounting, guard late startup/native-history callbacks and clean up web pagehide/pageshow/Fast Refresh listeners.
- Cancel native Board holds, drags and delayed title opens on background, without committing drops; suppress stale release/measurement callbacks until a new foreground touch.
- 43 focused regressions passed. No builds, dependencies, model/import migration or parent integration; actual device/OS acceptance remains pending. Details: `docs/qa/redesign-063/ERROR-BACKGROUND-FOLLOWUP.md`.

### First-run tour integration (2026-11-06)

- Integrated the owner-supplied first-run ZIP into the current redesign without overwriting recent fixes: three swipeable slides, themed SVG artwork, four starters, project naming, Skip/Back and manual replay in More.
- Auto-open only on empty storage; existing/recovered workspaces and failed reads suppress it. Fresh eligibility is delivered after shell mount, without a new storage key.
- Apply starter tools atomically in the existing validated project creation transaction. Keep existing projects untouched, ordinary creation lean, and the import/schema format unchanged. Guard failed/repeated submissions; add keyboard/Back/focus/pager recovery and keep notices actionable above the tour.
- 67 focused tests, 201 source parses and 18 native transforms pass. Static artwork was visually reviewed in three modes; device/runtime acceptance remains pending. No builds, dependencies, pushes or main integration. QA: `docs/qa/redesign-063/FIRST-RUN-TOUR-INTEGRATION.md`.

### Earlier 0.6.3 remediation carried into the candidate

- Relabeled this pending release as 0.6.3; synchronized package/app versions and Android/iOS build numbers at 63. Prior runtime evidence was collected under 0.6.2; this relabel changes metadata only.
- Theme selection no longer changes native launcher components automatically. Settings offers a separate confirmed Apply launcher icon action; cancellation leaves the app running. Pending workspace saves must succeed before an icon change can proceed.
- Replaced the alternate-icon library's Android runtime at prebuild with an original Milvayo adapter. It reads actual component state and enables exactly one configured entry, disabling stale aliases; Android 13+ uses an atomic package-manager update. The upstream assets, aliases and iOS implementation remain in use.
- Added Expo SDK 58's compatible expo-system-ui to support Android system appearance. Requires a new installed build; Fast Refresh cannot add native modules or replace Kotlin code.
- Timeline uses a gesture-aware native chart ScrollView simultaneous with pinch, without disabling native scrolling during activation. Added focal zoom buttons, finite commit validation and diagnostic zoom breadcrumbs. Preset changes immediately rebase the drawing and calendar offsets, fixing a blank Weeks/Months canvas until the next scroll. Preserved task move/resize semantics and the 8192px canvas limit.
- Retain bounded previous-run diagnostic breadcrumbs even without a JS exception. Updated Android builds optionally read OS main-process exit history on the next start, identifying native/Java crashes, ANR and explicit low-memory records without inferring a crash from a missing exit or an OS signal. Native runtime acceptance remains required.
- Limited the test runner to two concurrent processes for phone/Termux environments. No project-data or import-format migration.
- Fixed the web Board mark’s invalid boolean DOM accessibility attribute. Brand loading is static and workspace/theme restoration run concurrently instead of waiting for the 3.7-second logo animation.
- Moved shared-value-bearing gesture relationships outside core Animated’s recursive prop traversal. Pinch previews counter-scale calendar/bar text, milestone glyphs and link dots; chart geometry keeps one shared timescale. Strict logging remains enabled.
- Added 18px translucent SVG zoom magnifiers with 44px targets, tooltips, focus/hover/pressed/disabled states and a coalesced per-frame commit path. Calendar labels use bounded UTC selectors; dependency routes are cached separately from viewport filtering.
- Gave the chart an explicit vertical extent and compute its visible rows from the owning Page scroll position, including trailing scroll events. Direct Chromium checks cover the final row in 34- and 1,000-task fixtures across presets, wheel and keyboard scrolling.
- Refined Overview into a compact fact rail and clearer action hierarchy; aligned screen introductions across Board, Tasks, Sprints, Projects, Programs, Portfolios, Settings and More. Added project name/code search with progressive results, readable line heights, refined Board cards, accessible control states and cached Board drag order. Existing accent palettes, domain rules and data formats remain.
- Added private warning fingerprints and startup/zoom timing correlations. Historical warning totals and missing clean exits are not treated as proof of a specific warning or crash.
- Earlier remediation baseline only: 771/771 tests, source/worklet parsing, dependency compatibility and direct Chromium checks passed before the present redesign. This is not a result for the redesigned candidate. Web sheets expose a named dialog and support Escape dismissal. Current evidence, limitations and reversible update plan: `docs/qa/remediation-062/ENGINEERING-REPORT.md`. No native/production builds, commit, push or deployment. Android/iOS runtime and release-mode performance remain acceptance gates.

---

## v0.6.1 — Dynamic Theme Icons (2026-11-05)

- Implemented native Android and iOS alternate launcher icons.
- Synchronized launcher icons with all ten accent colors and Daylight, Dark and AMOLED appearances.
- Added theme-aware web favicons and PWA installation manifests.
- Corrected launcher icon backgrounds, sizing and adaptive masking.
- Added regression tests for native icon configuration and theme synchronization.
- Updated release metadata and Android/iOS build numbers.

---

## v0.6.0 — Milvayo workspace redesign (2026-11-05)

- Promoted the redesigned application source from v0.5.59 to v0.6.0.
- Refreshed navigation, task and board experiences, timeline, project and governance surfaces.
- Preserved project data formats, local persistence, build credentials and GitHub workflow configuration.
- Reworked historical version assertions into version-independent metadata checks; retained behavioral regression tests.

---

## Timeline pinch zoom (0.5.59)

- Added focal two-finger date-axis zoom to Timeline. Calendar, chart, Today marker, bars and dependency paths share the same horizontal preview; final row/text/handle sizes stay unchanged. Native previews use existing RNGH 3/Reanimated UI-thread transforms; React receives gesture boundaries rather than frame updates. Web supports touch pinch and trackpad/Ctrl+wheel while retaining ordinary scrolling.
- Date density commits at completion, applying the focal offset through the existing chart scroll authority and native-driven calendar. Days/Weeks/Months reset custom density/preview state. Extra-finger changes rebase, cancellation releases scroll locks, and task callbacks suppress accidental pinch/residual tap/drop edits. Ordinary native task dragging retains its scrolling behavior.
- Bounded temporary overscan supports zoom-out previews; the existing 8192px canvas cap remains, including long schedules that can still zoom out. Tick density adapts to custom zoom. Inclusive resize/move rules, live line attachment, complete dependency SVG styling, all existing actions, task data, persistence/import formats and security remain unchanged. No migration, stored zoom, new package/configuration or version bump.
- **Validation:** 747/747 tests pass, including five new gesture/handler/screen integration checks and existing SVG styling hashes. All 153 app code files parse; native worklet compilation, Expo dependency compatibility, metadata synchronization (0.5.59) and whitespace checks pass.
- **Not run:** browser/Expo Go/device/Fast Refresh acceptance and hardware performance. No Android/Web bundles per user instruction. Direct local edits on `work`; no ZIP, commit, push, merge or deployment. QA/Termux acceptance/rollback: `docs/qa/NP-QA-timeline-pinch.md`; usage: `docs/instructions/ui-followup.md`.

---

## WBS pinch zoom, compact summaries and header follow-up (0.5.59)

- Added focal-point pinch zoom (25–400%) and bounded panning to WBS Tree in both directions, Fishbone and Mind map. Shared pure zoom math constrains scale/translation; native gestures transform on the UI thread, Web transforms the SVG container with scoped touch/mouse/wheel handlers. SVG children are memoized; no node layout or branch/dependency styling change. Finger-count changes, cancellation and leftover-finger handling prevent view jumps. Presets, resize/direction changes and exports remain available; Fit accounts for both viewer dimensions. No stored zoom, WBS/model/security/import-format change or new dependency.
- Direction and Fit/100%/150% now occupy one horizontally scrollable toolbar row. Every preset press resets the view, including repeated presses. The four summary cards are equal 88px tiles with 12px padding, retaining derived counts/hours and responsive two/four-column layouts.
- Removed project-name text from phone/wide Work and Projects headers, including their section views. Hamburger project/workspace popup, search/actions and project record names remain; the previous Home suppression remains.
- **Validation:** 742/742 tests pass; all 150 app code files parse; native worklet transformation, Expo dependency compatibility, version synchronization (0.5.59) and whitespace checks pass. Gesture handlers and controls are tested with deterministic mocks, not hardware.
- **Not run:** Web/browser, Expo Go/device, Fast Refresh and hardware gesture acceptance. No Web/Android bundles per user instruction. Direct edits on `work`; no ZIP, commit, push, deployment or merge. QA/Termux acceptance/rollback: `docs/qa/NP-QA-wbs-pinch-zoom.md`; usage: `docs/instructions/ui-followup.md`.

---

## List Due soon, vertical Add list and screen chrome (0.5.59)

- Moved Board Upcoming dates to the List view as **Due soon**, including its per-board calendar switches in List → Tools. Existing `powerUps[boardId]` calendar settings are reused with no rewrite or migration. Enabled, non-archived boards contribute open tasks due in the next 30 days; the combined preview is sorted and capped at 30, initially showing one task with See more/less and the existing task-open callback. Board no longer renders the dates panel or its calendar switch.
- Moved/renamed the UI file to `src/screens/tasks/DueSoon.js`; added a pure display selector at `src/screens/tasks/dueSoon.cjs` that delegates to the unchanged existing date selector. Calendar catalog copy now matches Due soon. No saved task, backup-format or business/security change.
- Home's phone and wide top headers retain the hamburger without project-name text. The project popup still provides project context and switching; other project headers keep their name.
- Board Add list stays at the right end, now vertical and compact (44px wide, at least 112px tall). Existing zero-origin column windowing, measured drag geometry, list creation and ordering rules are preserved.
- Removed standalone visible page titles from Today, delivery screens and phone More/subpage headers. Back navigation, search/zoom, header actions, content section headings, record names and popup titles remain. Page metadata is retained without rendering redundant headings.
- **Validation:** 734/734 tests pass, including six focused display/handler checks and import/no-mutation coverage. JSX: 146 app source files pass; changed UI scope, version synchronization and whitespace checks pass. `npx expo install --check`: Pass. No package/dependency change; metadata stays 0.5.59.
- **Not run:** browser/Expo Go/device/Fast Refresh acceptance. Web/Android bundles omitted at the user's request. Direct local edits on `work`; no ZIP, commit, push, deployment or merge. QA/rollback: `docs/qa/NP-QA-list-due-soon-screen-chrome.md`; current usage: `docs/instructions/ui-followup.md`.

---

## UI follow-up — Workspace popup, Board, sprint charts and task controls (0.5.59)

- Replaced the top project-dropdown trigger with a 44px hamburger in phone and wide headers. It opens a compact task-sheet-style Workspace menu with Projects and Workspaces tabs, retaining project selection/creation and workspace switch/create/rename/confirmed deletion. Reuses existing drawer content inside the shared Sheet, with one scroll authority, inline errors and existing dismissal/busy states. Compact sheets are content-sized up to 76% height; wide popups are 420px with a 90% width limit. Ordinary task sheets keep their existing layout.
- Board Upcoming dates shows one task by default; See more/See less discloses the existing list without changing the 30-day/30-item selector. Expansion resets on board changes. Add list moves to the right end as a smaller horizontal control with at least a 44px touch height. Column viewport calculations now start at zero; measured drag geometry, insertion rules and list creation remain unchanged.
- Sprint burndown retains its line graph and adds the mock's neutral bars, selected accent and ideal ticks. Two accessible SVG icon buttons above the chart choose Line graph/Bar graph. Both modes use the same history/selection/series visibility, with zero/single-day/empty-history handling. No sprint-domain, history cutoff, completion or pre-start inference change.
- Added the per-project **Advanced tasks** switch to Project tools. It replaces the Standard/Advanced selector inside task sheets and controls the existing advanced editors. This is a non-screen setting: tasks and every core route remain available. Disabling it changes no task fields.
- **Additive setting:** `tools.advancedTasks`; existing projects/missing keys default on to retain editor access, new lean projects default off. Existing normalization/save/export/import handles the boolean; no startup rewrite or backup-format change. Older releases ignore the extra key. Round-trip and no-data-loss tests cover switching off/on.
- Removed the bottom bar's top outline and selected-tab surface. Selected icons grow from 19px to 24px inside a fixed 28px box; labels, Create, swipe and stale-press guards remain.
- **Validation:** 730/730 tests pass, including 12 new presentation/handler checks. JSX parsing: 145 app source files pass; changed UI identifier check and `git diff --check` pass. Expo dependency check passes; package/lock/Expo metadata stay synchronized at 0.5.59. No new dependencies, commit, push, deployment or merge.
- **Not run:** further Web/Android bundle checks, stopped at the user's request; browser visual/keyboard, Expo Go/device, hardware motion and Fast Refresh acceptance. Earlier cold bundle requests timed out while Metro compiled. Full QA/rollback: `docs/qa/NP-QA-header-workspace-popup.md`; usage: `docs/instructions/ui-followup.md`.
- Today now keeps Project overview as the main always-visible content; Needs attention and Next due are count-bearing buttons opening compact task sheets. Weighted-progress acceptance text wraps within its card. Existing metrics, task links, empty states, pagination and tool gating remain.
- Delivery is direct source changes in `/mnt/milvayo-rebrand`; no new ZIP per the user's latest instruction.
- Future redesign batches remain in their established order; this follow-up does not claim completion of the remaining dense screens.

---

## Redesign batch 03 — Timeline ribbons, Today and delivery screens (0.5.59, no version bump)

- Compared against `MilvayoRedesignPreview`, retaining Milvayo's actual model, selectable palette and shared controls. Used MemoryRelay design guidance and the bundled Unslop review standard by Damir Sokolovsky (CC BY 4.0); restored the missing skill from the original local checkout with attribution intact.
- Timeline: quieter action ribbon, pinned two-row weekday/date calendar, month context at boundaries, daily ticks at normal Days zoom, softer 32px task bars with 8px corners and status edge. View selectors use 14px outer/9px inner corners with a 4px inset and press feedback. Dependency colors and complete SVG styling remain byte-for-byte unchanged; the bar/link centre stays at 27px. Move/resize/link callbacks, live dependency previews, grids, weekends, today marker, critical path and all ribbon/sheet controls are retained.
- Home: Today, attention rows and next-due work lead; empty/sample starters open existing task creation, explicit Settings/Backup import and Projects. All previous statistics, stage distribution and tool-aware shortcuts remain in Project overview. Daily display selection is pure and read-only; it does not change a task's state.
- Releases: gate summary and progress before detailed verification; every stage, metadata field and confirmed-delete control retained. Testing: compact four-status summary and grouped check rows; result sheet and pagination retained. Sprints: metrics alongside existing interactive burndown, Manage sprint disclosure, and initially expanded assigned tasks; lifecycle rules and frozen history remain in `src/domain/agile.cjs` unchanged.
- Motion: retained immediate chart/drag feedback, added view-selector press surfaces, and refined existing 185ms native disclosure rotation with the shared Unslop ease-out and system reduced motion. No new animation package.
- Tests: ten new presentation/control/handler checks across five screens, including failure handling, empty/sample/disabled-tool states, import round trip, dependency-style preservation and calendar density. Full suite: **718/718 pass**. JSX: **144 app source files pass**. `npx expo install --check`: **Pass**. Current Web and Android development bundles: **HTTP 200** from Metro.
- Packaging repairs: restored the missing Android workflow from the original local checkout; excluded the separate app mock and skill resources from application path-header scans. Project-root ZIP includes synchronized package/lock/Expo metadata, one cumulative changelog, QA and reversible Termux installation guide; excludes old patch installer scripts and nested mock archives.
- **Not run:** browser visual/keyboard acceptance, Expo Go touch interaction, hardware animation profiling, Fast Refresh and iOS runtime. Metro's host DevTools auto-install warning does not prevent successful bundling. See `docs/qa/NP-QA-redesign-batch03.md` and `docs/instructions/redesign-batch03.md`.
- **Migration:** none in this batch. No dependency, data/schema, backup-format, remote/security, commit, push, deploy or merge changes. Existing batch 02 tools migration remains documented below.
- **Next:** Resources/Costs/Reports; Automations; Scheduling/Collaboration/Specifications; Settings/Backup; Projects/Portfolios/Programs, each with its own control-preservation test.

---

## Redesign batch 2 — Project tools switches, pill order (on top of v0.5.59, no version bump)

- **Work pill order:** Board, Timeline, List, Sprints (swipe follows the same order).
- **Project tools switches:** each project can switch these tools on or off: Sprints, Releases, Testing, Activity, Resources, Collaboration, Costs, Automations, Reports, Specifications. Off hides the screen and its shortcuts (pill, More, wide sidebar, Overview shortcuts, the Release row in the Create sheet). The data is never read, changed or deleted by a switch. Switch it back on and everything is there.
- **Where to switch:** More, Project tools, Manage tools (and Settings, General, Choose tools, which also serves the wide layout).
- **Always on:** Overview, Board, Timeline, List (Tasks), Scheduling, Projects, Portfolios, Programs, Settings.
- **Migration (additive, no rewrite):** a project saved before this batch has no `tools` field and loads with every tool on. Nothing is written on load; the field is saved with the project's next ordinary edit. Damaged or unknown values fall back to on and never stop a workspace from loading. Backups and project files without the field import with every tool on; the schema documents the new optional `tools` object.
- **New projects start lean:** Sprints, Releases, Testing and Activity on; Resources, Collaboration, Costs, Automations, Reports and Specifications off. The first-run sample project and every existing project keep everything on.
- **If a tool is switched off while its screen is open,** the app returns to Board (Work tools) or More. More always keeps its Project tools group so a tool can be switched back on.
- **New files:** `src/domain/projectTools.cjs`, `src/store/useProjectTools.js`, `src/screens/more/ProjectToolsSheet.js`, `tests/domain/project-tools-060.test.cjs`.
- **Changed:** `model.cjs` (normalizes `tools`), `store.js` (`setProjectTool`, lean new projects), `sections.cjs`, `More.js` (groups: Project tools, Plan, App), `Overview.js`, `Workspace.js` (Settings card), `CreateMore.js`, `ModernApp.js`, project schema JSON.
- **Tests:** 8 new tests (migration, lean defaults, data untouched, round trip, navigation, "all 19 reachable and any tool restorable"). Parity tests updated for the new order and More layout.
- **Not run:** Expo Go, Web build, device behaviour.
- **Unchanged on purpose:** `Timeline.js` (date ribbon, weekend shading, grid lines and dashed today line stay as they were).

---

## Redesign batch 1 — phone shell (on top of v0.5.59, no version bump)

Relocates and discloses; removes nothing. All 19 menu entries, all 20 screens and every `go()` route are kept. Business logic, store, board drag, timeline gestures and dependency lines, island notices and the wide/desktop layout are untouched.

- **Bottom bar:** Home, Work, a centre Create button, Projects, More. Swipe on the bar moves between the four sections. The bar button returns to the last view used in that section.
- **View pill under the header:** Work = Board, List (Tasks), Timeline, Sprints. Projects = Projects, Portfolios, Programs. Swipe on the pill steps between views. Reuses the shared Segmented control.
- **Header (phone):** project switcher, search icon (closing it clears the filter), and the screen's own controls as icons: Tools (Board, List), New sprint, New release, Timeline zoom (one tap cycles Days, Weeks, Months). Replaces the hamburger and the "New task" text button.
- **Create sheet:** the + button opens the existing New task sheet; "Create something else" adds Project (existing Create project sheet) and Release (opens the new-release form).
- **More screen:** replaces the side drawer. Lists every entry that is not in the bar or a pill (Scheduling, Releases, Testing, Resources, Collaboration, Costs, Automations, Reports, Activity, Specifications, Settings), plus workspace switcher, Appearance (light, dark, AMOLED) and Desktop layout (web). Sub-screens show a back arrow to More.
- **Brand:** the in-app wordmark is the new tintable `assets/milvayo-mask.png`; old Niyarvo/Projects masks stay in `assets/` but are no longer used.
- **Web only:** `touch-action: manipulation` on buttons, tabs and radios for faster taps.
- **Removed (replaced, not functionality):** `SideMenu`, `MenuToggle` (animated hamburger, one JS animation less). Icon detail: the Appearance row shows sun or moon and the mode name; the separate filled-moon glyph for AMOLED is dropped.
- **New files:** `src/app/navigation/sections.cjs` (single navigation map and swipe rule), `src/screens/more/More.js`, `src/components/shell/CreateMore.js`.
- **Tests:** new `tests/app/phone-shell-parity-060.test.cjs` (12 tests: every old menu entry has one home, swipe rules, header controls, Create sheet, reused gesture and notice code). About 30 older source-pattern tests were retargeted from the old drawer/hamburger/Niyarvo masks to the new shell; none was deleted without an equivalent assertion.
- **Not run:** Expo Go, Web build, device behaviour, `npx expo install --check` (no network or node_modules in the build environment).

---

## v0.5.59 Android CI hotfix — direct GitHub native APK build (no version bump)

- Replace EAS cloud build step with GitHub-hosted Expo prebuild + Gradle `assembleRelease`.
- Restrict test APK to `arm64-v8a`; verify APK native libraries before upload.
- Reuse the original Milvayo keystore downloaded once from EAS, upload securely as four GitHub Actions secrets, and verify SHA-256 signing fingerprint before and after building.
- Match the Termux npm peer-dependency mode with `npm ci --legacy-peer-deps`; keep the user's already-repaired package and lock files.
- Ship a local one-time helper to transfer EAS credentials into GitHub secrets without printing passwords.
- Retain the EAS project registration and `eas.json` for recordkeeping; this workflow no longer uses Expo cloud builds or `EXPO_TOKEN`.
- Tests updated for direct GitHub native compilation and credential handling. Native build still requires a real GitHub Actions run.

---

# CHG-NP v0.5.59 — Board Launcher and First Android APK Workflow

**Baseline:** v0.5.58. **Version:** 0.5.59. No migration or business-logic change.

## Added

- Official *Projects Board* launcher assets (not the company ribbon N) for Android, iOS and PWA. Retains all six card openings and the three-column official gradient artwork.
- Default Coral Board icon on a dark navy background, with 1024px iOS/legacy Android icon and 1024px adaptive Android foreground, monochrome foreground for Android system-themed icons, 192/512px PWA and maskable assets, and favicon / Apple Touch icons.
- Full set of ten branded Board icons in `assets/app-icons/` and ten 64px web-tab icons in `public/icons/colorways/`.
- Default selected *in-app* accent changes from Orange to Coral on new installations. Existing saved accent choice continues to take precedence.
- Web tab favicon follows the selected theme accent. This does not alter the icon already installed on a device's home screen.
- `eas.json` with signed internal Android APK preview profile.
- `.github/workflows/android-apk.yml` with manual trigger, Expo EAS cloud build, APK retrieval and GitHub artifact upload.
- APK URL validator and four regression tests for icon dimensions, colorways, workflow and artifact URL validation.
- One-time Expo linkage, account token, and EAS keystore instructions in `docs/instructions/android-apk-first-build.md`.

## Verification and limitations

- Full Node test suite passed; no changes to encrypted-backup format, project schemas, Firebase rules, or collaboration behavior.
- Native APK, EAS project initialization, Github Actions workflow run, installation and real-device test **have not been performed** by this release generation environment. The supplied ZIP is **build-ready after one-time Expo project / signing setup**, not a prebuilt binary.
- This release does **not** implement automatic Android/iOS launcher icon switching when in-app accent changes. That requires native alternate icon declarations and implementation, a custom preview build and device verification. Installed PWA icon automatic refresh is not reliable across browsers.
- Android's system-themed monochrome icon colors are controlled by the launcher wallpaper/theme, **not** the Niyarvo accent.
- The test workflow builds only after `EXPO_TOKEN` is added as a repository secret and an actual Expo `extra.eas.projectId` is initialized.

## Next planned phase (not yet implemented)

After APK acceptance, separately design and enable Milvayo Firebase Authentication, Firestore documents and secure invitations/roles/card assignments with server-side authorization. Keep RIVNA and Niyarvo Control Center isolated.

---

# Milvayo — Complete release history

**Historical coverage:** v0.1.0 through v0.5.58, with recovered source notes and verified subsequent release records.
**Source preservation:** Original historical changelog text recovered from the supplied pre-v0.5.34 archives; later releases recovered from their verified changelogs. Original hotfix records are included under their parent version.
**Important:** These are release and development records, not evidence that every historical QA candidate was deployed, committed, or device-tested. Historical commands and URLs may be obsolete.

## Index

- **0.1.x** — 1 documented version(s), 0.1.0 to 0.1.0
- **0.2.x** — 10 documented version(s), 0.2.0 to 0.2.9
- **0.3.x** — 13 documented version(s), 0.3.0 to 0.3.12
- **0.4.x** — 8 documented version(s), 0.4.2 to 0.4.9
- **0.5.x** — 59 documented version(s), 0.5.0 to 0.5.58

---

## v0.1.0



# CHG-NP-0.1.0 — Milvayo foundation

| Field | Observed state |
|---|---|
| Product | Milvayo — independent project management product |
| Scope | React Native + Expo Web PWA starter with desktop/mobile layout |
| Project integration | No connections to RIVNA or Niyarvo Control Center |
| Firebase integration | Not configured. `firebase.json` provides **Hosting only** |
| Cloud authentication | Not implemented |
| Sample content | Neutral fictional Northstar Studio example only |
| Source repository | Not created/pushed by assistant |
| Node tests | 9/9 passed locally |
| App JSX parser | Passed TypeScript JSX parser |
| Expo dependency installation | Not verified in this sandbox (registry timeout) |
| Real web export/browser testing | Not run; must be performed in Termux |
| Android APK | Not built or requested |

## Feature modules

- Overview dashboard: derived task/check metrics and stage distribution.
- Kanban board and task list/search.
- Task detail: check evidence, actual/expected, branch/main SHA, rollback.
- Release creation/editing with gated Released status.
- Project selector, add/delete, backups/restore, data schema & API readouts.
- Import/export using `niyarvo.project.v1`; workspace JSON export and import.
- PWA manifest/service-worker source prepared.

## Risks and limitations

- `AsyncStorage` on web is local browser storage, not an encrypted or server-side backup.
- No user login, access permissions, cloud synchronization, GitHub actions or real Git verification.
- Sample verified entries are demonstration fixtures, not observed releases.
- No user roadmap was imported as part of this delivery.
- Firebase Hosting alone does not restrict site access.

## Next model handoff

1. Install dependencies in Termux and run `npm test`, `npx expo install --check`, and `npx expo export --platform web --output-dir dist`.
2. Serve `dist` on localhost:8083. Validate all views on desktop/mobile; test new task, release, verification gating, project switch, export/import and restore.
3. Address any RN SDK 58 web issues without changing the versioned import schema prematurely.
4. Create a separate Firebase project (never use existing other project IDs), then implement auth/security before cloud storage.
5. Only after UI and project schema acceptance convert the engineering roadmap to a single imported `.project.json`.

---

## v0.2.0



# CHG-NP-0.2.0 — Local-first Kanban & Roadmap QA Candidate

**Date:** 2026-10-30
**Product:** Milvayo (independent app — NOT RIVNA/Control Center)
**From:** v0.1.0 source archive
**To:** v0.2.0 local QA candidate (NOT user-accepted or deployed)
**Suggested branch:** `feat/np-v0.2-boards-roadmap` (not created in user's Git repo)
**Git SHA / merge:** Not available / not performed
**Firebase deployment:** Not performed (new standalone project required)

## READ FIRST — 60-second handoff

- This ZIP contains project-root source files directly; there is **no enclosing folder** and no `node_modules` or `.git` data.
- User develops on **Android + Termux** with `npx expo start` and Fast Refresh. Prefer Expo Go and Web testing first. Do not use Python/static servers as the everyday dev flow.
- **The app was NOT executed in Expo Go, a full browser, or iOS in this environment.** Model tests + JSX syntax passed; platform workflow acceptance is pending.
- **Do not import real engineering roadmaps or production-sensitive data yet.** Keep the fictional Northstar fixture.
- Export/backup the user's v0.1.0 workspace before overwriting files; while data is intended to migrate via the same AsyncStorage key `milvayo-v1`, runtime migration is unverified.
- No connections to RIVNA / Niyarvo Control Center. Firebase settings are deny-all scaffolding only.

## Scope completed in source

| Area | Implemented change | Evidence |
|---|---|---|
| Branding | Supplied centered Niyarvo ribbon `N` rendered as app launcher, adaptive, PWA (192/512/maskable) and favicon assets; sidebar symbol | Generated images under `assets/` and `public/icons/`, app.json/manifest |
| Kanban | RN PanResponder grab handles, target lane measurement, within-lane ordering using task `position`; status edit remains accessible via task editor | `App.js:Board/DraggableCard`, `src/model.cjs:moveTask` |
| Dependencies | `dependsOn` graph; missing IDs/cycles/self-dependencies rejected; cannot move blocked task to Done | `src/model.cjs`, 2+ tests |
| Timeline | 14/30/90-day horizontal task timeline; scheduled vs unscheduled tasks; date bar opens task; shift arrows; editable task dates | `App.js:Timeline` |
| Automation | Per-project enabled/paused local rules on entering a lane; actions: set priority, stage, owner or due-date offset | `src/model.cjs:moveTask`; `App.js:Automations` |
| Attachments | Add/open/remove HTTP(S) attachment **links**, stored in task JSON | App task editor / import tests |
| Native import/export | Expo SDK 58 document picker, file system and OS share sheet added, preserving Web path | App.js; requires on-device testing |
| Persistence | Serialized AsyncStorage writes; corrupt stored workspace raises a recovery screen instead of overwriting data | App.js load/save hooks |
| Import guard | Preserve imported backups/activity alongside pre-import recovery snapshot; reject duplicate project/task IDs and excessive collections instead of silent truncation | src/model.cjs and tests |
| CRUD | Task delete with pre-delete snapshot, release delete with automatic workspace snapshot + unassign; project CRUD remains | App.js |
| Release truth | Display a changed-after-release warning when a recorded Released release no longer passes current gate; dependency readiness required | model.canRelease / UI |
| Cloud prep | `firebase.json` + deny-all Firestore/Storage rules, explicit-project-ID guarded Hosting script | scripts/deploy-hosting.cjs |

## Test evidence (this environment)

| Check | Result | Detail |
|---|---|---|
| Node data-model tests | **PASS 16/16** | `npm test`; baseline 9 + 7 new tests |
| JSX parser | **PASS, 0 diagnostics** | TypeScript JSX syntax parse for `App.js` |
| Project/manifest/schema JSON | **PASS** | Parsed during asset generation and schema edits |
| Deploy script Node parse | **PASS** | `node --check scripts/deploy-hosting.cjs` |
| Android Metro bundle | **NOT RUN for v0.2** | Dependency installation unavailable in review container |
| Expo Go Android runtime | **NOT RUN** | Must be performed on user's Android device |
| Desktop/mobile Web runtime | **NOT RUN** | Must use Metro browser QA in user environment |
| iOS build/runtime | **NOT RUN** | iOS build/test requires Apple-capable environment or remote build |
| Firebase Hosting deployment | **NOT RUN** | Separate Firebase project not configured |
| Drag-and-drop real pointer/touch QA | **NOT RUN** | PanResponder + measureInWindow must be field tested on Web and Android |
| Native JSON picker & share QA | **NOT RUN** | SDK-compatible APIs selected from Expo documentation; not tested on device |

## Explicit limitations / known risks

1. **Attachments are URL references only**, not local/cloud binary uploads; secure Firebase Storage requires Auth, ownership rules and upload size/type enforcement.
2. Drag handles are a **first iteration**: no auto-scroll during drag to off-screen Kanban lanes, multi-card drag, virtualized thousands-of-cards performance or keyboard DnD. Status chips in task modal are the fallback.
3. Timeline is **interactive via bars and shift controls**, not continuous freeform resize/drag or critical-path dependency connector rendering; a full Gantt implementation is a later batch.
4. Automations execute **locally on status transitions only**; no scheduled reminders, notifications, webhook actions, background processing or cloud action orchestration.
5. No users, teams, comments, calendar integrations, per-board permissions or realtime sync yet.
6. Existing edits still commit per keystroke to state; disk writes are serialized but not debounced. Stress testing is needed.
7. Workspace and attachments are **not end-to-end encrypted**; these are local client records. No cloud authentication or Firestore data sync has been enabled.
8. v0.2 Web, Android, iOS behavior remains unverified; do not merge/deploy or import real data until tested.

## Required first runtime acceptance passes

1. Save a `.project.json` and a `.workspace.json` from v0.1.0 **outside the device**. Capture original project/task counts.
2. On separate dedicated Git branch, extract v0.2.0 source into repo (project root), run `npm install`, `npm test`, `npx expo install --check`, then `npx expo start`.
3. Check desktop Web (4 Kanban lanes visible), mobile browser, and Android Expo Go. Confirm Niyarvo icon crop and sidebar logo.
4. Drag card from Backlog to In progress; reorder cards within one lane; reload and ensure order/status persists. Test all four lanes and rapid repeated drags.
5. Add A -> B dependency; verify B cannot be marked Done before A; finish A and move B. Try B -> A circular dependency; expect an error and unchanged graph.
6. Schedule a task, shift dates in Timeline, check bar position after reload, edit start/due, inspect 14/30/90 scaling.
7. Create an automation rule (enter Validation -> priority High); move a Medium task; check priority. Pause rule and repeat; check no action. Ensure release verification cannot be faked by automation.
8. Add attachment HTTPS link, open it, remove it; export/import project and verify link metadata persists.
9. On **Android Expo Go** import a JSON via system picker and export via OS share sheet; repeat on Web with file chooser and browser download.
10. Test project create/rename/switch/delete, task create/edit/delete, release create/edit/delete, recovery snapshot after delete and workspace import with backups/activity.
11. Deliberately test corrupt imported JSON / duplicate IDs / >30 projects in a **throwaway** workspace only. Never use real data to test destructive cases.
12. Record screenshots, device logs, failures and version info; **only commit and merge to main after verified fixes**.

## Separate Firebase deployment gate

- Create NEW Firebase project (distinct Google account/project from any other products); choose Hosting domain.
- User confirms project ID; set `MILVAYO_FIREBASE_PROJECT_ID` in Termux, then `npm run deploy:hosting`.
- Script builds Web and deploys **Hosting only**, never silently Firestore/Storage; explicit ID and prohibited-name guard.
- Firestore and Storage rules are **deny-all placeholders**, not a configured sync backend.
- No Firebase deployment before local Web + Android acceptance, no sensitive roadmap imports until app acceptance.

## Files / change footprint

- Changed: `App.js`, `src/model.cjs`, `app.json`, `package.json`, `firebase.json`, `public/manifest.json`, `public/service-worker.js`, `public/icons/*`, `schemas/niyarvo.project.v1.schema.json`, `README.md`.
- Added: `assets/*`, `scripts/deploy-hosting.cjs`, `firestore.rules`, `storage.rules`, `tests/board.test.cjs`, `CHG-NP-0.2.0.md`, `docs/CHG-NP-0.2.0.md`.
- Not included: external engineering roadmaps, Firebase credentials, user account data, APK/IPA, node_modules, Git history.

## Recommended follow-up batch

`NP-QA2`: fix observed UI pointer/gesture/scroll defects, validate native JSON import/share, verify local persistence and recovery. After QA acceptance, `NP-FIREBASE1`: isolated Auth + Firestore ownership rules + emulator tests, private Storage attachments, sync conflict handling and migrations. Then `NP-ROADMAP2`: draggable/resizable Gantt, dependency arrows, critical path, calendar and richer automation.

---

## v0.2.1



# CHG-NP-0.2.1 — Project navigation, Kanban auto-scroll and Gantt interactions

**Application:** Milvayo (independent).
**Source base:** `Milvayo-v0.2.0-LOCAL-QA.zip` (not the user's unshared subsequent Termux changes).
**Patch classification:** Local QA candidate, **not** a stable release.
**Target Git branch:** `work`. Do not commit or merge into `main` before runtime acceptance.
**Date:** 2026-10-30.

## 0. Read first

This patch preserves the existing Expo SDK 58 + React Native architecture and the local AsyncStorage key `milvayo-v1`. No project data was imported, no unrelated repositories/credentials were used, and no Firebase account/project was connected. It is intended to be extracted into the already-existing `~/Milvayo` working directory while on `work`.

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
cd ~/Milvayo
git switch work
git status --short
# Export your workspace backup before replacing files
unzip -o ~/storage/downloads/Milvayo-v0.2.1-LOCAL-QA.zip -d .
npm install
npm test
npx expo install --check
npx expo start
```

After the user has manually accepted the patch on Web and Android, commit to `work`, push `work`, then merge using a verified Git checkpoint. Do not create a release tag while the runtime QA gate is open.

---

## v0.2.2



# CHG-NP-0.2.2 — Full-card Kanban drag and independent Gantt planner

**Project:** Milvayo only (not Niyarvo Control Center, not RIVNA)
**Base:** User-provided `Milvayo-v0.2.1-LOCAL-QA.zip`
**Target branch:** `work`
**Status:** Source patch / **local QA candidate**, NOT device-verified and NOT a production release
**Date:** 2026-10-30
**Persistence:** `milvayo-v1` AsyncStorage key unchanged
**Architecture:** React Native + Expo SDK 58 + Expo Metro (`npx expo start`)

## 0. Read first

This release responds to the 2026-10-30 user screenshots and testing: v0.2.1 board drag used a small handle, left a faded card and displayed a detached purple drag ghost; its Timeline showed date bars but did not behave like the reference Asana-style Gantt screen. The user specifically requires independent architecture informed by—not copied from—OpenProject source and Gantt reference screenshots.

**Source inspection, unit tests and JSX syntax parse are complete. Android touch, browser pointer events, landscape/portrait rendering and iOS have not been run here. No Firebase deployment or Git operations were performed.**

## 1. Implemented changes

### Kanban card interactions
- Removed the purple handle, old translucent moving-card design and globally positioned drag-ghost box.
- Entire task card accepts a **340 ms press-and-hold** followed by PanResponder movement; a normal tap still opens the task editor.
- A full-size rendering of the original card is positioned over the board, using the original card's measured screen position and the finger's original page coordinates. The position is updated from pointer displacement, not a fixed `-115px`/`-45px` offset.
- The original card's location is left empty during dragging; the full-size card is the only moving representation. No artificial shadow/elevation is added.
- Retained board edge auto-scroll and lane/ordering calculations. As with v0.2.1, touch behavior **requires device QA**.

### New independently implemented Gantt
- `src/gantt.cjs`: UTC-day scheduling/geometry, grouping, a bounded/pannable calendar domain, milestone geometry, predecessor connectors, overlap/conflict reporting, align-after-predecessors scheduling, and demo-only date filling.
- `src/GanttView.js`: a task column that stays visible beside the horizontally scrolling date grid; month/day/week-scale rulers; status/stage groups; task status colors; draggable task bars; end-date resize grips; milestone diamonds; finish-to-start dependency connectors; error and conflict indicators; predecessor selection dialog; optional align-after-predecessors action; explicit scheduling of previously undated tasks.
- All tasks, including unscheduled ones, have a row in the Gantt view. The new view also supports a 90-day window shift in both directions and a Today jump.
- The installed sample project previously had no dates. The **opt-in** Populate example Gantt action adds demo dates *only* if `sample-workspace` has no scheduled tasks; a workspace recovery snapshot is saved first. This action reopens the example tasks' verification status due to schedule changes.
- `milestone` is an optional boolean in normalized tasks and in the project JSON schema. A task editor checkbox controls it. The import format remains `niyarvo.project.v1`.
- Dependence and schedule changes now invalidate stale task `verified`/`merged` metadata (existing release readiness is not silently left valid).
- Task date normalization rejects impossible calendar dates (such as 2026-02-31). Reversed but syntactically valid dates remain visible as warnings in the Gantt instead of being silently drawn as valid bars.

### Architectural guardrails
- Gantt domain logic, dependency validation, scheduling and geometry are independent pure modules with Node tests.
- Existing project CRUD, status lanes, local JSON import/export, snapshots, release gates, and Niyarvo icons are retained.
- No source from OpenProject, Asana or other third-party project-management applications was copied. Their architecture and screenshots informed independent design decisions only.

## 2. Source changes

| File | Change |
|---|---|
| `App.js` | Whole-card gesture, in-place drag overlay, Gantt integration, milestone editor, sample-date snapshot action |
| `src/GanttView.js` | New independent RN Gantt component |
| `src/gantt.cjs` | New pure UTC date/geometry/dependency helper module |
| `src/model.cjs` | Milestone normalization, date validation, expose pure Gantt module, invalidation after dependency/date edits |
| `schemas/niyarvo.project.v1.schema.json` | Optional `milestone: boolean` |
| `tests/gantt.test.cjs` | Gantt scheduling, date correctness, dependencies, milestone, input preservation and conflict regression tests |
| `package.json` | `0.2.2`, no new dependencies |
| `README.md`, `docs/CHG-NP-0.2.2.md` | User instructions and handoff |

## 3. Verified checks

- `node --test tests/*.test.cjs`: **40 passed, 0 failed**.
- TypeScript parser check, `App.js` and `src/GanttView.js` as JSX: **0 syntax diagnostics**.
- JSON schema parse: **valid**.
- ZIP file structure: project-root files, no enclosing folder; no `node_modules`, build artifacts, `.git`, or environment secrets.

### Not run / not verified

- Expo Metro/Expo Web actual bundling in this container: **Not run** (node_modules not installed).
- Android Expo Go touch interactions: **Not run**.
- Browser drag pointer interaction: **Not run**.
- Real rendering in portrait/landscape: **Not run**.
- iOS: **Not run**.
- Firebase/Hosting: **Not connected or deployed**.
- Git checkpoint or GitHub push: **Not performed**.

## 4. Manual acceptance gates, on `work`

1. **Backup and branch**: export workspace JSON externally, confirm `git branch --show-current` returns `work`, and verify `git status --short` before extracting. If `work` is dirty, preserve local modifications first; do not blindly overwrite them.
2. **Metro**: `npm install`, `npm test`, `npx expo install --check`, then `npx expo start` in Termux; test both Android Expo Go and browser.
3. **Kanban**: Tap a card to edit. Long press any point of the card (no handle), then drag. Confirm card remains anchored to the point touched, no detached ghost or dark moving shadow appears. Drag across multiple columns while the edge auto-scroll operates, then release. Verify lane and within-lane position survive reopening the app. Also verify a regular scroll gesture without a long press does not drag cards.
4. **Gantt**: Open Timeline in mobile portrait, mobile landscape and desktop. Confirm a fixed task-name column and horizontally scrolling dated grid. Toggle Days/Weeks/Months and Status/Stage grouping. For an unscheduled task, tap Schedule; for the bundled demo only, choose Populate example Gantt (saves a backup). Drag a bar and its right resize grip. Mark a task milestone in the editor and check its diamond sits at the due date.
5. **Dependencies**: Open the link button on a task; link a scheduled predecessor; check the connector and the conflict warning if successor starts too soon. Choose Align after predecessors and verify the successor moves without changing duration. Try a circular dependency and verify an error in the dialog.
6. **Persistence**: Restart Expo Go/web. Confirm changed dates, dependencies, milestone flags and ordered Kanban states survive. Export/import project JSON and check `milestone` and predecessors are still there. Restore a saved snapshot.
7. **Regression**: Verify project switch/archive/restore, delete and recover, JSON native import/export and production guardrails unaffected by this patch.

**Do not merge into `main` until these runtime checks pass.** If anything fails, report the observed error, platform, and steps to reproduce. A source-level test pass is not an assertion of end-to-end functionality.

## 5. Known deliberate limitations

- The dependency graph currently models only *finish-to-start* predecessors (`dependsOn`) without working-day calendars, lags, lead times, task hierarchy, critical path or automatic propagation of changes to all descendants.
- `Align after predecessors` is explicit rather than automatically moving linked tasks. It protects users from silent schedule changes.
- Project tasks are rendered in one timeline list. Large (thousands of tasks) workspaces need virtualization and performance testing before production acceptance.
- Gantt connector creation uses a controlled predecessor-picker, not drawing a new dependency by dragging from one bar onto another.
- Native/browser press-and-hold and scroll interactions require device verification. The implementation deliberately adds no third-party gesture package before that validation.
- Collaboration, actual binary attachment uploads, notification delivery, and cloud synchronization are not in this patch. They require a separate Firebase project, authentication, rules and security tests.

## 6. Git checkpoint when verified

```bash
cd ~/Milvayo
git switch work
# Export a workspace JSON backup first
unzip -o ~/storage/downloads/Milvayo-v0.2.2-LOCAL-QA.zip -d .
npm install
npm test
npx expo install --check
npx expo start
# After Web + Android QA passes, create a checkpoint:
git add .
git commit -m "Milvayo v0.2.2: full-card drag and Gantt planning"
git push origin work
# Main merge only after explicit acceptance.
```

---

## v0.2.3



# CHG-NP-0.2.3 — Gantt Direct Linking + Critical Path (LOCAL QA)

## READ FIRST

| Item | Observed state |
|---|---|
| Project | Milvayo (standalone; unrelated to RIVNA or Control Center) |
| Parent | v0.2.2 LOCAL-QA source ZIP, as supplied in the conversation |
| Current patch | v0.2.3, local QA candidate |
| Git | No Git commands, commits or merges executed in user repository |
| Metro / devices | Not run in this environment |
| Firebase | Not connected, no deployment |
| Roadmap imports | Not performed |

## User-verified prior behavior

User confirmed v0.2.2 whole-card Kanban drag and Gantt bar move/resize, and located predecessor editor. Those interactions have not been changed by this patch.

## Changes

- `src/gantt.cjs`: pure calendar-day CPM (topological earliest/latest pass, float, critical tasks/edges). Excludes unscheduled tasks and rejects cycles; does not rewrite tasks.
- `src/gantt.cjs`: independent coordinate hit-testing for connecting from a source bar to a scheduled successor bar; excludes self and empty release points.
- `src/GanttView.js`: Gantt right-end connector affordances; drag connector onto another bar, or tap connector then a successor bar; cancel + feedback states. Existing list-based dependency editor retained. Critical-path overlay toggle highlights task outlines/edges and displays assumptions.
- `tests/critical-link.test.cjs`: seven new deterministic tests, including graph edges, milestones, empty and cyclic input, missing dates, gesture target detection, and import invariants.
- `AGENTS.md` and `.opencode/skills/unslop/`: repo-wide OpenCode-style rules and full original user-supplied Unslop skill, preserving CC-BY-4.0 attribution. Skill intended to be read on each future build.
- `docs/UNSLOP-NP-0.2.3.md`: before-audit, direction and scoped changes.
- `package.json`: version 0.2.3.

## Constraints / known limits

- Critical path uses nominal task duration in **calendar days** and finish-to-start predecessors; it does NOT apply working calendars, resource leveling, constraints, calendar dates, or actual progress. Its duration estimate is not the committed delivery date.
- Touch-release linking relies on React Native's layout measurement; Web and Expo Go still require QA. Tap-to-link and previous predecessor-selector are fallbacks.
- Native cross-platform gesture behavior and visual accessibility are not device-verified.
- There is no new database schema, dependency type or automatic schedule propagation.

## Test evidence

See `NP-v0.2.3-test-results.txt` and `docs/NP-QA-0.2.3.md`. Regression suite and syntax checks performed in the patch assembly environment; platform runtime checks remain Not run.

## Acceptance gates before merge

1. Back up the local workspace JSON; confirm `work` branch and clean/checkpointed tree.
2. Import v0.2.3. Run `npm test` and `npx expo install --check` in Termux.
3. Test Web and Expo Go Gantt: connector tap-link, drag-link, cancel, duplicate, cycle rejection, unscheduled fallback, zoom, moving/resizing existing bars.
4. Verify critical overlay highlights expected longest chain; task persistence after relaunch; verify Kanban drag unaffected.
5. Save logs/screenshots; fix any runtime issues; commit on `work`, merge into `main` only upon acceptance.

## Next backlog (not implemented)

Working calendars and dependency types (FS/SS/FF/SF + lag), explicit milestone constraints, auto-shift of descendants, scale/performance, Firebase only after local QA milestone.

---

## v0.2.4



# CHG-NP-0.2.4 — Gantt routing, dependency management and Unslop UI

## 0. READ FIRST — handoff

| Field | Observed / planned value |
|---|---|
| Project | Milvayo (independent from RIVNA / Niyarvo Control Center) |
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
2. `git switch work` from `~/Milvayo`, then unzip the v0.2.4 project-root ZIP over the repo (`unzip -o ... -d .`). Do not overwrite `.git` (ZIP contains none).
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

---

## v0.2.5



# CHG-NP-0.2.5 — Controlled QA handoff

## 0. READ FIRST — 60-second handoff

| Field | Value |
|---|---|
| Project | Milvayo (independent from RIVNA and Niyarvo Control Center) |
| Batch | NP v0.2.5 — Gantt viewport and shared Unslop UI |
| Baseline | v0.2.4-LOCAL-QA.zip |
| Delivery | Complete project-root ZIP, standalone changelog, standalone results |
| Status | **QA candidate — runtime unverified** |
| Work branch | `work`, to be used by user; no Git action executed here |
| Storage | AsyncStorage key `milvayo-v1` unchanged; no migration |
| Firebase | Not connected or deployed |
| Git main | Unmodified |

## 1. Changes made (observed source changes)

- **Zoom**: `GanttView.js` accepts two-point pinch distance from chart touches, uses a bounded day scale 6–96 px/day, recalculates horizontal scrolling to preserve the midpoint's date. Presets Days/Weeks/Months and accessible `+`, `−`, `Fit` controls; compact bar indicators at high-level overview zoom.
- **Two-axis auto-pan while linking**: introduced independent vertical chart ScrollView, horizontal date ScrollView, a viewport geometry reference, scroll offsets, 40ms edge-pan loop, and offset-corrected dependency hit testing. The finger contact offset is calibrated within the port hitbox and remeasured asynchronously if available. Cancel/two-touch interruption stops the loop; on unmount the timer is cleared.
- **Touch state**: pinchActive and isLinkDragging states prevent scroll from remaining disabled after gesture release. Tap-to-link remains available and can scroll to distant destinations.
- **Shared mobile design**: `src/design.cjs` graphite and Niyarvo violet tokens used by both App and Gantt; shared Button/Chip/IconButton/Input refinements and consistent touch heights; compact mobile header and bottom navigation; secondary section copy hidden on narrow layouts; Gantt toolbar progressive disclosure.
- **Preserved behavior**: Kanban card gesture code unchanged. Gantt task shift/resize and dependency model functions unchanged. Project import/export and backup logic unchanged. No roadmap import and no new package dependencies.

## 2. Files

- Modified: `App.js`, `src/GanttView.js`, `package.json`, `app.json`, `README.md`, `tests/gantt-ui-contract.test.cjs`.
- Added: `src/design.cjs`, `src/viewport.cjs`, `tests/viewport.test.cjs`, `docs/NP-QA-0.2.5.md`, `docs/UNSLOP-NP-0.2.5.md`, this changelog.

## 3. Executed evidence

| Check | Result |
|---|---|
| Node `npm test` (model/contract/viewport) | **Pass — 67/67** |
| JSX parse with TypeScript 5 parser | **Pass — 0 syntax errors** in App.js/GanttView.js |
| ZIP structural integrity | Verified during packaging |
| `npx expo install --check` in this environment | **Not run** (Expo packages/node_modules unavailable) |
| Metro Web bundle in this environment | **Not run** |
| Android Expo Go real pinch/pan | **Not run** |
| iOS runtime | **Not run** |
| Firebase Hosting deploy | **Not performed** |
| Git work commit, main merge | **Not performed** |

## 4. Known risks / unresolved

1. Native responder capture and nested ScrollView touch propagation require actual device testing; pinch may conflict with bar handlers on some devices. Accessible zoom controls are fallback.
2. Connector offset was reported intermittently on first touch. The new offset calibration is a proposed correction; not verified on user phone.
3. Edge pan is bounded by the 90–540 day calendar window. Use Earlier/Later for dates outside the currently generated window.
4. UI design pass touches shared components and Gantt but is **not a pixel-perfect full application redesign**. Audit every main screen on real Android before acceptance.
5. Critical path remains calendar-day/finish-to-start only. Complex link crossings are not guaranteed to be eliminated.

## 5. User Termux QA commands

```sh
cd ~/Milvayo
git switch work
git status --short
# Export workspace JSON backup first; preserve existing uncommitted work.
unzip -o ~/storage/downloads/Milvayo-v0.2.5-LOCAL-QA.zip -d .
npm test
npx expo install --check
npx expo start
```

**QA order:** pinch zoom; zoom controls/Fit; independent horizontal and vertical chart scroll; connector auto-pan in all directions and correct target on first attempt; link deletion; move/resize; Kanban regression; app-wide mobile visual check; persistence after restart. See `docs/NP-QA-0.2.5.md`.

## 6. Merge gate

Only after Android and Web interaction QA passes: checkpoint on `work`, review diff and data export, then merge to `main`, tag version, and eventually deploy to **a new, independent** Firebase project. No force-push.

---

## v0.2.6



# CHG-NP-0.2.6 — NP-SCHED1 engine-only checkpoint

**Version designation supplied by the project owner:** v0.2.6. This maps to the previously delivered `NP-SCHED1` independent scheduling engine patch.

- `src/scheduling.cjs` supports four dependency types, signed lag, workday calendars, exception dates, pure audit, preview and stale-safe apply.
- Tests and smoke scenario were delivered in the earlier NP-SCHED1 patch.
- No v0.2.6 UI controls or persistent metadata were implemented in that checkpoint. Those are first integrated in v0.2.7.
- v0.2.7 contains v0.2.6 engine files directly; the older standalone patch does not need to be extracted separately on top of v0.2.7.

---

## v0.2.7



# CHG-NP-0.2.7 — Scheduling integration release candidate

**Project:** Milvayo (independent of RIVNA and Niyarvo Control Center)
**Branch:** `work` (expected on developer's Termux device; not changed here)
**Base:** complete source `v0.2.5` + engine patch `NP-SCHED1` (user designates it `v0.2.6`)
**Delivered:** `v0.2.7` complete source ZIP, not yet accepted
**Date:** 2026-10-31
**Firebase/GitHub:** no deployment, push, commit, merge, or remote operations

## 0. Read first — factual handoff

- The NP-SCHED1 `src/scheduling.cjs` engine supports FS/SS/FF/SF, lag, workday calendars and read-only preview/apply. It was previously engine-only.
- This batch wires the engine into **Timeline → Scheduling** and adds durable per-project calendar + typed link metadata, with JSON import/export and snapshot preservation.
- All changes are local. *User must export a workspace JSON before extraction.*
- **No existing project dates are changed during migration or import.** All old dependencies become FS/0 unless a typed link is stored.
- The project's v1 JSON format remains `niyarvo.project.v1` with an optional `scheduling` extension; backup/storage key remains `milvayo-v1`.
- `App.js` and `src/GanttView.js` changed to integrate the UI. Any downstream UI integrator should diff them instead of blindly replacing their redesign.

## 1. Changes by surface

| Surface | Changes |
|---|---|
| `src/scheduleProject.cjs` (new) | Validated per-project calendar and typed-link normalization, strict import checks, graph reconciliation, read-only audit/preview and safe apply wrapper, downstream verification invalidation |
| `src/model.cjs` | Adds persisted `scheduling` object during normalization, validates and synchronizes metadata, makes task deletion reconcile links and release evidence |
| `src/SchedulingPanel.js` (new) | Mobile-friendly local scheduling modal, workdays and holidays, relation type/lag editors, schedule health, anchor task selector, review/confirm changes |
| `App.js` | Timeline Scheduling action; link from task editor; calendar/link mutations, versioned preview/apply with workspace snapshot, release downgrade after moved tasks |
| `src/gantt.cjs`, `src/GanttView.js` | Draw connectors at anchors matching FS/SS/FF/SF, use typed relationship audit; prevent legacy critical-path / align calculations from being offered on unsupported modes |
| `schemas/niyarvo.project.v1.schema.json` | Optional strict `scheduling.calendar` and `scheduling.links` properties without changing v1 import discriminator |
| `tests/scheduling-integration.test.cjs` | Legacy migration, multi-project isolation, rollback, metadata rejection, edge deletion, evidence invalidation, Gantt anchor geometry |
| `tests/gantt-ui-contract.test.cjs` | Removes outdated v0.2.5-only version assertion |
| `package.json` | Version 0.2.7; no new dependencies |

## 2. Functional rules and limits

1. Calendar is explicit (`calendar` or `workdays`; ISO Mon–Sun weekdays plus `closed`/`opened` exceptions).
2. Task edges remain in `task.dependsOn` and typed metadata lives in `project.scheduling.links`. Every saved relationship is synchronized, with FS/0 default for legacy projects. Orphan/duplicate/malformed typed relationships reject import.
3. Editing a link's type/lag or changing dependencies reopens successor/downstream verification and downgrades affected Released/Ready releases to Testing.
4. Calendar edits do not automatically move dates. Audit flags non-working endpoints and dependency conflicts.
5. Preview never mutates project. Apply requires a current project/revision and a valid preview, creates a local workspace snapshot, moves only successors that need moving, and clears verification on moved tasks.
6. Critical-path estimate remains **calendar-day FS-only**. It is disabled when a project uses working days or any non-FS/0 relationship. Workday resource leveling and a typed-constraint critical path remain out of scope.
7. Project-level schedule controls remain local-first. No Firebase/cloud collaboration, notifications, actual file uploads, or external Git operations are claimed.

## 3. Checks performed

| Check | Result |
|---|---|
| `npm test` (original plus new integration cases) | **PASS — 118/118** |
| Scheduling smoke scenario | **PASS** |
| JSX parse/transpile diagnostics (`App.js`, `GanttView.js`, `SchedulingPanel.js`) | **PASS** |
| Syntax checks for `.cjs` files | **PASS** |
| JSON schema parse and ZIP structure | **PASS** |
| Metro Web bundle in Termux | **Not run** |
| Expo Go Android interaction tests | **Not run** |
| iOS native runtime | **Not run** |
| Git branch checkpoint and merge | **Not run** |
| Firebase deployment | **Not run** |

See `docs/NP-QA-0.2.7.md` and `docs/NP-v0.2.7-test-results.txt`.

## 4. Risks and next actions

- **Device QA required:** Scheduling modal touch targets, nested task picker scrolling, keyboard overlap and Gantt typed-link rendering on small portrait screens.
- **Correctness limitation:** `previewCascade` is push-only. It never pulls a task earlier or overrides explicitly edited anchors; blocked/unscheduled successors require manual correction.
- **Performance:** Current interface is not virtualized for thousands of tasks/links; load-testing large workspaces is still needed.
- **Historical caveat:** The bundled older Gantt critical-path model is not valid for typed non-FS relationships or workdays. The new UI disables that estimate in those modes.
- **Storage:** AsyncStorage snapshots are local device state, not off-device backups. Export project/workspace JSON externally before updating.
- **Next batch:** runtime QA findings; larger workspace performance; advanced task templates, comments and genuine file uploads only when the independent Firebase backend is deliberately configured.

## 5. Verification checkpoint procedure

On Termux, ensure a safe checkpoint of v0.2.6, then extract this complete archive only on `work`. Run `npm test`, `node scripts/schedule-smoke.cjs`, `npx expo install --check`, `npx expo start`. Verify feature acceptance before committing/tagging or merging. Never force-push. This ZIP has its contents at the project root, not under a nested directory.

---

## v0.2.8



# CHG-NP-0.2.8 — Task hierarchy, bulk workflows, bounded list rendering

## 0. READ FIRST — handoff

| Field | Observed fact |
|---|---|
| Product | Milvayo — **independent** Expo SDK 58 project management app |
| Baseline | Complete v0.2.7 source (with v0.2.6 scheduling engine) |
| Release | v0.2.8 **local-QA candidate**, not production-accepted |
| Git | No branch creation, commit, push or merge performed |
| Firebase | User reports creating Firebase project `milvayo`; Android ID is `com.milvayo.projects`. No connection/deploy/config credentials added. Confirm actual project ID in Firebase Console before backend setup. |
| Existing app storage | `milvayo-v1` in AsyncStorage; unchanged |
| Existing import format | `niyarvo.project.v1`; **unchanged**; optional task `parentId` added |
| Runtime QA | **Not run** on Web, Expo Go or iOS |

## 1. What changed

1. `src/taskWorkflows.cjs`: original independent model for task hierarchy, descendants, view queries, 40-row incremental pages, and all-or-nothing bulk status/priority/stage/owner operations. No OpenProject code was copied.
2. `src/model.cjs`: optional `parentId` persists on tasks; validates hierarchy on import and workspace normalization (missing parents, self-parent, cycles, depth >40); deleting a parent detaches immediate children while preserving them; downstream verification and release consistency reconciled.
3. `App.js` Tasks screen: status/priority filters, search, select-visible/clear, multi-task status and priority changes, 40-row progressive loading. Only rendered rows are initially mounted; **this is bounded rendering, not full FlatList virtualization**.
4. `App.js` Task editor: change/remove parent, find parent, inspect children, create subtask. Supports multiple nesting levels; candidate list is capped to 30 matches.
5. `App.js` Board: initially renders a maximum of 60 cards per lane. **Show more** loads another 60 without modifying saved tasks or the existing drag mechanics.
6. `schemas/niyarvo.project.v1.schema.json`: documents optional `parentId` for portable exports.
7. `package.json` and `app.json`: version 0.2.8; Android package stays `com.milvayo.projects`; no dependency changes.

## 2. Design and architecture basis

- Studied **concepts** in the supplied OpenProject 17.9.6 archive: hierarchical work packages, work-package relationship separation, and query filters. Independently designed and wrote all implementation code. No source files, fragments or UI assets transplanted.
- Reviewed original Unslop guidance (`.opencode/skills/unslop/SKILL.md`); applied a focused Tasks-screen treatment: 44px touch-sized selection, consistent neutral panels, horizontal filter rails, short labels, progressive lists instead of massive rows, and no new decorative effects. See `docs/UNSLOP-NP-0.2.8.md`. **Not a full-screen redesign.**

## 3. Validation run in delivery environment

| Check | Result |
|---|---|
| Existing regression tests | 118/118 Passed |
| New task-workflow tests | 15/15 Passed |
| **Total** `npm test` | **133/133 Passed** |
| App/Gantt/Scheduling JSX syntax parse | Passed (TypeScript parser, JSX mode) |
| JSON validation of app/package/schema | Passed |
| `npx expo install --check` | Not run (node_modules unavailable in delivery workspace) |
| `npx expo start` and real Web/Android runtime | Not run |
| iOS device | Not run |
| Actual 10,000-task visual UI performance | Not measured on a device; 10,000-record query/page model test passed |
| Firebase/GitHub sync or deployment | Not run / not implemented |

## 4. Known limits and deferred work

- Parent/child hierarchy is project-local; it does not automatically infer dependency links or roll up schedule durations, progress, completion, or ownership. Gantt hierarchy folding is not implemented yet.
- Tasks page renders a finite 40-row page; Board finite 60 per lane. Gantt still renders its own chart rows; no Gantt virtualization in this batch.
- Bulk changes intentionally invalidate verification and merge records of changed tasks and affected successors. They may demote Ready/Released local checkpoints to Testing; **they do not perform Git operations**.
- Bulk selections and filters are ephemeral app UI state, not stored saved queries.
- Firebase auth, secure Firestore sync, user permissions, uploaded binary attachments and conflict resolution remain future separate stages.

## 5. Local installation + QA gate

On Android/Termux: export workspace JSON, preserve uncommitted work on `work`, then unzip the **full source ZIP** at the project root. Run `npm test`, `npx expo install --check`, `npx expo start`. Perform `docs/NP-QA-0.2.8.md`. Do **not** merge into `main` or deploy until user accepts runtime behavior. No full build or Firebase deployment is required just to test the model.

## 6. Merge notes for another implementation/design branch

Primary files changed: `App.js`, `src/model.cjs`, `src/taskWorkflows.cjs`, JSON schema and versions. When merging redesigned `App.js`, preserve the task selection handlers and `taskWorkflows` calls, and reconcile rather than overwriting accepted Gantt/Kanban gesture behavior. Keep all backup/import/typed-dependency model behavior from v0.2.7 intact.

---

## v0.2.9



# Milvayo — CHG-NP-0.2.9

## 0. READ FIRST — technical handoff

| Field | Observed status |
|---|---|
| Project | Milvayo (independent application) |
| Version | v0.2.9 — OpenProject architecture survey + planning foundation |
| Previous baseline | v0.2.8 source archive provided in project |
| Git branch | User's `work` branch recommended; no Git operations performed here |
| Target framework | React Native + Expo SDK 58, Metro via `npx expo start` |
| Auth/cloud | Local only. Firebase `milvayo`, Android `com.milvayo.projects` not connected/deployed |
| Automated tests | 163/163 passing (133 existing, 30 new) |
| JSX parse | `App.js`, `GanttView.js`, `SchedulingPanel.js`: clean using TypeScript JSX parser |
| Actual Android/Web runtime | Not run in this environment; must verify via Metro and Expo Go |
| Source of external concepts | OpenProject 17.9.6 archived source; **no code copied** |
| UI design discipline | User-provided Unslop guidelines applied to modified Tasks controls, separate audit below |

## 1. What was implemented

- Added `src/planning.cjs`, a standalone side-effect-free planning/query engine.
- Per-task `progress` (integer 0–100) and `estimateHours` (numeric 0–100000) persisted in existing `niyarvo.project.v1` format, no format-version bump.
- Calculated parent and project progress from *leaf tasks* only. Weight = leaf estimated hours if positive, otherwise one unit. Completed (`Done`) leaf tasks contribute 100%; uncompleted leaves use manual percentage. Intermediate nodes do not contribute additional weight.
- `updateTaskPlanning` command validates input, makes no changes on no-op/invalid commands, invalidates verification/merged evidence of affected ancestors and scheduling-dependent tasks, and reopens affected Ready/Released records to Testing.
- Per-project saved task views with name, status/priority/owner/text filters and sort key. Sorted query results do not mutate the stored task order. Maximum 50 saved views.
- Tasks UI: saved view picker, save/update/delete named view, collapsible filter/sort controls, read-only rollup percentage on parents and editable leaf progress & estimated hours. Existing Kanban and Gantt components are untouched.
- Dashboard: additional Work progress tile.
- Project JSON schema extended with optional progress, effort and saved view properties. Legacy files with none of these still normalize safely.
- Source-based 63-capability inventory covering all 30 OpenProject top-level modules and core services in `docs/NP-OPENPROJECT-CAPABILITY-MAP-v1.md`.

## 2. Files changed/added

| Path | Change |
|---|---|
| `src/planning.cjs` | New rollup/query/mutation engine |
| `src/model.cjs` | Backward-compatible fields, saved view normalization, export |
| `App.js` | Tasks views, progress editing, project progress UI |
| `schemas/niyarvo.project.v1.schema.json` | Optional persisted fields and saved views |
| `tests/planning.test.cjs` | 30 additional tests |
| `package.json` | Version 0.2.9 |
| `docs/NP-OPENPROJECT-CAPABILITY-MAP-v1.md` | 63-domain-entity/capability audit with paths |
| `scripts/build-openproject-inventory.py` | Reproducible source path index from user-supplied ZIP (not runtime-dependent) |
| `docs/NP-QA-0.2.9.md` | Runtime acceptance plan |
| `docs/UNSLOP-NP-0.2.9.md` | UI design redline record |
| `docs/CHG-NP-0.2.9.md` | This handoff |

## 3. Business rules and limits

- No implicit task status transition when progress is set to 100%. Setting Done marks its **effective** progress as 100% but does not verify or merge it.
- Parent progress is derived, not stored; users edit leaf tasks. Parent percentages are not reified into child status.
- A leaf with zero/unspecified estimated effort has weight 1; otherwise its numeric estimated hours are used as weight. This is a **Niyarvo convention**, not a claim about OpenProject's exact aggregation algorithm.
- Saved queries are project-scoped and local, with up to 50 per project. Saved views do not change task IDs, positions or statuses. UI saves the current filter and sort; descending sort is supported by engine/storage but not exposed in UI in this batch.
- This version does not implement timesheets, actual worked hours, custom fields, roles, external storage or server synchronization. Those are independently mapped for future work.
- The source ZIP is a **local QA candidate**. Do not call it device-accepted or production ready based only on model tests.

## 4. Verification evidence

- `node --test tests/*.test.cjs`: 163 passing, 0 failed.
- `node scripts/schedule-smoke.cjs`: **passed** in the authoring environment, 2 planned successor movements, zero conflicts, source project unchanged.
- JSX parser: no diagnostics for the three JavaScript/JSX entry components.
- App bundling, actual drag gestures, form interactions, Android and iOS runtime: Not run / not verified here.
- Firebase: not configured, not deployed, rules not deployed. No connections to RIVNA or Niyarvo Control Center.
- OpenProject source inventory scanned locally from supplied ZIP. Paths verified as existing in the archived tree, but not every upstream feature's runtime logic was executed.

## 5. Known limitations / next batch

- Saved views and progress controls require Android/Web runtime QA. Top-level task query is progressively loaded but not virtualized.
- Rich OpenProject-style task types, custom fields and allowed workflow transitions are not yet implemented; these are a recommended v0.3.0 domain layer.
- Progress per project assumes additive, non-overlapping leaf task work; historical time logs, currency and resource utilization are not yet modeled.
- Future Firebase permissions must be server-authoritative. No client-only role restriction should be misrepresented as security.
- If another model has redesigned `App.js`, merge our new hooks and Tasks UI deliberately, rather than overwriting the redesigned file; `src/planning.cjs` and `src/model.cjs` are the canonical business changes.

## 6. Safe Termux release workflow

1. Export your current workspace JSON, then check `git switch work` and `git status --short`. Do not overwrite uncommitted changes.
2. Extract the full ZIP at the project root. It contains no enclosing project folder or `.git` directory.
3. Run `npm test`, `npx expo install --check`, `npx expo start`.
4. In Expo Go and web, verify creating/editing/saving task views, progress rollups, source changes, project switching, import/export and restore.
5. Verify Gantt move/resize/connectors and Kanban drag still work. Create a stable checkpoint only after tests pass.
6. No GitHub merge or Firebase deployment until runtime acceptance.

---

## v0.3.0



# CHG-NP-0.3.0 — Task configuration + safe-area correction

## 0. READ FIRST — release handoff

| Field | Value |
|---|---|
| Application | Milvayo (independent of RIVNA / Niyarvo Control Center) |
| Base | `Milvayo-v0.2.9-LOCAL-QA.zip` |
| Candidate | `0.3.0` — **LOCAL QA, NOT ACCEPTED** |
| Git branch | User's `work` branch — no remote changes made |
| Firebase | No connection or deployment; dedicated project `milvayo` reserved for future work |
| React Native | Existing Expo SDK 58 / Metro retained |
| Native package ID | `com.milvayo.projects` |
| Source tests | 175/175 passing (163 baseline + 12 new) |
| UI syntax | `App.js`, `GanttView.js`, `SchedulingPanel.js`, `TaskConfigurationPanel.js` parse correctly |
| Web/Android/iOS interactions | **Not run / not verified** |
| Source baseline integrity | Complete archive with project-root contents, no enclosing folder or Git metadata |

## 1. Changes

- Added `src/taskSchema.cjs` with per-project custom task types, five typed custom-field formats, strict schema validation, and explicit allowed status transitions. Defaults keep imported v0.2.x projects backward compatible; workflows are OFF unless explicitly enabled.
- Added `src/TaskConfigurationPanel.js` to manage types, fields and workflow paths. Available from Tasks and Settings. In-use types cannot be removed; removing a field deletes associated values after a recovery snapshot.
- Updated `src/model.cjs` for schema persistence and transition enforcement when moving Kanban tasks; updated `src/taskWorkflows.cjs` so atomic bulk status edits respect the same rules.
- Updated `App.js` with task-type creation and editing, custom-value editing (explicit save for text/numeric/date to support mobile typing), task configuration entry points and verification checks. No task field data is sent to external services.
- Wrapped application shell and modal presentation with `SafeAreaProvider`/`SafeAreaView`, so Android status-bar and gesture-navigation insets are respected. Updated `src/SchedulingPanel.js` modal accordingly.
- Updated package/application version `0.3.0`. Added dependency `react-native-safe-area-context: ~5.10.1` (Expo-recommended version; run `npx expo install --check` in Termux).
- Added 12 regression tests and updated a previously hard-coded version assertion in `tests/gantt-ui-contract.test.cjs`.

## 2. Business rules and safety

- Each project carries its own `taskTypes`, `customFields`, `workflow`; tasks carry `taskTypeId` and `customValues`.
- Legacy JSON without these keys is normalized to `Task`, no fields, and non-enforced workflow.
- Duplicate IDs, unsupported types, invalid dates and numbers, unknown task types, unknown field keys, duplicate workflow paths, and missing required values are rejected rather than silently discarded.
- When enforcement is enabled, disallowed status changes are blocked in both Kanban and bulk updates. Existing dependency blocking remains.
- Changes to populated custom values or task types invalidate affected verification and dependent release readiness. Field deletion creates a workspace recovery snapshot first.
- No access control, multi-user role engine or Firebase backend is claimed. Workflow rules are local process rules, **not security authorization**.

## 3. Test evidence

Run: `npm test`. All 175 tests passed.

JSX parse: TypeScript compiler parser (`ScriptKind.JSX`) reported zero syntax diagnostics across the changed UI and Gantt components. `package.json` and `app.json` parse as JSON. These checks do not replace an Expo Metro bundle.

## 4. Not verified / known limitations

- **Android and iOS safe-area inset measurements are not runtime tested**; inspect on devices with gesture navigation and rotated displays.
- Web and Android presentation of the configuration editor is not device verified.
- Custom fields currently support simple scalar values and a per-project definition. Field-level permissions, formulas, custom statuses, conditional validations and workflow role permissions are outside this batch.
- Required custom fields are rejected if existing tasks lack values; create fields optional first and populate them before future required-field UI support.
- Manual field editing currently persists each accepted value as a local workspace update, matching the previous task-editor persistence behavior.

## 5. Installation / QA

1. Export a JSON workspace backup before changing versions.
2. Confirm `work` branch and preserve any uncommitted files. Extract the full ZIP at `~/Milvayo` root, not inside a nested folder.
3. Run `npm install`, `npm test`, `npx expo install --check`, then `npx expo start`.
4. Test margins on Android portrait/landscape, dropdowns and every modal above the status/gesture bar. Test keyboard-open forms.
5. Create a project-specific type, add a numeric and select field, edit task metadata, export/reimport JSON, archive/restore, verify release invalidation.
6. Enable a workflow with permitted `Backlog → In progress`; confirm forbidden moves fail in Board and Tasks bulk actions. Disable workflow and verify previously accepted dragging.
7. Re-test Gantt drag, resize, dependency selection/creation/removal; Kanban hold-to-drag; releases; backups.

No Git commit, merge, push, Firebase deploy, or app-store package was created.

---

## v0.3.1



# CHG-NP-0.3.1 — Accent preferences, monochrome branding, hierarchical Gantt

## 0. READ FIRST — technical handoff

| Field | Observed result |
|---|---|
| Project | Milvayo; independent of RIVNA / Niyarvo Control Center |
| Source baseline | `Milvayo-v0.3.0-LOCAL-QA.zip` |
| Candidate | `v0.3.1` — LOCAL QA; NOT ACCEPTED |
| Branch | User-managed `work`; no Git operations performed |
| Firebase | `milvayo` left unconnected, no deploy |
| Android ID | `com.milvayo.projects` unchanged |
| Platform | Expo SDK 58, React Native, Metro; no dependency additions |
| Tests | 184/184 Node tests passed (175 previous + 9 added) |
| UI parse | `App.js`, `GanttView.js`, `BrandMark.js`, `SchedulingPanel.js`, `TaskConfigurationPanel.js` passed TypeScript JSX parsing |
| Web / Android / iOS interaction QA | **Not run / not verified** |

## 1. Changes to the product

- Added `src/theme.cjs` with 10 named accent choices, the same names as RIVNA: Aqua, Mint, Lime, Amber, Orange, Coral, Pink, Fuchsia, Violet, Indigo. The **default is orange `#D97757`** (Claude/Anthropic clay). The names align; other color values were chosen for Niyarvo rather than claiming exact Rivna palette equivalence without its source.
- Added `src/design.cjs` theme update function. Existing `purple` and `purpleDim` tokens remain backward-compatible aliases for the **selected accent**; their current values are not permanently violet. Existing semantic warning/success colors are unchanged.
- Added a complete **Settings → Accent color** swatch selector with selection state, a tintable Niyarvo mark preview and accessible color labels. Selection is stored under `milvayo-accent-v1` in AsyncStorage, separately from user project JSON. Invalid saved values fall back to orange without changing workspace contents.
- Added `src/BrandMark.js`, faithfully using the original monochrome Niyarvo symbol paths supplied by the user; the mark changes color at runtime across platforms. The desktop sidebar now uses this component. Web browser favicon updates to the accent color.
- Regenerated `assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash-icon.png`, `assets/brand-symbol.png`, and `public/icons/*` from the user's centered monochrome symbol with a dark background and **orange default**. These **static installed launcher/PWA icons do not change** when preferences change; native alternate icon capabilities are not implemented.
- Added independent hierarchical Gantt logic in `src/gantt.cjs` with stable ordering, nested rows, collapse/expand and calculated parent schedule range/progress. UI has **Tree** mode with expandable rows and parent summary bars, retaining existing Status/Stage modes.
- Summary bars are read-only navigation/overview elements, not draggable child-reschedulers. Existing leaf task move, resize, dependency creation and Kanban dragging are not rewritten.
- Updated `AGENTS.md`, `README.md` and version in `package.json` / `app.json`.

## 2. Behavioral safeguards

- Preference changes do not mutate, re-import, or migrate projects and do not affect Firebase.
- Derived rollups use `planning.progressRollups` and existing weight rules; nested leaf tasks are not double-counted.
- Collapsing parent rows only hides descendants from display. All tasks remain intact in the project, dependency graph and exports.
- Cyclic/missing parent references in hierarchy rendering are bounded with a visited set; validation rules for imported projects remain unchanged.
- Only project-scheduled tasks are shown as Gantt bars; parent summaries derive from child dates and do not create new task dates.
- Semantic colors for errors, validation, Done and other workflow states remain independent of the personal accent.

## 3. Testing evidence

- `node --test tests/*.test.cjs` — 184 pass, 0 fail.
- `typescript.transpileModule` with JSX parsing (five UI files) — 0 syntax errors.
- `JSON.parse` of `app.json`, `package.json`, and `public/manifest.json` — pass.
- ZIP entries integrity — verified.
- Metro, device layout, Web interaction and iOS runtime — **Not run**. No user acceptance implied.

## 4. QA instructions

1. Export a workspace JSON backup on v0.3.0; ensure the `work` branch and working files are safely checkpointed before extracting.
2. Extract the full ZIP at project root; use `npm test`, `npx expo install --check`, and `npx expo start`.
3. In Settings choose Orange, Aqua, Mint, Violet and back to Orange; verify primary buttons, sidebar/bottom navigation, Gantt controls and monochrome symbol recolor immediately. Close and reopen; preference should persist.
4. Check all ten swatch names and accessible tap targets; on Web check the tab favicon. Do not expect the installed home screen icon to change after picking an accent.
5. Timeline → Tree: expand/collapse multiple nesting levels; check parent summary dates and weighted progress against child tasks. Confirm collapsing never deletes tasks or links.
6. Retest Kanban press/hold drag, Gantt move/resize, dependency creation/removal, schedules, workspace export/import, restore and release verification.
7. Android portrait/landscape: check selected accent color, safe-area spacing and Gantt view controls for clipping.

No commits, pushes, merges, Firebase operations or deployment were performed.

---

## v0.3.2


### CHG-NP-0.3.2-HOTFIX1.md

# CHG-NP-0.3.2-HOTFIX1 — Android JSON import permission recovery

## 0. Read first

| Field | Value |
|---|---|
| Application | Milvayo (independent Expo/React Native app) |
| Base source | `Milvayo-v0.3.2-LOCAL-QA.zip` |
| Patch ID | `NP-0.3.2-HOTFIX1` (app package remains 0.3.2) |
| Git branch intended | `work` (not committed or pushed) |
| Status | Source/test validated; Android Expo Go runtime **Not run** |
| Firebase | **Not connected**; none of RIVNA/Control Center data touched |

## 1. Observed failure

User-selected JSON import on Android displayed:
`Call to function 'FileSystemFile.text' has been rejected. Caused by: Missing 'READ' permission for accessing the file.`

The v0.3.2 `App.js` native importer requested `copyToCacheDirectory:true`, then called `new File(asset.uri).text()` directly without a fallback. The exception occurs **before JSON parsing or preview**, so it does not prove the uploaded JSON is invalid.

## 2. Implemented changes

- `App.js`: native import uses `importFiles.readPickedJsonAsset` with Expo `expo-file-system/legacy` instead of depending solely on `File.text()`.
- `src/importFiles.cjs`: defensive file-reading path:
  - Validates `file://` or `content://` picker URI and 5 MB limit.
  - Reads a local `file://` using legacy UTF-8 reader; if that fails, tries `File.text()` on a local file only.
  - For Android `content://` URIs, uses documented legacy `copyAsync` support to copy into private app cache before reading; always attempts to delete **only that temporary copy**.
  - Metadata access is best-effort; enforces size from known picker information and the returned text.
  - Converts permission errors into actionable guidance to retry from Android Downloads; does not expose raw local file URI.
- `tests/native-import.test.cjs`: 11 unit tests including picker cache, SAF URI copy, cleanup, size limits, fallback, error mapping, and metadata failures.
- No app data model, storage, Kanban, Gantt, sprint, CSS, logo, or workflow changes.
- No manifest-wide storage permission added. File access remains tied to Android's user-driven document picker.

## 3. Test evidence

| Check | Result |
|---|---|
| `npm test` | **207/207 PASS** (196 original + 11 new) |
| TypeScript parser JSX syntax `App.js`, `GanttView.js`, `SprintPanel.js` | **PASS** |
| Atlas mock file imported with `model.importProject` | **PASS** (73 tasks, 3 sprints) |
| Python ZIP integrity / source package verification | **PASS** |
| `npx expo install --check` | **Not run** in this isolated container |
| Metro Web bundle | **Not run** |
| Expo Go Android file-picker import | **Not run** — acceptance required |
| iOS file-picker import | **Not run** |

## 4. QA acceptance in Termux

1. Export workspace backup first; verify clean/committed checkpoint on `work`.
2. Extract full ZIP over the project root or extract the changes-only ZIP.
3. Run `npm test`, `npx expo install --check`, `npx expo start`.
4. Android: Backups → Import JSON → choose Atlas mock project from Downloads. Confirm preview displays `Atlas Operations — Product Launch`, 73 tasks. Confirm import, then select the project and open Sprints.
5. Confirm Sprint 02 history/burndown and task status. Restart the app to verify persistence.
6. Try canceling the picker; import nothing. Try invalid JSON; verify it reports an error without changing workspace. Reimport to test the recovery snapshot path.
7. Repeat importing from another provider (e.g. Drive) to exercise content URI behavior if possible.
8. Confirm existing Kanban drag and Gantt functions remain intact.

## 5. Limitations and follow-up

- This patch implements documented fallback routes; it cannot guarantee third-party Android providers will grant usable file access. In that situation a friendly Downloads retry message is shown instead of a native exception.
- Real Android verification is necessary before claiming the specific device/provider permission error is fixed.
- The project format remains `niyarvo.project.v1` and the app version remains `0.3.2` to keep the hotfix isolated.

### CHG-NP-0.3.2-HOTFIX2.md

# CHG-NP-0.3.2-HOTFIX2 — Android project JSON import

## READ FIRST

| Field | Evidence |
|---|---|
| Project | Milvayo (independent of RIVNA / Niyarvo Control Center) |
| Release | 0.3.2-HOTFIX2, built on 0.3.2-HOTFIX1 |
| Git branch | `work` is intended; no Git operations performed here |
| Firebase | Not connected/deployed |
| Root cause | On Android Expo Go the `expo-document-picker` cache URI `file:///data/user/0/host.exp.exponent/cache/DocumentPicker/...json` was reported unreadable by both `File.text()` and legacy `readAsStringAsync()`. The cached-file fallback did not resolve this provider/Expo Go behavior. |
| Fix | Android **now uses `File.pickFileAsync` from Expo SDK 58** and reads the picker-granted native `File` directly, bypassing the DocumentPicker cache. iOS retains the previous `expo-document-picker` path, and Web retains HTML file input. |
| Compatibility | Existing model/schema and `milvayo-v1` AsyncStorage key unchanged. No new packages, broad storage permissions, or user-data migrations. |
| Automated validation | 216/216 Node tests passed, including 9 new tests for the SDK58 picker; JSX parse of App, Gantt, Sprint passed. Mock Atlas JSON imported through model: 73 tasks, 3 sprints. |
| Not verified | Android Expo Go system picker on user's device; iOS/Web runtime; Android APK build; Firebase deployment |

## Changed files

- `App.js`: Android-specific native importer now calls `importFiles.pickAndroidJsonText(File)`; Web/iOS behavior unchanged.
- `src/importFiles.cjs`: `pickAndroidJsonText()` handles SDK 58 `{canceled,result}` and older direct File shape, checks size before and after read, preserves cancel/no-op semantics, handles a UTF-8 BOM, and normalizes permission errors without exposing private paths. Existing legacy helper remains for iOS.
- `tests/native-import.test.cjs`: tests picker shape, cancellation, size checks, unreadable files, malformed results, and denied file metadata.
- `README.md`: hotfix summary.
- `docs/NP-0.3.2-HOTFIX2-QA.md`: instructions/acceptance.

## Assumptions and remaining risks

- `File.pickFileAsync` is present in Expo SDK 58's `expo-file-system` API and opens a system picker. This route is the documented native alternative for Android. Device-specific provider behavior still requires testing; source tests do not prove it will work in Expo Go.
- Import is transactional at the app level: the chosen JSON is parsed and previewed before any workspace mutation; confirmation first records a snapshot. Never bypass this preview.
- The Android system picker intentionally offers all MIME types because JSON files may be labeled `text/plain` or `application/octet-stream`. The app still requires supported JSON schema and limits document text to 5 MB.
- If Expo Go does not support the new picker in the installed binary, use Expo Web import as a temporary workaround and report exact error text. Do not request broad storage access.
- No unrelated feature, UI, Gantt, Kanban, scheduling, sprint logic, accent, or user data was modified.

## Test / merge policy

1. On `work` export a workspace JSON backup, ensure a safe checkpoint, then extract the changes-only patch.
2. Run `npm test` and `npx expo start` (Metro). Re-import `Milvayo-Atlas-Mock-v0.3.2.project.json` from Downloads using **Backups → Import JSON**.
3. Check preview says 73 tasks and that 3 sprints are present, including burndown. Test cancel (no mutation) and a non-JSON text file (error without mutation).
4. Record Android result. Do not merge into `main` until runtime QA passes.

### CHG-NP-0.3.2-HOTFIX3.md

# CHG-NP-0.3.2-HOTFIX3 — Android rendering / large-workspace QA

## 0. READ FIRST — handoff

| Field | Value |
|---|---|
| Project | Milvayo (independent of RIVNA and Niyarvo Control Center) |
| Baseline | `Milvayo-v0.3.2-HOTFIX2-LOCAL-QA.zip` |
| Patch | `v0.3.2-HOTFIX3` — **local-QA candidate only** |
| Git branch | `work` (no commit, push or merge performed) |
| Firebase | Not connected; project remains `milvayo` and Android app ID `com.milvayo.projects` |
| User observation | Atlas mock import now succeeds. Android is slow and Timeline can terminate Expo Go; Web works. No Metro error. |
| Hypothesis | Gantt mounts a full-width/full-height SVG plus every task row and day column. Native drawing/memory pressure is a plausible cause, **not yet confirmed from Android crash logs**. |
| Data migration | None; project and workspace formats unchanged |

## 1. Actual changes

1. `App.js`: removed the duplicate interactive Kanban board, caption, and CTA from Overview. The dedicated Board tab remains unchanged in functionality.
2. `App.js`: mobile Kanban lanes now initially mount 12 cards per lane; desktop mounts 36. “Show more” increments by the same batch size. Existing task order and drag/drop callbacks are preserved.
3. `src/GanttView.js`: replaced full-canvas SVG dependency layers with **one viewport-sized SVG** which translates existing paths by the horizontal/vertical scroll offsets. The overlay uses the same connector, selection, and preview geometry.
4. `src/GanttView.js`: viewport-windowed task labels, Gantt bars, row backgrounds, grid columns, and date labels. Calendar and dependency geometry are still calculated for the entire project; only the visible slice is mounted. Focal pinch zoom, scrolling, task dragging, resizing, and link operations were not intentionally altered.
5. `src/GanttView.js`: resets vertical scroll on project switches and clamps vertical scroll after collapsing to shorter Gantt content, preventing blank viewport states.
6. `src/GanttView.js`: memoized dependency geometry and calendar-day array, preventing repeated full calculations on ordinary scroll redraws.
7. `src/gantt-window.cjs`: new pure helper for row/date/link visibility with bounded overscan.
8. New `tests/gantt-window.test.cjs`, `tests/gantt-render-contract.test.cjs`.

## 2. What was NOT changed

- No Task, Sprint, Release, scheduling, custom-field, workflow, import or backup schema changes.
- No change to HOTFIX2 Android SAF document picker.
- No new packages and no Firebase or Git operations.
- No behavioral change to PanResponder's task movement/resizing logic or dependency link validation.

## 3. Validation

| Check | Observed |
|---|---|
| Previous 216 tests | PASS |
| New helper/contract tests | 12 PASS |
| Total Node tests | **228 / 228 PASS** |
| App.js and GanttView.js JSX syntax (TypeScript parser) | PASS |
| Atlas 73-task Gantt rendering calculation | Original 77 rows / 104 days; initial selection 8 rows / 23 days at simulated 330px height, 260px chart width |
| Native SVG pixel surface calculation | Old 2496 × 4568; new approximately 260 × 330 at simulated dimensions |
| Android Expo Go UI | **NOT RUN — user device acceptance required** |
| Expo Web runtime | **NOT RUN** |
| Metro bundling | **NOT RUN** |
| Physical iOS | **NOT RUN** |

## 4. Required Android QA, in order

1. Before applying: export workspace JSON. Confirm `work` branch and clean or checkpointed changes.
2. Open Atlas Overview and confirm only performance cards/charts remain, with **no embedded Kanban**.
3. Open Board. Initial long backlog should show 12 cards and a **Show more** control. Long-press drag across lanes, including edge auto-scroll, then reload to verify persistence.
4. Open Timeline immediately after a fresh Expo Go start. Observe whether it opens without terminating the app. Repeat after switching project and after opening Board.
5. Pan the Gantt vertically and horizontally; look for blank strips, missing labels, lines moving incorrectly, offscreen hit targets and stale drawing.
6. Pinch-to-zoom, resize/move bars, link tasks and remove a dependency; test status/stage/tree modes and collapsed parent groups.
7. Visit Sprints, confirm burndown data unchanged. Restart Expo Go and verify Atlas project data is still present.
8. If the native app still disappears with no Metro error, capture Android crash logs (`FATAL EXCEPTION`, `OutOfMemoryError`, renderer/OOM messages) when accessible, and report device/Expo Go vs APK platform.

## 5. Risks and rollback

- The new SVG overlay sits above the Gantt scroll surface; Android may route some line or bar touches differently. Validate link selection and bar gestures on device before acceptance.
- Rapid kinetic scrolling can briefly delay drawing a buffer window. Window overscan and quantized offsets are tested, but physical frame pacing is not.
- Pure tests cannot prove the original crash is resolved; this is a **performance hotfix candidate**.
- To roll back, use your pre-patch `work` checkpoint or extract the prior HOTFIX2 source over the working copy. Workspace data format is unchanged.

## 6. Next model guidance

Do not declare Android crash fixed until the user confirms device QA. If it persists, inspect native memory/crash logging and reduce the remaining oversized timeline surfaces, including the horizontal scrolling canvas and `ScrollView` nesting. Keep OpenProject as an architectural reference only; do not copy source. Apply the Unslop checklist for further UI changes.

### CHG-NP-0.3.2.md

# CHG-NP-0.3.2 — Local-first sprint planning and burndown

## 0. READ FIRST — technical handoff

| Field | Observed state |
|---|---|
| Project | Milvayo — independent of RIVNA and Niyarvo Control Center |
| Starting archive | `Milvayo-v0.3.1-LOCAL-QA.zip` |
| Result | `v0.3.2` local QA candidate, **NOT USER ACCEPTED** |
| Git branch | Intended for user-managed `work`; no Git commands performed |
| Platform | Expo SDK 58, React Native 0.88.1, Web/Android/iOS source, Metro |
| App identifiers | `com.milvayo.projects` preserved for Android/iOS |
| Firebase | Dedicated `milvayo` project not connected or deployed |
| Automated checks | **196/196 passed**: 184 pre-existing + 12 added sprint tests |
| Syntax | 6 JSX files parsed successfully by TypeScript; package/app/PWA manifest JSON parsed |
| Web / Android / iOS runtime | **Not run** |
| Installed packages / Expo install check | **Not run** in this environment; no dependencies changed |
| Baseline revision / user Git SHA | Not available; do not invent SHA |

## 1. Features implemented

1. **Sprint lifecycle per project:** create a dated planned sprint with name and goal; one active sprint per project; start/finish transitions are explicit. A sprint spans 1–90 calendar days. Completed sprints preserve scope IDs, final counts and recorded event history.
2. **Task assignment:** optional `sprintId` on tasks, with assignment to planned or active sprints, removal, and prevention of assignment to completed/missing sprints. A task can belong to only one sprint at a time.
3. **Sprints screen:** sidebar and mobile bottom-tab entry, sprint selector, creation form, task assignment and unassignment, task details navigation, bounded/searchable backlog, active sprint progress and explicit completion confirmation.
4. **Recorded burndown:** progress events capture current total and incomplete task counts upon sprint start, assignment changes and subsequent status edits. Plot shows observed remaining-work counts and a separately labeled ideal line; **does not synthesize earlier work history**. Burndown uses calendar days and task counts, not story points or weighted work.
5. **Completing a sprint:** final scope and progress are retained, all task sprint assignments cleared so unfinished work returns to the unassigned backlog. Actual task status, estimate, dates, verification and dependencies are left unchanged. A recovery workspace snapshot is taken before completion and planned-sprint deletion.
6. **Data compatibility:** optional `sprints` array on each project and `sprintId` on each task. Existing `niyarvo.project.v1` format and AsyncStorage key `milvayo-v1` unchanged; projects without these properties load with empty sprint lists. Project/workspace JSON, snapshots and restore include new fields.
7. **Existing functions preserved:** Gantt geometry and gestures, Kanban drag, custom workflow rules, task types, safe area, selected accent, color-tintable Niyarvo mark and local backups are not replaced.

## 2. Architectural derivation (OpenProject as reference, no code copied)

Conceptual areas reviewed from prior source inventory:
- `modules/backlogs`: backlog/iteration concepts and sprint completion;
- `app/models/work_package.rb`: shared task records independently of presentation;
- `app/services/workflows`: lifecycle transitions and validations;
- `modules/backlogs/app/models/burndown.rb`: burndown as separate projection from status/activity events.

Niyarvo independently authors `src/agile.cjs` for the pure domain operations and `src/SprintPanel.js` for the responsive UI. This is **not** a port, transcription, or line-for-line adaptation of third-party source.

## 3. Business invariants and caveats

- Missing sprint IDs, duplicate sprint IDs, multiple simultaneously active sprints, invalid calendar dates and invalid lifecycle transitions are rejected in project validation.
- Active sprint history is append-only through app actions and capped to 500 records per sprint. Historical counts are *not* tamper-proof: local JSON can be edited; server trust/authorization will require independent Firebase backend rules later.
- Completed sprint snapshots may reference task IDs later deleted, intentionally preserving historical scope. The reported final numbers are frozen at completion.
- Status edits and bulk status operations record an event when the active sprint's counts or membership change. Unrelated edits do not generate artificial progress entries.
- No auto-assign on task creation, sprint task estimates, story points, holidays, team capacity, retrospective, points burndown or sprint velocity forecasts yet.
- User's selected accent preferences remain in a separate AsyncStorage preference; they are **not** serialized into project JSON.
- UI validation is pending: no browser or Android interaction screenshots were captured from the new build.

## 4. Files changed

- `App.js`: Sprints navigation, domain callbacks, sprint-history recording on task edits/bulk actions.
- `src/model.cjs`: sprint task field, normalized per-project sprint collection, validation and agile export.
- `src/agile.cjs`: new independent pure sprint lifecycle and burndown module.
- `src/SprintPanel.js`: new React Native sprint/backlog/burndown UI.
- `tests/agile.test.cjs`: 12 new domain tests.
- `package.json`, `app.json`, `README.md`, `AGENTS.md`, `docs/NP-QA-0.3.2.md`, `docs/UNSLOP-NP-0.3.2.md`.

## 5. Verification evidence

**Passed:** `node --test tests/*.test.cjs` -> 196 passed, 0 failed, 0 skipped. Six JSX files parsed using TypeScript `createSourceFile` (no syntax diagnostics). `app.json`, `package.json`, and `public/manifest.json` JSON parse. ZIP CRC check planned on package creation.

**Not run:** Metro compilation on Termux, Android Expo Go touch interaction, browser runtime UI, iOS runtime, `npx expo install --check`, Firebase emulators, remote security/rules tests.

## 6. Runtime QA acceptance checklist

Read `docs/NP-QA-0.3.2.md`. Export workspace JSON first. Install on user `work` branch; don't merge to main until mobile/Web QA and previous Kanban/Gantt regressions pass. Do not force-push existing repo or change Firebase settings.

## 7. Next batch candidates

- Portfolio dashboard and multi-project saved queries.
- Story points/estimates, sprint capacity and sprint retrospective while keeping measurement provenance clear.
- More configurable workflow action definitions and guard rails; only after confirming current sprint UI acceptance.

---

## v0.3.3



# CHG-NP-0.3.3 — Portfolios and project health

## 0. READ FIRST — release handoff

| Field | Value |
|---|---|
| Product | Milvayo (independent of RIVNA / Niyarvo Control Center) |
| Batch | `v0.3.3` |
| Base | `v0.3.2-HOTFIX3` cumulative development line |
| Delivery | Included in final `v0.3.10` full source ZIP |
| Status | **Implemented, source-tested within cumulative release; native/Web runtime QA not verified** |
| Git | Target `work`; no GitHub commit, push, tag, or merge performed here |
| Firebase | Not connected or deployed; project `milvayo`, Android `com.milvayo.projects` |
| Persistence | Same `niyarvo.project.v1` import format and local AsyncStorage workspace; optional backward-compatible fields |

## 1. Implemented scope

Create portfolio groups; assign projects; show per-project completion, overdue and blocked task counts; maintain unique membership and project-status metadata.

**Files / modules:** src/operations.cjs, src/model.cjs, src/WorkspaceExtensions.js, App.js.

The implementation is original JavaScript / React Native. OpenProject was used for domain concepts; Trello's published automation guide informed v0.3.10 workflows. Third-party source code was not copied.

## 2. Validation and evidence

- **Cumulative v0.3.10 suite:** see `docs/NP-v0.3.10-test-results.txt` for exact passing test count; individual intermediate version runs were **not** separately performed.
- Source-level JSX parsing of all application `.js` files and JSON files: covered by final release checks.
- Android Expo Go UI, iOS runtime, Web Metro runtime, sustained load tests, real device performance: **Not run in delivery environment**.
- No Firebase deploy or emulator-security verification: **Not run**.
- No acceptance or Git merge claims should be inferred from Node test results.

## 3. Risks / known limitations

Portfolio membership should be checked when projects are deleted or imported. No cloud-wide portfolios or team sharing.

## 4. Acceptance / rollback

1. Export a known-good workspace JSON and preserve your current `work` branch checkpoint.
2. Extract the single cumulative final ZIP at repository root; do not extract all intermediate batches separately.
3. Run `npm test`, `npx expo install --check`, and `npx expo start` on Termux.
4. Exercise this batch's described workflows on Android and Web, then export/import the workspace and restart.
5. If issues occur, restore the prior Git checkpoint and saved workspace JSON. Do not merge `work` into `main` until verified.

## 5. Next-model handoff

The final source includes this change together with the other v0.3.3–v0.3.10 batches. **Do not overwrite newer fixes by extracting an older intermediate ZIP**. Consult `docs/NP-QA-CUMULATIVE-v0.3.10.md` and `docs/NP-TRELLO-AUTOMATION-ARCHITECTURE.md` before extending local workflows or adding Firebase.

---

## v0.3.4



# CHG-NP-0.3.4 — Agile delivery reporting

## 0. READ FIRST — release handoff

| Field | Value |
|---|---|
| Product | Milvayo (independent of RIVNA / Niyarvo Control Center) |
| Batch | `v0.3.4` |
| Base | `v0.3.2-HOTFIX3` cumulative development line |
| Delivery | Included in final `v0.3.10` full source ZIP |
| Status | **Implemented, source-tested within cumulative release; native/Web runtime QA not verified** |
| Git | Target `work`; no GitHub commit, push, tag, or merge performed here |
| Firebase | Not connected or deployed; project `milvayo`, Android `com.milvayo.projects` |
| Persistence | Same `niyarvo.project.v1` import format and local AsyncStorage workspace; optional backward-compatible fields |

## 1. Implemented scope

Read completed sprint history to calculate committed and completed tasks and completion rate, without manufacturing past progress.

**Files / modules:** src/operations.cjs, src/WorkspaceExtensions.js.

The implementation is original JavaScript / React Native. OpenProject was used for domain concepts; Trello's published automation guide informed v0.3.10 workflows. Third-party source code was not copied.

## 2. Validation and evidence

- **Cumulative v0.3.10 suite:** see `docs/NP-v0.3.10-test-results.txt` for exact passing test count; individual intermediate version runs were **not** separately performed.
- Source-level JSX parsing of all application `.js` files and JSON files: covered by final release checks.
- Android Expo Go UI, iOS runtime, Web Metro runtime, sustained load tests, real device performance: **Not run in delivery environment**.
- No Firebase deploy or emulator-security verification: **Not run**.
- No acceptance or Git merge claims should be inferred from Node test results.

## 3. Risks / known limitations

No server events, shared team attendance, velocity forecasting, or historical analytics beyond local recorded sprint events.

## 4. Acceptance / rollback

1. Export a known-good workspace JSON and preserve your current `work` branch checkpoint.
2. Extract the single cumulative final ZIP at repository root; do not extract all intermediate batches separately.
3. Run `npm test`, `npx expo install --check`, and `npx expo start` on Termux.
4. Exercise this batch's described workflows on Android and Web, then export/import the workspace and restart.
5. If issues occur, restore the prior Git checkpoint and saved workspace JSON. Do not merge `work` into `main` until verified.

## 5. Next-model handoff

The final source includes this change together with the other v0.3.3–v0.3.10 batches. **Do not overwrite newer fixes by extracting an older intermediate ZIP**. Consult `docs/NP-QA-CUMULATIVE-v0.3.10.md` and `docs/NP-TRELLO-AUTOMATION-ARCHITECTURE.md` before extending local workflows or adding Firebase.

---

## v0.3.5



# CHG-NP-0.3.5 — Resource capacity and time logging

## 0. READ FIRST — release handoff

| Field | Value |
|---|---|
| Product | Milvayo (independent of RIVNA / Niyarvo Control Center) |
| Batch | `v0.3.5` |
| Base | `v0.3.2-HOTFIX3` cumulative development line |
| Delivery | Included in final `v0.3.10` full source ZIP |
| Status | **Implemented, source-tested within cumulative release; native/Web runtime QA not verified** |
| Git | Target `work`; no GitHub commit, push, tag, or merge performed here |
| Firebase | Not connected or deployed; project `milvayo`, Android `com.milvayo.projects` |
| Persistence | Same `niyarvo.project.v1` import format and local AsyncStorage workspace; optional backward-compatible fields |

## 1. Implemented scope

Add per-project contributors with weekly capacity and hourly rates; record dated task time entries and show logged hours, assigned tasks, and capacity alerts; preserve entry-time rate snapshots.

**Files / modules:** src/operations.cjs, src/model.cjs, src/WorkspaceExtensions.js.

The implementation is original JavaScript / React Native. OpenProject was used for domain concepts; Trello's published automation guide informed v0.3.10 workflows. Third-party source code was not copied.

## 2. Validation and evidence

- **Cumulative v0.3.10 suite:** see `docs/NP-v0.3.10-test-results.txt` for exact passing test count; individual intermediate version runs were **not** separately performed.
- Source-level JSX parsing of all application `.js` files and JSON files: covered by final release checks.
- Android Expo Go UI, iOS runtime, Web Metro runtime, sustained load tests, real device performance: **Not run in delivery environment**.
- No Firebase deploy or emulator-security verification: **Not run**.
- No acceptance or Git merge claims should be inferred from Node test results.

## 3. Risks / known limitations

Capacity comparison is a simple one-week estimate, not resource leveling or an interactive allocation calendar.

## 4. Acceptance / rollback

1. Export a known-good workspace JSON and preserve your current `work` branch checkpoint.
2. Extract the single cumulative final ZIP at repository root; do not extract all intermediate batches separately.
3. Run `npm test`, `npx expo install --check`, and `npx expo start` on Termux.
4. Exercise this batch's described workflows on Android and Web, then export/import the workspace and restart.
5. If issues occur, restore the prior Git checkpoint and saved workspace JSON. Do not merge `work` into `main` until verified.

## 5. Next-model handoff

The final source includes this change together with the other v0.3.3–v0.3.10 batches. **Do not overwrite newer fixes by extracting an older intermediate ZIP**. Consult `docs/NP-QA-CUMULATIVE-v0.3.10.md` and `docs/NP-TRELLO-AUTOMATION-ARCHITECTURE.md` before extending local workflows or adding Firebase.

---

## v0.3.6



# CHG-NP-0.3.6 — Budgets and cost calculation

## 0. READ FIRST — release handoff

| Field | Value |
|---|---|
| Product | Milvayo (independent of RIVNA / Niyarvo Control Center) |
| Batch | `v0.3.6` |
| Base | `v0.3.2-HOTFIX3` cumulative development line |
| Delivery | Included in final `v0.3.10` full source ZIP |
| Status | **Implemented, source-tested within cumulative release; native/Web runtime QA not verified** |
| Git | Target `work`; no GitHub commit, push, tag, or merge performed here |
| Firebase | Not connected or deployed; project `milvayo`, Android `com.milvayo.projects` |
| Persistence | Same `niyarvo.project.v1` import format and local AsyncStorage workspace; optional backward-compatible fields |

## 1. Implemented scope

Set project currency and budget; derive actual labor costs from recorded entries and rates, compare against estimated labor and remaining budget.

**Files / modules:** src/operations.cjs, src/WorkspaceExtensions.js.

The implementation is original JavaScript / React Native. OpenProject was used for domain concepts; Trello's published automation guide informed v0.3.10 workflows. Third-party source code was not copied.

## 2. Validation and evidence

- **Cumulative v0.3.10 suite:** see `docs/NP-v0.3.10-test-results.txt` for exact passing test count; individual intermediate version runs were **not** separately performed.
- Source-level JSX parsing of all application `.js` files and JSON files: covered by final release checks.
- Android Expo Go UI, iOS runtime, Web Metro runtime, sustained load tests, real device performance: **Not run in delivery environment**.
- No Firebase deploy or emulator-security verification: **Not run**.
- No acceptance or Git merge claims should be inferred from Node test results.

## 3. Risks / known limitations

No invoices, taxes, purchase orders, financial integration, or currency conversion.

## 4. Acceptance / rollback

1. Export a known-good workspace JSON and preserve your current `work` branch checkpoint.
2. Extract the single cumulative final ZIP at repository root; do not extract all intermediate batches separately.
3. Run `npm test`, `npx expo install --check`, and `npx expo start` on Termux.
4. Exercise this batch's described workflows on Android and Web, then export/import the workspace and restart.
5. If issues occur, restore the prior Git checkpoint and saved workspace JSON. Do not merge `work` into `main` until verified.

## 5. Next-model handoff

The final source includes this change together with the other v0.3.3–v0.3.10 batches. **Do not overwrite newer fixes by extracting an older intermediate ZIP**. Consult `docs/NP-QA-CUMULATIVE-v0.3.10.md` and `docs/NP-TRELLO-AUTOMATION-ARCHITECTURE.md` before extending local workflows or adding Firebase.

---

## v0.3.7



# CHG-NP-0.3.7 — Local task discussions and reminders

## 0. READ FIRST — release handoff

| Field | Value |
|---|---|
| Product | Milvayo (independent of RIVNA / Niyarvo Control Center) |
| Batch | `v0.3.7` |
| Base | `v0.3.2-HOTFIX3` cumulative development line |
| Delivery | Included in final `v0.3.10` full source ZIP |
| Status | **Implemented, source-tested within cumulative release; native/Web runtime QA not verified** |
| Git | Target `work`; no GitHub commit, push, tag, or merge performed here |
| Firebase | Not connected or deployed; project `milvayo`, Android `com.milvayo.projects` |
| Persistence | Same `niyarvo.project.v1` import format and local AsyncStorage workspace; optional backward-compatible fields |

## 1. Implemented scope

Add task-specific comments and reminders, mark reminders complete, delete records, and reconcile task deletion with linked local records.

**Files / modules:** src/operations.cjs, src/model.cjs, src/WorkspaceExtensions.js.

The implementation is original JavaScript / React Native. OpenProject was used for domain concepts; Trello's published automation guide informed v0.3.10 workflows. Third-party source code was not copied.

## 2. Validation and evidence

- **Cumulative v0.3.10 suite:** see `docs/NP-v0.3.10-test-results.txt` for exact passing test count; individual intermediate version runs were **not** separately performed.
- Source-level JSX parsing of all application `.js` files and JSON files: covered by final release checks.
- Android Expo Go UI, iOS runtime, Web Metro runtime, sustained load tests, real device performance: **Not run in delivery environment**.
- No Firebase deploy or emulator-security verification: **Not run**.
- No acceptance or Git merge claims should be inferred from Node test results.

## 3. Risks / known limitations

No real-time collaborators, mentions, push delivery, or access-control system before Firebase.

## 4. Acceptance / rollback

1. Export a known-good workspace JSON and preserve your current `work` branch checkpoint.
2. Extract the single cumulative final ZIP at repository root; do not extract all intermediate batches separately.
3. Run `npm test`, `npx expo install --check`, and `npx expo start` on Termux.
4. Exercise this batch's described workflows on Android and Web, then export/import the workspace and restart.
5. If issues occur, restore the prior Git checkpoint and saved workspace JSON. Do not merge `work` into `main` until verified.

## 5. Next-model handoff

The final source includes this change together with the other v0.3.3–v0.3.10 batches. **Do not overwrite newer fixes by extracting an older intermediate ZIP**. Consult `docs/NP-QA-CUMULATIVE-v0.3.10.md` and `docs/NP-TRELLO-AUTOMATION-ARCHITECTURE.md` before extending local workflows or adding Firebase.

---

## v0.3.8



# CHG-NP-0.3.8 — Reports, CSV exports and project templates

## 0. READ FIRST — release handoff

| Field | Value |
|---|---|
| Product | Milvayo (independent of RIVNA / Niyarvo Control Center) |
| Batch | `v0.3.8` |
| Base | `v0.3.2-HOTFIX3` cumulative development line |
| Delivery | Included in final `v0.3.10` full source ZIP |
| Status | **Implemented, source-tested within cumulative release; native/Web runtime QA not verified** |
| Git | Target `work`; no GitHub commit, push, tag, or merge performed here |
| Firebase | Not connected or deployed; project `milvayo`, Android `com.milvayo.projects` |
| Persistence | Same `niyarvo.project.v1` import format and local AsyncStorage workspace; optional backward-compatible fields |

## 1. Implemented scope

Export task and time datasets as CSV with spreadsheet-formula injection mitigation. Duplicate project structures into clean templates, remap hierarchy and dependency IDs, and clear execution records.

**Files / modules:** src/operations.cjs, src/WorkspaceExtensions.js, App.js.

The implementation is original JavaScript / React Native. OpenProject was used for domain concepts; Trello's published automation guide informed v0.3.10 workflows. Third-party source code was not copied.

## 2. Validation and evidence

- **Cumulative v0.3.10 suite:** see `docs/NP-v0.3.10-test-results.txt` for exact passing test count; individual intermediate version runs were **not** separately performed.
- Source-level JSX parsing of all application `.js` files and JSON files: covered by final release checks.
- Android Expo Go UI, iOS runtime, Web Metro runtime, sustained load tests, real device performance: **Not run in delivery environment**.
- No Firebase deploy or emulator-security verification: **Not run**.
- No acceptance or Git merge claims should be inferred from Node test results.

## 3. Risks / known limitations

CSV is deliberately narrower than full JSON. Template cloning does not clone execution or release history.

## 4. Acceptance / rollback

1. Export a known-good workspace JSON and preserve your current `work` branch checkpoint.
2. Extract the single cumulative final ZIP at repository root; do not extract all intermediate batches separately.
3. Run `npm test`, `npx expo install --check`, and `npx expo start` on Termux.
4. Exercise this batch's described workflows on Android and Web, then export/import the workspace and restart.
5. If issues occur, restore the prior Git checkpoint and saved workspace JSON. Do not merge `work` into `main` until verified.

## 5. Next-model handoff

The final source includes this change together with the other v0.3.3–v0.3.10 batches. **Do not overwrite newer fixes by extracting an older intermediate ZIP**. Consult `docs/NP-QA-CUMULATIVE-v0.3.10.md` and `docs/NP-TRELLO-AUTOMATION-ARCHITECTURE.md` before extending local workflows or adding Firebase.

---

## v0.3.9



# CHG-NP-0.3.9 — Multi-board Kanban and Android task-screen reliability

## 0. READ FIRST — release handoff

| Field | Value |
|---|---|
| Product | Milvayo (independent of RIVNA / Niyarvo Control Center) |
| Batch | `v0.3.9` |
| Base | `v0.3.2-HOTFIX3` cumulative development line |
| Delivery | Included in final `v0.3.10` full source ZIP |
| Status | **Implemented, source-tested within cumulative release; native/Web runtime QA not verified** |
| Git | Target `work`; no GitHub commit, push, tag, or merge performed here |
| Firebase | Not connected or deployed; project `milvayo`, Android `com.milvayo.projects` |
| Persistence | Same `niyarvo.project.v1` import format and local AsyncStorage workspace; optional backward-compatible fields |

## 1. Implemented scope

Add independently named project boards with membership separate from task status, create/delete/assign flows, protected Main board, independent-height lane layout; fix raw whitespace in task custom-field choice View; include embedded Atlas test fixture.

**Files / modules:** src/boards.cjs, src/model.cjs, App.js, tests/operations-boards.test.cjs.

The implementation is original JavaScript / React Native. OpenProject was used for domain concepts; Trello's published automation guide informed v0.3.10 workflows. Third-party source code was not copied.

## 2. Validation and evidence

- **Cumulative v0.3.10 suite:** see `docs/NP-v0.3.10-test-results.txt` for exact passing test count; individual intermediate version runs were **not** separately performed.
- Source-level JSX parsing of all application `.js` files and JSON files: covered by final release checks.
- Android Expo Go UI, iOS runtime, Web Metro runtime, sustained load tests, real device performance: **Not run in delivery environment**.
- No Firebase deploy or emulator-security verification: **Not run**.
- No acceptance or Git merge claims should be inferred from Node test results.

## 3. Risks / known limitations

Every board currently uses the same four status lanes. Native gesture performance still needs physical-device QA.

## 4. Acceptance / rollback

1. Export a known-good workspace JSON and preserve your current `work` branch checkpoint.
2. Extract the single cumulative final ZIP at repository root; do not extract all intermediate batches separately.
3. Run `npm test`, `npx expo install --check`, and `npx expo start` on Termux.
4. Exercise this batch's described workflows on Android and Web, then export/import the workspace and restart.
5. If issues occur, restore the prior Git checkpoint and saved workspace JSON. Do not merge `work` into `main` until verified.

## 5. Next-model handoff

The final source includes this change together with the other v0.3.3–v0.3.10 batches. **Do not overwrite newer fixes by extracting an older intermediate ZIP**. Consult `docs/NP-QA-CUMULATIVE-v0.3.10.md` and `docs/NP-TRELLO-AUTOMATION-ARCHITECTURE.md` before extending local workflows or adding Firebase.

---

## v0.3.10



# CHG-NP-0.3.10 — Trello-informed local Kanban automation

## 0. READ FIRST — release handoff

| Field | Value |
|---|---|
| Product | Milvayo (independent of RIVNA / Niyarvo Control Center) |
| Batch | `v0.3.10` |
| Base | `v0.3.2-HOTFIX3` cumulative development line |
| Delivery | Included in final `v0.3.10` full source ZIP |
| Status | **Implemented, source-tested within cumulative release; native/Web runtime QA not verified** |
| Git | Target `work`; no GitHub commit, push, tag, or merge performed here |
| Firebase | Not connected or deployed; project `milvayo`, Android `com.milvayo.projects` |
| Persistence | Same `niyarvo.project.v1` import format and local AsyncStorage workspace; optional backward-compatible fields |

## 1. Implemented scope

Add advanced rules with typed triggers and up to eight validated actions, card buttons, board buttons, manual due-date checks, per-board and priority scoping, idempotent due runs and local execution history. Preserve legacy simple move rules.

**Files / modules:** src/automation.cjs, src/AutomationStudio.js, src/model.cjs, src/boards.cjs, App.js, tests/automation-studio.test.cjs.

The implementation is original JavaScript / React Native. OpenProject was used for domain concepts; Trello's published automation guide informed v0.3.10 workflows. Third-party source code was not copied.

## 2. Validation and evidence

- **Cumulative v0.3.10 suite:** see `docs/NP-v0.3.10-test-results.txt` for exact passing test count; individual intermediate version runs were **not** separately performed.
- Source-level JSX parsing of all application `.js` files and JSON files: covered by final release checks.
- Android Expo Go UI, iOS runtime, Web Metro runtime, sustained load tests, real device performance: **Not run in delivery environment**.
- No Firebase deploy or emulator-security verification: **Not run**.
- No acceptance or Git merge claims should be inferred from Node test results.

## 3. Risks / known limitations

No unattended schedule, cloud push, emails, webhooks, integrations, permissions, or server-side enforcement. Requires separate Firebase phase.

## 4. Acceptance / rollback

1. Export a known-good workspace JSON and preserve your current `work` branch checkpoint.
2. Extract the single cumulative final ZIP at repository root; do not extract all intermediate batches separately.
3. Run `npm test`, `npx expo install --check`, and `npx expo start` on Termux.
4. Exercise this batch's described workflows on Android and Web, then export/import the workspace and restart.
5. If issues occur, restore the prior Git checkpoint and saved workspace JSON. Do not merge `work` into `main` until verified.

## 5. Next-model handoff

The final source includes this change together with the other v0.3.3–v0.3.10 batches. **Do not overwrite newer fixes by extracting an older intermediate ZIP**. Consult `docs/NP-QA-CUMULATIVE-v0.3.10.md` and `docs/NP-TRELLO-AUTOMATION-ARCHITECTURE.md` before extending local workflows or adding Firebase.

---

## v0.3.11


### CHG-NP-0.3.11-HOTFIX1.md

# CHG-NP-0.3.11-HOTFIX1 — Mobile/Web navigation drawer usability

## 0. Read first — handoff

| Field | Observed value |
|---|---|
| Application | Milvayo — independent local-first Expo/React Native app |
| Release ID | v0.3.11-HOTFIX1 |
| Base | Full v0.3.11 local-QA source archive |
| Scope | **Navigation-only hotfix** for an unscrollable sidebar, inaccessible navigation below Resources, and persistent-looking dark backdrop on Android and Web |
| Data migration | None; AsyncStorage keys and JSON project schema unchanged |
| Dependencies | None added or removed |
| Git | User-controlled `work` branch; no commits, pushes, merges or deployments performed |
| QA | 283/283 Node tests pass; JSX parser reports 0 diagnostics; Android/Web runtime not tested here |

## 1. Reported issue / before

A screenshot from Android showed the left navigation ending at **Resources**, with **Costs, Collaboration, Reports, Settings** and subsequent links inaccessible. The full-screen dark modal backdrop obscured the app, and the drawer could not be scrolled or reliably closed. User additionally confirmed the same issue on Web. This issue is present in the v0.3.11 navigation code; it does **not** imply a missing npm package.

Root-cause evidence in source:
- Sidebar was one non-scrollable `View` with `nav.map(...)` children and a flex spacer before the footer. Content could overflow the available vertical height.
- Mobile sidebar was rendered inside `SafeModal` with `#000b` opacity, and no explicit close icon, only an outside Pressable and `onRequestClose`.

## 2. Changes implemented

1. Restructured sidebar as a bounded-height column (`height:'100%'`, fixed width) with a vertical `ScrollView` **only around navigation links**, `flex:1`, `minHeight:0`, `nestedScrollEnabled`, visible scrollbar and extra bottom spacing.
2. Kept Niyarvo brand, workspace switcher and "Close navigation" icon outside the scroll area, so they remain accessible even at the bottom of a long menu.
3. Increased navigation row touch height to at least 44 logical points. All existing navigation destinations remain reachable; no new tabs or altered routing.
4. Replaced the mobile/Web **navigation** `SafeModal` with a bounded in-tree absolute overlay. Background is dimmed more lightly, with a full-screen tappable dismissal backdrop and an always-visible close button.
5. Added Android hardware Back button and Web Escape key dismissal while the navigation menu is open. Navigation selection closes the menu.
6. Kept all **other** modals (task editing, project picker, import, confirmation dialogs) unchanged. No storage, board, task or Firebase code changed.

## 3. Source changes

- `App.js`: sidebar layout, scrolling, overlay, close controls, Back/Escape handlers.
- `tests/navigation-drawer.test.cjs`: five source regression checks for scroll containment, fixed header/close, dismissible overlay, touch targets, Back/Escape.
- `CHG-NP-0.3.11-HOTFIX1.md`, `docs/NP-QA-0.3.11-HOTFIX1.md`, `docs/NP-v0.3.11-HOTFIX1-test-results.txt`, README note.

## 4. Verification results

| Check | Status | Evidence |
|---|---|---|
| Node test suite | **Pass** | 283 tests, 0 failures |
| JSX parse | **Pass** | Global TypeScript parser, 0 diagnostics for `App.js` |
| ZIP archive integrity | **Pass** | Validated after packaging |
| Fresh extraction tests | **Pass** | Verified extracted full archive |
| Expo Web runtime | **Not run** | No installed Expo dependencies in the build container |
| Android / Expo Go runtime | **Not run** | Requires user’s device |
| Package compatibility | **Not run** | No `node_modules` in the provided source archive; no dependencies changed |
| Automated screenshot/UI interaction | **Not run** | Device/browser acceptance required |

## 5. Reproduction / acceptance criteria

1. On Android and Web, open the navigation drawer in a narrow viewport. It must scroll **past Resources** through **Settings**, with independent vertical scrolling.
2. With the menu open, tap **Close navigation**. The menu and backdrop must disappear and the app must be interactive.
3. Reopen the menu and tap outside; app returns to the current screen.
4. With menu open, press Android Back (Expo Go/standalone) or Escape (Web). Menu closes without exiting the app.
5. Open a lower menu item (e.g., Reports/Settings); correct screen opens and backdrop disappears.
6. Test Atlas Timeline and Board separately for regressions; those implementations were not changed by this patch.

## 6. Rollback

Reapply the original full v0.3.11 source ZIP over `work` after preserving local modifications. No data restoration or migration is necessary. Do not clear app data to test the navigation fix.

## 7. Future work

The independent Kanban redesign inspired by the uploaded Kan reference has **not** been merged into this hotfix and should be considered a separate release after this navigation fix is accepted on Web and Android.

### CHG-NP-0.3.11-HOTFIX2.md

# CHG-NP-0.3.11-HOTFIX2 — Milvayo

## 0. Read first — release and handoff

| Field | Observation |
|---|---|
| Product | Milvayo (independent project-management application) |
| Baseline | v0.3.11-HOTFIX1 complete source ZIP |
| Batch | v0.3.11-HOTFIX2 |
| Status | **Source-level QA passed; Web and Android runtime acceptance not run** |
| User-reported defect | Expo Web fails during `BrandMark` rendering; stack points to `react-native-svg/lib/module/web/WebShape.js:74`, invoked from `src/BrandMark.js` |
| Root-cause confidence | High for this rendering path; the stack indicates the Web SVG adapter, but the complete thrown exception message was not supplied |
| Data migration | None |
| New dependencies | None |
| API / storage / schema changes | None |
| GitHub changes | No commits, merges or pushes performed |

## 1. Change summary

- **NEW `src/BrandMark.web.js`:** Web-only Niyarvo brand icon implementation using ordinary browser SVG and path elements via React's `createElement`. The Web bundler resolves this platform-specific module from the existing unqualified `import BrandMark from './src/BrandMark'`.
- **UNCHANGED `src/BrandMark.js`:** The original four-path `react-native-svg` implementation remains in place for Android and iOS. No native SVG behavior has been modified.
- Both implementations use the same centered Niyarvo mark geometry (800 × 760 viewBox) and preserve default/original selected accent plus optional explicit tint. The Web rendition has accessible image text.
- This avoids the failing `react-native-svg` `WebShape` path **for the Niyarvo mark only**. Other SVG-based app components (for example Gantt) continue to use the existing drawing library.
- No menu, Kanban, sprint, import, authentication, or persistence logic changes.

## 2. Files

| File | Operation | Reason |
|---|---|---|
| `src/BrandMark.web.js` | Added | Web-native SVG logo, avoiding Web adapter |
| `tests/brand-mark-web.test.cjs` | Added | Platform-resolution contract, original geometry, accent behavior |
| `CHG-NP-0.3.11-HOTFIX2.md` | Added | This handoff record |
| `docs/NP-QA-0.3.11-HOTFIX2.md` | Added | Manual QA checklist |

## 3. Tests and verification

| Check | Result | Evidence / limitation |
|---|---|---|
| `npm test` | **Pass: 286/286** | Native Node test runner, including three new Web logo tests |
| Syntax parsing | **Pass** | TypeScript parser: `App.js`, `src/BrandMark.js`, `src/BrandMark.web.js`: 0 parse diagnostics |
| ZIP integrity / clean extraction | Pass | Checked at packaging |
| Full Expo Web bundling | **Not run** | Expo/React/npm dependencies were not installed in the test environment |
| Web browser runtime | **Not run** | Requires local `npx expo start -c --web` or `npx expo start -c` |
| Android Expo Go | **Not run** | No device access |
| Sidebar scroll and backdrop | **Not verified** | HOTFIX1 behavior still requires browser and Android runtime acceptance |

## 4. Risks and limitations

- This is a narrow corrective patch for the logo frame reported in the Web stack. A subsequent Web exception elsewhere in the application should be investigated separately with its own full error message.
- Browser SVG path rendering should be tested with alternate accent colors, different viewport widths, and navigation open/close.
- The previous sidebar overflow issue remains subject to HOTFIX1 acceptance in the user's runtime.
- Do not infer production readiness or native crash resolution from Node tests alone.

## 5. Install and acceptance

1. Preserve uncommitted work; optionally export the workspace JSON. In Termux: `cd ~/Milvayo && git switch work && git status --short`.
2. Extract the HOTFIX2 **changes-only** ZIP at the project root; or use complete HOTFIX2 source ZIP if no user edits must be preserved.
3. Run `npm test` and `npx expo start -c` to clear Metro's previous Web resolution cache.
4. Open Web: verify the Niyarvo sidebar mark draws, sidebar links scroll beyond Resources, backdrop tap/Escape dismiss correctly, and Settings accent changes recolor the mark.
5. Open Expo Go on Android: verify the same mark still draws and all navigation works.
6. Accept on `work` only after physical/Web QA; then commit and push as user-controlled checkpoint. Keep `main` unchanged until accepted.

## 6. Next model handoff

Use this full ZIP as baseline for any further Kan-based Kanban redesign. Do not reapply previous v0.3.11-HOTFIX1 patches; they are already included. Preserve the platform split for `BrandMark` and keep other Web SVG issues isolated instead of replacing Gantt rendering wholesale.

### CHG-NP-0.3.11.md

# CHG-NP-0.3.11 — Board Power-Ups and GitHub references

## 0. READ FIRST — release handoff

| Field | Observed value |
|---|---|
| Product | Milvayo (independent of RIVNA/Control Center) |
| Release | v0.3.11 — local QA candidate |
| Base | v0.3.10 cumulative release source |
| Scope | Trello-informed Kanban improvements and original, built-in Power-Up system |
| Git | User-managed `work` branch; no commit, push, merge or tag performed |
| Cloud | Not connected; original local-first AsyncStorage and project JSON format |
| Test result | 278/278 Node tests passed; no Android/iOS/Web runtime test |
| Third-party source | Niyarvo code original; Trello public documentation consulted |
| Unavailable reference | User uploaded `kanban.zip`, but its original bytes were not mounted/readable in this session. Do not claim the internal release was inspected or incorporated. |

## 1. Implementation and behavior

- Added a board-specific built-in extension registry (`src/powerUps.cjs`): GitHub, Due date calendar, Card aging, Checklist progress. The Main board defaults to no extensions enabled; users opt in per board. No arbitrary third-party code is executed.
- Added Power-Ups panel to the Kanban board, with an enable/disable control per extension. Enabling a Power-Up does not mutate task statuses, releases or dependencies; disabling it hides the functionality without deleting persisted GitHub links.
- Added task-level GitHub reference attachments: issues, pull requests, commits and branches, restricted to canonical `https://github.com/<owner>/<repo>/...` URLs. Rejects spoofed hosts, non-HTTPS, URL credentials, query parameters, unsupported routes and duplicates.
- Added optional on-demand **unauthenticated public** GitHub API preview for titles, state (including merged PRs), author, labels and comment count where available. Private repositories and authenticated OAuth access are **not implemented**. No tokens are stored, and no GitHub write operations are performed.
- Added upcoming tasks (within 30 days) when Calendar Power-Up is enabled; age indicator for unfinished cards updated 7+ days ago; checklist completion strip when enabled.
- Improved Kanban cards with slightly tighter spacing, GitHub attachment counts, conditional aging badge and checklist progress strip. Every lane has an Add card action that preselects its workflow status; preserved long-press full-card drag and per-column independent heights.
- Extended `niyarvo.project.v1` optional metadata: `powerUps` board-keyed array selections and `tasks[].githubLinks`. Missing fields default to empty, preserving legacy projects.
- Removing a board also removes its extension settings and moves tasks to Main. Linked GitHub references stay on tasks for recovery.
- Increased app version to 0.3.11 in `package.json` and `app.json` without adding dependencies.

## 2. Changed source files

- `App.js` — Board Power-Ups launcher, optional card adornments, contextual Add card, task editor GitHub references
- `src/PowerUpsPanel.js` — new board extension UI and GitHub card UI
- `src/powerUps.cjs` — new isolated domain/validation/API-preview module
- `src/model.cjs` — normalize, validate, preserve Power-Ups and task links
- `src/boards.cjs` — extension cleanup when deleting a board
- `schemas/niyarvo.project.v1.schema.json` — optional fields documented
- `tests/powerups.test.cjs` — 14 new tests, including Atlas import, failures and GitHub spoofing
- `README.md`, `package.json`, `app.json`, release documentation

## 3. Validation (facts versus pending checks)

| Check | Status | Evidence |
|---|---|---|
| Full Node test suite | PASS | 278 tests, 0 failures (`docs/NP-v0.3.11-test-results.txt`) |
| Existing 264 tests | PASS | Included in suite |
| Source syntax: CommonJS | PASS | `node --check` |
| JSX source parsing | PASS | TypeScript JSX parser |
| Valid JSON files | PASS | Python JSON decode |
| ZIP integrity and clean extraction | PASS | See final packaging QA log |
| Expo SDK package compatibility | Not run | `npx expo install --check` in Termux |
| Metro Web/Expo Go performance | Not run | Device required |
| Actual live GitHub API request | Not run | Automated `fetch` fixture tests only |
| GitHub OAuth, private repositories | Not implemented | Requires secure backend authorization |
| External arbitrary Power-Up installation | Not implemented | Curated built-in extensions only |

## 4. Android acceptance checklist

1. Export current workspace and check `git status --short` on `work` before extraction.
2. Launch v0.3.11, open Atlas and Board. Check cards, independent column heights, lane Add card and long-press drag (including moving to a different column).
3. Open Board → Power-Ups. Enable GitHub only on Main, verify a second board remains disabled. Enable Calendar, Aging and Checklist individually.
4. Open a task on a GitHub-enabled board; attach a public issue/PR/commit/branch URL. Check the reference persists after restart and export/import. Test a spoofed GitHub host is rejected.
5. Select Refresh public details on a public reference only; verify it shows real data, or a useful network/rate-limit error. Confirm private repo links are not claimed as authenticated.
6. Disable GitHub, verify linked information is retained; re-enable and check again.
7. Delete a non-Main board after taking a backup: tasks move to Main and extension selections for that board are removed.
8. Regress Android Timeline with Atlas, Board scrolling/dragging, task editor, Sprint burndown, JSON import and safe-area spacing.

## 5. Rollback and next-model handoff

Restore the previous `work` checkpoint and previously exported JSON workspace if runtime issues appear. Do not merge to main until device QA. The Power-Up engine is currently a fixed set of **first-party in-app extensions**. In a future Firebase phase, implement server-side GitHub OAuth through least-privilege permissions, encrypted token storage and audited revocation; do **not** put GitHub access tokens in Firestore client-visible documents or client bundles. Reassess arbitrary extension sandboxing, permissions and data access separately before allowing untrusted Power-Up code.

---

## v0.3.12



# CHG-NP-0.3.12 — Kan-informed Kanban workflow and UI

> **Release status:** Local-QA candidate; Android Expo Go and browser acceptance **Not run** in this environment. User confirmed v0.3.11-HOTFIX2 worked on both Android and Web before this branch began. Do not treat this release as accepted until device QA.

## 0. Handoff — read first

| Field | Observed value |
|---|---|
| Product | Milvayo (independent Expo + React Native local-first project-management app) |
| Release | `v0.3.12` |
| Based on | `Milvayo-v0.3.11-HOTFIX2-LOCAL-QA.zip` |
| Code baseline | v0.3.11-HOTFIX2, including scrollable in-tree sidebar and Web-native brand mark |
| Source reference | Uploaded `kanban.zip` (Kan monorepo; 738 ZIP entries; extracted source read) |
| Code reuse | **None**. Independently implemented behavior and visuals in Niyarvo React Native; no copied Kan components/styles/assets |
| Storage | Existing local AsyncStorage `milvayo-v1`; JSON `niyarvo.project.v1` |
| Migration | Optional project-level `kanbanViews` object. Legacy projects default to `{}`; new preference is stored per board |
| Firebase / remote | Not introduced. Existing local GitHub Power-Up references unchanged |
| Tests | `npm test` **297 passed, 0 failed** (286 prior + 11 focused new tests) |
| JSX parser | App.js plus existing JSX modules parsed with TypeScript JS/JSX parser — PASS |
| Metro / Web / Expo Go / APK | **Not run**, no dependencies installed in verification environment |

## 1. Exact scope

### Board presentation and interaction

- Reworked task cards around scannability: ID, concise title, optional description, meaningful labels, due date, checks, comments, attachments, GitHub reference count and assignee initials.
- Elevated urgent priority with a small dot, not a bright panel; overdue due dates use semantic warning color.
- Continued top-aligned independent column heights, held-card movement and progressive card loading from v0.3.11.
- Added a dedicated 44-ish px contextual action target via ellipsis on each board card, without replacing full-card hold-drag.
- Added a card actions sheet: open details, duplicate as unfinished Backlog work, move to a status (through existing validated `moveTask`), move to another board, open label/date editing and execute enabled local card-button automations.
- Added editing of task labels in task drawer, including individual removal. Changes invalidate verified/merged checkpoints.

### Filters and board preferences

- Board filter panel: assignee, label, priority, due-date bucket (overdue/today/tomorrow/next 7d/next 30d/no date), clear, current match counts; existing task search retained.
- These controls filter only the visible board; tasks are not deleted or reassigned when filtered.
- Drop-position resolution accounts for cards hidden by a filter, preserving the full lane's relative ordering.
- Optional descriptions are persisted **per board** under `kanbanViews[boardId].showDescriptions`, with normalized JSON import/export and cleanup when a board is deleted.

### Domain safety

- `src/kanbanUX.cjs` is a pure, independently written domain helper: real ISO dates, validated filters, full-lane drop positioning, safe duplicate, labels, per-board view normalization.
- Duplicated cards are new unscheduled/unverified backlog work; predecessor links and sprint membership are not copied. Duplicates do not claim GitHub synchronization or completed tests.
- Duplicates preserve relevant context (labels, assignee, description, estimate, start/due, notes, attachment URLs), while clearing verification, merge evidence, individual checklist evidence, branch/SHA and GitHub references. The source task is unchanged.
- Existing status workflow checks, dependency guards, local automation triggers and safe import/export were retained.

## 2. Grounded comparison with Kan source

Inspected paths from user-provided Kan ZIP:

- `apps/web/src/views/board/components/Card.tsx`: compact title, label badges, due date, comments, attachments, checklist count and avatars.
- `apps/web/src/views/board/components/Filters.tsx`: owner/member, labels, lists and due-date buckets, including clear filters.
- `apps/web/src/views/board/components/CardContextMenu.tsx`: move, labels, due, duplicate and delete card actions.
- `apps/web/src/views/board/components/List.tsx`: independent fit-content columns and per-list add actions.
- `apps/web/src/views/card/components/Checklists.tsx`, `ActivityList.tsx`: richer card context.

**Intentionally not transplanted:** Kan's backend/tRPC and database, remote permissions/roles, multi-user avatars, its specific dnd-kit interactions, HTML/NextJS components, public share URLs, card soft deletion, custom list/status schema. Kan ZIP's board code does not establish a complete Trello-style automation engine. Niyarvo's existing status, card-button, board-button and due-date local automation engine remains authoritative.

## 3. Changed files

- `App.js` — card UI, per-board filters, contextual card-action sheet, task label editor, board settings.
- `src/kanbanUX.cjs` — new domain layer.
- `src/model.cjs` — normalize/persist/validate `kanbanViews`, expose the helper.
- `src/boards.cjs` — remove board-specific preferences on board deletion.
- `tests/kanban-ux.test.cjs` — 11 new deterministic tests, including 73-task Atlas JSON round-trip.
- `package.json`, `app.json` — version increment to 0.3.12.
- `README.md`, `docs/NP-QA-0.3.12.md`, `docs/UNSLOP-NP-0.3.12.md`, this changelog.

## 4. Verified and unverified

| Check | Result |
|---|---|
| Pre-existing regression tests | PASS 286/286 |
| New Kanban domain tests | PASS 11/11 |
| Full Node tests | PASS 297/297 |
| Existing Atlas import / 73-task project | PASS in Node test |
| Board preference JSON import/export | PASS in Node test |
| Duplicate/reset/label safeguards | PASS in Node test |
| JSX syntax parsing | PASS |
| Archive extraction/integrity | PASS after packaging |
| Expo `npx expo install --check` | Not run (node_modules absent) |
| Metro, Web render, Android Expo Go gestures | **Not run** |
| Android memory/performance measurement | Not run |
| Firebase and GitHub integration tests | Not run/not in scope |

## 5. Risks and acceptance checks

1. Verify the ellipsis action tap does **not** also open the task on Android or initiate drag.
2. Verify long-press and drag behavior both before and after filtering and horizontal autoscroll.
3. Verify `Backlog` duplication adds a new item without changing release evidence or sprint history.
4. Verify status actions respect configured workflow restrictions, prerequisites and automations.
5. Verify owner/priority/label/date filters on Atlas and clear; verify all matching cards can still be reached with **Show more**.
6. Verify per-board description switch survives restart and JSON export/import.
7. Verify the v0.3.11-HOTFIX2 sidebar scroll and Web BrandMark do not regress.
8. Test Web, Expo Go, mobile portrait, and larger board datasets before merging.

## 6. Rollback / restore

This is a complete source release based on v0.3.11-HOTFIX2. Return to that tested ZIP or Git checkpoint if native acceptance fails. Export your workspace before deploying. New optional `kanbanViews` metadata may be discarded by an older binary on reimport; task data remains in the original `niyarvo.project.v1` format. Do not merge this candidate into `main` without QA.

---

## v0.4.0

*No standalone changelog for this version was present in the recovered archives. No implementation claims are inferred.*

---

## v0.4.1

*No standalone changelog for this version was present in the recovered archives. No implementation claims are inferred.*

---

## v0.4.2



# CHG-NP-0.4.2 — MockDesign migration and model handoff

> Product: **Milvayo** (standalone project-management app; NOT RIVNA or the Control Center).
> Date: **2026-10-31**. Input source: `Milvayo-v0.4.1-FINAL.zip`; UI reference: `MockDesign.zip`.
> Delivery: **v0.4.2 source QA candidate**, not a production release or a claim of device acceptance.

## 0. READ FIRST — handoff

| Field | Result |
|---|---|
| Baseline | v0.4.1 FINAL; preserved as `ClassicApp.js` |
| New entry point | `App.js` → `ModernApp.js` (default); Settings → Advanced workspace opens original UI |
| Storage | Same AsyncStorage key **`milvayo-v1`**; no remote sync or new DB |
| Project export | Original `niyarvo.project.v1` format; original workspace wrapper export supported |
| User data migration | **In-place, non-destructive**. The first read normalizes existing workspace; no mock data injected into existing installs. All edits write canonical original schema. |
| UI features | Redesigned workspace, new Kanban boards/lists, card and list drag/reorder, task sheet, timeline bar move/resize, dependency linking, and overview/secondary screens |
| Original advanced functionality | Available unchanged in `ClassicApp.js`; not fully recreated in the new shell |
| Automated test result | **PASS: 327/327** tests (`npm test` / `node --test tests/*.test.cjs`) |
| JS/JSX syntax | **PASS:** TypeScript JSX parser over 27 JS files; 0 errors |
| Expo Web bundling, Android/iOS launch, drag gestures on device | **NOT RUN / NOT VERIFIED** in this environment |
| Git status / deployment | No commits, merges, remote deployments or APK builds performed |

## 1. Implementation inventory

### Canonical persistence and business logic

- `src/modernBridge.cjs` projects the original model to `MockDesign` view data, and routes mutations through the original domain operations.
- `src/store.js` replaces prototype-only in-memory state. Reads the existing local key and validates the entire updated workspace before persisting. Save/load failure is visible; corrupt data is **not** overwritten with sample data.
- `src/boards.cjs` persists board-level lists (`id`, `name`, `status`) and archived state in the original `niyarvo.project.v1` schema, keeping old boards without lists compatible via non-mutating default lane projection.
- `src/model.cjs` preserves `listId` on normalization and clears association when a task changes status.
- Existing domain modules for task dependencies, schedule validation, automations, releases, sprint history, time ledger, portfolio, custom fields, and backup recovery remain the authoritative source.
- No additions to package dependencies. The baseline Expo SDK and Metro architecture remain in place.

### MockDesign presentation and behavior

- New default `ModernApp.js` with redesigned responsive navigation, project switching and modern visual language.
- New `src/screens/Board.js`: create/rename/archive/delete boards, create/rename/reorder/delete lists, touch-hold card movement, list reordering, and lane-specific card creation. Delete-list moves tasks rather than deleting them. Destroying a board returns its tasks to Main; an automatic workspace snapshot precedes board deletion.
- New `src/screens/Timeline.js`: Days/Weeks/Months, horizontally page-able 56-day window, 120 scheduled rows per page, timeline bar move/start/due resize, curved dependencies, dependency creation/removal, and explicit unscheduled-task list. Date edits are validated and routed through existing scheduler.
- New `src/screens/TaskSheet.js`: edit status, priority, stage, owner, dates, effort, task type, dependencies, parent/release/sprint associations, labels, custom fields, URL attachments, comments, acceptance checks **with evidence**, verification and recorded merge information.
- New modern secondary screens display persisted sprints, releases, testing, resources, costs, portfolios, automation and audit data. CSV and JSON exports use the original model and real browser download/native sharing, rather than fake prototype confirmation.
- `ClassicApp.js` stays available as **Advanced tools** for detailed scheduling, imports, field definitions, reports, task flows and other 0.4.1 workflows not yet brought into the modern design.
- Existing UI-specific regression tests that intentionally verify the original shell now load `ClassicApp.js` rather than treating it as removed functionality.

## 2. Preservation and data safety

- Existing task IDs, dependencies, release/sprint links, checked evidence, comments, custom values, saved views, time entries and historical reports remain in the normalized workspace model.
- All changes pass `model.normalizeWorkspace()`; dependency cycles, invalid dates, impossible task transitions and release gates are enforced.
- Model gate semantics **do not execute external test suites or Git merges**. Verification and merge flags are evidence/record-keeping, not GitHub actions.
- `ModernApp` and the classic workspace **use the same persistent key**. The settings switch awaits pending modern writes before remounting the original shell.
- A snapshot is taken automatically before board deletion, project import and manual snapshot recovery. **Export a manual workspace backup before first upgrade**, since data is still local-first.
- Neither the RIVNA repository nor any unrelated Firebase environment was touched.

## 3. Verification performed

| Validation | Status | Evidence |
|---|---|---|
| Existing model regression tests | PASS | Node suite |
| 17 newly added bridge tests | PASS | `tests/modern-bridge.test.cjs` |
| Total suite | **PASS — 327/327** | `node --test tests/*.test.cjs` |
| Modern JS/JSX parse | PASS — 0 parse errors across 27 files | TypeScript JSX source parser |
| Real 73-task Atlas import/round trip | PASS | Bridge fixture test |
| Migration persistence and list ordering | PASS | Bridge round-trip tests |
| Blocked Done/drop, dependency cycles, invalid dates | PASS | Bridge + original model tests |
| Acceptance evidence, verification/merge flag invalidation | PASS | Bridge tests |
| Sprint historical reconcile and logged cost snapshot | PASS | Bridge tests |
| `npm ci` / Expo dependency install | **NOT VERIFIED** | Install stalled in this environment; no confirmed complete Expo install |
| `npx expo install --check` | NOT RUN | Requires working Expo installation |
| Expo Web bundling/browser interaction | NOT RUN | No runtime evidence provided |
| Physical Android/iOS: hold drag, auto-scroll, keyboard, file share | NOT RUN | Device acceptance required |

Note: The original v0.4.1 browser/device evidence does **not** carry over to v0.4.2's new shell. The source-level suite is not a substitute for runtime checks.

## 4. Known differences, limitations and acceptance risks

1. **Runtime gate:** Expo SDK 58 app bundle and device behavior are unverified; do not deploy before your Termux and Expo Go/Web smoke tests.
2. **Large timelines:** The new shell renders a paged 56-day time window and 120 scheduled rows per page; tasks outside the visible time window remain stored and become visible via paging. Unscheduled tasks are listed separately.
3. **Large boards/tasks:** The new shell uses progressive “Show more” groups for large lanes and task lists. Review drag/drop placement after filtering/loading additional cards on your real data.
4. **Parity:** The modern shell is not yet a full replacement for every advanced v0.4.1 planner, schema editor or data-management surface. The preserved ClassicApp provides those workflows.
5. **Native files:** Browser downloads and native share sheets are implemented, but real OS permissions, save destinations, and round-trip imports must be verified on devices.
6. **Local-only:** No multi-user sync, server-side security rules, GitHub actions or production hosting changes are claimed.

## 5. Termux installation (keep rollback available)

**Before modifying your working folder:** In v0.4.1 export a full **workspace JSON backup**. Keep a copy outside the app folder; copy the existing source directory as a rollback point.

```bash
# From the existing ~/Milvayo directory, after making a copy/backup:
# Extract the v0.4.2 ZIP CONTENTS directly into the project root.
# Do not remove .git or Android local storage.
npm install
npm test
npx expo install --check
npx expo start --clear
```

Use Expo Go on Android and the Expo Web entry point. Test board creation, card drag, list reorder and deletion, timeline resize/dependency link, task edits, project switching, JSON backup import/export and restoring advanced mode. Review runtime errors before accepting.

**Rollback:** Stop Metro, restore the backed-up **v0.4.1 source** (no `git push --force`). Preserve device app storage, and if necessary restore your exported workspace JSON via the previous working UI. Do not clear AsyncStorage or uninstall to troubleshoot.

## 6. Next model instructions

1. Start with this changelog, `AGENTS.md`, `.opencode/skills/unslop/SKILL.md`, and the entire v0.4.2 source ZIP.
2. Get real Web + Expo Go Android acceptance evidence, particularly gestures and export; fix observed issues without refactoring canonical domain semantics.
3. Use the modern shell's design language as the UI authority while preserving ClassicApp as a fallback until advanced workflow parity is proven.
4. Expand bridge/interaction tests for any fixed bug; log observed facts and tested statuses in the next `CHG-NP-[VERSION].md`.
5. Do not commit or merge to `main` until the user has tested and explicitly approved.

---

## v0.4.3



# CHG-NP-0.4.3 — Mock design fidelity, native motion, and timeline hardening

**Product:** Milvayo (independent application)
**Baseline:** `Milvayo-v0.4.2-MOCK-DESIGN-INTEGRATED.zip`
**Target:** `v0.4.3` QA candidate (not runtime-accepted)
**Date:** 2026-10-31
**Scope:** Android/iOS gestures, visual fidelity, compact task sheet, timeline resource safety.
**Persistence:** Existing v0.4.1/v0.4.2 workspace format, no migration or automatic deletion.

## 0. Read first

- **Android/iOS:** Reanimated 4.7.1, Worklets 0.13.0 and Gesture Handler ~3.3.0 added as explicit dependencies, matching Expo SDK 58. The gestures use RNGH 3 hooks (`usePanGesture`, `useTapGesture`, `useCompetingGestures`) plus `VirtualGestureDetector` inside `InterceptingGestureDetector` so gesture recognition does not introduce extra card/row layout wrappers.
- **Web:** The mock's existing JS/DOM PanResponder behavior remains intact using platform-specific `.web.js` modules.
- **Task sheet:** Inline property dropdowns (visible label and selected-value summary), instead of displaying all advanced editors at once. Editing expands in the same sheet. Native open/close uses Reanimated layout transitions.
- **Board:** Native card/list long-press drag translation is driven by Reanimated shared values, rather than `Animated.ValueXY`/JS timers. Original column widths, gaps, touch zones, card padding and visual hierarchy remain. Existing guarded persistence (`placeTask`, `moveListTo`, etc.) is kept.
- **Timeline:** Range-based filtering plus row paging (10 on mobile, 22 on wide screens), 56-day painted window, date navigation and clipped task bars. It still persists full ISO dates, task IDs and dependency relations; no date is silently invented for undated tasks. Native bar motion uses UI-thread translation; resizes commit through the existing domain method.
- **Shell:** Native project drawer uses Reanimated opacity/translation instead of JS-frame animation. Root gesture context is native-only, so web does not gain an extra native gesture wrapper.
- **Insets:** Modern task sheet preserves original content spacing (20pt horizontal content padding, 18pt item gap) while applying only the bottom system safe area inside its modal.

## 1. Root cause and findings

1. `SafeAreaView` deprecation warning is informational. It is not sufficient evidence of the Expo Go process exit. Safe-area wrappers in the modern shell are imported from `react-native-safe-area-context`.
2. Earlier timeline migration created significant memory/render pressure through too many rows/gesture handlers and offscreen geometry. This candidate bounds both rows and visible date geometry.
3. v0.4.2 task sheet placed every editor in the full vertical stack. Inline property editors restore the mock's concise rhythm while keeping fields accessible.
4. The proposed native gesture stack MUST use RNGH **3** hooks, not RNGH 2 `Gesture.Pan()` builders. The implementation follows its changed API and virtual detector requirement.

## 2. Modified/added files

- `package.json`, `app.json`, `App.js`, `ModernApp.js`
- `src/gesture.native.js` **new** — native worklet-based gesture recognizer and target callbacks
- `src/gestureSurface.native.js`, `src/gestureSurface.web.js` **new** — layout-neutral drag targets
- `src/AppGestureRoot.native.js`, `src/AppGestureRoot.web.js` **new** — platform-specific root gesture context
- `src/DrawerMotion.native.js`, `src/DrawerMotion.web.js` **new**
- `src/InlineEditor.native.js`, `src/InlineEditor.web.js` **new**
- `src/screens/Board.js`, `src/screens/Timeline.js`, `src/screens/TaskSheet.js`, `src/ui.js`
- `src/timelineWindow.cjs` **new**, range-aware rendering helpers
- `tests/native-animation-contract.test.cjs` **new**
- `tests/modern-design-regression.test.cjs` updated for range paging

Unchanged: the original business/domain modules (`model`, operations, boards, scheduling, history, backup, verification, stored schema), and the original Classic workspace implementation.

## 3. Verification matrix (observed only)

| Gate | Result | Detail |
|---|---|---|
| Node source/domain regression suite | **Passed (336/336)** | Includes workspace/bridge, Kanban, scheduling, release, backup, windowing, native module contracts |
| JavaScript/JSX syntax via TypeScript parser | **Passed** | 37 JS/JSX application files; 0 parser diagnostics |
| ZIP integrity | **Passed** | 228 files; `ZipFile.testzip()` returned no errors |
| Expo npm dependency install | **Not verified** | npm registry DNS inaccessible in this execution environment; run `npm install` in Termux |
| Web/Android Metro bundle | **Not verified** | Package install unavailable here |
| Expo Go Android launch / timeline tab | **Not verified** | Must be tested on the target Android phone |
| iOS runtime / gestures | **Not verified** | Requires a physical device or simulator |
| Native FPS / memory pressure | **Not measured** | Needs in-app profiling; range limiting is a mitigation, not proof of resolution |
| Data persistence across restart | **Not re-verified on device** | Original domain round-trip tests passed; manual device test mandatory |

**Caveats:** Native edge auto-scroll and target selection continue to use the existing JS coordinator; the **animated drag translation** runs on the UI runtime. The source uses the correct RNGH 3 APIs but has not been exercised inside Expo Go in this environment. Do not describe the native crash as definitively fixed until device acceptance.

## 4. Install / QA instructions (Termux)

Back up your existing workspace and Git checkpoint before extraction. Because this ZIP is a root-overlay package, old files that are no longer in the new ZIP may remain in an existing directory.

```bash
cd ~/Milvayo
unzip -o ~/storage/downloads/Milvayo-v0.4.3-NATIVE-MOTION-QA.zip -d .
npm install
npx expo install --check
npm test
npx expo start --clear
```

`npm install` is required, not `npm ci`: the baseline lockfile predates the additional native animation packages and must be reconciled when network access is available. Do not install chart packages: the modern chart is hand-drawn with `react-native-svg`.

## 5. Device acceptance checklist

- Open Overview, Board, Timeline, Tasks, and Task Sheet from a freshly started Expo Go session.
- Verify board/list creation, list drag ordering, card drag across lists, scroll during drag and persistence after force-close/reopen.
- Verify timeline date navigation, Days/Weeks/Months zoom, drag task, resize handles, dependency linking/deletion, large projects, undated tasks and 56-day page boundaries.
- Verify task sheet labels/current values, expanded inline editors, keyboard and safe-area spacing, comments, acceptance evidence, attachments and verification records.
- Verify both light/dark themes, orientation changes and narrow phone widths against the supplied `MockDesign.zip`.
- Test Web separately: no regressions to original drag/drop behaviors or sidebar spacing.

## 6. Handoff and rollback

- **Accepted baseline until device acceptance:** v0.4.1 (stable logic) and v0.4.2 (original mock integration). Keep ZIP backups and previous Git commit.
- **Do not push to main until device acceptance.** If Expo Go still exits, send full red-screen or Android logcat; a standalone SafeAreaView warning is not a crash stack.
- **No Git commit or hosting deployment performed.**

---

## v0.4.4



# CHG-NP-0.4.4 — Android/iOS Gesture + Timeline Render Hotfix

## 0. Read first — release handoff

| Field | Value |
|---|---|
| Application | Milvayo (independent local-first PM app) |
| Previous source baseline | v0.4.3-NATIVE-MOTION-QA |
| New candidate | v0.4.4-ANDROID-GESTURE-HOTFIX |
| Release status | **QA candidate — Android and iOS runtime not yet verified** |
| Date | 2026-10-31 |
| Source delivery | `Milvayo-v0.4.4-ANDROID-GESTURE-HOTFIX.zip` (project contents at ZIP root) |
| Checks | 339/339 Node source/domain tests passed |
| Expo Go Android | **Not run**; user must validate on device |
| Expo Go iOS | **Not run** |
| Expo Web | **Not run**; unchanged web gesture implementation |
| npm dependency installation | **Not verified** in this environment; npm registry lookup returned EAI_AGAIN |
| Data migration | None. Same local workspace/persistence implementation |

## 1. Reproduced errors from user report

**A. Timeline render exception**

- User saw `ReferenceError: Property 'Platform' doesn't exist`, sourced from `src/screens/Timeline.js` line 214 in `TaskBar`.
- Confirmed: `Platform.OS` occurred multiple times but `Platform` was missing from the `react-native` imports.
- Fix: import `Platform` explicitly. No timeline layout dimensions changed.

**B. Kanban/Timeline Worklets warning**

- User saw `[Worklets] Cannot copy value of type WorkletEventHandler` in a `useAnimatedStyle` closure through `gestureSurface.native.js`.
- Confirmed: native `GestureArea` and `DragMotion` referenced `drag.x.value` and `drag.y.value` **inside** their Reanimated worklets. `drag` also contained the RNGH 3 composed gesture object and event handler, which Reanimated tried to transfer into the UI worklet.
- Fix: destructure/capture only `translateX` and `translateY` shared values outside the worklet and reference their `.value` fields inside; pass `gesture` only to the virtual detector, not into the animated style.
- Worklet-based motion and RNGH 3 virtual detectors remain in place. No JavaScript frame-by-frame animation was added.

## 2. Changed files

- `src/screens/Timeline.js` — add missing React Native `Platform` import.
- `src/gestureSurface.native.js` — isolate the shareable values from the full gesture controller in both native wrappers; preserve all style/layout props and gesture handling.
- `tests/native-worklets-hotfix.test.cjs` — new source-level regression checks.
- `package.json`, `app.json` — bump application version to `0.4.4`.
- `docs/CHG-NP-0.4.4.md`, `NP-QA-0.4.4.md` — release handoff and acceptance checklist.

**Packaging caveat:** the v0.4.3 ZIP contained a *v0.4.2* `package-lock.json` with no direct Reanimated/Worklets/Gesture Handler dependencies. npm registry was unavailable here, so the inconsistent lockfile is **excluded**, not fabricated. Run `rm -f package-lock.json && npm install` on the Termux device to generate a valid lock for v0.4.4. Keep the regenerated lockfile once installation succeeds.

## 3. Explicit non-changes

- No changes to board width (`290/272`), column gap (`12`), card padding, task-sheet inline dropdown layout, timeline row (`54`), bar height (`26`), or 56-day viewport.
- No changes to the React Native Web drag implementation.
- No changes to persistent project schema, IDs, relationships, migration logic, scheduling validators, task actions, or import/export.
- No new dependencies compared with v0.4.3.
- No native modules recompiled, app binaries built, Git operations performed, or remote deployments.

## 4. Validation performed

- `npm test`: **339 passed, 0 failed**.
- Included tests confirming `Platform` import and no capture of the whole `drag` object in Reanimated animated styles.
- ZIP filesystem validation: full source package integrity check.
- Native Android/iOS UI interactions and the presence/absence of the Worklets warning **remain unverified** until device testing.

## 5. Exact Termux steps

Back up any uncommitted local source changes and the current workspace data before extraction.

```bash
cd ~/Milvayo
unzip -o ~/storage/downloads/Milvayo-v0.4.4-ANDROID-GESTURE-HOTFIX.zip -d .
rm -f package-lock.json
npm install
npx expo install --check
npm test
npx expo start --clear
```

Do **not** use `npm ci` until `npm install` has regenerated the lockfile from the updated manifest.

## 6. Acceptance gate / next model

Follow `NP-QA-0.4.4.md`. Validate Android Expo Go: Kanban loads, tap opens task, drag card/list, Timeline opens without exception, move/resize/link remains functional, navigation back/forward, no repeat Worklet warnings. Check web independently. Record any new stack trace, Expo package versions, device app state and resulting persisted task dates. **Do not promote v0.4.4 to main** until native acceptance passes.

---

## v0.4.5



# CHG-NP-0.4.5 — Mock Kanban drag restoration (QA candidate)

## 0. Read first — authoritative handoff

| Field | Observed status |
|---|---|
| Application | Milvayo; independent local-first PM app |
| Previous source baseline | v0.4.4-ANDROID-GESTURE-HOTFIX |
| New release candidate | v0.4.5-MOCK-BOARD-DRAG-RESTORED |
| Release status | QA candidate, **not accepted on Android** |
| Reported issues | Board snaps/appears to reload on entry; touch-scroll over cards starts an unintended drag; card loses finger during scrolling; Timeline now opens |
| Source-level tests | **343 passed, 0 failed** |
| JS/JSX parse check | All `src` JavaScript/JSX/CJS parsed successfully using TypeScript parser |
| Actual Android Expo Go UI | **Not run in this environment** |
| iOS & Expo Web UI | **Not run** |
| Persistent format | Unchanged; existing workspace remains in AsyncStorage |
| Dependencies | No new packages from v0.4.4; still Reanimated 4 / Worklets / RNGH 3 for Timeline |

## 1. Root cause and restoration decision

In v0.4.3/0.4.4 Kanban was altered from the supplied **MockDesign.zip**: `Board.js` switched from the mock's `PanResponder`-gated hold to RNGH 3 `useCompetingGestures` inside nested React Native ScrollViews; the card/list renderers also moved to `VirtualGestureDetector` wrappers and list cards were capped to 24 at once. The user reports that this blocks vertical/horizontal scrolling, starts unintended drags, loses finger offset and may cause a snap on the first Board open. Gesture Handler 3.3.0 also has a documented Android detector-vs-native-ScrollView cancellation issue (software-mansion/react-native-gesture-handler #4581, closed after subsequent fixes). That issue is consistent with the user's report but **not proof of the whole screen snap cause**.

The safer integration is to restore the **original supplied mock's board drag recognizer and screen structure** instead of attempting another uncertain native gesture rewrite. Timeline's currently working gesture screen was not changed.

## 2. Implementation details

- `src/screens/Board.js` — restored from `MockDesign.zip`. Retains original 290/272 px columns, 12 px column gap, 10 px list/card rhythms, measured-card placement, insertion indicators, tap/double-tap editing, all-list rendering, edge auto-scroll and scroll locks only after lifting. Replaced the original view's animation implementation with `BoardMotion` but **did not add layout wrappers** or change existing store actions (`placeTask`, `moveListTo`, `addTask`, etc.). The v0.4.4 card pagination limiter was removed to match the mock; test large boards for memory/performance.
- `src/boardGesture.native.js` — restores the mock's `PanResponder` hold policy: 350ms stationary long press, 8px pre-lift movement cancel, pointer-relative motion, 30ms scroll compensation during auto-scroll, title double-tap and drop. This is the **intentional, documented compromise**: the touch recognition and drop-target calculations run on the JS thread to recover observed working behavior; the native transform animations render through Reanimated shared values. Do not describe this as fully UI-thread-only gesture recognition.
- `src/boardGesture.web.js` — delegates unchanged to the existing original mock web responder/document listeners (`src/gesture.js`).
- `src/boardMotion.native.js` — Reanimated animated view with UI-thread transforms and `withTiming` list-shift animation. Does not embed RNGH detectors or introduce card hierarchy wrappers.
- `src/boardMotion.web.js` — preserves mock `Animated.ValueXY` layout/motion on web; no new web animation redesign.
- `src/boardDragMath.cjs` — scroll-aware finger-content coordinate calculation and pre-lift cancellation for native.
- `src/screens/Timeline.js`, `src/gesture.native.js`, `src/gestureSurface.native.js` — **unchanged** from v0.4.4; Timeline presently renders on the user's device.
- `tests/board-gesture-restoration.test.cjs` — new math and source-contract tests for scrolling vs hold, auto-scroll finger offset, persistence hooks and Timeline isolation.
- `tests/native-animation-contract.test.cjs` — adjusts prior expectation that Board must use `DragMotion`; tests original geometry and new adapter instead.
- `package.json`, `app.json` — release version 0.4.5 only. No dependency change.

## 3. Regression validation (observed)

- `npm test`: **343/343 pass** (original 339 + 4 new restoration tests).
- TypeScript parser: 0 syntax errors across all `src/**/*.js` and `.cjs`.
- Archive: ZIP integrity verified.
- **Not performed:** Expo Go Android/iOS runtime launch, Metro bundle, actual physical touch/scroll, FPS/memory measurements, Web runtime acceptance. Installation of dependencies not verified in this container.

## 4. Data safety and rollout

No Firestore configuration, Firebase integration, storage key, import/export format, business/domain code, task ID, scheduling rule, dependency policy or task-sheet inline dropdown was changed. In-progress local data should remain compatible, but **export a workspace backup and retain the v0.4.4 ZIP** before replacing your working source. Do not merge to `main` until device acceptance passes.

### Termux

```bash
cd ~/Milvayo
# On the work branch with a clean/recoverable source checkpoint:
unzip -o ~/storage/downloads/Milvayo-v0.4.5-MOCK-BOARD-DRAG-RESTORED.zip -d .
# No new packages are required if v0.4.4 dependencies already installed.
npm install
npm test
npx expo start --clear
```

## 5. Android acceptance priority

1. Launch Board repeatedly, switch tabs away/back. No snap, red screen or spontaneous reload.
2. Begin vertical scrolling from the middle of a card without pausing. Should scroll the page, not lift a card.
3. Begin horizontal scrolling from the middle of a card without pausing. Should scroll the columns, not lift a card.
4. Hold a card in place ~350ms then move: it should stay under the fingertip and update insertion line. Hold list **header** to reorder columns.
5. While dragging, move near left/right edge to auto-scroll; dragged card must maintain pointer-relative position as the strip moves. Test up/down at page edges too.
6. Drop between lists and within same list: check ordering and status survive switching screens and reloading.
7. Single-tap task to open sheet; title double-tap edits, no accidental open after scrolling.
8. Open Timeline: verify it still renders and move/resize/link remain usable.
9. Web/iOS acceptance remains needed independently. If Board still snaps, capture full Metro log **and** Android logcat rather than attributing it to animation without evidence.

**Do not claim the reported runtime defects are fixed until Android device QA confirms.**

---

## v0.4.6



# CHG-NP-0.4.6 — MockDesign Kanban interaction recovery

## 0. READ FIRST — handoff

| Field | Observed status |
|---|---|
| Application | Milvayo (independent project-management app) |
| Baseline | Full v0.4.5-MOCK-BOARD-DRAG-RESTORED source |
| Candidate | v0.4.6-MOCK-KANBAN-INTERACTIONS |
| Status | **QA candidate; not accepted on device** |
| User request | Restore every original mock task/list interaction, especially tap task to open sheet, double-tap title to edit, long-press drag, and any missing mock controls |
| Source-level regression tests | **349 passed / 0 failed** (343 prior + 6 new) |
| JavaScript/JSX | TypeScript transpile syntax checks for touched JSX/native JS: **0 errors**; see validation section |
| Android Expo Go / iOS / Expo Web interactive acceptance | **Not run here** |
| Persistence | Existing AsyncStorage workspace key and schema unchanged |
| Dependencies | No additional native or npm dependencies from v0.4.5 |
| Timeline | **Unchanged** from working v0.4.5 baseline |
| Deployment and git | No push, merge, APK build or deployment |

## 1. Original mock behavior inventory and wiring

| Original MockDesign action | Code path / current status |
|---|---|
| Single tap on a task card | `Board.js` `TaskCard` → `openTask(t.id)` → `ModernApp` `TaskSheet`, same task ID |
| Double tap task **title** | `TaskCard` → `beginTitleEdit` → inline `Input`, commit on submit/blur |
| Stationary hold on card, then drag | `boardGesture.native.js` 350 ms hold, 8 px pre-hold swipe cancellation, `BoardMotion.native.js` UI-thread shared transform |
| Move card within a lane or to another lane | measured insertion indicator → existing `placeTask` bridge, preserving canonical IDs and validation |
| Scroll from task, before the hold | movement cancels pending lift; original mock PanResponder logic retained |
| Scroll while dragging near edges | original mock X/Y scroll compensation and edge auto-scroll retained |
| Double tap list title | `ListColumn` → inline name editor with commit on submit/blur |
| Hold list header | reorders list through existing `moveListTo` bridge |
| Tap board chip / hold or double-tap board chip | select board / open board manager |
| New board, new list, and add card | original mock buttons/sheets/input and canonical store wired; unsuccessful create leaves form intact |
| Rename board, archive/restore/delete board | board manager; Main stays protected; renames staged until commit |
| Confirm list deletion | original confirmation, now counts all cards in the lane (including filtered-out cards); existing bridge moves cards safely |
| Title/priority/labels/owner/due/progress visuals | original mock card composition, spacing and colors unchanged |
| Card filters | original text/priority filters retained |

## 2. Repairs and why they matter

1. `src/boardGesture.native.js`: native task title hit-testing uses **both X and Y** instead of just Y, checks measured bounds and uses `tapSerial` to reject out-of-date measurement callbacks. Clearing the delayed single-title tap when another touch starts prevents a sheet from opening underneath an in-progress hold or scroll. A true double title tap enters editing. Unexpected native responder cancellation releases the drag without persisting a drop.
2. `src/screens/Board.js`: title hit views now set `collapsable={false}` so React Native Fabric keeps a native measured view for hit testing. The layout, margins, card dimensions and list geometry are not changed.
3. `src/screens/Board.js`: task, list and board renaming use a **local input draft** and call the persistent store only once on submit/blur. This avoids normalized/trimmed writes on each character, allows internal spaces, rejects invalid blanks/overlong titles without corrupting existing data, and prevents duplicate submit+blur commits. Main board name is noneditable as required by the model.
4. `src/screens/Board.js`: task creation clears the draft only on success; new list and new board forms remain open when the canonical store declines the action. List-deletion confirmation counts hidden tasks too.
5. `src/boardInteractions.cjs`: small pure helpers for native title rectangle hit testing, double-tap timing and safe name commit. No changes to persisted schema.
6. `src/boardMotion.native.js` and `src/boardMotion.web.js` **unchanged**; native transforms still use Reanimated. Web continues using the **original mock** responder via `boardGesture.web.js` and `gesture.js`.
7. `src/screens/TaskSheet.js`, `ModernApp.js`, `src/modernBridge.cjs`, local storage, timeline and domain validation **unchanged**.

## 3. Verification and limits

- `npm test`: **349/349 pass** (6 interaction math, source wiring and canonical workspace checks added).
- TypeScript transpile parser: zero diagnostics on edited JSX/native JS and app navigation source. Full `src` syntax checked separately for package QA.
- ZIP integrity: checked after packaging.
- **Not run:** actual Android/iOS gesture timing, ScrollView arbitration, hardware FPS/memory tests, native UI confirmation, fresh Metro bundling, APK build and Web browser tests. The reported first-open board snap has **not** been reproduced or proven resolved; if present, collect Metro and native crash logs.
- Gesture recognizer for Kanban still uses the mock's PanResponder on the JS thread, with Reanimated UI-thread **visual** transforms (not a fully worklet-native gesture pipeline). This is intentional to recover the user's confirmed working mock behavior.

## 4. Data safety and install

Before replacing v0.4.5, export a project/workspace backup and keep the previous source checkpoint on the `work` branch. The ZIP is a **full project-root archive**, no outer folder and no `node_modules`/`package-lock.json`.

```bash
cd ~/Milvayo
unzip -o ~/storage/downloads/Milvayo-v0.4.6-MOCK-KANBAN-INTERACTIONS.zip -d .
# Existing v0.4.5 dependencies are enough; install only if missing.
npm install
npm test
npx expo start --clear
```

Do not merge to `main` until the attached `NP-QA-0.4.6.md` checks pass on Expo Go.

## 5. Next model instructions

- Treat v0.4.6 as the source candidate, not a confirmed Android runtime fix.
- Do not replace the original mock margins/card structure or change Timeline while testing Board interactions.
- Diagnose any remaining tap/snap/scroll issue with the actual Android error; avoid speculative animation or dependency rewrites.
- Preserve Milvayo separate from RIVNA and Niyarvo Control Center. Preserve canonical model, project imports and task identity/history.

---

## v0.4.7



# CHG-NP-0.4.7 — Sprint management, Board scroll arbitration, navigation performance

## 0. READ FIRST — handoff

| Field | Value |
|---|---|
| Application | Milvayo — independent PM app |
| Baseline | `Milvayo-v0.4.6-MOCK-KANBAN-INTERACTIONS.zip` |
| Candidate | `Milvayo-v0.4.7-SPRINT-KANBAN-NAV-QA.zip` |
| Status | QA candidate; Android Expo Go, iOS and browser runtime tests **not performed** |
| Workspace / schema | Existing `milvayo-v1` AsyncStorage workspace and canonical v0.4.1 model **unchanged** |
| Tests | 353/353 source tests passed, including 4 new tests; 0 source syntax diagnostics (see verification) |
| Dependencies | No added packages; Expo SDK 58 / existing Reanimated and Gesture Handler retained |
| Timeline | No changes to `src/screens/Timeline.js` or its gesture logic; previously reported to render successfully |
| Deploy/commit | Not done |

## 1. Fixed Sprint presentation and restored original domain lifecycle

- The generic `Stat` block forced the full sprint goal to a bold, 30-point statistic. The goal now lives in a separate, restrained description with a small section label, regular 14-point body type and 22-point line height. Completion and velocity remain statistics.
- New Sprint action opens a compact form for name, goal, start and end. Planned sprints can be selected and edited. All form changes are committed once on save, not per keystroke.
- Added `createSprint`, `updateSprint`, `deleteSprint`, `assignSprintTask`, and explicit-ID `startSprint` / `finishSprint` to the modern store. All call existing `model.agile` domain operations through the canonical project transaction and persistence path. The legacy SprintPanel remains available in Advanced workspace.
- Added `updatePlannedSprint` to the original `src/agile.cjs`; only planned sprint name, goal and dates may be changed. Sprint identity, state, assignments and progress history are preserved. Active/completed sprint edits are rejected.
- Planned sprint deletion requires confirmation and unassigns tasks as in the legacy model. Starting a sprint is blocked when another is active. Finishing requires confirmation and retains historical scope; unfinished tasks return to backlog without changing their status.
- Task assignment, removal, backlog search, scope pagination, completed-sprint final task IDs and recorded burndown are accessible in the modern Sprint view. Completed scope is explicitly read-only and displays current titles without pretending they're historical task status snapshots.

## 2. Board scroll versus hold arbitration

- Root cause of blocked swipes in source: both the card `PanResponder` and the nested `ScrollView` competed to own touch input; the ScrollViews had `disableScrollViewPanResponder` enabled on Android. React Native explicitly cautions against this for ordinary scrolling.
- `src/boardGesture.native.js` now *observes* touch start/move/end without taking responder ownership. It only claims subsequent move events after a stationary 350-ms hold. Crossing the mock's 8-pixel threshold cancels the hold and lets the native scroll views process ordinary vertical and horizontal swipes. Native scrolling also cancels all pending holds.
- `src/screens/Board.js` enables Android `nestedScrollEnabled` and retains the mock's column widths, padding, visual cards, edge auto-scroll, finger/scroll offset math and canonical drop actions. Native Reanimated still owns visual transforms; the gesture decision remains JS-driven to preserve mock behavior.
- The web mock's drag system and stylesheet are not changed. No other screens' drag logic was modified.
- **Limitation:** Native responder arbitration, scroll momentum, finger offset accuracy and rendering smoothness require Android/iOS manual tests. Source tests cannot prove exact touch feel.

## 3. Navigation performance mitigation

- `ModernApp.js` now keeps primary tabs (Overview, Board, Timeline, Tasks and Sprints) mounted **after their first visit** and hides inactive screens without destroying/recreating their gesture/SVG trees. Startup only mounts Overview; other screens remain lazy until visited.
- Previously selected scroll/gesture state should persist across tab switches, reducing repeated setup costs. This is not proof of a particular FPS or sub-second switch time.
- **Tradeoff:** retaining visited screens increases memory use. Test repeated switching and Android memory stability. If memory pressure appears, selectively disable caching for Timeline while retaining the Board optimization; do not clear app data.

## 4. Verification performed

- `node --test tests/*.test.cjs`: **353 passed, 0 failed**. Includes tests for existing canonical agile lifecycle, planned-sprint editing validation, current UI/domain bindings, scroll ownership, and tab caching.
- TypeScript syntax parser: zero diagnostics in touched files and full JSX/JS pass (see QA checklist).
- Archive contains project-root content, not an enclosing folder; `node_modules` and stale lockfiles are not included.
- **Not verified:** Expo Go startup, touch gestures/scroll, actual navigation latency, native frame times, iOS behavior, APK builds, Web rendering, persistence after relaunch and visual comparison on device.

## 5. Termux install and acceptance

1. Export a complete workspace backup from the last working release; commit the current `work` checkpoint and keep v0.4.6 ZIP.
2. Extract the delivered ZIP at `~/Milvayo` (not inside a nested folder).
3. Run `npm install` only if dependencies are absent or outdated, then `npm test` and `npx expo start --clear`.
4. Verify horizontal and vertical swipes from on top of task cards first. Then stationary long-press card and list dragging, task sheet taps and title double taps, edge auto-scroll, persistence after relaunch and previously working Timeline.
5. Create/edit/start/finish/delete planned sprints with real task assignments, including a completion after halfway progress and project reload.
6. Compare Sprint goal typography with the user's screenshot and test repeated tab switching for both latency and memory.

**Do not merge to `main` until real-device acceptance passes.** Preserve canonical project imports, task IDs, schema, activity history and independent Milvayo separation from RIVNA / Control Center.

---

## v0.4.8



# CHG-NP-0.4.8 — Timeline Controls, Sprint Crash, Screen Diagnostics

**Date:** 2026-10-31
**Status:** SOURCE QA CANDIDATE — Android/Expo Go runtime acceptance NOT VERIFIED
**Baseline:** Milvayo v0.4.7 Sprint/Kanban/Nav QA
**Deliverable:** Milvayo-v0.4.8-TIMELINE-DIAGNOSTICS-QA.zip
**Commit:** Not committed; no Git branch merge or deployment performed.

## Read first (handoff)

1. **Confirmed user error repaired:** Sprint `src/screens/Delivery.js` invoked `useState()` without importing it. The import is now present. No dependency change was needed for this specific exception.
2. **Timeline controls:** Removed date Previous/Next buttons and the row Previous/Next pager. Zoom (Days/Weeks/Months) and Today are together in header actions; Items lives on the chart's upper-right. All scheduled items belong to the same vertical timeline, with near-viewport rendering to avoid mounting all bars/gestures at once. The date range now covers every scheduled task rather than discarding those outside 56 days. `src/timelineDisplay.cjs` contains pure range, tick and paint helpers. The chart still scrolls horizontally, and vertically through the page.
3. **Screen failure visibility:** `ModernApp.js` wraps individual screens in `ScreenErrorBoundary`. JavaScript rendering failures show a retry button and a Settings diagnostic link instead of being treated as successful navigation. Android native process crashes cannot be intercepted by a React boundary.
4. **Native resource discipline:** Unlike v0.4.7's broad tab caching, heavy Board and Timeline screens are not retained while inactive on Android/iOS; lighter tabs remain cached. This reduces the concurrent number of SVG views and gesture handlers; the observed Board/Timeline snap was NOT reproduced or proven fixed in the container.
5. **Settings > Diagnostics:** New local-only RIVNA-style crash and performance inspectors (`src/diagnostics/*`). Captures redacted JS exceptions and component stacks, recent navigation steps, tab-open counts, React Profiler render times, slow transitions, JS timer delays, and console warning/error counts. Users can copy reports and clear local diagnostic storage. Stores bounded records in device AsyncStorage; does not send reports to a server, attach task content or log credentials intentionally.

## Additional package

- `expo-clipboard` `~58.0.4` added to `package.json` for the **Copy report** action (Expo SDK 58).
- Existing dependencies unchanged. Run `npm install` after extracting.
- App/package version updated to `0.4.8`.

## Performance implementation details

- Screens are timed from navigation selection through two `requestAnimationFrame` callbacks, then logged if >=180 ms. This is a JS-side approximation; not a verified fully painted frame.
- React Profiler aggregates JS render durations per screen without re-rendering the app on each event. Slow render records are >100 ms.
- A 1-second diagnostic timer records active-state delays >400 ms (excluding delays >=30 seconds). Timer delays are *suspected* stalls, not proven device freezes or ANRs.
- Event/slow/error history is bounded (90/60/12). Asynchronous local persistence; no network traffic.
- Session records indicate only whether the last run lacks a recorded clean exit. An unclean exit is **not** evidence of a native crash.
- Global JS ErrorUtils wrapping retains the original handler. React screen error boundaries retain the Expo error presentation in the console. Fast Refresh cleans up listeners/handlers.
- Reports redact common tokens, secrets, emails, URLs, and application-private paths. Developers should still review reports before sharing because exception messages can contain unintended context.

## Files changed/new

- `ModernApp.js` — tab lifecycle, ScreenErrorBoundary, navigation/Profiler monitoring.
- `src/screens/Timeline.js`, `src/timelineDisplay.cjs` — single virtualized timeline and controls.
- `src/screens/Delivery.js` — missing React hook import.
- `src/screens/Workspace.js` — Diagnostics under Settings.
- `src/diagnostics/core.cjs` — bounded data model, formatting and redaction.
- `src/diagnostics/monitor.js` — session, JS exceptions, AppState, navigation and render measurement, persistence.
- `src/diagnostics/DiagnosticsPanel.js` — report inspector, copy and clear.
- `tests/diagnostics-048.test.cjs` — crash/format/redaction/integration tests.
- `tests/sprints-navigation-047.test.cjs` — updated caching assertion for native heavy-screen isolation.
- `package.json`, `app.json` — version and clipboard package.

## Verification evidence

- `node --test tests/*.test.cjs` — **359 passed / 0 failed**, run in source environment on 2026-10-31.
- `node --check src/diagnostics/core.cjs` — passed.
- Expo dependency install / Metro bundle / Expo Go on Android / iOS / Web — **Not run here**. Native lag, Board snap-back, Timeline snap-back and gesture feel **not verified resolved**.
- No manual device FPS, ANR, memory or Crashlytics metrics available. Diagnostics must not be represented as native-crash reporting.

## Device QA (blocking)

1. `npm install`; `npx expo install --check`; `npm test`; `npx expo start --clear`.
2. Open Overview -> Board -> Timeline -> Sprints; verify none returns to Overview automatically. If a JS render error appears, open Settings diagnostics and copy Crash report.
3. On Timeline verify no Previous/Next controls, all dated task rows accessible by vertical scrolling, Items top-right, Today adjacent to zoom. Test task open, drag, resize, dependencies.
4. On Board test horizontal and vertical scrolling, tap, double tap title and stationary-hold drag. If it snaps back/restarts, capture Crash report plus Metro console (native process deaths may leave no JS error).
5. Settings -> Diagnostics: inspect and copy both reports; force a known *development-only* render error if practical; clear and confirm local data resets. Do not paste actual secrets into logs.
6. Repeatedly switch tabs and compare monitor navigation duration on first vs second opening. Check whether monitoring itself causes lag.

**Do not merge to main until Android device acceptance passes.**

---

## v0.4.9



# CHG-NP-0.4.9 — Timeline native-surface stabilization / Expo config

## 0. Read first — release handoff

| Field | Value |
|---|---|
| Product | Milvayo (independent from RIVNA) |
| Baseline | v0.4.8-TIMELINE-DIAGNOSTICS-QA |
| Candidate | v0.4.9-TIMELINE-VIEWPORT-HOTFIX |
| Status | SOURCE QA candidate; NOT Android/iOS runtime-verified |
| Data schema / persistence | Unchanged; no migration |
| Dependency manifest | **OMITTED** from the ZIP per user instruction |
| Package lock | **OMITTED**; local installation unchanged |
| Added npm dependencies | None |
| Changes in scope | Timeline horizontal drawing and gesture surfaces, Expo config, diagnostics version and tests |
| Explicitly unchanged | Board interactions, task model, sprint logic, project/backup data, layout spacing, other screens |

## 1. Device evidence received

- Android Expo Go, Milvayo v0.4.8, OS 35.
- Screen **Timeline** opened at `19:45:44.680Z`, followed by new run at `19:45:57.914Z`; Timeline opened again at `19:47:15.908Z`, followed by new run at `19:47:27.720Z`.
- **Zero captured JavaScript exceptions**; diagnostics explicitly cannot prove native OOM, ANR, or process crash from an unclean exit alone.
- Timeline initial React render measured `436 ms` and later `301 ms`; Board rendering `831 ms`, a JS stall `670 ms`, and Board navigation `2083 ms` in one run. Board performance is documented but **not fixed in this batch**.
- `expo-doctor`: config schema rejected root `expo.splash`. `expo-font` peer missing on user's device at the time of log; user subsequently fixed it locally and requires that future source ZIPs not overwrite `package.json`.

## 2. Findings and reasoning

Timeline v0.4.8 rendered a horizontal dependency SVG with **width equal to the entire date canvas (`gridW`)**, despite rendering only nearby vertical rows. The empty-area responder also had dimensions `gridW × gridH` and claimed every touch, including potential native horizontal scroll gestures. An SVG surface across many dates and a full-size responder can cause avoidable memory/renderer pressure on Android. This is a **concrete code defect**, but the available JS report does **not** establish the native termination's root cause. Expo Go device testing is required.

The task list itself has **not** been paginated. Only mounted native drawing surfaces/gestures are limited to the viewport; scrolling continues through every scheduled task in one chart. All scheduling dates, dependencies, ordering and stored data are preserved.

## 3. Exact code changes

- `src/screens/Timeline.js`
  - Draw dependency curves on a viewport-cropped SVG (`paintWidth × paintH`), translated back to global chart coordinates. Never mount full-date-width SVG.
  - Replace full-chart hit responder with viewport-local Pressable; native scroll views retain normal swipe ownership.
  - Clip long task bars at horizontal paint bounds without modifying start/due dates; mount gesture recognizers only for bars in the visible horizontal region.
  - Bound vertical rule widths and header day labels to horizontal paint window.
  - Cache task scheduling selector and dependency path routing; cache task extents during path lane search.
  - Rebase horizontal paint at controlled scroll intervals, not every scroll frame; page vertical painting remains viewport-based and single-scroll.
  - Keep current Days/Weeks/Months + Today and chart-corner Items; **no Previous/Next and no row page controls**.
  - Record aggregate chart canvas, viewport and task count in local diagnostics for future native-crash triage; no task titles/content logged.
- `src/timelineViewport.cjs` — new deterministic 2D viewport geometry helpers.
- `app.json` — remove SDK 58-invalid root `expo.splash` object; retain backgroundColor and icons. Legacy splash customization now requires optional SDK 58 `expo-splash-screen` config plugin *if installed*, deliberately not added here because user controls manifest. In Expo Go, the icon is used for the startup screen.
- `src/diagnostics/monitor.js` — set diagnostic report version to `0.4.9`.
- `tests/timeline-stability-049.test.cjs` — new geometry, no-pagination, full-date-range, and config checks.

## 4. QA evidence

| Verification | Result |
|---|---|
| Node source unit/regression suite | **PASS — 364/364** |
| TypeScript parser check, source/app JS + JSX | **PASS — 0 parser diagnostics across 42 checked files** |
| `node --check` for new CJS helper | **PASS** |
| User-provided crash/perf report evaluated | **PASS — source of evidence documented above** |
| `npx expo-doctor` on local project | **NOT RUN** — no usable install in this container; user to run in Termux |
| Expo Go Android | **NOT RUN** — cannot confirm native crash resolved |
| iOS physical device | **NOT RUN** |
| Expo Web Metro | **NOT RUN** |
| Memory/FPS/ANR profile | **NOT RUN** |

## 5. Installation / rollback

1. Commit or back up local v0.4.8 source. Keep installed `node_modules`, fixed `package.json` and `package-lock.json`.
2. Extract v0.4.9 ZIP at project root. **The archive contains neither `package.json` nor `package-lock.json`**.
3. `npm test && npx expo-doctor && npx expo start --clear`.
4. In Expo Go: visit Timeline twice, leave it open ≥30 seconds each time, scroll vertically through every task, pan horizontally Days/Weeks/Months, press Today and tap Items. Test bar move/resize/link and task-sheet open. Copy diagnostics. Repeat switching Timeline ↔ Overview ↔ Board, and measure.
5. If Timeline still causes Expo Go to restart, capture Android native crash/ANR/OOM logs if accessible (Android Studio or wireless adb logcat); JS-only diagnostics cannot resolve the native cause.
6. Rollback by re-extracting v0.4.8 source **selectively**, avoiding overwrite of local `package.json`, or by restoring the prior Git work checkpoint. Data schema is unchanged.

## 6. Known risks

- Missing Expo Go device-level crash evidence. Native memory pressure is a plausible cause, not yet proven.
- Links with an endpoint beyond the vertically painted area are not painted until both endpoints are nearby; the underlying dependency data remains intact. This view-only optimization is explicit.
- Touch/gesture coordination during auto-scroll needs Android acceptance; no redesign of Timeline drag semantics in this batch.
- Board navigation delay observed in report (up to 2.08s) needs separate profiling. Do not interpret this release as fixing Board lag.
- `expo-font` remains user's local manifest change. No dependency manifest, install or repair action was bundled.

---

## v0.5.0



# Milvayo — v0.5.0 Timeline SVG & Touch QA

## Read first

| Field | Value |
|---|---|
| Baseline | v0.4.9 TIMELINE-VIEWPORT-HOTFIX |
| Scope | Timeline viewport SVG coordinate restoration; dependency visibility; Android/iOS touch-responder stability |
| Status | **QA candidate — device verification pending** |
| Data schema | No change |
| Dependencies | No change; preserve user's locally corrected `package.json` and `package-lock.json` |
| Runtime tests | **Not run** (no Expo Go/iOS device available) |

## Reported / observed

- On Android 15 / API 35, Expo Doctor was green and v0.4.9 Timeline stopped terminating Expo Go.
- Scheduled tasks were detected, but SVG dependency graphics were invisible. Report: 66 scheduled tasks, 2,958 px canvas, 350 px viewport, 12 initial bars. Diagnostic report also recorded 45 Timeline renders and an 897 ms JS timer delay. These are observations, **not** confirmation of a rendering root cause.
- Metro warned `Cannot record touch end without a touch start` with touch identifier 3. This signals React Native's responder touch-history mismatch, not a proven native crash. It may be triggered by nested ScrollViews, changing gesture ownership, or multi-touch; the report alone cannot isolate the exact handler.

## Changes

1. `src/screens/Timeline.js` and `src/timelineViewport.cjs`: render dependency geometry in a small SVG whose `viewBox` uses the chart's absolute pixel coordinates; no large SVG or negatively translated `<G>` layer.
2. Draw dependency paths crossing the visible vertical rows even when one endpoint is outside those rows; after the path is routed, cull horizontally by the path's **actual points** rather than only its endpoints. Task/dependency data is unchanged.
3. Preserve the full continuously scrollable scheduled task list, including windowed render of nearby task bars. No task/row pagination and no `Previous rows`/`Next rows` controls.
4. On Android/iOS, avoid switching native `ScrollView.scrollEnabled` while a touch is in progress; web retains its existing post-lift scroll lock. The active task is kept in the candidate rendering set while the window rebases.
5. Do not create the blank-chart Pressable unless there are selectable dependency paths, reducing unnecessary native responder competition.
6. Add a one-time local diagnostics event describing SVG viewport size and visible dependency count once valid geometry is measured. No task names or IDs are logged.
7. Set app config/diagnostics version to `0.5.0` (package manifests deliberately excluded).

## Verification

- Source regression suite: **371 passed / 371 total**, 0 failed (Node test runner).
- TypeScript JSX syntax parser: **40 app/source JS and JSX files parsed**, 0 errors.
- ZIP archive root / integrity: checked.
- Expo Doctor: **Not run here**; user reported green for v0.4.9.
- Expo Go Android / iOS / Web visual checks: **Not run**.
- Native-touch warning eliminated: **Not verified**.
- SVG visually restored: **Not verified**.
- Performance improvement: **Not measured on device**.

## Known limitations / follow-up

- Native Gesture Handler 3.3.0 under nested React Native ScrollViews can still cause touch arbitration differences on Android. Do not suppress warnings silently. Record the triggering interaction and inspect the Metro log if the warning repeats.
- Board navigation is separately slow (~1.4–1.6 seconds in latest user report) and is **not patched** in this release.
- The dependency paths will only appear if the source tasks actually have `dependsOn` relationships in a visible date region. A task bar itself is drawn using React Native Views, not SVG.
- A large or exceptional dataset may require further profiling. Do not infer fixes to memory, FPS or native crashes from source tests.

## Install / rollback

1. Preserve a copy of your v0.4.9 source and your own local `package.json` / lockfile.
2. Extract the archive into `~/Milvayo` with `unzip -o`.
3. Run `npm test`, `npx expo-doctor`, and `npx expo start --clear` in Termux.
4. Verify on Android: Today marker, bar rendering, links including long links, horizontal/vertical scroll, normal tapping, resizing, long-press movement, and repeated tab opening without touch warnings.
5. If tests fail, restore the v0.4.9 files. No data/schema migration is required.

## Packaging

`Milvayo-v0.5.0-TIMELINE-SVG-TOUCH-QA.zip` is project-root layout (no enclosing directory). It **does not include** `package.json`, `package-lock.json` or `node_modules`, by user request.

---

## v0.5.1



# CHG-NP-0.5.1 — One modern app, legacy business-domain parity

**Project:** Milvayo (not RIVNA, not Niyarvo Control Center)
**Baseline:** `Milvayo-v0.5.0-TIMELINE-SVG-TOUCH-QA.zip`; legacy reference `v0.4.1-FINAL`
**Release type:** Source-level QA candidate, *not Android/iOS runtime accepted*
**Date:** 2026-10-31
**Package:** `Milvayo-v0.5.1-SINGLE-APP-MIGRATION.zip`
**Git commit/deploy:** Not performed

## Read first

- The single entry `App.js` now mounts `ModernApp` only. `ClassicApp.js`, the Settings → Advanced workspace route, and unused legacy UI panels are absent. Original domain modules remain intentionally active as business-rule authority.
- Previously legacy-only workflows now have modern access via the normal drawer, compact expandable settings, and task-sheet inline editors. The five mobile primary tabs remain Overview, Board, Timeline, Tasks and Sprints.
- One workspace / one AsyncStorage key: `milvayo-v1`; no incompatible project-JSON migration.
- `package.json`, `package-lock.json`, and `node_modules` are **deliberately omitted** (user preserved locally fixed `expo-font`). Extraction into a clean folder retaining those three items is supported; this is not a from-scratch dependency install package.
- Historical changelogs are under `docs/changelogs/legacy-code/`, modern merge history under `docs/changelogs/modern-code/`; duplicate root changelogs and redundant older QA file copies are gone.

## Integrated business workflows

| Area | v0.5.1 interface/behavior | Business rules and safety |
|---|---|---|
| Project administration | Create, edit, switch, archive/restore, duplicate as template, delete | Original workspace/project model, last-accessible-project guard, snapshot before destructive delete |
| Board | Boards/lists/tasks, card reorder, rename, board view preferences, Power-Ups, GitHub reference links | Original boards/kanbanUX/powerUps functions; normalized data/IDs preserved |
| Tasks | Inline task details, safe duplicate/delete, subtasks, parent relations, progress/effort, typed custom values, saved views, bulk status | Original planning/taskSchema/taskWorkflows logic for guarded fields, relation cycles and verification invalidation |
| Schedule | Project calendar, typed dependencies, lag, schedule preview and guarded apply | Original scheduleProject module and recovery snapshot for calendar and schedule apply |
| Agile | Sprint create/edit/assign/start/finish/delete/history/burndown | Original agile module; pre-finish and pre-delete recovery snapshots |
| Release/testing | Create/edit/delete releases; release gate status; check evidence, verification/merge | Release-gate checks, snapshot before release delete |
| Resources/cost | Contributor management, time logs, budget/currency, time CSV, cost/remaining | Original operations.costSummary leaf-task accounting (avoids parent/child estimate double count) |
| Portfolios | Create/edit/delete/membership/health | Original operations portfolio model |
| Collaboration | Local comments and local reminders | Original operations model; no push-notification promise |
| Automation | Command editor, status/card/board/due triggers, history/manual runs | Original automation model; status transitions invoke engine after validated mutations |
| Specifications | Phases, schemas, API contracts, playbooks from project import | Data displayed from imported project, no destructive schema rewrite |
| Recovery | Project import/export, whole-workspace backup/restore, snapshots, restore controls | Explicit whole-workspace operation plus snapshot of prior workspace; original storage key |
| Diagnostics | Local crash/performance reports | Local-only reporting, not native FPS profiler |

## Design and branding

- Preserves dark/light MockDesign visual language and compact inline disclosure pattern; avoids a secondary application shell.
- In-app brand mark and wordmark, 1024px launcher icon, Android adaptive foreground, splash artwork, iOS icon, PWA manifest icons and favicon use the supplied centered Niyarvo brand kit.
- Timeline continues as a **single scrollable task list** with viewport-clipped SVG paths; no segmented rows or Previous/Next paging.
- Removed the automatic initial Today jump (which could make bars appear, then disappear following first layout); Today remains a user-initiated action.

## Correctness and risk controls

- Restored domain-authoritative progress validation; Done task progress and parent rollups no longer rely solely on unrestricted object patches.
- Restored legacy cost calculation; blank due dates excluded from overdue classification.
- Destructive project, task, release, sprint, board actions retain or create recovery snapshots where implemented.
- Source imports and navigation audited: no `ClassicApp.js` or second Settings entry; no duplicate `package.json` shipped.

## Tests and observed limitations

- Node source/domain tests: **369/369 passed** (`node --test tests/*.test.cjs`). TypeScript parser syntax check: **59 source JS/JSX files, 0 parse errors**. **Expo Go/Web runtime QA: Not run here.**
- Final syntax audit caught and corrected malformed whole-workspace-backup JSX in `src/screens/Backup.js` before packaging.
- Android user previously reported that v0.5.0 Timeline stayed open but dependency SVGs flickered, and Board navigation/drag was slow. Source changes specifically target the Timeline initial automatic scroll; **flicker and performance are not device-verified fixed**.
- iOS hardware gestures, Android memory/ANR, real native chart drawing and drag feel: Not verified.
- Future connected services (remote sync, push notifications, real GitHub automation, multi-user permissions) were not implemented by v0.4.1 and are not falsely represented as migrated.

## Device acceptance gate

1. Back up the entire workspace in the current build, retain source ZIP and local dependency files.
2. Extract v0.5.1 at `~/Milvayo` and confirm `package.json` and lockfile hashes are unchanged.
3. Run `npm test`, `npx expo-doctor`, `npx expo start --clear`. Check all five tabs and every drawer screen.
4. In Android Expo Go, verify Timeline task bars/dependency curves persist after 1 second, scroll all scheduled tasks, edit dates and dependencies. Test Board horizontal/vertical scroll, tap/double-tap/long press/drag and 30-second stability.
5. Verify project and full-workspace backup→import/restore round trips, Sprint finish/delete snapshots, release gate checks, task progress validation, time/cost results, and saved automation triggers.
6. Do not merge to `main` until all runtime blockers are resolved and accepted.

**Handoff:** domain logic is under `src/*.cjs`; modern adapter/store `src/modernBridge.cjs`, `src/store.js`; single UI `App.js`, `ModernApp.js`, `src/screens/*.js`. Archive history under `docs/legacy-code/` and `docs/changelogs/` is documentation only, not executable UI.

---

## v0.5.2



# CHG-NP-0.5.2 — Task completion, automation and premium UI refinement

**Project:** Milvayo — single modern application
**Base:** `Milvayo-v0.5.1-SINGLE-APP-MIGRATION.zip`
**Version:** `0.5.2` · **Date:** 2026-10-31
**Status:** Source-level QA candidate; Android/iOS runtime not tested by the assistant
**Git commit, merge, deployment:** Not performed

## Read first

- **Keep your existing `package.json`, `package-lock.json` and `node_modules`** in Termux; none is in this ZIP. The locally repaired `expo-font` installation is not overwritten.
- Extract directly into `~/Milvayo`. No enclosing parent directory and no second application UI.
- The existing `milvayo-v1` local workspace storage key and v0.4.1 domain authority are unchanged.
- No changelogs are stored in the project root. The sole new changelog is this file under `docs/changelogs/modern-code/`.

## Implemented

| Area | Implementation | Notes / safeguards |
|---|---|---|
| Task checkboxes | Square is now bound to `task.status === 'Done'` and uses the existing `moveTask` store operation. Unchecking moves to `In progress`. | Previous square selected an item only in screen-local state and could never persist completion. Long-press row now selects it for bulk operations. |
| Task filters/tags | Status chips and the complete set of project labels are grouped into a collapsed `Filters & tags` section. Task rows show up to two compact tags on mobile with a `+N` overflow counter. | Search, sort and saved views preserved. |
| Broken confirmation layout | Bulk action header uses its own full-width line; action buttons wrap below. Reusable buttons respect container width and wrap long captions. | Addresses 1-selected text stacking in the user screenshot; all reused Button controls benefit. |
| Completion routing | Automations → Completion routing: choose `Done` or `Validation` for an incoming completed card. | Uses new validated `moveStatus` action on original automation engine. The route to Validation is deliberately not shown as a completed square. Saves with existing project backup structure. |
| Automation rules | New `moveStatus` action, `aging` trigger with configurable inactivity days and status filter; ready-made 7-day aging and due-today rules. | No arbitrary JS or network calls; dependency/transition checks; one execution per rule/task/day for aging. Existing status/card/board/due actions and history intact. Aging/due checks require running in-app; not an OS background service. |
| Appearance | Orange remains the existing mock-design vermilion. Nine additional accent colors in an inline selector: Aqua, Mint, Lime, Amber, Coral, Pink, Fuchsia, Violet and Indigo. Accent and light/dark preference saved locally. | Shared status/priority semantic colors do not change with accent selection. |
| Branding | Removed wordmark/monogram from mobile page header; retained original brand assets in drawer and wide sidebar with small `PROJECTS` descriptor. | Increased mobile header top/bottom padding and left/right gutters without removing the OS safe-area wrapper. |
| Notifications | Store save/validation errors now shown as compact, dismissible in-app notices *inside* native safe area instead of a top-of-root banner. Native Reanimated spring-in transition. | No claim of a real Apple system Dynamic Island, system Live Activity or background push notification. In-app notifications only; no new dependency. |
| Task settings | Removed duplicate task schema preview and task-configuration shortcut from Settings. Full task-type, custom-field, workflow editing remains in Task configuration via drawer. | One modern UI. |
| Disclosure controls | Main expandable cards (`Fold`) display a `+` that rotates toward an `×` on native via Reanimated. Nested `EditRow` details retain chevrons. | Layout dimensions/spacing remain in the mock-design system. |
| Timeline | No changes to task/SVG geometry or scrolling. | Preserve user-confirmed v0.5.1 rendering behavior. |

## Verification

- **376/376 Node tests passed**, including 7 new v0.5.2 business/UI regression checks.
- **0 source JS/JSX parse errors** using TypeScript's TSX parser across modern app entry and `src/` JS/JSX sources.
- Direct fixture checks: status-to-Validation persisted across project import; 7-day aging excludes completed tasks and deduplicates repeat runs.
- `app.json` Expo version updated to `0.5.2`; no dependency manifest edits or new native packages.
- ZIP checked for integrity and absence of nested root, package manifests, root changelogs and duplicate release notes.
- **Not verified:** Expo Go render, native spring smoothness, physical island/notch dimensions, iOS motion, notification elevation, actual filesystem persistence across restarts or device performance. Source tests do not replace device acceptance.

## Acceptance test in Termux / Expo Go

1. Extract the ZIP at project root; keep existing `package.json`, lockfile and `node_modules`.
2. Run `node --test tests/*.test.cjs`, `npx expo-doctor`, `npx expo start --clear`.
3. On Tasks: check one task, switch tabs and return; completed square should remain checked. Uncheck and verify task returns to In progress. Long-hold a row for bulk selection and inspect action label wrapping.
4. Automations: choose Validation routing, mark a Backlog task done, confirm its status is Validation (not a checked Done square); switch routing back to Done, check another task and confirm it remains Done. Test blocked dependencies show a readable error.
5. Create the aging preset, press Card aging, confirm one Aging label and one execution log per matching stale card; repeat same day and confirm no duplicate history. No background execution while Expo Go closed is claimed.
6. Settings: switch accents/mode, restart app, verify preference persistence. Test compact notifications and text clearance below Android status bar or iPhone camera housing.
7. Verify menu brand/PROJECTS descriptor, rotating section +/× controls, chevrons on nested records, task configuration in drawer, unchanged Board drag and Timeline display.

**No merge to main until physical Android/iOS QA succeeds.**

---

## v0.5.3



# CHG-NP-0.5.3 — Projects, Programs and cohesive navigation

## READ FIRST
- **Baseline:** v0.5.2 source; release type: QA candidate, not device-accepted.
- **Single-app architecture:** `ModernApp.js` remains the only application shell. Existing domain model and AsyncStorage key `milvayo-v1` are preserved.
- **Package manifests:** `package.json`, `package-lock.json` and `node_modules` EXCLUDED intentionally. Keep local dependency updates, especially `expo-font`.
- **New Expo dependency:** `expo-document-picker` is required for the native JSON import picker. Install from Termux with `npx expo install expo-document-picker`; `expo-file-system` and `expo-sharing` are used by existing import/export logic.

## Changes in this batch
1. Added **Projects** and **Programs** before **Portfolios** in the hamburger menu, each a real modern screen. Task configuration moved from Plan to Operate.
2. Project create, edit, duplicate, archive and confirmed delete are in Projects. Last-accessible-project guard and pre-delete workspace snapshot remain in place. Deleted project IDs are removed from Portfolio and Program memberships.
3. Programs are workspace-level, project-referencing groups with name, description, status and membership (no duplicate task storage). Legacy workspaces normalize to `programs: []`. Both JSON full-workspace backups and recovery snapshots include programs.
4. Settings no longer offers duplicate project administration or recovery operations. Backup owns project/workspace `.json` import/export, recovery snapshots and archived project recovery. Full-workspace restore always requires explicit confirmation and creates a safety snapshot.
5. Mobile header now displays the active screen title; duplicate oversized mobile page titles are suppressed. Drawer uses Milvayo combined SVG/PNG lockup with small embedded PROJECTS lettering. Bottom bar retains five top-level destinations. Native notification motion uses bounded spring animation and appears inside the app safe area.
6. Timeline Items control sits on the left above its associated chart/hidden item area. Heavy Timeline initial mount is delayed by two animation frames on native to reduce first-tap mount pressure; continuous scrolling and SVG data were not otherwise altered.
7. Orange is the default accent and the nine alternate accents remain optional.

## Source verification
- Node source suite: **385/385 passing** after changes, including Program persistence and navigation tests.
- JS/JSX parser: no errors (TypeScript parser-based scan).
- **Not run:** Expo Go Android/iOS runtime QA, native dependency installation and Metro bundling (container lacks the user's manifest/node_modules). Test the new import picker only *after* installing its dependency.

## Known limitations and acceptance risks
- The first-tap Timeline return to Overview has been mitigated by deferring the native heavy view, **not confirmed fixed** without device runs.
- Island-inspired notices are in-app UI, not system Dynamic Island Live Activities. Final safe-area/animation acceptance is device-dependent.
- Programs are local project groups; this release does not introduce cross-project scheduling, cloud collaboration or new automated workflows at the program level.
- App icons/brand assets are source-bundled. Existing installed native APK launcher icons may require a native rebuild to reflect new asset changes; Expo Go uses its own launcher icon.

## Delivery
- Full root-level source ZIP, no extra parent directory.
- `docs/changelogs/legacy-code/` for pre-migration records, `docs/changelogs/modern-code/` for the modern history. No root changelogs or duplicate nested source trees.
- Do not merge to main until device-level acceptance on Android.

---

## v0.5.4



# CHG-NP-0.5.4 — Independent management screens and Android hotfix

## READ FIRST

- Baseline: Milvayo v0.5.3 modern single-app release.
- Delivery: source ZIP at the project root, **excluding** `package.json`, `package-lock.json` and `node_modules`.
- Status: source-level QA passed; Android/iOS runtime not executed in the packaging environment.
- The original AsyncStorage workspace key and project/portfolio/program schemas are unchanged. Keep a full backup before installing.

## Corrections

1. **Drawer duplicate React key:** Removed the repeated `taskconfig` item from OPERATE. One destination remains in the modern navigation.
2. **Projects screen render crash:** Project task counts are rendered as numbers via `projectSummary(project).taskCount`, never as task-object arrays. The reported `monitor.js` stack was only the diagnostics console interception, not the source of the React error.
3. **Logo legibility:** Embedded PROJECTS lettering in both color variants increased in glyph size and weight; matching PNG assets regenerated. Branding remains inside the drawer.
4. **Independent screens:** Deleted the combined `src/screens/ProjectsPrograms.js` and split it into `src/screens/Projects.js` and `src/screens/Programs.js`. Extracted `Portfolios` from `src/screens/Workspace.js` into `src/screens/Portfolios.js`.
5. **Single relationship connector:** Added `src/projectRelations.cjs` for immutable project membership lookup, scalar summaries and removing references after project deletion. The existing `src/store.js` continues to own all writes and validation. No duplicate state or store created.
6. **Navigation imports:** `ModernApp.js` imports the three screens independently.

## Test evidence

- `node --test tests/*.test.cjs`: **390 passed, 0 failed**.
- TypeScript parser scan across 69 JS/JSX app/source files: **0 parse diagnostics**.
- Three new regressions check module separation, scalar task counts, and project/program/portfolio membership safety.
- Android Expo Go, web bundling, drag interactions, and native logos: **Not run in this environment**.

## Known outstanding performance work

- The user reported an approximately 2.1-second Board transition with an 782ms React render and 1.45-second JS stall in v0.5.3. This focused hotfix does **not** claim to resolve that independent performance problem.
- Source-level tests do not prove the notification or timeline gestures are fully validated on devices.

## Acceptance criteria

1. Open hamburger repeatedly: OPERATE contains only one Task configuration entry; no duplicate-key warning.
2. Open Projects: project task counts render without an object-as-child error; editing, switching, and deletion safeguards still work.
3. Open Programs and Portfolios: membership names/counts are correct; editing membership, restoring or deleting a project do not create invalid references.
4. Inspect light/dark drawer wordmark on device: PROJECTS is clearly legible without overflowing the logo.
5. Confirm `package.json`, `package-lock.json` and installed dependencies remain intact after extraction.

---

## v0.5.5



# CHG-NP-0.5.5 — Entreprise PM hierarchy and responsive header and notification positioning hotfix

## Baseline and status
- Baseline: Milvayo `v0.5.4-MANAGEMENT-SPLIT-HOTFIX.zip`.
- Release: `0.5.5`, source-verified QA candidate; no device launch claimed.
- Canonical storage: `milvayo-v1` (unchanged); no data reset and no duplicate application.
- `package.json`, `package-lock.json`, `node_modules` excluded from ZIP by user preference.

## Implemented
- Fixed shared `Page` header layout on narrow devices: subtitle gets full width; actions occupy a distinct horizontal row. Addresses Timeline and Automations word-by-word text wrapping, and similar pages using the component.
- Embedded blue `PROJECTS` text begins under the first `o` on the right side of the Niyarvo SVG, away from the `y`; regenerated both theme PNGs.
- Replaced three independent drawer destinations with **Entreprise PM**, one entry containing inline Programs, Portfolios and Projects panels. Their source files remain separate (`Programs.js`, `Portfolios.js`, `Projects.js`).
- Established real Program → Portfolio → Project membership: `program.portfolioIds` references existing portfolios; `portfolio.projectIds` references existing projects. No tasks or projects copied.
- Preserved existing legacy direct `program.projectIds`; legacy direct members are visible in Programs and can be removed explicitly during edit, not silently dropped.
- Added deduplicated hierarchy summaries in `src/projectRelations.cjs`. Reject unknown portfolio IDs in program mutations; drop stale references during workspace normalization; unlink deleted portfolios from programs.
- `normalizeWorkspace`, local snapshots, whole-workspace backup/restore preserve the new membership field.
- Fixed Android 15 edge-to-edge island notice positioning: the mobile overlay now anchors to the content region after the app header rather than to the root window top. This prevents notices from drawing over the status bar/camera cutout even when the reported top inset is zero. Native Reanimated presentation and timed dismissal are preserved.
- Wide view notices use `useSafeAreaInsets()` with a minimum top offset.
- Updated diagnostics/app release version, README and regression contracts.

## Acceptance checks
- Source tests: 400/400 passed (`node --test tests/*.test.cjs`), including 8 hierarchy/responsive checks and 2 safe-notification placement checks.
- TypeScript JS/JSX parser: 116 parsed, 0 syntax diagnostics.
- ZIP integrity and dependency manifest exclusion: verified in build.
- Expo Go on Android/iOS and web: **Not run**.

## Limits / known risks
- Touch, scrolling, timeline dependency rendering and Board navigation performance were not changed in this batch. Notification vertical position must be confirmed visually on Expo Go on an Android 15 device. Real-device validation required.
- Program/portfolio nesting is a **reference hierarchy**; no automatic task/board duplication or cloud sync.
- In-app local storage uses existing AsyncStorage; retain a full-workspace backup before extraction/testing.

---

## v0.5.6



# CHG-NP-0.5.6 — Dynamic Island-style notification lifecycle

## 0. Baseline / status

- Baseline: `Milvayo-v0.5.5-ENTREPRISE-PM-SAFE-NOTICES.zip`.
- Release: **0.5.6**, **source-verified QA candidate**; Android, iOS and browser visual runtime tests **not run**.
- This is a **cross-platform in-app notification** visual system. It does not integrate with, recreate, or access Apple's system Dynamic Island or Live Activities.
- Existing task data, local workspace key and persistence/authorization modules unchanged.
- `package.json`, `package-lock.json`, and `node_modules` intentionally excluded from ZIP, respecting the user's fixed Expo dependencies.

## 1. Changed source files

- `src/IslandNotice.js`: shared severity colors, accessible compact and expanded content, tap-to-expand, collapse, dismiss, timed confirmations and persistent error notices.
- `src/NoticeMotion.native.js`: native Reanimated shared-value/worklet transitions for width, height, translation, opacity and a subtle spring scale settle (UI thread).
- `src/NoticeMotion.web.js`: React Native Web Animated spring for opening, timing for collapse/closing, matching layout and gesture controls on browser.
- `ModernApp.js`: uses a mobile safe-area shell, anchors mobile notices **below the header** rather than under Android system icons, and centers on desktop with inset-aware offset.
- `src/diagnostics/monitor.js` and `app.json`: release version updated to 0.5.6.

## 2. Interaction contract

1. New notification starts as compact black pill, then morphs into readable expanded card.
2. Success/info/warnings collapse to a compact form before closing automatically.
3. Errors remain visible for manual dismissal; user may collapse and re-expand.
4. Compact pill re-expands on tap; expanded notice has explicit dismiss and collapse affordances.
5. Multiple platforms share one event store; no Java/Gradle dependencies are added.
6. Notification does not cover the Android status bar, device cutout, or mobile navigation tabs.
7. User can still operate the app; toast is an overlay, not a navigation screen.

## 3. References reviewed (design inspiration, not installed/copy-pasted)

- pehaa/simple-notifications-solution (MIT): self-closing vs explicit dismissal, event lifecycle. https://github.com/pehaa/simple-notifications-solution
- jaredrummler/AndroidAnimations (Apache-2.0): easing and animated state changes. https://github.com/jaredrummler/AndroidAnimations
- Shashank02051997/FancyAlertDialog-Android (Apache-2.0): severity hierarchy and deliberate dismissal for alerts. https://github.com/Shashank02051997/FancyAlertDialog-Android
- hariprasanths/Bounceview-Android (Apache-2.0): restrained press/spring interaction. https://github.com/hariprasanths/Bounceview-Android

No source code or binaries from those projects were included. Using their original Android packages would require native integration and would not provide one implementation for Expo Go, iOS and web.

## 4. Verified here

- `node --test tests/*.test.cjs`: **404/404 pass**.
- TypeScript parser on JS/JSX files: **42 parsed / 0 syntax diagnostics**.
- Native Expo Go, iOS simulator/device, browser layout, reduced-motion testing: **Not run**.
- No dependency manifests included in archive.

## 5. Remaining acceptance / risks

- Confirm pill stays below Android status bar and cutout in Expo Go, including after device rotation and light/dark mode.
- Check rapid consecutive notifications, error-dismiss interaction and any content clipping with long messages.
- Test actual iOS notch-safe placement and desktop web width/responsiveness.
- Animation smoothness and frame rates cannot be established by source-level tests.

---

## v0.5.7



# CHG-NP-0.5.7 — Top-positioned Dynamic Island

## 0. Release status

| Field | Value |
|---|---|
| Source baseline | `Milvayo-v0.5.6-DYNAMIC-ISLAND.zip` |
| Release | `0.5.7` — Android/iOS/Web QA candidate |
| Goal | Move existing animated in-app notification near the top of the app without overlapping OS status icons or cutouts |
| Runtime acceptance | **Not run** — Expo Go Android/iOS and mobile/desktop web should be checked by the user |
| Dependency changes | None; `package.json`, `package-lock.json`, `node_modules` omitted from archive |

## 1. Observed issue and repair

- In v0.5.6, the phone `IslandNotice` was an absolutely positioned child of the **page-content** view, below the 83+ point app header. It therefore began over the task filters instead of at the top of the app.
- `ModernApp.js` now renders a separate top-level, `position:'relative'` mobile shell, keeps the safe-area app layout in its own `SafeAreaView`, and places `IslandNotice` **as a sibling after the safe-area content**. The notice is no longer positioned relative to the scrolling page or header bottom.
- Added `src/noticePlacement.cjs` to compute an offset from the top of the window: `max(safeAreaInsets.top, AndroidStatusBar.currentHeight or 0) + 10` points. The fallback covers Android edge-to-edge/Expo Go combinations where the inset is unexpectedly zero. On iOS it uses the measured notch/dynamic-island inset.
- Kept the original compact → expanded → collapsed/dismissed spring animation, icons, error dismissal, automatic success expiry and responsive full-width bounds unchanged.
- Desktop/tablet wide mode keeps its previous top safe-area anchoring.
- The expanded notice **may temporarily float over app-header controls** by design; it no longer needs to sit below the header. It should not reach OS status icons or the cutout.

## 2. Files changed

- `ModernApp.js` — mobile layer placement and RN StatusBar fallback integration.
- `src/IslandNotice.js` — corrected anchoring comment (motion unchanged).
- `src/noticePlacement.cjs` — new pure safe-area offset helper.
- `tests/notice-safe-anchor-055.test.cjs` — adapted old anchor contract, added real numeric inset cases.
- `tests/dynamic-island-056.test.cjs` and `tests/ui-automation-052.test.cjs` — updated layout contracts.
- `app.json`, `src/diagnostics/monitor.js` — version updated to 0.5.7.
- `README.md` and this changelog/QA checklist — release documentation.

## 3. Tests executed

- `node --test tests/*.test.cjs` — **405/405 passed**.
- TypeScript JS/JSX parser across `src/`, `App.js`, `ModernApp.js` — **71 files, 0 parse errors**.
- ZIP archive CRC/integrity and dependency-manifest exclusion — checked at packaging.
- Expo Go/iOS/browser rendering, actual notch and status bar placement, device animations — **Not tested in this environment**.

## 4. Device acceptance

See `docs/qa/modern-code/NP-QA-0.5.7.md`. Check low-height status-bar devices and landscape/notched devices first. Do not merge to main until real-device placement is confirmed.

---

## v0.5.8



# CHG-NP-0.5.8 — Web scroll arbitration and offscreen rendering

## 0. Release handoff

| Field | Value |
|---|---|
| Baseline | `Milvayo-v0.5.7-ISLAND-TOP-SAFEAREA.zip` |
| Release | `0.5.8` — web performance/gesture QA hotfix |
| Reported issue | Web `ScrollView doesn't take rejection well - scrolls anyway`; 126 console error calls, 850 Board renders, 410 Timeline renders within one run |
| Confirmed JS exceptions | 0 in supplied report |
| Source status | Tests and parser passed; browser/device runtime not verified |
| Dependencies | No new packages; `package.json`, `package-lock.json`, `node_modules` excluded |

## 1. Diagnosed causes

1. `src/gesture.js` used an eager `PanResponder` claiming contacts on pointer-down. On web this can compete with nested ScrollView touch/scroll handling, causing responder rejection warnings. `src/diagnostics/monitor.js` merely captured the resulting console messages; it was not the failure origin.
2. `ModernApp.js` kept heavy `Board` and `Timeline` mounted in hidden web tabs, so the screens continued React rendering and subscribed to workspace updates offscreen. The user's numbers strongly suggest avoidable work, but are not enough to measure exact time savings.
3. The previous diagnostic heading `JS errors` counted intercepted `console.error` calls as well as actual captured exceptions. It has been relabeled to avoid suggesting 126 crashes.

## 2. Changes

- **Added** `src/gesture.web.js`, an explicit web-only pointer-based stationary-hold gesture. Normal swipes do not claim a React Native responder; pointer movement past 8px cancels a pending hold. After the hold, document-level pointer handlers maintain drag offset including scrolling. Pointer cancel drops without persisting a move. List/card nested starts do not both claim the same pointer.
- **Preserved** `src/gesture.native.js`, `src/boardGesture.native.js`, `src/gestureSurface.native.js` and original Android/iOS gesture implementations. No native animation or layout changes.
- **Removed** `disableScrollViewPanResponder` from ordinary Board and Timeline scroll views. React Native documentation warns against using this prop for ordinary scrolling.
- **Updated** hidden-tab retention: Board and Timeline now unmount when inactive on web (already the policy for native), instead of continuing expensive hidden updates. This trades a possible remount cost on revisiting for lower background work/memory.
- **Updated** `src/diagnostics/core.cjs` report wording to `Console errors and JS exceptions`, and version 0.5.8 in `app.json` and `monitor.js`.
- **Added** regression tests `tests/web-scroll-stability-058.test.cjs`; adapted older source contracts to new web scroll handling.

## 3. Tests and limitations

- `node --test tests/*.test.cjs` — **408/408 passed**.
- TypeScript parser (JS/JSX mode) over 122 source/test files — **0 syntax errors**.
- Browser pointer event and scroll smoothness cannot be demonstrated via source-only tests. Android/iOS startup, Android scroll/drag, and web runtime are **not verified**.
- The user reported 126 console error calls but only one error message was supplied. Do not claim all other errors are resolved without a new full console log if any remain.

## 4. Acceptance and release

See `docs/qa/modern-code/NP-QA-0.5.8.md` for browser/mobile acceptance. Keep on `work` pending tests. No Git operations or deployment performed.

---

## v0.5.9



# CHG-NP-0.5.9 — Governance migration, source handoff

## Baseline and scope
- Based on Milvayo **v0.5.8** source, preserving working Web scrolling / navigation, task and Timeline business logic.
- Current deliverable: **v0.5.9 source-level QA candidate**. **Expo Go (Android/iOS), Expo Web runtime: Not run** in the build environment.
- `package.json`, `package-lock.json`, `node_modules`: **intentionally excluded** (preserve user's Termux dependencies, including fixed `expo-font`).

## Source changes
- New professional **Governance** drawer group with separate **Projects → Portfolios → Programs** pages (separate source files), linked to the **existing one canonical workspace store**.
- New project-governance fields: health, PMI process group, sponsor, manager, customer, objective, date range. Normalized and persisted with each existing project.
- Ten editable governance documents: business case, charter, stakeholders, scope, WBS, budget, risks, communications plan, change log, lessons learned; each supports status and a progress metric.
- Business-case cost-benefit NPV, ROI and simple payback; no external financial data or undisclosed assumptions. Template headings are original interpretations, not certified PMI templates.
- Stakeholder power/interest quadrants; probability × impact 5×5 risk matrices (threats and opportunities), scored risk register and response plan.
- WBS outline with add/reorder/indent/outdent/owners/hours/notes, deliverable/PMI phase starters, tree/fishbone/mind-map SVG diagrams; CSV and SVG exports through existing file support.
- Budget uses **legacy leaf-task estimated labour costs and actual logged labour** from `operations.costSummary`, plus separate non-labour cost lines, contingency and approved amount.
- Programs: exclusive portfolio and project membership on save; benefit registers, roadmap and Today marker, health/progress/spend/risk roll-ups. Portfolios have editable metadata and real-project roll-ups.
- **No automated demo seeding**. Three sample projects live solely in `examples/atlasproject.json` alongside the existing Atlas project (workspace-format fixture). Its import **replaces the current workspace** after confirmation; back up user data first.
- **Timeline nav icon** rotated 90° in BOTH hamburger and bottom navigation, *not* the actual Timeline canvas. Gantt chart untouched.
- Existing workspace backup/snapshot pipeline retains governance data, programs and portfolio links. Previous source-level web drag/scroll fixes preserved.
- Obsolete tests targeting old combined Entreprise PM screen adjusted to validate new Governance hierarchy.

## Verification
- `node --test tests/*.test.cjs`: **414 passed / 0 failed**.
- JS/JSX parse scan: **134 modules / 0 errors**.
- Atlas workspace sample import and cross-program collision checks: pass.
- Archive ZIP integrity: verified at packaging.
- **Not verified**: Expo Go runtime UI, iOS simulator, web-browser interactions, actual device rendering and animations, exact PMI compliance, or financial accounting suitability.

## Risks / follow-up QA
- Ten long governance documents can be memory-intensive; exercise expansion and scroll especially on Android.
- Test rapid input changes and backing out of Projects, Programs, Portfolios; confirm persistence on reopening and app relaunch.
- Confirm WBS SVG file export and gesture/scroll interplay on web and phone.
- Workspaces with legacy duplicate project membership across programs remain readable; new writes enforce exclusivity. Repair any legacy conflicts manually.

---

## v0.5.10



# CHG-NP-0.5.10 — Performance and stability audit

## Handoff
- Baseline: supplied Milvayo-v0.5.9-GOVERNANCE.zip plus separately supplied package.json and package-lock.json.
- Release: 0.5.10; branch: work. No commit, push, merge, deployment, APK or IPA produced.
- Status: 427 tests pass; Android/iOS/web JavaScript exports pass; browser smoke checks pass. Physical Android/iOS acceptance remains **Not run**.
- Source ZIP contains project-root files, excluding package.json, package-lock.json and node_modules to preserve the user's local setup. The supplied package version remains 0.4.8; app.json reports 0.5.10.

## Fixes
- Timeline dependencies now use the same normalized one-sided dates as bars; invalid coordinates are rejected before SVG rendering. This addresses a concrete rendering defect, but the reported Android return to Overview is not yet confirmed resolved on a device.
- Replaced repeated Timeline routing scans with interval routing; reduced native gesture-handler work. Cancelled drags and connections no longer commit changes.
- Hidden screens unmount instead of remaining subscribed to workspace edits. Local screen state may reset when navigating away.
- Workspace normalization reuses unchanged project objects; pending disk saves coalesce to the newest complete snapshot. Failed saves remain retryable and show a visible error; background/page-hide events attempt a flush. Abrupt process termination can still interrupt asynchronous saves.
- Indexed costs, health, comments and task-view summaries remove repeated scans. No-op task edits avoid unnecessary writes.
- Deep dependency and critical-path traversal avoids recursive stack overflow. Invalid/deep WBS and parent trees fail validation rather than proceeding into rendering.
- Governance IDs no longer restart a numeric counter after relaunch; document edits use current store values. Task editors reset on task/project identity changes; failed creation operations return no success ID.
- Diagnostics distinguish console logging from uncaught exceptions. Web service-worker cache version updated.

## Validation
| Check | Result |
|---|---|
| Node suite | PASS: 427 tests, zero failures |
| Expo offline dependency compatibility | PASS in preceding audit run |
| Android/iOS/web Expo exports | PASS; bundles are not installed native builds |
| Browser Timeline | PASS: five navigation cycles, due-only predecessor fixture, no invalid SVG paths or JS errors |
| Browser secondary screens | PASS: 19 screens opened |
| Persistence | PASS: task edit survived full browser reload |
| Browser layouts | PASS: 412×915 touch emulation and 1440×1000 desktop |
| Physical Android/iOS, Expo Go, Metro Fast Refresh | Not run |

## Installation and rollback
1. Export a whole-workspace backup from the app. Keep the previous source ZIP and a copy of your current package files.
2. Extract the source ZIP directly inside ~/Niyarvo (no enclosing folder). Existing package files are preserved.
3. If using the exact manifests supplied for this audit, extract the separate LOCKFILE-REPAIR ZIP there to replace only package-lock.json. It adds six missing dependency entries, preserving existing entries and versions. Do not apply to a differently updated package.json without reconciliation.
4. Run npm ci if applying the lock repair, then npx expo start -c. Rebuild native binaries through your normal workflow.
5. Test Timeline navigation, vertical/horizontal scrolling, move/resize/connect/cancel gestures, rapid edits, governance documents and persistence after relaunch on your device.
6. Roll back by restoring the previous source and package files. Do not uninstall or clear app data. Restore your exported workspace only if needed.

## Next acceptance gate
Native restart/crash confirmation requires device testing and a crash report if the symptom persists. This audit does not establish that all possible crashes or performance limits are eliminated. Large workspaces still require device memory/frame profiling; Timeline retains all scheduled rows. No data-format migration is required.

---

## v0.5.11



# CHG-NP-0.5.11 — Android drag rendering and navigation diagnostics

## Baseline and evidence
Based on the delivered v0.5.10 source. User tested v0.5.10 on Android API 35 and supplied 542245.mp4 plus diagnostics. Video frames from 4–12 seconds show Timeline preparation, return to Overview, then a successful Timeline opening. Report: Board 31 renders averaging 387 ms (max 933 ms), Tasks max 453 ms, longest JS timer delay 1520 ms. These are user-device observations for v0.5.10, not v0.5.11 measurements.

## Changes
- Memoized Kanban TaskCard. Moving the drop indicator no longer forces unchanged cards to reconcile. The active card still renders its lift/edit state, and store/theme changes still propagate.
- Stable empty feature-array prop prevents memoization being defeated on boards with no enabled Power-Ups.
- Native Tasks initial page and increments reduced from 80 to 20; existing Show more control exposes every remaining task. Web retains 80.
- Bottom-tab touches now carry a navigation epoch: a delayed release from before an intervening navigation is ignored. Same-screen navigation requests are ignored.
- Navigation diagnostics record source and previous/next screen. Shell mount/unmount events distinguish a component remount from an explicit tab/menu request. Diagnostics report version 0.5.11.
- App and service-worker versions updated. No dependencies added or changed; package manifests excluded from the source archive.

## Important limits
The exact cause of the Android Timeline bounce is **unconfirmed**. A single diagnostic run ID does not exclude a Shell remount. Stale-touch protection is a defensive fix, not proof that stale input caused the recording. Do not describe this release as a confirmed native crash fix.

This patch targets repeated drag renders; the Board still mounts all its cards on opening. Initial Board load performance, native gesture FPS and Timeline behavior need device validation. Physical Android/iOS and Expo Go tests: **Not run**. No APK/IPA, deployment, commit or push performed.

## Verification
See NP-QA-0.5.11.md and the attached evidence folder for actual results.

## Install / rollback
Export the current workspace backup, keep the previous source, then extract this project-root ZIP in ~/Niyarvo. It preserves package.json, package-lock.json and node_modules. No npm ci needed for this patch. Restart Metro using npx expo start -c; rebuild the APK through your usual workflow if testing an installed build. Roll back by restoring v0.5.10 source; do not clear app storage.

## Device acceptance
1. Repeatedly open Board → Timeline → Overview, including quick taps; capture diagnostics if it returns unexpectedly.
2. Hold and drag cards within/across columns, auto-scroll and cancel; verify final ordering and saved data.
3. Open Tasks, use Show more, filter and perform bulk actions.
4. Compare Board render averages/maxima with the supplied v0.5.10 report on the same workspace. No new device timing claims yet.

## UI review direction
Bundled Unslop by Damir Sokolovsky (CC BY 4.0), used as the existing review standard. Product: independent planning workspace. Character: calm, exact, dependable. World: technical workbench. Moments: Kanban and Gantt. Signature: existing accent/status colors. Spacing, colors, icons, copy, typography and layout retained; observed defects concern interaction delays and navigation. The native task batch size is the only visible loading behavior change.

---

## v0.5.12



# CHG-NP-0.5.12 — Queued tab navigation and native Board mounting

## Baseline and evidence
Based on delivered v0.5.11. User reports first-open Timeline → Overview bounce still occurs on Android. Supplied recent traces identify bottom-tab requests, including several processed within 1–4 ms after long stalls. They do not retain the initial bounce. Zero recorded JS exceptions does not prove absence of native failure. No confirmed root cause for the first-open bounce is claimed.

User-device render averages: Board 131 ms and Tasks 76 ms versus prior supplied 387 ms and 284 ms. These are separate sessions, not controlled benchmarks. Current Android Board cold renders still reach 627 ms. Web Timeline trace contains 34 scheduled tasks, Android 66; direct performance ratios are not meaningful.

## Changes
- Bottom-tab navigation uses a latest-selection queue drained once per animation frame. A burst of queued selections mounts only its final destination. Menu/screen navigation and shell unmount cancel pending tab work. Same-screen requests remain no-ops.
- Tightened tab press retention to the button bounds. Logs include input-down/up timestamps alongside committed navigation to distinguish touch timing from JS processing timing.
- Native Board initially mounts the first two columns. Subsequent columns mount as their horizontal position approaches the viewport. Visited columns remain mounted for the lifetime of the screen; active gestures and title editors are not discarded. Auto-scroll reveals and measures new drop targets after mounting. Web rendering is unchanged.
- Startup diagnostics pin the first 40 events separately from the rolling latest 90. The first-open incident is no longer lost after later navigation.
- Slow events, navigation events and exception counts now belong to the current run. Previous-run exception details remain separately labelled; previous slow timings are not mixed into current reports.
- Version updated to 0.5.12; no dependency changes, data migrations, commits, pushes, deployments, APK or IPA builds.

## Remaining limits
First-open Timeline bounce on physical Android: **not verified resolved**. Native column mounting, cross-column drag/auto-scroll, screen-reader traversal and frame timings require device acceptance. Board columns still mount all their cards when revealed; this is lazy column mounting, not complete card virtualization. Visiting every column eventually retains all cards until leaving Board. A large first column can still be expensive.

## Install and rollback
Back up the workspace. Extract the project-root ZIP into ~/Niyarvo, preserving local package files. No npm ci needed. Run npx expo start -c for Metro; rebuild through the user's normal process for an installed APK. Roll back by restoring v0.5.11 source without clearing app storage.

## Acceptance sequence
1. Fully reload, then open Timeline once. If it returns to Overview, export diagnostics; the startup section must be included.
2. Rapidly select several tabs and confirm the final requested screen stays active.
3. Open Board, scroll across every column, drag within and across columns, exercise edge auto-scroll and cancel. Verify saved ordering after reload.
4. Compare Android performance on the same workspace and build mode.

## Review direction
Existing Unslop standard by Damir Sokolovsky, CC BY 4.0. Product: independent planning workspace. Character: calm, exact, dependable. World: technical workbench. Moments: Kanban and Gantt. Signature: existing accent/status colors. Before-audit: spacing, color, icons, copy, typography and layout preserved; observed defects are work scheduled during navigation and expensive native mounting. No decorative redesign.

See NP-QA-0.5.12.md for observed checks and explicit untested items.

---

## v0.5.13



# CHG-NP-0.5.13 — First-open Timeline → Overview bounce: root remount contained; lighter Android tab mounts

## Baseline and evidence
Based on delivered v0.5.12. User supplied Android API 35 diagnostics (run `mvxbajfk`, startup section now retained) and screen recording 542248.mp4.

What the evidence shows (observed, not assumed):
- Startup trace, Android: `tab input: timeline` → `navigation request: overview -> timeline` → `screen opened timeline` → **`shell unmounted`** (≈0.5 s later) → `shell mounted` → `screen opened overview`. There is **no** navigation request to Overview. The run ID did not change, so the JS context stayed alive: this is a React remount, not a process death.
- Recording, first 14 s: Timeline chart renders, then the "Opening local workspace…" splash appears, then Overview. That splash is rendered only by `StoreProvider` when it is freshly mounted, so the remount happens **above** the whole app (not inside Timeline, not an error boundary, not a navigation call).
- It happens once per launch (second Timeline open in the same run is stable). The web run, which has no gesture-handler root, shows no remount.
- The only component above `StoreProvider` that changes behaviour at that moment is the root `InterceptingGestureDetector`, which receives the app's first virtual detector when Timeline mounts. The exact gesture-handler internals are **inferred**: `node_modules` was not available to read. The fix below does not depend on that inference being exactly right.

## Changes (bounce, first priority)
Three independent layers, each sufficient to hide the symptom on its own:
1. **Warm-up** (`src/AppGestureRoot.native.js`): one invisible 1×1 virtual detector, built from the existing `useHoldDrag` and `GestureArea`, mounts before the app and stays mounted; the app mounts three frames later. Any one-time detector setup now happens at startup instead of mid-navigation. A failure in the warm-up is caught and the app still opens.
2. **Navigation memory** (`src/navigationMemory.cjs`, `ModernApp.js`): the active screen and visited tabs live outside React. If Shell is ever remounted again, it resumes on the same screen instead of Overview. A full JS reload still starts on Overview.
3. **Workspace memory** (`src/store.js`): the latest normalized workspace is kept in module memory. A remounted provider resumes from it immediately — no splash, no stale disk re-read. Cold start still reads disk. Every edit updates both the memory copy and the existing latest-write persistence; normalization, backups and recovery are untouched.

Diagnostics added: `root gesture warm-up ready`, and `shell remounted; restored screen <id>` if a remount ever happens again.

## Changes (Android performance, second priority)
- **Board cards mount progressively on native:** first 6 cards per column at once, then 6 per frame. Header counts and empty states use the true count; once all cards are shown the column stays fully shown so a dropped card appears immediately. Web unchanged. Reason: trace shows Board renders up to 449 ms with 34 Backlog / 26 Done cards.
- **Tab commit deferral generalized** from Timeline to Board, Tasks and Sprints on native: the tab, title and press feedback commit first, the screen mounts two frames later behind a plain "Preparing …" placeholder. Overview stays immediate. This improves responsiveness of the press; it does not reduce total CPU.
- Version 0.5.13 (app.json, diagnostics, service-worker cache). No dependency changes, no data migrations.

## Remaining limits
- Bounce fix: **not verified on device**. The three layers are source-level and unit-tested only.
- Measurements so far come from Expo Go in **development mode**, where React is several times slower than production. For comparable numbers use the same workspace and `npx expo start --no-dev --minify`.
- Sprints shows 192 renders in two short visits on Android; the cause is not identified from these traces. Not changed.
- Web Board shows 1058 renders (avg 3 ms) and 5 console errors at 04:15:03 whose text diagnostics withhold. Not investigated or changed.
- Hidden tabs still unmount (policy from 0.5.10); revisiting a tab pays its mount again.

## Install and rollback
Back up the workspace. Extract the project-root ZIP into ~/Niyarvo, preserving local package files. No npm ci needed. Run `npx expo start -c`. Roll back by restoring v0.5.12 source without clearing app storage.

## Acceptance sequence
1. Fully close Expo Go, reopen the app, tap Timeline once. Expected: it stays on Timeline. Export diagnostics; startup should contain `root gesture warm-up ready` and no `shell unmounted`.
2. If it still returns, the startup section should now show `shell remounted; restored screen timeline` and you should still land on Timeline; send it.
3. Open Board: top cards appear first, the rest within a few frames; scroll all columns, drag within and across lists, verify saved order after reload.
4. Compare Android timings with `--no-dev --minify`.

## Review direction
Existing Unslop standard by Damir Sokolovsky, CC BY 4.0. No visual redesign; the only visible change is a plain "Preparing …" placeholder on Board, Tasks and Sprints for two frames on native. Before-audit: observed defects are a root remount on first detector registration and large single-commit mounts.

---

## v0.5.14



# CHG-NP-0.5.14 — Retained tabs with frozen subscriptions (native tab switches stop rebuilding screens)

## Baseline and evidence
Based on v0.5.13. User confirmed the Timeline bounce is gone; the v0.5.13 Android trace agrees: `root gesture warm-up ready` precedes `shell mounted`, and the run contains no `shell unmounted`.

Remaining cost in the same trace (Android API 35, Expo Go, dev mode):
- Every tab visit rebuilt its screen: Timeline mounts 157–232 ms, Board up to 449 ms, Tasks 132–151 ms, Sprints 184 ms; tab transitions 216–660 ms; JS timer delays up to 982 ms.
- Cause: hidden tabs were unmounted (policy since 0.5.10) and re-created on every visit.

Why that policy existed, and why it can go: 0.5.10 unmounted hidden tabs because hidden screens kept re-rendering on every edit, and earlier tab-snap reports were attributed to caching. The 0.5.12/0.5.13 traces and recording showed the snap-back was a root remount unrelated to tab caching. The edit-time cost is solved below at its source instead of by tearing screens down.

## Change
Native only; web keeps its unmount policy (tests for the web policy unchanged).
- **Retained pages.** Visited primary tabs (Overview, Board, Timeline, Tasks, Sprints) stay mounted and are hidden with `display: none`. A tab press toggles visibility; it no longer builds a screen. Only a tab's first visit mounts it (still deferred two frames, Board cards still progressive from 0.5.13).
- **Frozen subscription.** Each retained page sits in `StoreFreeze` (`src/store.js`, logic in `src/freezeCell.cjs`). While hidden it keeps receiving the exact last visible store value, so React skips its updates; edits, notices and typing cost it nothing. On showing, it receives the live value: one render if something changed while hidden, none if not.
- **Stable screen element.** `CachedPage` memoizes the screen element and uses a comparator (`src/pageRetention.cjs`) under which a hidden page ignores query and parent re-renders. Handlers changing is never ignored.
- **Project switch.** Pages are keyed by project, so switching project would have rebuilt every retained page at once. The retained set (`src/visitedTabs.cjs`) now restarts from the visible tab and refills lazily.
- Diagnostics: `tab shown from retained page: <id>`.
- Version 0.5.14. No dependency or data changes.

Tests superseded deliberately: the three "hidden tabs unmount" source assertions (0510, 047, 058) now assert native retention + `StoreFreeze` and keep asserting web does not retain; two shape assertions on the old `visited` state (047, 0513) follow the new state.

## Verification
- 447 Node tests pass (5 new in tests/tab-retention-0514.test.cjs).
- Real React 19 render harness in Chromium (docs/qa/modern-code/NP-0.5.14-tab-retention-harness.jsx; same freeze cell, comparator and memoized element as the app, not React Native): hidden page re-renders 0× across 3 edits and typing; showing it after edits renders exactly once with the latest data; three tab switches with no change render 0×.
- Not run: any device. Android behavior and timings are unmeasured.

## Honest limits
- Bounce: still mitigated by layers (warm-up, navigation memory, workspace memory), not root-caused inside gesture-handler. The trace shows the mitigation works; the library internals remain unread because `node_modules` was not available.
- First visit of each tab still costs what it did. The largest remaining item is Timeline: each bar creates four hold-drag gesture sets (move, start, due, link). The structural fix is one canvas-level gesture with geometric hit-testing; it changes the drag interaction layer and should be done with a device in the loop, not blind. Not attempted here.
- Retained tabs use more memory (five small screens at 66 tasks). Sprints' 192 renders and the web Board console errors are still unexplained.
- Hidden screens keep their local state (filters, scroll) when you return; previously they reset. Expected, and arguably better; tell me if any screen should reset.
- Measurements remain dev-mode Expo Go. Compare with `npx expo start --no-dev --minify`.

## Install and rollback
Back up the workspace; extract the project-root ZIP into ~/Niyarvo preserving local package files; no npm ci; `npx expo start -c`. Roll back to v0.5.13 source without clearing storage.

## Acceptance sequence
1. Open Timeline, Board, Tasks, Sprints once each, then switch between them: after first visits, switches should feel instant. Diagnostics should show `tab shown from retained page: …`.
2. Edit a task on Board, switch to Timeline and Tasks: they show the edit.
3. Type in search (wide layout) then return to a tab: query applied once.
4. Switch project: only the visible tab rebuilds; others fill in on next visit.
5. Drag/resize a bar after returning to Timeline; drag a card after returning to Board.

Review direction: no visual change. Unslop standard by Damir Sokolovsky, CC BY 4.0 (no UI surface touched).

---

## v0.5.15


### CHG-NP-0.5.15-timeline-drag-scroll.md

# CHG-NP-0.5.15 patch — Timeline drag, resize and auto-scroll fixes (Android and web)

## 0. Release handoff

| Field | Value |
|---|---|
| Baseline | `Milvayo-v0.5.15-ROOT-CAUSE-FIX.zip` |
| Release | 0.5.15 patch. `app.json` and `package.json` were not touched, so the version still reads 0.5.15 |
| Scope | Timeline (Gantt) screen only: task bars, resize zones, dependency link handle, chart auto-scroll |
| Dependencies | No new packages |
| Source status | 456 tests pass, 1 skipped (needs `node_modules`). JSX syntax check clean |
| Runtime status | Android (Expo Go): batch 1 confirmed working by the owner. Web on a phone browser: batch 2 confirmed working by the owner. Batch 3 (this file, sections 4 and 5): **Not run** on any device or browser |

The work was delivered in three batches. Each section below says which batch it belongs to.

---

## 1. Batch 1 — Android: the bar did not follow the scroll, and auto-scroll never stopped

### Symptoms
1. Hold a bar and drag it to the edge of the chart: the chart scrolls, but the bar stays behind instead of staying under the finger.
2. After letting go the chart kept scrolling.
3. Scrolling back by hand made it scroll the other way. Only restarting the app stopped it.

### Root causes
- **Bar left behind.** `gesture.native.js` moved the bar by finger travel only. The bar sits inside the scrolled chart, so every pixel the chart scrolled was a pixel the bar lagged.
- **Runaway scroll.** `Timeline.js` clipped each bar to a drawing window around the visible part of the chart, and returned `null` once the bar left that window. While a bar was being dragged far, its view was removed. The gesture handler then never reported the release, so the drag state, the "finger is valid" flag and the 30 ms auto-scroll interval all stayed alive, using the last finger position they had seen. That stale position kept pushing the chart toward one edge, which is why it fought manual scrolling.

### Changes
- `src/gesture.native.js`
  - While lifted, a `requestAnimationFrame` loop copies "chart scroll since the lift" into `scrollX` / `scrollY` shared values.
  - Every frame it also calls the optional `onBeat` callback (a heartbeat).
  - While only the chart is scrolling (finger still), it refreshes the drop target / resize preview every 60 ms.
  - Every way a drag can end now reaches `onDrop` or `onCancel`: release, cancel, the view unmounting mid-drag, and a finished gesture that never reported success (`settle`, 160 ms later).
  - The hook still contains no `setInterval` (an existing test requires that).
- `src/gestureSurface.native.js`: the UI-thread translation of a bar now adds the scroll shift (`translateX.value + scrollX.value`).
- `src/dragFollow.cjs` (new, pure): `scrollSince`, `isStale`, `keepWhole`.
- `src/screens/Timeline.js`
  - A bar (or milestone) being dragged is never clipped or unmounted (`keepWhole`), however far the window moves.
  - The auto-scroll interval has a safety net: if the heartbeat has been silent for 1.5 s, it clears the half-finished drag and stops.

---

## 2. Batch 2 — Web: bars could not be dragged or resized

### Symptom
On the web version (phone browser) holding a bar and moving the finger did nothing useful: no drag and no resize.

### Root cause
Since 0.5.8 the web drag uses pointer events (`src/gesture.web.js`) and ends the drag on `pointercancel`. A touch browser sends `pointercancel` a few moves after a long-press because it starts panning the page. Checked in real Chromium with touch emulation on a stand-in page:

| Variant | Result |
|---|---|
| Current logic | `pointercancel` after 3 moves, drag lost |
| Scroller switched to `overflow: hidden` + `touch-action: none` at the lift | Same cancel after 3 moves (touch-action is fixed when the touch starts) |
| Non-passive `touchmove` handler registered at the lift | All 24 moves delivered, normal release |

### Changes
- `src/gesture.web.js`
  - At the lift it registers non-passive `touchmove`, `selectstart` and `contextmenu` blockers, and removes them on drop or cancel. They are not registered at first contact, so ordinary swipes still scroll the chart and page.
  - If the view unmounts mid-drag it calls `onCancel`, so nothing stays stuck.
  - Its 30 ms tick calls `onBeat`.
- `src/screens/Timeline.js`: the heartbeat watchdog from batch 1 now runs on web as well.

---

## 3. Batch 3 — Dependency lines stay attached on Android

### Symptom
On web, a task's dependency lines stayed attached to its bar during a drag. On Android they detached until release.

### Root cause
Dependency lines are drawn from task dates. On Android a *move* did not preview its dates (only resizes did); the bar slid on the UI thread instead, so the lines kept using the old dates until the drop.

### Changes
- `src/screens/Timeline.js`: every drag (move, resize start, resize due) now previews its dates on every platform, and bars no longer use the UI-thread `animate` translation. The dependency lines follow the preview, exactly as on web.
- **Behaviour change:** on Android a moved bar now steps by whole days, like on web. It no longer glides smoothly with the finger.
- `tests/native-worklets-hotfix.test.cjs`: the old assertion that required `animate={Platform.OS !== 'web'}` was replaced with the new contract (no `animate`, previews on all drags).

---

## 4. Batch 3 — New rule: a resize is a duration modification

**Rule.** A resize of a task in the Timeline is a duration modification. Dragging the left or right edge of a bar changes how long the task lasts; the opposite end stays fixed. A move shifts both dates and never changes the duration.

- Duration is counted in whole calendar days, both ends included, and is never below 1 day.
- Resizing the right edge keeps the start; resizing the left edge keeps the due date.
- History text for a resize: `Changed duration of "Build" from 5 days to 8 days (2026-11-02 to 2026-11-09)`. A move still reads `Moved "Build" to <date>`. The old texts "Changed start of…" and "Changed due date of…" are gone.
- Where it lives: `src/timelineEdit.cjs` (new, pure: `apply`, `durationDays`, `commitLabel`, `isResize`), used by `Timeline.js`; written down in `AGENTS.md` under "Timeline rules".
- Not changed: stored data format, the model function `resizeTask` in `model.cjs` (it keeps its own tested behaviour), and release-metadata invalidation on date changes.

---

## 5. Files changed

| File | Batch | Change |
|---|---|---|
| `src/dragFollow.cjs` | 1 | new |
| `src/gesture.native.js` | 1 | rewritten hook (scroll follow, heartbeat, guaranteed end) |
| `src/gestureSurface.native.js` | 1 | adds scroll shift to the bar translation |
| `src/gesture.web.js` | 2 | touch blockers at the lift, unmount cancel, heartbeat |
| `src/screens/Timeline.js` | 1, 2, 3 | whole/pinned dragged bar, watchdog, previews on all drags, shared edit rules, duration labels |
| `src/timelineEdit.cjs` | 3 | new |
| `AGENTS.md` | 3 | "Timeline rules" section |
| `tests/timeline-drag-scroll-0515.test.cjs` | 1, 2, 3 | new, 12 tests |
| `tests/native-worklets-hotfix.test.cjs` | 3 | one assertion replaced |
| `docs/changelogs/modern-code/CHG-NP-0.5.15-timeline-drag-scroll.md` | 1–3 | this file |

No `summary.md` is kept in the project; this changelog is the record.

---

## 6. Verification

| Check | Result |
|---|---|
| `node --test tests/*.test.cjs` | **Pass**: 456 pass, 1 skipped, 0 fail (source-level) |
| JSX syntax (TypeScript parser, JS/JSX mode) on changed files | **Pass**: 0 syntax errors |
| Chromium touch experiment (stand-in page, section 2) | **Pass**: confirmed the cause and the fix mechanism |
| Android, batches 1 and 2 behaviour | **Pass** (owner confirmed) |
| Web on a phone browser, batch 2 | **Pass** (owner confirmed) |
| Android and web, batch 3 (lines attached, duration rule) | **Not run** |
| `npx expo install --check`, Expo Go / `npx expo start` | **Not run** (no `node_modules` or `package.json` in this environment) |

A source-level test is not runtime acceptance. The real app was never started in this environment.

## 7. Acceptance sequence (batch 3)

1. Android and web: drag a task that has dependency lines. The lines stay attached to the bar for the whole drag.
2. Drag the right edge out and in, then the left edge. After release the history says "Changed duration of…" with the old and new number of days; the other end did not move.
3. Move a task. Its length is unchanged and the history says "Moved…".
4. Drag a bar to the chart edge: the chart scrolls with it and stops when you let go. Scroll by hand afterwards: nothing pushes the chart.
5. Hold the dot at the end of a bar and drag to another row: the link still works and the target row is highlighted.

## 8. Risk and rollback

- Risk: on Android every day-step now re-renders the Timeline (as resize already did). If it feels slow with very many tasks, report the number of tasks.
- Risk: the 1.5 s heartbeat watchdog could clear a preview if the JavaScript thread is blocked for longer than that. The drop itself still commits.
- Rollback of batch 3 only: restore `src/screens/Timeline.js` and `tests/native-worklets-hotfix.test.cjs` from the batch 2 zip; delete `src/timelineEdit.cjs`; remove the "Timeline rules" section from `AGENTS.md` and the batch 3 tests.
- Full rollback: restore `src/gesture.web.js`, `src/gesture.native.js`, `src/gestureSurface.native.js`, `src/screens/Timeline.js` and `tests/native-worklets-hotfix.test.cjs` from `Milvayo-v0.5.15-ROOT-CAUSE-FIX.zip`; delete `src/dragFollow.cjs`, `src/timelineEdit.cjs` and `tests/timeline-drag-scroll-0515.test.cjs`.

### CHG-NP-0.5.15.md

# CHG-NP-0.5.15 — Root cause of the first-open Timeline→Overview bounce removed (replaces the 0.5.13 mitigations)

## Root cause (verified in source, react-native-gesture-handler 3.3.0)
`src/v3/detectors/VirtualDetector/InterceptingGestureDetector.tsx`:
1. The detector keeps a `mode` state. It starts `DEFAULT` unless its own `gesture` prop says otherwise (`useState(gesture?.config.shouldUseReanimatedDetector ? REANIMATED : …)`).
2. The mode chooses the wrapper component: `HostGestureDetector` (DEFAULT) vs `ReanimatedNativeDetector` (REANIMATED).
3. `VirtualDetector.tsx` calls `setMode(REANIMATED)` in an effect when its gesture has worklet callbacks (`hasWorkletEventHandlers`: a callback carrying `__workletHash`).

So the first Timeline bar mounted under a detector with no gesture flipped the mode, changed the wrapper's element type, and React remounted everything under it. The detector wrapped the entire app, hence: StoreProvider remounted ("Opening local workspace…"), Shell state reset, Overview. Once per launch because the mode never flips back. Web has no such detector. This matches the 0.5.12 trace (`shell unmounted/mounted` with no navigation request, same run ID) and the screen recording.

## Fix
- **`src/TimelineGestureHost.native.js`** (new): an `InterceptingGestureDetector` seeded with an inert gesture (`useTapGesture({ enabled: false, onActivate: () => { 'worklet'; } })`). The seed makes the detector start in REANIMATED mode, so the wrapper type never changes. The seed is disabled and does nothing.
- The detector is scoped to **Timeline** (the only screen using RNGH virtual detectors; Board uses PanResponder) instead of wrapping the app. `TimelineGestureHost.js` is a plain fragment for web/fallback. Detector host views are `display: contents`: no layout change.
- `src/AppGestureRoot.native.js` is now only `GestureHandlerRootView`.
- **Removed**, because they only existed to hide the remount: the root gesture warm-up and its three-frame gate, the navigation memory module, and the in-memory workspace copy in the store.
- **Tripwire added**: Shell must mount once per JS run; a second mount records `UNEXPECTED SHELL REMOUNT #n` in diagnostics (Fast Refresh in development also trips it).
- Version 0.5.15. No dependency, data or visual changes. Retained tabs (0.5.14), progressive Board cards and deferred first mounts (0.5.13) are unchanged.

## Verification
- 446 tests pass with `node_modules` present (445 + 1 skipped without it). With your real `package.json`: 446/446.
- New library guard test (runs when `node_modules` exists): fails loudly if a gesture-handler upgrade changes how the detector derives its mode, the wrapper selection, the `setMode` call, or what counts as a worklet callback.
- Both symbols (`InterceptingGestureDetector`, `useTapGesture`) confirmed as public exports of 3.3.0.
- Not run: any device.

## Risk and rollback
This removes the safety nets added in 0.5.13, on purpose, so a regression is visible instead of hidden. If the bounce returns, diagnostics will show `UNEXPECTED SHELL REMOUNT`; restore v0.5.14 (still has the warm-up and memory layers) and send the trace. The one thing I could not exercise is the seeded disabled gesture on Android. If it threw at startup the app would fail on first Timeline mount, with a red screen naming the gesture.

## Acceptance sequence
1. Fully close Expo Go, reopen, tap Timeline once: it stays on Timeline.
2. Export diagnostics: expect no `UNEXPECTED SHELL REMOUNT` and no `shell unmounted`.
3. On Timeline: hold-drag a bar, drag its left and right edges, drag a dependency link handle; scroll the timeline both ways.
4. Switch away and back (retained page); repeat step 3.

Review direction: no UI change. Unslop standard by Damir Sokolovsky, CC BY 4.0.

---

## v0.5.16



# NP-0.5.16 — Governance buttons

- Portfolios "Open" and Programs "Open project" / "Open" now select the project and open its governance detail in Projects (previously they only switched the active project silently).
- "Edit portfolio" and "Edit program" now show the editor in place of the card (previously the form sat inside the collapsed "Manage …" section at the top, so nothing visible happened).
- "Duplicate as template" opens the new project's detail so the result is visible.
- Projects detail only renders for the selected project (no stale subtitle or wrong-project governance).
- Tests: tests/governance-open-project-0516.test.cjs. Full suite: 456 pass, 0 fail. Device/browser run: Not run.
- Rollback: restore ModernApp.js and src/screens/{Projects,Portfolios,Programs}.js from the previous ZIP.

---

## v0.5.17



# NP-0.5.17 — Dead-code audit, Batch 1

- Board: the "Upcoming dates" Power-Up now shows a list of open tasks due in the next 30 days (tap to open the task). Previously the toggle had no effect.
- Tasks: saved views now save and restore the tag filter; the constant priority/owner values are no longer written. Old views load unchanged (tag filter defaults to "All").
- Costs: removed an unused state variable.
- Schema: `savedViews[].filters.label` added (optional string).
- Tests: tests/batch1-controls-0516.test.cjs. Full suite: 460 pass, 0 fail. Device/browser run: Not run.
- Rollback: restore src/screens/{Board,Tasks,Workspace}.js, src/planning.cjs and schemas/niyarvo.project.v1.schema.json from the previous ZIP.
- Remaining audit batches (2–4): docs/qa/modern-code/NP-QA-0.5.16-dead-code-audit.md.

---

## v0.5.18



# NP-0.5.18 — Dead-code audit, Batch 2

- Store: removed three actions that no screen called: `moveList` (superseded by `moveListTo`, used by Board drag), `moveTaskToList` and `setGovernanceDoc` (`setGovernanceDocValue` / `setGovernanceDocStatus` are the ones in use). No UI or data change.
- Tests: tests/batch2-store-api-0518.test.cjs.
- Rollback: restore src/store.js from the previous ZIP.

---

## v0.5.19



# CHG-NP-0.5.19 patch — Import project and Restore workspace on Android

## 0. Release handoff

| Field | Value |
|---|---|
| Baseline | Niyarvo_0_5_18.zip (with `src/navigationMemory.cjs` removed by the owner) |
| Release | 0.5.19 patch. `app.json` and `package.json` not touched, so the version still reads 0.5.15 |
| Scope | Backup screen file picking, store error reporting, recovery snapshot size budget |
| Dependencies | No new packages |
| Source status | 467 tests pass, 1 skipped (needs `node_modules`), 0 fail. JSX syntax clean |
| Runtime status | Android: **Not run**. Web and iOS: **Not run** |

## 1. What was wrong

**Android could not read the chosen file.** `Backup.js` used `expo-document-picker` (which copies the file into the app cache) and then read it with `new File(uri).text()`. That is the exact path that failed on Android Expo Go in v0.3.2: the cached file was reported unreadable with permission errors. HOTFIX2 (v0.3.2) fixed it with `File.pickFileAsync` (the system picker), and the owner confirmed that import worked. The modern Backup screen later went back to the DocumentPicker path. The fixed helper, `pickAndroidJsonText` in `src/importFiles.cjs`, and its tests were still in the project, but nothing called it. Both **Import project** and **Choose workspace .json** share one picker function, so both failed together.

The DocumentPicker call also listed only `application/json`, `text/json` and `text/plain`. A JSON file labelled `application/octet-stream` could not be selected at all.

**Failures were hidden.** When an import or restore failed inside the store, the screen showed a generic message (`Import failed; no projects were replaced.` / `Workspace restore failed`) instead of the actual reason.

**A trap that import success would have exposed.** Every restore or import stores a full snapshot of the previous workspace. Restoring the 2 MB fixture three times pushed the saved workspace past 2 MB; single rows of about that size are a known read limit on Android storage, which would stop the app loading the workspace.

## 2. Changes

- `src/screens/Backup.js`: Android uses `pickAndroidJsonText(File)` (system picker, every file type offered, size checked, BOM stripped). iOS keeps the DocumentPicker path; web keeps the HTML file input (now also strips a BOM). A cancelled or failed pick now shows "No file selected." instead of nothing.
- `src/store.js`: `trans` records the real error; `importProject` and `restoreWorkspace` return it. When a transaction changes recovery snapshots, `fitBackups` keeps them within a size budget and says so if it removed any.
- `src/backupBudget.cjs` (new): keeps the newest snapshots, drops the oldest above 1.5 MB, always keeps the newest one unless it alone would exceed 1.9 MB. The live workspace is never changed.
- `tests/import-android-0519.test.cjs` (new, 6 tests).

## 3. Verification

- The owner's fixture `Northstar-Studio-FULL-WORKSPACE-HIERARCHY-GOVERNANCE-v2.json` (about 2 MB) run through the app's own model code in Node: restore gives 5 projects, 1 program, 2 portfolios; Import project gives all 5 projects, 41/40/41/40/39 tasks. The data is valid; the failure was file access.
- Eight repeated restores of that fixture with the budget: saved workspace stays at about 1.15 MB with 2 snapshots (without it, it passed 2 MB by the third).
- Installed SDK 58.0.13 `File.pickFileAsync` signature checked in `node_modules`: `{ mimeTypes, multipleFiles }` returning `{ result: File, canceled }`.
- **Not verified**: the Android system picker on the owner's device. In SDK 58 the new API reports any picker failure as a cancel, so a failed pick shows "No file selected." with no further detail.

## 4. Limits

- A workspace restore replaces everything, as designed; a snapshot is taken first (subject to the budget above).
- **Import project** with a workspace file imports its projects only (no programs or portfolios). Use **Choose workspace .json** for the hierarchy.
- The main project switcher is intentionally flat; Program > Portfolio > Project nesting is under Governance > Programs.

## 5. Acceptance sequence

1. Backup > **Import .json file**, choose the Northstar file. Expected: "Imported 5 projects. … is open." Open the project switcher: 5 new projects.
2. Backup > Full workspace recovery > **Choose workspace .json** > the Northstar file. Expected: "5 project(s) in selected workspace." Then **Restore entire workspace** > **Confirm**. Expected: "Whole workspace restored; prior snapshot retained."
3. Governance > Programs: 1 program with 2 portfolios and their projects.
4. Close and reopen the app: workspace loads.
5. Cancel the picker: "No file selected."
6. If a step fails, send the exact message shown on the Backup screen.

## 6. Rollback

Restore `src/screens/Backup.js` and `src/store.js` from Niyarvo_0_5_18.zip and delete `src/backupBudget.cjs`.

---

## v0.5.20


### CHG-NP-0.5.20-fix-local-today.md

# CHG-NP-0.5.20 fix: one local "today" (no version bump)

Audit finding 1. "Today" came from the UTC clock in the domain rules and from the device clock in the UI, so overdue badges, automations, health, burndown and new-task dates disagreed for part of every day (for example Auckland at 08:00 on 2 Nov: UTC said 1 Nov). No dependency, app.json, package.json or saved-data change.

## Change
- New `src/utils/localDay.cjs`: `localDay()` returns the device-local date as `YYYY-MM-DD`.
- Every `new Date().toISOString().slice(0,10)` used as "today" now calls it: `kanbanUX`, `powerUps`, `agile` (burndown default), `operations` (health), `automation`, `model` (dueDays), `taskWorkflows` (dueDays), `modernBridge` (`day()`), `store.js` (`sweepDue`), `Sprints` (new sprint dates), `TaskSheet` (log time), `Workspace` (time log default), `Programs` (today marker), `Management`, `governance/data.js` (`TODAY`).
- `store/data.js`: `isOverdue` reads the date when it is called. `TODAY` there is still read once at start (marked `shortcut:`), so the Timeline "today" line needs an app restart after midnight.

## Not changed
- Sprint history events and `completedAt` are still bucketed by their UTC date in `agile.burndown` (same rule on both sides, and sprint history semantics are frozen in AGENTS.md).
- Aging automation compares `updatedAt` days in UTC; the error is at most one day.

## Tests
- New `tests/domain/local-day.test.cjs` (2 tests): local date in Auckland and Los Angeles, and a scan that no source file takes "today" from `toISOString()` any more.
- `node tests/run-all.cjs`: 494 tests, 493 pass, 0 fail, 1 skipped, in each of UTC, Pacific/Auckland, America/Los_Angeles and Asia/Kolkata.
- JSX syntax and undefined-name check on all changed files: Pass. Expo Go / device run: **Not run**.

## Reversible install
Copy the files over the project. To undo: delete `src/utils/localDay.cjs` and the new test, and restore the changed files from the batch 03 files.

### CHG-NP-0.5.20-folder-structure.md

# CHG-NP-0.5.20 folder structure (no version bump)

Moves code into folders and subfolders. No behavior, dependency, app.json, package-lock.json or saved-data change. package.json: only the `test` script changes, and clean.py does that on your machine (the zip does not contain package.json).

## New layout
- `App.js` (root): 3-line Expo entry shim. The app root is now `src/app/App.js`; `ModernApp.js` is `src/app/ModernApp.js`.
- `src/app/navigation/`: navigationIntent, navigationQueue, pageRetention, visitedTabs, freezeCell.
- `src/screens/`: overview, board (Board, BoardManagement), timeline, tasks (Tasks, TaskSheet), delivery, workspace (Workspace, Backup), management, governance (Projects, Portfolios, Programs, EnterprisePM, `pm/` for PmDocs, PmRisks, PmWbs, pmui).
- `src/components/`: `shell` (Menus, Bars, ScreenErrorBoundary, DrawerMotion), `notice` (IslandNotice, NoticeMotion, noticePlacement), `inline` (InlineEditor, DisclosureGlyph, CompactTools), `charts`.
- `src/ui/`: ui, uiBase, uiControls, uiLayout, downloadText; `src/ui/theme/`: theme, design.
- `src/domain/`: model, modernBridge, operations, planning, programs, projectRelations, governanceCore, governanceSummary, taskSchema, taskWorkflows, powerUps, automation, agile, boards, scheduling, scheduleProject.
- `src/timeline/`: gantt, gantt-window, timeline-window, timelineWindow, timelineDisplay, timelineEdit, timelineGeometry, timelineViewport.
- `src/board/`: boardColumns, boardDragContext, boardDragMath, boardInteractions, kanbanUX, boardGesture, boardMotion.
- `src/gestures/`: gesture, gestureSurface, TimelineGestureHost, dragFollow, scrollLimits, viewport.
- `src/store/`: store, data, latestWriter, backupBudget, importFiles. `src/utils/`: progressiveCount.
- `src/governance/` and `src/diagnostics/` keep their place (their `screens/` and DiagnosticsPanel moves: governance/screens -> screens/governance/pm).
- `tests/<group>/*.test.cjs` (app, board, diagnostics, domain, gestures, governance, store, timeline, ui), helpers in `tests/helpers/`, runner `tests/run-all.cjs`.

## Other changes
- First line of every code file is a comment with its own path.
- Removed the 6 empty root files `board`, `overview`, `sprints`, `tasks`, `timeline`, `settings`.
- Relative imports and requires rewritten in all moved files, scripts/performance-benchmark.cjs and scripts/schedule-smoke.cjs. Code bodies are untouched.
- Tests: paths and `__dirname` depth updated; 17 source-text assertions that matched an import path now match the new path. Their checks are unchanged.
- New `tests/app/folder-structure.test.cjs` (5 tests): no stray root code, src has folders only, tests in groups, path comment on every file, every relative import resolves.
- AGENTS.md has a new Folder structure section; README.md and AGENTS.md source paths updated.

## Checks
- `node tests/run-all.cjs`: see summary.md for the final count.
- Same number of tests as before plus the 5 new ones; every old test passes.
- Expo / Metro / web / device run: **Not run** (no node_modules or device in the build environment).

## Reversible install
`clean.py` removes only the old paths of moved files, then unzips over the project. To undo: restore the previous zip (or `git checkout` the previous commit) after deleting `src/` and `tests/`. Keep `package.json.backup` to restore the old `test` script.

### CHG-NP-0.5.20-refactor-batch01.md

# CHG-NP-0.5.20 refactor batch 01 (no version bump)

Behavior-identical refactor of the two largest screens. No dependency, app.json, package.json or saved-data change.

## Moves
- `src/screens/Board.js` (797 -> 646 lines): `AddCard`, `NewListSheet`, `BoardsManager` (with `BoardNameEditor`) now live in `src/screens/BoardManagement.js`; the drag-context helpers `newCtx`, `slotFor` live in `src/boardDragContext.cjs`.
- `src/screens/Timeline.js` (778 -> 737 lines): `roundPath`, `distToPath` live in `src/timelineGeometry.cjs`.
- `refreshMax` was copied in both screens; it now lives once in `src/scrollLimits.cjs`.
- Function bodies were moved verbatim. Unused imports left behind by the move were removed from `Board.js` (`Pill`, `Segmented`, `Sheet`, `STATUS`).

## Tests
- New `tests/refactor-batch01-0521.test.cjs` (5 tests): path rounding, distance to path, scroll limits, drop slot, and that the screens use the new modules.
- `npm test` style run (`node --test tests/*.test.cjs`): 477 tests, 471 pass, 5 fail, 1 skipped. The 5 failures also fail on the untouched v0.5.20 zip: the `examples/` fixture folder (ATLAS-MOCK.project.json, atlasproject.json) is not in the zip.
- JSX syntax and undefined-name check on all changed files: Pass. Expo Go / web run: **Not run**.

## Reversible install
Copy the changed files over the project. To undo: delete the 4 new files and restore `Board.js` and `Timeline.js` from the v0.5.20 zip.

### CHG-NP-0.5.20-refactor-batch02.md

# CHG-NP-0.5.20 refactor batch 02 (no version bump)

Behavior-identical refactor of the app shell and the shared UI. No dependency, app.json, package.json or saved-data change.

## App shell
- `ModernApp.js` 560 -> 315 lines. It keeps `NAV`, `TABS`, `SCREENS`, `CachedPage`, `Shell` and `ModernApp` (tests and navigation rules read them there).
- New `src/shell/Menus.js`: `Brand`, `NavItem`, `ProjectDrawer`, `ProjectCard`, `Sidebar`, `SideMenu`. The group list that was written out twice (sidebar and phone menu) is now one `NavGroups` component. `Sidebar` / `SideMenu` get the list as a `nav` prop.
- New `src/shell/Bars.js`: `TopBar`, `TabBar` (gets `tabs` as a prop).
- New `src/shell/ScreenErrorBoundary.js`.
- Unused imports left behind by the move were removed from `ModernApp.js`.

## Shared UI
- `src/ui.js` 328 lines -> a 9-line re-export file. Every screen still imports from `../ui`; all 19 exports are unchanged.
- New `src/uiBase.js` (T, Card, Pill, Avatar, Bar, useWide), `src/uiControls.js` (Chip, Segmented, Button, IconBtn, Input), `src/uiLayout.js` (Sheet, Page, Grid, Cell, Stat, SectionTitle, Empty), `src/downloadText.js`.
- No import cycles (base <- controls <- layout).

## Tests
- New `tests/refactor-batch02-0522.test.cjs` (5 tests) and two helpers, `tests/shell-source.cjs` and `tests/ui-source.cjs`, which read the shell / UI source across the new files.
- 8 older source-text tests now read through those helpers because the text they look for moved: brand-mark-web, diagnostics-048, governance-migration-059, navigation-drawer, ui-automation-052, enterprise-hierarchy-055, modern-design-regression. Their checks are unchanged.
- `node --test tests/*.test.cjs`: 482 tests, 476 pass, 5 fail, 1 skipped. The 5 failures are the same missing-`examples/`-folder fixtures as the original v0.5.20 zip.
- JSX syntax and undefined-name check on all changed files: Pass. Expo Go / web run: **Not run**.

## Reversible install
Copy the files over the project. To undo: delete the 10 new source/test files listed in summary.md and restore ModernApp.js, src/ui.js and the 7 patched tests from the batch 01 zip.

### CHG-NP-0.5.20-refactor-batch04.md

# Refactor batch 04 (audit fixes 8, 9, 10)
- 8: restore-entire-workspace now checks the 5 MB limit (bytes). Import path already did.
- 9: `parseBackupJson()` rejects null, numbers, strings and arrays with "Expected a Niyarvo backup".
- 10: removed governance/theme.js and governance/ui.js pass-through files.
Tests: 475, 0 fail. Device run: Not run. Undo: restore the previous zip.

### CHG-NP-0.5.20-refactor-batch05.md

# Refactor batch 05 (ponytail audit 1-5)
- Snapshot size budget runs on every edit (was: only when snapshots changed).
- Web picker rejects files over 5 MB before reading them.
- Removed dead exports in governance/data.js; Delivery/Sprints share addDays from store/data.js.
- package.json version line (yours): "version": "0.5.20",
Tests: 477, 0 fail. Device run: Not run. Undo: restore the batch 04 zip.

### CHG-NP-0.5.20.md

# CHG-NP-0.5.20 — Dead-code audit, Batch 3 (model functions the UI never calls)

## 0. Release handoff

| Field | Value |
|---|---|
| Baseline | niyarvo_0_5_19.zip |
| Release | 0.5.20 patch. `app.json` and `package.json` not touched |
| Scope | Remove 7 superseded functions; wire `ageInDays` into Board; no data or UI change |
| Dependencies | No new packages |
| Source status | 472 tests: 471 pass, 1 skipped (needs `node_modules`), 0 fail. JSX syntax clean (TypeScript parser) |
| Runtime status | Web, Android, iOS, Expo Go: **Not run** |

## 1. Method
"No caller in the app" was not accepted as "dead". Every Batch 3 function was compared with what the screen does instead, and was removed only where the replacement was found and the same behaviour confirmed. Everything else was kept.

## 2. Removed (function and its tests)
| Function | Replaced by |
|---|---|
| `model.shiftTask`, `model.resizeTask` | `timelineEdit.apply` + `modernBridge.patchTask` (clears verified/merged, reconciles scheduling, rejects inverted dates) |
| `model.boardLaneAt`, `model.boardAutoScrollDelta` | Board's own edge-scroll and drop code (`EDGE_X`, `SPEED`, `placeTask`) |
| `model.stats`, `model.blankProject` | nothing used them |
| `operations.portfolioStats` | `modernBridge.projectView` (health and progress via `operations.health`) and the Portfolios screen's own task counts |

## 3. Kept on purpose (tested logic for features the UI does not expose)
- `kanbanUX.filterCards`, `dateBucket`: due-date (overdue/today/tomorrow/week/month), owner, priority and tag filters. Board has only a text filter.
- `kanbanUX.resolveDropIndex`: drop position under an active filter (Board's current approach not run on a device).
- `kanbanUX.updateLabels`: trim, dedupe, cap; the live label path does not clear verified/merged.
- `taskWorkflows.bulkUpdate`: bulk priority, stage and owner; blockers checked against proposed statuses.
- `taskWorkflows.descendants`, `hierarchyOrder`: subtasks show only as a flat list in the task sheet; there is no tree view.
- `operations.capacitySummary`: counts logged hours; the Resources screen ignores them.
Decision for you: wire these into screens (for example due-date filters on Board, a Subtasks tree) or delete them later.

## 4. Wired
- `powerUps.ageInDays` replaces the inline age maths in the Board card ("Updated Nd ago"). Same result for valid dates; an unreadable date now shows 0d instead of "NaNd".

## 5. Tests
- Removed with their functions: the stats test, the edge-scroll and lane tests.
- Ported to the live path (coverage kept): date edit clears `verified`/`merged` (gantt, scheduling-integration), resize clamps and rejects inverted dates (project-navigation-timeline), the shiftDate test (board), the `portfolioStats` assertion dropped from the portfolio test.
- New: `tests/batch3-dead-model-0520.test.cjs` (7 tests): removed names are gone, kept names are still exported, live date-edit and resize paths, `operations.health`, `ageInDays` wiring.
- Count: 468 -> 472.

## 6. Still open from the audit (not changed)
- GitHub preview refresh: `powerUps` fetchPublicPreview, setPreview, endpoint have no Refresh button.
- iOS import still copies through DocumentPicker and reads with `new File(uri).text()`, the shape that failed on Android before 0.5.19; the hardened reader (`importFiles.readPickedJsonAsset`) is unused.
- `planning` filterSort/progressRollups/projectProgress, and the Timeline helpers: need a keep/delete decision.
- Not on the audit: `taskWorkflows.query` and `page` have no app caller (still tested).

## 7. Finding (not changed)
Bulk status to Done depends on selection order. Tested on the live path: with B depending on A, selecting A then B completes both; B then A fails with "Complete dependency tasks first: A". `bulkUpdate` (kept) does not have this problem but does not place cards in board lanes, so it is not a drop-in fix.

## 8. Acceptance (device)
1. Board > Board tools > Card age on: open cards show "Updated Nd ago"; Done cards show none.
2. Timeline: drag and resize a bar: dates and history text as before.
3. Portfolios and Resources screens open normally.

## 9. Rollback
Restore `src/model.cjs`, `src/operations.cjs`, `src/screens/Board.js` and the six edited test files (board, gantt, model, operations-boards, project-navigation-timeline, scheduling-integration) from niyarvo_0_5_19.zip; delete `tests/batch3-dead-model-0520.test.cjs`.

---

## v0.5.21


### CHG-NP-0.5.21-performance.md

# v0.5.21 performance batch
Why: your v0.5.20 report showed Projects 96 renders (many 100-138 ms, timer stalls up to 1.3 s), Tasks max 146 ms.
Cause: text fields saved into the store on every key (full save + whole-app redraw per key).
- `Input` has a new `lazy` option (src/ui/commitBuffer.cjs): typed text stays in the field and is saved 300 ms after you pause, on leaving the field, on Enter and when the screen closes. Used on project governance, documents, risks, WBS, owner/list rows, and the task sheet text fields.
- projectMetric (project totals) is cached per project object (Projects, Portfolios, Programs).
- Recovery-snapshot sizes are measured once per snapshot (keeps the size check from batch 05 cheap).
- Not touched: Timeline / Board gestures and drag code.
Version label: 0.5.21. app.json / package.json are yours: set "version": "0.5.21".
Tests: 482, 0 fail. JSX parse of all 63 source files: 0 errors. Device run: Not run. Undo: restore the batch 05 zip.

### CHG-NP-0.5.21-releases-edit-fix.md

# v0.5.21 fix: Releases "Edit metadata" did nothing
Cause: the button filled the form, but the form is inside a closed "Create or edit release" card at the top of the page, so nothing visible happened.
Fix: Edit metadata now opens that card (title changes to "Edit release") and scrolls to the top. `Fold` accepts optional `open` / `onToggle`. The card closes after a successful save.
Tests: 483, 0 fail. Device run: Not run. Undo: restore the batch 06 zip.

---

## v0.5.22

*No standalone changelog for this version was present in the recovered archives. No implementation claims are inferred.*

---

## v0.5.23



# CHG-NP-0.5.23 — performance patches (from the v0.5.22 report, run mvyh4x0e)

app.json / package.json untouched. Bump the version yourself when you accept the batch.

## Patch 1 — hidden Board does no deferred work
- Evidence: 8 Board renders of 168-239 ms in a row at 23:43:28-32 while Overview was on screen; Overview timer delays 495 and 652 ms at the same time.
- Cause (from code, not measured): retained Board kept mounting cards (6 per frame) and extra columns after the tab was hidden.
- Change: `useScreenActive()` in `src/store/store.js` (set by `StoreFreeze`). `ListColumn` pauses its card reveal and `Board.ensureColumns` pauses column mounting while hidden; both catch up when the tab is shown.
- Files: src/store/store.js, src/screens/board/Board.js.

## Patch 2 — Testing screen
- Evidence: Testing first render 361 ms (avg 307 ms), navigation 617 ms.
- Cause: every check drew a card with 4 chips at once, `tasks.find` per check, `checks.filter` per status tile.
- Change: first 25 checks, "Show more" for the rest, one Map for task titles, one pass for the four counts.
- Files: src/screens/delivery/Delivery.js. Test regex in tests/diagnostics/diagnostics-048.test.cjs now allows `useMemo`.

## Patch 3 — Projects
- Evidence: Projects 65 renders, 100-142 ms, repeated every few seconds; timer delay 1250 ms (23:45:10).
- Cause (from code, not measured): the edit fields (name, code, description) lived in `Projects`, so each keystroke re-rendered every project card; in project governance the 10-document list rebuilt on every field commit.
- Change: `ProjectCard` (memo, own edit state) and `DocGroups` (memo on docs / wbs / budget / risks only). `docProgress` is computed once per document row, not twice.
- File: src/screens/governance/Projects.js.

## Patch 4 — Timeline bars
- Evidence: Timeline 114 renders, max 179 ms (23:42:58).
- Cause (from code, not measured): `TaskBar` was not memoised, so every drag step and scroll window change re-rendered every drawn bar (four gesture recognizers each).
- Change: `TaskBar` is `memo`. Timeline passes stable wrapper callbacks (`bar.onPreview / onCommit / onLink`) that call the latest closures. Gesture code itself is unchanged: `TaskBar` already read its callbacks from `live.current` at event time.
- File: src/screens/timeline/Timeline.js. **Needs a drag / resize / link test on the phone.**

## Patch 5 — search boxes and Tasks counts
- Evidence: Tasks 29 renders avg 40 ms, max 123 ms; Board filter box.
- Change: Tasks search and Board "Filter cards" use `lazy` Input (filter applies 300 ms after typing pauses, or on blur / Enter). Tasks tag list and per-status counts computed in one pass.
- Files: src/screens/tasks/Tasks.js, src/screens/board/Board.js.

## Tests
- tests/app/hidden-work-0523.test.cjs (3), tests/app/render-scope-0523.test.cjs (5), source checks plus one real run of the stable-callback pattern. npm test: 492 run, 491 pass, 0 fail, 1 skipped.
- JSX parse (TypeScript) of 64 src files: 0 errors.
- Timeline drag, Board scroll, Projects typing on device: **Not run**.
- Device / Expo Go / web: **Not run**. Render times after the patches: **not measured**.

## Reversible install
Replace the touched files with the ones from the previous zip. No data or storage change.

---

## v0.5.24



# CHG-NP-0.5.24 — `.niyav` compressed backups with optional password protection

## 0. Release handoff

| Field | Value |
|---|---|
| Baseline | Milvayo_v0_5_23.zip |
| Scope | Backup screen, export/import helpers, `.niyav` format. Versions not bumped (project rule) |
| Dependencies | **Four new packages**, see section 5. `package.json` and `package-lock.json` are not in the ZIP |
| Source status | `npm test`: 507 pass, 0 fail, 1 skipped (needs `node_modules`). JSX syntax clean |
| Runtime status | Android, iOS, web: **Not run**. `npx expo install --check`: **Not run** |

## 1. What changed

- **Export format choice** in Backup: `.json` (readable, as before but compact) or `.niyav` (compressed).
- **Password protection** for `.niyav`: AES-256-GCM, key from the password by PBKDF2-HMAC-SHA256 (600,000 iterations). Minimum 12 characters, entered twice, never stored, never logged. See `docs/niyav-format.md`.
- **Import** (project and whole workspace) opens `.json`, `.niyav` and protected `.niyav`. A protected file asks for its password, with a Cancel. Wrong password and a modified file give one message: "Wrong password, or the file has been changed."
- **Compact JSON.** Exports are no longer indented: about 40% smaller. Old files still import.
- **Recovery snapshots are left out of backups by default**, with a switch to include them. They are whole older copies of the workspace: they were more than half of the file and can hold data deleted on purpose. This changes what a default `.json` backup contains.

## 2. Measured, with the Northstar workspace

| | `.json` | `.niyav` | protected `.niyav` |
|---|---|---|---|
| Before this change | 1,950 KB | n/a | n/a |
| With recovery snapshots | 1,142 KB | 150 KB | 150 KB |
| **Without snapshots (new default)** | **526 KB** | **69 KB** | **69 KB** |

`.niyav` uses gzip. It does **not** reach 35 KB. Getting near 30 KB needs brotli or lzma, which have no small, Expo Go safe pure-JS implementation; the header has a compression id so one can be added later.

## 3. Safety design

- The format logic (`src/store/niyav.cjs`) is pure and takes its crypto primitives as parameters, so it is tested here against Node's real zlib and crypto, including an independent decoder written only from the documented layout.
- Tested: wrong password, every header byte flipped, ciphertext and tag flipped, truncation, forged iteration counts (refused before any key derivation), compression bomb, unique salt and nonce per file, Unicode-equivalent passwords, empty password never produces an unprotected file.
- A protected export proves the file can be opened (with the key already in memory) before it is saved.
- In the app, `src/store/niyavPrimitives.js` runs known-answer tests (PBKDF2, AES-GCM, gzip) once before any protected file is made or opened, and refuses if a library misbehaves.
- Inflating is streamed and capped at 5 MB, like imports.

## 4. Limits, stated plainly

- **The password-derivation time on a phone is not measured.** 600,000 PBKDF2 iterations take about 0.1 s in Node but run as JavaScript on the phone (Hermes) and could take many seconds. The screen stays responsive and shows a message. If it is too slow, change `DEFAULT_ITERATIONS` in `src/store/niyav.cjs`; files record their own iteration count, so old files keep opening. Do not go below 100,000.
- Protects the exported file only, not data inside the running app.
- Not run on any device: file picking of `.niyav`, sharing a binary file, the password screens, the primitives libraries.
- A cancelled or failed system pick still reports "No file selected." (SDK 58 reports failures as cancels).
- Existing `.json` files from earlier versions import unchanged.

## 5. Install (required before running)

```
npm install fflate@0.8.2 @noble/hashes@1.8.0 @noble/ciphers@1.3.0
npx expo install expo-crypto
```
Without them Metro cannot bundle the Backup screen. The versions are pinned to the APIs the code was written against. If Metro reports an unresolved import, send the message.

USER AFTER TESTING:
added by me the user/developper because the above packages werent enough and the app couldnt bundle:

```
npm install @noble/hashes@1.4.0 @noble/ciphers@1.0.0
```

## 6. Acceptance sequence

1. After installing, `npx expo start -c`, open Backup.
2. `.json`, entire workspace: file opens as JSON, about 0.5 MB.
3. `.niyav` without a password: file is much smaller; import it back (Import project, then Choose workspace file).
4. `.niyav` with a password: short password is refused; mismatched repeat is refused; export works; note how long it took.
5. Import the protected file: asks for the password; wrong password shows the message and allows retry; correct password imports.
6. Check the restored workspace: projects, programs, portfolios.
7. Turn on "Include recovery snapshots" and confirm the file grows.

## 7. Rollback
Restore `src/screens/workspace/Backup.js`, `src/store/importFiles.cjs`, `src/store/store.js`, `src/ui/downloadText.js`, `src/ui/uiControls.js` from v0.5.23 and delete `src/store/niyav.cjs`, `src/store/niyavPrimitives.js`. The four packages can stay installed.

---

## v0.5.25



# CHG-NP-0.5.25 — Backup no longer freezes the app; Backup moves into Settings; Specifications can be edited

## 0. Release handoff

| Field | Value |
|---|---|
| Baseline | Milvayo_v0_5_24.zip |
| Release | 0.5.25. `app.json` version bumped; `package.json` and `package-lock.json` not included (bump `package.json` to 0.5.25 yourself) |
| Dependencies | None added. `@noble/hashes/hmac` ships in the already installed `@noble/hashes`; `pbkdf2Async` is no longer used |
| Source status | 524 tests: 523 pass, 1 skipped (needs `node_modules`), 0 fail. JSX syntax clean (TypeScript parser) |
| Runtime status | Web, Android, iOS, Expo Go: **Not run**. `npx expo install --check`: **Not run** (no network here) |

## 1. Password backup froze the whole app (crash report run mvyjx1i6)
**Cause.** The key for a password is derived with 600,000 rounds of PBKDF2. The library's `pbkdf2Async` only waits on a microtask between slices. A microtask never lets the phone handle a touch, so the JavaScript thread was busy the whole time. Scrolling is handled by the native side, which is why only scrolling still worked and no button or tab responded. There was no progress and no way to stop it.

**Fix.**
- New `src/store/pbkdf2Chunked.cjs`: PBKDF2 in slices of about 16 ms with a real timer wait (`setTimeout`) between slices, so taps and navigation are handled. It reports progress and accepts a cancel signal. Same output as before: files made by 0.5.24 still open, and files made now open in 0.5.24 (same format, same iteration count).
- `niyav.cjs`: `encode` and `decode` accept `onProgress` and `signal` and pass them to key derivation. Cancelling throws `NIYAV_CANCELLED` and no file is written.
- `niyavPrimitives.js`: uses `hmac` from `@noble/hashes` with the chunked loop. The built-in self-test vector (PBKDF2 "password"/"salt"/1000) now also checks the new loop on every device before a protected file is made or opened.
- Backup screen: while protecting or unlocking, a card shows the message, a progress bar with a percentage and a **Cancel** button. Leaving the screen cancels the work as well.

## 2. Backup screen
- Choose **Project** or **Workspace**. Each has a dropdown: Project lists every project (archived ones are marked), Workspace lists this workspace with its project count (there is only one workspace today).
- One **Back up "<name>"** button, the only accent-coloured button on the screen. Unlock was changed to secondary. The file name follows the chosen project.
- `store.backupText(all, {snapshots, projectId})` exports any project, not only the open one; an unknown id throws "Project not found".
- New shared `Dropdown` in `components/inline/CompactTools.js`.

## 3. Backup moved into Settings
- Settings now has two tabs, **General** and **Backup**. The Backup tab holds the whole former screen (export, import, workspace recovery, snapshots, archived projects).
- The separate Backup entry is removed from the drawer menu and the route table. `Projects` points to "Settings → Backup".

## 4. Specifications: add, edit, delete
- Phases, Data schemas, API contracts and Playbooks each have **Add**, an editable form per entry (Save changes) and a confirmed **Delete**. Phases edit stage, goal and exit criteria.
- New `src/domain/specifications.cjs` (`save`, `remove`), exposed as `model.specifications`; store actions `saveSpec` and `deleteSpec` go through the normal project change path (history entry, validation, undo-safe snapshots).
- Deleting a phase clears `phaseId` on tasks that pointed to it. Imported entries are editable now (the old "retained without alteration" rule is gone).

## 5. Tests
- New: `tests/store/pbkdf2-chunked-0525.test.cjs` (same key as Node, yields, progress, cancel, codec round trip, wrong password), `tests/domain/specifications-0525.test.cjs`, `tests/app/backup-in-settings-0525.test.cjs`.
- Updated for the new design: navigation-drawer, single-app-migration-051, niyav-wiring-0524.

## 6. Not verified
- Speed on a real phone. 600,000 rounds in JavaScript on Android may still take a long time; the progress bar will show how long. If it is too slow, lowering the count is a security decision for you (stored in each file's header, so old files keep working).
- Compressing a large backup without a password is still one blocking step (no cancel).

## 7. Acceptance (device)
1. Backup tab, .niyav, password on, back up: progress moves, bottom tabs and the menu still respond, Cancel stops it and no file is saved.
2. Start a protected backup and open another tab: it stops; coming back shows no stuck message.
3. Back up a project other than the open one, then import the file: it is that project.
4. Settings > Backup shows one orange button only.
5. Specifications: add a playbook, edit it, delete it; delete a phase that tasks use.

## 8. Rollback
Restore the changed files from Milvayo_v0_5_24.zip and delete `src/store/pbkdf2Chunked.cjs`, `src/domain/specifications.cjs` and the three new test files.

---

## v0.5.26


### CHG-NP-0.5.26-task-sheet-ux.md

# CHG-NP-0.5.26 — Trello-inspired Standard/Advanced task sheet

## Release checkpoint
- Baseline: user-provided `Milvayo v0.5.25.zip`, Expo and package version 0.5.25.
- Release: 0.5.26. Full source, project-root ZIP. No Git operations, deployment, APK or IPA.
- Scope: task editor presentation, safe project-level label colors, simple Markdown read mode, compact Kanban task cards. **No task ID migration or refactoring of task relationships.**
- User references: two Trello screenshots showing task detail, colored labels and Kanban cards.

## Changes
1. **Standard and Advanced editor modes:** new tasks open in Standard mode. Title, board/status context, colored labels, description, status, schedule, priority, owner, acceptance checks, attachments and activity/comments are immediately discoverable. Advanced includes previously available subtasks, stage, task type, progress, parent task, release, sprint, dependencies, time tracking, custom fields, GitHub references, verification/delivery and deletion. Switching modes does not change task records.
2. **No prominent internal IDs:** task identity removed from the task-sheet title, Board cards, Tasks list and Sprint/Delivery assignment lists. The original immutable task ID remains in the Task Sheet footer. Internal references and ID-based search are unchanged.
3. **Description:** always shown in read mode and can be edited as Markdown source with explicit Save & preview / Cancel. Read mode supports headings, bullets, bold, italic, strikethrough and inline code. HTML is treated as text, not executed. Editing is saved if the sheet is closed; Cancel discards the draft. It is intentionally a lightweight Markdown subset, not a full GFM parser.
4. **Colored labels:** 24 swatches; create/assign labels, reuse existing labels, remove or recolor assigned labels. Colors are shared by label name within each project via optional `labelColors` map. Existing string-array task labels remain unchanged. Without a custom color, a deterministic palette color is used.
5. **Kanban presentation:** colored labels above titles, compact due/checklist/attachment/comment indicators; task IDs removed from cards. The existing long-press drag and double-tap title editing handlers remain in place.
6. **Project import:** model normalization and JSON schema support `labelColors` and preserve it across `.json`, unprotected `.niyav` gzip and password-protected `.niyav` exports.

## Verification
- `npm test`: **527 passed, 1 skipped, 0 failed** (the skipped case predates this change).
- JSX parse: all touched `.js` screens/components parsed with locally available TypeScript JSX parser, no errors.
- Project JSON normalization + `importProject` colored-label round trip: PASS.
- Gzip and AES-256-GCM `.niyav` label-color round trips with independent Node test primitives: PASS.
- Physical Android/iOS, real drag, keyboard + scroll accessibility and visual checks: **NOT RUN**.

## Device acceptance
1. Open Board card: title and colored labels are clear, no internal ID on card. Drag, cancel drag, move between lists, edit title by double tap.
2. Open task: default Standard mode, title first, description read mode always visible, status/schedule near top, comments visible. ID only in small footer.
3. Edit description with `**bold**`, `*italic*`, `# heading`, and list items. Save & preview; reopen and confirm retained. Confirm Cancel discards draft.
4. Create a label, choose one of 24 colors, confirm it appears on Board and Tasks. Recolor an existing label; verify all tasks with that label use that color.
5. Switch to Advanced, inspect every old field (custom fields, GitHub, dependencies, validation, time, subtasks, deletion). Check data survives closing/reopening and project switch.
6. Export a project and workspace as `.json` and `.niyav` (including password-protected). Import into a disposable workspace; verify label colors, comments, task IDs and dependency references are intact.
7. Check mobile keyboard behavior, long descriptions, long labels and UI responsiveness on a real Android device.

## Known limitations
- Markdown read mode is a safe subset: no rich Markdown tables, remote embedded images or clickable links.
- Label colors are per-project, not workspace-global. Recoloring a label affects every task using the same label in that project.
- React Native styling and native touch interactions have not been visually/device tested in this environment.

### CHG-NP-0.5.26-wire-engines.md

# CHG-NP-0.5.26 — Wire the tested engines into the screens (nothing deleted)

## 0. Release handoff

| Field | Value |
|---|---|
| Baseline | 0.5.25 (Milvayo_v0_5_25.zip applied) |
| Release | 0.5.26. `app.json` version bumped; `package.json` and `package-lock.json` not included (bump `package.json` to 0.5.26 yourself) |
| Dependencies | None added |
| Source status | 532 tests: 531 pass, 1 skipped (needs `node_modules`), 0 fail. JSX syntax clean (TypeScript parser) |
| Runtime status | Web, Android, iOS, Expo Go: **Not run**. These are screen changes; please check section 7 on a device |

Nothing was deleted. Every function from the 0.5.24 audit list now has a caller, except the groups in section 4.

## 1. Board
- **Filters** (`kanbanUX.filterCards`, `dateBucket`): a Filters section with Due (any date, overdue, today, tomorrow, next 7 days, next 30 days, no date), Priority, Owner and Tag. The text box now also searches id, description and repository. "High and above" still works with them.
- **Drop position** (`kanbanUX.resolveDropIndex` through the new `dropBefore`): with a filter on, a card dropped at the end of the visible cards lands in front of the hidden card that followed, not at the very end of the list. Without a filter nothing changes.
- **First cards** (`progressiveCount.initialCount`): sets how many cards of a list mount first. Same behaviour as before.

## 2. Tasks and task sheet
- **Search and paging** (`taskWorkflows.query`, `page`): search now covers id, description, repository, owner and tags; Priority and Owner filters added; "Show more" pages with `page`.
- **Sorting** (`planning.filterSort`): Due, Priority, Progress, Title, Manual. Saved views now keep priority, owner and sort direction.
- **Layouts**: List, Tree (`taskWorkflows.hierarchyOrder`, subtasks indented under their parent), By status and By stage (`gantt.buildRows`).
- **Progress** (`planning.progressRollups`, `projectProgress`): a parent row shows the progress of all its subtasks, and the header shows the whole project's progress.
- **Bulk edit** (`taskWorkflows.bulkUpdate`, new store action `bulkSet`): with tasks selected you can set Priority, Stage or Owner for all of them in one step. Bulk status still uses `bulkStatus` (it also places cards in board lanes).
- **Tags** (`kanbanUX.updateLabels`, new action `setLabels`): trims, removes duplicates, caps length and count, and clears verified/merged like every other edit.
- **Parent picker** (`taskWorkflows.descendants`): a task's own subtasks are no longer offered as its parent.

## 3. Resources and Timeline
- **Resources** (`operations.capacitySummary`): each person shows open tasks and logged hours.
- **Timeline** (`gantt.cjs`):
  - **Critical path** chip: critical bars get a red border, critical dependency lines turn red and thicker, and a card gives the number of critical tasks and the days end to end. A circular dependency shows a clear message instead.
  - **Schedule problems**: a card lists dependencies that start before the predecessor ends, each with **Move after predecessors** (`afterPredecessors`, new action `scheduleAfter`); another card lists reversed or unreadable date ranges (`invalidSchedules`).
  - **Parent tasks and subtasks** section (`hierarchyRows`, `hierarchySummaries`): the tree with fold buttons, combined dates, progress and subtask count of each parent.
  - **Schedule the sample tasks** button on the empty sample project (`scheduleSample`, new action `scheduleSample`).
  - **First task** chip (`calendarDomain`): jumps to where the schedule begins.

## 4. Still not wired, and why
- **Old Timeline renderer in `gantt.cjs`**: `LAYOUT`, `STUB_OUT`, `STUB_IN`, `ARROW`, `LANE`, `barBox`, `layoutRows`, `barGeometry`, `dependencyGeometry`, `dependencyCurve`, `roundedPath`, `connectorPoint`, `linkGesturePoint`, `linkPreviewPath`, `linkTargetAt`. They draw, route and hit-test the chart with 60 px rows. The Timeline screen does the same with its own code (54 px rows, drag follow, edge resize). Using both means replacing the working drawing code, which I will not do without a device test. Say so and I will do it as its own release.
- **`timelineWindow.pageRows`** (and `PHONE_ROWS`, `DESKTOP_ROWS`): a row pager. The Timeline has none on purpose, because it hid tasks outside the window.
- **`importFiles.pickAndroidJsonText`, `pickDocumentJsonText`**: text readers replaced by the byte readers, which also open `.niyav` files.
`tests/app/wiring-0526.test.cjs` keeps this list: any other export of the audited modules that nothing uses now fails the test.

## 5. Tests
- New `tests/app/wiring-0526.test.cjs` (8 tests): drop position, due-date filters, Tasks pipeline, bulk edit, tags and parent picker, capacity, critical path, conflicts, invalid dates, `afterPredecessors`, parent summaries, `calendarDomain`, plus the wiring ledger.
- Updated three source-pattern tests for the new Board code (root-remount-0513, board-gesture-restoration, mock-board-interactions).

## 6. Not verified
- Speed of the Tasks Tree and grouped layouts on a project with thousands of tasks (they paginate; the tree walks all tasks once per change).
- Critical path assumptions: calendar days, finish-to-start, no resource limits (shown on screen).

## 7. Acceptance (device)
1. Board > Filters: pick Overdue, then drag a card to the end of a column: it lands after the last visible card, hidden cards stay in order.
2. Tasks > Filters & tags: Layout Tree shows subtasks indented with a parent progress percentage; By status shows group headers.
3. Hold two tasks: set Priority High and Stage Testing for both; assign to an owner.
4. Task sheet > Labels: add `Bug ` and `bug`; Parent task: a subtask of the task is not offered.
5. Timeline > Critical path: red bars and lines, summary card. Make a task start before its predecessor ends: the warning appears and "Move after predecessors" fixes it.
6. Resources: each person shows open tasks and logged hours.

## 8. Rollback
Restore the eight changed source files and three updated tests from 0.5.25 and delete `tests/app/wiring-0526.test.cjs`.

---

## v0.5.27



# CHG-NP-0.5.27 — Task Sheet merged into the wire-engines release

## Baseline
- Primary: `Milvayo_v0_5_26.zip` (incremental: 13 files = 0.5.25 + "wire engines"; no package.json, no full tree).
- Merged: `Milvayo-v0.5.26-TASK-SHEET-UX.zip` (full tree = 0.5.25 + Task Sheet).
- Full tree rebuilt from the Task Sheet tree, then the primary baseline's changes applied on top. Both archives call themselves 0.5.26; this merge is 0.5.27.
- Commit status: Not committed. No APK, no deploy.

## How the merge was done (file level)
| File | Result |
|---|---|
| `Timeline.js`, `Workspace.js`, `kanbanUX.cjs`, 3 board/app tests, wiring-0526 test, 0.5.26 wire-engines changelog | Taken from the primary baseline (Task Sheet never touched them) |
| `store.js` | Primary baseline + the Task Sheet's `setLabelColor` action |
| `Board.js` | Primary baseline (filters, `dropBefore`, `initialCount`) + Task Sheet card (colored labels, compact due/checklist/attachment/comment marks, no ID) |
| `Tasks.js` | Primary baseline (search, layouts, tree, bulk edit, progress) + colored labels, no ID in the row |
| `TaskSheet.js` | Task Sheet (Standard/Advanced, Markdown, 24-color labels) + primary baseline's `setLabels` and subtask-safe parent picker |
| everything else | Task Sheet tree (identical to 0.5.25 where it was not touched) |

## Behaviour after the merge
- Standard mode by default, Advanced keeps every old control, same task record, switching never resets data.
- Task ID stays stable; shown only as small text at the bottom of the sheet. Search by ID still works.
- All label changes (add, assign, remove) now go through `setLabels`: trims, removes duplicates, caps count, clears verified/merged. Colors are per project (`labelColors`), plain-string labels still load.
- Board keeps filters and the "drop in front of hidden card" rule. Tasks keeps layouts, tree, bulk edit.

## Tests
- `node tests/run-all.cjs`: **542 tests, 541 pass, 0 fail, 1 skipped** (same skipped case as before: needs `node_modules`).
- New `tests/app/merge-tasksheet-0527.test.cjs` (6 tests) proves both feature sets coexist.
- JSX parse (TypeScript) of 68 `.js` files: 0 errors.
- Expo Go / web / Android device: **Not run**.

## Version lines for you to change (I never edit these)
- `app.json` → `"version": "0.5.27"` (inside `"expo"`)
- `package.json` → `"version": "0.5.27"`
- `package-lock.json` → top two `"version"` fields (both say 0.5.26 now).

## Known limits
- Markdown read mode is a safe subset: no tables, remote images or clickable links (the audit asked for links; see QA list).
- Per-project label colors. Native drag, keyboard and visuals untested on a device.

## Android acceptance (5 minutes)
1. Board: card shows colored labels, no ID. Drag within and across columns; open Filters > Overdue, drag to the end of a column.
2. Tasks: Layout > Tree; Filters; hold two tasks and set Priority.
3. Open a task: Standard mode, description in read mode, edit with `**bold**`, save, reopen. Switch to Advanced and back: nothing lost.
4. Add label "Bug" with a color; recolor it; it matches on Board and Tasks.
5. Parent task picker does not offer the task's own subtasks.
6. Timeline > Critical path still works.

---

## v0.5.28



# CHG-NP-0.5.28 — Backup protection levels (Low / Medium / High)

## Baseline
0.5.27 Task Sheet merge. Commit status: Not committed. No APK, no deploy.

## New
- Protected `.niyav` backups offer **Low (200,000)**, **Medium (400,000, default)** and **High (600,000)** PBKDF2-HMAC-SHA256 rounds. All three use AES-256-GCM; the level only changes how costly password guessing is. The Backup screen says so.
- The last chosen level is remembered (`src/store/backupLevel.js`, key `niyarvo.backupLevel`; no password is stored there).
- WebCrypto fast path for key derivation in browsers, checked once against a known answer; falls back to the chunked JavaScript derivation on any doubt. Android/iOS (Hermes, Expo Go) have no `crypto.subtle`, and `expo-crypto` has no PBKDF2, so they keep the JavaScript path.

## Compatibility
- File format unchanged: the iteration count was already in header bytes 8–11. Opening a file reads that count, so nobody has to remember a level. Old 600,000 files open as before. Plain gzip and JSON files untouched.
- Reader limit lowered from 10,000,000 to **1,000,000** iterations (hostile headers cannot stall a phone). Floor stays 100,000. Header checks run before any key derivation.
- `encode()` accepts `level`; an explicit `iterations` still wins (tests).
- Low and Medium are below the OWASP 2023 figure of 600,000. That is the requested trade-off for speed; use High or a long password for sensitive data.

## Tests
- New `tests/store/niyav-levels-0528.test.cjs` (12 tests): three round trips, stored count, default Medium, legacy 600k, wrong password, forged count, hostile counts (no derivation happens), truncated/corrupt file, cancellation, key equals Node PBKDF2.
- `node tests/run-all.cjs`: **553 tests, 552 pass, 0 fail, 1 skipped** (same skipped case as before: needs `node_modules`).
- JSX parse of the 3 changed `.js` files: 0 errors.
- Expo Go / web / Android device, benchmarks: **Not run / Not verified**.

## Known limits
- No timings measured: `node_modules` is not available here. Measure on the phone (see QA).
- WebCrypto derivation cannot be cancelled mid-way (cancel is honoured before and after).
- Remaining 0.5.27 plan: workspaces, import modes, Atlas fixtures, audit findings, Ponytail audit.

---

## v0.5.29



# CHG-NP-0.5.29 — Multiple workspaces

## Baseline
0.5.28 (AES backup levels). Commit status: Not committed. No APK, no deploy. Set version 0.5.29 in app.json, package.json and package-lock.json yourself (they are not in the ZIP).

## New
- Create, rename, switch and delete workspaces. The side menu shows the open workspace on one quiet line above the project card; tapping it opens a "Workspaces" drawer (same slide-over as the project drawer). The open one has a check and "Open now · N projects". The pencil on a row opens rename and delete.
- Each workspace is one whole saved workspace object (projects, boards, tasks, sprints, releases, portfolios, programs, governance, specifications, automations, snapshots, activity), so nothing is shared between workspaces.
- A new workspace starts with one blank project ("First project"), not the Northstar sample.
- Delete asks for confirmation, names what is lost, and is hidden for the last workspace (also refused in code).
- Names: trimmed, 1–60 characters, unique ignoring case. Limit 20 workspaces.

## Storage and migration
- The first workspace ("Main workspace") keeps the original key `milvayo-v1`. Existing data is not copied, moved or rewritten, so migration cannot lose or duplicate records and cannot be interrupted. Project/task IDs are untouched.
- New list key `niyarvo-workspaces-v1` (names and active id only). Extra workspaces use `niyarvo-workspace-v1:<id>`.
- Interrupted runs: create writes data first, then the list; delete removes data first, then the list. On start, saved data that is not listed comes back as "Recovered workspace"; a listed workspace whose data is gone is dropped. A damaged list falls back to the main workspace; data under the keys is never touched.

## Switching safety
- One workspace change at a time. Edits are refused while it runs.
- The open workspace is flushed to its own key first; if that save fails, the switch is cancelled.
- Every writer is bound to one key for its whole life, so a late save cannot reach another workspace.
- A switch counter cancels a GitHub preview refresh that started in the old workspace.
- Open task, search text, status filter and project request are cleared on a switch; retained pages and the task sheet are keyed by workspace + project (project IDs repeat when the same backup is loaded twice).

## Fixed during this work (see NP-PONYTAIL-AUDIT-0.5.29.md)
- A file that took seconds to open (password-protected, Android) was imported into whichever workspace was open when it finished. `importProject` now takes the workspace id captured at pick time and refuses on mismatch.
- Index reconciliation returned a new list on every start (found by the new test); now unchanged lists are returned as is.

## Compatibility
- Backup, JSON and `.niyav` formats are unchanged. Export, import and restore act on the open workspace only.
- Test `performance-stability-0510` updated: the task sheet key is now `projectId` (workspace + project).

## Not done (brief items for 0.5.30+)
- Import modes (add project / new workspace from backup / restore), multi-workspace complete backup, Atlas fixtures and tests, gzip level and main-thread check, Timeline windowing tests, Android profiling. None of these were started.

## Tests
See NP-QA-0.5.29.md. Device checks: Not run.

## Known limits
- Inactive workspaces show their creation date, not counts (counts need reading them).
- Text typed in a lazy field within 300 ms of a switch is refused ("still loading"). Needs menu, drawer and row taps in that time; not reproduced.
- Deleting the main workspace removes its original key for good once another workspace exists.

---

## v0.5.30



# CHG-NP-0.5.30 — Audit fixes

## Baseline
0.5.29 (multiple workspaces). This release is marked 0.5.30. Set version 0.5.30 in app.json, package.json and package-lock.json yourself (they are not in the ZIP). Commit status: Not committed. No APK, no deploy. Backup/encryption formats, the Task Sheet layout, and `src/store/workspaces.cjs` are untouched.

## 1. Must fix — writer is null during startup (`src/store/store.js`)
- The AppState "save" handler (also used by the effect cleanup and web `pagehide`) now calls `writer.current?.flush()`.
- `api.flush` is now `writer.current?.flush()??Promise.resolve(true)`, so it resolves `true` when there is no writer yet.
- Left as it was: the call inside `swapTo`. It runs only after `if(!currentRef.current)throw Error('The workspace is still loading…')`, and `writer.current` and `currentRef.current` are set together after the first load, so it cannot see a null writer. The existing test `workspaces-0529` pins that exact line, so it was not touched.
- Test: `tests/store/audit-fix1-0529.test.cjs` (source check: the two startup paths are guarded; the one remaining plain call is the one after the loading guard).

## 2. Should fix — "Flag overdue" button (`src/screens/workspace/Workspace.js`)
- Automations page header now has a small secondary button "Flag overdue" (icon `flag`, already used elsewhere) beside "Due checks" and "Card aging". It calls `sweepDue`.
- Test: source check of the button row.

## 3. Should fix — taps that matched nothing looked dead (`src/store/store.js`)
- `runDueCommands` and `runAgingCommands`: when no command applies, show `notify('No tasks matched.','info')` and return the project unchanged. Matching behaviour is unchanged.
- `sweepDue`: when no open task is past due without an `Overdue` label, show `notify('No overdue tasks.','info')` and return the project unchanged.
- Side effect to be aware of: before, `sweepDue` with nothing to flag still produced a new project object, so it bumped the revision and wrote a "Flagged overdue tasks" activity entry and a save. It no longer does when nothing is flagged.
- These three buttons are on the Workspace screen, which is not inside a native Modal, so the island notice is visible there.
- Test: source checks for the three messages, plus the pure automation engine (`model.automation.run`) for a no-match case (0 applied) and a match case (>0 applied).

## 4. Should fix — refusal notices behind native Modals: CHANGE NEEDED
Evidence:
- `src/ui/uiLayout.js:13` — `Sheet` is a native `<Modal>`. `TaskSheet` renders inside it (`src/screens/tasks/TaskSheet.js:99`).
- `src/components/shell/Menus.js:276` — the phone `SideMenu` is a native `<Modal>`; `WorkspaceDrawer` and `ProjectDrawer` render inside it as absolutely positioned views.
- `src/app/ModernApp.js:271` and `:299` — `IslandNotice` is mounted in the app shell, outside those Modals. On Android a native Modal is drawn in its own window above the app, so the island (`zIndex:1000`, `elevation:14`, `IslandNotice.js:81`) sits behind it. Error notices never auto-dismiss, so the user would only see the error after closing the sheet.
- `noticePlacement.cjs` only computes the top offset; it does not change the layering.

Change (no new notification system; it reuses the store's current notice):
- NEW `src/components/notice/inlineNotice.cjs` — pure rule: show the notice text only if it is an error and was not already on screen when the surface opened.
- NEW `src/components/notice/InlineNotice.js` — small error strip with a dismiss button (dismiss also clears the store notice).
- `TaskSheet.js` — strip is the first item of the sheet footer, which stays visible while the body scrolls, so a refusal from Verify, Record merge, progress, or attaching a GitHub reference is visible next to those actions.
- `Menus.js` — `SideMenu` passes `inModal` to `WorkspaceDrawer` and `ProjectDrawer`, which then show the strip above their list. The wide-screen `Sidebar` is not a Modal and does not pass it, so there is no duplicate there.
- Not changed: other `Sheet` users (`BoardManagement.js`, `Sprints.js`, `Delivery.js` sprint form, `DiagnosticsPanel.js`) are also native Modals, so an error raised inside them is also behind the Modal. They were outside the named scope (Task Sheet, side menu and its drawers) and were not changed.
- Tests: `tests/app/inline-notice-0529.test.cjs` (pure rule; source evidence that both surfaces are Modals and carry the strip).

## 5. Nice to have — dead code removed (no behaviour change)
- Unused imports/variables removed: `CompactTools.js` SectionTitle; `Board.js` isOverdue and the unused `useTheme()` result in `TaskCard`; `Delivery.js` Avatar, STAGES; `Portfolios.js` PRIORITY_COLOR, STATUS_COLOR; `Programs.js` Grid, Cell, Stat, Input; `Projects.js` setDocStatus and the unused `c` in `ProjectGovernance`; `Management.js` Pressable, Card, SectionTitle, useTheme; `TaskSheet.js` addTask; `Workspace.js` Chip, useWide, fmt, toCSV; `store.js` Button; `automation.cjs` DEFAULT_BOARD_ID; `model.cjs` `valid`; `timelineDisplay.cjs` `finite`.
- `src/board/boardGesture.native.js`: deleted `attachDoc` and everything only it fed: `IS_WEB`, the `Platform` import, the `detach` state field, `detachDoc` and its two call sites, and the stale comment about web document listeners. Nothing read them (`attachDoc` was never called, so `detach` was always null); no test asserts on them.
- Kept on purpose, because a test uses them:
  - `Timeline.js` `const SPAN = display.BASE_DAYS` — asserted by `native-animation-contract.test.cjs`.
  - `Projects.js` `const { projectSummary } = require('../../domain/projectRelations.cjs')` — `management-screen-separation-054` requires that file to reference `projectRelations.cjs`.
- `src/ui/ui.js` exports were not touched (`refactor-batch02-0522` pins the export list, which is why Avatar, Cell, Chip, Grid, SectionTitle, Stat and useWide are only removed from importers).
- Test: source check that the removed names are gone and `boardGesture.native.js` has no web code.

## Files
NEW: `src/components/notice/InlineNotice.js`, `src/components/notice/inlineNotice.cjs`, `tests/store/audit-fix1-0529.test.cjs`, `tests/app/inline-notice-0529.test.cjs`, this file, `docs/qa/modern-code/NP-QA-0.5.29-fix1.md`.
CHANGED: `store.js`, `Workspace.js`, `TaskSheet.js`, `Menus.js`, `CompactTools.js`, `Board.js`, `Delivery.js`, `Portfolios.js`, `Programs.js`, `Projects.js`, `Management.js`, `boardGesture.native.js`, `automation.cjs`, `model.cjs`, `timelineDisplay.cjs`.

## Install / revert
Copy the ZIP contents over the project on Git `work` (keep your own `package.json`, `package-lock.json`, `app.json`). To revert: restore the 0.5.29 files from the previous ZIP or `git checkout -- .` and delete the four new files listed above. No data format or storage key changed, so no migration and nothing to undo in app data.

---

## v0.5.31


### CHG-NP-0.5.31-ui-redesign.md

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
- Desktop and tablet: persistent sidebar (248) that collapses to a 64 px icon rail; choice remembered (`milvayo-sidebar-v1`). Tablets start collapsed.
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
Keep a copy of `~/Milvayo`, unzip over it (`unzip -o`), keep your own `package.json`. No files were moved or deleted, so `clean.py` is not needed. Roll back by restoring the copy.

### CHG-NP-0.5.31.md

# CHG-NP-0.5.31 — Responsive workspace redesign

## Baseline and intent

- **Input:** `Milvayo_v0_5_30.zip`, source-only snapshot. **Output:** 0.5.31 source update on top of that snapshot.
- **Commit status:** not committed; user tests locally on Git `work` before merging. **No APK built.** No deploy.
- **No schema or data migration.** Task/workspace normalization, AsyncStorage keys, import/export, encryption, scheduling, automation, sprint lifecycle, entitlements and domain behavior are unchanged.
- **Packaging:** project-root paths at ZIP root; deliberately exclude `app.json`, `package.json`, `package-lock.json`, `node_modules`, `.expo`. The source ZIP is an **overlay for the existing Termux installation**, not a standalone dependency installation.

## Product direction / design review

- **Product:** local-first planning, Kanban, dependencies and release readiness for independent projects.
- **Character:** calm, exact, dependable.
- **World:** a quiet workbench with task cards and planning instruments.
- **Rich moments:** the task board, Gantt dependencies and verified release progress — not decorative chrome.
- **Signature:** restrained orange active-state accent and meaningful status indicators.

**Before audit:** desktop content was constrained to a 1180px centered column; 248px sidebar had no collapse mode; project selection lived only in sidebar; top toolbar lacked screen context; title and control radii varied widely; mobile/desktop were separate shell return trees; Gantt item labels were hidden by default on wide screens; task card metadata used pictographs; multiple native modal sheets lacked an error strip.

**After:** fluid page width, 264px / 72px sidebar, shared top toolbar with project picker and task search, single stable shell tree, calmer neutral tokens in both themes, common control density, desktop-visible Gantt labels, refined Kanban columns/cards, inline errors across shared sheets. Motion remains restrained; web keyboard focus and reduced-motion preferences are respected.

## Changes

### Navigation and responsive shell

- `src/components/shell/Menus.js`: persistent full/compact sidebar. Above 1120px the 264px rail has an explicit collapse control; below that it automatically shows a 72px icon rail until mobile breakpoint. Navigation retains the same full grouped destination set, accessible labels, active state and icon. Workspace/project selection remains usable from the compact rail. Added a reusable desktop project switcher using the **existing** project drawer and callbacks — no new project-selection logic.
- `src/components/shell/Bars.js`: context-aware toolbar with project selector, current page, search, theme and New task. Bottom navigation keeps the same five primary destinations; no navigation or intent API changes.
- `src/app/ModernApp.js`: replaced two independent platform-specific shell return branches with one stable safe-area tree. This reduces the opportunity for page remounts when resizing across the desktop breakpoint. Retained visited-tab cache, `StoreFreeze`, navigation queue and diagnostic markers. Added a visible web keyboard focus outline and CSS reduced-motion override. **Not proof that first-open Timeline bounce is fixed on hardware**; native acceptance remains required.

### Shared design system and dialogs

- `src/ui/theme/theme.js`: balanced light graphite/paper and dark graphite surface ramps, tighter radii. Light default orange is darker to improve text contrast. User-selected accent preference and storage key are untouched.
- `src/ui/theme/theme.cjs`: small contrast-aware foreground helper, unit-tested against every accent. Does not change accent names, IDs or storage values.
- `src/ui/uiBase.js`: existing typography / Card / Avatar / progress components reused, no replacements.
- `src/ui/uiControls.js`: harmonized button, chip and segmented control geometry, touch heights and accessibility roles.
- `src/ui/uiLayout.js`: Page is fluid rather than capped; screens share consistent gutters, typography, section rhythm and grid cells. All screens using Page, Card, Grid, Stat, Sheet inherit the update. Shared sheets are wider on desktop and contain sticky in-modal error notices (the error stays visible while the body scrolls).
- `src/screens/tasks/TaskSheet.js`: retains its original sticky footer notice while opting out of the new shared Sheet notice, so the refusal is not duplicated. `src/components/notice/InlineNotice.js` now imports text directly from the leaf UI base to avoid circular imports.

### Kanban and Gantt

- `src/screens/board/Board.js`: slightly wider desktop (320px) / mobile (280px) lists, 14px gaps, deliberate status/count headers, clearer empty states and readable task card metadata with Feather icons instead of emoji. Filtering, list ordering, gesture math, progressive native mounting, card move rules and drop-before behavior are preserved.
- `src/screens/timeline/Timeline.js`: task names visible initially on desktop; compact on mobile. The label rail is 264/160px and can still be hidden. Clarified controls and date metadata and differentiated date header surfaces. Existing bounded SVG viewport, row virtualization, dependency routing, move/resize and edge/link handles are unchanged.
- **Other screens:** Overview, Tasks, Sprints, Scheduling, Releases, Specifications, Testing, Collaboration, Settings, Resources, Costs, Governance, Automations, Reports and Activity all use the shared Page/Card/Chip/Button/Sheet primitives, and therefore inherit the updated spacing, color, type and responsive content widths. No domain logic was rewritten.

## Tests

- `node tests/run-all.cjs`: **577 total / 576 passed / 0 failed / 1 skipped** (Node 22).
- Suite used temporary, *test-only* `app.json` (`0.5.31`) and `package.json` shims with placeholder animation dependency declarations because these files are excluded by the source ZIP. These **are not** a substitute for validation against the user's real Expo dependency manifest. Both shims were removed before packaging.
- TypeScript JSX parser (syntax only) checked the `src/` JavaScript files: **0 parse diagnostics**.
- New tests: `tests/ui/responsive-design-0531.test.cjs` (desktop navigation, toolbar, fluid Page, retained shell, Kanban, Gantt); `tests/ui/accent-contrast-0531.test.cjs` (WCAG AA contrast foreground for default and optional accents).
- Historical source assertions updated where their precise UI strings/pixel values intentionally changed. Store and domain tests were not modified.
- **Not run:** `npm test` against the user’s real package manifest, `npx expo install --check`, Metro Web screenshot/device interactions, Expo Go Android/iOS, FPS measurements, drag acceptance, APK. No performance improvement timings are claimed.

## QA checklist and residual risks

See `docs/qa/modern-code/NP-QA-0.5.31.md`. Important device checks: first-open Timeline without Overview bounce, sidebar collapse/expand on desktop, 880/1120px resize, task search/project switcher, Android side menu, Kanban long hold and cross-column drop, Timeline move/resize and dependency links, sheet notices and backup round trip. Actual responsive rendering and runtime navigation remain **unverified** until run through Metro and a native device. No new dependencies were added.

## Installation / rollback

1. In Termux, ensure your current v0.5.30 checkout has a clean, backed-up **`work`** branch and your existing `app.json`, `package.json`, `package-lock.json` are retained.
2. Extract this ZIP into `~/Milvayo` **at the root**. Do not delete application storage or recreate the project.
3. Set app, package and lock versions to `0.5.31` using your existing local manifests. Do not adopt the test-only manifest. Run `npm test` and `npx expo start --clear`; verify the QA checklist and collect a performance report.
4. If you detect a regression, revert the overlay with your v0.5.30 checkpoint / Git working branch. No persisted data migration needs undoing.

## Files touched

`src/app/ModernApp.js`; `src/components/shell/{Menus,Bars}.js`; `src/components/notice/InlineNotice.js`; `src/screens/{board/Board,timeline/Timeline,tasks/TaskSheet}.js`; `src/ui/{uiControls,uiLayout}.js`; `src/ui/theme/{theme.js,theme.cjs}`; updated UI source-check tests in `tests/app/{dynamic-island-056,notice-safe-anchor-055}.test.cjs`, `tests/diagnostics/diagnostics-048.test.cjs`, `tests/domain/operations-boards.test.cjs`, `tests/gestures/native-animation-contract.test.cjs`, `tests/ui/modern-design-regression.test.cjs`; new `tests/ui/{responsive-design-0531,accent-contrast-0531}.test.cjs`; `README.md`, `summary.md`, `RESUME.md`, this changelog and QA file.

**Design method:** Frontend Design, Unslop by Damir Sokolovsky (CC BY 4.0), Ponytail small-diff principles. No third-party UI source was copied.

---

## v0.5.32

*No standalone changelog for this version was present in the recovered archives. No implementation claims are inferred.*

---

## v0.5.33


### CHG-NP-0.5.33-TEST-RECONCILIATION.md

# Milvayo v0.5.33 — regression-suite reconciliation

## Why the full suite failed after the successful 5/5 merge checks

Milvayo v0.5.31 Desktop HF1 and Sonnet's independently produced v0.5.32 redesign both used 0.5.31-style file and test names, but they implemented **different, incompatible UI contracts**. Extracting the HF1 ZIP with `unzip -o` replaces common paths but **does not remove files created only by Sonnet's ZIP**. The recursive `tests/run-all.cjs` therefore runs Sonnet-only assertions against HF2/v0.5.33 source:

- `tests/app/shell-redesign-0531.test.cjs` expects Sonnet's sidebar, `layout.boardColumnWidth`, `visibleMonths.map`, Sonnet accent token names and additional UI features deliberately *not* transferred into v0.5.33.
- `tests/ui/layout-0531.test.cjs` expects Sonnet's theme `accentTokens`, `LIGHT/DARK` export and its separate breakpoint module, not our retained theme.
- `tests/ui/desktop-mode-0531-hf1.test.cjs` expects the old **700px** automatic Web desktop threshold. HF2 correctly changed it to **320px**; its regression assertions must now reflect portrait desktop mode.
- `tests/app/single-app-migration-051.test.cjs` rejects root-level release markdown, but the cumulative release ZIPs introduced several `CHG-NP-` / `NP-QA-` files at the root. These should live in `docs/qa/release-notes`.
- Source inspection showed the old Board renders the priority indicator as a color dot with no accessible priority label. The tiny indicator gets an accessibility name without any geometry/drag changes.

These are **mixed-baseline test failures**, not evidence that the five targeted 0.5.33 changes failed. They do not prove that Web/Android works, nor do they prove all accessibility checks pass on device.

## What the guarded patch does

1. Requires the approved desktop `LayoutProvider`, HF2 portrait selector and direct `uiBase` store import, and an already applied v0.5.33 merge. Refuses other baselines.
2. Archives **only recognized** Sonnet-specific 0.5.32 test sources to `docs/qa/historical-sonnet-0532/` (their content is retained, not discarded). Tests of the actual v0.5.33 code, including `selective-merge-0533`, remain active.
3. Archives the existing HF1 desktop test and edits only its old `700px` and literal Web-automatic assertions to match the 320px contract. Other assertions are preserved. Adds an independent, executable `desktop-portrait-0533.test.cjs` validating 319/320/390/768/1440 Web and native separation.
4. Relocates root `CHG-NP-*.md` and `NP-QA-*.md` to `docs/qa/release-notes/`, matching the app repository's documented release-note placement rule. No notes are deleted.
5. Adds an accessibility label to the existing Board priority dot. Adds `board-priority-a11y-0533.test.cjs` to guard the fix; no board drag logic changes.
6. Uses a dry-run and preflight checks to avoid modifying unrelated checkouts. Re-running after a successful application is a no-op.

**Not touched:** app entry/shell, Web portrait routing, theme tokens, UI Controls buttons, Gantt/board engines, domain model, storage/schema, manifests and dependencies. No APK, deployment or Git operations.

## Install (inside the existing working checkout)

```sh
cd ~/Milvayo
# Your prior backup patch remains in ~/storage/downloads/NP-before-0533-recovery.patch
unzip -o ~/storage/downloads/NP-0533-TEST-RECONCILIATION.zip
node scripts/reconcile-np-0533-tests.cjs --dry-run
node scripts/reconcile-np-0533-tests.cjs
node --test tests/ui/selective-merge-0533.test.cjs tests/ui/desktop-portrait-0533.test.cjs tests/ui/board-priority-a11y-0533.test.cjs
npm test
```

After tests, run `npx expo start --clear` to inspect portrait/landscape Web, Board drag and Timeline on the device. **Do not commit** until those pass and project data persistence is checked. If the script refuses unknown source markup, leave it stopped and provide the message; do not force it.

## Verification in the supplied environment

Simulated the reported mixed checkout by adding the two original Sonnet v0.5.32 test files, an older HF1-style breakpoint test, and a root changelog to the existing **synthetic** v0.5.33/HF2 fixture. Applied the reconciliation and re-ran the recursive Node runner:

- Dry-run: expected changes listed without modifying files.
- Apply: completed; second dry-run: zero changes.
- Targeted new/adjusted suites: 5 tests passed.
- Full synthetic Node suite: **579 pass, 0 fail, 1 skip** (580 total).

**Limit:** The exact installed HF1 application files and user's working tree are not available here. The old desktop test's formatting may differ from the test fixture, in which case the script can leave another outdated assertion; the next user-run test output is authoritative. The synthetic suite proves the reconciliation script functions on the representative conflict, not that the actual physical device passes. We did not run Metro Web or Android/iOS instrumentation.

### CHG-NP-0.5.33-WEB-MOBILE-LINK-COLORS.md

# Milvayo v0.5.33 — Mobile Web layout and Gantt link color hotfix

## Baseline
Use only after v0.5.31 DESKTOP HF1 + portrait HF2 + v0.5.33 selective merge and test reconciliation. The user's checkout reported 588 passed and three failures in the full Node suite; two came from HF2 script path/import scanner and one from the superseded breakpoint test. A desktop-at-320 Web rule also made mobile Safari/Brave screens collapse into vertical letters. This is a corrective **overlay**, not a standalone source release.

## Scope
1. `src/ui/layoutMode.cjs`: wraps existing `isDesktopLayout` with browser-mode detection. The app's Desktop selection remains available; a mobile Web UA defaults to mobile UI in portrait and landscape, while desktop browser UA and Desktop site/expanded CSS viewport retain the desktop shell. Original breakpoint/native layout logic remains intact. A user-initiated desktop preference takes precedence.
2. `src/screens/timeline/Timeline.js`: dependency curves and endpoint markers use stable, distinct colors from the original seven-color palette. Critical-path override remains. No path coordinates, clip bounds, gesture recognizers, ordering or interaction changes.
3. `tests/ui/desktop-mode-0531-hf1.test.cjs`: updates the superseded mobile-at-360 assertion to cover UA-based modes while retaining other HF1 tests.
4. `tests/ui/portrait-desktop-0531-hf2.test.cjs`: updates obsolete Web auto-desktop expectations and adds the path header required by existing folder tests.
5. `scripts/apply-np-portrait-hf2.cjs`: adds the source path comment and splits replacement-string literals without changing the strings' evaluated meaning. Prevents the project's import scanner from treating string content as real imports.
6. Adds `tests/ui/mobile-browser-and-dependency-colors-0533-hf4.test.cjs` for Android UA Client Hints, UA fallback, Desktop site viewport expansion, manual desktop, native separation and dependency colors.

## Before running
- Export your local workspace through Settings > Backup; keep the working Git checkpoint.
- **Do not** reset site data or uninstall the app. This update does not change storage, schema, npm dependencies or payment/security logic.
- The overlay installer validates source shape, performs a dry run and is idempotent. It refuses unknown dependency JSX or missing HF1 desktop provider instead of overwriting the shell.

## Termux
```sh
cd ~/Milvayo
unzip -o ~/storage/downloads/NP-0533-WEB-MOBILE-DEPENDENCY-COLORS-HF4.zip
node scripts/apply-np-mobile-web-and-dependency-colors.cjs --dry-run
node scripts/apply-np-mobile-web-and-dependency-colors.cjs
node --test tests/ui/mobile-browser-and-dependency-colors-0533-hf4.test.cjs tests/ui/desktop-mode-0531-hf1.test.cjs tests/app/folder-structure.test.cjs
npm test
npx expo start --clear
```

## Acceptance
- On Brave normal Mobile site, reload localhost:8081 in portrait: mobile header and bottom tabs, no giant desktop toolbar, no vertically stacked single-letter text. Landscape remains mobile site unless browser requests desktop.
- Toggle browser **Desktop site** and reload: desktop nav/toolbar visible. If browser doesn't expose its Desktop site state to the page, the app's explicit Desktop layout option remains the fallback.
- On desktop Web, confirm sidebar/rail, project switcher and search.
- Timeline: 2+ dependencies use distinct colored curves and colored endpoint dots. Critical path remains highlighted when selected. Verify drag, resize and dependency add/remove on Web and Android.
- Confirm workspace and task edits survive reload; do not clear browser data to reset the layout.
- If an earlier manual in-app **Desktop layout** preference is still active on mobile, switch to **Automatic layout** from the rail footer (rotate temporarily if necessary) to restore mobile mode.

## Verification
A reconstructed fixture containing v0.5.30 domain files, simulated HF1/HF2 layout, v0.5.33 merge UI, and a previously gray Timeline source passed 584 tests / 0 failed / 1 skipped (585 total). Targeted browser mode, folder structure and historical desktop tests passed 15 / 15. Second installer run had zero changes. This **does not prove physical Web or Android runtime correctness**, nor does it reproduce the user's exact checkout; the user should verify on their device before committing.

## Intentional omissions and risk
No attempt to rewrite desktop screens for a manually forced 320px CSS viewport. On some browsers Desktop site is not detectable if neither UA/Client Hints nor viewport changes; the explicit desktop preference still works. No dependency upgrades, board/timeline gesture-engine changes, data migrations, or unrelated design work.

### CHG-NP-0.5.33.md

# CHG-NP-0.5.33 — Selective compact-design merge, desktop preserved

Date: 2026-11-03. Product: **Milvayo** (not RIVNA or Niyarvo Control Center).

## Read first / release type

This is a **guarded source overlay** for an already installed **Milvayo v0.5.31 Desktop HF2** checkout, not a stand-alone full-source ZIP. The exact 0.5.31/HF1 application archive was available only as Library metadata/docs, not as readable source bytes in the execution environment. Replacing the customer's installed files with 0.5.30 or Sonnet 0.5.32 would undo unknown v0.5.31 improvements. Instead, this update transforms four existing UI files **in place** after checking the retained desktop implementation.

The patch makes no assumptions about the user's local `package.json`, `package-lock.json` or `app.json`: the accompanying version script safely sets all three to 0.5.33 (including `package-lock.json` `packages[''].version`). No npm install or dependency change is needed.

## Baselines and merge decisions

- Keep the current ash-gray theme, palette and accent preferences. **No theme file touched.**
- Keep v0.5.31 Desktop HF1 + Portrait HF2: Web desktop on portrait (`390px`) and landscape (`768px`), native portrait stays mobile. The installer checks `layoutMode.cjs`, `ModernApp.js` LayoutProvider and the direct Store->uiBase import before editing. **No shell or navigation file touched.**
- Keep all project state, schema, storage keys, board gestures, timeline engine, dependencies, and app permissions. **No domain/gesture/engine files touched.**
- Selectively adopt Sonnet 0.5.32 UI improvements, adapting them to the existing desktop shell rather than copying Sonnet's 720px phone breakpoint.

## Actual transformation

1. `src/screens/tasks/Tasks.js`: adds compact desktop column header Task/Owner/Due/Status/Priority when the **physical viewport** is at least 1080 CSS/logical px; narrower portrait Desktop Web uses the compact task-row representation instead of overflowing the viewport. Aligns status/priority columns where the known row pattern is found. Reduces task-row vertical padding by two points when the original anchor exists. Does not change filters, sorting, selection, grouping or task mutations.
2. `src/screens/overview/Overview.js`: where the known nested interactive Release readiness Card is present, makes the card noninteractive and provides separate **Open releases** and **Open testing** buttons, preserving both navigation routes and fixing an invalid Web interaction hierarchy.
3. `src/screens/board/Board.js`: where the known v0.5.30/v0.5.31-style anchors exist, reduces column padding/gap, adds a small count pill and preserves **all drag engine/width logic**. If a newer 0.5.31 custom board already differs, it leaves that layout alone.
4. `src/screens/timeline/Timeline.js`: where the known tick/grid anchors exist, adds subtle weekend shading only for viewport-visible columns in Days zoom. Weekends have `pointerEvents="none"` and the number of nodes is bounded by visible width; otherwise the existing Gantt is untouched. No month-band rewrite, all dependency/gesture routes preserved.
5. `scripts/apply-np-v0.5.33.cjs`: guarded, repeatable source merge. Precomputes all changes and checks critical anchors before writing. `--dry-run` previews changes. Repeated application is a no-op.
6. `scripts/set-np-version-0533.cjs`: idempotent manifest version sync; no package resolution or npm scripts executed.
7. `tests/ui/selective-merge-0533.test.cjs`: asserts portrait Desktop Web, native separation, bounded table columns, release links, cycle-free Store import and (if added) viewport-bound weekend lines.

## Deliberately NOT transferred from Sonnet 0.5.32

- Phone-breakpoint shell, palette and topbar; these would undo approved desktop/portrait mode.
- Sonnet's `uiBase.js`, `uiControls.js`, dependency import changes or `@noble/hashes` guesses. The reported noble warning is from third-party dependency resolution and cannot be attributed from the source ZIP.
- Flexible Kanban column *width* math, because current Android drag / auto-scroll has not been rebenchmarked on hardware. Compact list **spacing** only.
- Full Gantt month-band markup and task-sheet replacement, which could conflict with v0.5.31's verified interval labels and sheet geometry. Weekend shading is optional, noninteractive and viewport-bounded.
- Sonnet's nested interactive release Card, which produced invalid Web controls.

## Tests actually run (synthetic HF2-shaped source)

- `node scripts/apply-np-v0.5.33.cjs --dry-run`: PASS, zero files modified.
- Apply once: PASS, 4 modified source files on the synthetic v0.5.30-based fixture; apply twice: PASS, zero additional changes.
- `node --test tests/ui/selective-merge-0533.test.cjs`: PASS, 5/5 checks.
- `node tests/run-all.cjs`: PASS **574 / 575 (574 pass, 1 skip, 0 fail)** with temporary local Expo manifest stubs.
- TypeScript source syntax parsing across 123 JS/JSX/CJS sources: PASS, zero parse errors.
- `node scripts/set-np-version-0533.cjs` twice on temporary manifest + lockfile stubs: PASS, all four version values (package, lock top, lock root, app) were 0.5.33.

**Not verified:** these checks use the known 0.5.30 source with synthetic HF2 layout/provider signatures and temporary manifest placeholders, not the exact unavailable v0.5.31/HF2 code. The merge script may refuse the owner's newer file layout. No physical Android/iOS, Web Metro, browser screenshot, drag gesture, FPS, first-open Timeline bounce, cold-start bundle, real npm dependency or production-release validation is claimed. A successful install on the user's actual checkout requires local test/acceptance before committing.

## Installation in Termux

```sh
cd ~/Milvayo
git switch work
git status --short
unzip -o ~/storage/downloads/Milvayo-v0.5.33-MERGE-OVERLAY.zip
node scripts/apply-np-v0.5.33.cjs --dry-run
node scripts/apply-np-v0.5.33.cjs
node scripts/set-np-version-0533.cjs
node --test tests/ui/selective-merge-0533.test.cjs
npm test
npx expo start --clear
```

Before extraction, export a workspace backup and keep a Git/source checkpoint. The merge itself does not delete or migrate app data. If the guarded script **refuses** your layout, do not run Sonnet's ZIP or force copy its files over the desktop installation: share the error and current source files. If Metro/visual QA fails, restore the previous Git commit; do not clear storage.

## Device/Web acceptance before commit

- 360/390/430px portrait Web: desktop compact rail and toolbar, Tasks rows fit, open/close task sheet, navigate screens.
- 768px landscape Web: desktop rail, Board and Timeline remain interactable; no overlapping buttons.
- 1440px desktop Web: task table header and columns align; check Overview release controls.
- Native Android portrait: mobile navigation preserved, no navigation bounce, drag Board columns and Timeline bar/resize/dependency.
- Test saved project/workspace persistence on refresh/restart. Verify light/dark and custom accent remain unchanged.
- No Web console nested Pressable errors, new require cycles or new JS exceptions.

## Git status

No user repository changes, commits, pushes, deployments, package installs, APK or IPA builds were performed in this environment. The owner is responsible for applying, validating and committing the overlay on `work`.

---

## v0.5.34



# Milvayo v0.5.34 — Consolidated RIVNA themes and UI controls

**Source baseline:** User-supplied `Milvayo v0.5.32.zip` (internally v0.5.33; HF4 mobile-browser detection, desktop override and colored dependency lines already present). This is a complete source release, **not a patch installer**. All source files are at ZIP root.

## Delivered changes

1. **RIVNA theme system.** Retains the ten named accent IDs and their supplied start/end gradients, primary colors and tint-derived backgrounds. Appearance choices: System, Light, Dark and AMOLED (black background, tinted cards). Existing accent preference storage key retained; no project-model migration. Theme JS now derives colors directly from `rivnaPalette.cjs` through the public `theme.cjs` API.
2. **Appearance picker.** Rounded-square two-tone swatches, five columns per row on phone widths, with visible selected state. Old circular swatches and clay-orange special case removed.
3. **Kanban.** Main toolbar keeps board selection, add board, and one **Board tools** action. A reusable sheet contains search, High and above, due date, priority, owner, tag filters, reset, show card descriptions, per-board Power-Ups and local commands. Existing filtering, board state and gesture/drop engines preserved.
4. **Timeline.** Chart ribbon now groups Show Items / Hide Items, First Task, Today, Critical Path, Parent Tasks and To Schedule. The latter two open `Sheet` overlays for the hierarchy and unscheduled tasks. Parent expand/collapse and task-opening actions remain; the existing colored dependency rendering and critical-path emphasis are unchanged.
5. **No decorative side stripes.** Removed left-side accent bars from selected sidebar navigation items; selected-state surface and type hierarchy remain.
6. **AMOLED chrome.** Existing status bar, logos, and sheet scrims correctly recognize AMOLED as a dark appearance.
7. **Web PWA completeness.** Restored six missing `public/` assets from the earlier full releases (identical copies in v0.5.30 and Sonnet's v0.5.32) because the user-supplied archive omitted `public/`. Moved the old HF4 changelog out of the `docs/` root to satisfy repository documentation placement rules.
8. **Release version.** `package.json`, `package-lock.json` root/package version and `app.json` Expo version synchronized to 0.5.34.

## Scope and preservation

- No changes to workspace/task schemas, data persistence, Firebase rules or subscriptions.
- No new npm dependencies.
- Native Kanban and Timeline gesture engines, scheduling calculations and Gantt routing unchanged.
- The pre-existing browser detection remains: normal phone Web uses mobile layout; Desktop site or manual preference uses desktop layout.
- No installer steps. Older installer scripts in the archive are historical and **must not** be run for this release.

## Verification performed

- `npm test` on the exact edited source directory: **600 passed, 1 skipped, 0 failed** before the extra 0.5.34 checks (rerun after packaging below).
- All `229` existing JS/CJS source files parsed with TypeScript's JSX parser, **0 syntax diagnostics** before the additional test file.
- All ten palettes have primary-button foreground contrast ≥ 4.5:1 across Light, Dark and AMOLED.
- Physical Android Expo Go runtime, Brave mobile browser, forced Desktop site and a production Web export were **not run** in this environment; test on Termux before any Git checkpoint.

## Installation

Extract ZIP contents directly into `~/Milvayo` (no top folder) using `unzip -o`. Since unzip does not remove previously extracted files, the old `docs/CHG-NP-0.5.33-WEB-MOBILE-LINK-COLORS.md` may remain and must be removed **only after confirming its copy exists at** `docs/qa/release-notes/CHG-NP-0.5.33-WEB-MOBILE-LINK-COLORS.md`. Then run `npm test` and `npx expo start --clear`.


---

## v0.5.35



Removed Settings > Workspace data duplicate. Backup creation shows live password match/mismatch before invoking slow AES-256 key derivation; forms for Project, Portfolio and Program creation/editing now use task-sheet-style panels.

---

## v0.5.36



Moved Task configuration from hamburger navigation to Tasks; organized filters, tags, saved views and schema settings in one sheet.

---

## v0.5.37



Switched menu Niyarvo branding to original-logo alpha masks tinted by the selected theme accent. Wordmark follows high-contrast appearance colors.

---

## v0.5.38



PROJECTS lettering is approximately twice its previous display height and is right-aligned under the final O of niyarvo; monochrome light/dark treatment.

---

## v0.5.39



Removed Board/Timeline descriptive subtitles, renamed Board tools to Tools, fixed Tools ahead of a horizontally scrollable single-row board switcher.

---

## v0.5.40



First Timeline open targets the earliest task active today; if none, it targets the next scheduled task; subsequent user scrolling is not overridden.

---

## v0.5.41



Removed screen title/header containers while retaining actions; theme-toggle control moved to the hamburger navigation.

---

## v0.5.42



New task is a draft-only sheet. Closing/dismissing never persists; Save task creates one canonical task with its drafted description/status/priority.

---

## v0.5.43



Description is still editable by pressing its preview (no redundant Edit button); Duplicate and Delete are adjacent in the Task Sheet footer and both require confirmation.

---

## v0.5.44



Mobile tab bar handles left/right swipes across the bar, moving one primary destination at a time; keeps existing tap-intent validation and Kanban/Timeline gesture areas separate.

---

## v0.5.45



Kanban initially displays 10 cards per list with explicit Show more (10 at a time); a per-board Tools setting controls whether new tasks enter at the top or bottom (default bottom), without altering existing tasks on preference change.

---

## v0.5.46



Replaced hamburger Close X with the light/dark appearance button; menu still dismisses using the outside overlay, Android back, or choosing a destination.

---

## v0.5.47



Restored original pre-RIVNA Claude Orange `#D97757` for Orange accent; all nine other RIVNA accent choices and existing background/surface palettes remain intact.

---

## v0.5.48 — Header, Timeline, sheets, navigation and theme refinements

- All app headers show **New task** as text with the plus icon, instead of an icon-only primary action.
- Timeline moves Days / Weeks / Months to the shared app header, and focuses the first task active on today at first visible mount, falling back to an upcoming task.
- Board Tools, Tasks Tools and New sprint are available in their respective screen headers; redundant page-level buttons are removed.
- The shared task-style Sheet includes a subtle swipe handle and downward swipe-to-dismiss from its upper content area (when not scrolled), without a separate X button. Android Back and backdrop dismiss remain.
- Task duplication and deletion confirmations display only the selected confirmation/cancel actions, using the current accent for their primary button.
- Hamburger menu is narrower, with smaller branding, while **PROJECTS** is regular-weight accent text.
- Hamburger appearance button cycles Daylight, Dark and AMOLED; Settings explicitly offers System, Daylight, Dark and AMOLED.
- Light-mode Amber uses a darker amber (`#8A5A00`) instead of appearing orange; Claude Orange is slightly more vivid in daylight (`#DA643D`).
- All historical release notes from v0.1.0 through v0.5.47 are consolidated in this file. QA records live in `docs/qa`; usage and backup format instructions live in `docs/instructions`.

**Verification:** Source/domain tests and syntax checks are performed on the completed source ZIP; actual phone gestures and browser rendering remain to be accepted.


---

## v0.5.49 — Cross-screen design consistency and header alignment

- Standardized primary **New task**, contextual **Tools** / **New sprint**, timeline **Days / Weeks / Months**, and hamburger buttons on a shared 44-point control rhythm; mobile header height 64 points and consistent top/bottom padding. The zoom selector and contextual groups scroll horizontally when space is limited rather than wrapping into a second header row.
- Increased the phone hamburger drawer from 160 to 240 points (75% of the original 320-point design), capped at 80% of available width; restored readable logo and full-width, 44-point navigation targets. The 3-mode appearance toggle remains in the drawer.
- Audited the UI architecture across the entire navigation map (Overview, Board, Timeline, Scheduling, Tasks, Sprints, Releases, Testing, Resources, Collaboration, Costs, Projects, Portfolios, Programs, Automations, Reports, Activity, Specifications, Settings). Applied shared button, icon, chip, segmented selector, dropdown, input and field-label improvements to all users of the shared components. Fixed undersized task rows in Board, Timeline and Tasks.
- Replaced uppercase tracked field labels with sentence-case 12-point labels, unified dropdown corner radii, and made input hit areas at least 44 points. On mobile Web, input text uses 16 points to avoid browser focus zoom.
- Matched focus-ring contrast to the current text color rather than hardcoding an unrelated orange, retained user-selected RIVNA accent palettes, meaningful status/dependency colors, and the global no-side-accent-lines rule.
- Preserved existing store formats, task creation confirmation, Kanban drag/reordering, Gantt/Timeline geometry, and sheet dismissal logic. No dependencies or migrations.

**QA:** `docs/qa/NP-UI-DESIGN-AUDIT-v0.5.49.md`; source-level automated tests and syntax checks only. Native/real Web visual and touch review remain for user acceptance.

---

## v0.5.50 — Full-surface design and accessibility audit

**Source baseline:** Verified complete v0.5.49 ZIP. **Scope:** All 19 navigation destinations, their subviews and the 20th internal task-configuration screen; shared controls, task/project/workspace overlays, confirmation and alert patterns, charts and diagnostics. Reviewed using Anthropic Frontend Design principles and `dickwu/apple-design-skill` (cross-platform Apple Human Interface Guidelines interpretation).

- **Shared UI:** Noninteractive chips and task labels are no longer represented as inactive buttons. Interactive chips, cards, segmented choices, dropdowns, expandable sections and controls now have clearer accessible roles, labels, selection/expansion states and 44-point touch targets where feasible.
- **Appearance/accessibility:** All ten accents in Light/Dark/AMOLED keep their exact button colors while using contrast-safe text variants for small accent text. Standard, secondary and placeholder text meet at least 4.5:1 against their main background across all 30 combinations. Readable status text no longer depends on color alone.
- **Sheets, messages and errors:** Screen-reader modal semantics and escape dismissal on shared sheets; assertive announcements for inline errors and a larger notice-dismiss target. Screen-render failures show actionable plain language rather than raw exception text (technical details remain available in diagnostics).
- **Governance:** WBS tree rows use a small colored status dot instead of a decorative side stripe. Risk register and matrix controls are labeled, risk deletion requires confirmation, and new risks stay in a local draft until explicit **Save risk**. Cancel never persists a blank risk. Risk matrix numbers use contrast-aware ink.
- **Tasks/Board/Timeline/Delivery:** Better labels for task rows and Board/Timeline task gestures, calendar and sprint task actions, chart legend visibility states, task label actions and accessible selectable board/workspace entries. The data store, Gantt geometry, PanResponders and existing drag interactions were not rewritten.
- **Typography:** Replaced remaining uppercased tiny administrative field labels in task, sprint, governance and board editors with legible sentence-case labels.
- **Audit details:** `docs/qa/NP-FULL-SURFACE-DESIGN-AUDIT-v0.5.50.md`. Regression tests in `tests/ui/release-0550-design-audit.test.cjs`.

**Limitations:** Source review, syntax and Node tests are not a substitute for actual Android/iOS VoiceOver/TalkBack, keyboard, screenshot, tablet or mobile-Web testing. Device sign-off remains pending; no commit, push, dependency upgrade or project-data migration was performed.

---

## v0.5.51 — Timeline scrolling and Governance form clarity

**Baseline:** v0.5.50 full-source release. **Scope:** shared input surfaces, Governance forms/long-form text, Timeline chrome and safe screen simplification.

- Fixed invisible-looking fields on Light themes: all shared text inputs now use a raised surface, a clearly visible outline and an accented focus indication. Kept 44-point single-line targets and 104-point multiline fields; affected Governance, Tasks, Resources, Risks, WBS, Releases, Backup, and other existing input users without changing their stored values.
- Unified Project creation and Portfolio/Program creation/editing fields. Reduced redundant nested cards and one-button management folds. Portfolio/Program Save and Cancel now use the consistent sheet footer. Reopening a sheet resets its content scroll position to the top.
- Reused the safe Markdown renderer from the Task Sheet: Project/Portfolio/Program descriptions support `**bold**`, `*italic*`, headings, lists, quotes and inline code with editable source and formatted Preview; read-only project details, portfolio and program cards render that formatting.
- Extended Markdown Preview to long-form project-management document sections, WBS dictionary descriptions, risk response plans and new-task descriptions. No HTML/WebView injection or new dependencies; Markdown remains a normal string in the existing workspace schema.
- Timeline listens to the actual vertical Page scroll. When scrolling down beyond the initial controls, it hides the fixed Days/Weeks/Months zoom selector and Gantt task ribbon/date labels; these return when scrolling up. Nested horizontal chart scrolling is explicitly directional so vertical gestures can reach the parent. Original bar geometry, dependency paths, virtualization and date edits remain unchanged.
- Verified the screen and sub-screen audit for related form controls: shared outlined `Input` resolves the same invisible field issue in task, sprint, backup, custom field, release, planning and finance forms. Existing functionality and CRUD actions remain in place.
- Updated regression tests and QA documentation. No data migration, git action, Expo dependency changes, or deployment.

**Source validation:** see `docs/qa/NP-FORM-TIMELINE-AUDIT-v0.5.51.md`. Physical Android/iOS/Web gesture and keyboard acceptance **not run** in the build container.


---

## v0.5.52 — Fixed Timeline controls and cross-screen interface audit

**Baseline:** v0.5.51 complete source ZIP. **Scope:** correction to pinned Gantt controls and a source-wide interaction, accessibility and information-density review of all top-level screens, nested management forms, charts, sheets and notices. Design references: Frontend Design, Apple Design Skill and the project's Unslop/Ponytail review principles.

- **Timeline (user correction):** Keep Show/Hide Items, First Task, Today, Critical Path, Parent Tasks and To Schedule **always visible** during vertical scrolling. The calendar dates also remain visible. The controls and calendar are outside the vertical Page ScrollView; the date row follows horizontal Gantt pans, Today/First Task jumps, first-focus positioning and drag auto-scroll. The top-level Days/Weeks/Months selector also stays visible. Remove the v0.5.51 fade/hide-on-scroll logic. Preserve task bars, dependency colors, chart virtualization and drag/resizing interactions.
- **Releases:** Replace the legacy inline release metadata fold with a proper draft Sheet, header New release button, footer Save/Cancel, and Markdown notes. No release record is written before Save.
- **Overview:** Filter invalid/undated tasks from the Next due list; add a useful empty state and full-height accessible metric tap targets.
- **Sprints:** Collapse long assigned-task, backlog, and archived-scope lists behind progressively disclosed sections. Preserve search, Show more and assignment actions.
- **Scheduling:** Replace truncated raw proposal JSON with readable per-task date changes, assumptions, issue counts and a guarded Apply action. Choose predecessor/successor by task name instead of typing IDs; disable self/empty relationships.
- **Collaboration and Resources:** Replace technical Task ID input with task-name selectors in reminder creation and time logging, with Save disabled until a task is selected. Original stored task IDs and validation remain unchanged.
- **Specifications:** Long-form description, goal, exit-criteria and content fields now use Markdown source/preview, as do other long-form PM editors. No storage-format migration.
- **Reports:** Velocity handles an empty history and many sprints with a horizontally scrollable, readable chart instead of shrinking columns to illegibility.
- **Activity:** Mobile event rows show full-width timestamps and descriptions rather than a fixed 62-point timestamp column; show history in 50-row increments to keep the page responsive.
- **Costs:** Negative remaining budget is given a semantic critical indication rather than appearing equivalent to positive remaining funds.
- **Charts and notifications:** Burndown touch input no longer captures vertical swipes at touch-down; feedback notices announce errors assertively. Screen-reader announcement behavior remains platform-dependent and requires physical checks.
- **Quality:** Updated stale source-contract tests to validate intended new behavior rather than the reversed v0.5.51 hiding specification. Added v0.5.52 checks for pinned controls and the other corrected screens. Source audit is documented at `docs/qa/NP-CROSS-SCREEN-DESIGN-AUDIT-v0.5.52.md`.

**Validation:** Automated Node tests and JSX syntax checks run on the final extracted ZIP. **Not run:** Android Expo Go, iOS, browser screenshots, actual native swipe responsiveness, and assistive-technology testing. No commit, push, dependency change or data migration.


---

## v0.5.53 — Timeline synchronization, Sprints render and compact header action hotfix

**Baseline:** v0.5.52 FULL project source. Fixes reported from Android portrait, without changing the underlying planning model or saved workspace format.

- **Timeline native synchronization:** Replace the independently scrolled calendar with a pinned, clipped date strip translated from the chart's single `Animated.Value` horizontal scroll offset. Use a stable native-driven event mapping on Android/iOS (JavaScript fallback on Web), so dates and bars no longer chase one another through a separate `scrollTo`. All programmatic jumps target the chart's scroll authority.
- **Timeline visual attachment:** Keep the controls and dates outside the vertical ScrollView, eliminate the calendar/chart seam, and place optional alerts/diagnostics below the chart. The Gantt remains vertically scrollable under the permanently visible ribbon/calendar; task-label rail, bars, gestures, virtualized SVG dependency links, zoom and navigation are retained.
- **Sprints crash:** Import the existing `Fold` component used by assigned-task, backlog and completed-scope disclosure cards. Prevent the `Property 'Fold' doesn't exist` runtime render failure.
- **Global header:** Make the `New task` button more compact (40-point visible height, 12-point label, smaller plus icon and padding) in mobile and desktop headers without changing other buttons; 4-point hit slop preserves a 48-point touch area.
- **QA:** Updated legacy source-contract assertions to test the native synchronization instead of the superseded lagging calendar and added targeted regression checks. See `docs/qa/NP-QA-v0.5.53.md`.

**Limits:** Automated source and Node tests do not reproduce actual Android scroll inertia or touch interleaving. Verify on a physical Android device, on mobile Web and when zooming/reopening Timeline before checkpointing.

---

## v0.5.54 — Noble crypto migration, persistent backup jobs and compact controls

**Baseline:** v0.5.53 FULL source. **Method:** Ponytail Audit of cryptographic backup, job lifetime, local encrypted-file persistence and shared button sizing. This release remains local-first and preserves the existing project/workspace storage schema and `.niyav` v1 backup format.

- **Dependency fix:** Remove `@noble/hashes` and `@noble/ciphers`, whose package internals triggered Metro `./crypto.js` exports fallback. AES-256-GCM now uses SDK 58 `expo-crypto` async native API, HMAC-SHA256 for the existing cancellable PBKDF2 implementation uses `js-sha256@1.0.0`. No global Metro resolver suppression. Old encrypted backups remain compatible by design, with Node known-answer reference tests.
- **Memory safety:** Derivation errors/cancellations wipe password and key byte arrays; the codec performs runtime crypto/gzip self-tests before trusting encrypted operations.
- **Keep working after leaving the Backup screen:** An app-wide, single-flight job controller owns the encryption/decryption operation. Navigation no longer cancels jobs. Progress and explicit Cancel remain available when Backup is reopened.
- **Download after completion:** Completed **password-protected** files are kept in app-private `Paths.document`, with nonsecret metadata in AsyncStorage. Settings → Backup shows Download backup and explicit Discard saved backup. Finished files survive ordinary app restarts; a new ready backup replaces the previous one. Unprotected JSON and gzip files still share immediately and are never stored as completed 'encrypted' jobs.
- **Deferred decryption application:** Unlocking may continue while another screen is shown, but decrypted text stays only in memory until the user chooses to import or review a full-workspace restore. Original workspace ID is checked before project import; no auto-apply across workspaces.
- **Interrupted sessions:** If a process dies before completing, a nonsecret operation marker explains the interruption on return. Passwords and plaintext are never stored for automatic resume. Actual work when the OS backgrounds the app is **best effort only**: Expo Go cannot guarantee uninterrupted execution, and a native Android foreground service would require a separate development APK. This release does **not** implement such a service.
- **Global buttons:** Main UI-kit button, chip, segmented and icon control visuals are unified at a 40-point control rhythm, based on the compact New task header button. Existing user-selected theme accents remain intact; touch padding is retained.
- **QA:** `docs/qa/NP-PONYTAIL-AUDIT-v0.5.54.md`, `tests/store/crypto-migration-0554.test.cjs` and `tests/store/backup-background-0554.test.cjs`. Automated Node and source parsing checks only; Android/iOS native behavior and npm install still require real-device verification before committing.

**Install/rollback:** Keep `.git`, `node_modules` and app local storage. Extract the full v0.5.54 ZIP at project root, run `npm install`, `npm test`, and `npx expo start --clear`. Do not uninstall the app; export a working full-workspace backup on v0.5.53 first. Revert the source/lock files to v0.5.53 if any old `.niyav` file fails to open, then report the runtime error. No Firebase or Git operations were performed.


---

## v0.5.55 — Backup completion Island, safe retry UX, daylight accents and deep AMOLED

**Baseline:** v0.5.54 full source, retaining its independent backup job controller, crypto packages and `.niyav` v1 wire format. No migrations, package dependencies, or Firebase operations.

- **Island notices:** Finished encryption, finished decryption, failures and cancellation now send a job event from the screen-independent backup controller. The application shell renders a themed Island for the event, including when the Backup screen is unmounted; if completion occurs while the operating system has backgrounded the app, the Island appears on return to the active state. Events contain a message and route only, never passwords, plaintext, or derived keys.
- **Action and gestures:** Tapping a backup Island opens Settings → Backup and selects its Backup tab. Swipe horizontally to dismiss, pull down to expand; a further downward pull reveals the rest of a long message; swipe up or use the collapse affordance to close. Backup completion notices remain until interacted with. Existing routine informational notices still auto-collapse, and errors require manual dismissal. Island background uses the selected theme's accent with contrast-appropriate foreground.
- **Password UX, without weakening crypto:** The encrypted file remains selected in memory after a failed password attempt, so the user can retry without selecting it again while the Backup screen is mounted. Typed password inputs are cleared at job start. The progress copy explains that safe wrong-password detection needs PBKDF2 to finish, and that a cheap early password verifier would accelerate offline guessing. No password verifier or lighter KDF was added. AES-GCM cannot distinguish a wrong password from file tampering; failure messaging preserves that ambiguity.
- **Daylight:** Amber uses a golden amber `#A88100` rather than muddy brown `#8A5A00`; Claude Orange is brighter `#E57351`. Their button text remains contrast-checked.
- **AMOLED:** Pure-black `#000000` background, surface and secondary surface RGB reduced to ~20% of their Dark counterparts, darker accent control fills and boundaries. Main text and accessible foregrounds remain readable rather than dimming all text.
- **Tests:** Existing source and Node regression checks, plus `tests/store/backup-notices-0555.test.cjs` for notification events, deep linking, retry semantics, surface darkness, and all-accent button contrast. QA notes in `docs/qa/NP-QA-v0.5.55.md`.

**Limitations:** No instantaneous detection of an incorrect password for `.niyav` v1. Android/iOS can suspend/terminate ordinary JavaScript when the app is backgrounded; no foreground service was added. Gestures and native Web/Expo Go behavior still need physical-device acceptance. No Git commit or push was performed.


---

## v0.5.56 — Daylight Amber/Orange calibration and AMOLED surface visibility

**Baseline:** v0.5.55 complete ZIP. No storage-format, cryptography, workflow, notification, or dependency changes.

- **Daylight Amber:** replace `#A88100` with clear golden amber `#C58F00` (more yellow and luminous, less brown). The lighter visual target is intentionally more vivid, while the foreground remains contrast-calculated.
- **Daylight Claude Orange:** replace `#E57351` with slightly brighter `#EB805E`, preserving the original warm Claude-orange identity.
- **Preview fidelity:** Settings → Appearance → accent picker shows the actual light-mode primary color in the second half of each swatch when Daylight is active; the first half remains the palette reference. The Dark/AMOLED picker preserves existing gradient stops.
- **AMOLED contrast:** background stays pure black `#000000`, but card surfaces shift from 20% to 92% and alternate surfaces from 20% to 88% of the existing Dark RGB values; outlines lighten to `#33383A` and filled accents from 47% to 86%. This avoids unreadably crushed black-on-black cards while remaining distinct from Dark mode.
- **Regression tests:** update superseded exact-color/80%-dimming contracts, and add tests for Dark/Daylight invariants, ten-accent button/text contrast and live Daylight swatches. Version manifests synchronized to 0.5.56.

**Device acceptance:** Switch Settings → Appearance to Daylight before judging Amber and Claude Orange; the screenshot that prompted the fix showed Dark selected. Compare AMOLED/Dark visually on Android portrait. Node/source tests cannot establish actual device appearance. No Git or Firebase action performed.

---

## v0.5.57 — Rename theme palette module

- Rename `src/ui/theme/rivnaPalette.cjs` to `src/ui/theme/themePalette.cjs` and update its direct imports in theme, governance risk screen, and regression tests.
- No color, theme ID, saved preference key, layout, domain, or backup format change.
- Existing historical changelog entries retain old filenames as the accurate record of their release.
- Full source archive: extract at project root, no enclosing folder. Re-run the tests and Metro on the Android device before committing.


### v0.5.57 corrected build — user palette, navigation icons and wordmark

**Version stays 0.5.57** in the app, package metadata and install ZIP. No new product release number or data migration.

- Apply all ten supplied `src/ui/theme/themePalette.cjs` color rows exactly. AMOLED keeps `#000000` background, `surface` = 50% of accent Dark card RGB, and `surfaceAlt` = 35% of Dark background RGB. Theme preference ID and saved appearance key are unchanged.
- Make only the shared **New task** primary button's label and plus icon white in Daylight. Other primary actions keep the usual contrast-aware color choice, as before.
- Show a **sun** for Daylight, **outline moon** for Dark, and **filled moon** for AMOLED on the hamburger drawer's appearance control. Retain the three-mode cycle.
- Replace the 15px hamburger icon with a three-stroke 18px custom icon, rotating between horizontal (closed) and vertical (open); both the header and visible modal close affordance animate without adding a new dependency.
- Replace the platform-system-font **PROJECTS** text with a transparent, theme-tinted monoline vector mask drawn to match the existing custom-stroked **niyarvo** wordmark. The original brand letterforms are custom paths rather than a font file, so this is a companion drawing, not an installed font. Logo scale, right alignment and color intent remain.
- Update stale exact-palette/logo assertions and add `tests/ui/theme-prefs-057.test.cjs` for the user palette, glyph behavior and version invariance.

**Limits:** Android/iOS/Web menu motion, wordmark legibility and Daylight white-ink contrast on very light user-selected accents require visual testing. Source tests are not proof of a native render. No backup, crypto, workspace or project-state change.


### v0.5.57 UI hotfix — button ink, navigation anchor, logo scale

**Version remains 0.5.57.** Based on the corrected full source. No palette, AMOLED multiplier, encryption, backup, schema, storage-key or dependency change.

- **Accent-filled controls:** Main `Button` primary actions now display white labels and glyphs for all theme modes, rather than a contrast-selected dark foreground on lighter accent fills. The same white glyph is used for solid icon buttons, completed-task checkboxes, and the accent-filled Island notification. Tappable custom-color task labels also display white; noninteractive labels retain contrast-aware ink. This is an explicit visual preference; white on bright accent fills (especially Amber and dark-mode Lime) may not satisfy contrast guidelines.
- **Mobile hamburger:** The open-state toggle appears inside the drawer, aligned to the same top-left position as the closed-state button. The old extra button to the right of the open drawer is gone. The underlying header toggle is not rendered while the native Modal is visible. Keep the horizontal-closed / vertical-open 190ms native animation and backdrop-to-dismiss behavior.
- **Logo:** PROJECTS text mask uses `c.accent`, the same color token as the N monogram, at 80% of its former dimensions in compact, narrow and full-width brands; right-edge alignment is retained. Original Niyarvo lettering remains unchanged.
- **QA:** `tests/ui/release-057-ui-hotfix.test.cjs` covers white accent controls, all brand sizes, single visible menu toggle, version and palette invariants; legacy source expectations were updated to match the user's design requirements. Physical device acceptance still required.

---

## v0.5.58 — Brand morph cold start and drawer integration

- Based on the user-verified v0.5.57 UI Hotfix. Version synchronized in `package.json`, `package-lock.json` and `app.json`.
- Added a logo-only, centered cold start using the approved flicker-free N→Board SVG geometry at **1× speed** (3.7 seconds); the workspace mounts after completion. Selected accent and appearance are restored first.
- Replaced the legacy N in Projects sidebar branding with the finished Board icon. The phone drawer replays the identical morph at **1.5×** on every open. `PROJECTS` and other wordmark assets retain their sizes and theme tint.
- Moved the appearance-cycle control beside the hamburger at the top of the phone drawer; keeps one menu toggle.
- Precomputed the original 72-point vector contour alignment; changed runtime to pure `react-native-svg` compound path geometry with no WebView or masks. Three ribbons remain fully visible through morph. Six cutouts reveal in 3–2–1 order after the columns settle.
- Includes reduced-motion support and cleanup of animation frames on unmount. No new dependencies, business-logic changes or `.niyav` backup format changes.
- Added 5 targeted motion tests and updated version/brand expectations in older tests. See `docs/qa/modern/NP-v0.5.58-PONYTAIL-AUDIT.md`. Native device motion and startup acceptance remain to be checked.
