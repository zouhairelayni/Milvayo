# CHG-NP-0.3.11-HOTFIX1 — Mobile/Web navigation drawer usability

## 0. Read first — handoff

| Field | Observed value |
|---|---|
| Application | Niyarvo Projects — independent local-first Expo/React Native app |
| Release ID | v0.3.11-HOTFIX1 |
| Base | Full v0.3.11 local-QA source archive |
| Scope | **Navigation-only hotfix** for an unscrollable sidebar, inaccessible navigation below Resources, and persistent-looking dark backdrop on Android and Web |
| Data migration | None; AsyncStorage keys and JSON project schema unchanged |
| Dependencies | None added or removed |
| Git | User-controlled `work` branch; no commits, pushes, merges or deployments performed |
| QA | 283/283 Node tests pass; JSX parser reports 0 diagnostics; Android/Web runtime not tested here |

## 1. Reported issue / before

A screenshot from Android showed the left navigation ending at **Resources**, with **Costs, Collaboration, Reports, Settings** and subsequent links inaccessible. The full-screen dark modal backdrop obscured the app, and the drawer could not be scrolled or reliably closed. User additionally confirmed the same issue on Web. This issue is present in the v0.3.11 navigation code; it does **not** imply a missing npm package.

Root-cause evidence in source:
- Sidebar was one non-scrollable `View` with `nav.map(...)` children and a flex spacer before the footer. Content could overflow the available vertical height.
- Mobile sidebar was rendered inside `SafeModal` with `#000b` opacity, and no explicit close icon, only an outside Pressable and `onRequestClose`.

## 2. Changes implemented

1. Restructured sidebar as a bounded-height column (`height:'100%'`, fixed width) with a vertical `ScrollView` **only around navigation links**, `flex:1`, `minHeight:0`, `nestedScrollEnabled`, visible scrollbar and extra bottom spacing.
2. Kept Niyarvo brand, workspace switcher and "Close navigation" icon outside the scroll area, so they remain accessible even at the bottom of a long menu.
3. Increased navigation row touch height to at least 44 logical points. All existing navigation destinations remain reachable; no new tabs or altered routing.
4. Replaced the mobile/Web **navigation** `SafeModal` with a bounded in-tree absolute overlay. Background is dimmed more lightly, with a full-screen tappable dismissal backdrop and an always-visible close button.
5. Added Android hardware Back button and Web Escape key dismissal while the navigation menu is open. Navigation selection closes the menu.
6. Kept all **other** modals (task editing, project picker, import, confirmation dialogs) unchanged. No storage, board, task or Firebase code changed.

## 3. Source changes

- `App.js`: sidebar layout, scrolling, overlay, close controls, Back/Escape handlers.
- `tests/navigation-drawer.test.cjs`: five source regression checks for scroll containment, fixed header/close, dismissible overlay, touch targets, Back/Escape.
- `CHG-NP-0.3.11-HOTFIX1.md`, `docs/NP-QA-0.3.11-HOTFIX1.md`, `docs/NP-v0.3.11-HOTFIX1-test-results.txt`, README note.

## 4. Verification results

| Check | Status | Evidence |
|---|---|---|
| Node test suite | **Pass** | 283 tests, 0 failures |
| JSX parse | **Pass** | Global TypeScript parser, 0 diagnostics for `App.js` |
| ZIP archive integrity | **Pass** | Validated after packaging |
| Fresh extraction tests | **Pass** | Verified extracted full archive |
| Expo Web runtime | **Not run** | No installed Expo dependencies in the build container |
| Android / Expo Go runtime | **Not run** | Requires user’s device |
| Package compatibility | **Not run** | No `node_modules` in the provided source archive; no dependencies changed |
| Automated screenshot/UI interaction | **Not run** | Device/browser acceptance required |

## 5. Reproduction / acceptance criteria

1. On Android and Web, open the navigation drawer in a narrow viewport. It must scroll **past Resources** through **Settings**, with independent vertical scrolling.
2. With the menu open, tap **Close navigation**. The menu and backdrop must disappear and the app must be interactive.
3. Reopen the menu and tap outside; app returns to the current screen.
4. With menu open, press Android Back (Expo Go/standalone) or Escape (Web). Menu closes without exiting the app.
5. Open a lower menu item (e.g., Reports/Settings); correct screen opens and backdrop disappears.
6. Test Atlas Timeline and Board separately for regressions; those implementations were not changed by this patch.

## 6. Rollback

Reapply the original full v0.3.11 source ZIP over `work` after preserving local modifications. No data restoration or migration is necessary. Do not clear app data to test the navigation fix.

## 7. Future work

The independent Kanban redesign inspired by the uploaded Kan reference has **not** been merged into this hotfix and should be considered a separate release after this navigation fix is accepted on Web and Android.
