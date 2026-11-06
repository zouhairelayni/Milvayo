# Milvayo 0.7.1–0.7.9 engineering report

Final source version: **0.7.9**, Android versionCode **79**, iOS buildNumber **79**. Applied in the main Milvayo working folder on Git `work`. Each requested version has its own entry in the single cumulative `docs/changelog/CHANGELOG.md`. No builds, Playwright, native installation or deployment was run for this update. Implementation validation preceded the Git checkpoint; the owner subsequently explicitly authorized committing 0.7.9, pushing `work` and merging into `main`. Git history and verified remote refs record the resulting checkpoint. No runtime dependency or storage/import schema change.

## Implemented requests

| Version | Result | Behavior |
| --- | --- | --- |
| 0.7.1 | Implemented | Restore storage and appearance concurrently. Play the approved 3.7-second Board morph once in the resolved selected accent, then hold the finished mark for one second. Enter after the hold and safe storage readiness. Native paths run on the UI thread; reduced motion uses the final mark. Warm navigation/resume/theme changes do not replay it. Status-bar style follows the resolved appearance during the introduction. |
| 0.7.2 | Implemented | Thirty accent × Daylight/Dark/AMOLED icons with opaque substitute-palette background gradients and solid primary-color Board marks. Regenerated primary, legacy, PWA and separate adaptive foreground/background artwork; all 29 alternate identities remain. The prompt says “Your app Milvayo will restart to refresh its icon. Your work is saved first. Cancel to keep working.” Removed the Android/Expo Go caveats from this UI copy; retained explicit confirmation and durable-save failure checks. |
| 0.7.3 | Implemented | Android system Back, iOS left-edge Back and browser Back/Forward use project/workspace-scoped screen history. Sheets/tours dismiss first; unavailable tools and old project entries are skipped. Android returns normal root behavior at Home. Browser modal replacement/scope resets and blocked History writes are guarded. |
| 0.7.4 | Implemented | Days/Weeks/Months preset changes focus Today using the new day width. Drawing, calendar offset and native viewport agree, including returning to Days after arbitrary scrolling. Clamp when the full chart is narrower than the viewport. Preserve pinch focal anchoring and edit geometry. |
| 0.7.5 | Implemented | Days, Weeks and Months form one pill row at the top of Timeline options. The same handler drives these pills and header presets; changing a pill keeps the popup open. |
| 0.7.6 | Implemented, owner clarification applied | Remove only the screen-name text next to the hamburger and from top back headers. In-screen ScreenIntro headings, Project schedule, descriptions, sections, onboarding instructions and popup titles remain. The back control is named “Go back.” |
| 0.7.7 | Implemented | List no longer has its own Add task action. Mobile task creation remains in the bottom navigation; filtering, task details and the wide global creation control remain. |
| 0.7.8 | Implemented | The plus-labelled New sprint button is in the horizontally scrolling sprint selector row. No duplicate top-header sprint creation action. Existing form validation, first-sprint empty state and frozen history remain. |
| 0.7.9 | Implemented | Top island expands for three seconds, shrinks, holds compact for three seconds after the shrink settles, then exits. Tap the compact island to reopen it. Explicit sticky notices remain; reading the full message pauses automatic dismissal. Both forms keep a named close control; Backup remains actionable. Replacement/unmount cancel owned timers and stale animation callbacks. |

## Root fixes and interaction boundaries

ColdStartGate no longer serializes storage behind branding or relies on a guessed delay to represent animation completion. StoreProvider reports readiness on success or its existing safe error path. Hydration runs while the logo plays; the shell, tour and notifications mount after the hold, so notices cannot time out behind the intro. The native SVG path motion uses Reanimated shared values and completion callbacks with canceled-playback guards; it does not re-render React every frame. Existing appearance keys and fallback behavior remain.

