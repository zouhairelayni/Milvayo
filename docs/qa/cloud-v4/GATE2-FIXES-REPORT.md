# Firebase v4 Gate 2 fixes: baseline, fix, retest

Date: 2026-11-09. Method (from the review prompt): reproduce first, fix, retest, compare. All results below are sandbox runs against an in-memory transactional fake (no emulator, no production). Emulator and device runs: Not run; the owner runs `npm run test:cloud` in Termux. Counts are instrumented reads/writes, not billing.

## 1. Security issues

| ID | Baseline (before the fix) | Fix | Retest (after) |
| --- | --- | --- | --- |
| S1 role persistence | Revoked admin `{active:false, role:'admin'}`; re-invited as viewer returned `{active:true, role:'admin'}` | Revoke downgrades the role to `member` (guests stay `guest`); accept never inherits a role for an inactive member and keeps profile data; active members keep their role | Re-invite gives `member`; former admin cannot self-escalate; active admin keeps role; guest stays guest (security-regress.test.cjs) |
| F1 operation-ID replay | Same opId with different content returned `ok:true, duplicate:true` and wrote nothing | Each patch stores `lastOpHash` (actor + record + exact edit) in the same single write; a reused opId with different actor or content is rejected (HTTP 409) | Genuine retry still succeeds; different content or different actor rejected; no extra write |
| F2 write freeze scope | Chat message was written on a frozen workspace (`messages written: 1`); patch and commit were already blocked; imports into an active workspace were already unreachable | Chat posting honours `writeFreeze`; grants, revocations and `workspaceControl` stay allowed so security repairs work during a freeze | Message rejected while frozen, accepted after unfreeze; revoke works while frozen |
| S2 platform role escalation | A `security` role granted `owner` and removed another owner | Only a platform owner can assign owner or change an owner; security can still assign other roles | Both rejected; owners and non-owner assignments still work |
| S3 error leakage | `history` on a missing record returned "Cannot read properties of undefined (reading 'projectId')"; all internal errors and Auth library errors reached the caller; telemetry on every response | New `publicError`: programming, driver and Auth errors become a generic message (500, or 401 for Auth); coded and validation errors keep their message; `history` null check; telemetry only on responses that already carry administrator instrumentation | Mapping table test; `history` returns "Record is unavailable" |
| S9 invitations | Invitation to a missing workspace allowed; unlimited pending invitations | Active workspace required; maximum 100 pending (expired ones do not count) | Both enforced |
| S13 ACL write failure | One failed RTDB write after a Firestore revoke left the ACL stale up to 10 minutes | Grant/revoke/refresh RTDB writes retry 3 times (0, 40, 160 ms) before reporting failure | Two transient failures are absorbed; a persistent failure is still surfaced to the administrator. The 10-minute expiry decision (D7) is unchanged and still open |

## 2. Cost: workflows moved to the one-write path

Method: baseline measured on the legacy commit, patch measured on the same data; correctness proven against canonical validation.

| Workflow | Size | Before | After |
| --- | --- | --- | --- |
| Title / priority | any | 6 R / 6 W | 5 R / 1 W |
| Status change | any | 8 R / 7 W | 6 R / 1 W |
| Start and due dates | 100 / 500 / 2,000 tasks | 109 / 509 / 2,009 R, 6 W | 5 R / 1 W |
| Labels, estimate, progress | 100 / 500 / 2,000 tasks | 109 / 509 / 2,009 R, 6 W | 5 R / 1 W |
| Move or resize a Canvas object | 10 / 100 / 500 / 1,000 objects | 22 / 112 / 512 / 1,012 R, 6 W | 5 R / 1 W |

Proof of safety:
- Extended task fields (dates, milestone, estimate, progress, labels, repo, branch, commit, mainSha, GitHub links, attachments, expected, rollback, task type, tests, evidence, actual): 784 combinations (no schedule, FS, SS and FF links with lag; verified and unverified tasks; completed and incomplete dependencies; 49 edit shapes). Patch never accepted what canonical validation rejected, and accepted every valid edit. Evidence, tests and actual stay locked on verified tasks, as in canonical.
- Canvas geometry (x, y, width, height, layer): 26 shapes compared with canonical validation including bounds, types and fields outside the patch set.
- Still excluded on purpose (cross-record references): parent, board, list, phase, release, sprint and dependencies.

## 2b. Delete and dependencies (added 2026-11-10)

