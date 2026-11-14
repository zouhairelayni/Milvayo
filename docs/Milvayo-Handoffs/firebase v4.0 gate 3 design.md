MILVAYO — FIREBASE v4.0 GATE 3 DESIGN (DRAFT FOR OWNER REVIEW) AND DEVELOPMENT-ORDER ASSESSMENT

STATUS: design only. No synchronization code has been written. Nothing here is emulator-verified. Proposals marked SPIKE must be proven in the Termux emulators before they become decisions.

---

1. ASSESSMENT OF THE PROPOSED DEVELOPMENT ORDER

Your order: (1) verify Gate 2 fixes, (2) design Gate 3, (3) sync covers every kind of change, (4) deletes and dependencies first, (5) all remaining workflows, (6) client integration and real collaboration.

Verdict: sound, with four changes.

Change 1. Steps 1 and 4 are merged into one verification batch. Deletes and dependencies are already implemented and unit-proven in the sandbox, and none of the Gate 2 fixes or those cascades is emulator-verified. One Termux run (test:cloud plus the benchmarks) closes all of it. Reason: separate verification cycles cost you the same device time twice.

Change 2. A thin vertical slice (Gate 3a) comes BEFORE the remaining workflows, not after. Reason: synchronization is the largest unproven assumption. Every remaining writer (create, comments, time entries, Canvas, sprints, messaging, projects) must return changed records that a client can apply, and every design choice in section 3 affects that contract. Building the other writers first risks reworking all of them. The slice is: one task edit, one multi-record delete, one offline replay, two real clients, a signal, and a stale conflict. It validates the contract with the least code.

Change 3. Order the remaining workflows by measured cost times expected frequency, not by feature area. The sandbox baseline (docs/qa/cloud-v4/WORKFLOW-BASELINES.md) shows exactly which workflows still scale with project size: create task, add comment, log time, Canvas add, Canvas text edit and Canvas delete (about N reads each: 510 at 500 tasks, 2,010 at 2,000). Chat, notifications, presence, watchers, summaries and directory are already constant (3 to 9 reads) and need no optimization. Imports and administration are rare: their priority is security review, not cost. Proposed order: create task, comments and time entries (frequent appends), Canvas add/text/delete, sprints, then project-level operations; messaging only for the signal.

Change 4. Concurrency evidence comes before the Gate 3 design is frozen, and a minimal disaster-recovery drill comes before any run against data you care about. Reason: if the emulator serializes transactions that read shared documents, the protocol must not rely on a shared cursor or counter document; and v4 removes history, so an export taken before each test session is the only rollback. Both are cheap now.

A writer contract (section 2) lets steps 4 and 5 proceed in parallel with the sync design safely: any handler that follows it works with any change feed in section 3.

---

2. THE WRITER CONTRACT (EVERY v4 HANDLER)

1. One transaction. All reads finish before the first write.
2. Every changed record gets revision + 1, `updatedAt`, `updatedBy`; a delete is a tombstone (`deleted:true`) with `deletedAt`; nothing is physically removed.
3. All records of one operation share one transaction and therefore one commit time.
4. The response carries every changed record (`changed`) so the originating client needs no pull.
5. Authorization, seat, protocol marker and write freeze are checked first, inside the transaction (existing preflight).
6. Idempotency: an operation ID is bound to actor and exact content, stored on the main record; no receipt document.
7. Stale base revision returns a conflict with the current record; the server never merges.
8. Reads are bounded by related records, not project size; anything above the caps is refused so the client uses the full editor.
9. Each handler ships with: an oracle test against the domain function or canonical validation, a read/write budget test at 10/100/500/2,000 tasks, an authorization test, and an emulator test.

---

3. CHANGE DISCOVERY (THE OPEN DESIGN)

Facts from the source: every record has a per-record `revision`; v4 writes stamp `updatedAt` with the Function clock (`Date.now()`); tombstones are kept; multi-record operations are single transactions; `pull` still uses the v3 workspace sequence, which v4 does not maintain.

