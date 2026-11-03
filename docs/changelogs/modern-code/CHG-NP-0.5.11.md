# CHG-NP-0.5.11 — Android drag rendering and navigation diagnostics

## Baseline and evidence
Based on the delivered v0.5.10 source. User tested v0.5.10 on Android API 35 and supplied 542245.mp4 plus diagnostics. Video frames from 4–12 seconds show Timeline preparation, return to Overview, then a successful Timeline opening. Report: Board 31 renders averaging 387 ms (max 933 ms), Tasks max 453 ms, longest JS timer delay 1520 ms. These are user-device observations for v0.5.10, not v0.5.11 measurements.

## Changes
- Memoized Kanban TaskCard. Moving the drop indicator no longer forces unchanged cards to reconcile. The active card still renders its lift/edit state, and store/theme changes still propagate.
- Stable empty feature-array prop prevents memoization being defeated on boards with no enabled Power-Ups.
- Native Tasks initial page and increments reduced from 80 to 20; existing Show more control exposes every remaining task. Web retains 80.
- Bottom-tab touches now carry a navigation epoch: a delayed release from before an intervening navigation is ignored. Same-screen navigation requests are ignored.
- Navigation diagnostics record source and previous/next screen. Shell mount/unmount events distinguish a component remount from an explicit tab/menu request. Diagnostics report version 0.5.11.
- App and service-worker versions updated. No dependencies added or changed; package manifests excluded from the source archive.

## Important limits
The exact cause of the Android Timeline bounce is **unconfirmed**. A single diagnostic run ID does not exclude a Shell remount. Stale-touch protection is a defensive fix, not proof that stale input caused the recording. Do not describe this release as a confirmed native crash fix.

This patch targets repeated drag renders; the Board still mounts all its cards on opening. Initial Board load performance, native gesture FPS and Timeline behavior need device validation. Physical Android/iOS and Expo Go tests: **Not run**. No APK/IPA, deployment, commit or push performed.

## Verification
See NP-QA-0.5.11.md and the attached evidence folder for actual results.

## Install / rollback
Export the current workspace backup, keep the previous source, then extract this project-root ZIP in ~/Niyarvo. It preserves package.json, package-lock.json and node_modules. No npm ci needed for this patch. Restart Metro using npx expo start -c; rebuild the APK through your usual workflow if testing an installed build. Roll back by restoring v0.5.10 source; do not clear app storage.

## Device acceptance
1. Repeatedly open Board → Timeline → Overview, including quick taps; capture diagnostics if it returns unexpectedly.
2. Hold and drag cards within/across columns, auto-scroll and cancel; verify final ordering and saved data.
3. Open Tasks, use Show more, filter and perform bulk actions.
4. Compare Board render averages/maxima with the supplied v0.5.10 report on the same workspace. No new device timing claims yet.

## UI review direction
Bundled Unslop by Damir Sokolovsky (CC BY 4.0), used as the existing review standard. Product: independent planning workspace. Character: calm, exact, dependable. World: technical workbench. Moments: Kanban and Gantt. Signature: existing accent/status colors. Spacing, colors, icons, copy, typography and layout retained; observed defects concern interaction delays and navigation. The native task batch size is the only visible loading behavior change.
