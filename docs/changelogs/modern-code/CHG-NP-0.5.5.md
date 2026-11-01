# CHG-NP-0.5.5 — Entreprise PM hierarchy and responsive header and notification positioning hotfix

## Baseline and status
- Baseline: Niyarvo Projects `v0.5.4-MANAGEMENT-SPLIT-HOTFIX.zip`.
- Release: `0.5.5`, source-verified QA candidate; no device launch claimed.
- Canonical storage: `niyarvo-projects-v1` (unchanged); no data reset and no duplicate application.
- `package.json`, `package-lock.json`, `node_modules` excluded from ZIP by user preference.

## Implemented
- Fixed shared `Page` header layout on narrow devices: subtitle gets full width; actions occupy a distinct horizontal row. Addresses Timeline and Automations word-by-word text wrapping, and similar pages using the component.
- Embedded blue `PROJECTS` text begins under the first `o` on the right side of the Niyarvo SVG, away from the `y`; regenerated both theme PNGs.
- Replaced three independent drawer destinations with **Entreprise PM**, one entry containing inline Programs, Portfolios and Projects panels. Their source files remain separate (`Programs.js`, `Portfolios.js`, `Projects.js`).
- Established real Program → Portfolio → Project membership: `program.portfolioIds` references existing portfolios; `portfolio.projectIds` references existing projects. No tasks or projects copied.
- Preserved existing legacy direct `program.projectIds`; legacy direct members are visible in Programs and can be removed explicitly during edit, not silently dropped.
- Added deduplicated hierarchy summaries in `src/projectRelations.cjs`. Reject unknown portfolio IDs in program mutations; drop stale references during workspace normalization; unlink deleted portfolios from programs.
- `normalizeWorkspace`, local snapshots, whole-workspace backup/restore preserve the new membership field.
- Fixed Android 15 edge-to-edge island notice positioning: the mobile overlay now anchors to the content region after the app header rather than to the root window top. This prevents notices from drawing over the status bar/camera cutout even when the reported top inset is zero. Native Reanimated presentation and timed dismissal are preserved.
- Wide view notices use `useSafeAreaInsets()` with a minimum top offset.
- Updated diagnostics/app release version, README and regression contracts.

## Acceptance checks
- Source tests: 400/400 passed (`node --test tests/*.test.cjs`), including 8 hierarchy/responsive checks and 2 safe-notification placement checks.
- TypeScript JS/JSX parser: 116 parsed, 0 syntax diagnostics.
- ZIP integrity and dependency manifest exclusion: verified in build.
- Expo Go on Android/iOS and web: **Not run**.

## Limits / known risks
- Touch, scrolling, timeline dependency rendering and Board navigation performance were not changed in this batch. Notification vertical position must be confirmed visually on Expo Go on an Android 15 device. Real-device validation required.
- Program/portfolio nesting is a **reference hierarchy**; no automatic task/board duplication or cloud sync.
- In-app local storage uses existing AsyncStorage; retain a full-workspace backup before extraction/testing.
