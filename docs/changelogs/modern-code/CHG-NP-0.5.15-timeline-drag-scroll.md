# CHG-NP-0.5.15 patch — Timeline drag, resize and auto-scroll fixes (Android and web)

## 0. Release handoff

| Field | Value |
|---|---|
| Baseline | `NiyarvoProjects-v0.5.15-ROOT-CAUSE-FIX.zip` |
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
- Full rollback: restore `src/gesture.web.js`, `src/gesture.native.js`, `src/gestureSurface.native.js`, `src/screens/Timeline.js` and `tests/native-worklets-hotfix.test.cjs` from `NiyarvoProjects-v0.5.15-ROOT-CAUSE-FIX.zip`; delete `src/dragFollow.cjs`, `src/timelineEdit.cjs` and `tests/timeline-drag-scroll-0515.test.cjs`.
