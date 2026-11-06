# Milvayo 0.6.3 — engineering handoff

2026-11-06 · Implementation phases A–E · Local branch `work` · Changes applied in place.

Release relabeled from 0.6.2 to **0.6.3** at the user’s request. Versions and Android/iOS build numbers are now 0.6.3 / 63. Existing filenames, raw runtime evidence and the 771-test full-suite result describe the preceding 0.6.2 validation and are preserved. This metadata-only follow-up passes the release-metadata test and explicit version/build assertions; the full suite and runtime checks were not repeated. No builds or pushes.

**Result:** source fixes, screen refinements and web regression testing are complete. **771/771 automated tests pass.** Desktop Timeline reaches the last row with 34 and 1,000 scheduled tasks while retaining bounded rendering. The tested Chromium startup/navigation/zoom/pinch paths finish without console errors or warnings. **Ready for Termux/device acceptance, not an approved production release.** Android/iOS runtime, launcher reconciliation and native performance remain unverified. No build, prebuild, export, commit, push, merge, tag or deployment was run. Playwright was neither installed nor used.

## 1. Root causes and evidence

| Reported defect | Finding and confidence |
| --- | --- |
| Web `BoardMorph` / `WebShape` stack | Reproduced the full React console error: `Received true for a non-boolean attribute accessible. If you want to write it to the DOM, pass a string instead ...`. The mark passed native `accessible` directly to web SVG. Fixed at the component boundary. The actual browser continued rendering before the fix; this reproduction establishes an invalid DOM prop, **not a proven fatal startup exception**. The original partial stack alone cannot establish a second fatal cause. |
| Reanimated reading a shared value during render | The native Timeline scroll adapter passed a gesture object into core RN `Animated.createAnimatedComponent(RNGH ScrollView)`. Installed RN `AnimatedProps` / `AnimatedObject.flatAnimatedNodes` recursively enumerate nested props, reaching shared-value getters during React render. Gesture configuration now belongs to an outer RNGH native detector; core Animated receives ordinary scroll props. A throwing-getter regression proves the boundary. This is a verified source-level hazard; absence of the reported warning on Android still requires device execution. |
| Stretched calendar numerals during pinch | Header and bars inherited a parent `scaleX` preview. Added inverse scale on glyph containers, with matching origins. Geometry keeps the same live transform; text, milestone symbols and link dots retain proportions. Chromium touch input measured date glyph width at 15.28125px before and during pinch, difference 0. Native counter-scale worklets pass deterministic tests; native visual acceptance remains open. |
| Slow zoom buttons | Every density change rebuilt visible chart elements, formatted dates with Intl and could queue independent commits. Labels now use memoized UTC selectors, routing is cached separately from viewport filtering, input paints a geometry preview immediately and commits the latest input once per frame. Measured DOM width changes synchronously; final development commits still have measurable cost (section 4). |
| Desktop Timeline stalls midway / misses bottom rows | The nested horizontal ScrollView lacked an explicit, nonshrinking chart height; row windowing relied on repeated global measurements and a throttled handler could omit its trailing update. Chart height now preserves the full vertical extent. Windowing derives from the owning Page's scroll/viewport and updates only when row boundaries change. Removed rejection of valid empty windows. Final rows are visible across presets in both browser fixtures. |
| Weeks/Months blank until scrolling | Presets previously left drawing and calendar offsets outside the resized canvas. Preserved the earlier immediate rebase fix and regression checks; browser preset calendar content is recorded before another scroll/First task action. Bounds can clamp the focal date when a whole chart fits the viewport. |
| Startup delay | The 3,700ms JS logo animation gated mounting the store. Theme and store now restore concurrently, with a static brand loading state; the shell opens when ready. Branding is preserved without imposing the animation's duration. |
| Theme exits / duplicate launcher entries | Earlier 0.6.2 fixes separated UI appearance from native alias application. Theme effects no longer switch aliases. Settings asks for explicit confirmation and saves first; failed saves block the switch. The original Android adapter reconciles actual enabled aliases instead of using the stale launching Activity. Native acceptance is pending. |
| Follow system theme | SDK-compatible `expo-system-ui` was missing; added `~58.0.7`. `useColorScheme` remains the source for System. Web light/dark media changes work. Adding native modules requires a separately authorized future installed build; Fast Refresh cannot supply them. |
| Unclean pinch session / shell remount | Supplied JS reports do not prove a native crash, OOM or ANR. Prior-run breadcrumbs and optional Android OS main-process exit history are retained. Normal foreground/background does not intentionally remount the shell. Fast Refresh may trigger its development remount tripwire. No native crash was reproduced or ruled out here. |

