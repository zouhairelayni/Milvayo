# Focused performance / UX audit — 0.6.3

Scope: existing redesign/work only, no builds, Playwright, device automation, dependency additions, commits/pushes or main integration. Callstack / Software Mansion / Vercel React Native guidance inform measurements; Impeccable optimize/polish and Unslop by Damir Sokolovsky (CC BY 4.0) inform the refinement. Motion review uses improve-animations in quick audit mode; implementation follows the installed Expo/Reanimated conventions. Existing source screenshots were viewed; they predate recent controls and are composition context only, never current runtime proof.

Before audit: spacing → retain established controls and compositions; color → retain neutral Dark/AMOLED and personal accent; icons/copy/typography → preserve; layout → preserve bounded task/board lists and shared manager; details → failed bulk status must keep selection; visuals → keep charts and SVG artwork; motion → retain the approved list/card lift and gesture tracking, clean up delayed reveal work on unmount. No replacement design or extra decorative motion.

Product: precise local-first project workspace.
Character: calm, exact, dependable.
World: focused planning instruments.
Moments: current work, truthful charts and direct Kanban/Timeline interaction.
Signature: Milvayo Board mark and selected accent.

## Confirmed targets and implementation plan

| Priority | Location | Evidence | Controlled fix |
| --- | --- | --- | --- |
| P1 | domain/modernBridge.cjs portfolios | 400 health calls per edit with 10×1000-task projects shared by 20 portfolios; median ~777ms in the isolated Node baseline | Reuse a health summary per immutable project/day; invalidate on a new project or local day. Preserve health/progress formulas and workspace order. |
| P2 | domain/modernBridge.cjs sprints | Rebuilds the whole velocity array for each completed sprint | Compute velocity once per sprint projection; preserve frozen history semantics in agile.cjs. |
| P2 | domain/dashboard.cjs / ui/DateRail.js | Date labels use Intl for each day, scan tasks for each date; callback identity invalidates adjacent-page calculations even when date/task data is unchanged | One-pass due aggregation, deterministic UTC English weekday labels, memoize only actual page data/capability. Preserve IDs, order, Done counts and paging behavior. |
| P2 | diagnostics/monitor.js | Every breadcrumb queues JSON/storage work; verify write count with deterministic async storage/clock harness | Coalesce ordinary saves for at most 200ms; errors, clear and app background persist immediately. Preserve live counters, reports, bounded breadcrumbs and failed-write retry. |
| P2 | screens/tasks/Tasks.js | applyBulk always clears selected tasks even when the store returns false; bulkSet already preserves selection on failure | Use the same accepted-mutation rule for bulk status. |
| P2 | ui/Reveal.native.js | Delayed animation effect has no cancellation on unmount | Cancel the pending Reanimated work without changing its curve/duration or approved motion. |

Retain existing StoreFreeze, page retention, native column/task windows, UI-thread gesture poses, model validation, snapshot budgets, data/import formats and protected parent. Do not introduce speculative memoization, a new state library, a gesture rewrite or a blanket animation reduction. CPU samples and mock-storage operation counts are not native FPS/INP/startup/heap measurements.


## Measured results

Same Node v24.18.0 process engine / container, five warm-process samples per CPU case. Each fixture is synthetic: 1,000 tasks per project, 10 projects, 20 overlapping portfolios; only one project changes per projected edit. Fixture construction/normalization is outside timing. Full source helper: `tests/helpers/focused-performance-benchmark.cjs`. No actual user data is used. The diagnostic burst uses a fake clock and async storage, not the device filesystem.

| Target | Before | After | Interpretation |
| --- | ---: | ---: | --- |
| Project-view derivation after one project edit | 776.6212ms median | 2.6583ms median | 99.66% less CPU time in this selector fixture; not whole-app/render/FPS improvement |
| Health calculations, cold view | 400 | 10 | One per referenced project |
| Health calculations, next edit | 400 | 1 | Unchanged project summaries reused |
| 21-day due distribution, 1,000 tasks | 4.0849ms median | 0.1603ms median | 96.08% less CPU time; no repeated Intl formatter or per-day full scan |
| Ordinary diagnostic burst (100 events, 5ms spacing) | 100 mock writes | 3 mock writes | 200ms maximum batching window; live counters/events update immediately |

Evidence: `focused-performance-before.json`, `focused-performance-after.json`. No Android FPS, memory, startup, ANR, native crash, battery or input-latency improvement is claimed. Small workspaces without portfolios will see a different benefit; the repeated-work defect scales with portfolio overlap.

