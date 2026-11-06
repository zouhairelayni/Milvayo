# MILVAYO — PERFORMANCE, STABILITY, TIMELINE & PREMIUM UI/UX REMEDIATION

**Codex implementation brief — November 6, 2026**

| Field | Value |
|---|---|
| Current build | Milvayo v0.6.2 |
| Comparison baseline | Milvayo v0.6.1 |
| Target platforms | Android, iOS, desktop web; Expo / React Native |
| Android diagnostic platform | Android 15 (OS 35) |
| Required work | Root-cause analysis, actual fixes, visual redesign, testing, benchmark and handoff |
| Priority | Critical: web runtime error, Timeline desktop scroll, Timeline pinch distortion; High: zoom latency, JS stalls, warnings, design quality |

> **Execution instruction:** Read this entire document and inspect the repository before changing code. This is a request to **implement** the fixes and make substantial, high-quality product-design improvements—not to produce an audit alone. Preserve business logic and data. Do not push, publish, tag, or release without explicit approval. Use tools/skills actually available; do not claim tests you did not run.

---

## 1. Mission and expected standard

Transform Milvayo into a premium, mobile-first, fully responsive project-management product with senior-level interaction design and reliable Android, iOS, and web behavior. Do not restrict this task to cosmetic tweaks. Resolve critical correctness bugs, address measurable performance bottlenecks, and substantially refine screens, navigation, forms, information density, typography, motion and microinteractions.

Success means:

1. Desktop web loads without the reported `react-native-svg` / `BoardMorph` error.
2. Android no longer emits the Reanimated shared-value render warning in the tested interactions **without suppressing strict-mode warnings**.
3. Timeline's calendar ribbon typography stays undistorted during live pinch-to-zoom.
4. Small, semitransparent magnifier `+` and `−` SVG controls float at the chart's top right; pressing them produces prompt zoom feedback, not an apparent ~1-second freeze.
5. Desktop Timeline vertical scrolling reaches **all tasks**, with correct virtualization and fixed/synchronized calendar/ribbon behavior.
6. Startup, Projects, Board and Timeline are profiled and improved where causes are substantiated.
7. Major app screens look unmistakably more polished, beautiful, coherent and usable on mobile and desktop—not just rearranged.
8. Existing business logic, persistence, projects, tasks, board, dependencies, sprints, portfolios/programs and settings remain intact.
9. Automated tests and practical platform verification support the claimed fixes.

## 2. Evidence: v0.6.1 vs v0.6.2

The figures below come from the app's diagnostics in two **different Android sessions**, not a controlled A/B test. Do not overstate statistical certainty.

| Metric | Milvayo v0.6.1 | Milvayo v0.6.2 | Observation |
|---|---:|---:|---|
| Run started → shell mounted | 3,964 ms | 4,549 ms | +585 ms (+14.8%) in these runs |
| Longest observed JS timer delay | 3,982 ms | 4,568 ms | +586 ms (+14.7%) |
| Largest observed Projects JS timer stall | 2,599 ms | 1,159 ms | −1,440 ms (−55.4%) — encouraging, not a controlled speedup |
| Console warnings | 0 | 36 | Newly reported warnings; classify actual sources |
| Recorded JS exceptions in Android session | 0 | 0 | Does not disprove native/web failures |
| Unexpected shell remount recorded | 1 | 0 in current run | Investigate lifecycle and state preservation |
| Session duration | 291 s | 238 s | Not equal |
| Navigation counts | Different | Different | Workload not equivalent |

**Separate web error:** A web Metro/runtime error is now provided in Section 4. The Android report's “0 JS exceptions” does **not** supersede or negate this web error; the logs refer to different platform executions.

### 2.1 v0.6.2 React profiler (newly present)

The prior v0.6.1 report contained no per-screen render measurements; **do not invent comparative counts**.

