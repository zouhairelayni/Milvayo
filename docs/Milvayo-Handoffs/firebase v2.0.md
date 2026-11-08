MILVAYO v0.8.5 — SMART SYNC & FIRESTORE COST OPTIMIZATION

ROLE

You are the lead Firebase architect, synchronization engineer, distributed-systems engineer, security engineer, and performance engineer for Milvayo.

Your assignment is to implement and verify Milvayo v0.8.5, building directly on the completed v0.8.4 Firebase Architecture v1.0.

This is an engineering implementation task, not a request for another architecture proposal.

Primary objective: Reduce unnecessary Firebase reads, writes, network requests, and synchronization overhead while improving task editing, collaborative consistency, offline reliability, and responsiveness.

Correctness, security, recoverability, and existing business logic must never be sacrificed to reduce costs.

Work locally using Firebase CLI and the existing emulator infrastructure. Do not deploy to production.

---

0. SOURCE OF TRUTH AND BASELINE

Inspect the current repository and follow AGENTS.md before making changes.

The authoritative baseline is the actual v0.8.4 implementation, not the original v0.8.3 source or earlier Niyarvo Projects prototypes.

Read the following existing documents:

- docs/cloud/00-current-architecture-v0.8.3.md
- docs/cloud/01-cloud-architecture.md
- docs/cloud/02-database-schema.md
- docs/cloud/03-iam-permission-matrix.md
- docs/cloud/04-sync-engine.md
- docs/cloud/05-caching-strategy.md
- docs/cloud/06-canvas-collaboration.md
- docs/cloud/07-administration-and-billing.md
- docs/cloud/08-backup-and-recovery.md
- docs/cloud/09-security-test-report.md
- docs/cloud/10-performance-benchmarks.md
- docs/cloud/11-firebase-cost-model.md
- docs/cloud/12-risk-register.md
- docs/cloud/13-deployment-readiness.md
- docs/qa/cloud-084/REPORT.md

Also inspect the actual Firebase server, client, security rules, journal, cost model, and benchmark source.

Verified v0.8.4 baseline

General tests:

- 1,015 passed.
- 0 failed.
- 2 emulator-dependent tests skipped in the general test run.
- 51 additional cloud tests passed with running emulators.

Measured emulator fixture:

- Cold hydration: 132 instrumented reads.
- Warm unchanged pull: 3 reads.
- Cached hydration: 3 reads.
- Project summary: 4 reads.
- Simple task mutation: 135 instrumented reads.
- Task mutation: 6–7 writes.
- Eight task-save samples: approximately 284.5 ms median, 566.8 ms observed upper sample.
- Offline journal: 1,000 mutations stored in 7.64 seconds, approximately 3.53 MB.

Existing cloud capabilities include:

- Multi-tenant authorization and IAM.
- Organization membership and scoped grants.
- Teams and departments.
- Invitations, guests, seat allocations, and simulated billing.
- Granular Firestore records.
- Incremental cloud synchronization.
- Durable offline mutation journal.
- Revision and conflict detection.
- Idempotent server operations.
- Local and shared caching.
- Canvas synchronization and presence.
- Messaging, mentions, watchers, and notifications.
- Platform and organization administration.
- Signed mock billing events.
- Cloud export and staged recovery.

All these capabilities must be preserved. Do not rebuild them unnecessarily.

Inspect the actual source and verify this baseline before changing code.

Preserve all v0.8.4 QA evidence. Put new evidence under docs/qa/cloud-085.

---

1. INVESTIGATE THE 135-READ MUTATION BOTTLENECK

This is the highest-priority engineering task.

A normal task field modification currently produces 135 instrumented reads in the small benchmark fixture.

The documented root cause is broad server-side project validation.

We need to understand exactly why those reads occur and remove unnecessary work.

Instrument the complete task mutation path:

1. Local task modification.
2. Domain validation.
3. Mutation journal creation.
4. Network request.
5. Authentication verification.
6. Organization and project authorization.
7. Existing-record lookup.
8. Revision/conflict verification.
9. Domain integrity validation.
10. Firestore transaction.
11. Version/receipt/audit persistence.
12. Sequence and summary updates.
13. Response and local reconciliation.

Produce a precise read/write breakdown by source and purpose.

Separate:

- Client SDK reads.
- Trusted backend document reads.
- Transaction reads.
- Authorization lookups.
- Validation reads.
- Security Rules dependent reads.
- Listener-delivered reads.
- Instrumented emulator calls.
- Estimated production-billable operations.

Do not equate instrumented calls with certified production billing.

Required optimization

A simple task edit must not read every task in its project.

Changing a title, description, priority, or an independent custom field should use bounded validation rather than reconstructing the entire project.

Design operation-specific validators.

Validation classes

Class A — Independent field changes

Validate the changed task, the allowed fields, current permissions, revision, and any directly relevant configuration.

Class B — Membership/workflow-sensitive changes

Validate task assignments, configured workflow transitions, and relevant resource membership.

Class C — Structural changes

Validate the affected hierarchy or dependency subgraph, not every unrelated project record.

Examples include parent changes, dependency changes, scheduling operations, and cross-project moves.

Class D — Complex multi-record operations

Preserve atomic canonical validation for sprint, release, verification, automation, bulk-edit, Canvas grouping, and restoration operations.

Class E — Destructive operations

Prioritize data integrity, authorization, audit, and recovery over the lowest operation count.

Critical safeguard

Milvayo has complex domain invariants:

- Dependency cycles and precedence.
- WBS hierarchy.
- Task parent/child relationships.
- Configurable workflows.
- Release verification.
- Frozen sprint histories.
- Scheduling constraints.
- Automation side effects.
- Project-specific governance.
- Canvas anchors and canonical references.

Do not introduce validators that bypass these rules.

Use differential testing against the existing full-project validator to establish equivalence for supported mutation classes.

For each optimization, test invalid input as rigorously as valid input.

---

2. FIRESTORE OPERATION BUDGETS

Establish measured operation budgets by mutation class.

Target for an existing locally cached task

- Zero redundant client fetches before saving.
- One task-document update.
- Zero task-document deletes.
- No full-project scan.
- Changed fields only in the network payload.
- Bounded server-side authorization and revision checks.
- Only justified additional audit, receipt, sequence, and summary writes.

For a simple field mutation, aim for a small, constant number of backend reads, preferably no more than five in the common authenticated case.

Aim to reduce total synchronous writes substantially from six or seven, while preserving necessary recovery and idempotency guarantees.

These are optimization targets, not permission to remove indispensable security or consistency operations.

A trusted server may need to read the current task to verify its revision. Do not claim that a server-validated transaction always costs zero billed reads.

Where extra operations remain, explain their exact purpose.

Scaling acceptance

Run the same simple mutation in projects containing:

- 10 tasks.
- 100 tasks.
- 500 tasks.
- 2,000 tasks.
- 10,000 tasks when host resources permit.

The number of server reads for an independent field edit should not increase linearly with project size.

If it does, investigate and correct that path.

Introduce an automated performance regression test for this requirement.

---

3. SMART TASK SAVING

Improve the task editing experience while reducing cloud operations.

The user's intended model is:

Edit locally, consolidate changes, and synchronize meaningful final edits—not every keystroke.

Implement this across the actual standard and advanced task-editing paths.

Local saving

All accepted edits must be persisted durably to the existing local storage/journal.

This must work even when Firebase is offline.

Never depend exclusively on the user pressing Save or closing the task to avoid data loss.

Explicit Save action

Add or integrate a clear Save action in the task editor, consistent with Milvayo's existing interface.

Do not add duplicate or oversized header controls.

When pressed:

1. Finalize the local draft.
2. Validate the combined changes.
3. Consolidate compatible pending edits.
4. Persist the final local mutation durably.
5. Synchronize through the existing trusted backend.
6. Display the correct acknowledgment state.

Do not falsely report cloud synchronization before receiving the server acknowledgment.

Saving behavior

Implement the following starting policy:

Interaction| Behavior
User types| Update local draft; no Firestore write per keystroke
User presses Save| Flush consolidated changes immediately
User closes task| Flush pending changes
User changes focus| Commit the completed field appropriately
User commits status/assignment| Synchronize promptly
Long uninterrupted editing| Periodic cloud synchronization, initially configurable at 30–60 seconds
Application backgrounds| Preserve draft and queued mutation durably
Network unavailable| Keep pending edits locally
Network returns| Replay safely
Unchanged task| No cloud mutation

Also benchmark a configurable 10-minute batching/checkpoint strategy to quantify its cost benefit and collaboration staleness risk.

Do not make ten-minute delayed synchronization the only saving mechanism.

A ten-minute recovery checkpoint should not retransmit an unchanged task.

Consolidation

Example:

A user changes a task's title five times, edits its description, updates the priority twice, and sets a deadline.

The system should send the final compatible field changes in one logical mutation rather than eight independent updates.

Do not merge separate comments, approval actions, automation transitions, or operations whose ordering has business meaning.

Avoid creating duplicate mutations through blur, Save, and close events occurring together.

Sync state interface

Show meaningful states:

- Saved locally.
- Unsaved draft.
- Synchronizing.
- Synchronized.
- Offline, pending synchronization.
- Conflict requiring review.
- Failed, retry available.

Preserve the current app's premium minimal UI. No overall redesign is requested.

---

4. OPTIMIZE REVISION, RECEIPT, AUDIT, AND SUMMARY WRITES

The v0.8.4 backend writes several supporting records during task mutations.

Investigate each one:

- Canonical task record.
- Immutable version.
- Mutation receipt.
- Workspace sequence.
- Project summary.
- Audit event.
- Other metadata.

For each, determine:

- Is it mandatory for correctness?
- Is it mandatory for audit/recovery?
- Must it be written synchronously?
- Can compatible metadata be stored in an existing record?
- Can it be derived or updated later?
- Would moving it asynchronously introduce missed updates or inconsistent permissions?
- Does it cause a document contention hotspot?

Avoid unnecessary summary writes for edits that do not affect the summary.

For instance, if the summary only stores task counts and statuses, changing a description should not modify that summary.

Likewise, do not create redundant durable version records for meaningless no-op changes.

Keep idempotency receipts and audit evidence where required.

Measure the write reduction achieved.

---

5. SOLVE CENTRAL SEQUENCE CONTENTION

The current shared workspace sequence document serializes mutations.

This protects ordering but may become a bottleneck when several collaborators save simultaneously.

Investigate three approaches:

1. Existing central workspace sequence.
2. Project-scoped sequencing.
3. Partitioned mutation/change journals with safe incremental cursors.

You may investigate additional designs if the evidence justifies them.

Correctness requirements

Do not permit:

- Missed committed changes.
- Duplicate application of one operation.
- Cursor advancement beyond unseen changes.
- Cross-project moves disappearing.
- Inconsistent multi-record changes.
- Missed events after interrupted commits.
- Incorrect ordering after retries.
- Unauthorized data appearing through sequence aggregation.

Test genuinely concurrent requests against the emulators.

Use bounded runs with increasing concurrency, for example 2, 10, 25, 50, and 100 concurrent actors or operations as host capacity permits.

Measure:

- Transaction retries.
- Aborted transactions.
- Successful commits.
- Throughput.
- p50/p95/p99 latency.
- Sequence conflicts.
- Hot-document contention.
- Reads and writes per committed operation.

Do not replace the central sequence mechanism merely because an alternative looks faster in a synthetic model.

