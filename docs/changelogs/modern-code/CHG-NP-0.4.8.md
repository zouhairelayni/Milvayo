# CHG-NP-0.4.8 — Timeline Controls, Sprint Crash, Screen Diagnostics

**Date:** 2026-10-31
**Status:** SOURCE QA CANDIDATE — Android/Expo Go runtime acceptance NOT VERIFIED
**Baseline:** Niyarvo Projects v0.4.7 Sprint/Kanban/Nav QA
**Deliverable:** NiyarvoProjects-v0.4.8-TIMELINE-DIAGNOSTICS-QA.zip
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