| Screen | Render count | Mean | Maximum |
|---|---:|---:|---:|
| Overview | 16 | 33 ms | 100 ms |
| Board | 68 | 31 ms | 267 ms |
| Timeline | 198 | 46 ms | 390 ms |
| More | 37 | 9 ms | 40 ms |
| Settings | 26 | 13 ms | 49 ms |
| Projects | 83 | 26 ms | 143 ms |
| Portfolios | 4 | 32 ms | 35 ms |
| Programs | 1 | 42 ms | 42 ms |

**Priority interpretation:** Timeline dominates sustained render costs and extreme render duration; Board and Projects have costly spikes. Portfolios/Programs have insufficient samples for meaningful conclusions. These are **JS profiler estimates, not native FPS**.

### 2.2 Timeline zoom stress sequence (v0.6.2)

Between `00:09:44` and `00:10:20` the user repeatedly pressed zoom `1.25` / `0.8`, then selected `Days`, `Weeks`, `Months`, `Days`. During this period:

- Slow React renders included 149, 145, 151, 113, 237, 129, 177, 154, 117, 205, **390**, and 258 ms, followed by further 164, 240 and 193 ms events.
- Timeline JS timer delays included **679 ms**, **488 ms**, **898 ms**.
- Timeline workload: logical canvas **5,984 px** wide, viewport **350 px**, **34** scheduled tasks, **4** initially visible bars and **3** visible dependency paths.
- Button clicks subjectively take **about one second** before the zoom appears. This is an observed UX symptom; instrument input-to-visible-update latency to establish exact time.

Do not assume every render is solely caused by zoom: correlate interactions, commits, effects and long tasks in the actual profiler.

### 2.3 Stability/lifecycle evidence

- v0.6.1 had `UNEXPECTED SHELL REMOUNT #2` following several background/foreground transitions. It returned to Overview; no JS exception was logged. Investigate without presuming a crash.
- In a preceding v0.6.2 run, the **last recorded event** was `2026-11-06T00:09:21.422Z | timeline pinch started`; the next run began at `00:09:28.077Z`. Previous-run clean exit was not recorded. This is **suspicious but not proof** of pinch-induced crash (could be native termination, reload, OS lifecycle or manual action). Reproduce and inspect native/development logs.

---

## 3. Newly reported Metro/runtime diagnostics — treat as required fixes

There are **two new, distinct issues** from Metro bundler/platform output. Keep the snippets intact when tracking the defects. Investigate source components and underlying causes instead of hiding errors or muting logger configurations.

### 3.1 WEB ERROR — `react-native-svg` `WebShape.js` → `BoardMorph` → `ColdStartGate`

**Exact supplied output:**

```text
Web Bundled 99ms node_modules/expo/AppEntry.js (1 module)
Web  INFO  %cDownload the React DevTools for a better development experience: https://react.dev/link/react-devtools font-weight:bold
Web  LOG  Running application "main" with appParams:
 {"hydrate": undefined, "rootTag": "#root"}
Development-level warnings: ON.
Performance optimizations: OFF.
Web  ERROR

Code: WebShape.js
  72 |     }
  73 |     this.lastMergedProps = {};
> 74 |     return createElement(this.tag, prepare(this, this.prepareProps(this.props)));
     |                         ^
  75 |   }
  76 | }
  77 | //# sourceMappingURL=WebShape.js.map
Call Stack
  render (node_modules/react-native-svg/lib/module/web/WebShape.js:74:25)
  BoardMorph (src/components/brand/BoardMorph.js:37:10)
  ColdStartGate (src/app/ModernApp.js:291:17)
  ModernApp (src/app/ModernApp.js:297:36)
  App (src/app/App.js:6:54)
```

**What this does/does not prove:** The error surfaces while rendering an SVG element inside `BoardMorph`, as used by `ColdStartGate` in the app's root path. The *actual error message preceding this stack trace is not included*, so do **not** assert that the SVG tag is invalid, or that any particular import is definitely responsible. Establish the full exception message and inspect the source.

**Required investigation:**

