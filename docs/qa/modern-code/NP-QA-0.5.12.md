# NP-QA-0.5.12

| Check | Result |
|---|---|
| Node tests | PASS: 434, zero failures |
| Dependency compatibility | Offline Expo check passes; offline reliability limited |
| Android/iOS/web JavaScript exports | PASS; not installed APK/IPA tests |
| Browser Timeline navigation | PASS: 10 cycles |
| Browser CPU stress | PASS: 6× Chromium CPU throttling, final Timeline selection remains active |
| Secondary screens | PASS: 19 screens opened |
| Persistence | PASS: task edit survives reload |
| Browser SVG/JS errors | None observed |
| Native installed build, Expo Go, device FPS, native lazy-column drag | NOT RUN |
| Android first-open bounce resolved | NOT VERIFIED |

Browser: Atlas fixture with one-sided predecessor date, 412×915 touch emulation and 1440×1000 desktop. Chromium throttling is not an Android emulator. Native column selection is covered by deterministic tests; native view mounting and gesture behavior still require physical-device acceptance. No claim of device timing gains for this release.

Tests cover latest-selection navigation under a burst, cancelling queued navigation, viewport column selection, pinned startup history under 200 later events, and separately labelled previous-session exceptions. Current-run reports no longer inherit historical slow timings.

Existing visual design retained. Native Board keeps the first two columns and visits subsequent columns lazily; all visited cards remain until leaving the screen. Very large first columns remain a known limitation. See changelog for install and rollback steps.
