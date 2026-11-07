# Firebase local integration QA — build 0.8.4

User-designated baseline: 0.8.3. Target: 0.8.4 / Android and iOS build 94. The starting working tree already contained the 0.8.4 Web chart correction. Cloud work preserves that change. Date: 2026-11-07. Branch: `work`. Delivery is in place. The owner subsequently authorized staging and a local v0.8.4 commit on `work`; no ZIP, push, merge, Firebase login, billing activation or deployment.

## A. Architecture delivered

An optional, emulator-only cloud adapter surrounds the existing local-first store. Valid domain transactions remain optimistic local work; a scoped, checksum-protected sharded journal preserves each transaction before delivery. Trusted HTTP Functions validate Auth, active organization membership, resource grants, licenses and canonical/domain invariants. Granular Firestore records, revisions, receipts, summaries and soft-deletion tombstones support reconciliation. RTDB handles ephemeral viewing/editing/typing sessions; durable messages/watchers/notifications are independently authorized. Existing Canvas geometry, gestures, undo/redo, Timeline rules, imports, local backups and Metro configuration are preserved.

Settings supplies connection/admin/platform/recovery tools using existing themed controls. Collaboration supplies authenticated project/task discussions. Teams/departments do not imply content access. Seats count unique people across resource allocations. Billing is signed local simulation. Complete cloud recovery stages records, tombstones and collaboration archives into a fresh workspace and activates only after validation. Source history remains available in the original workspace and emulator export.

Entry points: `src/cloud/session.cjs`, `journal.cjs`, `schema.cjs`, `server/service.cjs`, `server/collaboration.cjs`, `server/administration.cjs`; `src/screens/workspace/CloudPanel.js` and `src/screens/management/CloudDiscussion.js`. Full inventory: [task-files.txt](task-files.txt). Architecture and exact remaining work: [cloud documentation](../../cloud/13-deployment-readiness.md).

## B. Security results

**Pass:** 51 cloud checks, including actual HTTP/Auth and Firestore/RTDB/Storage rule evaluation. Tests cover cross-tenant reads/writes, nested role/entitlement forgery, project denies, platform/customer separation, invitation theft/replay, unique-seat/resource-cap races, guest license boundaries, group membership, last-owner protection, unauthorized watchers/mentions, private notifications, revocation, duplicate messages/mutations, invalid domain changes and atomic recovery failure.

Corrected observed defects include stale grant/ACL ordering, cached revoked projects, Android journal row/surrogate boundaries, coalesced logical edits, credential initialization, a worker-telemetry response collision, and loss of tombstones during staged recovery. Final direct-SDK checks closed saved receipt reads and confidential shared hierarchy access after a project deny. Expected denied-request diagnostics in emulator logs are test evidence, not failing assertions.

Rules use default deny, active membership, scoped grants and server-only durable writes. Prototype rules require review before broad sharing. No production security certification. Residual risks include App Check/rate limiting, shared-device cache confidentiality, same-origin multiple writers, production indexes/packaging, real auth providers, Storage token lifecycle and audited temporary support access. Dependency audit: **0 high/critical, 9 moderate**, in Expo/Google tooling transitive chains. Compatible fflate and gRPC security patches were applied; no incompatible force-fix or Expo downgrade.

## C. Synchronization and integrity

**Pass:** durable ordered edits and messages survive restart/lost acknowledgement with the same mutation ID; replay has one effect. Independent top-level fields merge against immutable known server bases. Competing text/arrays/reorders/deletions conflict and retain intent for explicit recovery. Canonical references, dependencies, evidence/release gates and completed sprint history remain protected. Server sequences determine order.

Borrowed cloud views restore their untouched local source on disconnect, revocation, workspace switch and crash recovery. Account/org/workspace keys partition caches and journals; administrative panels remount when identity/role/grants change. Auth is memory-only and sign-in is required again after restart. A previously borrowed cloud view cannot be reopened offline without that sign-in. The conflict editor, real multi-device soak and a physical 72-hour offline run remain unverified/unimplemented as identified in readiness.

