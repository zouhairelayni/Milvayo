# CHG-NP-0.5.31-DESKTOP-HF1 — Desktop navigation responsiveness

## Baseline and scope

- **Baseline:** `NiyarvoProjects_v0_5_31.zip` source-only overlay; changes are UI-only.
- **Issue reproduced from user screenshots:** landscape Android/Brave Web appeared physically wide but used phone header, hamburger menu and five-item bottom bar. The previous shared breakpoint was 880 **CSS layout pixels**; the screenshot width is not a reliable measurement of React Native Web's `useWindowDimensions().width`.
- **Delivery:** `NiyarvoProjects_v0_5_31_DESKTOP_HF1.zip`, extracted over a local v0.5.31 checkout. Root-level source paths. No APK, deploy, schema changes or database modifications.
- **Version:** v0.5.31 hotfix; keep existing local `app.json`, `package.json`, `package-lock.json` (not included).

## Fixes

1. `src/ui/layoutMode.cjs` (new): central `isDesktopLayout(width, platform, preference)` selection, 700px Web desktop threshold, 900px native tablet threshold. Treats CSS layout pixels correctly; does not infer layout from screenshot resolution, physical pixels, or device user-agent. On web, explicit Desktop preference overrides a narrow layout viewport.
2. `src/ui/uiBase.js`: `LayoutProvider`, `useLayoutPreference`, shared `useWide`. Web-only desktop preference survives reload in `localStorage` (`niyarvo-projects:web-layout`). Fail-safe private browsing: no crash if storage is blocked. All screens use the **same** layout signal, including Page/Grid/Kanban/Timeline/Sheets, instead of only switching the shell.
3. `src/app/ModernApp.js`: wraps the existing Theme/Store providers with stable LayoutProvider. Wide view renders desktop Sidebar + TopBar and omits TabBar; narrow view retains mobile header, SideMenu and TabBar. Navigation keys, visited-tab retention, project selection and task state unchanged.
4. `src/components/shell/Menus.js`: adds **Desktop layout** control to mobile Web navigation for browser desktop-site modes with a still-small CSS viewport. Once manually selected, desktop rail offers **Automatic layout** to return to normal breakpoint behavior. Workspace and project drawers reuse existing callbacks; no new business logic.
5. `src/components/shell/Bars.js`: compact desktop toolbar below 1120px; project switcher shrinks, redundant breadcrumb hides, search remains visible, and New task uses an accessible icon button to avoid horizontal toolbar overflow. Full toolbar stays intact on larger desktops.
6. `tests/ui/desktop-mode-0531-hf1.test.cjs` (new): verifies Web 700–879px behavior, mobile native separation, Web-only override, accessibility controls, shared shell navigation wiring and compact-toolbar condition.
7. `tests/app/refactor-batch02-0522.test.cjs`: updates the shared UI export list to include the new layout provider and preference hook; does not relax unrelated tests.

## Verified results

- `node tests/run-all.cjs`: **580 tests / 579 passed / 0 failed / 1 skipped** using **temporary test-only** `app.json` and `package.json` placeholders; these placeholders were removed from the ZIP. Local Expo dependency versions and native runtime were **not** validated.
- TypeScript parser scanned 123 application JS/CJS/JSX sources: **0 parse diagnostics**.
- `unzip -t` packaging integrity checked.

## Not verified / risks

- No Metro/React Native Web runtime or browser screenshot comparison in this environment (the supplied source overlays intentionally omit Expo manifests and installed dependencies). Do not interpret static tests as proof that the user's specific landscape browser reports >=700 CSS pixels. If it still reports less, use **Menu > Desktop layout** (Web only).
- No Android/iOS gesture, drag/drop, first-open Timeline navigation bounce, actual FPS, visual contrast, or accessibility-device checks. Existing functionality is left untouched, not newly validated.
- For very narrow browser widths with manually forced desktop layout, compact rail and desktop toolbar can be dense; use **Automatic layout** in the rail footer to return to phone controls.

## Install in Termux

```sh
cd ~/NiyarvoProjects
unzip -o ~/storage/downloads/NiyarvoProjects_v0_5_31_DESKTOP_HF1.zip
npx expo start --clear
```

On Web, open desktop browser at 1440px and resized 768px viewport: sidebar/rail and toolbar should replace bottom bar; at 390px, mobile bottom tabs remain. If Web's Desktop site view retains a narrow CSS viewport, open the mobile hamburger menu and select **Desktop layout**. Use the rail footer's **Automatic layout** to revert.

Commit only after device/browser verification on the existing `work` branch. Roll back by restoring the v0.5.31 checkpoint; no saved project data requires migration.
