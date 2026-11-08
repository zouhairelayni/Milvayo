CODEX MASTER TASK — MILVAYO v0.8.5

V1.0 Firebase Cloud Architecture, Multi-Tenant IAM, Collaboration, Canvas Sync, Caching, Disaster Recovery, and Performance/Cost Engineering

ROLE AND OBJECTIVE

Act as the principal software architect, Firebase backend engineer, security engineer, synchronization engineer, and performance-testing lead for Milvayo.

Your task is to design, implement, test, benchmark, and document a complete local-first Firebase architecture for the existing Milvayo application.

Milvayo is a cross-platform project-management product supporting individuals, companies, teams, projects, programs, portfolios, task boards, Gantt timelines, sprints, releases, and now Canvas.

CURRENT APPLICATION BASELINE: v0.8.3.

The architecture must support web, Android, and iOS while preserving Milvayo's current business logic, interface, responsiveness, local persistence, and data formats.

This is not a hypothetical architecture document. Implement working local infrastructure, integration code, security rules, tests, benchmarks, and administration interfaces.

Use Firebase CLI and the Firebase Local Emulator Suite. All initial development and verification must be fully local.

Do not stop after writing a proposal. Execute the implementation phases, run tests, fix discovered issues, and produce measured results.

---

0. MANDATORY SOURCE AUDIT

Before changing anything, inspect the complete repository.

The current source is authoritative. Older versions of Niyarvo Projects or Milvayo must not be used to infer the current architecture.

Specifically investigate:

- Actual application version and Git state.
- Expo, React Native, and web dependencies.
- Application entry points and navigation.
- Central store and mutation paths.
- Workspace serialization and persistence.
- Project, portfolio, and program relationships.
- Task, sprint, release, and schedule models.
- Kanban ordering and Gantt dependency logic.
- Current Canvas implementation and its data representation.
- Existing validation and business constraints.
- Workspace import/export and backup formats.
- Local persistence, caching, and recovery logic.
- Existing authentication, networking, or Firebase code.
- Existing test suites and performance instrumentation.
- Hosting/build configuration.
- Current feature and screen boundaries.

Determine whether Canvas is a drawing surface, diagram editor, workflow canvas, or another type of workspace interface. Do not assume its data model.

Document exactly which features currently use shared workspace state.

Identify operations that modify multiple related entities.

Inventory every persistent entity and relationship.

Produce:

"docs/cloud/00-current-architecture-v0.8.3.md"

Include an entity inventory, current data-flow diagram, mutation map, Canvas architecture, and a compatibility-risk assessment.

Run the existing test suite and record its baseline before modifying anything.

Working tree protection

Never delete or reset the existing application folder.

Do not delete or overwrite unrelated changes.

Use a dedicated Git branch or a safe worktree for cloud architecture development.

If the worktree contains uncommitted changes, preserve them without automatically stashing, discarding, or overwriting them.

Do not commit, merge, or push automatically.

Do not change application version numbers unless the repository's established process requires it.

---

1. LOCAL FIREBASE DEVELOPMENT ENVIRONMENT

Configure Firebase using the official Firebase CLI and Local Emulator Suite.

Required emulators:

1. Firebase Authentication.
2. Cloud Firestore.
3. Realtime Database.
4. Cloud Functions.
5. Cloud Storage.
6. Firebase Hosting where practical.

Use this emulator project identifier:

"demo-milvayo-083"

Do not associate the local testing configuration with a real Firebase project.

Required configuration should include, as appropriate:

- "firebase.json"
- ".firebaserc"
- Firestore Security Rules.
- Realtime Database Security Rules.
- Cloud Storage Security Rules.
- Firestore indexes.
- Local Cloud Functions.
- Emulator configuration.
- Environment-specific Firebase initialization.
- Reproducible test scripts.
- Deterministic local seed data.

Use supported package versions compatible with the existing Expo and React Native stack.

Inspect the environment first. Development may be taking place under Termux or a Debian environment on Android ARM64.

Verify Node.js, Java, Firebase CLI, available memory, disk capacity, and emulator compatibility.

Use Java 21 or later where required by the installed Firestore emulator.

Configure emulator memory usage conservatively. Heavy benchmark workloads must run in bounded batches rather than exhausting the development device.

Do not assume a conventional desktop development environment.

Make emulator host configuration compatible with web and physical Android testing. Avoid accidentally directing mobile clients to the production database.

Absolute safety rules

