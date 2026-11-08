# Bounded emulator measurements

Pass: `node src/cloud/tools/benchmark085.cjs` completed actual local Auth/HTTP/Firestore work. No build or deployment. The owner requested low device load; 10,000 tasks and 25/50/100 concurrent operations were not run. Future harness runs stop increasing concurrency when a smaller run exceeds five seconds or reports errors. Historical 084 results remain intact.

The host is Android ARM64/PRoot with Node 24.21.0. Timings include emulator, HTTP and concurrent Metro compilation load. They are not production latency, physical Android FPS, Cloud Functions billing duration, or certified operation bills.

| Metric | v0.8.4 historical | v0.8.5 measured |
| --- | ---: | ---: |
| Simple task save reads | 135 | 6 |
| Steady simple task save writes | 6 | 5 |
| Initial imported revision save writes | 7 | 6 |
| Save p50 | 284.5 ms / 8 samples | 113.54 ms / 100 samples |
| Save p95 | 566.8 ms / 8 samples | 504.84 ms / 100 samples |
| Save p99 | 566.8 ms / 8 samples | 738.95 ms / 100 samples |
| Warm pull reads | 3 | 3 |
| Cold pull reads | 132 | 132 |
| Cached hydration reads | 3 | 3 |
| Summary reads | 4 | 4 |

A same-session pre-patch reproduction (`baseline-reproduction.json`) also measured 135 reads, seven initial/six steady writes over ten saves. Its p50 was 155.87 ms; v0.8.5 p50 improved by 27.2% against that closer comparison. Tail estimates from the earlier eight/ten samples remain weak, and the new p99 is slower than the earlier observed upper sample. Do not describe this as a universal latency improvement.

Independent title mutations used exactly six server transaction reads at 10, 100, 200, 500 and 2,000 tasks: two fresh authorization records, workspace sequence, subscription/seat, idempotency receipt and target task. No full-project scan. Custom-value edits additionally read project configuration. Initial imported revision recovery accounts for the extra initial version write. Client SDK reads, listener deliveries, direct-client rules-dependent reads and deletes were zero in this HTTP mutation fixture. Server Admin SDK reads do not invoke client Security Rules. Network payload and draft consolidation are verified separately by task/session tests.

The cached 100-task/25-object fixture returned cold 97,653 content bytes in 105.70 ms, unchanged warm two content bytes in 39.71 ms, and hot cached content in 43.68 ms. One of these three content requests hit the response cache; this deliberately small probe is not a workload cache-hit ratio. All still read three fresh access/sequence records. A previously authorized viewer was warmed, revoked, then denied hydration with HTTP403. This proves tested revocation invalidation, not a production cache security certification.

## Canvas

One committed element move still uses the canonical validator; local gesture preview/pan/zoom remain independent of network and no per-gesture-preview writes were introduced. At 25/100/500/1,000 objects (ten tasks each), measured reads were 44/119/519/1,019 and first-revision writes were six. Round trips were 101.76/97.59/202.76/283.70 ms. The summary write is avoided because geometry does not change counts/status. This verifies synchronization at the existing 1,000-object limit, but broad structural validation remains a scaling cost; no claim of bounded Canvas validation reads.

## Central sequence contention

Two genuinely concurrent requests both committed, with unique sequences and a pull containing both updates. Latencies were 390.43 ms and 19,138.94 ms: Firestore lock waiting can dominate even without a transaction callback retry. Throughput was 0.104 acknowledged commits/second in this tiny pessimistic-lock experiment.

Ten concurrent requests hit host/emulator capacity: eight acknowledged commits and two client HTTP timeouts at 90 seconds. Acknowledged-save p50/p95/p99 were 46,141/62,655/62,655 ms, with 17 transaction attempts across those eight responses (nine callback retries). A later pull contained all eight acknowledged changes with unique contiguous sequences. Timeouts are uncertain delivery, not proof of rejected or lost work; receipt replay remains necessary. Failed-request backend reads/writes were not measured and cannot be counted as zero. Each acknowledged mutation's successful transaction used six reads and six first-revision writes; retries add work. This failed latency/capacity gate is explicitly retained as a limitation.

Central sequencing is retained. Project-scoped counters require vector cursors, access resets and safe cross-project moves; partitioned journals additionally require commit-complete markers and interrupted-commit recovery. Neither alternative has demonstrated the existing no-missed-change/atomicity guarantees here, so neither is installed merely on a synthetic throughput claim. Sequence contention has **not** been solved. Multi-actor production readiness is not established.

JSON contains samples, categories, errors and operation counts; CSV contains scaling rows. Smart Save, journal, browser, IAM and offline tests have separate evidence. Physical Expo Go and production-only services remain Not run.
