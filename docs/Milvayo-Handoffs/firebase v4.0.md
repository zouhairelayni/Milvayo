MILVAYO — FIREBASE v4.0 IMPLEMENTATION PLAN v1.2 (CURATED)

STATUS: Gate 0 closed. Gate 1 contract package accepted by the owner ("Proceed with v4"). Gate 2 (lean patch prototype) is included in the v0.8.6 checkpoint; the owner's Termux/emulator run remains pending. Gates 3 to 6 not started. Nothing is deployed or merged.
SUPERSEDES: nothing the owner wrote. Milvayo-Firebase-v4_0-Implementation-Plan-v1_1.md stays the product source of truth; this document applies it to the verified v3.1.2 code, closes its open questions where evidence allows, and lists the decisions only the owner can make.
BASELINE: Milvayo 0.8.5 + Firebase v3.0 Phase 1 + v3.1.2 security patch (owner-verified, emulator, 130/130; see "firebase v3.0.md" section 3.9 and docs/qa/cloud-v3/REPORT.md). Emulator-tested, not production-certified.
GATE 2 CHECKPOINT: Implemented and recorded as Milvayo 0.8.6 on 2026-11-10. The app, lockfile, Expo config and local Functions package are versioned together; Android/iOS build metadata is 96. In-memory checks pass; the Gate 2 emulator suite remains Not run. See `docs/changelog/CHANGELOG.md` and `docs/qa/cloud-v4/GATE2-REPORT.md`.
RULES THAT STAY IN FORCE: no deploy/commit/push/merge without explicit authorization; never `git add .`; legacy history, receipts and sequence stay until the replacement protocol passes correctness and isolation tests.

---

1. GATE STATUS

Gate 0 (freeze and reconcile Phase 2): CLOSED. Phase 2 was never implemented, so there is nothing to unwind. Phase 1 keep/rework split is in "firebase v3.0.md" and section 2 here.
Gate 1 (contract and security tests): security repair DONE and owner-verified (global heads leak fixed, 12 negative/positive cases). Remaining deliverables are this document: protocol inventory (3), operation matrix (4), API contracts (5), offline and deletion rules (6), risk register (7), test matrix (8). PASS CONDITION: owner reviews and answers the decisions in section 9.
Gate 2 (lean mutation prototype): IMPLEMENTED (section 10). Sandbox tests pass; emulator test written, Not run.
Gates 3 to 6: as in v1.1, with Gate 6 reduced to a fresh recovery point, deploying rules/indexes in order and a staging restore drill (no dual-protocol cutover; section 6.4).

---

2. WHAT FROM v3 CARRIES INTO v4

Keep as is (independent of the v4 protocol):
- Class B validators in src/cloud/taskMutation.cjs (eligibleB, validateWorkflow, validateDone, needsConfiguration) and their 320-case differential test. They are pure functions of old state, new state, project configuration and dependency status.
- ACL writer with `unrestricted`, the heads rule, acl-signal tests, the 12-case rules suite.
- Function config (1 vCPU, 512 MiB, concurrency 40, max 10), index exemptions on records, presenceAuthorize cadence decoupling, cost model v3 variants as the comparison baseline.
Rework in v4:
- commit path (versions, receipt, audit, workspace sequence), full before/after wire format, signal()/heads keyed to the workspace sequence, resume-from-cursor, versions index exemptions.
Discard as obsolete: Phase 2 items 8.1 TTL/compaction/audit-over-versions (stopped), 8.7 sequence sharding (paused).
Do not carry into production code: the temporary awaited signal() with logging and the database URL namespace experiment (both reverted; not root causes).

---

3. PROTOCOL INVENTORY (v3.1.2, from source)

Server handlers (src/cloud/server/service.cjs, collaboration.cjs, administration.cjs):
  bootstrap, organizationCreate        keep
  importBegin/Chunk/Extras/Finalize     keep; finalize sets workspace sequence 1, so a v4 workspace needs an explicit protocol marker (section 6.4)
  pull                                  v3 protocol: cursor = workspace sequence, accessVersion reset, 3 reads when idle; replaced by project-scoped delta in Gate 3, kept for v3 workspaces
  commit                                v3 protocol: record + versions(1-2) + receipt + audit + sequence (+ summary); legacy until Gate 6
  grant, revoke, presenceAuthorize      keep; ACL semantics unchanged (risk R1)
  invite, accept, subscription, mockWebhook, platform, admin, directory, seat operations   keep; their receipts/audit are non-idempotent or administrative and stay
  backup                                keep as user export; it is not disaster recovery
  history                               reads versions; no UI consumer found in src (verify before removal); retire after versions are gone
  summaries                             derived per-project counts written on status changes; needs justification (decision D4)
  restore flag on commit                server and emulator test only; no direct client caller found in src. CloudRecovery.js applies a validated plan through normal workspace edits (up to 100 changes, so through the ordinary commit/patch path) or restoreNew into a new workspace. Verify before changing (section 5.4)
  conversation/message/notification/watcher actions   chat; polling today; signals later (not part of Gate 2)
