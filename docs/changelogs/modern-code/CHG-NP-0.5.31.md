# CHG-NP-0.5.31 — Responsive workspace redesign

## Baseline and intent

- **Input:** `NiyarvoProjects_v0_5_30.zip`, source-only snapshot. **Output:** 0.5.31 source update on top of that snapshot.
- **Commit status:** not committed; user tests locally on Git `work` before merging. **No APK built.** No deploy.
- **No schema or data migration.** Task/workspace normalization, AsyncStorage keys, import/export, encryption, scheduling, automation, sprint lifecycle, entitlements and domain behavior are unchanged.
- **Packaging:** project-root paths at ZIP root; deliberately exclude `app.json`, `package.json`, `package-lock.json`, `node_modules`, `.expo`. The source ZIP is an **overlay for the existing Termux installation**, not a standalone dependency installation.

## Product direction / design review

- **Product:** local-first planning, Kanban, dependencies and release readiness for independent projects.
- **Character:** calm, exact, dependable.
- **World:** a quiet workbench with task cards and planning instruments.
- **Rich moments:** the task board, Gantt dependencies and verified release progress — not decorative chrome.
- **Signature:** restrained orange active-state accent and meaningful status indicators.

**Before audit:** desktop content was constrained to a 1180px centered column; 248px sidebar had no collapse mode; project selection lived only in sidebar; top toolbar lacked screen context; title and control radii varied widely; mobile/desktop were separate shell return trees; Gantt item labels were hidden by default on wide screens; task card metadata used pictographs; multiple native modal sheets lacked an error strip.

**After:** fluid page width, 264px / 72px sidebar, shared top toolbar with project picker and task search, single stable shell tree, calmer neutral tokens in both themes, common control density, desktop-visible Gantt labels, refined Kanban columns/cards, inline errors across shared sheets. Motion remains restrained; web keyboard focus and reduced-motion preferences are respected.

## Changes

### Navigation and responsive shell

- `src/components/shell/Menus.js`: persistent full/compact sidebar. Above 1120px the 264px rail has an explicit collapse control; below that it automatically shows a 72px icon rail until mobile breakpoint. Navigation retains the same full grouped destination set, accessible labels, active state and icon. Workspace/project selection remains usable from the compact rail. Added a reusable desktop project switcher using the **existing** project drawer and callbacks — no new project-selection logic.
- `src/components/shell/Bars.js`: context-aware toolbar with project selector, current page, search, theme and New task. Bottom navigation keeps the same five primary destinations; no navigation or intent API changes.
- `src/app/ModernApp.js`: replaced two independent platform-specific shell return branches with one stable safe-area tree. This reduces the opportunity for page remounts when resizing across the desktop breakpoint. Retained visited-tab cache, `StoreFreeze`, navigation queue and diagnostic markers. Added a visible web keyboard focus outline and CSS reduced-motion override. **Not proof that first-open Timeline bounce is fixed on hardware**; native acceptance remains required.

### Shared design system and dialogs

- `src/ui/theme/theme.js`: balanced light graphite/paper and dark graphite surface ramps, tighter radii. Light default orange is darker to improve text contrast. User-selected accent preference and storage key are untouched.
- `src/ui/theme/theme.cjs`: small contrast-aware foreground helper, unit-tested against every accent. Does not change accent names, IDs or storage values.
- `src/ui/uiBase.js`: existing typography / Card / Avatar / progress components reused, no replacements.
- `src/ui/uiControls.js`: harmonized button, chip and segmented control geometry, touch heights and accessibility roles.
- `src/ui/uiLayout.js`: Page is fluid rather than capped; screens share consistent gutters, typography, section rhythm and grid cells. All screens using Page, Card, Grid, Stat, Sheet inherit the update. Shared sheets are wider on desktop and contain sticky in-modal error notices (the error stays visible while the body scrolls).
- `src/screens/tasks/TaskSheet.js`: retains its original sticky footer notice while opting out of the new shared Sheet notice, so the refusal is not duplicated. `src/components/notice/InlineNotice.js` now imports text directly from the leaf UI base to avoid circular imports.

### Kanban and Gantt