Dependency links are their own records (`dependencies`, id `predecessor>successor`), and a delete cascades to other records, so both operations were built as bounded cascades and proven against the domain functions that define the behavior (`deleteTaskWithLinks`, `setTaskDependencies`).

| Workflow | Size | Before | After |
| --- | --- | --- | --- |
| Delete a task with no relations | 100 / 500 / 2,000 tasks | 110 / 510 / 2,010 R, 7 W | 8 R, 1 W |
| Add a dependency | 100 / 500 / 2,000 tasks | 109 / 509 / 2,009 R, 8 W | 9 R, 2 W (task + new link record) |

What a delete now touches (each change is a real write, found by indexed queries on related records only): the task tombstone, tasks that depend on it or are its children (dependency or parent removed, verified/merged cleared), every downstream verified task (verified/merged cleared, as the domain does transitively), releases that fall back from Ready/Released to Testing, comments, time entries and reminders of the task, and its dependency link records. A dependency edit touches the task, the added or removed link records and the same downstream invalidation. Dependency cycles, self references and missing predecessors are refused.

Proof: 8 delete scenarios (leaf, predecessors with typed links, dependents with verified downstream chain and releases, children and grandchildren, linked items, diamond downstream, everything combined) and 12 dependency scenarios (add, remove, replace, clear, duplicate IDs, unchanged, self dependency, missing, direct cycle, long cycle, diamond that is not a cycle) end in exactly the state the domain function produces and pass canonical whole-workspace validation; refused cases write nothing. Reads scale with related records, not project size (checked at 20, 500 and 2,000 tasks).

Limits and behavior to know: more than 100 related rows, 200 downstream tasks, 300 upstream tasks or 100 changed records are refused and the client must use the full editor; deleting needs the manager role, dependency edits the edit role; the tombstone keeps the task data so an authorized restore stays possible; project summaries are not updated (open decision D4); three new composite indexes on `records` (`projectId` with `data.dependsOn`, `data.parentId` and `data.taskId`) are added to firestore.indexes.json and must be built before these queries are used on a real project (the emulator does not enforce them: Not run).

## 3. Not changed, and why

| Item | Reason |
| --- | --- |
| Create task, sprint, comment, time entry, Canvas add/delete/text edits | Still on the legacy full-validation path; each needs its own bounded validator (Canvas text needs board-size rules). |
| Seat check read (subscription document on every edit) | Removing it needs a denormalized `licensed` flag kept in sync in eight places (billing, grants, invites, seats). Saves 1 of 5 reads. Needs a dedicated change. |
| Per-instance authorization cache | Would cut 3 of 5 reads but weakens immediate revocation to the cache TTL. Needs your decision (D7-style). |
| 30-user latency (p50 26 s in your emulator run) | Cannot be measured without the emulators. Hypothesis: every patch transaction reads the shared workspace and subscription documents, and the emulator's transaction locking serializes them. I added an experiment: set `MILVAYO_PATCH_AUTH_MODE=snapshot` before starting the emulators to read those documents outside the transaction (default stays transactional). Compare `measured.transactionAttempts` and latency with both modes using your bench and send me the JSON. Snapshot mode may leave authorization stale by milliseconds relative to a concurrent revoke, so it is an experiment, not a recommendation. |
| S4 App Check, rate limits, S5 token revocation, S6 platform listing cap, S7 Storage rules, S8 CSP, S10 billing signature, S12 history policy, D1 to D8 disaster recovery | Production infrastructure or owner policy; see SECURITY-DR-AUDIT.md. Nothing in this change weakens them. |
| S11 patch inside a deleted project | Status and custom-field edits already refuse (they read the project); other fields do not, because checking would add a read to every edit. Tasks of a deleted project are tombstoned by the same mutation. Accepted risk. |
| F3 v3 pull does not see patches | Known: protocol-4 workspaces are test-only until Gate 3 defines the new change feed. |

## 4. Test status

- Sandbox full repository run: 899 tests, 823 pass, 71 fail (same 71 environment failures as the untouched 0.8.5 source: missing node_modules, assets, public), 5 skipped (3 baseline plus the 2 emulator suites). New and updated suites pass: security-regress (7), patch (8), patch-fields (3), patch-canvas (3), patch-mode (1), patch-cascade (5), acl-signal (4, updated for retries).
- Not run: emulator suites (patch.emulator, heads-rules), device runs, concurrency, production.
- Reproduce the cost table: `node tests/helpers/bench-v4-sandbox.cjs` (writes COST-BEFORE-AFTER.md).