- Never execute "firebase deploy".
- Never enable Firebase Blaze automatically.
- Never create production databases or live Firebase projects.
- Never call real payment APIs.
- Never use real customer data in benchmarks.
- Never expose API keys, service credentials, or secrets.
- Never configure an application fallback that silently connects to production Firebase if an emulator is unavailable.
- Never disable authorization merely to make tests pass.
- Do not initiate Firebase login without explicit permission.

All tests must use the "demo-" project, and any non-emulated Firebase service must fail closed.

If an emulator cannot run in the current environment, report the exact limitation and implement the maximum verifiable isolated test coverage possible. Never label a skipped test as passed.

---

2. MULTI-TENANT FIRESTORE DATA ARCHITECTURE

Design and implement an organization-aware database that supports:

Individuals

A single personal account with one or more workspaces and projects.

Personal users should not need to configure unnecessary enterprise structures.

Small businesses

Organizations with:

- Multiple members.
- Multiple teams.
- One or more workspaces.
- Independent projects.
- Team collaboration.
- Shared or private projects.
- External stakeholders.

Enterprises

Organizations with:

- Departments and workspaces.
- Multiple teams.
- Multiple portfolios.
- Programs containing multiple projects.
- Projects outside programs.
- PMO oversight.
- Contractors and guests.
- Project-specific confidentiality.
- Granular permissions.
- Organization administration.
- Subscription and seat governance.

A single authenticated person may belong to multiple independent organizations.

No organization must be able to read or modify another organization's data unless an explicitly designed, securely authorized cross-organization collaboration feature permits that specific access.

Data model requirements

Investigate and implement a scalable schema covering the actual v0.8.3 entities.

Candidate resource families include:

- Users and user profiles.
- Organizations.
- Organization memberships.
- Workspaces.
- Workspace memberships.
- Teams and departments.
- Portfolios.
- Programs.
- Projects.
- Tasks and subtasks.
- Sprints.
- Releases.
- Milestones.
- Gantt dependencies.
- Resources and assignments.
- Canvas documents/elements.
- Comments.
- Discussions and messages.
- Mentions and watchers.
- Attachments.
- Invitations.
- Activity events.
- Audit records.
- Permission grants.
- Seat allocations.
- Subscription entitlements.
- Sync metadata.
- Recovery checkpoints.

This is an inventory, not permission to replace existing models with generic ones.

Choose collection boundaries based on:

1. Required security isolation.
2. Query patterns.
3. Independent update frequency.
4. Offline synchronization requirements.
5. Firestore operation costs.
6. Transaction boundaries.
7. Document size constraints.
8. Referential integrity.
9. Migration compatibility.

Preserve stable IDs when records move between projects or hierarchy levels.

Do not enforce unnecessary rigid nesting of projects under programs and portfolios.

Explicitly distinguish organizational relationships from security authorization relationships.

Provide entity relationship diagrams and example records based on the actual source model.

Avoid using one giant Firestore document per workspace.

---

3. ROBUST LOCAL-FIRST SYNCHRONIZATION ENGINE

Implement an incremental synchronization architecture, not repeated full-workspace uploads.

The existing application must remain usable when offline.

Required layers

Local persistence

Preserve and extend the existing local persistence system.

Do not rewrite the store unnecessarily.

Durable mutation queue

Maintain pending operations with:

- Unique mutation ID.
- Authenticated actor.
- Organization/workspace scope.
- Entity ID.
- Operation type.
- Base revision.
- Change payload.
- Local creation time.
- Retry state.
- Idempotency key.
- Synchronization status.

Cloud synchronization adapter

Translate valid local domain mutations into secure Firestore operations.

Reconciliation

Fetch remote changes incrementally, deduplicate events, resolve conflicts, and update local state without damaging valid work.

Required behavior

- Optimistic local updates.
- Durable offline edit queue.
- Ordered processing for dependent operations.
- Concurrent processing where safely independent.
- Exponential retry backoff with jitter.
- Idempotent operation execution.
- No duplicate creation after retries.
- Clear failed-operation handling.
- Network reconnection recovery.
- Partial failure detection.
- Multi-device synchronization.
- Initial workspace hydration.
- Incremental subsequent synchronization.
- Revision and version tracking.
- Time-skew tolerance.
- Authentication expiration handling.
- Permission revocation handling.
- Recovery after application termination.
- Safe migration across schema versions.

Do not use client timestamps alone to determine authoritative update ordering.

