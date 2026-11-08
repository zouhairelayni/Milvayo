MILVAYO — FIREBASE ARCHITECTURE v3.0: PERFORMANCE AND COST REDUCTION WITHOUT LOSING WORKFLOW QUALITY

STATUS: Phase 1 implemented and tested locally (2026-11-08). Security patch 3.7 (heads authorization) added the same day, pending the owner's emulator results. Phase 2 was NEVER implemented: the owner closed it and moved the remaining work to the Firebase v4.0 plan (Milvayo-Firebase-v4_0-Implementation-Plan-v1_1.md). Section 8 is kept only as history and is SUPERSEDED: do not implement version TTL, compact history or audit-over-versions.
BASELINE: Milvayo 0.8.5 (Firebase Architecture v2.0, docs/Milvayo-Handoffs/firebase v2.0.md). Version numbers were not bumped (see section 9).
EVIDENCE: docs/qa/cloud-v3/REPORT.md, cost-projections.json/.csv in the same folder.
RULE FOR EVERYTHING BELOW: no production deploy, no commit/push/merge. Emulator-backed acceptance is "Not run" until the owner runs it.

---

1. WHAT WAS ASKED AND WHY

Question: how to improve database architecture performance and reduce costs further without sacrificing workflow quality.
Method: read the real 0.8.5 source (server service, mutation validators, journal, session, client, rules, indexes, cost model) instead of relying on the cost model alone. Findings below are from code, not from assumption, unless marked MODELED.

---

2. FINDINGS FROM THE 0.8.5 CODE

F1. Full-project scans are the dominant read cost.
- src/cloud/taskMutation.cjs allowed only these fields on the narrow path: title, description, priority, customValues, updatedAt, and verified/merged set to false.
- Status, owner, stage, position and order changes failed the allowlist and used canonical validation, which reads every record of the project (about tasks + 8 reads: 109 / 509 / 2,009 at 100 / 500 / 2,000 tasks, measured).
- The 0.8.5 cost model assumes 80% of mutations are narrow. A board move is a status change, so the real share is probably lower. Unknown until measured; the commit response already reports measured.validationClass and readBreakdown.
- MODELED: at 1,000 users the 20% full-scan share alone is about 95% of mutation reads and about 80% of all reads.

F2. Polling costs a Function call plus three Firestore reads even when nothing changed.
- Workspace polls back off from 5 s to 60 s (visible) / 120 s (hidden). Conversation polls run every 3 s while active at about 7 reads each.
- Consequence: a remote edit can wait up to a minute (two when hidden). Polling is both the cost and the latency problem.