Reviewed `.value` / `.get()` accesses in Timeline pinch, diagram gestures, shared gesture surfaces and hold/drag code. Event callbacks, animation callbacks, effects and worklets retain permitted reads. `BoardMorph` uses ordinary React state, not a Reanimated shared value. Strict Reanimated diagnostics remain enabled; no global warning suppression was introduced.

## 2. Changes and invariants

- `src/app/ModernApp.js`, `src/store/store.js`: concurrent appearance/workspace restoration, static loading identity, startup storage/normalization breadcrumbs; root diagnostics initialization before passive hydration work.
- `src/components/brand/BoardMorph.js`: web `role`/`aria-label`, native accessibility props retained.
- `src/gestures/TimelineScrollView.native.js`: separate native gesture detector around core Animated ScrollView. `TimelinePinch.js` / `.native.js`: stable controller, immediate button preview and inverse glyph scaling. Gesture tracking is direct; no tween is placed under the finger.
- `src/screens/timeline/Timeline.js`: fixed chart extent, owner-based virtual rows, pinned synchronized calendar, cached dependency routing, immediate preset offsets, coalesced zoom input and correlated timing.
- `src/screens/timeline/TimelineZoomControls.js`: authored SVG magnifiers; `src/timeline/zoomQueue.cjs` and `timelineDisplay.cjs`: deterministic queue/UTC selectors.
- `src/screens/board/Board.js`: cache drag-order identifiers between actual list/card changes; preserve grouped selectors, card memoization, ten-card progressive windows and measured drag behavior.
- `src/screens/governance/Projects.js`: name/code search and progressive 20-project presentation. Existing project metric WeakMap caching remains; no claim that this pass introduced it.
- Shared UI and the Overview, Board, Tasks, Sprints, Projects, Programs, Portfolios, Settings and More screen entries refined together.
- `src/diagnostics/core.cjs`, `monitor.js`: privacy-preserving warning fingerprint counts; original console methods still emit messages. Prior native icon/exit-history adapters remain in this patch.

**No schema/import-format migration, automatic project import, Firebase project, remote security claim or dependency for the redesign.** Existing normalization, failed-load protection, backup recovery, scheduling, dependency-cycle checks, inclusive move/resize rules, evidence/merge gates, audit history and frozen sprint burndown remain covered by the suite. Metadata is synchronized at 0.6.3 with Android/iOS build numbers 63. The existing lockfile's Metro setup is preserved.

## 3. Design and interaction changes

Applied the bundled **Unslop by Damir Sokolovsky (CC BY 4.0)** as a review standard, preserving its attribution and Milvayo's established Niyarvo visual direction. The nine-step before audit and five-line product direction are in [AUDIT.md](AUDIT.md).

Read/applied Impeccable (refinement in the established product world), Frontend Design, UI UX Pro Max (accessibility/drag alternatives and React Native virtualization guidance), Emil Kowalski design engineering, Expo animation, Callstack performance and Software Mansion React Native/gesture/SVG guidance. UI UX Pro Max's product-wide generated match was an irrelevant marketplace/conversion design even after a narrower retry; it was rejected. Its relevant accessibility/stack guidance was used. No new palette or third-party product UI was transplanted.

| Before | After | Why |
| --- | --- | --- |
| Overview KPI cards competed with tasks; oversized serif progress numeral | Compact four-fact rail, clearer Today introduction, modest tabular progress and explicit next actions | Make status and work easier to scan, with fewer nested containers |
| Board heading competed with its filter/tools ribbon | Current board, visible-card/list counts and hold instruction lead; cleaner card padding/corners and existing status/owner metadata | Explain context and preserve working drag affordances |
| Timeline text-chip zoom controls in the ribbon | Two 18px SVG magnifiers over the chart corner; 44px targets, translucent surfaces, tooltips, focus, hover, pressed and disabled states | Requested compact visual design with practical interaction size; date ribbon stays clear |
| Pinch scaled text along with bars | UI-thread/compositor geometry tracking with inverse glyph scale | Preserve readable typography while changing time density |
| Task list lacked a concise content introduction | Task count/progress and Add task grouped with a shared introduction | Separate task creation from filtering and maintain list scanning |
| Sprint entry lacked planning context | Sprint planning heading and active-date/frozen-history explanation | Make lifecycle and historical meaning explicit without changing domain semantics |
| Projects immediately mounted all active project cards | Find by name/code, show 20 results, explicit Show more and no-match guidance; clear Create action and budget/risk columns | Reduce initial work and help find projects in large workspaces |
| Programs/Portfolios had loose introduction/action hierarchy | Shared headings, relationship guidance and aligned Create actions; existing sheets and hierarchy preserved | Make membership and next actions understandable |
| More/Settings lacked a consistent arrival hierarchy | Workspace tools / Preferences & data introductions; icon preview distinguished from explicit native application | Improve discoverability and avoid surprising app exits |
| Inconsistent body leading and control states | Explicit line heights, centered bounded page frame, responsive introductions, shared focus/hover and 0.97 pressed feedback | Improve readable density and accessible interaction across screens |