1. Open `src/components/brand/BoardMorph.js`, specifically around **line 37**, and inspect every `react-native-svg` element and its props.
2. Review `ColdStartGate` (`src/app/ModernApp.js`, approximately line 291), its lifecycle and its behavior on web and Android. Verify whether a brand/loading animation is blocking or crashing web startup.
3. Confirm correct web-compatible SVG components, imports, element types, names and prop values; check React Native SVG / Expo / React compatibility with installed versions.
4. Investigate any web-specific render paths, animations, transforms, conditional elements, invalid `createElement` tag inputs, incompatible components or undefined values using the full browser console exception.
5. Reproduce from a **cold web load** and after navigation/reload, including desktop widths; inspect browser error overlay/console and verify no initial render failure.
6. Preserve the intended branded loading experience where possible, but prioritize stable startup. If a simpler cross-platform implementation is better, provide a visually excellent replacement rather than silently removing all branding.
7. Add a regression test or smoke test that renders `BoardMorph`/`ColdStartGate` on web and catches the original failure.

**Acceptance:** Web cold start and reload complete without the `WebShape.js`/`BoardMorph` runtime error; branded transition remains stable and visually correct. Avoid false claims based only on a successful Metro bundle: bundling is not runtime rendering.

**Log classification:** The React DevTools suggestion, `Running application` log, and `Development-level warnings: ON / Performance optimizations: OFF` are development-environment information, **not themselves application defects**. Focus on the actual `Web ERROR` and confirm behavior in appropriate dev and production-like builds.

### 3.2 ANDROID WARNING — Reanimated shared value read during React render

**Exact supplied output:**

```text
Android Bundled 170ms node_modules/expo/AppEntry.js (1 module)
 WARN  [Reanimated] Reading from `value` during component render. Please ensure that you don't access the `value` property nor use `get` method of a shared value while React is rendering a component.

If you don't want to see this message, you can disable the `strict` mode. Refer to:
https://docs.swmansion.com/react-native-reanimated/docs/debugging/logger-configuration for more details.
```

**Meaning:** At least one React render path is reading a Reanimated shared value imperatively (`.value` or `.get()`) at render time. This can produce stale/inconsistent rendering and is contrary to Reanimated's recommended React integration. The log does **not** identify the offending component; it may or may not be related to the Timeline.

**Required investigation:**

1. Search source for shared-value `.value` and `.get()` reads (including expressions in JSX, render-time props, memoization callbacks executed during render, component-level calculations, and custom hooks).
2. Distinguish permitted accesses inside worklets, event handlers and animation callbacks from problematic **React render-time** reads. Do not blindly replace all `.value` uses.
3. Prefer Reanimated-supported patterns (`useAnimatedStyle`, `useDerivedValue`, animated props, UI-thread gesture state and properly scoped animation worklets) for visual state. For logical React state, use an intentional synchronization path without continuous React rerendering on gestures.
4. Check animation components used during app startup (`BoardMorph`), Timeline zoom/gestures and other new or frequently rendered UI, while tracing actual warning origins.
5. Keep strict diagnostics enabled. **Do not “fix” this by disabling strict mode or suppressing `console.warn`.**
6. Repeat startup, Timeline pinch and zoom, navigation, Board drag and modal interactions on Android; verify the warning no longer appears in the tested paths.
7. Add targeted tests/static checks where feasible and disclose any still-untraced warnings.

**Acceptance:** No Reanimated render-time shared-value warnings during reproducible Android interaction scenarios, with strict-mode checks enabled. Do not conflate this single warning type with all **36** recorded v0.6.2 warnings until they are classified.

---

## 4. CRITICAL — Timeline pinch-to-zoom stretches/deforms the calendar ribbon

**Observed UX:** During a two-finger pinch, date numbers in the calendar ribbon visibly stretch and remain distorted **until the user releases the gesture**. That is unacceptable for a professional Gantt chart.

**Required outcome:** Pinching changes the **horizontal timescale**, never text glyph dimensions, icon proportions or control typography. The date header/ribbon, vertical grid lines, task bars, today marker and dependency paths must remain aligned *during and after* the gesture. The ribbon must not lag behind or detach when scrolling horizontally.