F3. Returning sessions re-read the whole workspace.
- connect() always sent pull {cursor:0}, then ignored the result when a local journal already existed (the journal's own cursor drove the next refresh). That is tasks reads per sign-in for data that was thrown away.

F4. CORRECTION to the first analysis (honest note).
- I first suggested "advance the cursor locally after a save instead of pulling". journal.drain() ALREADY does this when the acknowledgment is the contiguous next sequence. What remains is the unconditional refresh() pull after every drain (3 reads + 1 request). That one is NOT removed in Phase 1 (see 8.6).

F5. Function configuration limits efficiency.
- cloudApi: 256 MiB, maxInstances 1, no concurrency. Handlers are I/O-bound (waiting on Firestore), which is the case where Cloud Run concurrency lowers billed instance-seconds. maxInstances 1 would also throttle a real deployment.

F6. Index waste.
- Only records.data, receipts.result, audit.before and messages.body were exempted. Every other field of records and every field of versions.record (a full copy of each record, including all of data) was indexed by default. No query uses them.

F7. Presence/ACL coupling that affects the signal design.
- ACL entries in RTDB expired after 90 s and were refreshed by presenceAuthorize from the polling tick every 40 s. Slower polling would have let ACLs expire. Grant and revoke already rewrite the ACL immediately, so expiry is only a fail-safe and can be longer.

F8. Items found but NOT changed in Phase 1 (specified in section 8):
- Every commit writes record + version(s) + receipt + audit + workspace sequence (+ summary on status change): 5 to 6 writes. The audit entry duplicates the receipt (same document id) and the version (actor, time).
- versions and receipts never expire.
- Presence heartbeat every 25 s per session; the listener downloads the whole project room; presenceAuthorize is a Function call, a Firestore transaction and an RTDB transaction on every watch() mount and not counted in the cost model.
- pull reads documents the user cannot see and discards them after the IAM check.
- Record order is the array index, so a card move rewrites the order of every sibling after it (many changes, not one).

---

3. PHASE 1: WHAT WAS IMPLEMENTED

3.1 Class B narrow validation (F1)
Files: src/cloud/taskMutation.cjs, src/cloud/server/service.cjs
- New Class B for single-task workflow edits: the Class A fields plus status, stage, owner, position, and listId only when reset to ''. verified/merged may only be set to false. Order may change (pure reorder).
- Anything else (boardId, sprintId, dependsOn, dates, tests, evidence, parentId, any non-task record) is still canonical. Class A behavior and tests are unchanged.
- Server validation for a Class B change:
  - same envelope (key, kind, project, board, id); no deletes; 3-way merge, revision and base checks as before;
  - defaultTask(next.data) must equal next.data (the same normalization canonical uses);
  - custom values validated against the project configuration (one read, only when needed);
  - status change: taskSchema.checkTransition against the project's workflow (same configuration read);
  - transition to Done: every dependsOn task must be Done in the committed state. Dependencies changed in the same mutation use their new status; others are read by key (readBreakdown.dependencies). A missing or deleted dependency blocks Done, exactly like canonical.
- Result is reported as measured.validationClass 'B'. Mixed batches are Class B only if every change is A or B; one canonical change makes the whole mutation canonical.
- Wire format: Class B changes are sent as full before/after (not compact patches). Patches for Class B are a Phase 2 payload optimization.

Measured (instrumented emulator-style fixture, service.cjs against an in-memory transactional database):
  tasks | Class B status move | Class A title edit | canonical (date edit)
  100   | 8 reads, 7 writes   | 6 reads            | 109 reads
  500   | 8 reads, 7 writes   | 6 reads            | 509 reads
  2000  | 8 reads, 7 writes   | 6 reads            | 2009 reads
Done transition adds one read per dependency not already in the mutation.
These are instrumented calls, not certified production billing.

3.2 Change signal instead of idle polling (F2, F7)
Files: src/cloud/server/service.cjs, src/cloud/client.js, src/cloud/session.cjs, database.rules.json
- Server: after a successful, non-duplicate commit, a best-effort RTDB transaction writes heads/{org}/{workspace} = {sequence (max), access, at}. grant() and revoke() also bump "access". Failure to write the signal never fails the commit.
- Rules: heads/$org/$workspace is never writable by clients. The original read rule (workspace read or any project entry) was too broad and is REPLACED by the stricter rule in section 3.7. The node holds no record data.
- Client: createEmulatorClient gains heads(scope, onHead, onLive). The session subscribes after presenceAuthorize. It pulls only when head.sequence is greater than the journal cursor, or when "access" changed. Its own commits advance the cursor first, so they do not trigger a pull.
- Fallback: while the signal is live the safety-net poll is 5 min visible / 10 min hidden (5 s while local work is queued). If RTDB disconnects or the node is unreadable, the previous adaptive policy (5 s to 60 s) resumes automatically. Becoming visible still forces a catch-up pull.
- ACL expiry raised from 90 s to 10 min; presenceAuthorize cadence from 40 s to 4 min and decoupled from the poll tick. Revocation remains immediate because revoke/grant rewrite the ACL at once; expiry is only the fail-safe, so a failed revocation write now lingers up to 10 min instead of 90 s.
- Sessions without client.heads (tests, older clients) keep the adaptive polling policy; only the presenceAuthorize cadence (4 min) and ACL expiry (10 min) change for them.
- Not covered: conversation polling (Phase 2).

3.3 Resume from the stored cursor (F3)
File: src/cloud/session.cjs
- If a valid local journal exists (schema 1, non-empty records, safe cursor) and the user is not publishing, connect() sends pull {cursor: stored, accessVersion: stored}. Reads fall from a full workspace to the 3-read unchanged case plus the delta. Server-side access changes still return reset:true and the existing reset path handles them.
- New journals, publish, corrupt journals: unchanged full pull.
- Known small cost: the delta is fetched twice (connect and the first tick refresh). Not worth extra complexity.

3.4 Index exemptions (F6)
File: firestore.indexes.json
- records: key, kind, id, boardId, order, revision, schema, deleted exempted (projectId and sequence stay indexed for pull).
- versions: record.data, record.kind/id/boardId/projectId/order/revision/schema/deleted/sequence, actor, at exempted. record.key stays indexed for the history query.
- Effect: less index storage and shorter write latency. Read/write counts are unchanged. Verify with `firebase deploy --only firestore:indexes` against a non-production project first; confirm history() still works (record.key query).

3.5 Function configuration (F5)
File: src/cloud/server/index.cjs
- cloudApi: cpu 1, memory 512MiB, concurrency 40, maxInstances 10 (was 256MiB, 1, none).
- Note: the per-request telemetry in index.cjs (process.cpuUsage deltas) is approximate once requests overlap. maxInstances 10 is a cost cap, not a target; lower it if you need a harder ceiling.
- The saving from concurrency is NOT included in the cost projections (CPU-seconds per request are held constant). It is an upside to verify on a real deployment.

3.6 Cost model and tooling
Files: src/cloud/costModel.cjs, src/cloud/tools/cost3.cjs
- New variants v3-mutations, v3-signal, v3-combined; new inputs workflowMutationShare, workflowReads, workflowWrites, remoteChangePullsPerUserDay, resumeReads, sessionMinutesPerUserDay. All 0.8.5 and earlier variants are unchanged (tests prove it).
- Run: node src/cloud/tools/cost3.cjs (writes docs/qa/cloud-v3). package.json was not edited, so there is no npm script.

3.7 SECURITY PATCH: global heads authorization (owner-approved, only change after Phase 1)
Defect: the first heads read rule admitted any user with a live ACL entry that had workspace read or any project entry. A workspace-wide reader with an explicit denial for a confidential project, a user with only denied projects, and a project-only user could therefore read the workspace-wide counter and access timestamp, which reveal activity of projects they may not read. "workspace == true" alone is also insufficient (a workspace reader can still be denied a confidential project).
Fix (fail closed):
- src/cloud/server/service.cjs writeAcl now stores acl/{org}/{workspace}/{uid}.unrestricted = workspace read AND every project entry grants read. The grant deny phase writes unrestricted:false.
- database.rules.json: heads/$org/$workspace is readable only when auth != null, the ACL entry has not expired, and unrestricted == true. Entries written before this patch have no field, so they are denied until the user's next presenceAuthorize (within 4 minutes while connected and visible, or at the next connect). Clients cannot write the node.
- No role or membership shortcut: guests are judged only by their real scoped grant (a scoped guest with read on every project stays unrestricted; a guest with any project denial does not).
- Users who cannot read the signal keep working: the client's onValue error callback marks the signal unavailable, and the existing adaptive polling (5 s to 60 s) resumes at once. Nothing else in the client changed.
Grant matrix implemented (unrestricted?): workspace viewer, no project entries: yes. Workspace viewer + any project 'none': NO. Workspace viewer + all projects 'none': NO. Workspace none + project viewer (project-only): NO. Workspace none, no projects: NO. Workspace commenter + extra rights on projects: yes. Revoked: NO (ACL is rewritten at once).
Tests:
- tests/cloud/acl-signal.test.cjs (runs in npm test): grant matrix through the real ACL writer, revocation ACL, failed-RTDB-write behavior, bounded expiry, fail-closed grant failures. Pass.
- tests/cloud/session.test.cjs: a live signal suppresses polling for the 5-minute safety net; losing or being denied the signal resumes adaptive polling immediately. Pass.
- tests/cloud/heads-rules.emulator.test.cjs (owner runs with npm run test:cloud): unrestricted allowed; scoped guest allowed; explicit confidential-project denial denied; project-only denied; all-projects-denied denied; no access denied; revoked denied; cross-organization, cross-workspace and signed-out denied; legacy, expired and restricted hand-written ACL entries denied; a denied listener is cancelled with a permission error (the polling-fallback trigger); clients cannot write. Status: NOT RUN here (no emulators).
- One diagnostic in that file records, without asserting, whether an already-attached RTDB listener keeps receiving after the ACL is revoked. Please send me that diagnostic line.

3.8 REVOCATION EXPOSURE REVIEW (10-minute ACL expiry)
What the ACL guards: only RTDB data: the heads counter (unrestricted users only) and project presence rooms (peer uids, state, resource labels). Firestore records and messages are NOT covered: every API request re-reads membership, grant and workspace state, so a revoked user loses data access immediately.
Who writes the ACL: grant() (Firestore grant set to 'none' with pending:true, then RTDB deny phase, then the real grant, then the real ACL), presenceAuthorize (refresh), revoke() (Firestore commit first, then one RTDB write per workspace).
Maximum exposure windows (all bounded by the ACL expiry; a revoked user cannot refresh because presenceAuthorize re-checks Firestore):
- revoke(), RTDB write fails after the Firestore commit: the administrator receives the error; the stale entry works until its expiresAt, at most 10 minutes after the user's last successful refresh (0.8.5 shipped 90 seconds). With several workspaces the loop stops at the first failure; each remaining workspace has the same bound. Retrying revoke repairs it (tested).
- grant() narrowing, RTDB deny phase fails: Firestore is already denying; the old ACL works for at most the same bound. The retry repairs it.
- grant(), final ACL write fails: the ACL stays in the deny phase, so access is closed rather than stale (tested).
- Unknown: whether RTDB cancels an already-attached listener when the ACL later changes or expires (rules are evaluated when a listener attaches). If it does not, a connected client could keep receiving counter updates and presence until it reconnects, beyond the 10 minutes. The emulator diagnostic measures this; section 3.2 payloads are counters only.
Options (not applied; the 10-minute value is unchanged and now explicit):
- A. Keep 10 minutes. Exposure: heads counter plus presence labels for at most 10 minutes after a failed RTDB write; failure is visible to the administrator and repairable by retry.
- B. Restore the 90-second ACL expiry with authorization every 40 seconds. Arithmetic: for an 8-hour visible session about 720 authorizations per user per day instead of about 120, an extra 600 Function requests (each with a Firestore transaction and an RTDB transaction).
- C. Add a durable repair marker written in the revoke/grant Firestore transaction, retried by the next administrator call or a scheduled sweep (Cloud Scheduler is an extra cost). Closes the unnoticed-failure case.
- D. Project-scoped signals with per-project expiry and a revoke-first ordering. Belongs to the v4.0 synchronization design.
Recommendation: A for now, because the exposed data is metadata, the window is bounded and a failed revocation is surfaced; choose B only if you need the old 90-second bound; plan C and D inside v4.0. To restore the 90-second bound change ACL_TTL_MS in service.cjs and AUTHORIZE_MS in session.cjs together.

---

4. COST PROJECTION (MODELED, NOT A BILL)

Known infrastructure subtotal for 1,000 users, 30 days, USD, v0.8.5 combined -> v3 combined. The result depends on two assumptions that only your telemetry can settle: how many mutations are workflow moves, and how long sessions last.
  Session  | simple 80% / workflow 0% | 80% / 10% | 80% / 20% | simple 50% / workflow 25% | 50% / 50%
  20 min   | 79.91 -> 76.83           | -> 63.33  | -> 49.83  | 120.81 -> 83.99           | -> 50.24
  120 min  | 101.84 -> 81.21          | -> 67.71  | -> 54.21  | 142.75 -> 88.37           | -> 54.62
  480 min  | 182.37 -> 97.00          | -> 83.50  | -> 70.00  | 223.27 -> 104.16          | -> 70.41
How to read it:
- Workflow share 0% means status moves stay full scans: the saving is then only the signal and resume. The Class B work pays in proportion to how many real edits are status/owner/order moves.
- At 20-minute sessions (the 0.8.5 model's implicit workload) the signal is roughly neutral for request count. Its saving grows with session length, and latency improves regardless.
- Not modeled: Function concurrency credit, presence/RTDB traffic, chat, storage growth, retries beyond the existing stress variant. The existing flat rtdbDownloadGB guess (1 MB per user per day, about $19 of $80 at 1,000 users) does not depend on team size and cannot show presence savings.
Full grid: docs/qa/cloud-v3/cost-projections.csv.

---

5. QUALITY GUARDS (WHY WORKFLOW QUALITY IS NOT TRADED AWAY)

- Differential test: tests/cloud/workflow-mutation.test.cjs compares the Class B validators with canonical validation (S.validateRecords + validateTransition) across 320 combinations (workflow on/off, dependency Done/not, four starting statuses, 20 edit shapes including invalid statuses, unknown listIds, verified/merged, boardId, dependsOn, sprintId). Rules asserted: the narrow path never accepts what canonical rejects, and never rejects a valid edit that is inside the Class B field set.
- Read-budget tests at 10 / 500 / 2,000 tasks: no project scan, at most 9 reads; Done reads only its own dependencies; dependencies changed in the same mutation are not re-read.
- Existing protections remain: forged base detection, revision/conflict merge, idempotent receipts, fresh grant checks per request, summaries, audit.
- Session tests: resume uses the stored cursor and access version; an unchanged head never pulls; a moved head pulls once; an access change pulls without new records; disconnect stops the listener.
- Canonical validation is untouched and still runs for imports, restore, structural and every non-Class-B change.

---

6. FILES CHANGED

Security patch 3.7 touched only: src/cloud/server/service.cjs (writeAcl, deny phase), database.rules.json (heads rule), tests/cloud/session.test.cjs (fixture clock, fallback test), plus the added tests acl-signal.test.cjs and heads-rules.emulator.test.cjs.
Changed: src/cloud/taskMutation.cjs, src/cloud/server/service.cjs, src/cloud/server/index.cjs, src/cloud/client.js, src/cloud/session.cjs, src/cloud/costModel.cjs, database.rules.json, firestore.indexes.json, tests/cloud/session.test.cjs, docs/changelog/CHANGELOG.md.
Added: tests/cloud/workflow-mutation.test.cjs, tests/cloud/cost-v3.test.cjs, src/cloud/tools/cost3.cjs, docs/qa/cloud-v3/{REPORT.md,cost-projections.json,cost-projections.csv}, this document.
Not touched: package.json, app.json, metro.config.js, functions package.json, UI code, local schema (schemaVersion 1), backup/import formats, dependencies.

---

7. TEST RESULTS AND WHAT WAS NOT RUN

- Cloud test files: all pass except tests/cloud/task-draft.test.cjs, which needs @babel/core (not installable in this environment; fails the same way on the untouched 0.8.5 source).
- Full repository run in this environment: 0.8.5 untouched = 855 tests, 781 pass, 71 fail; with v3 = 865 tests, 791 pass, the SAME 71 fail. The 71 failures are environmental (missing node_modules such as @babel/core, react, fflate; missing assets and public/ in the extraction; metro.config.js root-file check). The 10 new tests pass.
- NOT RUN: Firebase emulators (`npm run test:cloud`), RTDB rules in the emulator, a real Cloud Run deployment, Termux/Expo Go/Web runtime acceptance, `npx expo install --check`, index deployment, concurrency measurement. Run `npm test` and `npm run test:cloud` on your machine before accepting.
- Measured read counts come from a transactional in-memory fake of Firestore used by the existing 0.8.5 tests; they are instrumented counts, not billing.

---

8. PHASE 2: SPECIFIED, NOT IMPLEMENTED

8.1 Write amplification (largest remaining write cost)
- Stop writing a routine audit entry for plain record commits; keep audit for grants, approvals, deletes, restores, imports and administration. receipts (same id) and versions (actor, time) already hold the information. Saves one write per mutation (about 17%). The admin audit view must then read receipts/versions for routine edits.
- Add expireAt and a Firestore TTL policy: receipts about 14 days (only needed for retry replay), versions a long window (for example 180 days). Decide the version window against the restore/history promise and the longest offline period you support; an offline client older than the window will hit a conflict instead of a merge. TTL deletes are billed as deletes but stop unbounded storage growth. Verify the TTL fieldOverrides syntax with your firebase-tools version.
- Optional: store field patches instead of full record copies in versions.

8.2 Presence
- Per-resource path presence/{org}/{ws}/{project}/{resourceHash}/{uid}/{session} so a listener downloads only its resource instead of the whole project room (download grows roughly with the square of viewers).
- Heartbeat 25 s -> about 2 min (onDisconnect handles clean exits; expiresAt validation in rules must be raised from 90 s accordingly). Publish only on state change.
- Skip presenceAuthorize in watch() when authorized in the last few minutes.
- Add presenceAuthorize and heads traffic to the cost model.

8.3 Conversation signal
- Same pattern as 3.2 per thread: heads/{org}/{ws}/threads/{project}/{thread}. Removes the 3 s active poll (about 7 reads plus one Function call per poll). Needs a project-scoped read rule using the existing ACL.

8.4 pull reads documents it discards
- For users whose access is project-scoped, query projectId in [...] (grants are capped at 30 projects, which fits the in-query limit) with the existing (projectId, sequence) index; verify behavior for explicit project denials against the IAM matrix before shipping.

8.5 Reorder cost
- Order is the array index, so one card move changes many records. Use fractional (sparse) order values so a move writes one record. This needs a schema migration and local/cloud conversion; plan it as its own release.

8.6 Skip the empty refresh after a save
- tick() always calls refresh() after drain. When the signal is live and the cursor already advanced contiguously, the pull only returns grant metadata. Skipping it requires applying server-merged acknowledgment records to the app workspace directly (today applyRemote happens after refresh). Do this with its own tests.

8.7 Other
- Compact patches for Class B fields (smaller payloads).
- Extend narrow validation to dependsOn and date edits using a stored dependency graph document per project (cycle checks need the graph, not every task).
- Per-project sequence/summary documents instead of one workspace sequence (hot-document contention under many concurrent editors; the 0.8.5 report already flags the central sequence as a risk).
- Remove unused Firebase client modules (storage/functions) if confirmed unused, to shrink the web bundle.

---

9. DEPLOYMENT, VERSIONING AND ROLLBACK

Order (staging project first, never production without the owner):
1. Deploy database.rules.json and firestore.indexes.json.
2. Deploy functions (new config).
3. Ship the client. Old clients keep working: they poll as before, and the server signal is additive.
Rollback:
- Client: revert src/cloud/session.cjs and client.js; sessions fall back to adaptive polling with no data change.
- Server: revert service.cjs/taskMutation.cjs; Class B changes are then validated canonically (slower, equally correct). No stored data format changed.
- Rules/indexes: restore the previous files. Removing an index exemption rebuilds the index.
- ACL expiry: restore the 90 s constant in service.cjs if a shorter fail-safe window is required.
Versioning: package.json, package-lock.json, app.json and the Functions package.json were intentionally NOT edited (owner rule: do not ship them in zips), so the app still reports 0.8.5. If you want 0.8.6, bump all of them together and change the changelog heading.

---

10. ACCEPTANCE GATES FOR THE OWNER

1. npm test passes on your machine (the environment-only failures above should disappear).
2. npm run test:cloud passes with emulators.
3. In the emulator, open two sessions on one workspace: an edit in one appears in the other within about a second; disconnecting RTDB falls back to polling; revoking a grant ends access immediately.
4. Check measured.validationClass and readBreakdown on real status moves: expect 'B' and about 8 reads regardless of project size.
5. Move a card with an unfinished dependency to Done: must be rejected.
6. Re-run node src/cloud/tools/cost3.cjs with your real mutation mix and session length before trusting the savings table.
