# 0.7.10 → 0.7.11 interaction cleanup

Main source on `work`. Record completed performance repair as 0.7.10 (Android/iOS 80), then current interaction work as 0.7.11 (81). No builds, prebuild, Playwright, commits, pushes or dependencies. Preserve existing uncommitted repair and owner ZIP changes.

Before audit — spacing: preserve existing spacing/touch sizes; move creation icons to the left of their selector rows. Color: retain all semantic palette roles. Icons: existing Feather plus/trash, with accessible names for icon-only controls. Copy: one Board/List creation sheet; explicit board-deletion consequence; Due soon header with scroll hint. Typography: preserve scalable labels. Layout: remove duplicate Timeline/List controls and vertical Add list; bound Due soon to three rows, scroll to more. Details: keep failed drafts and destructive confirmation in the popup; protect Main and move deleted-board tasks to Main. Visuals: retain charts/artwork. Motion: reuse sheets/press feedback, preserve Timeline/Board gesture engines.

Product: a project workspace with one clear place for each action.
Character: calm, exact, dependable.
World: quiet planning instruments.
Moments: Board movement and readable upcoming work.
Signature: the Board mark and user-selected accent.

Apply bundled Unslop by Damir Sokolovsky (CC BY 4.0), Impeccable polish, Ponytail and React Native best practices. No new visual direction. Legacy advancedTasks values remain import-compatible but no longer gate Planning & delivery or appear in Manage tools.

Implementation: preserve model invariants first; reuse existing add/delete store actions. Wire board/list creation and confirmed deletion; retire the optional UI gate; remove duplicate controls while keeping header search/saved-view synchronization; implement three-row nested scrolling; move the icon-only sprint action. Verify success/failure, Main protection/task relocation/import round-trip, legacy false flags, header controls, scroll-demand behavior and release metadata. Run full tests, JSX/worklet checks and Expo dependency check; device acceptance is Not run.