Back handling extends the existing retained-tab architecture without installing a router or replacing its verified workflows. History is bounded to 64 entries, preserves a Home root and resets per project/workspace. Only screen identifiers enter browser history; project data, task payloads and credentials do not. iOS detection is single-finger and restricted to the leftmost 24px; vertical, short and canceled gestures do not commit. Android uses its system Back event rather than adding a competing full-screen swipe. Native Modal Back uses onRequestClose, because an open Modal intercepts the global event. [React Native Modal documentation](https://reactnative.dev/docs/modal). Gesture configuration follows the installed RNGH 3 hook API and its documented pan thresholds. [RNGH pan documentation](https://docs.swmansion.com/react-native-gesture-handler/docs/gestures/use-pan-gesture/).

Preset focusing now uses a date anchor, rather than rebasing whatever date the user last scrolled to. Native layout acknowledgement recomputes that focus for the measured viewport; pinch keeps its existing focal rule. Header preset callbacks also track the calendar start/Today so a changed date range cannot leave a stale closure. No duration, move, resize, dependency, scheduling or import logic changed.

The island animates an empty, absolutely positioned background and crossfades fixed text layers. Native work runs on the UI thread; web uses scoped Web Animations and reduced-motion fallback. Its three-second compact timer begins on actual morph completion. Timer ownership and notice IDs prevent an old exit from dismissing a replacement. Full reading pauses the cycle. All non-sticky notice types follow the requested timed cycle; persistent store/form failure state is not cleared by a toast.

## Validation

| Check | Result | Evidence / practical limit |
| --- | --- | --- |
| Full `npm test` at 0.7.9 | **Pass** | 826 passed; zero failures, skips or cancellations. `full-tests.txt`. Tests use two processes. |
| Header follow-up | **Pass** | 28 focused checks, including both main/sub header variants, restored in-screen headings and source bindings. `header-followup-tests.txt`. Also included in the final full suite. |
| App source / JSX | **Pass** | 203 files parse. A new suite-wide guard checks each JSX component has an import or local binding. |
| Native/worklet source transforms | **Pass** | 25 native files; required metadata present for edge Back, native Board morph, island motion and all seven shared morph helpers. `source-check.json`. This is not native compilation or device acceptance. |
| Icon artwork | **Pass** | Pixel tests cover all 30 small PNGs: visible gradient, opaque background, exact solid theme-color logo. Test transparent adaptive foreground, separate background, alias paths/sizes and stable PWA identity. |
| Icon visual inspection | **Pass (static artwork)** | Opened existing icons before changes and inspected the final three-mode × ten-accent gallery. `icon-gallery.svg` / `icon-gallery.png` are code-rendered artwork, explicitly not device screenshots. |
| Expo compatibility | **Pass (offline)** | Installed dependencies are up to date, with Expo’s explicit offline-validation warning. `dependency-check.txt`. No packages added. |
| Whitespace / structure | **Pass** | Git whitespace checks and folder/import tests pass. Code remains in the prescribed folders with path comments. |
| Android / iOS / browser live acceptance | **Not run by agent** | Native gesture arbitration, appearance/reduced-motion feel, OS launcher rendering, real browser traversal and warm resume require device checks. Existing 0.7.0 owner build approval does not verify this update. |
| Builds, Playwright, deployment | **Not run** | No new native/production build, Metro service or device automation. |
| Git delivery | Owner-authorized after implementation validation | Commit 0.7.9 on `work`, push, then merge into `main` without rewriting history. Verify remote refs after publication; no version tag or APK workflow dispatch. |

New regression coverage includes one-shot startup/hold/unmount, browser nested/modal/busy/manual-close/forward traversal, project resets with an open switcher, disabled tools, History API failure, Android root behavior, iOS thresholds, real icon pixels, current header/List/sprint controls, repeated Timeline preset cycles, and island timing/replacement/reading/sticky behavior. Existing model, backup, import round-trip, frozen sprint history, scheduling, task edit and gesture regressions remain. Updated historical UI assertions only where the owner changed the behavior.

The owner caught an unterminated onboarding wrapper during editing. Its missing BackSurface closing tag was corrected immediately. The complete source parse/binding guard now covers Onboarding and every app source file, and all final checks pass. The owner also clarified that only top-bar titles should be removed: in-screen headings were restored and both top-header branches were checked directly.

## Device acceptance and rollback

Use the existing Metro workflow with the main folder. Reload once to exercise a cold JS launch, then verify the selected accent, one completed morph, one-second hold, reduced motion and no replay on warm resume. Confirm nested Back handling, one-row Timeline pills, Today focus after repeatedly changing presets, retained in-screen headings, List creation via the dock, sprint creation in the scrolling row, and the island’s 3-second/morph/3-second/exit cycle.

**New native launcher artwork requires a future installed build containing these resources.** Metro updates the preview and JS behavior, not the resources compiled into an existing APK/IPA. No new native modules are required. PWA icon refresh is also subject to browser/OS caching. Do not uninstall or clear app data to test this update; preserve signing files and install any future native update normally.

No data migration. Source rollback is the owner-built 0.7.0 checkpoint `5541a9b6ee611341de8fbda628a56cf7f5278a90`. Review the current diff before discarding work; use a clean checkout of that checkpoint with its matching lockfile/dependencies if rollback is needed. Avoid extracting an old tree over new-only source/assets. Preserve AsyncStorage, credentials and signing files. No automatic reset/clean, temporary project copy or redesign folder was created.

Design review: the scoped before-audit and five-line product direction are in `IMPLEMENTATION-PLAN.md`. Unslop by [Damir Sokolovsky](https://heydamir.design/unslop), CC BY 4.0; credit retained. Shared neutral chrome, the original Board geometry and the approved in-screen design remain.

## GitHub native-source packaging correction (2026-11-06)

The owner’s GitHub run passed regression tests but failed prebuild while copying `src/platform/android/AlternateIcons.kt`. Root cause: the unanchored `android/` ignore rule also excluded that authored source directory. The adapter existed in the local workspace, so earlier source tests passed without proving it was shipped. The earlier staged-file checks did not catch the omission.

Scope: anchor generated-native ignore rules to `/android/` and `/ios/`, and include the existing Kotlin adapter in Git. Keep the adapter, plugin callback, aliases, version 0.7.9/79, Metro configuration, dependencies, data and UI behavior unchanged. No migration. An ignored-source scan found no other excluded files under `src/`, `tests/` or `scripts/` after this correction.

The new regression first failed with the original ignore rule. It creates a disposable Git index using the project ignore rules, checks that generated native projects stay excluded, and reconstructs the adapter and plugin from staged blobs. It executes only the plugin callback against a mock dependency: the exact Kotlin source must copy successfully, and a moved upstream target must still fail safely. This does not invoke Expo prebuild, Gradle or the installed native module. Temporary fixtures are removed in `finally`.

Focused packaging/icon-safety/folder checks: **Pass**, 11 tests. Full `npm test`: **Pass**, 827 tests, zero failures/skips/cancellations (`native-packaging-tests.txt`). Offline Expo compatibility: **Pass**, with Expo’s offline-validation warning (`native-packaging-dependency-check.txt`). JSX parsing remains part of the full suite. GitHub APK/prebuild rerun, Kotlin compilation, Metro and device/browser acceptance: **Not run by agent**. No build or workflow dispatch. Publish through the previously authorized `work` → `main` path, without a version tag.

Rollback is a reviewed revert of this correction; it changes no persisted data or signing material, but reverting would restore the reported clean-checkout packaging failure. Preserve app data and credentials.
