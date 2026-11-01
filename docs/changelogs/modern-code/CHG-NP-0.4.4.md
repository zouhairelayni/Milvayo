# CHG-NP-0.4.4 — Android/iOS Gesture + Timeline Render Hotfix

## 0. Read first — release handoff

| Field | Value |
|---|---|
| Application | Niyarvo Projects (independent local-first PM app) |
| Previous source baseline | v0.4.3-NATIVE-MOTION-QA |
| New candidate | v0.4.4-ANDROID-GESTURE-HOTFIX |
| Release status | **QA candidate — Android and iOS runtime not yet verified** |
| Date | 2026-10-31 |
| Source delivery | `NiyarvoProjects-v0.4.4-ANDROID-GESTURE-HOTFIX.zip` (project contents at ZIP root) |
| Checks | 339/339 Node source/domain tests passed |
| Expo Go Android | **Not run**; user must validate on device |
| Expo Go iOS | **Not run** |
| Expo Web | **Not run**; unchanged web gesture implementation |
| npm dependency installation | **Not verified** in this environment; npm registry lookup returned EAI_AGAIN |
| Data migration | None. Same local workspace/persistence implementation |

## 1. Reproduced errors from user report

**A. Timeline render exception**

- User saw `ReferenceError: Property 'Platform' doesn't exist`, sourced from `src/screens/Timeline.js` line 214 in `TaskBar`.
- Confirmed: `Platform.OS` occurred multiple times but `Platform` was missing from the `react-native` imports.
- Fix: import `Platform` explicitly. No timeline layout dimensions changed.

**B. Kanban/Timeline Worklets warning**

- User saw `[Worklets] Cannot copy value of type WorkletEventHandler` in a `useAnimatedStyle` closure through `gestureSurface.native.js`.
- Confirmed: native `GestureArea` and `DragMotion` referenced `drag.x.value` and `drag.y.value` **inside** their Reanimated worklets. `drag` also contained the RNGH 3 composed gesture object and event handler, which Reanimated tried to transfer into the UI worklet.
- Fix: destructure/capture only `translateX` and `translateY` shared values outside the worklet and reference their `.value` fields inside; pass `gesture` only to the virtual detector, not into the animated style.
- Worklet-based motion and RNGH 3 virtual detectors remain in place. No JavaScript frame-by-frame animation was added.

## 2. Changed files

- `src/screens/Timeline.js` — add missing React Native `Platform` import.
- `src/gestureSurface.native.js` — isolate the shareable values from the full gesture controller in both native wrappers; preserve all style/layout props and gesture handling.
- `tests/native-worklets-hotfix.test.cjs` — new source-level regression checks.
- `package.json`, `app.json` — bump application version to `0.4.4`.
- `docs/CHG-NP-0.4.4.md`, `NP-QA-0.4.4.md` — release handoff and acceptance checklist.

**Packaging caveat:** the v0.4.3 ZIP contained a *v0.4.2* `package-lock.json` with no direct Reanimated/Worklets/Gesture Handler dependencies. npm registry was unavailable here, so the inconsistent lockfile is **excluded**, not fabricated. Run `rm -f package-lock.json && npm install` on the Termux device to generate a valid lock for v0.4.4. Keep the regenerated lockfile once installation succeeds.

## 3. Explicit non-changes

- No changes to board width (`290/272`), column gap (`12`), card padding, task-sheet inline dropdown layout, timeline row (`54`), bar height (`26`), or 56-day viewport.
- No changes to the React Native Web drag implementation.
- No changes to persistent project schema, IDs, relationships, migration logic, scheduling validators, task actions, or import/export.
- No new dependencies compared with v0.4.3.
- No native modules recompiled, app binaries built, Git operations performed, or remote deployments.

## 4. Validation performed

- `npm test`: **339 passed, 0 failed**.
- Included tests confirming `Platform` import and no capture of the whole `drag` object in Reanimated animated styles.
- ZIP filesystem validation: full source package integrity check.
- Native Android/iOS UI interactions and the presence/absence of the Worklets warning **remain unverified** until device testing.

## 5. Exact Termux steps

Back up any uncommitted local source changes and the current workspace data before extraction.

```bash
cd ~/NiyarvoProjects
unzip -o ~/storage/downloads/NiyarvoProjects-v0.4.4-ANDROID-GESTURE-HOTFIX.zip -d .
rm -f package-lock.json
npm install
npx expo install --check
npm test
npx expo start --clear
```

Do **not** use `npm ci` until `npm install` has regenerated the lockfile from the updated manifest.

## 6. Acceptance gate / next model

Follow `NP-QA-0.4.4.md`. Validate Android Expo Go: Kanban loads, tap opens task, drag card/list, Timeline opens without exception, move/resize/link remains functional, navigation back/forward, no repeat Worklet warnings. Check web independently. Record any new stack trace, Expo package versions, device app state and resulting persisted task dates. **Do not promote v0.4.4 to main** until native acceptance passes.
