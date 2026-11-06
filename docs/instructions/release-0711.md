# Milvayo 0.7.11

The completed startup/Projects/Board repair is recorded as 0.7.10. The current source is 0.7.11, Android versionCode 81 / iOS buildNumber 81. No dependencies or storage migration are required.

- **Board:** tap the plus on the left of the board names. Choose New board or New list; lists are created in the current board. Choose the list's status mapping before saving. Empty names cannot submit, and rejected changes retain the draft. Board tools → Board actions → Delete board asks for confirmation and moves its tasks to Main. Main cannot be deleted. Long-pressing a board name still opens the existing manager.
- **Tasks:** Activity & files and Planning & delivery are always available. Advanced tasks is removed from Manage tools. Existing stored preferences and task fields survive backups/imports.
- **Timeline:** use the Days / Weeks / Months pills in Timeline options. The duplicate header control is gone; Today focus and pinch/zoom behavior remain.
- **List:** use the header search and Tools. Saved views update the same search field. Due soon shows three task rows; scroll inside it to reveal additional upcoming tasks. Dates, task-opening and calendar-enabled board rules remain.
- **Sprints:** the selector row starts with an icon-only plus to create a sprint. Its accessible name is New sprint. Existing validation and sprint history remain.

Use the existing Termux/Metro session and Fast Refresh to verify these changes. No APK/build is needed for these JS controls. Do not uninstall or clear storage. Verify creation on two different boards; cancel and confirm deletion of a disposable board with tasks; import a backup with Advanced tasks off; apply a saved search; scroll at least seven due tasks; create a sprint; check Timeline presets, Today, pinch, cross-list dragging and resume from background.

Changes are applied in place on `work`, uncommitted. To reverse this update, keep an app backup and a copy/diff of the current local edits first, then restore the selected source checkpoint and matching package/lock/app metadata together. Do not blindly reset this working tree: it includes earlier performance repairs and owner file changes. No data conversion needs reversing. Validation and outstanding device acceptance: [engineering report](../qa/release-0711/ENGINEERING-REPORT.md).
