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
