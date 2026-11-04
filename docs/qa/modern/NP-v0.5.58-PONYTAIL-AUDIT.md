# Ponytail audit — Niyarvo Projects v0.5.58

**What this repo does:** Niyarvo Projects is a local-first project management application for Android, iOS and Web built with Expo and React Native. It manages projects, tasks, boards, timelines, sprints and encrypted local backups. **Expected load:** one person actively using one app instance with several projects and dozens to hundreds of tasks; no live multi-user service.

**Audit focus:** the new cold-start and drawer N→Board morph, menu layout, theme readiness, cross-platform SVG behavior, build/version consistency, storage integrity and release tests. Read the README, Expo manifests, deployment script, Firestore/Storage rules, app entry, navigation shell, brand and theme sources, backup job and ready-file code, and targeted test harness. Previous 0.5.x release history was considered. This is a risk-ranked audit, not a file-by-file review of every historic feature.

## Must fix before public release

1. **White labels are hard to read on bright accent buttons** (`src/ui/uiControls.js:58–86`, `src/ui/theme/themePalette.cjs`).
   - **What this is:** All primary buttons deliberately use white labels and icons over the user's exact selected accent fill.
   - **Problem:** In Daylight mode white on Amber `#FFA500` is only **1.97:1**, and on Lime `#A3E635` is **1.51:1**. People with reduced contrast sensitivity may not be able to read New task and other actions.
   - **Fix:** With user approval, retain the accent family but darken the *button fill* enough to support white labels, or choose dark foreground text using the existing contrast helper. Do **not** change the user's chosen HEX palette without permission.
   - **If we skip it:** Some essential buttons remain difficult to read. This is a **pre-existing, explicitly requested styling choice**, not a new v0.5.58 regression.

## Should fix

2. **Web encrypted backup is lost on page refresh** (`src/store/readyBackupFiles.js:11,19–20,37–40,58–60`).
   - **What this is:** Android/iOS persist completed encrypted exports in the documents directory. Web saves completed ciphertext only in `webReady`, a module-scoped variable.
   - **Problem:** Create an encrypted backup on Web, refresh before downloading, and the finished file is no longer available.
   - **Fix:** Store **ciphertext only** in browser IndexedDB until downloaded or discarded, with an explicit cleanup policy. Leave plaintext and passwords out of storage.
   - **If we skip it:** A user may spend minutes encrypting and lose the completed download by refreshing Web.

3. **New SVG motion has no physical Android/iOS acceptance test** (`src/components/brand/BoardMorph.js:18–45`, `src/components/brand/morphMotion.cjs`).
   - **What this is:** Three full vector paths update from `requestAnimationFrame` while the cold start or drawer animation plays.
   - **Problem:** On an Android device whose JS thread stalls while opening the drawer, frames can skip; a source test cannot prove the real 1×/1.5× experience is smooth.
   - **Fix:** Test on Android Expo Go in portrait and landscape with the performance monitor. Verify the 3–2–1 cutouts, pause/resume, each accent and reduced-motion setting; profile on slower hardware before shipping a production APK.
   - **If we skip it:** The release can pass all unit tests while still showing jerky logo motion on the user's phone.

4. **Launcher and native splash still show the company N** (`app.json`, `assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash-icon.png`, `public/icons`).
   - **What this is:** The in-app branding now uses the Projects Board mark, but the installed/PWA launcher assets still contain the old N design.
   - **Problem:** After cold opening Niyarvo Projects, users can see the parent company mark on the home screen and then a different product mark inside the app.
   - **Fix:** Export approved Board Kit icons for Android adaptive icon, iOS launcher and Web favicon/manifest, and rebuild the native binary. Keep the company N for Control Center only.
   - **If we skip it:** The product identity remains inconsistent outside the running app. **Not changed in this code-only motion release** to avoid silently replacing approved native assets.

5. **Logo and UI accents are two overlapping color tables** (`src/components/brand/morphGeometry.cjs`, `src/ui/theme/themePalette.cjs`).
   - **What this is:** The Board animation uses the official Board Kit three-stop color ramps; the UI uses the existing user-approved flat palette.
   - **Problem:** Mint's Board `#5FB8B2` differs from the UI's `#5FB8B1`, and other colors have similar small differences. Editing one set later will not update the other.
   - **Fix:** In a separately reviewed palette change, import the official ramps from one shared palette source and map the UI's flat accent roles to them, preserving light/dark/AMOLED contrast rules.
   - **If we skip it:** Theme colors and the product mark may slowly drift apart as future updates are made.

## Checks and fixes in v0.5.58

- Replaced browser-only SVG path sampling with precomputed 72-point contours. No new dependency or WebView was introduced.
- The same three paths animate continuously without logo-to-logo opacity crossfades or the fourth rear ribbon.
- Used SVG compound paths with `fillRule="evenodd"` for six real windows, instead of platform-sensitive `Mask` references.
- Rendered the final Board silhouette and six holes in Chromium at phone dimensions; it matches the official 3–2–1 Board shape.
- Cold-start logo remains centered at 1×; the app shell is mounted only after the intro. Saved theme preferences load before animation. A 1.5-second fail-open guard prevents a stuck storage promise from leaving the splash blank forever.
- Opening the phone drawer replays at 1.5×, and the theme cycle button sits immediately beside the original-position hamburger.
- Stopped animation frames on unmount and provided reduced-motion behavior. The legacy N no longer appears in the sidebar's in-app Brand component.
- Verified manifest versions, test coverage, archive root layout, and no Firebase credential or backup-format change.

**Verdict:** v0.5.58 is a viable **device-testing candidate**, not a verified native production release. The main next action is Android animation QA; the contrast issue must be resolved or explicitly accepted before public release.

**Not checked:** Physical Android/iOS FPS, real Expo Go startup and native SVG cutouts, native splash rebuild, full Web export, npm registry vulnerability audit, exhaustive source review of all 20+ screens, and cross-device synchronized data. No native build or Firebase deployment was performed.