No decorative stagger, blur, bounce or chart-wide animation was added. Existing native disclosures honor system reduced motion; web reduced-motion styles remain active. Finger-held gestures track directly. Web sheets now expose a named modal dialog; native modal accessibility remains platform-specific. Existing task-detail draft/save semantics, forms, dropdowns, sheets and dismissal behavior remain; shared type/control refinements apply there. Screenshots are saved alongside this report (desktop major screens, Timeline final rows, portrait light/dark).

The Impeccable detector ran **once**, against `src`, after the main visual pass (the subsequent named-dialog accessibility correction was validated by regression/runtime tests): `[]` findings, exit 0. This mechanical result is not a visual quality or native-runtime certification. Rendered desktop and mobile captures were inspected separately.

## 4. Performance measurements and limits

Environment: installed Chromium 156 headless, direct CDP, Expo **development** server with Metro already warm, proot Linux on an Android/Termux host, Node v24.18.0. Browser data is synthetic and lives only in a disposable profile. No production/native build, native FPS, memory or CPU profiler was used.

| Scenario | Before evidence | After evidence / interpretation |
| --- | --- | --- |
| Startup | Source imposed a 3,700ms brand gate. User reports shell events at 3,964/4,549ms on Android | Three cache-disabled browser reloads, 34 tasks: Overview visible at **702 / 580 / 588ms**; automated All tasks navigation visibly accepted at **1,065 / 891 / 874ms**. Different platform/mode from supplied Android values; **not a comparable device speedup claim**. |
| Startup stages | No matching pre-patch stage trace | Bundle response finished at 442 / 357 / 285ms; storage reads 2 / 0 / 0ms; normalization 5 / 2 / 17ms. Remaining interval includes bundle evaluation, React work and scheduling; those are not independently isolated. Shell's existing mount breadcrumb is a passive effect, not TTI. |
| Calendar labels, 56 ticks | Old Intl algorithm median **9.9683ms** | New UTC selector median **0.1108ms**. Same Node engine/process, five samples; isolated CPU benchmark, not a whole-chart/FPS measurement. |
| Zoom, 34 tasks | User observed roughly 1 second; no matching pre-patch browser trace | DOM bar width changes **200→250px in the input task**, then settles to 251px; inverse text scaling applies immediately. Input through two rAF callbacks median **321.6ms**, range 202.1–357.9ms. Includes final React/dev scheduling, not a hardware presented-frame measurement. |
| Zoom, 1,000 tasks | No comparable baseline | Same synchronous width response. Two-rAF median **331.5ms**, range 195.8–347.8ms. Twelve alternating inputs coalesce and remain finite; recorded two-rAF completion 7.6ms (34-task burst 11.4ms). These bursts largely cancel each other and are not equivalent to a full density-change redraw. |
| Timeline routing/scroll | Routing depended on viewport changes as well as geometry | Routes are reused when only the viewport changes; cheap intersection filtering remains. Bottom fixtures mount **18 rows / 18 bars**, rather than all 1,000 tasks; counts in JSON include both label and bar targets (36). Actual charts retain 1,836px / 54,000px row extent. |
| Board drag-order selector | Repeated identifier derivation: 0.0019ms / 0.0136ms for 34 / 1,000 tasks | Stable-data memo hits below the benchmark's 0.0001ms display resolution. This is a small avoidable allocation, **not evidence that the reported 267ms render spike is resolved on-device**. Existing grouping, card memoization and progressive windows were preserved. |
| Projects | Supplied Android 26ms average, 143ms maximum, 1,159ms timer delay | Existing summary cache reviewed. Microbench cold summary 0.0184ms / 0.243ms at 34 / 1,000 tasks; unchanged-object cache hits below display resolution. Search/progressive mounting bounds initial cards. No comparable Android render/stall profile; do not attribute the existing cache to this pass. |

