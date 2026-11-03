# NP-0.5.18 — Dead-code audit, Batch 2

- Store: removed three actions that no screen called: `moveList` (superseded by `moveListTo`, used by Board drag), `moveTaskToList` and `setGovernanceDoc` (`setGovernanceDocValue` / `setGovernanceDocStatus` are the ones in use). No UI or data change.
- Tests: tests/batch2-store-api-0518.test.cjs.
- Rollback: restore src/store.js from the previous ZIP.
