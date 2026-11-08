# Task mutation investigation and validation matrix

Source: actual v0.8.4 on `work`, reproduced before editing the service. `baseline-tests.txt`: 1,015 Pass, 0 Fail, 2 emulator checks Not run in the general runner. Historical evidence under cloud-084 is unchanged. New work uses only demo-milvayo-083. No production build, Firebase login, deploy, commit, push, billing activation or workspace schema migration.

## Why 135 reads

The 100-task / 25-object fixture contains 129 canonical project records. v0.8.4 queried all 129 for every field change, unpacked/normalized/repacked the project, validated transitions and read its summary even for a title change. The remaining reads were membership, grant, workspace, subscription, receipt and summary: 129 + 3 + 1 + 1 + 1 = 135. The first edit wrote the task, its imported base version and new version, receipt, sequence, audit and summary (7); subsequent edits omitted the base version (6). Its response counters omitted extra stale-base version lookups; new counters include them.

`baseline-reproduction.json` contains ten actual HTTP saves with 135 reads each, 7 then 6 writes. `benchmarks.json` has 100 optimized saves and bounded task/Canvas/concurrency/cache runs. These are instrumented backend operations, not certified production bills.

## Complete save path

| Stage | Behavior / operations |
| --- | --- |
| Local typing | Scoped sidecar draft persisted independently of Save; no client Firestore fetch/write |
| Local commit | Existing store normalization, model validation, bridge reconciliation and audit activity; no schemaVersion change |
| Journal | Accepted domain transaction persisted to a checksum-protected generation before network delivery |
| Consolidation | Compatible unsent task edits consolidated; already sent or structural operations keep their boundaries |
| Request | First wire payload fixed durably with mutation ID; compact independent-field patches omit unrelated task data |
| Authentication | Existing HTTP bearer token verification; no client Firestore prefetch |
| Authorization | Fresh organization membership and grant (2 transaction document reads), workspace state/sequence (1), subscription seat (1) |
| Idempotency | Receipt lookup (1); replays recheck permissions and write nothing |
| Task/revision | Current task (1); stale bases additionally read immutable known version (1) |
| Class A validation | Exact task normalization/allowed fields; custom values additionally read current project configuration (1) |
| Persistence | Task update (1), new version (1), receipt (1), workspace sequence (1), audit (1); first imported revision also retains base version (1) |
| Summary | Read/write only when task count, status counts or Canvas-object count changes |
| Response | Server revision/sequence and authoritative records acknowledged; journal removes pending operation durably |
| Reconciliation | Existing authorized incremental pull overlays pending edits and validates complete local candidate before applying |

Thus common title/description/priority edits use **6 reads and 5 writes**, or **6 writes on the first imported revision**. Custom values need 7 reads. No task deletes or full project scan. Fresh security checks and durable receipts/history remain necessary; the requested five-read target was not reached safely. No-op requests create only a receipt, without version/sequence/summary/audit churn; unchanged editor Save produces no mutation at all.

`readBreakdown` partitions transaction reads by authorization, sequence, subscription, receipt, task/project records, immutable versions, configuration and summaries. `transactionAttempts`, `transactionRetries` and `allAttemptsDocumentReads` distinguish retried callbacks. Index reads, billed minimum queries, production network, listener reconnects, Auth infrastructure and production rules costs are not inferred from these counters. All document access on this path uses trusted Admin SDK transactions; client SDK reads, Rules-dependent reads and listener deliveries are zero for this measured path. Other SDK/direct-query paths remain subject to their own Rules and billing.

## Validation classes

| Class | Current validator / reason |
| --- | --- |
| A independent | Existing task only; title, description, priority, customValues, updatedAt, and false-only verified/merged resets; identical envelope/order; exact defaultTask normalization; fresh task schema for custom values |
| B membership/workflow | Canonical project validation retained for assignments/status/type/board/list changes; existing resource semantics and workflow/approval/dependency guards unchanged |
| C structural | Canonical affected-project/workspace validator retained for parent, dependencies, schedules and cross-project remove/add; safe subgraph equivalence is not established |
| D complex | Canonical atomic validation for sprint/release/verification/automation/bulk/Canvas groups/restoration |
| E destructive | Canonical validation, scoped delete/restore permission, immutable history, tombstones and audit |

Classification is checked again against the stored current task after stale-field merging; client envelopes/bases are never trusted. Unsupported patches fail closed, and full-envelope clients remain compatible. Differential tests compare supported A inputs against the existing canonical validator and transition validator, including malformed fields, limits, custom types and tasks with parents/dependencies. Automated service regressions assert six point reads at 10/100/500/2,000 tasks, rollback on forged inputs, independent stale merges, same-field conflicts and permission-checked receipt replay. Broader structural optimization remains a deliberate correctness tradeoff, not an implemented claim.

## Synchronous metadata decision

Task, immutable version, receipt, workspace sequence and audit stay atomic. Moving any asynchronously would weaken acknowledged recovery, idempotency or incremental visibility. Imported revision 1 is lazily retained once. Summary writes are eliminated for unchanged contributions; summary sequence now means the last count/status-changing mutation, not the latest unrelated content edit. Central sequence stays because neither project-vector cursors nor partition completion/recovery proofs exist. No query/cache skips authorization. No Rules were loosened, dependencies added or Metro settings changed.

Post-review acknowledgment optimization: the server returns `committedSequence` only for a newly committed record mutation. The journal advances its cursor only when that marker equals the response sequence and exactly follows its current cursor. Gaps, no-ops, legacy receipts and messages never qualify. This avoids a redundant own-record query while retaining three fresh access reads. Tests include the counterexample where a concurrent A+B transaction precedes our receipt-only no-op, plus delayed acknowledgment after a newer refresh. Acknowledged records cannot roll back higher-sequence cache entries.

Consolidation also accepts absolute start/due changes within an otherwise compatible single-task edit chain; the resulting mutation uses full canonical scheduling validation. Reorders and multi-record scheduling stay separate. The actual editor example is verified through bridge/domain code, not just a synthetic title object.