The development two-rAF timings do **not** establish a one-frame full commit or a sustained 60 FPS target. Preview starts synchronously and the forced startup wait is removed; release-device latency still needs profiling. React render times and JS timer drift are not native FPS, ANR or TTI.

Raw repeatable evidence: [browser-results.json](browser-results.json), [startup-samples.json](startup-samples.json), [cpu-benchmarks.json](cpu-benchmarks.json), [additional-browser-results.json](additional-browser-results.json), [board-drag-result.json](board-drag-result.json), [dialog-result.json](dialog-result.json). Benchmark zeroes mean below printed resolution, not zero work.

## 5. Tests and environments

| Check | Result |
| --- | --- |
| `PATH=/tmp/milvayo-tools:$PATH npm test` | **Pass: 771/771**, two test processes, final run 47.78s. Earlier full runs passed 770/770 before the added dialog regression. |
| Source JSX/CommonJS parse with Babel JSX + CommonJS plugins | **Pass: 163 src files**, including changed components. |
| Babel `react-native-worklets/plugin` on changed native pinch/scroll files | **Pass**; transform validation, not a native build. |
| `PATH=/tmp/milvayo-tools:$PATH npx expo install --check` | **Pass:** Dependencies are up to date. No install/build performed by this check. |
| Manifest synchronization and `git diff --check` | **Pass:** current metadata 0.6.3; Android/iOS 63; no whitespace errors. |
| `bash /root/.codex/skills/impeccable/scripts/impeccable detect --json src` | **Pass**, exit 0, no mechanical findings; saved `design-detector.json`. |
| Web cold document/reload and major-screen navigation | **Pass** in the local development session; clean current console. Not native cold-process startup. |
| Desktop 34 / 1,000 tasks, Days/Weeks/Months | **Pass:** final row visible, bounded rows/bars. Calendar content recorded immediately after presets, before a scroll-triggering action. First task then explicitly positions bars for final-row and zoom measurement. |
| Desktop wheel and scrollbar-position scroll | **Pass:** owner reaches full extent in both fixtures. Keyboard End/Home checked separately with settled positions. Real physical trackpad hardware not available. |
| Web task dialog | **Pass:** named modal role, open/dismiss and Escape; clean console. |
| Web Board drag | **Pass:** mouse hold/drag moves QA task from Backlog to In progress and persists its destination list; clean console. Native drag remains Not run. |
| Web two-touch pinch, cancellation and repeated zoom | **Pass:** Chromium touch input; glyph width unchanged; rapid alternating clicks remain finite. Deterministic native/web tests additionally cover extra fingers, bounds, cancellation, queue discard and persistence/import invariants. |
| Portrait light/dark, reduced-motion media, 320/390/768px | **Pass:** mobile UA/viewport emulation; no document overflow or desktop sidebar. Emulation is not physical Android acceptance. |
| Android/Expo Go/iOS/native launcher/native exit history | **Not run:** no connected adb or Apple simulator toolchain; no native build permitted. |
| Native Board drag, pinch/scroll arbitration, background/resume, hardware FPS/ANR/OOM | **Not run.** Web/navigation and deterministic tests do not certify these. |

Focused new tests: `tests/timeline/remediation-062.test.cjs` and `tests/ui/remediation-062.test.cjs`. Existing control inventories were updated for intentional new controls/structure, while preserving callback, import, gesture, dependency SVG styling and domain contracts. Zoom screen harness now drains frame commits deterministically.

Reproduction helpers: `tests/helpers/browser-cdp.cjs`, `remediation-browser.cjs`, `remediation-startup.cjs`, `remediation-benchmark.cjs`. Runtime helpers require `MILVAYO_QA_ISOLATED=1` because they replace only their disposable browser profile's workspace fixture. Never point them at the user's browser profile.

Development commands used (not build commands):

```sh
# The default /root Node was a recursive wrapper; the temporary PATH selects the working Termux binary.
PATH=/tmp/milvayo-tools:$PATH EXPO_NO_TELEMETRY=1 node node_modules/expo/bin/cli start --web --offline --port 8093 --max-workers 1
/usr/bin/chromium --headless --no-sandbox --disable-dev-shm-usage --disable-gpu --remote-debugging-port=9233 --remote-allow-origins=http://localhost:8093 --user-data-dir=/tmp/milvayo-remediation-browser about:blank
PATH=/tmp/milvayo-tools:$PATH MILVAYO_QA_ISOLATED=1 node tests/helpers/remediation-browser.cjs
PATH=/tmp/milvayo-tools:$PATH MILVAYO_QA_ISOLATED=1 node tests/helpers/remediation-startup.cjs
PATH=/tmp/milvayo-tools:$PATH node tests/helpers/remediation-benchmark.cjs
```

