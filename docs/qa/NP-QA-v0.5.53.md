# Niyarvo Projects v0.5.53 — Android Gantt, Sprints, New task QA

## Regressions reported

- Android portrait: calendar date labels visibly lag native Gantt panning after separate `ScrollView.scrollTo()` synchronization. Sticky toolbar and calendar also appeared detached from the chart because their card was separated from the chart's vertical Page margin and diagnostics.
- Sprints: `Property 'Fold' doesn't exist` at render time. A missing `Fold` import from `CompactTools.js` survived previous source tests.
- Mobile/Desktop headers: `New task` primary action visually outweighed contextual toolbar controls.

## Changes

- One chart `Animated.ScrollView` owns the horizontal offset. Pinned date strip is an `Animated.View` with `Animated.multiply(horizontalOffset, -1)`; a stable `Animated.event` mapping uses the native driver on Android/iOS, avoiding a second calendar ScrollView and JS `scrollTo` mirroring.
- Pinned ribbon and date row share a contiguous panel with the Gantt, outside the page vertical scroller. Alerts follow the chart. Date ticks remain viewport-bounded.
- Sprints imports `Fold` from its actual module; no task/sprint schema changes.
- A dedicated 40pt compact header variant, 48pt hit target, 12pt text, 13pt icon is used only for `New task` in both headers.

## Verification

- Targeted source tests validate component import resolution, one scroll driver, pinned strip ordering, and compact header presence.
- Full Node suite: **655 total / 654 passed / 0 failed / 1 skipped**. Six changed JSX files parse with **0 syntax diagnostics**. Final extracted-archive rerun is listed below.
- No Android hardware execution, actual swipe/scroll or mobile browser interaction is claimed.

## Device acceptance checklist

1. Expo Go Android portrait: pan Gantt slowly and rapidly left/right; date labels stay exactly over grid lines with no catch-up. Check release bounce and Today / First Task / zoom transitions.
2. Scroll vertically far down: toolbar and dates stay visible, bars and dependency curves still render; return to top.
3. Show/Hide Items and change zoom Days/Weeks/Months; date/calendar rail remain aligned. Drag/reschedule/link bars while page remains scrollable.
4. Sprints: open assigned/backlog/final-scope folds, switch sprints, add/remove tasks, navigate away/back without exceptions.
5. On Overview, Board, Timeline, Tasks, Sprints and wide Desktop: New task is compact and tappable; creation still uses draft-only save.

**Additional interaction safeguard:** Dependency Remove/Keep confirmation lives in the pinned header when a curve is selected, rather than after a potentially multi-thousand-pixel chart.

## Fresh archive confirmation

`NiyarvoProjects-v0.5.53-FULL.zip` extracted into a clean directory: **655 tests total, 654 passed, 0 failed, 1 skipped**. Zip file CRC check passed and all source files are rooted directly in the archive (no enclosing folder).
