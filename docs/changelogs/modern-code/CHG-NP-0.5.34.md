# Niyarvo Projects v0.5.34 — Consolidated RIVNA themes and UI controls

**Source baseline:** User-supplied `NiyarvoProjects v0.5.32.zip` (internally v0.5.33; HF4 mobile-browser detection, desktop override and colored dependency lines already present). This is a complete source release, **not a patch installer**. All source files are at ZIP root.

## Delivered changes

1. **RIVNA theme system.** Retains the ten named accent IDs and their supplied start/end gradients, primary colors and tint-derived backgrounds. Appearance choices: System, Light, Dark and AMOLED (black background, tinted cards). Existing accent preference storage key retained; no project-model migration. Theme JS now derives colors directly from `rivnaPalette.cjs` through the public `theme.cjs` API.
2. **Appearance picker.** Rounded-square two-tone swatches, five columns per row on phone widths, with visible selected state. Old circular swatches and clay-orange special case removed.
3. **Kanban.** Main toolbar keeps board selection, add board, and one **Board tools** action. A reusable sheet contains search, High and above, due date, priority, owner, tag filters, reset, show card descriptions, per-board Power-Ups and local commands. Existing filtering, board state and gesture/drop engines preserved.
4. **Timeline.** Chart ribbon now groups Show Items / Hide Items, First Task, Today, Critical Path, Parent Tasks and To Schedule. The latter two open `Sheet` overlays for the hierarchy and unscheduled tasks. Parent expand/collapse and task-opening actions remain; the existing colored dependency rendering and critical-path emphasis are unchanged.
5. **No decorative side stripes.** Removed left-side accent bars from selected sidebar navigation items; selected-state surface and type hierarchy remain.
6. **AMOLED chrome.** Existing status bar, logos, and sheet scrims correctly recognize AMOLED as a dark appearance.
7. **Web PWA completeness.** Restored six missing `public/` assets from the earlier full releases (identical copies in v0.5.30 and Sonnet's v0.5.32) because the user-supplied archive omitted `public/`. Moved the old HF4 changelog out of the `docs/` root to satisfy repository documentation placement rules.
8. **Release version.** `package.json`, `package-lock.json` root/package version and `app.json` Expo version synchronized to 0.5.34.

## Scope and preservation

- No changes to workspace/task schemas, data persistence, Firebase rules or subscriptions.
- No new npm dependencies.
- Native Kanban and Timeline gesture engines, scheduling calculations and Gantt routing unchanged.
- The pre-existing browser detection remains: normal phone Web uses mobile layout; Desktop site or manual preference uses desktop layout.
- No installer steps. Older installer scripts in the archive are historical and **must not** be run for this release.

## Verification performed

- `npm test` on the exact edited source directory: **600 passed, 1 skipped, 0 failed** before the extra 0.5.34 checks (rerun after packaging below).
- All `229` existing JS/CJS source files parsed with TypeScript's JSX parser, **0 syntax diagnostics** before the additional test file.
- All ten palettes have primary-button foreground contrast ≥ 4.5:1 across Light, Dark and AMOLED.
- Physical Android Expo Go runtime, Brave mobile browser, forced Desktop site and a production Web export were **not run** in this environment; test on Termux before any Git checkpoint.

## Installation

Extract ZIP contents directly into `~/NiyarvoProjects` (no top folder) using `unzip -o`. Since unzip does not remove previously extracted files, the old `docs/CHG-NP-0.5.33-WEB-MOBILE-LINK-COLORS.md` may remain and must be removed **only after confirming its copy exists at** `docs/qa/release-notes/CHG-NP-0.5.33-WEB-MOBILE-LINK-COLORS.md`. Then run `npm test` and `npx expo start --clear`.
