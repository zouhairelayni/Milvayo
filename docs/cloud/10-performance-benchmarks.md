# Performance and cost experiments

Reproduce with npm run cloud:benchmark while the local emulators are running. Deterministic seed 83. JSON and CSV are in docs/qa/cloud-084. Host is Android ARM64/PRoot, Node 24 and Java 21; timings include host contention and are not Android UI-frame or production-network measurements.

| Scenario | Executed tasks | Canvas objects | Full record-resave writes | Changed records for one task + object edit | Full JSON bytes | Change-payload bytes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Solo | 200 | 25 | 229 | 2 | 139156 | 2521 |
| Small team | 500 | 100 | 604 | 2 | 355213 | 2521 |
| Medium | 2000 | 500 | 2504 | 2 | 1445967 | 2521 |
| Enterprise bounded | 2000 | 1000 | 3004 | 2 | 1573847 | 2521 |

Enterprise profile models 100,000 tasks/1,000 users, but executes a bounded fixture. Concurrency fan-out is an operation model, not actual 1,000-client load. Full workspace JSON exceeds Firestore's document size in large scenarios, so the baseline resaves granular records; it is not presented as a viable giant-document design.

Measured emulator fixture (100 tasks, 25 Canvas objects): cold pull 132 reads / 97,653 bytes; warm unchanged pull 3 reads / 2 content bytes; cached hydration 3 reads / same content bytes; summary 4 reads. Eight task saves required 135 instrumented reads each, 7 writes initially then 6, including version/receipt/sequence/summary/audit. Client round-trip p50 284.5 ms, p95/p99 566.8 ms in this small sample. Do not generalize tail percentiles from eight samples.

A simulated 100-contender same-field race accepts one edit and reports 99 conflicts without silent overwrites. A real in-process durable journal stores 1,000 ordered offline edits in 7.64 s, 3.53 MB across retained chunks, largest row 100,000 bytes. Seventy-two-hour offline duration is modeled, not a three-day soak. Actual seat races and concurrent-grant tests use emulator requests.

Experiments retain security/consistency: granular task/Canvas writes reduce payload and resave volume; warm content caching reduces database reads; authorized summaries reduce dashboard reads. Validation still reads an entire affected project; large-project mutation read cost and sequence contention are unresolved scaling limits. Server hot caches never cache authorization. No paid Redis/Memorystore dependency is justified. CPU/heap and serialization/diff samples are included in JSON, not invented as device FPS or guaranteed memory savings.