Implementation expectations:

- Investigate whether the interim gesture applies a geometric scale transform to a parent containing date labels. If confirmed, separate the text layer from scaled geometry or recalculate timescale/positions without raster-stretching text.
- Make the gesture responsive under the finger and preserve the focal date/anchor whenever feasible.
- Apply zoom constraints and handle gesture cancellation, rapid direction changes and transitions between pinch and pan.
- Never tween the finger's continuous movement; animations can settle after release, but should not make live tracking laggy.
- Avoid full React reconciliation for every high-frequency pinch update. Keep gesture/animation work out of JS render loops when supported by the installed stack.
- Preserve synchronized header/grid/bar/dependency relationships and deterministic snap/scale behavior.

**Acceptance:** Repeated pinch in/out across supported zoom ranges never stretches date numerals, causes jumpy anchors or breaks header/grid alignment on tested platforms.

## 5. CRITICAL — Zoom button appearance, placement and ~1-second responsiveness

**Observed UX:** Zoom +/- buttons are visually too large/misplaced for a premium Timeline, and tapping either appears to take ~1 second before the chart renders the new zoom.

**Exact design requirement:** Overlay **two small semi-transparent SVG magnifying-glass icons** at the **top-right of the Timeline chart**:

- Magnifier with **plus** for Zoom In; magnifier with **minus** for Zoom Out.
- Visual icon approximately **16–18 px**, refined stroke, consistent alignment and compact spacing. Not huge SVGs.
- Subtle translucent surface, understated border/shadow only if useful, beautiful in light and dark themes.
- Practical hit area **~40–44 px** on touch devices despite the small visual icon.
- Desktop tooltips, keyboard focus, hover, pressed and disabled states; correct accessible names.
- Controls should overlay the chart without obscuring sticky ribbon dates or interfering with gestures.

**Performance requirement:** Immediate pressed response (ideally one frame), immediate commencement of visual zoom, smooth short transition where appropriate (approximately 150–250 ms) and no perceived 1-second blocking work. Avoid chart-wide geometry regeneration or stale queued interactions per click. Consecutive clicks should coalesce correctly; gesture and buttons must control **one consistent timescale state**.

**Measure:** Record tap/click timestamp, first frame of response, update committed, and expensive computations. Fix the bottleneck; do not merely cover a slow redraw with an animation.

## 6. CRITICAL WEB BUG — Desktop Timeline cannot scroll to all task rows

**Observed UX:** On desktop web, scrolling downward stalls around the middle of the Timeline; remaining task bars do not render and vertical scrolling cannot reach the bottom. This is broken functionality, not a design preference.

Investigate:

- Vertical scroll owner and nested scroll containers; correct browser wheel/trackpad behavior.
- `overflow`, `height`, `max-height`, flex sizing and clipping on the Timeline and parents.
- Scroll listener attachment, virtualized visible-range state, viewport/row measurements, sticky offsets and overscan.
- Conflicting touch/pan gesture handlers and `preventDefault`, `overflow: hidden` or scroll-lock behavior.
- Incorrect reuse of mobile viewport assumptions on desktop.
- Race conditions between zoom, horizontal scroll and vertical visible-row calculations.

**Required architecture/UX:**

- All task rows are vertically reachable on desktop, on any supported viewport and at any zoom preset.
- Calendar ribbon stays pinned at top during **vertical** scrolling but remains perfectly synchronized with chart geometry during **horizontal** scrolling.
- Fixed labels, grid, task bars and dependency paths remain aligned by row.
- Keep efficient virtualization, with sufficient overscan to prevent blank/stuck regions. Do **not** fix this by rendering every task unconditionally at large scales.
- Preserve position while switching between Days/Weeks/Months when reasonable; never unexpectedly jump back to Overview.
- Verify with the current 34-task workload and with substantially larger synthetic datasets.

