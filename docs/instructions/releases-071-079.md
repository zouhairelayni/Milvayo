# Using Milvayo 0.7.1–0.7.9

This guide records the **0.7.1–0.7.9** checkpoint. Current source is **0.7.11**; the subsequent performance repair is designated 0.7.10. See `release-0711.md` for the latest controls. Existing projects, workspace preferences and backup/import formats stay compatible.

- Cold start: the selected theme-color N-to-Board logo plays once. The subsequent performance repair uses 1.1-second playback and one final rendered frame, with no extra one-second hold. Workspace preparation runs concurrently. Navigation, theme changes and returning from the background do not replay it. Reduced motion shows the finished mark without a timed hold.
- App icon: Settings shows the selected accent/appearance preview. Apply launcher icon is separate from theme selection and asks for confirmation; pending work is saved first. The new gradient launcher artwork needs a future installed app containing the updated resources. Metro can show the new preview before the installed launcher resources change.
- Back: use the Android system gesture/button, swipe from the left edge on iOS, or use browser Back/Forward. Close the top popup/tour first; then return through your screens. History stays within the current workspace/project and skips disabled tools.
- Timeline: open Timeline options. Days, Weeks and Months are in one row at the top; selecting any preset focuses Today. If a whole canvas fits on screen, it stays within its bounds. Pinch/zoom controls retain their focal behavior.
- Headers: screen-name text is removed beside the hamburger/back control. The headings inside screens and popup titles remain.
- List: create tasks with the bottom navigation plus. The duplicate Add task action is gone.
- Sprints: slide through the sprint selector row and use its New sprint control (now an icon-only plus on the left in 0.7.11). It opens the existing creation form.
- Notifications: the island shows its full message for three seconds, shrinks, holds compact for three seconds, then dismisses. Tap compact to reopen it; reading the full message pauses dismissal. Explicit sticky work remains until acknowledged. Close and Backup actions remain available.

Keep app storage and signing files. Do not uninstall or clear data for testing. The original 0.7.9 checkpoint is published; this subsequent performance repair is uncommitted and introduces no agent build or Git publication. Current verification/device instructions: `docs/qa/startup-repair/ENGINEERING-REPORT.md` and `docs/instructions/startup-performance-repair.md`.