Implement an alternative only if its ordering and recovery guarantees are demonstrated.

If no alternative proves sufficiently safe, retain the original and document its measured limits.

---

6. REDUCE UNNECESSARY POLLING

The v0.8.4 cost model assumes:

- 240 active-session synchronization polls per user/day.
- 120 conversation polls per user/day.
- Seven conversation reads per poll.

These are workload assumptions, not measured real-user behavior.

Investigate actual polling behavior in the current implementation.

Evaluate:

- Adaptive foreground polling.
- Longer polling intervals on unchanged workspaces.
- Immediate refresh after a local commit.
- Targeted refresh after a relevant collaboration signal.
- Scope-specific project synchronization.
- Low-frequency polling for inactive screens.
- Bounded message-history paging.
- Realtime Database signaling where secure and appropriate.
- Firestore listeners for narrowly scoped resources where their billed-read cost is justified.

Compare event-assisted refresh against constant polling.

Do not convert the entire workspace into one permanent broad Firestore listener.

Do not use Firestore for high-frequency typing or presence updates.

Keep collaboration responsive without unnecessarily polling idle workspaces.

Measure synchronization visibility latency and its cost tradeoff.

---

7. IMPROVE LOCAL AND CLOUD CACHING

Preserve the proven v0.8.4 cache behavior:

- Cold pull: 132 instrumented reads.
- Warm unchanged pull: 3 reads.
- Scoped record-response cache.
- Incremental project summaries.
- Fresh authorization checks.

Optimize further where justified by benchmarks.

Important requirements:

- No authorization bypass through cached records.
- No cross-organization cache contamination.
- No stale access after revocation.
- No sharing private content through public caches.
- No silent reuse of another account's workspace data.
- No cache corruption causing loss of pending edits.
- No automatic paid Redis/Memorystore dependency.

Measure cold/warm/hot-cache response time, reads, bytes, hit ratios, and invalidation behavior.

Preserve secure separation among local workspaces, remote borrowed workspaces, organizations, users, and backend environments.

---

8. OFFLINE JOURNAL OPTIMIZATION

The current journal stores 1,000 operations in approximately 3.53 MB and 7.64 seconds on the benchmark host.

It uses checksum-protected, sharded generations and preserves a previous valid generation.

This is valuable and must not be weakened.

Investigate write amplification caused by copying complete journal generations.

Improve:

- Journal append efficiency.
- Safe compaction.
- Duplicate-operation consolidation.
- Chunk allocation.
- Storage growth.
- Recovery after interrupted writes.
- Replay performance.
- Retention of unacknowledged operations.

Pending user work must never be discarded because of an LRU policy or a compaction error.

Test process termination at critical write boundaries.

Test storage failure, invalid manifests, corrupted chunks, lost acknowledgments, and repeated reconnects.

Do not silently replace a corrupted queue with an empty one.

Web multi-tab consistency

The existing implementation does not guarantee safe concurrent local writing from multiple tabs.

Investigate a same-origin single-writer or coordinated-writer strategy using supported web primitives.

Use Web Locks and appropriate tab coordination when available, with a safe fallback.

Test two real browser tabs modifying the same local workspace.

Maintain the same security and revision guarantees as single-tab operation.

Do not alter stable Expo/Metro configuration merely to fix an Android PRoot browser-watcher limitation.

---

9. CONFLICT HANDLING AND USER EXPERIENCE

v0.8.4 already merges some independent fields and rejects conflicting same-field changes.

Preserve this.

Add an understandable conflict-resolution experience for cases that cannot be merged automatically.

Examples:

- Two users edit the same description.
- One user deletes a task while another edits it.
- Two collaborators reorder the same cards.
- Dependency changes arrive while a task is reassigned.
- Canvas objects are moved or edited concurrently.
- An offline contributor reconnects after other users modified the task.

The user must be able to compare local and remote versions and deliberately choose or reconcile changes.