**Acceptance:** Mouse wheel, trackpad, scrollbar, keyboard where supported, and touch scrolling reach the last task. No frozen middle range, missing bottom rows or permanently clipped content.

## 7. Startup, Board and Projects performance investigation

**Startup:** Investigate the observed shell mount increase from 3,964 to 4,549 ms. Separate Metro/dev startup, JS bundle evaluation, store hydration, synchronous imports, app shell mount, first visible content and **first usable interaction**. Identify verified bottlenecks; do not treat the longest timer delay as Time-to-Interactive.

**Timeline:** Profile repeated calendar generation, date formatting, tick/grid calculation, task grouping, dependency SVG path computations, unstable dependencies, scroll-linked setState, screen retention and unnecessary re-renders. Retain virtualization and accurate positioning.

**Board:** Review 68 renders / 31 ms average / 267 ms max. Check drag gesture behavior, card-level subscriptions, large parent rerenders, layout measurements, expensive effects and animation-related synchronous work. Preserve smooth drag-and-drop and persistence.

**Projects:** Review 83 renders / 26 ms average / 143 ms max and the 1,159 ms timer delay. Audit derived aggregation, sorting, filtering, hierarchy recalculation and persistence. Preserve apparent improvement from v0.6.1 and confirm with repeatable scenarios.

**App-shell lifecycle:** Investigate v0.6.1's remount on background/foreground and v0.6.2's previous unclean session. Preserve selected tab and state across legitimate lifecycle transitions, without assuming every unclean exit is a crash.

**Diagnostics:** Keep profiler/crash reporting. Add meaningful event correlations: input→first visual response, render and commit durations, long JS tasks, UI frame timing when available, virtualization visible-window changes, native Android errors when available. Do not invent FPS/memory numbers from React render estimates.

---

## 8. Mandatory premium design overhaul — all important screens

This is **not just a bug-fix ticket**. Perform a thoughtful visual and interaction redesign to make Milvayo attractive, distinctive and comfortable to use, as if delivered by a senior product designer working closely with an experienced React Native/web engineer.

### 8.1 Skills and supporting expertise

Discover, read and **apply** the relevant installed skills, especially where available:

- **Impeccable**
- **UI UX Pro Max**
- **Frontend Design**
- React / React Native animations and motion
- Interaction and microinteraction design
- Mobile-first responsive design
- Accessibility, typography and design systems
- React / React Native performance optimization
- Webapp testing, frontend auditing and applicable platform-specific skills

Use the full available design/animation/performance toolkit thoughtfully. If named skills are not available, use suitable installed alternatives and existing repository guidance; document the limitation. Do not block implementation or pretend a skill was used if it was not available.

### 8.2 Design principles

- Premium, intentional hierarchy; readable labels, beautiful typography, consistent type scale.
- Thoughtful spacing, alignment, visual rhythm and information density.
- A refined color system and restrained accents with strong light/dark contrast.
- Consistent card geometry, icon language, surface hierarchy, border/shadow treatment and states.
- Clear primary/secondary/tertiary actions; coherent navigation and page layouts.
- Scan-friendly project statuses, progress, dates, ownership and priorities.
- Beautiful empty, loading, error, success and first-run states.
- Consistent forms, filters, dialogs, dropdowns, menus, tooltips, tab bars and responsive action clusters.
- Avoid excessive gradients, arbitrary accent stripes, oversized icons, redundant pills, card-inside-card clutter, gratuitous shadows, needless whitespace and generic template/dashboard appearance.

### 8.3 Scope by area

