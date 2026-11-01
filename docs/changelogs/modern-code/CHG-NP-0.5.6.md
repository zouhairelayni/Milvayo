# CHG-NP-0.5.6 — Dynamic Island-style notification lifecycle

## 0. Baseline / status

- Baseline: `NiyarvoProjects-v0.5.5-ENTREPRISE-PM-SAFE-NOTICES.zip`.
- Release: **0.5.6**, **source-verified QA candidate**; Android, iOS and browser visual runtime tests **not run**.
- This is a **cross-platform in-app notification** visual system. It does not integrate with, recreate, or access Apple's system Dynamic Island or Live Activities.
- Existing task data, local workspace key and persistence/authorization modules unchanged.
- `package.json`, `package-lock.json`, and `node_modules` intentionally excluded from ZIP, respecting the user's fixed Expo dependencies.

## 1. Changed source files

- `src/IslandNotice.js`: shared severity colors, accessible compact and expanded content, tap-to-expand, collapse, dismiss, timed confirmations and persistent error notices.
- `src/NoticeMotion.native.js`: native Reanimated shared-value/worklet transitions for width, height, translation, opacity and a subtle spring scale settle (UI thread).
- `src/NoticeMotion.web.js`: React Native Web Animated spring for opening, timing for collapse/closing, matching layout and gesture controls on browser.
- `ModernApp.js`: uses a mobile safe-area shell, anchors mobile notices **below the header** rather than under Android system icons, and centers on desktop with inset-aware offset.
- `src/diagnostics/monitor.js` and `app.json`: release version updated to 0.5.6.

## 2. Interaction contract

1. New notification starts as compact black pill, then morphs into readable expanded card.
2. Success/info/warnings collapse to a compact form before closing automatically.
3. Errors remain visible for manual dismissal; user may collapse and re-expand.
4. Compact pill re-expands on tap; expanded notice has explicit dismiss and collapse affordances.
5. Multiple platforms share one event store; no Java/Gradle dependencies are added.
6. Notification does not cover the Android status bar, device cutout, or mobile navigation tabs.
7. User can still operate the app; toast is an overlay, not a navigation screen.

## 3. References reviewed (design inspiration, not installed/copy-pasted)

- pehaa/simple-notifications-solution (MIT): self-closing vs explicit dismissal, event lifecycle. https://github.com/pehaa/simple-notifications-solution
- jaredrummler/AndroidAnimations (Apache-2.0): easing and animated state changes. https://github.com/jaredrummler/AndroidAnimations
- Shashank02051997/FancyAlertDialog-Android (Apache-2.0): severity hierarchy and deliberate dismissal for alerts. https://github.com/Shashank02051997/FancyAlertDialog-Android
- hariprasanths/Bounceview-Android (Apache-2.0): restrained press/spring interaction. https://github.com/hariprasanths/Bounceview-Android

No source code or binaries from those projects were included. Using their original Android packages would require native integration and would not provide one implementation for Expo Go, iOS and web.

## 4. Verified here

- `node --test tests/*.test.cjs`: **404/404 pass**.
- TypeScript parser on JS/JSX files: **42 parsed / 0 syntax diagnostics**.
- Native Expo Go, iOS simulator/device, browser layout, reduced-motion testing: **Not run**.
- No dependency manifests included in archive.

## 5. Remaining acceptance / risks

- Confirm pill stays below Android status bar and cutout in Expo Go, including after device rotation and light/dark mode.
- Check rapid consecutive notifications, error-dismiss interaction and any content clipping with long messages.
- Test actual iOS notch-safe placement and desktop web width/responsiveness.
- Animation smoothness and frame rates cannot be established by source-level tests.