Conflict management

Implement an explicit conflict policy.

Distinguish:

- Independent field edits.
- Concurrent updates to the same field.
- Task reordering.
- Status changes.
- Parent-child moves.
- Dependency changes.
- Project reassignment.
- Record deletion versus modification.
- Canvas element changes.
- Large-text concurrent editing.
- Multi-document operations.

Safe independent edits should merge when possible.

Conflicting edits must not silently overwrite valid data.

Use transactions or equivalent atomic server-side operations for operations requiring consistency across multiple documents.

Preserve the existing domain validators and introduce trusted server-side validation where necessary.

For complex text collaboration, investigate whether a CRDT/OT design is justified rather than prematurely implementing one.

Hard requirements

Typing, pointer movement, scrolling, and dragging must not produce persistent Firestore writes for every event.

A simple task change should ideally require one task-document update plus any justified audit/history writes.

Batch or debounce compatible changes without silently discarding important user actions.

Use optimistic updates without causing excessive global rerendering.

---

4. THREE-LAYER CACHING ARCHITECTURE

Investigate and implement a cost-efficient caching system.

Layer A — Device cache

Use appropriate local storage for each supported platform.

Consider:

- Existing application persistence.
- IndexedDB for web where appropriate.
- Supported durable storage for mobile.
- In-memory hot record cache.
- Cache schema versioning.
- LRU or bounded eviction.
- Offline query capability.
- Cached project/task indexes.
- Secure cleanup on logout or access revocation.

Verify actual Firebase SDK support on Expo/React Native before selecting persistence APIs.

Do not assume that Firestore's browser persistence works identically inside Expo Go.

Layer B — Shared cloud read models

Create reusable, access-controlled summaries and projections, such as:

- Project dashboard summaries.
- Board column counts.
- Sprint progress.
- Portfolio progress.
- Program health.
- Organization summary metrics.
- Team workload summaries.
- Recent activity summaries.
- Canvas overview metadata.

Materialize summaries only when measurements demonstrate their value.

Avoid requiring each user to read hundreds of raw documents just to display a dashboard.

Use incremental summary updates rather than full recomputation after every modification.

Ensure that summarized information cannot leak unauthorized project data.

Layer C — Optional server-side caching

Evaluate low-cost options first:

- Short-lived in-process caches.
- Coalescing duplicate requests.
- Read-through caching.
- Bounded TTL.
- Event/version-based invalidation.
- Cached authorized projections.

Evaluate Redis/Memorystore or equivalent paid services as optional future infrastructure, not as an automatic dependency.

Do not introduce an extra paid caching service unless benchmarks establish a clear benefit.

Cache consistency

Test:

- Cache invalidation after updates.
- Cross-device changes.
- Role revocation.
- Project reassignment.
- Workspace switching.
- Organization switching.
- Offline stale data.
- Cache corruption.
- Logout and login as a different user.
- Application upgrades.

Measure cache-hit ratios, cold-start reads, warm-start reads, transferred bytes, and stale-data windows.

Private customer data must not be exposed through public CDN caching.

---

5. CANVAS CLOUD SYNCHRONIZATION

Milvayo v0.8.3 includes Canvas.

Inspect its actual implementation before designing persistence.

Preserve current Canvas behavior, layout, interactions, performance, import/export behavior, and undo/redo functionality.

Where the actual Canvas data model supports it, design granular synchronization of:

- Canvas metadata.
- Elements/nodes.
- Connections/relationships.
- Positions and geometry.
- Element properties.
- Grouping.
- Ordering/layers.
- Relevant references to projects/tasks.
- Editing sessions.
- Checkpoints and recovery versions.

Avoid saving an entire large Canvas document every time one element moves.

Use viewport-aware loading where appropriate.

Keep high-frequency movement local during interaction and persist meaningful committed changes at suitable boundaries.

Show other active Canvas collaborators when the product supports such an interaction.

Support offline edits and detect conflicts when users reconnect.

If Canvas requires a collaborative algorithm different from ordinary task records, isolate that algorithm behind its own adapter.

Do not introduce major new UI behavior without checking the existing feature semantics.

Benchmark Canvas specifically under:

- Hundreds and thousands of elements.
- Many simultaneous viewers.
- Frequent movement of elements.
- Simultaneous changes to the same element.
- Zooming and panning.
- Offline modifications.
- Large import/export.
- Reconnection after interrupted sync.

