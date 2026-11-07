# Canvas UX 2.1 / Milvayo 0.8.2 plan

Work in place on `work`, based on local checkpoint 0676538. Preserve unrelated handoff/ZIP changes; no commit/push until new approval. No dependencies, backend, schema migration or Metro changes. User reports the touch-history warning on Android Canvas.

Review standard: bundled Unslop by Damir Sokolovsky (@heydamir), CC BY 4.0, preserving Milvayo's existing visual language. Installed Impeccable/frontend-design, UI UX Pro Max, RN gesture/performance and motion skills apply. MemoryRelay selected Playwright-based testing; the explicit handoff prohibits Playwright, so use lightweight tests and headless screenshots only.

## Before audit: complete Canvas screen

1. Spacing: selected-object controls plus an always-visible swatch row create a 110-unit panel above the dock. Reduce context to one 56-unit strip and replace its contents with a palette only on demand.
2. Color: palette and neutral theme are sound. Preserve them and show swatches only during appearance/drawing work.
3. Icons: keep Feather; remove oversized separate history controls and repeated action entry points.
4. Copy: shorten routine menus; retain storage failures, missing-source explanations and private-sharing restriction.
5. Typography: keep existing system roles and 12/14/16 scale; keep accessible labels even for icon-only strips.
6. Layout: compose header/history, dominant workspace, one bottom dock and one selection-anchored strip. No large stacked selection/primary panels.
7. Details: direct Fit selection, compact secondary/selection palettes, efficient searchable inspectors and viewport-preserving editing.
8. Visuals: preserve dot grid and original diagrams; use actual scene bounds/root geometry for placement, never decoration.
9. Motion: native overlay position follows shared camera/drag values, Web uses direct DOM positioning. No per-frame React work; no animation added for tool switches.

## Five-line product direction

Product: a project-linked visual planning workspace.
Character: calm, exact, dependable.
World: planning instruments and quiet technical workbenches.
Moments: readable diagrams, connected work and direct editing.
Signature: the chosen accent and meaningful dependency/status colors.

## Unified states and patch boundaries

- Empty/unselected: one compact header and one 56–68-unit bottom dock; no floating history or selection controls.
- Selected: a single small icon strip above/below the visible selection when possible, otherwise above the dock. Direct Edit/Color or Source/Layout, Duplicate, Fit selection and advanced properties. Color replaces the strip contents with swatches rather than adding a permanent second row.
- Drawing: compact expandable brush/eraser/width/ink rail; no routine drawing sheet.
- Add: condensed grouped icon palette with project entry points, bounded to available height; no full-screen menu.
- Advanced: source, diagram, object/connection search, export and board configuration use content-aware inspectors. Secondary tools, view/appearance/arrangement/connector actions use compact popovers. Comments retain an appropriately sized composer.
- Native touch correction: RNGH 3.3 defaults to canceling the RN JS responder on recognizer activation; its installed Android helper sends a synthetic cancellation. Canvas contains no JS responder controls inside its native gesture surface. Keep RN's touch stream intact there with cancelsJSResponder=false on all Canvas recognizers, without changing Timeline or suppressing diagnostics. Test the config and multi-pointer/cancellation lifecycle; physical resolution of the reported warning remains unverified until user acceptance.
- Keep content/model, schema, live/snapshot references, revision checks, autosave/recovery, caching and exports. Test camera preservation on edit/add/inspector transitions, grouping, draw/erase, history, comments, clipboard and sources.

Run full npm test, JSX/import checks and Expo compatibility. Capture complete states at portrait/landscape/desktop in both themes as appropriate. No Expo Go, emulator, native build, graphical browser, Playwright/Selenium or heavy automation. Stop temporary processes. Record actual measurements and Not run native/Fast Refresh gates. Rollback: keep external board/workspace backups and reverse only this release's files; older pre-Canvas code discards Canvas data.
