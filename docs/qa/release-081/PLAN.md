# Canvas UX 2.0 implementation plan

Scope: More → Project tools → Canvas library/editor, then Canvas functional/performance and global application audits. Work in place on `work`; preserve existing user changes. No commit/push/build, Expo Go, graphical browser, Playwright or Selenium.

## Before audit

Review standard: bundled Unslop by Damir Sokolovsky (@heydamir), CC BY 4.0; existing Milvayo identity takes precedence.

1. Spacing: compact Sheets still repeat 20-unit gaps; short mode/color menus interrupt the board. Use 4/8/12-unit groups and 48-unit targets.
2. Color: existing theme tokens and semantic palette are sound; color choices lack visible previews. Preserve palette, add actual swatches.
3. Icons: Feather is consistent; retain it, give creation/source types distinct icons.
4. Copy: Mode/Tools obscure common actions; name Select/Draw/Connect directly. Preserve failure/recovery language.
5. Typography: preserve system font and 12/14-unit control roles. Avoid reducing targets to fit labels.
6. Layout: collapsed pill hides the tools; Add opens an inspector immediately. Replace common flows with a persistent floating dock, contextual actions and an anchored Add menu.
7. Details: undo/redo and fit need direct access; multi-select needs a surface mode. Preserve accessible alternatives and advanced inspectors.
8. Visuals: keep dotted workspace, original diagrams, Board identity and quiet chrome. No decorative assets.
9. Motion: preserve UI-thread gesture transforms and reduced-motion behavior; remove idle toolbar timers/decorative fading.

## Five-line direction

Product: a visual planning workspace connected to independent project data.
Character: calm, exact, dependable.
World: planning instruments and quiet technical workbenches.
Moments: diagrams, linked work and direct object editing.
Signature: one selected accent with meaningful dependency/status colors.

## Controlled patches

- Pure tool/selection/framing rules before UI, with deterministic tests.
- Persistent dock, contextual controls, compact visual swatches and grouped Add popover; adaptive advanced inspectors.
- Virtualize/search/filter project sources without truncating access or changing live/snapshot semantics.
- Preserve schema, Metro, Timeline gestures, startup mark, exports, revision checks and recovery. Fix demonstrated audit defects with regression coverage.
- Audit every Canvas control and each application screen group; measure host-only operations with clear limits.
- Run full tests, JSX parse and Expo compatibility check. Capture actual JSX projections with headless Chromium at requested sizes, and attempt live Web Metro validation. Physical Android gestures/FPS remain Not run.

No schema migration or dependency additions planned. Versions will remain synchronized. Before rollback export workspace and Canvas backups; restore only this patch's files, retaining unrelated changes and existing data. Older pre-Canvas versions drop Canvas fields on save.