---

6. PRESENCE AND LIVE COLLABORATION

Use Realtime Database for ephemeral collaboration state where appropriate.

Required features:

- User online/offline indicator.
- Multiple active sessions per user.
- Users currently viewing a task.
- Users editing a task.
- Users viewing or editing Canvas.
- Typing indicators.
- Active conversation participants.
- Time-limited editing signals.
- Disconnect cleanup.
- Inactivity expiration.

Use Firebase "onDisconnect" appropriately.

A user must not appear offline merely because one of several sessions disconnects.

Presence must not create continuous Firestore writes.

Collaboration content

Use durable storage for:

- Task comments.
- Mentions.
- Watchers.
- Project discussions.
- Conversation messages.
- Activity notifications.
- Important task history.

A watcher must have legitimate read permission for the content being watched.

Implement secure notification targeting so unauthorized users cannot receive confidential task information through notifications.

Implement soft editing warnings before considering exclusive locks.

Example:

"Another member is currently editing the task description."

Presence and editing information must respect project-level confidentiality.

Secure Realtime Database access separately from Firestore.

Do not assume Firestore permissions automatically apply to Realtime Database.

Test disconnects, delayed presence expiration, unauthorized subscriptions, and high-frequency presence traffic.

---

7. IDENTITY AND ACCESS MANAGEMENT

Build a complete, explicitly scoped IAM architecture.

There must be a strict separation between:

A. Milvayo Platform Administration

Examples:

- Platform Owner.
- Platform IAM/Security Admin.
- Platform Operations Admin.
- Billing and Refund Admin.
- Product/Release Admin.
- Support Operator.

These roles manage the Milvayo service itself.

They must not automatically inherit unrestricted access to private customer tasks, Canvas contents, documents, or conversations.

Separate Google Cloud infrastructure IAM from application-level platform roles.

Use audited, time-limited, explicitly authorized support access where necessary.

B. Organization Administration

Examples:

- Organization Owner.
- Organization Admin.
- Organization Security/Admin.
- Organization Billing Manager.
- Workspace Admin.
- PMO Director.

Organization administrators cannot modify Milvayo platform configuration, global subscriptions, or another organization's information.

C. Resource-Level Roles

Examples:

- Portfolio Manager.
- Program Manager.
- Project Manager.
- Team Lead.
- Contributor.
- Commenter.
- Stakeholder.
- Viewer.
- Watcher.

Watchers and subscribers are notification relationships, not unrestricted permissions.

Implement scoped role grants.

Distinguish read, create, edit, comment, manage, approve, administer, export, and delete permissions.

Support project-specific confidentiality and external guests.

Security requirements

- Default deny.
- No arbitrary self-promotion.
- No cross-organization leakage.
- No unauthorized membership assignment.
- No client-written billing entitlements.
- No client-written platform administrator roles.
- No privilege escalation through nested documents.
- Secure permission inheritance.
- Verified revocation.
- Explicit effective-access calculation.
- Trusted server-side privileged operations.
- Authorization checks on queries and mutations.
- Secure organization switching.

Firestore Security Rules must protect all client-facing collections.

Realtime Database Rules must protect presence and collaborative state.

Cloud Storage Rules must protect files.

Cloud Functions must independently authorize privileged operations because server SDKs bypass client Security Rules.

Use the Emulator Suite and Firebase rules testing tools for authorization tests.

Include negative tests as rigorously as successful-access tests.

---

8. SUBSCRIPTIONS, SEATS, AND LICENSING

Build local subscription and seat-management domain logic without charging real customers.

Seat model

Distinguish:

- Organization membership.
- Paid licensed user.
- Team membership.
- Project assignment.
- Portfolio access.
- Program access.
- Guest access.
- Watcher subscription.

One licensed person assigned to multiple projects must not count as multiple paid seats by default.

Support organization-wide license pools and optional project/portfolio allocation caps.

Do not hardcode final subscription pricing.

Build a provider-neutral payment abstraction supporting future web and app-store billing systems.

Required backend features:

- Subscription records.
- Plan entitlements.
- Seat capacity.
- Seat allocations.
- Invitation acceptance.
- Subscription upgrades/downgrades.
- Billing manager access.
- Payment status.
- Refund events.
- Webhook signature validation.
- Duplicate/replayed webhook handling.
- Grace-period policy hooks.
- Audit logging.

Use mocked payment providers and simulated signed webhooks locally.