## Completed changes and safeguards

- Project health uses a WeakMap keyed by immutable project identity and local day. New project objects and date rollover invalidate it; there is no unbounded ID cache. Portfolios refresh on the next projection after rollover; no midnight timer or background service was introduced.
- Sprint projection derives its velocity lookup once. Existing `agile.cjs` lifecycle/frozen-history logic remains authoritative and unchanged. Completed history was compared after current-task edits and JSON import.
- Schedule aggregation is O(tasks + days), uses UTC English short weekday names matching the prior output, preserves task ID ordering, and keeps Done/due distributions truthful. DateRail depends on page data and shift capability rather than callback identity. It still uses native paging and never writes task dates or sets React state per scroll frame.
- Diagnostic state/counters/reports remain live. Ordinary storage writes share a bounded 200ms window; JS exceptions, explicit clear and app background bypass that window. Failed writes remain retryable, and stale pre-clear generations cannot overwrite a cleared report. Fast Refresh flushes a pending batch and removes timers/hooks. Original console handlers and strict warnings remain in place; warning/error counters are now also queued for persistence. **Limit:** abrupt native termination can lose up to the pending ordinary-breadcrumb window; immediate flush attempts still depend on the OS permitting async storage. Native termination cannot be made crash-proof by JS.
- Rejected bulk task status operations retain selection for retry; successful ones clear it. Existing store validation/error feedback still governs acceptance.
- Native Reveal cancels delayed animations on effect cleanup. Timing, curve, reduced-motion configuration, charts, date interactions and the owner-approved Kanban lift/tilt remain.

## Motion/UX review

Read-only motion triage prioritized interference with task input and wasted work over adding effects. Live pointer motion is still direct; hidden pages still freeze; visible task/Board rows remain bounded. No new loops, gesture library, spring tuning, animation removals or navigation rebuild were justified by the available evidence. The one implemented motion cleanup preserves appearance and prevents work continuing after its view leaves. The polish change is failure recovery in bulk actions. Existing source fixtures were visibly inspected but predate later controls; no fresh visual acceptance is implied. Native touch-target/large-font/keyboard/gesture feel and UI quality are **not scored** without runtime evidence. No speculative numeric accessibility/platform score is assigned.

## Verification and engineering limits

- **Pass:** 106/106 focused tests across new performance/operation-count regressions, cache invalidation, schedule output, diagnostic immediate flush/failure retry/clear, task selection recovery, date-rail memo behavior, motion cleanup, model/bridge/planning/agile invariants, import round trips, current UI controls and folder/import structure. `focused-performance-tests.log`.
- **Pass:** 196 app code files parse; 18 native Reanimated/worklet transforms; `focused-performance-syntax.json`. These are source transforms, not a build. `git diff --check` passes.
- **Pass with limitation:** offline Expo install --check says dependencies are up to date and warns offline validation is unreliable; `focused-performance-dependencies.log`. No dependencies were added or changed.
- **Pass:** all 761 parent baseline files remain unchanged (`focused-performance-parent-check.json`). Release remains 0.6.3/build 63 and changes remain on redesign/work.
- One old Timeline diagnostic source assertion referenced the earlier Hide/Show items button. It now checks the existing task-name menu labels; Timeline source/gestures were not edited.
- **Not run:** full npm/heavy suite, live Metro/Fast Refresh, browser/Expo Go/native acceptance, device profiling, native logs, heap snapshots, screenshots of this final revision, builds, commits, pushes or main-app integration. Existing supplied device reports are historical context, not new baseline/after acceptance.

## Phone acceptance and reversible review

Use the existing Metro/Fast Refresh workflow rooted at `~/Milvayo/redesign`. In the same workspace/data on the same phone, compare these flows: type/edit a project that belongs to several portfolios; navigate Home → Board → Timeline → Tasks repeatedly; swipe Home weeks and tap day filters; long-press/reorder a Board list and drag a card; use a deliberately rejected bulk status edit and confirm selection stays; open Diagnostics and copy a fresh performance report. Capture comparable JS render/transition/warning counts. Hardware FPS, native memory and process termination still require device evidence.

No storage/import migration is needed. Do not uninstall or clear data. Returning to the untouched parent application reverses the candidate experience; explicitly export new candidate work before switching copies. Keep main integration for separate owner approval. The remaining highest-value investigation is device profiling of actual input/drag/navigation under this final candidate; avoid guessing at a new architecture or promising zero crashes.
