# Milvayo v0.2.8 — Android / Web QA

**Precondition:** Export current workspace JSON and keep `main` at previously accepted v0.1.0. Check `git status` on `work` before extracting the ZIP. Use `npx expo start` in Termux.

| # | Runtime scenario | Acceptance evidence |
|---|---|---|
| 01 | Load saved workspace from v0.2.7 | All existing projects, tasks, Gantt dates, typed links and calendars remain intact |
| 02 | Open Tasks in portrait | Filter controls usable without clipping; task rows readable; no horizontal page overflow |
| 03 | Search + filter status/priority | Results match query and selected facets; selection resets when filters change |
| 04 | Create a subtask under a task | New task opens; parent appears in editor and Tasks list |
| 05 | Assign/remove a parent; try invalid cycles | Valid changes persist after restart; self/cycle or missing parent rejected; data unchanged on error |
| 06 | Export project JSON, re-import and restore snapshot | Parent links survive exact round trips |
| 07 | Delete a parent, then restore snapshot | Children survive deletion and become root tasks; restore reestablishes hierarchy |
| 08 | Select multiple tasks and mark In progress | Only selected tasks change; recovery snapshot created |
| 09 | Attempt marking a blocked dependent Done | Error shown; no partial batch change |
| 10 | Select tasks and change priority | Only selected tasks changed; verification/release flags safely reopened |
| 11 | Show more than 40 Tasks items with large imported test workspace | Next rows load progressively; original count and storage unchanged |
| 12 | Board lane with >60 cards | Initially bounded; Show more reveals 60 more and drag still works |
| 13 | Regress Kanban hold-and-drag | Whole-card drag and auto-scroll still work |
| 14 | Regress Gantt drag/resize/connect | Existing timeline interactions still work; SCHED1 rules preserved |
| 15 | Restart app and restore backup | Bulk changes, hierarchy and dates persist; restore works |
| 16 | Web desktop | Sidebar, task filtering, select/edit flow and desktop layout work without bottom nav |

**Not yet tested here:** all runtime cases above. Record **Pass / Fail / Not run**, device orientation, and screen recording for any gesture problems. No Firebase deployment before acceptance.
