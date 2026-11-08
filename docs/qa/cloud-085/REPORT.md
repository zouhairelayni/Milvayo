# Milvayo 0.8.5 — implementation and verification

Applied in place on Git `work`, uncommitted. Version 0.8.5; Android/iOS build 95. Existing unrelated handoff/archive changes are preserved. No dependency/Metro/workspace-schema change. No production build, ZIP, Firebase login, deploy, project creation, billing activation, payment, commit, push or merge. The owner requested low device load: Web was tested using offline Expo Metro and headless Chromium; heavy runs were bounded and all task-started runtime processes were stopped afterward.

## Results compared on the same basis

| Metric | v0.8.4 | v0.8.5 | Improvement |
| --- | ---: | ---: | ---: |
| Reads/simple task mutation | 135 reproduced | 6 | 95.6% fewer |
| Writes/simple mutation, steady | 6 | 5 | 16.7% fewer |
| First imported-revision writes | 7 | 6 | 14.3% fewer |
| Common save p50, comparable host runs | 155.87 ms / 10 samples | 113.54 ms / 100 samples | 27.2% lower |
| Warm unchanged synchronization reads | 3 | 3 | Unchanged |
| Periodic polling requests/user/day, unchanged-session model | 360 | 36 | 90.0% fewer |
| Total modeled requests including commits/reconciliation/messages | 423 | 99 | 76.6% fewer |
| Journal resident storage/1,000 edits | 3,527,018 bytes | 1,793,141 bytes | 49.2% fewer |
| Journal bytes written/1,000 edits | 886,530,500 | 42,817,377 | 95.2% fewer |
| Journal append/1,000 edits, same host fixture | 7.72 s | 2.37 s | 69.3% lower |
| Monthly known subtotal, 1,000 users | $264.84 | $79.91 | 69.8% lower, modeled |

Historical cloud-084 save p50 was 284.5 ms over only eight saves, with 566.8 ms observed upper sample. New p95 is 504.84 ms and p99 is 738.95 ms: the tail did not improve against that small historical sample. Host load differed and these are emulator timings, not production network latency, physical Android frames or certified bills. Mutation counts cover the trusted commit request; an immediate reconciliation additionally needs three fresh reads after a safe contiguous acknowledgment, more when unseen collaboration changes remain. Custom values add one fresh configuration read to the six-read mutation.

## Answers to the handoff

1. **Why 135 reads?** The old transaction scanned 129 records in the 100-task/25-object fixture, plus membership, grant, workspace, subscription, receipt and summary. Full normalization/transition validation ran even for a title. [Exact path and validation matrix](mutation-analysis.md).
2. **How many now?** Six for title/description/priority, seven for custom values; one extra immutable-version read for stale bases. Six stays constant at 10/100/200/500/2,000 tasks. Client Firestore prefetches, Rules-dependent reads, listener deliveries and deletes were zero in this HTTP fixture. Structural edits still use canonical project/workspace validation. 10,000 tasks: Not run under the owner's resource constraint.
3. **How many writes?** Five steady: task update, immutable new version, receipt, sequence, audit. The first imported revision also stores its base version. Count/status/Canvas summaries update only when their contribution changes. Full no-op requests retain a receipt without version/summary/sequence churn; unchanged UI Save sends no mutation. Necessary history/idempotency was preserved.
4. **Cost/user decrease?** Under the same mixed workload and regional units, modeled known-subtotal reductions range from 82.3% at 100 users to 65.5% at 100,000. These include post-Save reconciliation and retain conservative full-validation costs for 20% of actions. They assume no savings from consolidation and are incomplete infrastructure estimates, not Firebase bills. [Assumptions/JSON/CSV](cost-and-polling.md).
5. **Does Save work?** Actual offline Expo Web/Chromium passed draft persistence, reload recovery, blur+Save, unchanged repeated Save and advanced-field saving. Durable drafts are independent of Save; domain/local persistence/journal precede delivery and server acknowledgment precedes synchronized status. Checkpoints default to 45 seconds, with 30/45/60-second UI choices. Ten minutes is configurable through the experiment API, not the default. Actual cloud acknowledgment/conflict API is tested in deterministic sessions and backend emulator tests; real two-account cloud UI acceptance is Not run. [Web evidence](task-save-web.json), [save tests](smart-save.md).
6. **How many edits consolidate?** One thousand compatible unsent title edits were consolidated into one logical mutation. The actual bridge example with five title changes, description, two priority changes and deadline also produces one. Absolute dates retain full canonical server validation. Sent operations, comments, approvals, status transitions, reorders and multi-record scheduling boundaries are preserved. No universal count is promised beyond existing request/storage bounds.
7. **Independent collaborative fields?** Known immutable server bases permit independent top-level fields to merge; competing fields conflict. Tests cover malformed bases, stale edits, same-field resolution and retained original intent. Explicit local/remote resolution is revision-checked and idempotent. Deletion conflicts retain work and use authorized recovery. Lost acknowledgments replay identical frozen payloads, including v0.8.4 full-envelope operations.
8. **Sequence contention improved?** Not solved. Two concurrent requests committed but one waited 19.1 seconds. Ten yielded eight acknowledgments/two 90-second timeouts, with nine retries among acknowledged requests. All eight acknowledged updates appeared with unique sequences at the verification snapshot; timed-out eventual receipt state is uncertain. Project/partition alternatives were investigated and retained as unproven designs. No replacement without ordering/recovery proofs; 25/50/100 actors are Not run. [Experiment details](benchmark-results.md).
9. **Polling removed?** In deterministic unchanged-session models: workspace 240→22 and conversation 120→14 periodic requests/day. Including 30 commits, 30 reconciliation requests and three message sends: 423→99 requests/day. Changed/pending work resets delays. Idle foreground visibility bounds are 60 seconds/workspace and 30 seconds/conversation; background checks use 120 seconds. This is not observed real-user traffic.
10. **Canvas still syncs?** Real emulator single-element moves passed at 25/100/500/1,000 objects. Reads remain 44/119/519/1,019 because connector/source/group integrity retains canonical validation. Geometry does not rewrite count summaries. Gesture preview/pan/zoom stays local; no per-gesture cloud writes or Canvas rendering refactor. Native gesture/FPS acceptance is Not run.
11. **Journal faster and safe?** Append CPU/storage work improves as above through immutable chunk reuse. Tests cover every staged write/publication boundary, disk failure, invalid manifests, corruption, legacy migration, Unicode, lost acknowledgments, repeated replay and retained pending work. Current+previous valid generations remain. No silent corrupt→empty fallback or pending LRU eviction. Atomic acknowledgment cursor advancement is restricted to an explicitly newly committed, exactly contiguous sequence; gaps/no-ops/legacy/message acknowledgments do not skip unseen records. Delayed acknowledgments cannot replace newer refreshed records. [Journal evidence](journal.md).
12. **Multi-tab works?** Web Locks enforce one origin-wide local writer before index, workspace or recovery access. A second actual app tab blocks safely while the first still saves. An isolated real two-tab journal test additionally proves close/crash takeover and pending-edit preservation. Simultaneous writing in one browser origin is intentionally unsupported; independent authorized devices still collaborate. Unsupported Web Locks fails closed. [Tab evidence](journal-tabs.json).
13. **Tests?** Baseline: 1,015 Pass, 0 Fail, two emulator checks skipped. Coordinated emulator-backed run: **94 Pass, 0 Fail, 0 skipped**. Final general regression: **1,062 Pass, 0 Fail, two emulator-dependent tests intentionally skipped**; those paths were exercised separately in the coordinated emulator run. Assertions were preserved. The first partial emulator launch failed because Storage Rules lacked a registered Firestore service; that infrastructure attempt is retained separately, then replaced by a coordinated successful suite. No failing assertion is relabeled Pass.
14. **What remains?** Physical Android/Expo Go, Fast Refresh, real multi-device/72-hour offline/background/termination acceptance, real two-account conflict UI, shared-device encryption/retention policy, production Auth/App Check/rate limits/indexes/packaging/billing/backups and complete production pricing. Auth remains memory-only. Raw private pending drafts/journals remain scoped plaintext device data; scoped keys are not encryption. [Threat model and reversible update](privacy-and-readiness.md).
15. **Projected monthly cost?** See the table below; source JSON has all five comparison strategies, per-user amounts, component units and unpriced inputs. Spark availability, Blaze allowances and first-use paid services remain distinct. No billable resource was enabled.

