# Milvayo 0.6.3 stability QA

Release relabeled from 0.6.2 to 0.6.3; historical QA filenames/evidence remain unchanged.

Scope: Timeline pinch and zoom controls, system appearance, explicit launcher-icon apply and previous-session breadcrumbs. Existing Niyarvo visual language retained. Unslop by Damir Sokolovsky (CC BY 4.0) used as the review standard; spacing, color, typography, layout and chart styling preserved. Copy now explains the native lifecycle impact.

Product: precise independent project workspace. Character: calm, exact, dependable. World: planning instruments. Moments: Gantt, Kanban and verified progress. Signature: selected accent and meaningful status/dependency colors.

## Findings and controlled fixes

- Native theme effect called activity-alias switches on every preference change. The upstream runtime compared against the launching Activity, which remains stale across switches; repeated updates can leave aliases enabled. Theme application and launcher application are now independent. Confirmed icon application first flushes pending workspace data; a failed or rejected save prevents the native switch. Android alias reconciliation is an original local adapter installed by the config plugin into the existing library's generated build input. Upstream Kotlin is not copied into the project. Unknown source layout fails prebuild explicitly.
- Android system appearance was configured automatic without expo-system-ui. Added the SDK-matched module (~58.0.7).
- Native pinch toggled scrollEnabled during activation; the chart used a core ScrollView without a simultaneous native gesture relationship. Use a separate RNGH native detector outside core Animated, simultaneous pinch and keep native scrolling enabled. Preset changes immediately rebase both the calendar and drawing offset so a narrower chart cannot stay blank waiting for another user scroll. Pinch now has its own real detector; task virtual detectors retain their stable seeded ancestor. Native crash causality cannot be proven without device logs.
- JS diagnostics cannot intercept native death. Android 11+ now optionally reads the latest main-process exit reason from OS history on the next start; unavailable history is not a diagnosis, and an OS signal is not inferred to be OOM. The optional reader works only in an updated native build and its Kotlin runtime is Not run. Previous-run breadcrumbs are now retained to preserve the last actions. Reported 3982ms startup and Projects stalls remain unprofiled on hardware; no FPS improvement is claimed.

## Validation

This earlier stability pass is superseded by [the complete remediation report](remediation-062/ENGINEERING-REPORT.md), including current tests, direct Chromium runtime evidence and measured limitations. The first pass had 763 passing tests; the remediation suite adds focused regressions. The final report is the authoritative current result.

Playwright remains removed and was not used. The later implementation brief authorized local development browser testing. Only the Expo development server and installed Chromium were used; no export, prebuild, APK, IPA or production build was run. Native device/FPS/ANR/launcher acceptance remains **Not run**.

Sources: Android's documented [ApplicationExitInfo](https://developer.android.com/reference/android/app/ApplicationExitInfo) and [ActivityManager](https://developer.android.com/reference/android/app/ActivityManager). Expo documents the Android requirement for [expo-system-ui](https://docs.expo.dev/develop/user-interface/color-themes/).

## Device acceptance gates

1. Export a workspace backup. When separately authorized, build/install 0.6.3 using the existing Android workflow; do not uninstall (preserve data). Run Expo prebuild so the local adapter and system UI module enter the new build. Existing installed 0.6.1 cannot receive these native fixes through Fast Refresh.
2. In Settings change accent/Daylight/Dark/AMOLED repeatedly. The app must stay open and maintain project/screen state. Cancel Apply launcher icon and verify no exit. Confirm it once when ready; Android may close the Activity. Reopen and verify precisely one launcher entry and unchanged data. Repeat with primary Coral/Dark, then another accent. Launcher cache refresh is device-dependent; do not uninstall to clear it.
3. Choose System; change Android's system theme while active and while backgrounded. Verify the app follows on return without resetting navigation.
4. Open a 34-task Timeline. Test zoom buttons 30 times, two-finger zoom starting on bars and empty grid, a third finger, cancellation and background/resume. Confirm no crash, no stuck scroll, stable focal date, and aligned calendar/bars/links. Move and resize a task after zoom; resize must preserve the opposite date and inclusive day semantics. Export/import and verify dates remain intact.
5. Capture React Native DevTools profiles of the same zoom and Projects transitions, plus Android logcat/bugreport for native failures. The JS report alone cannot prove absence of a native crash.

## Reversible update

No data migration or schema change. Revert only this release’s tracked patch (do not discard unrelated work) and reinstall dependencies from the prior lockfile. Remove/regenerate native build inputs to undo the generated icon adapter. Native code rollback requires a new Android build with an incremented versionCode; project backups remain compatible. Do not automatically downgrade, uninstall, commit, push, merge or deploy.