- **Overview:** Refine management overview, KPI/dashboard presentation, project summaries, action hierarchy and information storytelling.
- **Kanban Board:** Organized cards, reliable hierarchy, readable badges, drag states, responsive columns and smooth interaction comparable in clarity to mature productivity software.
- **Timeline / Gantt:** High-end chart typography, precise grids, refined task bars, readable dependencies, date navigation, professional zoom controls, stable scroll and virtualization.
- **Tasks / task details:** Easy-to-scan information, clear edits, polished actions, meaningful statuses and comfortable forms.
- **Sprints:** Clear progress/status and unambiguous planning interactions.
- **Projects, Programs, Portfolios:** Improve overview presentation, filters, hierarchy, summaries, progress and navigation.
- **Settings / More:** Polish typography, grouping, controls, discoverability and consistency.
- **Cross-cutting:** Responsive header actions, drawers, modals, feedback and empty/loading states.

**Mobile first:** Design intentional portrait layouts, touch targets, accessible navigation, gesture conflict avoidance and readable density on narrow screens. **Desktop web:** Make good use of space, provide visible hover/focus states, correct wheel/trackpad/keyboard behavior, and avoid mobile fixed-height restrictions. Mobile-first is **not** mobile-only.

## 9. Motion principles — complementary to the skills

Use these **20 guidelines** selectively where they improve clarity. They are not an instruction to animate everything. Respect reduced-motion preferences, battery/CPU limits and native-feeling interaction.

1. Ease-out for entrances.
2. Dropdown transitions around **150–250 ms**.
3. Stagger list rows by about **30 ms** when sensible.
4. Scale suitable pressable controls to **0.97** on press.
5. Stretch moving knobs around **12%** when useful and not visually distracting.
6. Stagger secondary details as the main transition settles.
7. Use arcs for object movement when spatially meaningful.
8. Use a restrained pulse to confirm success.
9. Ease-in-out for repositioning/moves.
10. Start popovers around **0.95 scale**.
11. Enter contextual surfaces from their trigger.
12. Exit contextual surfaces toward their trigger.
13. Avoid bounce in everyday UI.
14. **Do not tween while the gesture is held**; track the finger directly.
15. Make exits approximately **20% shorter** than entrances when appropriate.
16. Overlap outgoing/incoming states to avoid abrupt swaps.
17. Use masks for reveals and color transitions where performant.
18. Crossfade icons and use subtle blur only where appropriate and efficient.
19. Use restrained rubber-banding past bounds where platform-appropriate.
20. Reuse stable layout identity for continuity between states.

Use native/UI-thread or compositor-friendly animations where supported; keep high-frequency gesture values out of React rerender loops. Avoid animating entire complex trees for local transitions and avoid expensive blur/shadows in dense scrolling views.

---

## 10. Implementation plan — execute, don't stop at an audit

### Phase A — Reproduce and diagnose

1. Inspect repository architecture, installed dependencies and current test setup.
2. Reproduce **web `BoardMorph`/`WebShape` error** and collect the full exception message.
3. Trace **Reanimated render-time shared value** warning to actual component(s).
4. Reproduce Timeline calendar-text distortion and desktop vertical scroll stall.
5. Profile zoom-button latency and expensive Timeline/Board/Projects renders.
6. Classify console warnings; determine which of the 36 are duplicates or originate from the reported Reanimated issue.
7. Investigate the suspicious pinch/unclean-session sequence without presuming crash.

Deliver concise cause/evidence notes in the final report; proceed to fixes.

### Phase B — Fix functionality and performance

- Repair root web SVG/runtime failure and keep startup branding polished.
- Eliminate Reanimated render-time shared-value reads **at their source**, without disabling strict mode.
- Repair Timeline pinch rendering so date glyphs never scale distortingly.
- Implement compact translucent chart-corner SVG zoom controls and responsive update path.
- Repair desktop vertical scroll/virtualization and maintain sticky, synchronized calendar headers.
- Optimize verified startup, Timeline, Board and Projects bottlenecks.
- Fix reproducible lifecycle/stability issues and warning sources.

### Phase C — Meaningful visual/UX redesign

Apply skills and create coherent design decisions. Update actual screens, interactions and responsive behaviors—rather than only adjusting spacing or theme tokens. Favor restrained, memorable polish and strong information design.

### Phase D — Animation and interaction polish

