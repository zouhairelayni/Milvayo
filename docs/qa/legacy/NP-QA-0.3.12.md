# Milvayo v0.3.12 — Android and Web QA

**Status: Not run on a physical device or browser in this environment.** The test suite covers domain invariants, not actual touch rendering.

1. Start with the accepted v0.3.11-HOTFIX2 state; **export workspace backup first**. After installing, open Atlas (73 tasks). Confirm Overview and sidebar still work on Android/Web.
2. Board: cards should be compact, independently sized by column, with the correct assignee initials and labels. Long titles must not overflow.
3. Press ellipsis on a card: a sheet should open. Press close; press outside through native Back; verify the card drawer has not unintentionally opened.
4. Press and hold the **card body**, drag across status lanes, then horizontally scroll by holding at the edge. The dropdown/action button must not disable dragging elsewhere.
5. Filters: choose an owner, priority, label, overdue, next 7 days. Confirm counts are accurate and clear restores all cards. Add a filter while some cards are off-screen, then drag within a lane and check order afterwards.
6. Duplicate a card. It should become **Backlog**, use a unique ID, and have no inherited test sign-off, merge SHA, linked GitHub references or sprint assignment. Original remains unchanged.
7. Select a task, add/remove labels; verify chips update on Kanban and refresh correctly after reopening.
8. Toggle Show card descriptions in Filters for Main board; create/choose another board and confirm its toggle is independent. Restart app, export JSON, reimport, confirm preference persists.
9. Move cards across boards via contextual action. Confirm their board membership and that sprint, verification, and workflow restrictions remain intact.
10. Enable/run any configured card automation button in actions. Confirm execution history; status-based moves should still invoke the existing rules.
11. Test Board Power-Ups / GitHub links, Sprints burndown, Timeline performance, JSON Import, Settings accent and Web-specific Niyarvo logo.
12. Run `npm test` and `npx expo install --check` locally. Do not merge until both Android and Web have passed the critical interaction checks.

**Known architectural limits:** Board lanes still reflect fixed workflow statuses, not arbitrary Kan lists. Multi-user membership, private GitHub auth, webhooks, external activity feeds and cloud file uploads are not yet implemented.
