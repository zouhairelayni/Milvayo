# MILVAYO — RTDB Presence v4: Final Termux Emulator Verification

- **Verification date:** 18 November 2026
- **Application:** Milvayo 0.8.10 (version not bumped by these patches)
- **Repository / branch:** `~/Milvayo` / `work`
- **Environment:** Android Termux; Firebase local emulators using project ID `demo-milvayo-083`
- **Patches:** `Milvayo_v4_presence_wiring.zip` and `Milvayo_v4_structure_fix.zip`; Carol fixture and benchmark headers were also corrected on-device.
- **Evidence:** Actual terminal outputs supplied by the owner in this conversation. Full device-side JSON and log files were *not* independently uploaded here.
- **Units:** decimal **kB** (1,000 bytes), **MB** (1,000,000 bytes). “Payload” means serialized SDK callback data **not** measured wire traffic, download billing, or estimated Firebase charges.

## Executive verdict

**PASS — Firebase v4 Gate 2 presence emulator verification, including the 150-second heartbeat stress window.**

- Application tests: **1,139 passed, 0 failed, 11 skipped** (`1,150` total; exit success).
- Focused presence/session unit tests: **26/26 passed**.
- Full Firebase Cloud emulator tests: **219/219 passed**, after fixing test-fixture contamination.
- Five-client authenticated RTDB benchmark (80 s idle): **PASS**, 0 listener errors.
- Thirty-client authenticated RTDB benchmark (80 s idle): **PASS**, 0 listener errors.
- Thirty-client authenticated RTDB benchmark (**150 s idle**): **PASS**; exactly **30 heartbeat writes**, **900 presence events / 102.60 kB** during the idle phase, all clients receiving the task-change signal, and 0 listener errors.

The **matched 30-client 80-second before/after emulator scenario** reduced observed presence callback payload from **15.12 MB to 152.19 kB**, or **approximately 99.0%**. A *separate, longer 150-second after-only run* measured **254.79 kB** across attach + one heartbeat + cleanup. **Do not compare 254.79 kB directly with the older 80-second total**; the idle duration differs.

**Not yet proven:** device-to-device background/reconnect/typing UI, production billing, real network download volumes, deployment, or Gate 3a completion. The tests alone are not production certification.

## 1. Test results in execution order

| Test | Initial result | Fix / subsequent result | Final status |
|---|---|---|---|
| **1. `npm test` application suite** | 1,136 pass / 2 fail / 11 skipped (205.4 s). The two failures came from `folder-structure.test.cjs`. | Applied the structure-fix ZIP plus two benchmark-file path headers. `folder-structure` **6/6** (503 ms). Full `npm test`: **1,139 pass / 0 fail / 11 skipped** (96.6 s). | **PASS** |
| **2. Targeted presence/session tests** | `presence-core`, `presence-client` and `session`: **26 pass / 0 fail** (595 ms). | No behavioral fix required. | **PASS** |
| **3. `npm run test:cloud` emulator tests** | **217 pass / 2 fail**; an extra Carol session remained from an earlier test fixture. | Explicitly removed the fixture session before the next test. Rerun **219 pass / 0 fail** (115.2 s). | **PASS** |
| **4. Five-client RTDB benchmark, 80 s** | 5 authenticated; 4 peers maximum per user; all received change signal; 0 listener errors. | No fix required: attach 25 events / 2.85 kB; idle 0 events / 0 kB / 0 heartbeat writes; cleanup 10 events / 1.14 kB. | **PASS** |
| **5. Thirty-client RTDB benchmark, 80 s** | 30 authenticated; minimum 29 peers seen; all received change signal; 0 listener errors. | No fix required: attach 900 events / 102.60 kB; idle 0 events / 0 kB / 0 heartbeat writes; cleanup 435 events / 49.59 kB. | **PASS** |
| **6. Thirty-client RTDB benchmark, 150 s** | 30 authenticated; minimum 29 peers seen; all received change signal; 0 listener errors. | Attach 900 events / 102.60 kB; **one heartbeat round: 30 writes, 900 events / 102.60 kB**; cleanup 435 events / 49.59 kB. Report status **PASS**, process exit **0**. | **PASS** |

**Clarification on the Cloud first run:** the terminal test summary reported *two* failures. The shown detailed stack trace was from the child-listener assertion; both were resolved after the Carol fixture cleanup. This was a **test isolation defect** rather than evidence of an authorization breach.

## 2. Historic before/after comparisons

### A. Thirty clients, matched 80-second emulator scenario

| Phase | Old callback payload | New callback payload | Reduction | Old → new events |
|---|---:|---:|---:|---:|
| All 30 attach | **2.04 MB** | **102.60 kB** | **95.0%** | 900 → 900 |
| 80 s idle | **11.83 MB** | **0 kB** | **100%** | 2,700 → 0 |
| All disconnect | **1.25 MB** | **49.59 kB** | **96.0%** | 435 → 435 |
| **Matched total** | **15.12 MB** | **152.19 kB** | **99.0%** | 4,035 → 1,335 |

