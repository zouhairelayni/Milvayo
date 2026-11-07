# Canvas 0.8.0 — use, validation and rollback

Changes are applied in place on branch work. The owner authorized the 0.8.0 commit and push to origin/work. Use the existing Termux/Fast Refresh session; the agent has not started Expo or run any build. No new dependency is required.

Open More → Project tools → Canvas. The library keeps the app navigation and supports create, search, preview, duplicate, archive and restore. Archived deletion requires confirmation and a retained recovery snapshot. Open a board to hide mobile bottom navigation; the header contains only back, its centered Canvas title and the existing zoom/fit control.

Expand the bottom pill for Add, Mode, Edit and Tools. Its material becomes faint after 1.8 seconds of inactivity and wakes on interaction. Add offers project diagrams/sources and independent notes, cards, shapes, frames and diagrams. Mode offers Select, Pan, Connect and drawing tools. Draw offers brush widths and colors; Eraser removes touched drawing strokes, with Undo available. It preserves locked strokes and other elements.

Select an element to expose four connection dots and its resize corner. Drag any dot onto another element; release in empty space to cancel. Connections automatically choose clear faces and avoid intervening element bounds. Double-tap/click a line to edit its label/style or delete it. Tools → Connections is an alternative. Undo restores deletion.

Double-tap a local note/text element or a node in a local diagram. The viewport focuses it and text editing happens inside that element, without a popup. Tap outside to save; a diagram node also supports submit. Escape cancels on a hardware keyboard. Edit → Diagram layout and branches provides layout and branch actions. Switching Tree/Fishbone/Mind Map resizes the outline to the content. Linked project diagrams are read-only representations; use their explicit canonical source action to change project data.

Project diagram uses real tasks and parent/subtask links. WBS is separate and uses Project Artifacts → WBS. Choose Live link for automatic source refresh or Snapshot to freeze content. Cross-project live imports are rejected; cross-project snapshots retain their origin and cannot open an unrelated local source. Task diagrams support 499 tasks plus their synthetic root; oversized diagrams fail explicitly. Existing WBS supports 500 work elements plus its root. Canvas movement does not change canonical dates, hierarchy, risk scores or verification.

Tools → Export and backup offers full-bounds SVG/PNG, board JSON and CSV where structured project rows exist. Board JSON is compact to stay within its own import limit. Keep a workspace backup as well. Notes and freehand marks are not invented CSV task rows. Boards are local/private; remote invitations and Viewer/Editor sharing are disabled until Milvayo has its own authenticated backend.

## Owner acceptance when available

1. Create a board, add a note, double-tap it, type within the note and tap outside. Reopen and confirm text and viewport. Confirm the library navigation returns on close.
2. Create Tree/Fishbone/Mind Map; edit a node in place, add/remove a branch and switch layouts. Check the outline fits each scene. Insert a real project task diagram and a separate WBS diagram.
3. Connect left/right/top/bottom neighbors. Place another element between them, move/resize it and confirm rerouting. Test empty drops, cancelled gestures, labels, double-edit, delete and undo.
4. Draw thin/thick colored strokes, use Eraser, undo and reopen. Confirm locked strokes and notes are untouched. Pan/pinch quickly, rotate and return; check gesture handoff.
5. Review portrait/landscape, 320-width Web, desktop Web, light/dark/AMOLED, large text and reduced motion. Test the keyboard and screen-reader menu alternatives.
6. Insert live sources, change the canonical source and compare with a frozen snapshot. Remove a source and confirm safe unavailability. Verify another project cannot receive live links accidentally.
7. Reply/resolve comments; duplicate a group; export/import a drawing-heavy board and the full workspace. Test save retry with transient storage failure without creating duplicate objects.
8. Export complete PNG/SVG and confirm all offscreen content and feedback. Revisit Overview, Board, Timeline, Tasks, Sprints, WBS and Canvas repeatedly. Use bounded diagnostics to record device navigation/mount and frame intervals without interpreting JS timers as native FPS.

The owner already confirmed the earlier export crash, squeezed Tree at 100%, and connector-drag repair. The final extended routing, editing, drawing and navigation refinements still need physical acceptance. The owner subsequently authorized a Git checkpoint on work. Remaining device acceptance and the sharing-defer decision still apply before deployment or a final release.

## Reversible update

Export current workspace and board backups before changing code. Preserve the 0.8.0 checkpoint and any remaining local files before rollback. The 0.7.13 and 0.7.14 checkpoints are 6bd035d and 1e8a972 on work. Returning to older code can discard Canvas fields on save and can truncate the edge-case WBS with a synthesized extra root. Return to matching 0.8.0 code before restoring these backups. No storage reset, automatic migration, ZIP delivery, merge or force-push is needed.
