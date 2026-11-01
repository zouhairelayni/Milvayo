# CHG-NP-0.4.9 — Timeline native-surface stabilization / Expo config

## 0. Read first — release handoff

| Field | Value |
|---|---|
| Product | Niyarvo Projects (independent from RIVNA) |
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

- Android Expo Go, Niyarvo Projects v0.4.8, OS 35.
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