Never silently discard a user's local changes.

Keep the original mutation journal available until the conflict is resolved.

Make the resolution action itself an authorized, revision-checked, idempotent mutation.

Preserve the current version, old version, and actor information needed for recovery.

Do not introduce full CRDT/OT complexity without evidence that the existing Canvas or task editors require it.

---

10. PRESERVE EXISTING COLLABORATION AND IAM

Do not rebuild the collaboration systems already implemented in v0.8.4.

Preserve:

- Organization isolation.
- Project grants and overrides.
- Explicit team and department relationships.
- Guest restrictions.
- Unique paid-seat allocation.
- Resource caps.
- Platform role separation.
- Messaging and pagination.
- Watchers and mentions.
- Private pointer-only notifications.
- RTDB presence.
- Canvas edit indicators.
- Revocation and ACL-expiry safety.
- Staged recovery of conversations and archived records.

Optimization must not allow stale or unauthorized clients to regain access.

Add or refine rate limits on sensitive operations where practical, without blocking legitimate retries or requiring a live Firebase project.

Keep Firebase App Check and real enterprise billing as separately documented production gates unless local integration can be safely verified without changing live services.

No real payment processing.

---

11. CANVAS-SPECIFIC OPTIMIZATION

Milvayo Canvas is a vector planning editor with canonical-linked objects, connectors, threads, and diagrams.

Respect existing limits, including the 1,000-object-per-board limit.

Do not introduce per-gesture cloud writes.

Maintain the current behavior in which gesture previews stay local and committed interactions create a bounded mutation.

Optimize:

- Element-level cloud updates.
- Board metadata writes.
- Multi-element groups.
- Connector reference validation.
- Local undo/redo and cloud acknowledgment.
- Offline Canvas editing.
- Competing element changes.
- Canvas response caching.
- Scene/geometry rendering performance.

Benchmark these operations separately from ordinary task edits.

Preserve native UI-thread gestures and current web Canvas interactions.

Do not make canvas panning or zooming depend on network latency.

---

12. AUTHENTICATION, PRIVACY, AND RECOVERY THREAT MODEL

The v0.8.4 implementation deliberately uses memory-only Firebase authentication and retains pending cloud edits in scoped local journals.

Preserve its fail-closed security behavior until an alternative is demonstrably safer.

Investigate:

- Device restart during offline editing.
- Cloud workspace reopening after restart.
- Account switching.
- Logged-out local cache exposure.
- Shared-device risks.
- Retained private journal contents.
- Safe cache deletion or encryption policies.
- Revoked permissions during offline use.
- Staged restoration interrupted by process termination.

Do not silently enable persistent authentication or automatically expose borrowed cloud data on a shared device.

Document the recommended production policy and implement only changes that can be thoroughly tested locally.

Preserve existing JSON/niyav compatibility and cloud backup v1/v2 readers.

Do not remove the large-backup staged recovery mechanism.

---

13. IMPROVE BENCHMARKS AND COST ESTIMATION

Extend the existing benchmark and cost harness rather than replacing it.

Preserve historical cloud-084 results.

Use the actual v0.8.5 implementation for new measurements.

Required benchmark scenarios

- Solo user: 200 tasks.
- Small team: 500 tasks.
- Medium project: 2,000 tasks.
- Large-project bounded run.
- Canvas with 25, 100, 500, and 1,000 objects.
- Concurrent task editors.
- Offline replay.
- Repeated Save events.
- Multiple local edits consolidated into one mutation.
- Permission revocation during editing.
- Multi-tab editing.
- Cold and warm synchronization.
- Active versus idle conversation polling.
- Large project structural validation.

Record read/write/delete operation counts separately for:

- Client.
- Trusted server.
- Transactions.
- IAM checks.
- Validation.
- Version/audit/receipt writes.
- Summaries.
- Conversation operations.
- Listener deliveries, where measured.

