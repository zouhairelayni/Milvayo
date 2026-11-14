# Baseline reads and writes per Firebase-backed workflow (sandbox fake database)

Independent counts from the in-memory transactional fake (every document read, query row and write), cross-checked against the service-reported counts for the patch handlers. Not the emulator, not billing, not production. Cells marked n/a failed in the sandbox fixture and are listed so they are not mistaken for zero cost. Reproduce: `node tests/helpers/baseline-v4-workflows.cjs --write`.

| Workflow | Size | Reads | Writes | Deletes |
| --- | --- | --- | --- | --- |
| pull, cold start (cursor 0) | 10 | 17 | 0 | 0 |
| pull, nothing changed (resume) | 10 | 3 | 0 | 0 |
| presence authorization refresh | 10 | 3 | 0 | 0 |
| project summaries read | 10 | 4 | 0 | 0 |
| organization member directory | 10 | 6 | 0 | 0 |
| post a chat message | 10 | 7 | 3 | 0 |
| read chat messages | 10 | 6 | 0 | 0 |
| read notifications | 10 | 4 | 0 | 0 |
| watch a task thread | 10 | 9 | 2 | 0 |
| full workspace backup (export) | 10 | 21 | 0 | 0 |
| record history (versions) | 10 | 12 | 6 | 0 |
| create a task (legacy commit) | 10 | 20 | 6 | 0 |
| add a comment (legacy commit) | 10 | 19 | 5 | 0 |
| log a time entry (legacy commit) | 10 | 19 | 5 | 0 |
| soft delete a task (legacy commit) | 10 | 20 | 7 | 0 |
| pull, cold start (cursor 0) | 100 | 107 | 0 | 0 |
| pull, nothing changed (resume) | 100 | 3 | 0 | 0 |
| presence authorization refresh | 100 | 3 | 0 | 0 |
| project summaries read | 100 | 4 | 0 | 0 |
| organization member directory | 100 | 6 | 0 | 0 |
| post a chat message | 100 | 7 | 3 | 0 |
| read chat messages | 100 | 6 | 0 | 0 |
| read notifications | 100 | 4 | 0 | 0 |
| watch a task thread | 100 | 9 | 2 | 0 |
| full workspace backup (export) | 100 | 111 | 0 | 0 |
| record history (versions) | 100 | 12 | 6 | 0 |
| create a task (legacy commit) | 100 | 110 | 6 | 0 |
| add a comment (legacy commit) | 100 | 109 | 5 | 0 |
| log a time entry (legacy commit) | 100 | 109 | 5 | 0 |
| soft delete a task (legacy commit) | 100 | 110 | 7 | 0 |
| pull, cold start (cursor 0) | 500 | 507 | 0 | 0 |
| pull, nothing changed (resume) | 500 | 3 | 0 | 0 |
| presence authorization refresh | 500 | 3 | 0 | 0 |
| project summaries read | 500 | 4 | 0 | 0 |
| organization member directory | 500 | 6 | 0 | 0 |
| post a chat message | 500 | 7 | 3 | 0 |
| read chat messages | 500 | 6 | 0 | 0 |
| read notifications | 500 | 4 | 0 | 0 |
| watch a task thread | 500 | 9 | 2 | 0 |
| full workspace backup (export) | 500 | 511 | 0 | 0 |
| record history (versions) | 500 | 12 | 6 | 0 |
| create a task (legacy commit) | 500 | 510 | 6 | 0 |
| add a comment (legacy commit) | 500 | 509 | 5 | 0 |
| log a time entry (legacy commit) | 500 | 509 | 5 | 0 |
| soft delete a task (legacy commit) | 500 | 510 | 7 | 0 |
| pull, cold start (cursor 0) | 2000 | 2007 | 0 | 0 |
| pull, nothing changed (resume) | 2000 | 3 | 0 | 0 |
| presence authorization refresh | 2000 | 3 | 0 | 0 |
| project summaries read | 2000 | 4 | 0 | 0 |
| organization member directory | 2000 | 6 | 0 | 0 |
| post a chat message | 2000 | 7 | 3 | 0 |
| read chat messages | 2000 | 6 | 0 | 0 |
| read notifications | 2000 | 4 | 0 | 0 |
| watch a task thread | 2000 | 9 | 2 | 0 |
| full workspace backup (export) | 2000 | 2011 | 0 | 0 |
| record history (versions) | 2000 | 12 | 6 | 0 |
| create a task (legacy commit) | 2000 | 2010 | 6 | 0 |
| add a comment (legacy commit) | 2000 | 2009 | 5 | 0 |
| log a time entry (legacy commit) | 2000 | 2009 | 5 | 0 |
| soft delete a task (legacy commit) | 2000 | 2010 | 7 | 0 |
| Canvas: add an object (legacy commit) | 10 objects | 23 | 6 | 0 |
| Canvas: edit text (legacy commit) | 10 objects | 22 | 6 | 0 |
| Canvas: delete an object (legacy commit) | 10 objects | 23 | 7 | 0 |
| Canvas: add an object (legacy commit) | 100 objects | 113 | 6 | 0 |
| Canvas: edit text (legacy commit) | 100 objects | 112 | 6 | 0 |
| Canvas: delete an object (legacy commit) | 100 objects | 113 | 7 | 0 |
| Canvas: add an object (legacy commit) | 500 objects | 513 | 6 | 0 |
| Canvas: edit text (legacy commit) | 500 objects | 512 | 6 | 0 |
| Canvas: delete an object (legacy commit) | 500 objects | 513 | 7 | 0 |
| Canvas: add an object (legacy commit) | 999 objects | 1012 | 6 | 0 |
| Canvas: edit text (legacy commit) | 999 objects | 1011 | 6 | 0 |
| Canvas: delete an object (legacy commit) | 999 objects | 1012 | 7 | 0 |
