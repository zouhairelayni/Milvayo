# Firebase v4.0 Gate 2 QA report (sandbox)

Date: 2026-11-08. Sandbox run, unit/in-memory only. The Firebase emulator suite and any device are Not run.

| Check | Result |
| --- | --- |
| Routine edit = exactly one Firestore write; 5 reads; no versions/receipt/audit/sequence/summary document touched (10 and 500 tasks) | Pass |
| Status edit 6 reads / 1 write; Done reads only its own dependencies | Pass |
| Stale revision: conflict with current record, no write; duplicate opId idempotent; already-applied detection | Pass |
| Tombstone not revived | Pass |
| Viewer, scoped, no seat, revoked, outsider, cross-org, cross-workspace, wrong project denied | Pass |
| Protocol-3 workspace refuses patch; protocol-4 refuses legacy commit; write freeze stops both | Pass |
| Non-routine fields (board, dependencies, sprint, updatedAt, unknown) and invalid values rejected | Pass |
| 320-case equivalence with the legacy commit validators | Pass |
| Workspace controls administrator-only and audited | Pass |
| `npm test` after moving standalone benchmark runners out of `tests/` | Pass — 1,090 passed, 0 failed, 4 skipped (emulator-only) |
| Whole repository vs untouched 0.8.5 in this environment | 880 tests, 804 pass, 71 fail, 5 skipped; identical failing set (missing node_modules/assets/public); 5 skipped = 3 baseline + 2 emulator suites |
| tests/cloud/patch.emulator.test.cjs | Written; Not run |
| Contention/concurrency, two-device collaboration, production | Not run |

Counts are instrumented reads/writes from a fake transactional database, not billing.