Cloud data: records(+revision, sequence, deleted), versions, receipts, audit (routine), adminAudit (administration, keep), summaries, messages/conversations/watchers/notifications, members/grants/subscription/invitations/seatAllocations, RTDB acl/heads/presence.
Client consumers that depend on removed data: the CloudPanel admin view (service admin() reads the workspace `audit` collection, last 30). That collection mixes routine commit entries with grant changes, imports and conversation events; the organization-level `adminAudit` collection (CloudOrganization, administration.cjs) is separate and stays. v4 drops only routine commit entries; grant/import/administrative entries stay, and whether chat messages keep an audit entry is decision D9. Also affected: CloudRecovery restore flow, journal cursor/resume logic, session heads listener.
Measured v3 cost per routine edit (owner emulator baseline): first title 6 reads/6 writes (task, versions @1 and @2, receipt, sequence, audit), repeat title 6/5, status 8/7, dates 109 to 2,009 reads (full scan).

---

4. OPERATION MATRIX (v4 TARGET; read counts are hypotheses to measure, not promises)

  Title, description, priority, custom values, owner, stage: validation Class A/B; target 1 Firestore write (the task); reads: membership, grant, workspace meta, task (+project config for custom values); receipt: none; summary: none.
  Status (non-Done): Class B workflow check; 1 task write; +project config read; summary only if D4 requires it.
  Status to Done: as above + the task's own dependencies (one read each); 1 task write.
  Position/order: 1 write per moved task today because order is the array index (v1.1 defers sparse order). Hold: Gate 2 supports single-task order change only if the client sends a fractional order; otherwise legacy path.
  Dates, dependsOn, board, sprint, parent: canonical validation today (109 to 2,009 reads). v4 does not make these cheaper; they stay on the legacy full-validation endpoint until a measured design exists. Do not hide this cost in Gate 5.
  Create task: 1 write (new document) + project config read; id uniqueness via create().
  Delete: soft delete = one write turning the task into a minimal tombstone (revision+1, deleted, deletedAt). Bulk delete: separate privileged path with threshold (section 6.3).
  Project/workspace structural edits, import, restore: legacy transactional path, protocol-gated.
  Presence/chat: unchanged by Gate 2.

---

5. API CONTRACTS (PROPOSED)

5.1 `patch` (routine task edit; v4 workspaces only)
Request: { action:'patch', orgId, workspaceId, projectId, taskId, baseRevision:int, opId:string, set:{field:value,...} } (1 to 20 Class A/B fields; `updatedAt` is rejected because the server stamps it).
Server: authenticate; require workspace.protocol===4; require create/edit permission for projectId and a licensed seat; read the task; compare revision; validate fields with the Class A/B validators; write ONE document update: changed fields, revision+1, updatedAt (server time), lastOpId=opId, updatedBy. No versions, receipt, audit or sequence write.
Responses (HTTP 200): { ok:true, revision, record } on success; { ok:true, duplicate:true } for a repeated opId; { ok:true, alreadyApplied:true } when the task already holds the patched values; { ok:false, code:'conflict', current } when baseRevision != current.revision; { ok:false, code:'deleted', current } for a tombstone. Errors (HTTP 4xx): permission-denied (scoped grant, revoked, no seat), failed-precondition (workspace not protocol 4, or write freeze), invalid-argument (field not patchable, bad value, validation or workflow rule).
Administrators get `measured` (reads, writes) on every response. Controls: `workspaceControl` { protocol: 3|4, writeFreeze: boolean } is organization-administrator only and writes an adminAudit entry; the freeze also stops legacy commits.
5.2 Retry safety without receipts (zero extra writes)
- Duplicate: if current.lastOpId === opId the server returns success with the current record.
- If another write already replaced lastOpId, the client compares current values with its patch; if every touched field already equals the patch, it marks the change synchronized (already applied); otherwise it treats the response as a normal conflict.
- Receipts remain only for non-idempotent operations: invitations, payments/webhooks, counters, bulk actions.
5.3 Stale-revision policy (decision D1)
Server stays strict: reject baseRevision != current.revision. Recommended client behavior: for an online edit younger than the offline threshold, refetch the task and, if the fields it touches are unchanged remotely, submit a NEW patch from the fresh revision automatically (an explicit new patch, never a force overwrite). Anything that was queued offline, or older than one hour, goes to review (section 6.1). This keeps the server lean and avoids a conflict screen for harmless concurrent edits to different fields.
5.4 Restore and import
Imports and restoreNew (restore into a new workspace) keep the legacy transactional endpoint, extended to v4 workspaces, with the protocol marker and the destructive-write freeze applied; they are rare, privileged and may keep their existing write cost. A scoped restore of up to 100 changes from CloudRecovery goes through the normal patch path (field patches against fresh revisions); the unused server `restore` commit flag is a candidate for removal once confirmed.

