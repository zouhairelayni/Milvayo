# Final test checklist: 0.8.28 to 0.8.39 (phone + web, two DIFFERENT accounts)

Everything below is Planner-tested only (fake server) until you see it on two real devices. Write Pass / Fail / Unclear and what you saw next to each line. Use test tasks you do not need.

## Before you start
- Install 0.8.39 on both. Close old emulators first (`pkill -f firebase; pkill -f java`).
- Run `node scripts/qa-evidence.cjs` (tests; send the zip it prints). Cloud should be above 396 passed, 0 failed; app 0 failed.
- Sign in account A on the phone, account B on the web, same workspace.

## Speed and counters (0.8.31 to 0.8.33)
1. A renames a task. Sync status "Last send" says "just now" within about 3 s (0.8.32). Time until B sees it: write the seconds (good: under 10 s; worst about 65 s) (0.8.33).
2. Do 1 three times, B to A too. If one is slow, copy the "Safety checks…" and "Mode" lines from Sync status.
3. Cloud screen reads "N in the queue · M need review" and settles to "0 …" when idle (0.8.31). Wording is new: it no longer says "0 waiting" only.

## Conflicts (0.8.29, 0.8.30, 0.8.31, 0.8.36)
4. A and B change the SAME task title, both Save. One side shows a banner "needs your review" with "Review" (0.8.31).
5. Now B changes a DIFFERENT task. A must still receive it within about a minute while the conflict waits (0.8.36). A's other edits also still go out (0.8.29).
6. A resolves with "Keep cloud version". Both show the same title and "0 need review".
7. A edits task X offline while B deletes X. After reconnecting A sees a conflict with one button "Keep cloud version (drop my edit)". Press it: X is gone on both (0.8.30). Bringing it back is now a separate step: see CHECKLIST-0.8.40.md.

## Canvas (0.8.34, 0.8.36)
8. Both open the same Canvas. B adds a note: A sees it without reopening. B moves it: A sees the new place (0.8.34).
9. A and B each add or move different notes at the same time: no "needs review" for the board, all notes on both (0.8.36). A "Canvas changed; reopen it" message should be rare: note what you did before it.

## Not shared yet (0.8.35)
10. A renames a Canvas board. It shows on A only; the Cloud screen says "1 not shared yet" with a quiet note (no red banner, no conflict). Other edits still go. Expected: the cloud cannot take board renames yet.

## Compare (0.8.28, 0.8.36)
11. After steps 1 to 10, run "Compare with cloud" on both. Both say same records, also after you delete a task and after you reorder tasks (0.8.36). If DIFFERENT, copy the text.

## Presence (0.8.37)
12. Both open the same task: each shows "1 other member(s) viewing". B edits the description: A shows "Another member is currently editing". B closes it: A's line goes within about 30 s. B loses connection: the line goes within a few minutes (up to 5).

## Reload (0.8.38)
13. On the web make an edit, wait for "0", reload the page. You are signed out; the sign-in screen says nothing is lost. Sign in: the edit is there.

## Storage warning (0.8.39)
14. In the emulator log there is no more "Null value error" for `storage.rules`. The new storage test passed in step "Before you start".

## Send back
The evidence zip, both devices' Diagnostics text and Compare results, and this page with Pass/Fail.
