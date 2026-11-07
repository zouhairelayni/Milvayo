# Milvayo 0.8.2 — phone acceptance

Canvas UX 2.1 is applied in place on `work`. Do not clear app data. There is no storage migration, dependency addition or Metro configuration change. Version files are synchronized to 0.8.2 (Android/iOS build 92). No 0.8.2 commit or push has been made.

Before updating or testing, keep a workspace backup and important Canvas board JSON backups outside the project. Preserve unrelated local files. In Termux use your normal `npx expo start` workflow and manually open Expo Go. Confirm the displayed version is 0.8.2. The agent did not launch Expo Go, builds or an emulator.

## Controls

- Top bar: Back, title, Undo/Redo, Fit all with current zoom, board overflow. Overflow contains board settings and export/backup.
- Bottom dock: Select, Add, Draw, Connect, More. Select/Draw/Connect switch directly. More contains multi-selection, Pan, Objects, Connections, view and comments.
- Selected object: a small strip follows it while panning, zooming or dragging. Edit/Source, Color/Layout, Duplicate, Fit selection and properties vary with type. Color replaces the strip with swatches until chosen or closed. Connect from the dock or drag a connection handle.
- Text: double-tap or choose Edit, type in place, tap outside to save. Keyboard Escape cancels on Web. Opening/editing/closing properties keeps the camera and selection.
- Add: choose a local object, independent diagram, project diagram or project source. New content appears in the visible workspace without moving the existing camera.
- Draw: Brush/Eraser, width and Ink appear in a compact rail. Width/Ink expand in that rail; choose a value or close. Undo restores an erased stroke.
- Fit selection is beside the object; More → Canvas view also contains Fit selection, Fit all, zoom and reset. Saved low zoom is restored exactly; use explicit Fit selection to make a chosen object readable.

## Required Android checks — Not run by the agent

Record Pass/Fail per step; retain the Metro warning and exact gesture sequence if one fails.

1. Open an empty and a populated board at portrait widths available on the phone. Confirm one dock, no floating history panel, no permanent color row. Select note, frame, stroke, connector and linked diagram; verify the matching actions and 48-unit targets.
2. Reproduce the reported touch warning: pinch with two fingers, add a third finger, remove fingers in different orders, repeat with quick taps. Test pan→pinch, draw→pinch, drag→pinch and lifting the final finger after pinch. Expect no touch-history warning, jump, unintended object movement or duplicate edit.
3. Interrupt a gesture using Android Back, app switching, keyboard/notification opening and screen rotation. Then select, pan, draw and pinch again. Capture a device screenshot during a gesture. Expect stable recovery and no warning/crash. The responder change is a candidate correction until this passes.
4. Drag/resize a note and a connected object: strip and dependency line stay attached. Change color, duplicate, connect two objects, change connector style/label and delete/undo. Test multi-select, grouping, lock/unlock, layer order and ungroup.
5. Double-tap note/text/diagram node. Type with the real IME, tap outside, undo/redo, close/reopen. Text must persist once; the camera must not jump. Test editing near the bottom edge and connector label popover with keyboard open.
6. Mix a large linked project diagram and small notes. Add all object and diagram types; use live and snapshot source selection. Insertion preserves pan/zoom; new root/content is visible. Canonical project records remain unchanged by Canvas editing. Fit all/selection work within the existing 5%–400% range.
7. Save a board at roughly 18–23% and an off-center position. Open/close every inspector and edit text; close/reopen the board and restart the app. Confirm exact camera restoration and intact data. Test offline save, backup/export/import and recovery using a disposable board.
8. Open long object/connection/source lists, search and scroll to late results; select a result. Verify no 100-object cutoff. Test comments, replies, resolve/reopen, clipboard copy/paste, SVG/PNG/JSON exports and native file-sharing feedback. Sharing/invites remain explicitly unavailable.
9. Rotate to landscape, open Add and More, and test both themes. Check safe-area spacing, Back dismissal, larger system text, TalkBack labels and focus. Watch for overlapping/clipped controls or inaccessible final actions.
10. Use Fast Refresh through the normal Termux workflow. Exercise Timeline pinch/move/duration/dependency behavior and the original startup tour. A separate 0.8.1 Web SVG/TourArtwork console error remains unclassified; report it if encountered.

Automated results and screenshot scope are in [the release report](../qa/release-082/REPORT.md). Static screenshots are composition evidence; they do not establish Android responsiveness, keyboard handling, file permissions, FPS or touch acceptance.

## Reversible update

Keep the external backups before testing. If reverting, reverse only files listed in [PATCH-FILES.txt](../qa/release-082/PATCH-FILES.txt), using checkpoint `0676538` for existing tracked files; remove only newly introduced files from that list. Preserve unrelated handoff/ZIP changes. Restore the three version files together. Do not reset the whole working tree, clear AsyncStorage or overwrite newer board data. Version 0.8.1 reads the same Canvas schema; pre-Canvas versions can discard Canvas fields on save.

After physical acceptance, the owner can authorize staging/committing/pushing this release to `work`. Do not merge to `main` before acceptance gates pass.