---

6. OFFLINE, DELETION AND COMPATIBILITY RULES

6.1 Offline queue. Each pending change stores baseRevision, queuedAt, opId and the patch. States: Pending, Syncing, Synced, NeedsReview, Rejected(reason). Reconnect: refresh the task first; revision unchanged and age under one hour: submit; age over one hour: NeedsReview even with no conflict (the clock is a UX trigger, not authority); revision changed: Rejected(conflict) and keep the draft. Display only "Saved locally" after the local write succeeds, otherwise "Not saved"; never "Synced" before server acceptance. Mandatory copy (section 4C.1 of v1.1) is reproduced verbatim in UI tests: offline banner and the "Your changes couldn't be synchronized" message, shown only for teammate-caused conflicts; separate copy for revoked permission, deleted task, local storage failure and outage (owner to supply wording, D5).
6.2 Deleted tasks. A tombstone keeps {key, projectId, revision, deleted:true, deletedAt}. A stale patch against a tombstone returns `deleted`; the client never resurrects it. Resurrection is only an explicit, authorized restore. Purge needs a retention rule (D2); until then tombstones stay (as today).
6.3 No inferred deletes. Missing items, empty arrays, failed loads or schema mismatches never produce deletes. Bulk delete needs an explicit operation with a count threshold, separate confirmation and an immutable scope. A server-side destructive-write freeze flag (stored outside the client bundle) makes `patch`-delete, bulk delete, import and restore return `frozen`.
6.4 Protocol marker, no dual protocol. There are no production clients or production data yet, so v4 REPLACES v3 outright: no per-workspace migration, no read-only mode for old apps, no long-term support of two protocols. The only safeguard kept is cheap and permanent: each workspace carries a protocol number (workspace.protocol, 4 for v4), the legacy commit refuses protocol-4 workspaces with "Update the app to continue editing this workspace" (HTTP 412), and `patch` refuses any workspace that is not protocol 4. A future protocol change can therefore never silently split editors. Test workspaces are republished from device data. The legacy versions/receipts/audit/sequence code is deleted once the Gate 3 synchronization protocol passes its tests, before any launch.

---

7. RISK REGISTER (CARRIED FORWARD)

