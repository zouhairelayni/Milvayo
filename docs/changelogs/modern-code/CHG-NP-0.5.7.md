# CHG-NP-0.5.7 — Top-positioned Dynamic Island

## 0. Release status

| Field | Value |
|---|---|
| Source baseline | `NiyarvoProjects-v0.5.6-DYNAMIC-ISLAND.zip` |
| Release | `0.5.7` — Android/iOS/Web QA candidate |
| Goal | Move existing animated in-app notification near the top of the app without overlapping OS status icons or cutouts |
| Runtime acceptance | **Not run** — Expo Go Android/iOS and mobile/desktop web should be checked by the user |
| Dependency changes | None; `package.json`, `package-lock.json`, `node_modules` omitted from archive |

## 1. Observed issue and repair

- In v0.5.6, the phone `IslandNotice` was an absolutely positioned child of the **page-content** view, below the 83+ point app header. It therefore began over the task filters instead of at the top of the app.
- `ModernApp.js` now renders a separate top-level, `position:'relative'` mobile shell, keeps the safe-area app layout in its own `SafeAreaView`, and places `IslandNotice` **as a sibling after the safe-area content**. The notice is no longer positioned relative to the scrolling page or header bottom.
- Added `src/noticePlacement.cjs` to compute an offset from the top of the window: `max(safeAreaInsets.top, AndroidStatusBar.currentHeight or 0) + 10` points. The fallback covers Android edge-to-edge/Expo Go combinations where the inset is unexpectedly zero. On iOS it uses the measured notch/dynamic-island inset.
- Kept the original compact → expanded → collapsed/dismissed spring animation, icons, error dismissal, automatic success expiry and responsive full-width bounds unchanged.
- Desktop/tablet wide mode keeps its previous top safe-area anchoring.
- The expanded notice **may temporarily float over app-header controls** by design; it no longer needs to sit below the header. It should not reach OS status icons or the cutout.

## 2. Files changed

- `ModernApp.js` — mobile layer placement and RN StatusBar fallback integration.
- `src/IslandNotice.js` — corrected anchoring comment (motion unchanged).
- `src/noticePlacement.cjs` — new pure safe-area offset helper.
- `tests/notice-safe-anchor-055.test.cjs` — adapted old anchor contract, added real numeric inset cases.
- `tests/dynamic-island-056.test.cjs` and `tests/ui-automation-052.test.cjs` — updated layout contracts.
- `app.json`, `src/diagnostics/monitor.js` — version updated to 0.5.7.
- `README.md` and this changelog/QA checklist — release documentation.

## 3. Tests executed

- `node --test tests/*.test.cjs` — **405/405 passed**.
- TypeScript JS/JSX parser across `src/`, `App.js`, `ModernApp.js` — **71 files, 0 parse errors**.
- ZIP archive CRC/integrity and dependency-manifest exclusion — checked at packaging.
- Expo Go/iOS/browser rendering, actual notch and status bar placement, device animations — **Not tested in this environment**.

## 4. Device acceptance

See `docs/qa/modern-code/NP-QA-0.5.7.md`. Check low-height status-bar devices and landscape/notched devices first. Do not merge to main until real-device placement is confirmed.
