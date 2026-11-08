# Firebase v3.0 QA report (Phase 1)

Date: 2026-11-08. Scope: local source and unit tests only. No emulator, device, production or billing access.

| Check | Result |
| --- | --- |
| Class B vs canonical differential (320 cases) | Pass |
| Class B read budget at 10 / 500 / 2,000 tasks (<= 9 reads, no project scan) | Pass |
| Done reads only own dependencies; blocks incomplete dependencies | Pass |
| Workflow transition rules, bad status, verify/merge and board edits still protected | Pass |
| Pure reorder: bounded reads, order conflict still rejected | Pass |
| Session resumes from stored cursor and access version | Pass |
| Unchanged head does not pull; moved head pulls once; access change pulls; disconnect stops listener | Pass |
| Cost model: earlier variants unchanged; v3 variants and input validation | Pass |
| Whole repository vs untouched 0.8.5 in this environment | 855 tests/781 pass/71 fail before; 865/791/71 after; identical failing set (missing node_modules, assets, public/) |
| tests/cloud/task-draft.test.cjs | Fails identically before and after (needs @babel/core) |
| Security patch: grant matrix, revocation ACL, failed RTDB writes, fail-closed grants (acl-signal.test.cjs) | Pass |
| Security patch: live signal suppresses polling; denied/lost signal resumes adaptive polling (session.test.cjs) | Pass |
| Whole repository after the security patch | 871 tests/796 pass/71 fail; identical failing set to untouched 0.8.5 |
| heads-rules.emulator.test.cjs (all deny/allow cases, revoked, cross-org, cross-workspace, legacy ACL, listener cancellation) | Written; Not run (needs emulators) |
| `npm run test:cloud` with Firebase emulators, RTDB rules in emulator | Not run |
| Web, Expo Go, Android/iOS runtime; `npx expo install --check` | Not run |
| Real deployment, index build, Function concurrency measurement | Not run |

Measured instrumented reads (in-memory transactional fake, not billing): Class B status move 8 reads/7 writes at 100, 500 and 2,000 tasks; Class A title edit 6 reads; canonical date edit 109/509/2,009 reads.

Cost projections are modeled (docs/qa/cloud-v3/cost-projections.*); see the sensitivity table in `docs/Milvayo-Handoffs/firebase v3.0.md` section 4.

Rollback: revert the files listed in section 6 of the handoff; no stored data format changed. Restore firestore.indexes.json and database.rules.json to the 0.8.5 versions to undo index and rules changes.