Latency

Use more samples than the eight-save v0.8.4 fixture.

Aim for at least 100 common-path saves in a bounded repeatable run.

Record p50/p95/p99, sample size, retries, and failures.

Run baseline and optimized implementations under comparable conditions.

The development host is Android ARM64 with PRoot, Node 24, and Java 21.

Do not present host timings as production network latency, Android UI FPS, or certified Cloud Functions performance.

Cost model

Retain separate estimates for:

- 100 active users.
- 1,000 active users.
- 10,000 active users.
- 100,000 active users.

Compare:

1. v0.8.4 baseline.
2. v0.8.5 optimized mutations.
3. v0.8.5 optimized polling and caching.
4. Combined optimized architecture.
5. High-concurrency stress assumptions.

Use the existing configurable regional price table and verify the units and allowances before regenerating projections.

Distinguish:

- Spark availability.
- Blaze free allowances.
- Metered Blaze usage.
- First-use paid services.
- Unpriced infrastructure.
- Emulator measurements.
- Production cost estimates.

Do not report an incomplete subtotal as a complete Firebase bill.

Do not automatically activate Blaze or create any billable resource.

---

14. PERFORMANCE AND COST ACCEPTANCE CRITERIA

The important outcome is how costs behave as Milvayo scales.

Require:

A. Bounded simple-edit reads

Ordinary task edits must no longer scan the entire project.

B. Reduced synchronous writes

Remove redundant metadata writes while preserving required receipts, history, and audit.

C. Consolidated editing

Multiple compatible local changes should normally produce one logical cloud mutation.

D. Correct synchronization

No lost or silently overwritten user work.

E. Safe collaboration

Users receive authorized updates without excessive background polling.

F. No performance regression

Existing mobile and web interaction performance must remain stable.

G. Real benchmarks

Every improvement must include a measured before/after comparison.

H. Security equivalence

Existing IAM and adversarial tests must continue passing.

If an optimization cannot meet one criterion safely, retain the existing behavior and document the tradeoff.

---

15. FULL REGRESSION VERIFICATION

Run the complete existing test suite.

Run emulator-backed cloud tests separately.

Preserve:

- Kanban drag/drop, filtering, and ordering.
- Task sheets and advanced task editors.
- Gantt and dependency management.
- Scheduling rules and working calendars.
- Sprints and releases.
- Portfolio and program governance.
- Canvas geometry, gestures, and exports.
- Workspace import/export.
- Existing encrypted backups.
- Cloud workspace recovery.
- Messaging and notifications.
- Platform and organization IAM.
- Seat and billing simulation.
- Offline journal recovery.

Use negative security tests as well as positive tests.

Do not weaken existing assertions simply to obtain passing results.

Keep expected permission-denied results distinguishable from unexpected errors.

When available, run real Chromium tests for web saving and multi-tab behavior.

Physical Android Expo Go acceptance is required before declaring full mobile readiness. If unavailable in the execution environment, mark it untested.

---

16. REQUIRED DOCUMENTATION

Create:

docs/qa/cloud-085/

Include:

- Task mutation root-cause analysis.
- Mutation-type validation matrix.
- Before/after operation counts.
- Smart Save behavior and synchronization policy.
- Sequence contention experiments.
- Polling and cache experiments.
- Offline journal tests.
- Multi-tab consistency tests.
- Canvas synchronization results.
- Security and regression results.
- Updated cost projections.
- Remaining risks.
- Deployment-readiness assessment.
- Final summary report.

Preserve the existing cloud-084 results as the comparison baseline.

Update the relevant docs/cloud architecture sections where actual implementation behavior changes.

Follow AGENTS.md.

Maintain the project's single cumulative changelog at docs/changelog/CHANGELOG.md. Do not create competing release changelogs.

Use machine-readable JSON/CSV for measurements and Markdown for explanations.

---

