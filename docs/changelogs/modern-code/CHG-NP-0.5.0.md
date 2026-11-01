# Niyarvo Projects — v0.5.0 Timeline SVG & Touch QA

## Read first

| Field | Value |
|---|---|
| Baseline | v0.4.9 TIMELINE-VIEWPORT-HOTFIX |
| Scope | Timeline viewport SVG coordinate restoration; dependency visibility; Android/iOS touch-responder stability |
| Status | **QA candidate — device verification pending** |
| Data schema | No change |
| Dependencies | No change; preserve user's locally corrected `package.json` and `package-lock.json` |
| Runtime tests | **Not run** (no Expo Go/iOS device available) |

## Reported / observed

- On Android 15 / API 35, Expo Doctor was green and v0.4.9 Timeline stopped terminating Expo Go.
- Scheduled tasks were detected, but SVG dependency graphics were invisible. Report: 66 scheduled tasks, 2,958 px canvas, 350 px viewport, 12 initial bars. Diagnostic report also recorded 45 Timeline renders and an 897 ms JS timer delay. These are observations, **not** confirmation of a rendering root cause.
- Metro warned `Cannot record touch end without a touch start` with touch identifier 3. This signals React Native's responder touch-history mismatch, not a proven native crash. It may be triggered by nested ScrollViews, changing gesture ownership, or multi-touch; the report alone cannot isolate the exact handler.

## Changes

1. `src/screens/Timeline.js` and `src/timelineViewport.cjs`: render dependency geometry in a small SVG whose `viewBox` uses the chart's absolute pixel coordinates; no large SVG or negatively translated `<G>` layer.
2. Draw dependency paths crossing the visible vertical rows even when one endpoint is outside those rows; after the path is routed, cull horizontally by the path's **actual points** rather than only its endpoints. Task/dependency data is unchanged.
3. Preserve the full continuously scrollable scheduled task list, including windowed render of nearby task bars. No task/row pagination and no `Previous rows`/`Next rows` controls.
4. On Android/iOS, avoid switching native `ScrollView.scrollEnabled` while a touch is in progress; web retains its existing post-lift scroll lock. The active task is kept in the candidate rendering set while the window rebases.
5. Do not create the blank-chart Pressable unless there are selectable dependency paths, reducing unnecessary native responder competition.
6. Add a one-time local diagnostics event describing SVG viewport size and visible dependency count once valid geometry is measured. No task names or IDs are logged.
7. Set app config/diagnostics version to `0.5.0` (package manifests deliberately excluded).

## Verification

- Source regression suite: **371 passed / 371 total**, 0 failed (Node test runner).
- TypeScript JSX syntax parser: **40 app/source JS and JSX files parsed**, 0 errors.
- ZIP archive root / integrity: checked.
- Expo Doctor: **Not run here**; user reported green for v0.4.9.
- Expo Go Android / iOS / Web visual checks: **Not run**.
- Native-touch warning eliminated: **Not verified**.
- SVG visually restored: **Not verified**.
- Performance improvement: **Not measured on device**.

## Known limitations / follow-up

- Native Gesture Handler 3.3.0 under nested React Native ScrollViews can still cause touch arbitration differences on Android. Do not suppress warnings silently. Record the triggering interaction and inspect the Metro log if the warning repeats.
- Board navigation is separately slow (~1.4–1.6 seconds in latest user report) and is **not patched** in this release.
- The dependency paths will only appear if the source tasks actually have `dependsOn` relationships in a visible date region. A task bar itself is drawn using React Native Views, not SVG.
- A large or exceptional dataset may require further profiling. Do not infer fixes to memory, FPS or native crashes from source tests.

## Install / rollback

1. Preserve a copy of your v0.4.9 source and your own local `package.json` / lockfile.
2. Extract the archive into `~/NiyarvoProjects` with `unzip -o`.
3. Run `npm test`, `npx expo-doctor`, and `npx expo start --clear` in Termux.
4. Verify on Android: Today marker, bar rendering, links including long links, horizontal/vertical scroll, normal tapping, resizing, long-press movement, and repeated tab opening without touch warnings.
5. If tests fail, restore the v0.4.9 files. No data/schema migration is required.

## Packaging

`NiyarvoProjects-v0.5.0-TIMELINE-SVG-TOUCH-QA.zip` is project-root layout (no enclosing directory). It **does not include** `package.json`, `package-lock.json` or `node_modules`, by user request.