Never make live payment requests.

Seat allocations must be concurrency-safe.

---

9. ADMINISTRATION AND MONITORING DASHBOARDS

Implement administration interfaces using Milvayo's existing design system, components, navigation conventions, and responsive behavior.

Do not rebrand or redesign the application.

Create separate access-controlled interfaces for:

Platform Administration Dashboard

- Platform usage overview.
- Organizations and subscriptions.
- Active user and organization counts.
- Seats and license usage.
- Function invocations and failures.
- Firestore operation counts.
- Realtime Database usage.
- Storage usage.
- Estimated infrastructure costs.
- Synchronization failures.
- Performance metrics.
- Platform feature flags.
- Release configuration.
- IAM administration.
- Security incidents and audit history.
- Payment/refund administration using mock providers.

Never expose API secrets or unrelated customer data.

Organization Administration Dashboard

- Members and invitations.
- Teams and departments.
- Workspaces.
- Portfolio/program/project access.
- Role assignments.
- Guest management.
- Seat allocation.
- Organization usage.
- Authorized activity logs.
- Organization billing overview.
- Data retention settings.
- Recovery permissions.

Project/PMO Administration

- Project roles and access.
- Team allocations.
- Portfolio/program oversight.
- Resource management.
- Stakeholder access.
- Project activity.
- Project snapshots and authorized recovery tools.

The dashboard should display actual local emulator and benchmark telemetry where available, not fabricated metrics.

Clearly identify simulated billing, projected usage, and measured operations.

Test every administration operation against its backend permissions.

---

10. BACKUPS, SNAPSHOTS, AND DISASTER RECOVERY

Preserve compatibility with Milvayo's existing local backup/export formats.

Design multiple layers of recovery:

1. Local undo/redo where supported.
2. Task/record revision history.
3. Soft deletion and recycle bin.
4. Workspace/project recovery checkpoints.
5. Exportable backup packages.
6. Disaster recovery from protected copies.
7. Future managed Firestore backups.
8. Future point-in-time recovery.

Implement a safe local backup and restore system against emulator data.

Restore must support:

- Previewing affected records.
- Validating schemas and references.
- Detecting missing dependencies.
- Restoring a single task.
- Restoring a project.
- Restoring a workspace.
- Recovering accidentally deleted records.
- Reconstructing related comments and Canvas references when applicable.
- Preserving audit history.
- Avoiding unwanted overwrites.
- Rolling back failed restore attempts.

Use soft deletion before irreversible cleanup.

Test corruption, interrupted exports, incomplete restore, duplicate IDs, schema mismatch, and failed migrations.

Firestore managed backups and PITR are Blaze features without a free Firestore allowance.

They cannot be fully verified through ordinary local emulation.

Implement integration interfaces, simulate restoration workflows locally, and explicitly document which production features remain unverified.

Never claim emulator testing validates managed PITR or production backup retention.

---

11. REALISTIC PERFORMANCE BENCHMARKS

Build a reproducible benchmark and simulation harness.

It must generate synthetic organizations, users, workspaces, projects, tasks, Canvas data, comments, and assignments.

Use deterministic seeds.

Evaluate both a straightforward baseline approach and the optimized architecture.

The objective is to establish measurable improvements—not merely claim that caching or batching is faster.

Workload profiles

Scenario A — Solo user

- One user.
- Several projects.
- Hundreds of tasks.
- Periodic workspace snapshots.
- Occasional Canvas activity.
- Intermittent offline use.

Scenario B — Small team

- 5–25 collaborating users.
- Multiple simultaneous board viewers.
- Concurrent task editing.
- Comments and watchers.
- Shared Canvas activity.
- Frequent project navigation.

Scenario C — Medium organization

- 50–200 users.
- Multiple teams and workspaces.
- Several portfolios and programs.
- Thousands of tasks.
- Shared project dashboards.
- Continuous collaboration throughout the day.

Scenario D — Enterprise

- Hundreds or thousands of synthetic users.
- Many teams.
- Multiple departments.
- Large portfolios/programs.
- Tens or hundreds of thousands of tasks.
- High listener fan-out.
- Extensive project permissions.
- Heavy Canvas usage.
- Large recovery datasets.

Use bounded scalable simulation when the local Android device cannot execute the full enterprise workload.

Clearly label simulated concurrency and extrapolated results.

Scenario E — Worst-case conditions

Test at least:

