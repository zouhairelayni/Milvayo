# CHG-NP-0.5.2 — Task completion, automation and premium UI refinement

**Project:** Niyarvo Projects — single modern application
**Base:** `NiyarvoProjects-v0.5.1-SINGLE-APP-MIGRATION.zip`
**Version:** `0.5.2` · **Date:** 2026-10-31
**Status:** Source-level QA candidate; Android/iOS runtime not tested by the assistant
**Git commit, merge, deployment:** Not performed

## Read first

- **Keep your existing `package.json`, `package-lock.json` and `node_modules`** in Termux; none is in this ZIP. The locally repaired `expo-font` installation is not overwritten.
- Extract directly into `~/NiyarvoProjects`. No enclosing parent directory and no second application UI.
- The existing `niyarvo-projects-v1` local workspace storage key and v0.4.1 domain authority are unchanged.
- No changelogs are stored in the project root. The sole new changelog is this file under `docs/changelogs/modern-code/`.

## Implemented

| Area | Implementation | Notes / safeguards |
|---|---|---|
| Task checkboxes | Square is now bound to `task.status === 'Done'` and uses the existing `moveTask` store operation. Unchecking moves to `In progress`. | Previous square selected an item only in screen-local state and could never persist completion. Long-press row now selects it for bulk operations. |
| Task filters/tags | Status chips and the complete set of project labels are grouped into a collapsed `Filters & tags` section. Task rows show up to two compact tags on mobile with a `+N` overflow counter. | Search, sort and saved views preserved. |
| Broken confirmation layout | Bulk action header uses its own full-width line; action buttons wrap below. Reusable buttons respect container width and wrap long captions. | Addresses 1-selected text stacking in the user screenshot; all reused Button controls benefit. |
| Completion routing | Automations → Completion routing: choose `Done` or `Validation` for an incoming completed card. | Uses new validated `moveStatus` action on original automation engine. The route to Validation is deliberately not shown as a completed square. Saves with existing project backup structure. |
| Automation rules | New `moveStatus` action, `aging` trigger with configurable inactivity days and status filter; ready-made 7-day aging and due-today rules. | No arbitrary JS or network calls; dependency/transition checks; one execution per rule/task/day for aging. Existing status/card/board/due actions and history intact. Aging/due checks require running in-app; not an OS background service. |
| Appearance | Orange remains the existing mock-design vermilion. Nine additional accent colors in an inline selector: Aqua, Mint, Lime, Amber, Coral, Pink, Fuchsia, Violet and Indigo. Accent and light/dark preference saved locally. | Shared status/priority semantic colors do not change with accent selection. |
| Branding | Removed wordmark/monogram from mobile page header; retained original brand assets in drawer and wide sidebar with small `PROJECTS` descriptor. | Increased mobile header top/bottom padding and left/right gutters without removing the OS safe-area wrapper. |
| Notifications | Store save/validation errors now shown as compact, dismissible in-app notices *inside* native safe area instead of a top-of-root banner. Native Reanimated spring-in transition. | No claim of a real Apple system Dynamic Island, system Live Activity or background push notification. In-app notifications only; no new dependency. |
| Task settings | Removed duplicate task schema preview and task-configuration shortcut from Settings. Full task-type, custom-field, workflow editing remains in Task configuration via drawer. | One modern UI. |
| Disclosure controls | Main expandable cards (`Fold`) display a `+` that rotates toward an `×` on native via Reanimated. Nested `EditRow` details retain chevrons. | Layout dimensions/spacing remain in the mock-design system. |
| Timeline | No changes to task/SVG geometry or scrolling. | Preserve user-confirmed v0.5.1 rendering behavior. |

## Verification

- **376/376 Node tests passed**, including 7 new v0.5.2 business/UI regression checks.
- **0 source JS/JSX parse errors** using TypeScript's TSX parser across modern app entry and `src/` JS/JSX sources.
- Direct fixture checks: status-to-Validation persisted across project import; 7-day aging excludes completed tasks and deduplicates repeat runs.
- `app.json` Expo version updated to `0.5.2`; no dependency manifest edits or new native packages.
- ZIP checked for integrity and absence of nested root, package manifests, root changelogs and duplicate release notes.
- **Not verified:** Expo Go render, native spring smoothness, physical island/notch dimensions, iOS motion, notification elevation, actual filesystem persistence across restarts or device performance. Source tests do not replace device acceptance.

## Acceptance test in Termux / Expo Go

1. Extract the ZIP at project root; keep existing `package.json`, lockfile and `node_modules`.
2. Run `node --test tests/*.test.cjs`, `npx expo-doctor`, `npx expo start --clear`.
3. On Tasks: check one task, switch tabs and return; completed square should remain checked. Uncheck and verify task returns to In progress. Long-hold a row for bulk selection and inspect action label wrapping.
4. Automations: choose Validation routing, mark a Backlog task done, confirm its status is Validation (not a checked Done square); switch routing back to Done, check another task and confirm it remains Done. Test blocked dependencies show a readable error.
5. Create the aging preset, press Card aging, confirm one Aging label and one execution log per matching stale card; repeat same day and confirm no duplicate history. No background execution while Expo Go closed is claimed.
6. Settings: switch accents/mode, restart app, verify preference persistence. Test compact notifications and text clearance below Android status bar or iPhone camera housing.
7. Verify menu brand/PROJECTS descriptor, rotating section +/× controls, chevrons on nested records, task configuration in drawer, unchanged Board drag and Timeline display.

**No merge to main until physical Android/iOS QA succeeds.**
