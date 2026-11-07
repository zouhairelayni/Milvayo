# Milvayo 0.8.3 — Android acceptance and rollback

Applied in place on `work` over the uncommitted 0.8.2 work. Versions: 0.8.3; Android/iOS build 93. No new dependency, Metro change, credential or schema conversion. The owner has explicitly authorized a local 0.8.3 checkpoint; physical acceptance remains pending. No push is authorized.

Keep workspace and important board JSON backups outside the project before testing. Do not clear app data. Use the normal phone/Termux `npx expo start` workflow and manually open Expo Go; check the app version. Agent testing did not launch Expo Go, a graphical browser, emulator, APK, Gradle, EAS or heavy automation.

## Controls to check

- Dock: Select / Add / Draw / More. Tap Select again for multiple selection; selecting normally or dragging empty canvas needs no separate Pan tool. Drag an object's connection handle to draw a line.
- More is one Objects / View / Comments row. Objects is a searchable list; tap a row for Selection actions. Back beside Close returns one section, retaining camera/selection. Close dismisses the popover.
- View shows four SVG pan arrows directly in one row, with no drawer or visible labels. Fit all includes comment pins; explicit Fit/zoom/reset remain camera actions.
- Tap/double-tap a line for its pill. Style uses SVG buttons with small captions, label Save and a color palette. A new line gets a random palette color once. Delete is on the pill; confirm beside the line or cancel. Line settings have no duplicate Delete button.
- New/imported Tree diagrams use left-to-right, with no orientation selector. Choosing Tree reapplies that layout. Existing saved downward orientations remain loadable; canonical WBS settings are unchanged.
- A Timeline source becomes an SVG roadmap with phase summaries and dated milestone diamonds. Milestones must be flagged/dates supplied in the project. Live links follow later changes; snapshots retain captured data.
- Comments can attach to a selected object or a chosen world position via Comments → Place on canvas. Colored dots identify threads. Tap/double-tap a dot to read/reply; zooming through 125% reveals the nearest visible thread. Object-attached dots and bubbles move with that object. Panning/zooming outside a chat bubble remains available. Close dismisses it.

## Physical tests — Not run by the agent

Record Pass/Fail and the exact sequence for any failure.

1. Fully reload after the Reanimated dependency warning fix; its native camera reaction now omits the web-only dependency argument. Confirm Metro emits no new instance of that warning. Drag note, shape, card, frame, independent/linked diagram and grouped content at 18%, 40%, 100% and above. Lift, immediately tap/drag again, undo once, redo, close/reopen and restart. No backward flash, doubled offset, teleport or stale restoration.
2. Build representative 25/100/250/500-object boards with connections, groups and a complex linked SVG. Exercise selection, drag/resize, pan/pinch, line creation, history, saving and reopening. Native 250/500-object usability and 60 FPS are **not established** by the host results.
3. Reproduce the earlier Android touch warning using two fingers, add a third, lift in different orders, transition pan/drag/draw to pinch, interrupt with Back/app switching/notifications, then continue. No accidental move, duplicate operation or touch-history warning. Keep any Metro log and gesture sequence.
4. Move/resize groups and connected objects. Lines and dots stay attached; S-curve stays cubic, selected color remains. Test crossing, reverse/short/vertical lines, negative positions, group resize, reload and SVG export. S-curves/straight lines intentionally do not route around unrelated objects; Elbow retains obstacle routing.
5. Edit text with Android IME at several zooms and near screen edges. Type rapidly, select text, dismiss/reopen keyboard, save/cancel, drag afterward and edit inside a group. Positions/camera stay stable; drafts must not overwrite newer text.
6. Test multi-select from Select, group/ungroup, align, layer, locked children, resize, duplicate, clipboard and history. New nested grouping is rejected. Existing legacy groups remain loadable. Check failures leave data intact.
7. Test all three More entries and nested Back/Close, short/long/search-empty lists, sources, landscape filters and keyboard. Pan arrows remain one SVG-only row. Verify direct object actions, no Connections/Pan/multi-select duplicates and no dimming Canvas sheets.
8. Create multiple differently colored comment dots, including free pins and object-attached threads. Pan/zoom/drag their objects, tap/double-tap, zoom above/below 125%, reply, resolve/reopen, undo and restart. Test IME, larger text and TalkBack through both the bubbles and aggregate Comments view.
9. Change line colors, delete/cancel beside a line, double-tap confirm rapidly, undo and reopen. Import/export JSON and verify colors. Test SVG/PNG quality/background, native sharing feedback, export cancellation and unavailable sharing/invites.
10. Add left-to-right Tree/WBS/task diagrams and a roadmap with real milestones. Verify dimensions/root placement, live updates, frozen snapshots, phase/milestone scopes and readable exported SVG. No canonical project records change when arranging Canvas content.
11. Test portrait, landscape, light/dark, safe areas and Fast Refresh through Termux. Check Timeline duration/move/dependency behavior, frozen sprint history and the original startup tour. An older unclassified Web SVG/TourArtwork startup error remains open; this release did not clear it through live testing.

See [root causes, measurements and gates](../qa/release-083/REPORT.md), [controls](../qa/release-083/CONTROLS.md) and [screenshots](../qa/release-083/gallery.html). Static source projections do not establish device acceptance. SVG/PNG retain object/line/diagram exports; complete comment threads are preserved in JSON/workspace backups.

## Reversible update

Keep the external backups. `docs/qa/release-083/PATCH-FILES.txt` lists 0.8.3 changes against this session's pre-edit 0.8.2 files; the temporary original source snapshot is `/tmp/milvayo-083-before` for this environment only. Restore only those changed files if rolling back during this session, and remove only the new 0.8.3 files in that manifest. Restore package/lock/app versions together. Preserve the uncommitted 0.8.2 prerequisites and unrelated handoff/ZIP changes; do not reset the whole tree to HEAD.

Boards remain schema version 1. Earlier versions can drop optional connector colors when they save; keep the 0.8.3 JSON backup before downgrading. Pre-Canvas versions can discard Canvas fields. Do not uninstall, clear AsyncStorage or overwrite newer data to reverse source changes. The 160 ms coalescing window is flushed on explicit save, navigation and backgrounding; a forced process kill can still interrupt an uncompleted save.

The owner explicitly authorized committing this complete release, including its 0.8.2 prerequisites, locally to `work`. Physical acceptance gates remain open. Push and merge to `main` still require separate authorization and the applicable acceptance gates.