Exact totals: old **15,115,765 bytes**, new **152,190 bytes**. Prior figures are from the earlier *owner-run emulator* results reproduced in the original patch report, not from an invented prediction. The current figures are from the owner's pasted Termux results.

The older report also records **one 30-client heartbeat round** of **3.94 MB** of serialized callbacks versus **102.60 kB** in the new 150-second run: about **97.4% less payload per heartbeat round**. This is a per-round comparison, not a matched total elapsed-time comparison.

### B. Five clients, previous vs new

| Phase | Earlier emulator results | New emulator results | Context |
|---|---:|---:|---|
| Attach | **10.98 kB**, 25 events | **2.85 kB**, 25 events | ~**74.0%** smaller payload |
| Idle | **18.28 kB**, 25 events in **28 s** | **0 kB**, 0 events in **80 s** | Idle durations differ; avoid treating as matched rate |
| Task edit change signal | 5 events / **0.22 kB** | 5 events / **0.22 kB** | Delivery preserved |
| Cleanup | No directly comparable old figure | 10 events / **1.14 kB** | No defensible percent comparison |

### C. Earlier application and Cloud suites

| Suite | Prior owner baseline | After both patches and on-device test fix | Reading |
|---|---|---|---|
| `npm test` | 1,122 pass / 0 fail / 8 skipped | **1,139 pass / 0 fail / 11 skipped** | Full suite green; test count/scope changed |
| `npm run test:cloud` | 191 pass / 0 fail | **219 pass / 0 fail** | 28 more passing assertions in current suite; counts are not a controlled code A/B test |
| Folder structure | Previously failed two assertions in this patch series | **6 pass / 0 fail** | Headers and scanner fixed |

## 3. New 150-second benchmark: full breakdown

**Command:**

```bash
cd ~/Milvayo
MILVAYO_CLIENTS=30 \
MILVAYO_IDLE_MS=150000 \
BENCH_OUT="$HOME/rtdb-after-30-150s.json" \
JAVA_TOOL_OPTIONS="-Xms32m -Xmx192m -XX:ActiveProcessorCount=2" \
firebase emulators:exec \
  --only auth,firestore,database,functions,storage,hosting \
  --project demo-milvayo-083 \
  "node tests/helpers/bench-v4-client-rtdb-scale.cjs" \
  > ~/rtdb-after-30-150s.log 2>&1
```

| Phase | Presence events | Presence callback payload | Database sets | Database removals |
|---|---:|---:|---:|---:|
| Thirty clients attach | 900 | **102.60 kB** | 30 | 0 |
| 150 s idle, including one heartbeat | 900 | **102.60 kB** | 30 | 0 |
| One task edit | 0 presence events; **30 separate head events** | 0 presence kB; head payload **1.32 kB** | 0 | 0 |
| All clients leave | 435 | **49.59 kB** | 0 | 30 |
| **Presence total (listed phases)** | **2,235** | **254.79 kB (0.255 MB)** | **60** | **30** |

The summary's **2,415 events** includes event categories beyond these **2,235 presence events**; do not mislabel total SDK callbacks as presence callbacks. The harness reports **210 opened listeners** as an aggregated metric; it does not necessarily mean 210 simultaneously live listeners at the end of the test.

**Verified by JSON:** `status=PASS`, `authenticated=30`, `minimumPeersSeen=29`, `heartbeatWrites=30`, `changeReceivedByAll=true`, `listenerErrors=0`, `idleHeartbeatsPerClient=1`, and `idleBytesPerClientPerMinute=1368`, i.e. **1.37 kB per client per minute**, averaged across the entire **150-second idle phase**. Each client received approximately **3.42 kB** of callback payload from the *single heartbeat round* (102.6 kB / 30 clients).

At 150 seconds the 120-second heartbeat did fire. The 80-second run's zero idle events was therefore not caused by the heartbeat being permanently broken. The 30 clients remained mutually visible according to the harness verification.

## 4. Implementation changes responsible for the improvement

1. **Screen/resource-scoped presence rooms:** deterministic 22-character URL-safe resource keys under the appropriate org/workspace/project path ensure users subscribe only to relevant resource peers, instead of a single broad project room.
2. **`child_added`, `child_changed`, `child_removed` events:** one changed user/session is propagated incrementally instead of re-sending the entire room on each change. The room state is maintained locally.
3. **120-second heartbeat** instead of the former ~25-second cadence. Entry TTL is 300 seconds; database rules allow up to 330 seconds, leaving time to recover from a missed heartbeat. The local expiry sweep runs separately without routine RTDB writes.
4. **In-place presence state changes:** typing/editing status updates the existing session; hiding/leaving removes its entry; reopening republishes it; `onDisconnect().remove()` remains for unexpected disconnects.
5. **Shared clock offset and fewer redundant authorizations:** sessions share one clock-offset subscription per client; session authentication checks are skipped while sufficiently fresh.
6. **Rules and tests updated:** enforced new 22-character room key and 330-second maximum, rejected old presence shape, retained authorization checks, and updated client harnesses to count individual child-event payloads.

