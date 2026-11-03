# Niyarvo Projects v0.5.33 — Mobile Web layout and Gantt link color hotfix

## Baseline
Use only after v0.5.31 DESKTOP HF1 + portrait HF2 + v0.5.33 selective merge and test reconciliation. The user's checkout reported 588 passed and three failures in the full Node suite; two came from HF2 script path/import scanner and one from the superseded breakpoint test. A desktop-at-320 Web rule also made mobile Safari/Brave screens collapse into vertical letters. This is a corrective **overlay**, not a standalone source release.

## Scope
1. `src/ui/layoutMode.cjs`: wraps existing `isDesktopLayout` with browser-mode detection. The app's Desktop selection remains available; a mobile Web UA defaults to mobile UI in portrait and landscape, while desktop browser UA and Desktop site/expanded CSS viewport retain the desktop shell. Original breakpoint/native layout logic remains intact. A user-initiated desktop preference takes precedence.
2. `src/screens/timeline/Timeline.js`: dependency curves and endpoint markers use stable, distinct colors from the original seven-color palette. Critical-path override remains. No path coordinates, clip bounds, gesture recognizers, ordering or interaction changes.
3. `tests/ui/desktop-mode-0531-hf1.test.cjs`: updates the superseded mobile-at-360 assertion to cover UA-based modes while retaining other HF1 tests.
4. `tests/ui/portrait-desktop-0531-hf2.test.cjs`: updates obsolete Web auto-desktop expectations and adds the path header required by existing folder tests.
5. `scripts/apply-np-portrait-hf2.cjs`: adds the source path comment and splits replacement-string literals without changing the strings' evaluated meaning. Prevents the project's import scanner from treating string content as real imports.
6. Adds `tests/ui/mobile-browser-and-dependency-colors-0533-hf4.test.cjs` for Android UA Client Hints, UA fallback, Desktop site viewport expansion, manual desktop, native separation and dependency colors.

## Before running
- Export your local workspace through Settings > Backup; keep the working Git checkpoint.
- **Do not** reset site data or uninstall the app. This update does not change storage, schema, npm dependencies or payment/security logic.
- The overlay installer validates source shape, performs a dry run and is idempotent. It refuses unknown dependency JSX or missing HF1 desktop provider instead of overwriting the shell.

## Termux
```sh
cd ~/NiyarvoProjects
unzip -o ~/storage/downloads/NP-0533-WEB-MOBILE-DEPENDENCY-COLORS-HF4.zip
node scripts/apply-np-mobile-web-and-dependency-colors.cjs --dry-run
node scripts/apply-np-mobile-web-and-dependency-colors.cjs
node --test tests/ui/mobile-browser-and-dependency-colors-0533-hf4.test.cjs tests/ui/desktop-mode-0531-hf1.test.cjs tests/app/folder-structure.test.cjs
npm test
npx expo start --clear
```

## Acceptance
- On Brave normal Mobile site, reload localhost:8081 in portrait: mobile header and bottom tabs, no giant desktop toolbar, no vertically stacked single-letter text. Landscape remains mobile site unless browser requests desktop.
- Toggle browser **Desktop site** and reload: desktop nav/toolbar visible. If browser doesn't expose its Desktop site state to the page, the app's explicit Desktop layout option remains the fallback.
- On desktop Web, confirm sidebar/rail, project switcher and search.
- Timeline: 2+ dependencies use distinct colored curves and colored endpoint dots. Critical path remains highlighted when selected. Verify drag, resize and dependency add/remove on Web and Android.
- Confirm workspace and task edits survive reload; do not clear browser data to reset the layout.
- If an earlier manual in-app **Desktop layout** preference is still active on mobile, switch to **Automatic layout** from the rail footer (rotate temporarily if necessary) to restore mobile mode.

## Verification
A reconstructed fixture containing v0.5.30 domain files, simulated HF1/HF2 layout, v0.5.33 merge UI, and a previously gray Timeline source passed 584 tests / 0 failed / 1 skipped (585 total). Targeted browser mode, folder structure and historical desktop tests passed 15 / 15. Second installer run had zero changes. This **does not prove physical Web or Android runtime correctness**, nor does it reproduce the user's exact checkout; the user should verify on their device before committing.

## Intentional omissions and risk
No attempt to rewrite desktop screens for a manually forced 320px CSS viewport. On some browsers Desktop site is not detectable if neither UA/Client Hints nor viewport changes; the explicit desktop preference still works. No dependency upgrades, board/timeline gesture-engine changes, data migrations, or unrelated design work.
