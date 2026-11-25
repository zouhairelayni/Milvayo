# What the v4 cloud shares today (support matrix)

Generated from `tests/cloud/support-contract.test.cjs` (0.8.36). Plain words: **Sent** = other devices get it. **NOT shared yet** = it stays on the device that made it (shown as "not shared yet" since 0.8.35); the rest of an edit still goes. **Local only** = bookkeeping that is never sent on purpose. Status of this document: Planner-tested only; it describes the sender's plan, not what a device showed.

When support is added, change the table in the test on purpose and regenerate this page.

| Kind | Edit | Today |
|---|---|---|
| tasks | create | Sent |
| tasks | edit title | Sent |
| tasks | delete | Sent |
| tasks | move | Sent |
| tasks | move and edit together | Sent |
| tasks | remove a field | NOT shared yet |
| tasks | edit dependencies | Sent |
| tasks | move two at once | NOT shared yet |
| comments | create | Sent |
| comments | edit | NOT shared yet |
| comments | delete | NOT shared yet |
| timeEntries | create | Sent |
| timeEntries | edit | NOT shared yet |
| timeEntries | delete | NOT shared yet |
| canvas.objects | create | Sent |
| canvas.objects | create linked (0.8.43) | Sent |
| canvas.objects | join a group / leave a group (0.8.43) | Sent |
| canvas.objects | change a linked source (0.8.43) | Sent |
| canvas.objects | create inside a group (0.8.43) | Sent |
| canvas.objects | move | Sent |
| canvas.objects | edit text | Sent |
| canvas.objects | edit unknown property | NOT shared yet |
| canvas.objects | delete | Sent |
| canvas.objects | reorder | NOT shared yet |
| canvas.connectors | create | Sent |
| canvas.connectors | edit label | Sent |
| canvas.connectors | delete | Sent |
| canvas.threads | create (0.8.44) | Sent |
| canvas.threads | reply / resolve (0.8.44) | Sent |
| canvas.threads | move | NOT shared yet |
| canvas.threads | delete | NOT shared yet |
| canvases | counter/viewport only (bookkeeping) | Local only |
| canvases | rename (0.8.41) | Sent |
| canvases | create board (0.8.42) | Sent |
| canvases | archive (0.8.41) | Sent |
| canvases | delete board (0.8.42; archived first, up to 99 items per call) | Sent |
| projects | create | NOT shared yet |
| projects | edit | NOT shared yet |
| projects | delete | NOT shared yet |
| governance.risks | create (0.8.45) | Sent |
| governance.risks | edit (0.8.45) | Sent |
| governance.risks | delete (0.8.45) | Sent |
| governance.wbs | create (0.8.45) | Sent |
| governance.wbs | edit (0.8.45) | Sent |
| governance.wbs | delete (0.8.45) | Sent |
| governance.budget.lines | create (0.8.45) | Sent |
| governance.budget.lines | edit (0.8.45) | Sent |
| governance.budget.lines | delete (0.8.45) | Sent |
| governance.docs | create (0.8.45) | Sent |
| governance.docs | edit (0.8.45) | Sent |
| governance.docs | delete (0.8.45) | Sent |
| boards | create | NOT shared yet |
| boards | edit | NOT shared yet |
| boards | delete | NOT shared yet |
| dependencies | create | NOT shared yet |
| dependencies | edit | NOT shared yet |
| dependencies | delete | NOT shared yet |
| portfolios | create | NOT shared yet |
| portfolios | edit | NOT shared yet |
| portfolios | delete | NOT shared yet |
| programs | create | NOT shared yet |
| programs | edit | NOT shared yet |
| programs | delete | NOT shared yet |

## Not shared yet, in plain words
- Comments: editing or deleting one (adding works). Time entries: editing or deleting one (adding works).
- Canvas: moving or deleting a comment thread on its own, changing the stacking order list; grouping a frame into another frame (nested groups); editing a diagram's nodes or a drawing's points.
- Projects: creating, editing or deleting a project. Kanban board settings, portfolios and programs.
- Tasks: removing a field entirely (editing it is fine). Moving several tasks at once is split into single moves by the journal (works).

Ask for each one separately if you need it shared; each needs a new server call and its own approval and test.
