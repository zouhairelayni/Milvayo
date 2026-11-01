# CHG-NP-0.5.3 — Projects, Programs and cohesive navigation

## READ FIRST
- **Baseline:** v0.5.2 source; release type: QA candidate, not device-accepted.
- **Single-app architecture:** `ModernApp.js` remains the only application shell. Existing domain model and AsyncStorage key `niyarvo-projects-v1` are preserved.
- **Package manifests:** `package.json`, `package-lock.json` and `node_modules` EXCLUDED intentionally. Keep local dependency updates, especially `expo-font`.
- **New Expo dependency:** `expo-document-picker` is required for the native JSON import picker. Install from Termux with `npx expo install expo-document-picker`; `expo-file-system` and `expo-sharing` are used by existing import/export logic.

## Changes in this batch
1. Added **Projects** and **Programs** before **Portfolios** in the hamburger menu, each a real modern screen. Task configuration moved from Plan to Operate.
2. Project create, edit, duplicate, archive and confirmed delete are in Projects. Last-accessible-project guard and pre-delete workspace snapshot remain in place. Deleted project IDs are removed from Portfolio and Program memberships.
3. Programs are workspace-level, project-referencing groups with name, description, status and membership (no duplicate task storage). Legacy workspaces normalize to `programs: []`. Both JSON full-workspace backups and recovery snapshots include programs.
4. Settings no longer offers duplicate project administration or recovery operations. Backup owns project/workspace `.json` import/export, recovery snapshots and archived project recovery. Full-workspace restore always requires explicit confirmation and creates a safety snapshot.
5. Mobile header now displays the active screen title; duplicate oversized mobile page titles are suppressed. Drawer uses Niyarvo Projects combined SVG/PNG lockup with small embedded PROJECTS lettering. Bottom bar retains five top-level destinations. Native notification motion uses bounded spring animation and appears inside the app safe area.
6. Timeline Items control sits on the left above its associated chart/hidden item area. Heavy Timeline initial mount is delayed by two animation frames on native to reduce first-tap mount pressure; continuous scrolling and SVG data were not otherwise altered.
7. Orange is the default accent and the nine alternate accents remain optional.

## Source verification
- Node source suite: **385/385 passing** after changes, including Program persistence and navigation tests.
- JS/JSX parser: no errors (TypeScript parser-based scan).
- **Not run:** Expo Go Android/iOS runtime QA, native dependency installation and Metro bundling (container lacks the user's manifest/node_modules). Test the new import picker only *after* installing its dependency.

## Known limitations and acceptance risks
- The first-tap Timeline return to Overview has been mitigated by deferring the native heavy view, **not confirmed fixed** without device runs.
- Island-inspired notices are in-app UI, not system Dynamic Island Live Activities. Final safe-area/animation acceptance is device-dependent.
- Programs are local project groups; this release does not introduce cross-project scheduling, cloud collaboration or new automated workflows at the program level.
- App icons/brand assets are source-bundled. Existing installed native APK launcher icons may require a native rebuild to reflect new asset changes; Expo Go uses its own launcher icon.

## Delivery
- Full root-level source ZIP, no extra parent directory.
- `docs/changelogs/legacy-code/` for pre-migration records, `docs/changelogs/modern-code/` for the modern history. No root changelogs or duplicate nested source trees.
- Do not merge to main until device-level acceptance on Android.