| Active users | v0.8.4 same-basis known subtotal | v0.8.5 combined known subtotal | Reduction |
| ---: | ---: | ---: | ---: |
| 100 | $18.71 | $3.31 | 82.3% |
| 1,000 | $264.84 | $79.91 | 69.8% |
| 10,000 | $2,814.13 | $960.42 | 65.9% |
| 100,000 | $28,307.10 | $9,770.03 | 65.5% |

## Acceptance and next phase

The bounded independent-edit, write reduction, consolidated saving, durable recovery and tested authorization requirements are implemented. Production-like concurrency and broad structural/Canvas read scaling remain unresolved; the no-regression/tail-latency criterion is not established by these host samples. Safe fallbacks are preserved and documented rather than removing business checks to make counts smaller. App Check and real billing remain separate gates.

**Ready for the next local development and owner Termux acceptance phase with the stated limits; not production-ready and not fully mobile-accepted.** A high-concurrency release gate does not pass. Read the reversible v2-journal migration plan before rollback. No checkpoint/merge is authorized by these results.

## Final validation

- Emulator suite: Pass — 94 checks, no skips; all coordinated emulators stopped afterward.
- Actual offline Expo Web + headless Chromium: Pass for the five recorded saving/tab checks; separate two-tab journal takeover: Pass.
- JSX syntax/import/path checks: included in final general tests and focused source runs.
- `EXPO_OFFLINE=1 npx expo install --check`: Pass against available dependency metadata, “Dependencies are up to date”; the CLI warns offline validation cannot verify fresh registry data. No dependencies changed.
- Production build, physical Expo Go and Fast Refresh: Not run. No production build per owner instruction; CI Metro disables watchers.
- Final `npm test`: **Pass — 1,062 passed, 0 failed, 2 intentional emulator skips**, 110.48 seconds. Complete output: `final-tests.txt`.

Final-regression correction record: the first general run reported 1,058 Pass / 4 Fail / 2 skipped. One source assertion still counted only the two original guarded flush paths; it now also verifies writer-lock cleanup, draft persistence and cloud flush guards. The old title test required the former lazy Input syntax; it now verifies real durable staging, restart recovery and one combined commit while retaining shared lazy-input tests. Async description/duplicate tests await Save and keep the original rejection/cancellation/zero-write/close assertions. Their no-controller description fallback was corrected to preserve its buffered draft until Save. Focused corrected checks passed before the complete rerun; first output is retained in `final-tests-first-attempt.txt`.