- 100 simultaneous edits to one task.
- Numerous viewers of one heavily updated board.
- Multiple concurrent reorders.
- Offline operation for 72 hours.
- Thousands of queued mutations.
- Duplicate operation delivery.
- Lost acknowledgements.
- Multiple device sessions.
- Rapid connect/disconnect cycles.
- Membership revocation during editing.
- Project relocation during active collaboration.
- Organization switching with cached data.
- Crash during synchronization.
- Crash during migration.
- Interrupted recovery.
- Large Canvas modifications.
- Unexpectedly expensive broad queries.
- Repeated failed requests.
- Function retries and duplicate webhook delivery.

Scenario F — Ideal optimized conditions

Test:

- High local cache-hit ratio.
- Narrow scoped queries.
- Stable listeners.
- Incremental writes.
- Coalesced compatible mutations.
- Reused summary projections.
- Minimal presence bandwidth.
- Low reconnect frequency.
- Controlled server-side aggregation.

---

12. BENCHMARK METRICS

Record at least:

Firestore

- Document reads.
- Document writes.
- Document deletes.
- Estimated index-entry reads.
- Security-rule dependent reads.
- Initial query read counts.
- Listener update delivery counts.
- Query result sizes.
- Document sizes.
- Total transferred bytes.
- Transactions and retries.
- Failed operations.
- Duplicate-operation suppression.

Realtime Database

- Session connections.
- Presence updates.
- Approximate downloaded/uploaded bytes.
- Disconnect cleanup behavior.
- Peak concurrent sessions.
- Presence message frequency.

Cloud Functions

- Invocation counts.
- Success/failure rates.
- Execution latency.
- p50/p95/p99 runtime.
- Approximate CPU/memory resource usage.
- Trigger fan-out.
- Retries.
- Duplicate delivery handling.

Client

- Cold workspace opening time.
- Warm-cache opening time.
- Navigation responsiveness.
- Task save latency.
- Time until remote visibility.
- Offline mutation queue length.
- Reconnection recovery time.
- Cache-hit ratio.
- Memory usage.
- CPU usage where measurable.
- UI/JS thread delays.
- Canvas responsiveness.

Data integrity

- Missing updates.
- Overwritten valid changes.
- Duplicate entities.
- Broken references.
- Incorrect permissions.
- Restoration success rate.
- Schema validation failures.

Use consistent measurement methodology.

Report hardware/environment details and whether a measurement came from real execution, a synthetic model, or an extrapolation.

---

13. FIREBASE COST MODEL AND OPTIMIZATION

Create a configurable cost model based on current documented Firebase and Google Cloud pricing.

Do not embed unexplained or permanently hardcoded pricing assumptions.

Support selecting a region and updating price tables.

Track:

- Firestore Standard document reads.
- Firestore writes.
- Firestore deletes.
- Index-entry reads.
- Security-rule reads.
- Listener fan-out.
- Database storage and indexes.
- Outbound transfer.
- Realtime Database storage and bandwidth.
- Cloud Functions invocations.
- Function CPU and memory use.
- Function networking.
- Cloud Build and container storage where applicable.
- Cloud Storage operations and capacity.
- Firebase Hosting traffic.
- App Check provider assessments.
- Secret Manager.
- Cloud Scheduler.
- Event delivery/logging where applicable.
- Firestore managed backups.
- PITR.
- Restores and cloning.
- Enterprise identity charges when applicable.

Separate:

Spark allowances, Blaze free allowances, Blaze usage beyond the free tier, and services billed from first use.

Current Firestore Standard free baseline to model:

- 50,000 reads/day.
- 20,000 writes/day.
- 20,000 deletes/day.
- 1 GiB storage.
- 10 GiB monthly outbound transfer.

These are shared project allowances, not per-organization allowances.

Identify services without free usage allowances, including managed Firestore backup/PITR-related operations.

Use documented Cloud Functions free allowances while separately accounting for other Google Cloud components.

Do not assume free function invocations imply zero total function-related charges.

Cost evaluation

Compare:

1. Naive full-workspace synchronization.
2. Incremental document synchronization.
3. Optimized incremental synchronization plus caching.
4. Optimized synchronization with materialized summaries.
5. High-concurrency collaboration with realistic listeners.

Provide daily and monthly projections for:

- 100 active users.
- 1,000 active users.
- 10,000 active users.
- 100,000 active users.

Include individual users, small teams, and enterprise organizations in the assumptions.

