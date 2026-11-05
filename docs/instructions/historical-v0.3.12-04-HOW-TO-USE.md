# Milvayo v0.3.12 — detailed user and operator guide

This guide matches the v0.3.12 source and the workflows shown in previous user screenshots. Some commands are labeled slightly differently on narrow Android, browser, or a contextual dialog; when in doubt use the sidebar screen name and the exact function described below. **All data is local to each app/browser installation unless deliberately exported and transferred.**

## 0. First launch, navigation and device behavior

**Run on Android/Termux:**

```bash
cd ~/Milvayo
git switch work
git status --short
npm install                # after first extraction/dependency changes
npm test
npx expo install --check
npx expo start -c          # use -c to clear Metro cache after platform-specific logo changes
```

Open the development Web URL in a browser or open Expo Go for Android; keep Metro running in Termux. The app uses Metro/Fast Refresh, not a static Python file server. Android builds/APKs and Git merges are handled separately by the user.

**Mobile navigation:** Bottom tabs lead to Overview, Board, Timeline, Sprints and Tasks. Tap the top-left menu to open the full left drawer; scroll inside it for Automations, Releases, Testing, Data schemas, Backups, Activity, Portfolios, Resources, Costs, Collaboration, Reports and Settings. The v0.3.11-HOTFIX1 drawer has its own vertical scroll, a persistent close button and dismissible backdrop. On Android, Back should close it; on Web, Escape should close it. The owner verified the drawer and logo fix in v0.3.11-HOTFIX2 on both platforms.

**Desktop browser:** A wider window uses an always-visible sidebar and no mobile bottom bar. A narrow browser window behaves more like Android. Do not assume Android and Web localhost share their local project database.

**Switch projects:** Tap the workspace name/stack icon in the sidebar or near the mobile header, select an active project. Archived projects are accessible through the restoration option. Workflows always act on the currently selected project unless the screen explicitly says Portfolios/workspace.

## 1. Start safely: backups before importing or upgrading

1. Open **Backups** in the navigation menu.
2. Choose **Export workspace** to create a portable file containing projects and workspace information; keep a copy outside the app (Downloads, private drive, etc.). Also use **Export project** for project-by-project backups.
3. If needed, tap **Snapshot now**. Note that this recovery snapshot remains in local storage and can disappear if app/browser data is cleared.
4. Never uninstall Expo Go, clear browser site data, or reset app storage as a troubleshooting shortcut without a verified external export.
5. To restore, open **Backups → Recovery snapshots → Restore**, inspect its context and confirm. Use **Import JSON** to transfer a saved single project or workspace file, as applicable.
6. For migration, record project count, task count, sprint count, dependencies and release count before and after the operation.

**Android import:** Backups → Import JSON → Android system file picker; select the `.project.json` file. Current code uses Expo SDK 58 `File.pickFileAsync`, bypassing the prior DocumentPicker cache permission failure. Selected files are limited to 5 MiB by import helper; invalid/oversized input should fail without modifying existing data. Web uses the browser's file selection mechanism. Check import preview before confirmation.

**Atlas demo:** The source ZIP includes `examples/ATLAS-MOCK.project.json`. Importing Atlas adds a fictional `ATL` product-launch project with 73 tasks, eight summary work packages, recorded sprint histories and dependency links. Open it as a **test sandbox**. It is not a real Niyarvo or RIVNA roadmap. You can import user-provided mock JSON through the same menu; only import files from known/trusted origins.

## 2. Create and manage projects