R1 Stale RTDB ACL after a failed revoke write: exposure up to the ACL expiry (10 minutes after the user's last refresh). Firestore requests deny immediately; exposed data is counters and presence labels. OPEN. v4 action: project-scoped signals with a short expiry that does not require polling, durable repair marker for failed ACL writes, and an assertion test (below). Option to restore a 90-second bound costs about 600 extra Function requests per user per day for an 8-hour session.
R2 Attached-listener behavior after revocation is only a diagnostic (0 new events, cancelled, in the emulator). Action: turn it into an asserted test for successful revocation, and a separate test for failed RTDB revocation and expiry.
R3 Global heads are now readable only by unrestricted workspace readers; everyone else polls. Project-scoped heads in Gate 3 remove this asymmetry and need their own negative tests (denied project, revoked user, guest, cross-org, cross-workspace).
R4 v3.1.2 is emulator-tested only. npm test was not re-run for it (last full app run 1072/0/2 skipped before the patch); real two-device Web/Android collaboration is unvalidated.
R5 Concurrency: in the emulator, 35+ simultaneous edits to one 500-task workspace produced lock timeouts and 100 crashed Termux. The workspace sequence and project summary are shared hot documents but were not proven to be the sole cause. Gate 2/3 must include a contention test that attributes the cause (single document vs emulator limits).
R6 Version history removal needs a replacement stale-merge semantics (section 5.3) and an owner decision on user-facing history/restore (D3).
R7 Disaster recovery consistency: a normal Firestore export is not a point-in-time snapshot; PITR or a short write quiescence is needed. RPO/RTO targets are undecided (D6). Firestore export does not cover RTDB or rules/config; the recovery point must record those too.
R8 Cost model gaps (RTDB downloads, concurrency credit, deletes, retries, backup, storage). Null counters mean unmeasured, not zero.
R9 Tombstone growth until a purge process exists.
R10 Storage rules line-8 null-value warning (passing test); clean up separately.
R11 Repository hygiene: unrelated files in git status; stage by name only.
R12 Old-client compatibility: LOW while there are no installed clients. Mitigation is the protocol marker and the refusal messages (section 6.4). Revisit before the first public release.

---

8. TEST MATRIX

Gate 2 (server, emulator + in-memory): write budget (title/priority = exactly 1 Firestore write; assert zero versions/receipt/audit/sequence/summary writes); stale revision rejected, current revision accepted; duplicate opId idempotent; value-already-applied detection; tombstone returns `deleted`; unauthorized, revoked, viewer, wrong project, wrong org/workspace, missing seat; frozen flag; invalid fields/values; Done blocked by incomplete dependency; workflow transition rules; differential test against canonical validation (reuse the 320-case harness); no protocol-3 workspace accepts `patch`; read counts measured and recorded.
Gate 3: two clients, missed signal, identical timestamps, out-of-order commit visibility, pagination, deleted markers, revocation and scope change mid-session, offline reconnect, >1-hour review, exact UI copy on web and mobile.
Gate 4/5/6: as in v1.1 section 5.

---

9. DECISIONS ONLY THE OWNER CAN MAKE

D1 Stale policy: strict server revision gate plus client auto-reapply for fresh online edits (recommended), or strict everywhere.
D2 Tombstone retention (for example 30 or 90 days) and who purges.
D3 User-facing cloud history/restore: retire `history` and task-level restore from versions; keep backup-file recovery (recommended), or provide something else.
D4 Project summaries: stop per-edit summary writes and compute counts on read (aggregation queries), or keep a debounced/asynchronous writer.
D5 Wording for the non-teammate rejection states (revoked, deleted, storage failure, outage) and the review prompt.
D6 RPO/RTO targets and whether PITR is acceptable.
D7 ACL expiry: accept 10 minutes with a repair marker, or restore 90 seconds at the cost above.
D8 Authorization of Gate 2.
D9 Whether posted chat messages keep a workspace audit entry (today each message writes one).

---

10. GATE 2 RESULT (IMPLEMENTED; OWNER EMULATOR RUN PENDING)

Built: src/cloud/server/patch.cjs (`patch`, `workspaceControl`), registered in service.cjs; a protocol/write-freeze guard on the legacy commit; tests/cloud/patch.test.cjs (8 tests) and tests/cloud/patch.emulator.test.cjs (emulator, Not run). Reused unchanged: Class A/B validators, IAM, access(). Legacy pull, versions, receipts, audit, sequence, heads, client code, UI and stored formats are untouched. Version metadata is synchronized to 0.8.6 for this checkpoint.
Measured in the sandbox fake database (instrumented counts, not billing; v3 numbers are the owner's emulator baseline):
  Edit                                   v3.0 commit          v4 patch
  Title/priority/owner/stage/position    6 R / 5-6 W          5 R / 1 W
  Status (no Done)                       8 R / 7 W            6 R / 1 W
  Status to Done, one dependency         9 R / 7 W (est.)     7 R / 1 W
  Same result at 10, 500 tasks           yes                  yes (no project scan)
Write path for a routine edit is exactly one document (the task); no version, receipt, audit, workspace sequence or summary write (asserted). The 5 reads are member, grant, workspace, subscription (seat) and task.
Tests: 320 edit shapes run through legacy commit and patch on twin workspaces; patch never accepts what legacy rejects and accepts every valid Class A/B edit. Also: stale revision rejected without a write, duplicate opId idempotent, already-applied detection, tombstones not revived, viewer/scoped/no-seat/revoked/outsider/cross-org/cross-workspace/wrong-project denied, protocol-3 workspace and frozen workspace refused, legacy commit refused on protocol 4, only validated fields patchable, controls administrator-only and audited.
Decision applied: D1 server strict revision gate (client auto-reapply belongs to Gate 3). Still open: D2 to D9 (needed from Gate 3/4 onward).
Not done in Gate 2 on purpose: client sync, signals/cursor (Gate 3), offline queue and UI (Gate 4), backups (Gate 5), removal of legacy code (after Gate 3), summaries (D4), cheaper reads (the seat check reads the subscription document on every edit; it could move to a cached claim later).
Next: Gate 3 design spike (change discovery with project-scoped, access-controlled signals; cursor semantics; R1, R2, R3, R5 tests). It needs decisions D1 confirmation, D7 and the contention measurements.
