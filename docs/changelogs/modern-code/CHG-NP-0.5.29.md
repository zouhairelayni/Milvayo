# CHG-NP-0.5.29 — Multiple workspaces

## Baseline
0.5.28 (AES backup levels). Commit status: Not committed. No APK, no deploy. Set version 0.5.29 in app.json, package.json and package-lock.json yourself (they are not in the ZIP).

## New
- Create, rename, switch and delete workspaces. The side menu shows the open workspace on one quiet line above the project card; tapping it opens a "Workspaces" drawer (same slide-over as the project drawer). The open one has a check and "Open now · N projects". The pencil on a row opens rename and delete.
- Each workspace is one whole saved workspace object (projects, boards, tasks, sprints, releases, portfolios, programs, governance, specifications, automations, snapshots, activity), so nothing is shared between workspaces.
- A new workspace starts with one blank project ("First project"), not the Northstar sample.
- Delete asks for confirmation, names what is lost, and is hidden for the last workspace (also refused in code).
- Names: trimmed, 1–60 characters, unique ignoring case. Limit 20 workspaces.

## Storage and migration
- The first workspace ("Main workspace") keeps the original key `niyarvo-projects-v1`. Existing data is not copied, moved or rewritten, so migration cannot lose or duplicate records and cannot be interrupted. Project/task IDs are untouched.
- New list key `niyarvo-workspaces-v1` (names and active id only). Extra workspaces use `niyarvo-workspace-v1:<id>`.
- Interrupted runs: create writes data first, then the list; delete removes data first, then the list. On start, saved data that is not listed comes back as "Recovered workspace"; a listed workspace whose data is gone is dropped. A damaged list falls back to the main workspace; data under the keys is never touched.

## Switching safety
- One workspace change at a time. Edits are refused while it runs.
- The open workspace is flushed to its own key first; if that save fails, the switch is cancelled.
- Every writer is bound to one key for its whole life, so a late save cannot reach another workspace.
- A switch counter cancels a GitHub preview refresh that started in the old workspace.
- Open task, search text, status filter and project request are cleared on a switch; retained pages and the task sheet are keyed by workspace + project (project IDs repeat when the same backup is loaded twice).

## Fixed during this work (see NP-PONYTAIL-AUDIT-0.5.29.md)
- A file that took seconds to open (password-protected, Android) was imported into whichever workspace was open when it finished. `importProject` now takes the workspace id captured at pick time and refuses on mismatch.
- Index reconciliation returned a new list on every start (found by the new test); now unchanged lists are returned as is.

## Compatibility
- Backup, JSON and `.niyav` formats are unchanged. Export, import and restore act on the open workspace only.
- Test `performance-stability-0510` updated: the task sheet key is now `projectId` (workspace + project).

## Not done (brief items for 0.5.30+)
- Import modes (add project / new workspace from backup / restore), multi-workspace complete backup, Atlas fixtures and tests, gzip level and main-thread check, Timeline windowing tests, Android profiling. None of these were started.

## Tests
See NP-QA-0.5.29.md. Device checks: Not run.

## Known limits
- Inactive workspaces show their creation date, not counts (counts need reading them).
- Text typed in a lazy field within 300 ms of a switch is refused ("still loading"). Needs menu, drawer and row taps in that time; not reproduced.
- Deleting the main workspace removes its original key for good once another workspace exists.
