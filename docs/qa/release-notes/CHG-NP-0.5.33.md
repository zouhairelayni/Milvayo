# CHG-NP-0.5.33 — Selective compact-design merge, desktop preserved

Date: 2026-11-03. Product: **Niyarvo Projects** (not RIVNA or Niyarvo Control Center).

## Read first / release type

This is a **guarded source overlay** for an already installed **Niyarvo Projects v0.5.31 Desktop HF2** checkout, not a stand-alone full-source ZIP. The exact 0.5.31/HF1 application archive was available only as Library metadata/docs, not as readable source bytes in the execution environment. Replacing the customer's installed files with 0.5.30 or Sonnet 0.5.32 would undo unknown v0.5.31 improvements. Instead, this update transforms four existing UI files **in place** after checking the retained desktop implementation.

The patch makes no assumptions about the user's local `package.json`, `package-lock.json` or `app.json`: the accompanying version script safely sets all three to 0.5.33 (including `package-lock.json` `packages[''].version`). No npm install or dependency change is needed.

## Baselines and merge decisions

- Keep the current ash-gray theme, palette and accent preferences. **No theme file touched.**
- Keep v0.5.31 Desktop HF1 + Portrait HF2: Web desktop on portrait (`390px`) and landscape (`768px`), native portrait stays mobile. The installer checks `layoutMode.cjs`, `ModernApp.js` LayoutProvider and the direct Store->uiBase import before editing. **No shell or navigation file touched.**
- Keep all project state, schema, storage keys, board gestures, timeline engine, dependencies, and app permissions. **No domain/gesture/engine files touched.**
- Selectively adopt Sonnet 0.5.32 UI improvements, adapting them to the existing desktop shell rather than copying Sonnet's 720px phone breakpoint.

## Actual transformation

1. `src/screens/tasks/Tasks.js`: adds compact desktop column header Task/Owner/Due/Status/Priority when the **physical viewport** is at least 1080 CSS/logical px; narrower portrait Desktop Web uses the compact task-row representation instead of overflowing the viewport. Aligns status/priority columns where the known row pattern is found. Reduces task-row vertical padding by two points when the original anchor exists. Does not change filters, sorting, selection, grouping or task mutations.
2. `src/screens/overview/Overview.js`: where the known nested interactive Release readiness Card is present, makes the card noninteractive and provides separate **Open releases** and **Open testing** buttons, preserving both navigation routes and fixing an invalid Web interaction hierarchy.
3. `src/screens/board/Board.js`: where the known v0.5.30/v0.5.31-style anchors exist, reduces column padding/gap, adds a small count pill and preserves **all drag engine/width logic**. If a newer 0.5.31 custom board already differs, it leaves that layout alone.
4. `src/screens/timeline/Timeline.js`: where the known tick/grid anchors exist, adds subtle weekend shading only for viewport-visible columns in Days zoom. Weekends have `pointerEvents="none"` and the number of nodes is bounded by visible width; otherwise the existing Gantt is untouched. No month-band rewrite, all dependency/gesture routes preserved.
5. `scripts/apply-np-v0.5.33.cjs`: guarded, repeatable source merge. Precomputes all changes and checks critical anchors before writing. `--dry-run` previews changes. Repeated application is a no-op.
6. `scripts/set-np-version-0533.cjs`: idempotent manifest version sync; no package resolution or npm scripts executed.
7. `tests/ui/selective-merge-0533.test.cjs`: asserts portrait Desktop Web, native separation, bounded table columns, release links, cycle-free Store import and (if added) viewport-bound weekend lines.

## Deliberately NOT transferred from Sonnet 0.5.32

- Phone-breakpoint shell, palette and topbar; these would undo approved desktop/portrait mode.
- Sonnet's `uiBase.js`, `uiControls.js`, dependency import changes or `@noble/hashes` guesses. The reported noble warning is from third-party dependency resolution and cannot be attributed from the source ZIP.
- Flexible Kanban column *width* math, because current Android drag / auto-scroll has not been rebenchmarked on hardware. Compact list **spacing** only.
- Full Gantt month-band markup and task-sheet replacement, which could conflict with v0.5.31's verified interval labels and sheet geometry. Weekend shading is optional, noninteractive and viewport-bounded.
- Sonnet's nested interactive release Card, which produced invalid Web controls.

## Tests actually run (synthetic HF2-shaped source)

- `node scripts/apply-np-v0.5.33.cjs --dry-run`: PASS, zero files modified.
- Apply once: PASS, 4 modified source files on the synthetic v0.5.30-based fixture; apply twice: PASS, zero additional changes.
- `node --test tests/ui/selective-merge-0533.test.cjs`: PASS, 5/5 checks.
- `node tests/run-all.cjs`: PASS **574 / 575 (574 pass, 1 skip, 0 fail)** with temporary local Expo manifest stubs.
- TypeScript source syntax parsing across 123 JS/JSX/CJS sources: PASS, zero parse errors.
- `node scripts/set-np-version-0533.cjs` twice on temporary manifest + lockfile stubs: PASS, all four version values (package, lock top, lock root, app) were 0.5.33.

**Not verified:** these checks use the known 0.5.30 source with synthetic HF2 layout/provider signatures and temporary manifest placeholders, not the exact unavailable v0.5.31/HF2 code. The merge script may refuse the owner's newer file layout. No physical Android/iOS, Web Metro, browser screenshot, drag gesture, FPS, first-open Timeline bounce, cold-start bundle, real npm dependency or production-release validation is claimed. A successful install on the user's actual checkout requires local test/acceptance before committing.

## Installation in Termux

```sh
cd ~/NiyarvoProjects
git switch work
git status --short
unzip -o ~/storage/downloads/NiyarvoProjects-v0.5.33-MERGE-OVERLAY.zip
node scripts/apply-np-v0.5.33.cjs --dry-run
node scripts/apply-np-v0.5.33.cjs
node scripts/set-np-version-0533.cjs
node --test tests/ui/selective-merge-0533.test.cjs
npm test
npx expo start --clear
```

Before extraction, export a workspace backup and keep a Git/source checkpoint. The merge itself does not delete or migrate app data. If the guarded script **refuses** your layout, do not run Sonnet's ZIP or force copy its files over the desktop installation: share the error and current source files. If Metro/visual QA fails, restore the previous Git commit; do not clear storage.

## Device/Web acceptance before commit

- 360/390/430px portrait Web: desktop compact rail and toolbar, Tasks rows fit, open/close task sheet, navigate screens.
- 768px landscape Web: desktop rail, Board and Timeline remain interactable; no overlapping buttons.
- 1440px desktop Web: task table header and columns align; check Overview release controls.
- Native Android portrait: mobile navigation preserved, no navigation bounce, drag Board columns and Timeline bar/resize/dependency.
- Test saved project/workspace persistence on refresh/restart. Verify light/dark and custom accent remain unchanged.
- No Web console nested Pressable errors, new require cycles or new JS exceptions.

## Git status

No user repository changes, commits, pushes, deployments, package installs, APK or IPA builds were performed in this environment. The owner is responsible for applying, validating and committing the overlay on `work`.
