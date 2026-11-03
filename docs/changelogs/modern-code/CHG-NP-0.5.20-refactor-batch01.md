# CHG-NP-0.5.20 refactor batch 01 (no version bump)

Behavior-identical refactor of the two largest screens. No dependency, app.json, package.json or saved-data change.

## Moves
- `src/screens/Board.js` (797 -> 646 lines): `AddCard`, `NewListSheet`, `BoardsManager` (with `BoardNameEditor`) now live in `src/screens/BoardManagement.js`; the drag-context helpers `newCtx`, `slotFor` live in `src/boardDragContext.cjs`.
- `src/screens/Timeline.js` (778 -> 737 lines): `roundPath`, `distToPath` live in `src/timelineGeometry.cjs`.
- `refreshMax` was copied in both screens; it now lives once in `src/scrollLimits.cjs`.
- Function bodies were moved verbatim. Unused imports left behind by the move were removed from `Board.js` (`Pill`, `Segmented`, `Sheet`, `STATUS`).

## Tests
- New `tests/refactor-batch01-0521.test.cjs` (5 tests): path rounding, distance to path, scroll limits, drop slot, and that the screens use the new modules.
- `npm test` style run (`node --test tests/*.test.cjs`): 477 tests, 471 pass, 5 fail, 1 skipped. The 5 failures also fail on the untouched v0.5.20 zip: the `examples/` fixture folder (ATLAS-MOCK.project.json, atlasproject.json) is not in the zip.
- JSX syntax and undefined-name check on all changed files: Pass. Expo Go / web run: **Not run**.

## Reversible install
Copy the changed files over the project. To undo: delete the 4 new files and restore `Board.js` and `Timeline.js` from the v0.5.20 zip.
