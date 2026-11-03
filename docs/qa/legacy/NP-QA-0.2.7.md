# NP-QA-0.2.7 — Local runtime acceptance

**Target:** Expo Go Android + Expo Web (`npx expo start`, Metro + Fast Refresh). Test on the `work` branch. Preserve old project and workspace backups before opening the new app.

## Functional tests

1. Import a v0.2.5 project JSON. Check that existing tasks, dates, predecessors, release metadata, Kanban and Gantt positions are unchanged.
2. Create a second project, set its working calendar (Mon–Fri), then switch back. The other project must remain on its original calendar.
3. Open Timeline → Scheduling. Switch calendar days/workdays; disable Sat/Sun; add/remove one holiday and one extra working date. Verify invalid date feedback and prevention of empty workday selection.
4. Connect two tasks in Gantt, open Scheduling, set **SS with +2 days lag**. Reopen Scheduling and confirm the typed relationship survived navigation and app restart.
5. Edit the same edge to FF, SF, FS; use negative lag. Check that the UI shows stored type/lag after restart.
6. Link a successor and a predecessor whose dates conflict. Confirm Schedule health reports issues; do not auto-change task dates.
7. Move predecessor task later. Choose that task as the anchor in Scheduling → Preview successor dates. Review **all proposed shifts** and then apply. Confirm the anchor did not move again and successors moved only forward.
8. Change project or task dates after a preview. An old preview must be unusable; create a fresh one.
9. Apply a preview. Verify a recovery snapshot in Backups, undo via restore, then confirm dates and links are restored.
10. Verify a downstream task with evidence. Change its dependency type/lag: verification and merge flags must be cleared, Ready/Released gate becomes Testing.
11. Unlink an edge on Gantt, delete a predecessor task, and confirm no orphaned typed metadata appears in Scheduling or exported JSON.
12. Export project JSON and workspace JSON. Import them into a safe test workspace and verify calendars, typed links, tasks, and all project selections are preserved.
13. Test Gantt bar movement, resize, curved connectors and Kanban full-card drag for regressions.
14. On workday or SS/FF/SF schedules, verify the old FS-only Critical path shortcut cannot produce misleading results. Switch to calendar/FS0 to inspect existing estimate.
15. Repeat tests in Android portrait/landscape and Web desktop/mobile-width layouts. Confirm the scheduling modal is scrollable, options readable, and Android Back closes it.

## Failure handling

- Do not merge into `main` or deploy if task dates change without explicit approval, exports lose metadata, project switching affects a different calendar, or dependency validation can be bypassed.
- Record affected platform, action sequence, expected/actual behavior, and screenshot/Termux log. Keep the exported backup until recovery tests succeed.
- Firebase remains disconnected; no remote persistence or user accounts are being tested in this batch.