No persistent Node installation or Metro configuration was changed to work around the environment. No Playwright package or browser download was introduced. Expo's optional DevTools installer reports an unsupported host `arm64` error; the development server/browser still work. This tooling message is not classified as an app crash.

## 6. Warning/error disposition

| Signal | Disposition |
| --- | --- |
| Web `accessible` SVG console error | Reproduced, corrected, regression-tested; absent in clean current browser runs. |
| Reanimated render-time read warning | Recursive prop path removed with throwing-getter coverage; strict checks retained. **Android absence not yet verified.** Other shared-value sites reviewed for allowed execution context. |
| Historical count of 36 warnings | **Cannot retrospectively classify.** Message bodies/stacks were not supplied or retained. There is no evidence that all 36 were Reanimated duplicates. New reports count bounded categories: render-read, web accessibility prop, pointer-events deprecation and unclassified; private message text is withheld. |
| Current browser app console | Zero warning/error/uncaught-exception events in the successful main test run and additional layout/keyboard checks. |
| Initial synthetic touch probe | An incomplete hand-made DOM touch stream produced React's `Cannot find single active touch.` It was discarded and replaced with Chromium `Input.dispatchTouchEvent`; current complete input stream is clean. Not reported as an app defect. |
| Initial startup fixture truncation | Removing tasks while keeping old canonical links correctly triggered `Stored dependency has no matching task link`; no data was overwritten by the app. Fixture regenerated with `makeProject`. This was a test-fixture failure, not a reason to weaken normalization. |
| Missing clean exit / shell remount | Kept as evidence with explicit limits. No inferred crash, OOM, ANR or successful launcher/native fix from JS counters alone. |
| Host tooling | Recursive default Node wrapper and optional Expo DevTools `arm64` installer issue handled separately from app logs; original wrapper not altered. |

## 7. Open issues and acceptance gates

1. On a physical Android device, confirm strict Reanimated logging stays clean through startup, Board drag, modals, repeated pinch/button zoom, third-finger/cancel and background/resume. Capture logcat/OS exit history if a termination occurs. The old 36-warning total remains unclassified until messages or a reproducible device trace exist.
2. Native alias reconciliation, one drawer icon, confirmed/cancelled Apply launcher icon, save failure blocking, System appearance and Android exit-history retrieval require an **updated installed native build**. They cannot be accepted through Fast Refresh or Expo Go. No such build was run here.
3. Profile production-mode startup, chart density commits, Board drag and Projects transitions on the user's hardware. Web development two-rAF commits are still ~0.2–0.36s; the source changes do not certify one-frame completion or no future crashes. Review native memory and UI thread timing separately.
4. Verify native/iOS text/geometry alignment throughout the full pinch range, horizontal pan handoff and view changes. Web measured glyph preservation; physical trackpad, screen reader and iOS runtime acceptance remain Not run.
5. Review the provided screens in Termux/Expo Go, including long content and real project data. Screens were refined within the existing identity; no new visual system overrides user preferences.

## 8. Release readiness and reversible update

**Ready for local manual acceptance; not ready to declare native production acceptance or publish.** Web functionality and automated invariants pass. Open native/performance gates above are material and must be checked before merging or distributing 0.6.3.

Changes are in place on `work`, with one cumulative changelog at `docs/changelog/CHANGELOG.md`; QA stays under `docs/qa`, usage under `docs/instructions`. No ZIP is required for local delivery. No GitHub action or release was performed.

Before applying a later installed update, export the current workspace backup and preserve existing app storage. No data migration is needed. Review the local diff and use the established Termux workflow. Only when the user separately authorizes native building should the config plugin/system-UI module enter a new APK/IPA. Do not uninstall to clear launcher caches.

For rollback, retain a copy of this uncommitted patch, selectively restore only its files (preserving unrelated user work), restore the prior lockfile and dependency state, and regenerate native inputs only under a separately authorized build workflow. Native rollback needs a new installable build/version code; JavaScript-only rollback cannot remove native code already installed. Existing backups/imports remain compatible. Do not reset the repository, clear app storage, commit, push, merge or deploy automatically.
