# Using Milvayo 0.7.1–0.7.9

The current source version is **0.7.9**. Existing projects, workspace preferences and backup/import formats stay compatible.

- Cold start: the selected theme-color Board logo plays once, holds its finished shape for one second, then opens your workspace. Navigation, theme changes and returning from the background do not replay it. Reduced motion shows the finished mark with the same hold.
- App icon: Settings shows the selected accent/appearance preview. Apply launcher icon is separate from theme selection and asks for confirmation; pending work is saved first. The new gradient launcher artwork needs a future installed app containing the updated resources. Metro can show the new preview before the installed launcher resources change.
- Back: use the Android system gesture/button, swipe from the left edge on iOS, or use browser Back/Forward. Close the top popup/tour first; then return through your screens. History stays within the current workspace/project and skips disabled tools.
- Timeline: open Timeline options. Days, Weeks and Months are in one row at the top; selecting any preset focuses Today. If a whole canvas fits on screen, it stays within its bounds. Pinch/zoom controls retain their focal behavior.
- Headers: screen-name text is removed beside the hamburger/back control. The headings inside screens and popup titles remain.
- List: create tasks with the bottom navigation plus. The duplicate Add task action is gone.
- Sprints: slide through the sprint selector row and use its plus-labelled New sprint control. It opens the existing creation form.
- Notifications: the island shows its full message for three seconds, shrinks, holds compact for three seconds, then dismisses. Tap compact to reopen it; reading the full message pauses dismissal. Explicit sticky work remains until acknowledged. Close and Backup actions remain available.

Keep app storage and signing files. Do not uninstall or clear data for testing. No build or Git publication was performed for this source update. Verification and remaining device checks: `docs/qa/release-079/ENGINEERING-REPORT.md`.