Requirements: detect changes without a global counter; atomic visibility of multi-record operations; deletes; per-project permission filtering; strict conflicts; offline recovery; near-zero idle cost; no shared hot document written by every edit.

Options considered:
A. Per-project time cursor (recommended to spike). Pull asks for records of one project with `updatedAt >= cursor`, ordered by `updatedAt` then key, paged. Requires `updatedAt` stamped with Firestore commit time (`FieldValue.serverTimestamp()`, not the Function clock) so records of one transaction share one timestamp and ordering follows commit order. Cursor overlap (re-request a short window, deduplicate by key and revision) covers equal timestamps and late visibility. Composite index (projectId, updatedAt). Idle cost: one query returning no rows (1 read) per poll, zero with a live signal.
B. Append-only change log, one document per transaction listing keys and revisions. Exact ordering and atomic batches, but one extra write per operation, which breaks the one-write goal for simple edits. Keep as the fallback if A fails the spike.
C. Per-project head counter document. Rejected: a shared document written by every edit, the pattern the concurrency investigation is testing.

Scoped signal: after a successful commit the Function writes `heads/{org}/{workspace}/{project}` (RTDB, best effort) with the commit time. Read rule: unexpired ACL entry with read access to that project (the project-level ACL map already exists). Users without access to a project never receive its signal. Unavailable signal falls back to slow polling. This replaces the global workspace head and removes the "restricted users poll" asymmetry (risk R3).

Initial and resumed sync: first sync of a project reads all its records once (unavoidable, about N reads); a returning client resumes from its stored cursor and access version. If the client's last sync is older than the tombstone retention (decision D2), it must do a full resync.

Permissions: the server pull filters by project access exactly as v3 does; an access change resets the client (access version hash).

Conflicts and offline: server stays strict (decision D1). The client queue stores base revision, queued time and operation ID per change; replay checks revision; changes older than one hour require review (v1.1 plan). Multi-record operations (delete, dependency edit) are queued as operations, not as record diffs, and replayed through the same handler.

SPIKE TESTS (Termux emulators), all must pass before A becomes a decision:
S1 ordering and ties: concurrent commits produce no missed record when pulling with overlap.
S2 atomic visibility: a pull never returns part of a multi-record operation as a settled state (all share one timestamp; test under concurrent pulls).
S3 serverTimestamp semantics in the Firestore emulator match production assumptions (commit time, equal within a transaction).
S4 revocation and scope change mid-session; denied project never appears in pull or signal.
S5 offline replay: stale revision, deleted target, older-than-one-hour queue.
S6 tombstone retention: client older than retention forces a full resync.
S7 idle cost: reads per hour for 1, 10 and 30 idle clients with and without the signal.

---

4. GATE 3A VERTICAL SLICE (PROPOSED SCOPE, NEEDS AUTHORIZATION)

Server: `pullV4` (per project, cursor, paging, access filtering), serverTimestamp stamping in the writer contract, scoped project signal and rule, protocol-4 guard on legacy pull. Client: change-feed applier in the existing session for task edits, delete cascades and tombstones; offline queue rules for those operations. Tests: S1 to S7 plus a two-client collaboration test and a stale-conflict test. Out of scope: other workflows, UI copy (decision D5), backups.
Exit criteria: all spike tests pass in your emulators, the sandbox oracle tests still pass, and the full test:cloud run is green.

---

5. DECISIONS NEEDED FROM THE OWNER

D1 stale policy (strict server plus client auto-reapply for online edits), D2 tombstone retention, D4 summaries, D5 UI wording, D6 RPO/RTO, D7 ACL expiry, D9 chat audit. Add D10: authorize Gate 3a. Add D11: whether the experimental authorization mode (MILVAYO_PATCH_AUTH_MODE=snapshot) may ever leave the experiment (needs the concurrency evidence and a written security analysis).
