# Milvayo 0.7.10 startup and responsiveness repair

Implemented in the main source on `work`, following the owner’s later workspace correction. The temporary redesign copy created at the start was removed. The owner subsequently designated this completed repair **0.7.10 / Android 80 / iOS 80**, before the separate 0.7.11 interaction changes. Historical logs/fixtures below were collected while the source still identified as 0.7.9; their measurements have not been relabelled as new runs. No builds, prebuild, Gradle, EAS, Playwright, Metro restart, commits, pushes, dependencies or workspace migration. Existing owner ZIP changes remain untouched.

## Skills, findings and resulting changes

| Skill invoked | Finding applied |
| --- | --- |
| Impeccable context → native audit → optimize/adapt → polish | Preserve the Quiet Work Studio. Wrap narrow project budget/actions, align two-line fact labels, use 48-unit Android shared actions/icons/settings rows. Visual review caught and removed a duplicate Projects introduction. |
| Ponytail Audit (read-only diagnostic pass) | Trace startup/store/projection/card paths first. Remove unused Projects imports; preserve existing metric caches and model safeguards. Target eager native cards and explicit startup waits rather than installing a new state/animation system. |
| Expo animation + Software Mansion RN/animation/SVG guidance | Run native playback on a memoized UI frame callback after native layout. No per-frame React state or JS calls. Retain the exact start/end geometry and selected accent, move cold ribbons early with smoothstep interpolation, reveal windows progressively, retain one final frame, cancel stale epochs and honor reduced motion. Original longer preview timing remains the default. |
| Callstack React Native performance | Measure → change → re-measure. Native Projects uses existing FlatList with two initial cards/two per batch and a bounded render window. Keep drafts outside recycled rows and defer filtering. Add startup, commit and synchronous-work measurements without weakening validation. |
| UI/UX Pro Max | Executed touch-target/spacing and React Native list searches. Apply Android 48-unit targets, wrapping, readable values and scroll-driven loading. Installed RN 0.88.1/Reanimated 4.7.1 source is the API authority. |
| Bundled Unslop | Before audit and five-line direction in `PLAN.md`; preserve spacing/color/icons/copy/type/layout/detail/visual/motion order and incumbent identity. Unslop by [Damir Sokolovsky](https://heydamir.design/unslop), CC BY 4.0. |

All named capabilities were available; no substitution. Skills were used for implementation and verification, not only listed. Native screenshots/build workflows in skill guidance were superseded by the owner’s no-build constraint; native acceptance remains Not run.

## Confirmed causes and limits of attribution

1. **Startup gate:** `ColdStartGate` withheld Shell until the default 3700ms logo finished and a separate 1000ms timer elapsed. That 4700ms configured wait explains most of the owner’s 4876ms normalization-to-shell gap; storage normalization was not its cause. The repair prepares Shell during playback and removes the final timer. Opening still requires restored appearance, safe workspace readiness and completed branding.
2. **Motion lifecycle:** playback previously started from a mount effect, without waiting for native layout, and completion could remove the logo in the same frame as final props. The original phase curve also had long nearly-still sections at cold-start speed. Native playback now starts after layout, advances independently of JS, renders the final state for a frame, then reports completion with epoch guards. A queued-JS-callback test proves continued simulated UI progress. These are source/lifecycle findings; the exact on-device freeze cause and continuous native frame pacing still require the owner’s report.
3. **Projects mounting:** the old native ScrollView eagerly reconciled up to twenty detailed cards. Project metrics were already cached per immutable project; adding another cache would not fix that mounting work. The native list now initially renders two cards, batches two and uses a five-viewport window. Web and embedded managers retain existing pagination. Unsaved/rejected editor drafts survive row recycling and remain workspace-scoped; failed project selection stays on the list.
4. **Empty React section:** Profiler wrappers remained in the app, but the installed standard production renderer omits the development `onRender` path (`ReactFabric-prod.js` versus `ReactFabric-dev.js`). Keep real callbacks in supporting runtimes and add production screen render-to-commit samples. Those wall-time estimates include scheduling/child work; they are not React CPU durations. Child-only commits require their own probe; project cards/details have separate counters.
5. **Projects timer stalls:** a screen label on a 1179ms timer delay does not identify the blocking function. Initial mount work is reduced, and mutation, normalization, projection, backup-budget and serialization paths now have bounded timing aggregates. The complete cause/frequency of the owner’s one-second stalls remains unverified on Android; no fabricated reduction is claimed.

## Owner’s added Board requirement

Each list mounts **five initial cards**. A bounded nested scroll region replaces Show more. Scrolling near the loaded end adds at most five; layout/programmatic events without user intent, idle time and hidden tabs do not silently grow the list. Web wheel/keyboard and accessibility scroll actions are supported. Filter changes reset the initial window before rendering new results.

Loaded cards remain mounted for this board view to preserve title drafts and held responders. This is demand mounting, not perpetual five-row recycling. Full logical order and filter-aware `dropBefore` are preserved. Dropping below the mounted tail inserts before the next unseen task. Measurements include page/list scroll; card offsets include source-list scroll; held cards auto-scroll their target list; unmounted measurements are removed. The existing hold responder, lift/reflow animation and Timeline gesture engine remain.

## Before/after evidence

The owner’s v0.6.3/v0.7.9 sessions had different workloads. Keep those observations separate from local controlled fixtures.

| Measurement | Before | After | Evidence / interpretation |
| --- | ---: | ---: | --- |
| Owner Android startup → shell | 4935ms in 0.7.9; 705ms in 0.6.3 | **Not run** | Device measurements supplied by owner, not an agent benchmark. |
| Configured cold branding wait | 3700 + 1000ms | 1100ms + one rendered frame | Source and clock-controlled lifecycle tests; shell preparation is now concurrent. Not an OS launch measurement. |
| Native Projects initial card policy | 20 | 2 | Real component props and source-rendered card action counts; 90% fewer initial cards. |
| Board initial cards per mounted list | 10 | 5 | Scroll-demand behavioral tests; no Show more. |
| Paired native-policy source render (JS wall time) | 306.66ms | 42.20ms | `paired-render-benchmark.json`, nine alternating samples after ten warmups per variant in one Node process. Native-policy case uses a FlatList adapter and never measures Android. |
| Paired web source render (JS wall time) | 321.55ms / 20 cards | 327.23ms / 20 cards | Existing pagination preserved. Source timing fluctuates with host scheduling/GC and is not real-browser interaction latency. |
| Owner Projects JS timer delay | 1179ms / 935ms in 0.7.9 | **Not run** | Requires the same installed Android runtime/workspace and new diagnostic report. |

Repeated source-render runs varied materially; deterministic mounting counts are the firm result. Do not translate source-render fixture ratios into Android startup/FPS claims. Exploratory unpaired render JSON files were removed; use only the paired benchmark.

## Profiling and instrumentation

Startup now records normalization/readiness, restored theme, first root/Shell render and commit, native layout callbacks, first UI-logo-frame callback, logo completion/frames/max gap, reveal and a double-rAF first-interactive-frame **JS estimate**. Render-start timestamps are captured during render and published only on commit. Milestones begin at JS diagnostics initialization, not OS process launch; receipt of native layout/UI callbacks can lag on busy JS.

Screen commit probes cover every routed screen, with separate Projects card/detail samples. True React Profiler callbacks remain unchanged. Runtime reports identify development/production where available and Hermes where detected. Synchronous timing wrappers preserve results and thrown failures. Aggregates/milestones are capped at 32 names, ordinary writes share the existing 200ms window, and errors/background flushes remain immediate. No per-frame diagnostic persistence or diagnostic subscriber notifications on each commit. Privacy sanitation remains in place.

## Validation and visual review

**Pass:** 845 tests (zero failures/skips/cancellations), 205 app/entry parses, 25 native files plus one shared worklet module transformed, and offline Expo compatibility with its explicit warning. No runtime acceptance is implied.

Final machine-readable results are in `verification.json`; full suite in `full-tests.txt`, syntax/worklet evidence in `source-check.json`, dependency check in `dependency-check.txt`. Focused tests cover startup/layout/final-frame/cancellation/reduced-motion, production commit reporting/aborted renders/bounded persistence, virtualized drafts/selection failure, and Board scroll/filtered-tail placement/auto-scroll/cleanup. Historical ten-card/Show more assertions were updated for the explicit new requirement; existing business/backup/sprint/Timeline tests remain.

Source-rendered Projects fixtures at 320/390/780/1440 and Board at 390 use real JSX with injected local sample data, inert effects and an SVG adapter. Board uses twenty synthetic cards to demonstrate the initial window. These are composition evidence, not running Expo/native screenshots. Inspected the original and corrected narrow composition, wider layout and cold geometry frame strip. Final polish removed the duplicate introduction and retained the original typography/palette/buttons/artwork. [Logo frame strip](logo-frames.png) samples actual geometry helpers, not device playback.

Source-only native audit: Accessibility 3/4, Performance 2/4, Theming 4/4, Platform conformance 3/4, Adaptivity 3/4 (**15/20**, provisional). Appearance/logic checks pass; device gesture, TalkBack, large-font and frame-pacing verification prevent a native acceptance verdict. Native scoring is limited to these audited workflows. Existing Impeccable `design.json` sidecar is stale; it was not rewritten as a side effect. `impeccable document` can refresh it when requested.

## Files and preservation

- Startup: `src/app/ModernApp.js`, `src/components/brand/BoardMorph.js`, `BoardMorph.native.js`, `morphMotion.cjs`.
- Projects/controls: `src/screens/governance/Projects.js`, `src/components/inline/CompactTools.js`, `src/ui/uiControls.js`.
- Board: `src/screens/board/Board.js`, `src/board/cardMountWindow.cjs`, `boardDragContext.cjs`.
- Diagnostics/store: `src/diagnostics/core.cjs`, `monitor.js`, `useRenderMetric.js`, `src/store/store.js`; routed screens receive only the probe import/call except the explicit Projects/Board work.
- Tests, source review helper, design/usage docs and the one cumulative changelog are updated. No copied third-party assets or new packages.

Timeline component changes are only its diagnostic import/call. The entire `src/gestures/` and `src/timeline/` engines, Board gesture/motion platform files, theme palette, workspace models, scheduling/dependency rules, frozen sprint semantics, import formats, signing files and native icon adapter are unchanged. Reanimated strict validation and console forwarding remain enabled.

## Android acceptance and reversible handoff

Follow `docs/instructions/startup-performance-repair.md`. Owner checks five comparable cold launches, selected themes/reduced motion, warm resume, real Projects scrolling/search/drafts, nested Board scroll versus hold, drag clipping/auto-scroll, drops before unseen cards, large text/rotation and existing Android/web Timeline pinch/presets. Share the new performance report; native FPS/OS launch and disappearance of one-second timer stalls are still Not run by agent.

No data migration or reinstall. Review this repair’s diff against **d786468** before reverting; restore only its changed files and remove its new files if declining the candidate. Preserve unrelated ZIP changes, credentials, app storage and signing keys. No destructive Git reset/clean, no commit or remote action. The candidate is ready for owner Termux/device verification.