Staged recovery was tested with more than 100 canonical records plus messages/watchers/notifications, an intentionally incomplete archive, and a deleted task. Incomplete staging stayed hidden; activation preserved tombstones, the original workspace and private grant boundaries. Authorized task restoration recovered access to its retained conversation. Restored notifications are marked read rather than redelivered.

## D. Performance comparisons

Measurements: Android ARM64 PRoot, Node 24.21.0, Java 21.0.13. These are host/emulator results, not device FPS or production billing. [JSON](benchmarks.json) and [CSV](benchmarks.csv) contain source data.

| Measurement | Full/cold path | Incremental/warm path |
| --- | ---: | ---: |
| Synthetic 200-task/25-object record resave | 229 canonical records | 2 changed records for one task + one object |
| Same synthetic payload | 139,156 bytes | 2,521 bytes |
| Real 129-record initial vs unchanged pull | 132 instrumented reads / 97,653 bytes | 3 reads / 2 content bytes |
| Real repeated hydration through cache | 132 cold reads | 3 reads, same 97,653 content bytes |
| Authorized project summary | Full hydration 132 reads | 4 reads |

The record-resave comparison is a modeled cloud baseline; 0.8.3 had no cloud writes. It excludes audit/version overhead on both sides. Actual single-task server saves required **135 instrumented reads**, **7 writes first / 6 subsequent**, and **0 physical deletes**; deletion is a tombstone. Eight round trips: p50 **284.5 ms**, p95/p99 **566.8 ms**. Small-sample tails are not service guarantees. CPU/heap snapshots are in JSON; GC-sensitive heap deltas do not prove memory savings.

A real in-process journal persisted 1,000 ordered edits in **7.64 s**, retaining **3,527,018 bytes**, largest ASCII row **100,000 bytes**. A deterministic 100-contender simulation produced one accepted edit and 99 conflicts; this was not 100 actual connected clients. The enterprise case executes 2,000 tasks/1,000 Canvas objects and extrapolates larger workloads. No claim of 100,000 loaded tasks, 1,000 live clients, physical pan/zoom FPS or a 72-hour soak. Broad project validation and workspace sequence contention remain scaling limits.

## E. Cost comparison

Projected monthly known subtotal in USD, us-central1 price table dated 2026-11-07; **not invoices or measured user behavior**. Columns use identical declared workload assumptions. [Price sources/assumptions](../../cloud/11-firebase-cost-model.md), [complete JSON](cost-projections.json), [CSV](cost-projections.csv).

| Active users | Full record resave | Incremental | Cache | Summaries | High concurrency |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 100 | $98.90 | $19.41 | $18.06 | $17.62 | $18.33 |
| 1,000 | $1,066.24 | $271.36 | $257.86 | $253.40 | $260.56 |
| 10,000 | $10,828.12 | $2,879.32 | $2,744.32 | $2,699.68 | $2,771.32 |
| 100,000 | $108,447.04 | $28,959.04 | $27,609.04 | $27,162.64 | $27,879.04 |

Spark is unavailable for this production Functions architecture; no Blaze upgrade was performed. Blaze allowances are shared per project, not per organization. Backup/PITR/restore/clone are priced from first use. Unselected or unpriced services are explicit inputs; a zero workload is not a claim that those services are free. Polling, broad validation, conversation authorization/fan-out and notification writes are modeled. Real indexes, retries, protocol bandwidth and service selection still need production validation.

## F. Regression and runtime results

| Gate | Result | Evidence |
| --- | --- | --- |
| Starting regression | **Pass: 984** | [baseline-tests.txt](baseline-tests.txt) |
| Final `npm test` | **Pass: 1,015; Fail: 0; Not run: 2 emulator suites** | [full-tests.txt](full-tests.txt) |
| Explicit emulator cloud suite | **Pass: 51; Fail: 0; skipped: 0** | [cloud-tests.txt](cloud-tests.txt) |
| JSX/import/folder/version checks | **Pass** | Included in full suite; [dependency-check.json](dependency-check.json) |
| `npx expo install --check` | **Pass** | [expo-check.txt](expo-check.txt) |
| Actual Metro Web + Auth/functions | **Pass**, 390/1280 px; no horizontal overflow | [web-smoke.json](web-smoke.json), screenshots |
| Web export + service-worker 0.8.4 stamp | **Pass** | [web-export.txt](web-export.txt) |
| Local Hosting HTTP/cache-version check | **Pass** | [hosting-smoke.json](hosting-smoke.json) |
| Normal Metro Fast Refresh | **Not run** | PRoot watch-mode failure; CI smoke disables watching |
| Physical Expo Go / Android / iOS | **Not run** | Requires owner device acceptance |
| Production deploy/IAM/PITR/billing | **Not run** | Outside emulator-only authorization |

