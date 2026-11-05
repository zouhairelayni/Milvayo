# Milvayo — Independent Kanban automation architecture (v0.3.10)

**Reference:** https://trello.com/guide/automate-anything and Atlassian support "Automation overview" / "Create and manage automations". Only interaction and business-rule concepts were studied; **no Trello implementation code, UI, wording, or assets were copied**.

## Adapted pattern map

| Pattern | Niyarvo implementation | Trigger timing |
|---|---|---|
| Rule | Card enters a status, optionally constrained to board and priority | Immediately on task status change |
| Card button | Button appears inside a task dialog | Explicit user tap |
| Board button | Button displayed next to selected board tabs and inside Automation Studio | Explicit user tap |
| Due-date command | Trigger if task is due in N calendar days | Explicit local 'Run due checks now' action |
| Scheduled calendar command | Not implemented; would need reliable server scheduler | Deferred to Firebase phase |
| Integrations / email | Not implemented | Deferred to authorized server endpoints |

## Pure engine and safety

The `src/automation.cjs` engine takes a normalized project, a typed event, and an optional deterministic `today`. It returns a new project plus applied event summaries. It does not execute dynamic JavaScript, requests, system commands, or untrusted expressions. Rules are capped at 50 per project and 8 actions per rule. Actions currently support priority, stage, owner, add label, due-in-days and local comment. A run is capped at 200 task-rule matches; excessive runs abort without persistence.

Status triggers are invoked inside `model.moveTask` after dependency/workflow checks and legacy field automations. The advanced engine does not issue status changes, preventing recursive status-trigger loops. Due actions carry a per-rule/task/day idempotency key to protect against repeated manual checks. Card/board actions are manual by design and may run more than once. Executions are recorded in a bounded local history (300 records). 

### Notes

- Board IDs remain independent of status columns. Deleting a custom board safely moves its tasks to Main and disables any command previously bound to that board.
- Conditions are project-local, not user authorization. The Firebase phase must enforce permissions and execution rules on the server.
- Current running-time assumptions use device UTC date for due checks. Future cloud schedules must define a project timezone, handle clock changes, and run exactly once with server-side idempotency.
- Commands persist inside the project JSON and backups. The existing `automations` array of simple status rules remains intact for backward compatibility.
- Command previews are textual. No external side effects exist. Recovery snapshots are made before manual automation actions in the app; status-trigger actions participate in the originating task update.

## Test examples

`tests/automation-studio.test.cjs` covers rule triggers, scoping, input validation, board and card buttons, due idempotency, date arithmetic, JSON round-trip, task history, and protection against deletion of custom boards.

## Future implementation gates

1. Project-level automation timezone and validated recurring schedule format.
2. Dedicated Firebase scheduler and idempotent transactions, with role-based access policy and run quotas.
3. Safe notification outbox and user-consented external integrations.
4. User-visible failure/retry log and rate limiting; abuse and permission tests.
5. Explicit approval for potentially destructive actions before adding them to the rule engine.
