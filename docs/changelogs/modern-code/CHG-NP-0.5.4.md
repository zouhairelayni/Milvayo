# CHG-NP-0.5.4 — Independent management screens and Android hotfix

## READ FIRST

- Baseline: Niyarvo Projects v0.5.3 modern single-app release.
- Delivery: source ZIP at the project root, **excluding** `package.json`, `package-lock.json` and `node_modules`.
- Status: source-level QA passed; Android/iOS runtime not executed in the packaging environment.
- The original AsyncStorage workspace key and project/portfolio/program schemas are unchanged. Keep a full backup before installing.

## Corrections

1. **Drawer duplicate React key:** Removed the repeated `taskconfig` item from OPERATE. One destination remains in the modern navigation.
2. **Projects screen render crash:** Project task counts are rendered as numbers via `projectSummary(project).taskCount`, never as task-object arrays. The reported `monitor.js` stack was only the diagnostics console interception, not the source of the React error.
3. **Logo legibility:** Embedded PROJECTS lettering in both color variants increased in glyph size and weight; matching PNG assets regenerated. Branding remains inside the drawer.
4. **Independent screens:** Deleted the combined `src/screens/ProjectsPrograms.js` and split it into `src/screens/Projects.js` and `src/screens/Programs.js`. Extracted `Portfolios` from `src/screens/Workspace.js` into `src/screens/Portfolios.js`.
5. **Single relationship connector:** Added `src/projectRelations.cjs` for immutable project membership lookup, scalar summaries and removing references after project deletion. The existing `src/store.js` continues to own all writes and validation. No duplicate state or store created.
6. **Navigation imports:** `ModernApp.js` imports the three screens independently.

## Test evidence

- `node --test tests/*.test.cjs`: **390 passed, 0 failed**.
- TypeScript parser scan across 69 JS/JSX app/source files: **0 parse diagnostics**.
- Three new regressions check module separation, scalar task counts, and project/program/portfolio membership safety.
- Android Expo Go, web bundling, drag interactions, and native logos: **Not run in this environment**.

## Known outstanding performance work

- The user reported an approximately 2.1-second Board transition with an 782ms React render and 1.45-second JS stall in v0.5.3. This focused hotfix does **not** claim to resolve that independent performance problem.
- Source-level tests do not prove the notification or timeline gestures are fully validated on devices.

## Acceptance criteria

1. Open hamburger repeatedly: OPERATE contains only one Task configuration entry; no duplicate-key warning.
2. Open Projects: project task counts render without an object-as-child error; editing, switching, and deletion safeguards still work.
3. Open Programs and Portfolios: membership names/counts are correct; editing membership, restoring or deleting a project do not create invalid references.
4. Inspect light/dark drawer wordmark on device: PROJECTS is clearly legible without overflowing the logo.
5. Confirm `package.json`, `package-lock.json` and installed dependencies remain intact after extraction.