17. IMPLEMENTATION EXECUTION PLAN

Proceed in this order:

Phase 1 — Audit and instrumentation

Verify v0.8.4, protect existing work, reproduce the 135-read baseline, and identify each operation.

Phase 2 — Mutation validation optimization

Implement safe narrow validators, compare their results against canonical full validation, and benchmark different project sizes.

Phase 3 — Smart task saving

Introduce consolidated local drafts, explicit Save, configurable sync triggers, accurate status indicators, and crash/offline protection.

Phase 4 — Metadata write optimization

Reduce unnecessary receipt/version/sequence/summary operations without compromising guarantees.

Phase 5 — Sequence and polling experiments

Measure contention with real concurrent emulator requests and optimize refresh behavior.

Phase 6 — Cache and journal improvements

Improve cache reuse, journal compaction, offline replay, and multi-tab consistency.

Phase 7 — Conflict UX and Canvas validation

Implement safe conflict resolution and regression-test Canvas synchronization.

Phase 8 — Full QA and cost simulations

Run all existing tests, new security tests, performance benchmarks, and revised cost estimates.

Fix discovered regressions before concluding.

Avoid broad unrelated refactors.

---

18. SAFETY AND GIT RESTRICTIONS

- Work from the current repository and established development branch/worktree.
- Preserve unrelated uncommitted changes.
- Do not delete the project or reset the Git tree.
- Do not change production Firebase credentials.
- Do not run firebase deploy.
- Do not log in to Firebase automatically.
- Do not enable Blaze.
- Do not create real Firebase projects.
- Do not send real payment requests.
- Do not push or merge branches.
- Do not commit automatically.
- Do not disable existing security rules.
- Do not change Metro configuration merely to work around PRoot watcher limitations.
- Do not change local workspace schemaVersion unnecessarily.

Use the existing demo-milvayo-083 emulator environment.

Inspect whether the current test harness is already running before starting additional emulators.

Limit memory-heavy experiments to bounded workloads suitable for the Android ARM64/PRoot host.

If a task is blocked by physical-device access or production-only Firebase services, document the blocker rather than claiming success.

Synchronize the app's version/build metadata to v0.8.5 according to repository conventions once the implementation is ready for verification.

---

19. FINAL REPORT

When the work is finished, give me a technical report answering:

1. Why did v0.8.4 need 135 reads for a task update?
2. How many reads does v0.8.5 now require?
3. How many writes does an ordinary task update require?
4. How much did the cost per active user decrease?
5. Does the new Save button work correctly?
6. How many edits can be consolidated into one cloud mutation?
7. Can two users edit different task fields without losing changes?
8. Has workspace sequence contention improved?
9. How much polling traffic was eliminated?
10. Does Canvas still synchronize correctly?
11. Is the offline journal more efficient and equally safe?
12. Does multi-tab editing now work without corruption?
13. Did all original and new tests pass?
14. Which items still require Android or production verification?
15. What is the new projected cost for 100, 1,000, 10,000, and 100,000 active users?

Provide a clear table:

Metric| v0.8.4| v0.8.5| Improvement
Reads per simple task update| Measured baseline| Measured| Percentage
Writes per simple task update| Measured baseline| Measured| Percentage
Simple task save latency| Measured baseline| Measured| Percentage
Warm synchronization reads| Measured baseline| Measured| Percentage
Polling requests/day| Modeled or measured baseline| Same basis| Percentage
Journal storage per 1,000 edits| Measured baseline| Measured| Percentage
Monthly infrastructure estimate| Modeled baseline| Same assumptions| Percentage

Do not invent unavailable measurements.

Conclude with an explicit statement of whether v0.8.5 is ready for the next development phase, and distinguish emulator readiness from production readiness.

Begin with the source audit and 135-read investigation. Then implement, test, benchmark, and refine the complete v0.8.5 optimization. Do not stop at a plan or a documentation-only result.