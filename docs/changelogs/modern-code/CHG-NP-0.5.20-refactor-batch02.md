# CHG-NP-0.5.20 refactor batch 02 (no version bump)

Behavior-identical refactor of the app shell and the shared UI. No dependency, app.json, package.json or saved-data change.

## App shell
- `ModernApp.js` 560 -> 315 lines. It keeps `NAV`, `TABS`, `SCREENS`, `CachedPage`, `Shell` and `ModernApp` (tests and navigation rules read them there).
- New `src/shell/Menus.js`: `Brand`, `NavItem`, `ProjectDrawer`, `ProjectCard`, `Sidebar`, `SideMenu`. The group list that was written out twice (sidebar and phone menu) is now one `NavGroups` component. `Sidebar` / `SideMenu` get the list as a `nav` prop.
- New `src/shell/Bars.js`: `TopBar`, `TabBar` (gets `tabs` as a prop).
- New `src/shell/ScreenErrorBoundary.js`.
- Unused imports left behind by the move were removed from `ModernApp.js`.

## Shared UI
- `src/ui.js` 328 lines -> a 9-line re-export file. Every screen still imports from `../ui`; all 19 exports are unchanged.
- New `src/uiBase.js` (T, Card, Pill, Avatar, Bar, useWide), `src/uiControls.js` (Chip, Segmented, Button, IconBtn, Input), `src/uiLayout.js` (Sheet, Page, Grid, Cell, Stat, SectionTitle, Empty), `src/downloadText.js`.
- No import cycles (base <- controls <- layout).

## Tests
- New `tests/refactor-batch02-0522.test.cjs` (5 tests) and two helpers, `tests/shell-source.cjs` and `tests/ui-source.cjs`, which read the shell / UI source across the new files.
- 8 older source-text tests now read through those helpers because the text they look for moved: brand-mark-web, diagnostics-048, governance-migration-059, navigation-drawer, ui-automation-052, enterprise-hierarchy-055, modern-design-regression. Their checks are unchanged.
- `node --test tests/*.test.cjs`: 482 tests, 476 pass, 5 fail, 1 skipped. The 5 failures are the same missing-`examples/`-folder fixtures as the original v0.5.20 zip.
- JSX syntax and undefined-name check on all changed files: Pass. Expo Go / web run: **Not run**.

## Reversible install
Copy the files over the project. To undo: delete the 10 new source/test files listed in summary.md and restore ModernApp.js, src/ui.js and the 7 patched tests from the batch 01 zip.
