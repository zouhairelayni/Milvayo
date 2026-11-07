# Milvayo 0.8.1 — Canvas UX 2.0

Changes are already applied in the main project folder on Git `work`. There is no installer or ZIP, no dependency addition and no data-schema migration. Package, lockfile and Expo versions are 0.8.1; Android/iOS identifiers are 91. The owner subsequently authorized a local 0.8.1 checkpoint on `work`. No push, merge or deployment is included; physical-device gates remain Not run.

## Use Canvas

Open **More → Project tools → Canvas**, then open or create a board.

- The floating dock always exposes Select, Add, Draw, Connect and More. Undo/Redo sit at the upper right of the workspace. The header has zoom/view controls and one-tap Fit.
- Add → Note inserts a sticky note in two taps. Text, Shape, Card, Frame and independent Tree/Fishbone/Mind map are in the same anchored menu. Project diagrams and searchable project sources remain explicit choices.
- Tap an object to select it. Drag it to move; drag its corner handle to resize. Double-tap text or a local diagram node to edit. Tap outside the editor to save once. Escape cancels on Web; Undo restores saved text on touch devices.
- The selected-object toolbar adapts: Edit for local content, Source for project links, Layout for diagrams and Width for strokes. Notes/text/cards/strokes show actual color swatches; tap once to apply. Use Duplicate or Connect directly.
- More → Select multiple lets taps add/remove objects. Done selecting returns to normal dragging. Group/Delete appear for multiple selections; arrangement, copy/paste and alignment remain in selection actions.
- A group is a frame. Select it → More → Arrange and resize → Ungroup to release its children. The frame itself remains. Locked members must be unlocked first.
- Draw switches immediately. Brush options configures width, ink and eraser; erasing is undoable.
- New large diagrams focus their actual root at a readable scale. Fit shows the overall arrangement within the existing zoom range; viewport controls also provide Fit selection, Zoom in/out, Reset and pan buttons. Explicit close/source navigation saves the current viewport. Very widely separated content can exceed the existing minimum 5% zoom; pan to inspect it rather than treating fit as legibility.
- Project sources support All, Tasks, Artifacts and Roadmaps filters, with search and Live link/Snapshot selection. Large task results are virtualized rather than cut off after fifty.
- Comments, connector labels/styles/deletion, board rename, full SVG/PNG/structured CSV export and board backup remain under More. Sharing is unavailable until an authenticated Milvayo backend exists.

Web keyboard shortcuts outside text fields: V Select, H Pan, D Draw, C Connect, A Add; 0 Fit; Ctrl/Cmd-Z Undo and Shift-Z Redo; Ctrl/Cmd-C/V/D Copy/Paste/Duplicate; Delete removes the selection/active connector; arrows move selected objects; Escape cancels inline editing and clears selection.

## Phone acceptance checklist

Before testing, export a workspace backup and important individual Canvas backups. Keep the app installed and its data intact.

1. In Termux, use the existing Milvayo folder and verify `git branch --show-current` is `work`. Run `npm test` and `npx expo install --check`. No package install is required for this release.
2. Start Metro with the project's existing `npx expo start` workflow. Open it in Expo Go on the phone using your normal connection. Verify Fast Refresh by changing/reverting a harmless label; do not reset app storage.
3. Test portrait 360/390-width layouts, landscape and increased system font size. Confirm dock/context controls stay reachable, Android safe areas are respected, Back dismisses Add/inspectors before leaving the board, and TalkBack names/selects controls correctly.
4. Add and edit each local object, then duplicate, color, move, resize, multi-select, group/ungroup, lock/unlock and reorder layers. Test drag reversals and cancellation, including groups with locked members. Undo/Redo each mutation; close/reopen and restart the app to check saved content.
5. Draw with multiple brush widths/colors, erase, Undo, then pan/pinch. Connect through all four handles and Connect mode; drag/resize objects while verifying lines stay attached. Edit connector labels/styles and delete/Undo.
6. Insert live and snapshot tasks, WBS and roadmaps; change a source and verify only live links update. Test all diagram types/directions, including a large top-down Tree, and confirm root framing, Fit selection, Fit all, Reset, rotation and reopening.
7. Check more than fifty source matches and all filters. Test a removed source and imported foreign snapshot; source navigation must remain unavailable when it would target unrelated data.
8. Save/reply/resolve/reopen comments; rename/archive/restore/duplicate a board. Copy a project containing a board and re-import an existing project's backup: imported/copy boards must open, live links follow the copied project, snapshots retain their frozen origin.
9. Export SVG/PNG/CSV and board/workspace backups with the real Android share sheet; reopen the backups. Verify failure/retry behavior without clearing storage. Sharing invitations must remain disabled.
10. Smoke-test Overview, Board, Timeline, Tasks, Sprints, Projects/WBS, Programs, Portfolios, artifacts and Settings. Preserve N-to-Board startup, stable Timeline pinch and sprint history. Record actual responsiveness and local diagnostic reports; host benchmark milliseconds do not validate Android FPS.

The owner explicitly authorized the local 0.8.1 commit after the implementation handoff. That checkpoint does not replace device acceptance. Further pushes/merges require their own authorization; `main` remains untouched.

## Reversible update / rollback

This is an in-place update. Keep workspace/board exports outside the project folder, and keep a private copy of the working tree, including untracked files, before any rollback. Existing unrelated handoff/ZIP changes must be preserved.

To undo this release, inspect the changed-file inventory in `docs/qa/release-081/PATCH-FILES.txt`, compare each file with the prior `work` checkpoint, and reverse only this release's changes. Do not run a blanket reset or clean. Recheck all three version manifests together. Re-run the tests and reopen a backup in the restored source before making new edits.

0.8.1 retains the 0.8.0 Canvas format; new edits are ordinary normalized content. Older pre-Canvas versions discard Canvas fields on save, so do not use those versions with your only copy of current data. Project templates continue to reset sprint/release execution state; snapshot historical Canvas links before templating when you need to retain that history.
