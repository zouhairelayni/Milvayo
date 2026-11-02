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