Add tasteful, purpose-driven, smooth motion. Verify dragging, gestures, open/close transitions, selection, feedback, keyboard and accessibility interactions.

### Phase E — Validate and report

- Run existing tests and add focused regression tests.
- Test web startup/refresh and inspect browser console.
- Use Playwright or available browser testing for desktop Timeline all-the-way-to-bottom scrolling and zoom.
- Validate Android startup, pinch, zoom button rapid taps, state transitions and board gestures; capture native evidence for suspected process termination if reproducible.
- Check light/dark themes and narrow/large layouts.
- Assess iOS compatibility and test on iOS if tooling is available; **do not claim executed iOS tests if unavailable**.
- Collect comparable post-fix metrics using repeatable task datasets and interaction scripts. Prefer multiple runs, same build mode and warm/cold-start distinctions.

## 11. Acceptance checklist

### Runtime and stability

- [ ] Web renders successfully at cold start, reload and navigation without the `WebShape.js` / `BoardMorph` error.
- [ ] Actual source cause of web SVG error documented, including full exception message if retrievable.
- [ ] Android Reanimated render-time shared-value warning resolved in tested flows, strict checks still enabled.
- [ ] All 36 reported console warnings investigated/classified; reproducible app-side warnings fixed rather than globally muted.
- [ ] Pinch-related unclean session investigated; real crash only claimed if reproduced/verified.
- [ ] No unexpected shell resets in tested scenarios; navigation state preserved across supported lifecycle transitions.

### Timeline

- [ ] Calendar date numbers never stretch during pinch.
- [ ] Ribbon, grid, task bars and dependencies stay synchronized while zooming and panning.
- [ ] Two **small semitransparent SVG magnifier +/−** controls at chart top-right with appropriate touch targets.
- [ ] Zoom controls give immediate feedback; no obvious ~1-second unresponsive pause.
- [ ] Days/Weeks/Months presets work without broken alignment or unexpected navigation.
- [ ] Desktop web vertical scrolling reaches final task with all virtualized rows rendered as needed.
- [ ] Sticky calendar header and horizontal synchronization preserved.
- [ ] Fast repeated gestures, pan, wheel, trackpad and touch tested.

### Performance and design

- [ ] Startup tasks and perceived first-interaction time instrumented, bottlenecks addressed with evidence.
- [ ] Timeline expensive render spikes and timer stalls investigated, optimized when confirmed.
- [ ] Board and Projects expensive work reviewed, improvements benchmarked.
- [ ] All major screens show meaningful visual/UX improvement, not superficial adjustments.
- [ ] Professional mobile portrait and desktop layouts; accessible interactions and reduced-motion behavior.
- [ ] Core functionality, data compatibility and existing business logic preserved.
- [ ] Automated suite passes and new focused tests cover regressions.

## 12. Final Codex handoff requirements

Include, at completion:

1. **Root causes** — verified cause of each reported defect, plus uncertainties where no proof was available.
2. **Changes** — major files/components updated and what behavior changed.
3. **Design changes** — concrete improvements by screen and the reusable design system/motion decisions.
4. **Performance** — before/after measurements for startup, zoom response, Timeline/Board/Projects, and render stalls where actually measured; label approximations and differing test conditions.
5. **Tests** — exact commands and results, test environments/platforms, manual reproductions and browser tests.
6. **Warnings/errors** — classification and disposition of web SVG error, Reanimated warning and 36-warning diagnostic count.
7. **Open issues** — anything not fixed, not reproducible or not tested.
8. **Release readiness** — clear conclusion for manual testing/release with rationale.

**Git/release safeguards:** Keep changes reviewable; do not delete/replace unrelated project code or stored data; do not commit/push/release until requested. Preserve local Expo/Metro/Fast Refresh workflows and compatibility with the user's Termux/Android development environment.

**Bottom line:** Deliver a **visibly premium, pleasing-to-the-eye** Milvayo and a demonstrably functional, fast, smooth Timeline. Do not substitute design prose, error suppression or animations that mask latency for actual engineering fixes.