Calculate estimated infrastructure cost per active user, per organization, and per paid seat.

Avoid simplistic assumptions that one user action always equals one billed Firebase operation.

Important measurement honesty

Firebase emulators do not produce actual production bills.

Maintain separate columns for:

- Instrumented local operation counts.
- Estimated production billable operations.
- Published unit prices.
- Assumptions and uncertainties.
- Projected total cost.

Do not represent emulator operation counters as certified Firebase billing measurements.

Provide machine-readable results as JSON/CSV and a readable Markdown summary.

---

14. COST REDUCTION EXPERIMENTS

Run targeted experiments that quantify improvements.

Examples:

- Full snapshot versus record-level synchronization.
- Paginated versus unbounded board queries.
- Cold versus warm local caches.
- Broad versus scoped listeners.
- Presence on Firestore versus Realtime Database.
- Direct dashboard queries versus cached summaries.
- Frequent individual writes versus safe debounced changes.
- Recomputed portfolio dashboards versus incremental aggregations.
- Full Canvas saves versus granular element updates.
- Repeated membership lookups versus safe effective-access projections.

For every comparison, report:

- Baseline operations.
- Optimized operations.
- Percentage reduction.
- Latency difference.
- Memory difference.
- Additional infrastructure or storage cost.
- Correctness implications.
- Security implications.
- Whether the optimization is worth maintaining.

Reject optimizations that save a trivial amount of money while significantly harming consistency, security, or application performance.

---

15. SECURITY AND ADVERSARIAL TESTING

Implement a comprehensive automated security suite.

Test:

- Signed-out access.
- Unauthorized organization access.
- Cross-tenant queries.
- Unauthorized project access.
- Forbidden Canvas access.
- Attempts to edit restricted fields.
- Role self-promotion.
- Forged IAM records.
- Forged billing entitlements.
- Unauthorized invitation acceptance.
- Seat exhaustion races.
- Revoked member still connected.
- Stale cached permissions.
- Unauthorized presence subscription.
- Comment access leakage.
- Unauthorized attachment downloads.
- Unauthorized backup restoration.
- Platform admin attempting unapproved customer-content access.
- Organization admin attempting platform operations.
- Replayed billing webhooks.
- Oversized payloads.
- Malformed mutations.
- Transaction race conditions.

Use emulator-backed Security Rules tests wherever supported.

Never weaken rules merely to eliminate a failing test.

Document any emulator behavior that differs from production.

---

16. SCHEMA MIGRATION AND REGRESSION PROTECTION

The cloud layer must not destroy existing Milvayo workspaces.

Create a reversible migration strategy from the actual v0.8.3 local data format.

Requirements:

- Preserve existing project/task identifiers where possible.
- Preserve relationships.
- Preserve local backup compatibility.
- Preserve Canvas records.
- Preserve comments and history.
- Handle missing/legacy optional fields.
- Use schema versions independently of application versions.
- Prevent duplicate imports.
- Support resumable migrations.
- Detect partial imports.
- Validate after migration.
- Keep an untouched recoverable source copy.

Do not equate an old schemaVersion field with the current application release version.

Run the complete existing regression suite after every substantial integration milestone.

Protect Kanban ordering, timelines, task dependencies, sprint logic, release verification, and Canvas.

Do not introduce slow global state updates that degrade Android performance.

---

17. IMPLEMENTATION ORDER

Execute in the following sequence.

Phase 0 — Audit

Inspect v0.8.3, record baseline, establish safe branch/worktree, inventory models.

Phase 1 — Local Infrastructure

Configure Firebase CLI, emulators, rules, test accounts, and deterministic fixtures.

Phase 2 — Data Model

Implement tenant-aware schema, repositories, entity validation, and indexes.

Phase 3 — IAM

Implement organization membership, resource permissions, security rules, and adversarial testing.

Phase 4 — Synchronization

Implement durable mutation queue, incremental sync, revision control, offline recovery, and conflict handling.

Phase 5 — Caching

Implement local caching, cloud read models, invalidation, and cache measurements.

Phase 6 — Canvas and Collaboration

Integrate Canvas synchronization, Realtime Database presence, comments, watchers, and live editing state.

Phase 7 — Administration

Implement platform and organization administration dashboards, local subscription simulation, IAM interfaces, and usage monitoring.

Phase 8 — Recovery

Implement revision history, soft deletion, recoverable exports, restore previews, and restoration testing.

Phase 9 — Performance Engineering