Web smoke exercised sign-in, cloud hydration/pull, authorized administration/summaries/structure, separate platform metadata and worker telemetry, durable message acknowledgement, watcher controls, and disconnect restoring the original local workspace. The 390 px screenshot uses the existing desktop layout override; it is not a physical-phone acceptance claim. Existing onboarding SVG warnings remain from the unchanged tour path. No errors were suppressed. A fixed five-second message assertion failed under concurrent host load and was replaced with waiting for acknowledgement; the final smoke passed.

## G. Operational commands

Use the locked dependencies and the existing Termux environment with Node 24.12+, Java 21 and Firebase CLI 15.34.2. No Firebase login.

```sh
npm run emulators
```

In another terminal:

```sh
npm run cloud:seed
npx expo start
```

Settings → Firebase emulator opens connection/admin/recovery; Collaboration → Cloud conversations opens discussions. Explicit seeding prints the synthetic scope and creates only local fixture data. Same-phone host is 127.0.0.1. Private-LAN binding and the public demo account are in the [usage guide](../../instructions/firebase-emulator-084.md).

```sh
npm test
npm run test:cloud:running
npm run cloud:benchmark
npm run cloud:cost
npm run cloud:export
```

`npm run test:cloud` alternatively starts/tests/stops its own suite; stop manual emulators first. Recovery tests are included in the cloud command. Restart an exported suite with `npm run emulators -- --import .emulator-data/<timestamp>`. Export chooses a new directory. Final synthetic emulator export: `.emulator-data/2026-11-07T23-34-46-552Z` (ignored local artifact), verified successful in [emulator-export.txt](emulator-export.txt). Full installation/rollback instructions are in the usage guide.

## H. Readiness and limitations

The implemented local paths pass the recorded gates. The full enterprise/production v1 handoff is **not claimed complete**. Remaining work is explicit in the [readiness matrix](../../cloud/13-deployment-readiness.md): owner Termux/Expo Go/Fast Refresh acceptance; physical concurrency/long-offline/gesture measurements; production packaging/rules/indexes and a separate Milvayo project; real auth, billing and protected backup/PITR; App Check/rate limiting; Storage upload/download lifecycle UI; conflict editor; full enterprise hierarchy/monitoring and same-origin multi-tab writer coordination. No paid infrastructure or production project was activated.

Compatibility: local schemaVersion remains 1. New cloud backup v2 retains a v1 reader; journal keys are separate. A same-version PWA cache may need a service-worker/cache refresh while retaining application storage. No data-clearing or automatic roadmap import.

## I. Git state and reversible delivery

Verification was recorded before the owner-authorized local v0.8.4 checkpoint on `work`. [git-status.txt](git-status.txt) captures the pre-checkpoint working tree; [task-files.txt](task-files.txt) lists cloud-related files. The pre-existing deleted canvas handoff and first-run ZIP, untracked historical ZIP and other Canvas/Firebase handoffs were preserved. They are not cloud deletions or deliverables. Package, lock and app remain version-synchronized at 0.8.4 / 94. Exactly one cumulative changelog is maintained at `docs/changelog/CHANGELOG.md`; no second CHG file or installer is shipped.

Suggested checkpoint message after owner acceptance: `feat(cloud): add emulator-only Firebase integration for 0.8.4`.

Rollback: export compatible local work and pending sync recovery; disconnect to restore borrowed local data; stop task-started services; revert only this cloud patch/package-lock changes, preserving unrelated files and AsyncStorage. Keep the untouched 0.8.3 backup. Do not reset/delete the project or clear data. The owner explicitly authorized this local checkpoint. Physical acceptance remains unverified; no push or main merge is authorized.