The **event count for a shared group is still approximately quadratic** in the number of listeners and participants: 30 clients generated **900 callbacks** for attach and **900 for one heartbeat round**. The improvements are smaller **per-event** payload, fewer heartbeat rounds, and narrower recipient sets, **not** constant event count.

## 5. Failures found and exactly how they were fixed

### A. Carol session fixture leak in the Cloud rules test

An earlier `access is checked per project` test created Carol's presence node at a random UUID session path and did not delete it. Later the `child listeners deliver only the person who changed` test expected only Carol's `c1` session but received `c1` **plus** that UUID, violating the assertion.

**Fix:** store Carol's generated path in `carolPath`, set at that path, and explicitly remove it at the end of the earlier authorized-read scenario. **Only the test fixture changed.** The original `Milvayo_v4_presence_wiring.zip` did not contain this fix; ensure the current on-device correction or Claude's follow-up `Milvayo_v4_presence_fixes.zip` is retained in any future consolidated release artifact. **Emulator rerun: 219/219 PASS**.

### B. Two application structure test failures

- Nine files lacked the repository-mandated first-line `// /path` comment: seven I/O audit files and the two new RTDB benchmark scripts.
- The import scanner falsely treated `require('./service.cjs')` and `require('./ioAudit.cjs')` text inside **quoted strings** in `scripts/patch-io-audit.cjs` as direct imports.

**Fix:** applied `Milvayo_v4_structure_fix.zip` (seven path headers and scanner fix with regression coverage), and added path headers to both benchmark scripts on-device. The scanner continues to inspect real imports. The structure suite then passed **6/6**. Claude's sandbox install/remove check restored `src/cloud/server/index.cjs` byte-for-byte; that behavior was reported by Claude, **not independently reproduced in the user's posted Termux output**. Full application suite then passed **1,139/1,139 executed, 11 skipped**.

### C. Audit-work protection

Initial presence patch changed ten existing files and added five new ones. Before extraction the owner retained the backup:

`~/Milvayo-v4-prepatch-20261118-162939`

The later structure patch used a second backup and guarded against unrelated changes in I/O audit files. Existing uncommitted work was not intentionally discarded. No commit, push, Firebase deploy, or production migration was part of this session.

## 6. Device-side evidence paths

- `~/milvayo-v4-app-tests.log` — initial application failures (older run)
- Updated `npm test` output — **1,139 pass, 0 fail, 11 skipped** (terminal output supplied, file path not specified)
- `~/milvayo-v4-presence-unit.log` — 26/26
- `~/milvayo-v4-cloud-tests.log` — first Cloud failure
- `~/milvayo-v4-cloud-rerun.log` — 219/219
- `~/rtdb-after-5.json`, `~/rtdb-after-5.md`, `~/rtdb-after-5.log`
- `~/rtdb-after-30.json`, `~/rtdb-after-30.md`, `~/rtdb-after-30.log`
- `~/rtdb-after-30-150s.json`, `~/rtdb-after-30-150s.md`, `~/rtdb-after-30-150s.log`

These files are reported as **on the owner's Android device**, not embedded in this Markdown handoff. The numeric results above were taken from the pasted Termux outputs.

## 7. Outstanding acceptance and Gate 3a work

- **Real Android UI, at least two devices/accounts:** visible typing/editing, moving between different resources, background/foreground, offline/reconnect, crash recovery, revoked membership.
- **Actual transferred/billable bandwidth:** emulator SDK callback sizes are not the network or Firebase billing meter. Validate using production usage monitoring before making financial estimates.
- **Gate 3a change feed:** the measured *existing* RTDB head signal reaches all clients; this does **not** prove the future scoped `pullV4` change feed or its intended S1–S7 spikes are finished.
- **Housekeeping:** bring Carol's fixture cleanup and both benchmark headers into the permanent release artifact, reconcile `docs/qa/cloud-v4/CHANGELOG-ENTRIES.md`, preserve other I/O audit work and the `work` branch policy.
- **Other Cloud v4 work:** remaining N-read paths, legacy retirement, disaster recovery, security/index review.

**Bottom line for Claude:** All requested on-device **application, unit, Cloud emulator, 5-client, 30-client 80-second, and 30-client 150-second tests now pass**. The two-minute heartbeat has been measured and works in the emulator. The matched 30-client 80-second experiment shows about **99% less serialized callback data**, while the separate 150-second run shows exactly **one heartbeat per client with 102.60 kB of callback data for that round**. Mark presence **emulator-verified**, not production-certified, and proceed to Gate 3a planning only after preserving these fixes and outstanding acceptance checks.