- `src/screens/board/Board.js`: slightly wider desktop (320px) / mobile (280px) lists, 14px gaps, deliberate status/count headers, clearer empty states and readable task card metadata with Feather icons instead of emoji. Filtering, list ordering, gesture math, progressive native mounting, card move rules and drop-before behavior are preserved.
- `src/screens/timeline/Timeline.js`: task names visible initially on desktop; compact on mobile. The label rail is 264/160px and can still be hidden. Clarified controls and date metadata and differentiated date header surfaces. Existing bounded SVG viewport, row virtualization, dependency routing, move/resize and edge/link handles are unchanged.
- **Other screens:** Overview, Tasks, Sprints, Scheduling, Releases, Specifications, Testing, Collaboration, Settings, Resources, Costs, Governance, Automations, Reports and Activity all use the shared Page/Card/Chip/Button/Sheet primitives, and therefore inherit the updated spacing, color, type and responsive content widths. No domain logic was rewritten.

## Tests

- `node tests/run-all.cjs`: **577 total / 576 passed / 0 failed / 1 skipped** (Node 22).
- Suite used temporary, *test-only* `app.json` (`0.5.31`) and `package.json` shims with placeholder animation dependency declarations because these files are excluded by the source ZIP. These **are not** a substitute for validation against the user's real Expo dependency manifest. Both shims were removed before packaging.
- TypeScript JSX parser (syntax only) checked the `src/` JavaScript files: **0 parse diagnostics**.
- New tests: `tests/ui/responsive-design-0531.test.cjs` (desktop navigation, toolbar, fluid Page, retained shell, Kanban, Gantt); `tests/ui/accent-contrast-0531.test.cjs` (WCAG AA contrast foreground for default and optional accents).
- Historical source assertions updated where their precise UI strings/pixel values intentionally changed. Store and domain tests were not modified.
- **Not run:** `npm test` against the user’s real package manifest, `npx expo install --check`, Metro Web screenshot/device interactions, Expo Go Android/iOS, FPS measurements, drag acceptance, APK. No performance improvement timings are claimed.

## QA checklist and residual risks

See `docs/qa/modern-code/NP-QA-0.5.31.md`. Important device checks: first-open Timeline without Overview bounce, sidebar collapse/expand on desktop, 880/1120px resize, task search/project switcher, Android side menu, Kanban long hold and cross-column drop, Timeline move/resize and dependency links, sheet notices and backup round trip. Actual responsive rendering and runtime navigation remain **unverified** until run through Metro and a native device. No new dependencies were added.

## Installation / rollback

1. In Termux, ensure your current v0.5.30 checkout has a clean, backed-up **`work`** branch and your existing `app.json`, `package.json`, `package-lock.json` are retained.
2. Extract this ZIP into `~/NiyarvoProjects` **at the root**. Do not delete application storage or recreate the project.
3. Set app, package and lock versions to `0.5.31` using your existing local manifests. Do not adopt the test-only manifest. Run `npm test` and `npx expo start --clear`; verify the QA checklist and collect a performance report.
4. If you detect a regression, revert the overlay with your v0.5.30 checkpoint / Git working branch. No persisted data migration needs undoing.

## Files touched

`src/app/ModernApp.js`; `src/components/shell/{Menus,Bars}.js`; `src/components/notice/InlineNotice.js`; `src/screens/{board/Board,timeline/Timeline,tasks/TaskSheet}.js`; `src/ui/{uiControls,uiLayout}.js`; `src/ui/theme/{theme.js,theme.cjs}`; updated UI source-check tests in `tests/app/{dynamic-island-056,notice-safe-anchor-055}.test.cjs`, `tests/diagnostics/diagnostics-048.test.cjs`, `tests/domain/operations-boards.test.cjs`, `tests/gestures/native-animation-contract.test.cjs`, `tests/ui/modern-design-regression.test.cjs`; new `tests/ui/{responsive-design-0531,accent-contrast-0531}.test.cjs`; `README.md`, `summary.md`, `RESUME.md`, this changelog and QA file.

**Design method:** Frontend Design, Unslop by Damir Sokolovsky (CC BY 4.0), Ponytail small-diff principles. No third-party UI source was copied.