Run small, medium, large, ideal, and worst-case simulations.

Phase 10 — Optimization and Reporting

Improve observed bottlenecks, rerun benchmarks, document measured effects, and produce the deployment-readiness assessment.

Each phase must be tested before moving to the next.

Continue automatically when the next phase is safe and sufficiently specified.

If a major architectural conflict is discovered, document the issue, investigate alternatives, and select the safest compatible approach rather than silently breaking existing behavior.

Do not stop after Phase 0 or present a document as if it were a completed implementation.

---

18. REQUIRED OUTPUT FILES

Organize documentation under "docs/cloud/" and implementation/tests in locations consistent with the existing repository.

Produce:

- "00-current-architecture-v0.8.3.md"
- "01-cloud-architecture.md"
- "02-database-schema.md"
- "03-iam-permission-matrix.md"
- "04-sync-engine.md"
- "05-caching-strategy.md"
- "06-canvas-collaboration.md"
- "07-administration-and-billing.md"
- "08-backup-and-recovery.md"
- "09-security-test-report.md"
- "10-performance-benchmarks.md"
- "11-firebase-cost-model.md"
- "12-risk-register.md"
- "13-deployment-readiness.md"
- "CHG-MILVAYO-CLOUD-v0.8.3.md"

Actual implementation file locations should follow the existing repository conventions.

Also provide reproducible commands or npm scripts for:

- Starting local emulators.
- Seeding synthetic organizations.
- Running Security Rules tests.
- Running sync and conflict tests.
- Running complete integration tests.
- Running Canvas benchmarks.
- Running performance scenarios.
- Generating cost simulations.
- Exporting local emulator test data.
- Running local recovery tests.
- Starting the administration dashboard.

Avoid requiring manually repeated complex command sequences.

---

19. DEFINITION OF DONE

The task is successful only when:

1. The current Milvayo v0.8.3 application is preserved.
2. Local Firebase emulators are configured and demonstrably running, or exact environment limitations are documented.
3. Multi-tenant Firestore models and repositories work.
4. Organization and project permissions are enforced.
5. Cross-tenant security tests pass.
6. Validated incremental synchronization works.
7. Offline edits can be reconciled.
8. Data conflicts are detected or correctly merged.
9. Local caching and shared read models demonstrate measurable behavior.
10. Canvas is protected and integrated appropriately.
11. Presence and collaboration work under the intended security boundaries.
12. Administration dashboards use actual authorized backend operations.
13. Seats and subscriptions can be simulated safely.
14. Data can be backed up and restored locally.
15. Failure tests and adverse scenarios run.
16. Performance metrics are reproducible.
17. Cost projections distinguish assumptions from measured data.
18. Existing regression tests pass.
19. No real Firebase resources have been modified.
20. No production deployment has occurred.

Do not claim an item is complete unless it has been verified.

For incomplete items, provide the reason, evidence, and exact remaining work.

---

20. FINAL REPORT TO ME

When implementation and testing conclude, provide:

A. Architecture delivered

What was built, which files changed, and how the components interact.

B. Security results

Permissions tested, vulnerabilities found, vulnerabilities corrected, and remaining risks.

C. Synchronization effectiveness

Offline reliability, concurrency handling, conflict resolution, duplicate prevention, and data integrity.

D. Performance comparisons

Before/after tables for Firestore reads/writes/deletes, caching efficiency, network bandwidth, latency, and memory.

E. Cost comparison

Spark and Blaze estimates for the defined workload scenarios, including services that are charged from first use.

F. Regression report

Existing tests plus new cloud-specific tests, with pass/fail counts.

G. Operational commands

Exact copyable commands to run the emulators, application, dashboards, benchmarks, and recovery tests.

H. Deployment readiness

What is ready, what still requires a real Firebase project, and which paid services would be activated later.

I. Git changes

Branch name, modified files, uncommitted changes, and suggested commit message.

Do not push or merge.

---

FINAL ENGINEERING DIRECTIVE

Optimize Milvayo for correctness, security, low infrastructure cost, offline resilience, responsive Android performance, and long-term maintainability.

A cheaper architecture that risks losing customer work is unacceptable.

An architecture that synchronizes everything continuously without controlling listener fan-out and query costs is also unacceptable.

Use empirical evidence to choose between competing designs.

Preserve established v0.8.3 functionality.

Build the complete architecture locally first.

Begin with the real repository audit, then implement and test phase by phase.