1. Use workspace/project picker → **New/Create project** (the top `+ New` in the header creates a **task**, so don't confuse the two).
2. Enter project name, short code and description; save. The project gets its own tasks, releases, boards, sprints, calendars and configuration.
3. Use **Manage project** to edit metadata, export, archive or delete. Archive hides from active selection but can be restored. Last active project cannot be archived.
4. Deletion is destructive; the UI saves a recovery snapshot where implemented. Verify a separate exported backup before deletion.
5. For a new workstream using the same structure, go to **Reports** and use project template/duplicate rather than copying completion evidence.
6. Use **Portfolios** to group multiple projects for a cross-project health view; portfolio grouping does not merge their schedules or task IDs.

## 3. Overview dashboard

The **Overview** screen summarizes only the selected project. Read its task-status distribution, weighted Work progress, acceptance tests with passing evidence, and verified/merged release-readiness indicators. Stage distribution breaks work into Development, Testing and Production. The redundant embedded Kanban board was intentionally removed in v0.3.2-HOTFIX3: go to **Board** for card actions.

**Interpretation caution:** A progress value is task-derived, not a time-tracking percentage or real delivery guarantee. “Merged” and “Released” are locally recorded metadata until a future authenticated GitHub integration is built.

## 4. Board: Kanban and multiple boards

1. Open **Board**. Choose the board (default **Main**) using the board selector. Additional boards can be created/renamed/deleted by board management controls.
2. Each board displays the same **four workflow lanes:** Backlog → In progress → Validation → Done. Boards are collections of tasks; they don't have independent custom status definitions yet.
3. Create a card with **Add card** in a lane (preselects the lane's status), or use **New** in the global header to create a task.
4. **Tap** a card to open the task editor. **Press and hold** roughly 340 ms to drag the entire card, then move it to the target lane or within-lane position. Hold near the left/right edge to auto-scroll horizontally. Dragging may be rejected if a workflow transition is disallowed or predecessors block completion.
5. **Tap the card ellipsis** in v0.3.12 to open actions without starting a long drag: Open details, Duplicate to Backlog, move to status, move to board, edit labels/dates, or run an enabled card automation button.
6. **Duplicate** creates a new task ID and unfinished/unverified Backlog work. It deliberately does *not* claim the copied card was tested, merged, released or sprint-completed.
7. Filter using text search, assignee/owner, priority, label or due date (all, overdue, today, tomorrow, next seven days, next thirty days, no due). Clear filters to see all board cards. The filtered ordering is a view and must not silently reorder hidden tasks.
8. Use the board display preference to show/hide descriptions. Compact cards still show useful labels, due and checklist metadata, assignee initials, GitHub indicator and comment/attachment counts when relevant.
9. If one lane contains many cards, use **Show more** to progressively render additional cards. Lanes have independent heights; a short lane should not extend to match the longest lane.
10. **Moving a task to another board** changes board membership only, not the task's workflow status or sprint; the Main board is protected and deleting a secondary board moves its tasks back to Main.

**Critical Android test for v0.3.12:** Ellipsis must open a menu with a normal tap, while pressing the card body still drags. Test after filtering, across long columns and after a restart.

## 5. Task details, subtasks, fields and verification

- Open any task from Board, Tasks, Timeline, Sprints or Reports where linked. Edit title, description, assignee, priority, status, stage, labels, start/due dates, milestone/estimate/progress, links and associated project records.
- Add/remove labels; attach external HTTPS resource links; GitHub links appear when the active board's GitHub Power-Up is enabled.
- Use **parent task/subtask** controls to nest children. Parent progress is read-only rollup; adjust child completion and effort instead. Deleting a parent detaches immediate children rather than destroying them.
- Under **Tasks → Task setup** or **Settings → Configure tasks & workflow**, define task types, up to five *field kinds* (text, number, date, Boolean, select) and an optional status transition matrix. “Five kinds” does **not** mean a five-field maximum. In-use task types cannot be deleted. Removing a custom field deletes saved values after a recovery snapshot. Workflow enforcement is initially **off** for backward compatibility.
- For text/number/date custom values, enter the value and tap its explicit **Save value** control. Boolean/select controls use direct selection. Invalid values are rejected.
- Add acceptance checks and set each to pending, passed, failed or blocked. Passed checks need evidence; record expected result, actual result, task-level evidence and rollback.
- **Mark verified** only when all required evidence is present; **Record merge** also requires a main SHA. These are local records, *not* calls to Git. Editing work after verification may reopen its verification and linked release status.

## 6. Tasks list and saved views

1. Open **Tasks**; search by task ID/title and filter by status or priority.
2. Use saved view controls to store a named query (status, priority, owner, text search, sort). Applying views does not change stored task order.
3. Select the visible tasks for **bulk status/priority/stage/owner** operations, then verify the preview/confirmation as available. Operations are all-or-nothing and workflow constraints apply; some destructive edits create snapshots.
4. The list loads in bounded pages (~40 rows); use the load-more control to inspect more tasks.
5. Adjust leaf task progress or estimated hours. The project rollup automatically excludes parent duplication.
6. To create nested work, open a task → Create subtask / Parent selector. Deep hierarchies are validated and cycles rejected.

## 7. Timeline (Gantt), dependencies and schedule engine

1. Open **Timeline**. Switch **Days / Weeks / Months** and group by **Status / Stage / Tree**. Tree mode expands/collapses parent tasks and shows summary bars; summary bars are read-only.
2. Use **Today**, zoom controls and horizontal/vertical scroll; pinch-to-zoom is available where device gestures support it. The task rail stays visible beside the calendar when the layout allows it.
3. Tasks with start/due dates show bars; milestones show diamonds. Unscheduled tasks remain in the list and offer **+ Schedule** or equivalent scheduling action.
4. Drag a non-summary bar to move dates; drag its right edge to resize. Use date fields/nudge actions as a fallback where touch gestures are difficult.
5. Add predecessors via row/task link controls or direct chart linking. Select a curved arrow to inspect/remove the relation; use **Links N** if the narrow SVG hit target is hard to touch. Cycles and missing dependencies are rejected.
6. Open **Scheduling** to configure working weekdays, closed holidays and extra work dates. Edit link types: **FS** finish-to-start, **SS** start-to-start, **FF** finish-to-finish, **SF** start-to-finish, plus signed lag days.
7. Use **Audit** to inspect scheduling conflicts. To propagate an anchor-task date change, choose **Preview successor dates**; review the list of changes; only then **Apply/Confirm**, which checks for stale preview and creates a recovery snapshot. Calendar edits alone do not automatically move tasks.
8. A legacy **Critical Path** view is only meaningful for simple calendar-day FS/zero-lag relationships. If typed constraints or working-day calendars are active, its control is intentionally unavailable rather than displaying misleading CPM output.
9. The chart uses viewport-based row/date/link rendering to reduce Android memory pressure. With Atlas, scroll/zoom and link hit testing still need full physical acceptance.

## 8. Sprints and burndown

1. Open **Sprints**. Create a planned sprint with name, goal and start/end dates (supported sprint window is 1–90 days).
2. Assign tasks from the backlog to the sprint; each task has at most one current `sprintId`. A project may hold multiple planned/completed sprints but only one active sprint.
3. Choose **Start sprint**. From this point the app records actual remaining-work counts when relevant task statuses/scope change.
4. View the **Burndown** chart: a recorded remaining line and a dashed ideal slope. Empty pre-start history is intentional, not a defect; Niyarvo does not invent old day-by-day status records.
5. Move a sprint task from In progress to Done through Board and confirm its remaining count changes in Sprints. For the Atlas fixture, the active sprint starts 16 total, eight completed in the seeded record; a sample `ATL-027` can be moved to Done in a controlled demo.
6. Tap **Finish sprint**, review the confirmation, then confirm. Final scope/history remains; unfinished tasks become unassigned backlog work without false Done status.
7. Planned sprints can be deleted with safeguards; running/completed sprint deletion is blocked. See **Reports** for completed-sprint delivery/velocity.

## 9. Automations and built-in Power-Ups

**Basic automation:** Open Automations, create a simple rule triggered by entering a workflow status, choose an action (e.g. change priority or owner) and enable it. Move a card and inspect the result. Disable the rule when not needed.

**Advanced automation studio:** Create a named command; select trigger (`status`, `cardButton`, `boardButton`, `due`), optional board/priority scoping and one to eight actions. Supported advanced action types in source: set priority, set owner, set stage, add a label, set due date relative to a clock date, and append a local comment. Card buttons appear on applicable cards; board buttons run on eligible board tasks. Due-date rules are **manual runs**—the app must be open and the user must invoke the check. Review **execution history**; due-run keys avoid repeating the same due action on the same day.

**Power-Ups:** Board → Power-Ups; separately enable any built-in extension for the selected board: GitHub, Due date calendar, Card aging, Checklist progress. Disabling GitHub hides its task UI but does not delete stored links. These are Niyarvo modules, not Trello plugin binaries.

**GitHub Power-Up:** Enable it for the board → open a card → enter a canonical GitHub URL for an issue, PR, commit or branch → Attach → optionally Refresh preview for a **public** resource. No private repository OAuth, automatic issue sync, webhooks, merge button, secret token or server-side action exists. A GitHub-linked PR does not prove the task is verified or merged.

## 10. Releases, Testing, Data schemas and Activity

- **Releases:** Create a release record with name, repo and version, choose its stage, link tasks, inspect readiness. Changes to required tasks may reopen a previously Ready/Released release to Testing. Recording a main SHA in a task or release is a **manual metadata entry**.
- **Testing:** Review acceptance checks/evidence and per-task verification. The app does not run CI, test suites or GitHub Actions itself.
- **Data schemas:** Save project documentation objects (schema definitions, API contracts and playbooks). These are portable records, not a live API deployment or database schema migration mechanism.
- **Activity:** Inspect the bounded local log of workspace changes. It is not tamper-proof or shared with a team.

## 11. Portfolios, Resources, Costs, Collaboration and Reports

- **Portfolios:** Create a portfolio with name/purpose; choose which workspace projects belong; compare project completion, overdue and blockers and set project status (On track / At risk / Off track / On hold). Does not mix their task records.
- **Resources:** Enter contributor name, weekly capacity hours and hourly rate; associate tasks via their Owner name. Log actual hours against a selected task/date/person with optional note; review simple capacity and recent logs. No per-day resource leveling or person accounts.
- **Costs:** Enter project budget and 3-letter currency code; compare planned labor (leaf-task estimate × owner rate), actual recorded time cost and remaining budget. Rate-at-entry snapshots preserve prior cost calculation. These are estimates, not invoicing or payment processing.
- **Collaboration:** Select a task; add local comment records or dated reminders; mark reminders done/delete as needed. They do not send push notifications or messages to remote people.
- **Reports:** Read completed sprint velocity figures, export tasks/time CSV, duplicate a clean project structure as a template. CSV removes many rich relationships and evidence fields; use project JSON for full backup.

## 12. Settings and colors

Open **Settings → Accent color**; choose Aqua, Mint, Lime, Amber, Orange, Coral, Pink, Fuchsia, Violet or Indigo. Default is **Orange `#D97757`**. Accent changes navigation selection, buttons and the monochrome in-app Niyarvo symbol; browser favicon follows it. Theme selection is stored locally, separate from project JSON. Installed Android launcher icons remain the default static orange unless native dynamic-icon support is specifically built. Settings also provides access to task setup and project management.

## 13. Troubleshooting and recovery

| Symptom | Action | Do **not** do |
|---|---|---|
| Android picker reports READ permission / unreadable cache file | Ensure running code includes 0.3.2-HOTFIX2 or later, start Metro `-c`, select JSON via Android system picker. | Do not request broad storage access or delete saved app data. |
| Sidebar doesn't scroll or dark overlay traps app | Verify baseline includes 0.3.11-HOTFIX1; rebuild/restart Metro with cache clear; use close or tap outside. | Do not downgrade to pre-HOTFIX1 code. |
| Web logo errors in `WebShape.js` | Verify `src/BrandMark.web.js` exists (0.3.11-HOTFIX2); restart Metro `-c`. | Do not replace working native logo or randomly upgrade SVG packages. |
| Timeline opens slowly or terminates Android | Confirm Gantt viewport windowing from 0.3.2-HOTFIX3; test small project; record native crash logs if it persists. | Do not assume a clean Metro console rules out a native crash. |
| Task editor raw `<Text>` error | Verify v0.3.9 or later patch; test Atlas custom-field select/Boolean row. | Do not disable all custom fields. |
| Imported project not visible | Open project picker; verify import preview/selection; check archived list and project count. | Do not repeat import blindly until duplicate IDs conflict. |
| Burndown missing old days | Check sprint started and recorded history exists; pre-start days are not backfilled. | Do not fabricate history from current status. |
| Unexpected blocked status/Done | Inspect predecessors and enabled workflow transitions. | Do not bypass model validators by direct JSON mutations. |
| Failed save / corrupt workspace | Respect non-destructive recovery UI; locate exported external backup; review errors and selected project. | Do not clear storage before recovery. |
| GitHub private PR preview fails | Expected: current integration is unauthenticated/public only. | Do not paste personal access tokens into project JSON or app settings. |

## 14. Routine backup, development and acceptance sequence

1. From **Backups**, export workspace and project to files outside the app.
2. In Termux, inspect `git status --short`; checkpoint existing changes before replacing source; extract **full ZIP contents into repository root** (no enclosing folder), or apply changes-only patch if matching exact baseline.
3. `npm test`, then `npx expo install --check`, `npx expo start -c` where relevant.
4. Test both Expo Go Android and Web: task creation, drag + ellipsis, board filter, import/export, Gantt scroll/link/resize, sprint chart, lower drawer links, alternate accent.
5. Confirm restart persistence and backups; record screenshots/logs and known failures in a versioned `CHG-NP-*` file.
6. **Only user** commits/pushes `work` after acceptance and merges to `main` after stable checkpoint. No automatic deployments or Firebase merges.

**Note for next model:** Do not confuse app package version `0.3.12`, a user's project `version` string (`0.3.2-demo` for Atlas), and the project's Git commit SHA. These represent different facts.
